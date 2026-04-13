import { _decorator, CCString, Collider, ERigidBodyType, ICollisionEvent, Material, MeshRenderer, Node, Quat, RigidBody, Texture2D, tween, Tween, Vec3 } from 'cc'; // Thêm import Tween
import { Clickable } from '../Core/Clickable';
import { Goal } from './Goal';
import { BufferItem } from './BufferItem';
import { FloatingItem } from '../FloatingItem';
import { SoundManager } from '../Core/SoundManager';
const { ccclass, property } = _decorator;

export enum FoodState {
    IDLE,
    WAIT,
    MOVING_TO_GOAL,
    MOVING_TO_BUFFER,
    DONE
}

@ccclass('Food')
export class Food extends Clickable {
    @property({ type: CCString })
    public foodId: string = '123'
    @property(Material) public outlineMaterial: Material;
    @property(Node) public shadow: Node;

    public clickFunc: Function;

    @property(RigidBody) public rb: RigidBody
    @property(FloatingItem) public floating: FloatingItem
    @property(MeshRenderer) public renderer: MeshRenderer = null
    public colliders: Collider[] = []

    @property public state: FoodState

    // Giữ reference của tween di chuyển để quản lý chặt chẽ hơn
    private moveTween: Tween<any> = null;


    public getIcon() {
        const node = this.getComponentInChildren(MeshRenderer).node
        return node
    }

    protected start(): void {
        this.rb = this.getComponent(RigidBody)
        this.floating = this.getComponent(FloatingItem)
        this.colliders = this.getComponents(Collider)
        this.renderer = this.getComponentInChildren(MeshRenderer)

        // ĐĂNG KÝ LẮNG NGHE SỰ KIỆN VA CHẠM
        this.colliders.forEach(col => {
            col.on('onCollisionEnter', this.onCollisionEnter, this);
        });
    }

    private maxBounceSpeed: number = 3.5; 

    private onCollisionEnter(event: ICollisionEvent) {
        // Chỉ can thiệp khi Food đang ở trạng thái rảnh rỗi trong nồi và đang bật Vật lý
        if (this.state === FoodState.IDLE && this.rb && this.rb.type === ERigidBodyType.DYNAMIC) {
            
            const velocity = new Vec3();
            this.rb.getLinearVelocity(velocity);

            // Kiểm tra xem nó có đang bị văng đi quá nhanh không (dùng lengthSqr để tối ưu hiệu năng)
            if (velocity.lengthSqr() > this.maxBounceSpeed * this.maxBounceSpeed) {
                
                // 1. Ép vận tốc tổng thể về mức an toàn
                velocity.normalize().multiplyScalar(this.maxBounceSpeed);
                
                // 2. Ép thêm lực nảy lên (trục Y) không được quá cao để tránh rớt ra khỏi nồi
                if (velocity.y > 1) {
                    velocity.y = 1; 
                }

                // Cập nhật lại lực cho RigidBody ngay lập tức
                this.rb.setLinearVelocity(velocity);
            }
        }
    }

    public onClick() {
        if (this.state !== FoodState.IDLE) return
        SoundManager.instance.playOneShot("Click")
        this.clickFunc?.()
    }

    public flyToGoal(goal: Goal, onDone?: Function) {
        if (this.state === FoodState.MOVING_TO_GOAL || this.state === FoodState.DONE) return;

        this.prepareForFlight();
        this.state = FoodState.MOVING_TO_GOAL

        const target = goal.getTargetNode()

        this.jumpTo(target.worldPosition, 4,  0.7, () => {
            goal.count++
            goal.foods.push(this)
            goal.updateUI()
            this.node.setParent(goal.node)
            this.node.setWorldPosition(target.worldPosition)

            if (this.shadow) {
                this.shadow.active = true
            }
            this.state = FoodState.DONE
            onDone?.()
        })
    }

    public flyToBuffer(buffer: BufferItem, onDone?: Function) {
        if (this.state === FoodState.MOVING_TO_BUFFER || this.state === FoodState.DONE) return;

        this.prepareForFlight();
        this.state = FoodState.MOVING_TO_BUFFER

        buffer.food = this
        const target = buffer.spawnPos.worldPosition.clone()

        this.jumpTo(target, 4, 0.7, () => {
            this.node.setParent(buffer.node)
            this.node.setWorldPosition(target)

            if (this.shadow) {
                this.shadow.active = true
            }
            this.state = FoodState.WAIT
            onDone?.()
        })
    }

    // Hàm phụ gom các setting chung trước khi bay để code đỡ lặp
    private prepareForFlight() {
        // 1. NGẮT TẤT CẢ TWEEN HIỆN TẠI TỪ POT (Scale, Move...)
        Tween.stopAllByTarget(this.node);
        if (this.moveTween) this.moveTween.stop();

        // 2. Tắt vật lý và collider
        this.colliders.forEach(col => { col.enabled = false })
        this.rb.type = ERigidBodyType.KINEMATIC
        this.floating.enabled = false

        // 3. Set visual
        this.node.setRotationFromEuler(0, -16, 0)
        this.node.setScale(0.7, 0.7, 0.7)
    }

    jumpTo(targetWorld: Vec3, jumpHeight = 2, duration = 0.5, onDone?: Function) {
        const start = this.node.worldPosition.clone();
        const end = targetWorld;

        const tempPos = new Vec3();
        const tempScale = new Vec3();

        const baseScale = 0.7;
        const peakScaleBonus = 0.2;
        this.shadow.active = false

        // ĐIỂM ĐỈNH (Peak Time): 
        // 0.65 có nghĩa là mất 65% thời gian để bay lên, và 35% thời gian cắm đầu rơi xuống
        const peakTime = 0.65;

        this.moveTween = tween({ t: 0 })
            .to(duration, { t: 1 }, {
                easing: 'linear', // Dùng linear để di chuyển X, Z đều đặn, không bị phanh lại ở cuối
                onUpdate: (obj) => {
                    const t = obj.t;

                    let curveValue = 0;

                    if (t < peakTime) {
                        // 1. GIAI ĐOẠN BAY LÊN
                        const upProgress = t / peakTime; // Chạy từ 0 -> 1
                        // Dùng hàm sin (0 -> PI/2): Bay lên nhanh, chậm dần khi tới đỉnh
                        curveValue = Math.sin(upProgress * Math.PI / 2);
                    } else {
                        // 2. GIAI ĐOẠN RƠI XUỐNG
                        const downProgress = (t - peakTime) / (1 - peakTime); // Chạy từ 0 -> 1
                        // Dùng hàm cos (0 -> PI/2): Ở đỉnh rơi chậm, sau đó gia tốc rơi cực nhanh dần về 0
                        curveValue = Math.cos(downProgress * Math.PI / 2);
                    }

                    // Cập nhật vị trí (Position)
                    Vec3.lerp(tempPos, start, end, t); // Di chuyển ngang (X, Z) đều đặn

                    const height = curveValue * jumpHeight;
                    tempPos.y += height; // Thêm độ cao (Y)
                    this.node.setWorldPosition(tempPos);

                    // Cập nhật kích thước (Scale)
                    const currentScale = baseScale + (curveValue * peakScaleBonus);
                    tempScale.set(currentScale, currentScale, currentScale);
                    this.node.setScale(tempScale);
                }
            })
            .call(() => {
                this.node.setWorldPosition(end);
                this.node.setScale(baseScale, baseScale, baseScale);
                this.moveTween = null;
                this.shadow.active = true

                onDone?.();
            })
            .start();
    }
}