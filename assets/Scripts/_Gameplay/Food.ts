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

        this.jumpTo(target, 4, 0.7, () => {
            goal.count++
            goal.foods.push(this)
            goal.updateUI()
            this.node.setParent(goal.node)
            this.node.setWorldPosition(target.worldPosition)

            if (this.shadow) {
                this.shadow.active = true
            }
            this.state = FoodState.DONE
            this.node.setRotationFromEuler(0, 0, 0)

            onDone?.()
        })
    }

    public flyToBuffer(buffer: BufferItem, onDone?: Function) {
        if (this.state === FoodState.MOVING_TO_BUFFER || this.state === FoodState.DONE) return;

        this.prepareForFlight();
        this.state = FoodState.MOVING_TO_BUFFER

        buffer.food = this
        const target = buffer.spawnPos


        this.jumpTo(target, 4, 0.7, () => {
            this.node.setParent(buffer.node)
            this.node.setWorldPosition(target.worldPosition)

            if (this.shadow) {
                this.shadow.active = true
            }
            this.state = FoodState.WAIT
            this.node.setRotationFromEuler(0, 0, 0)

            onDone?.()
        })
    }

    // Thêm biến để lưu lại tween góc quay
    public rotTween: Tween<any> = null;

    // Hàm phụ gom các setting chung trước khi bay để code đỡ lặp
    private prepareForFlight() {
        // 1. NGẮT TẤT CẢ TWEEN (Bao gồm cả tween lộn vòng từ Pot.ts)
        Tween.stopAllByTarget(this.node);
        if (this.moveTween) this.moveTween.stop();
        if (this.rotTween) this.rotTween.stop();

        // 2. Tắt vật lý và collider
        this.colliders.forEach(col => { col.enabled = false })
        this.rb.type = ERigidBodyType.KINEMATIC
        this.floating.enabled = false

        // 3. Set visual (Xóa dòng setRotationFromEuler ở đây vì mình sẽ cho nó quay mượt về 0,0,0)
        this.node.setScale(0.7, 0.7, 0.7)
    }

    // Thay đổi tham số từ Vec3 thành Node
    jumpTo(targetNode: Node, jumpHeight = 2, duration = 0.5, onDone?: Function) {
        const start = this.node.worldPosition.clone();

        const tempPos = new Vec3();
        const tempScale = new Vec3();

        const baseScale = 0.7;
        const peakScaleBonus = 0.2;
        this.shadow.active = false

        const startEuler = this.node.eulerAngles.clone();
        const targetEulerX = this.getShortestAngle(startEuler.x, 0);
        const targetEulerY = this.getShortestAngle(startEuler.y, 0);
        const targetEulerZ = this.getShortestAngle(startEuler.z, 0);

        const tempEuler = new Vec3();

        const peakTime = 0.65;

        this.moveTween = tween({ t: 0 })
            .to(duration, { t: 1 }, {
                easing: 'linear',
                onUpdate: (obj) => {
                    const t = obj.t;
                    let curveValue = 0;

                    if (t < peakTime) {
                        const upProgress = t / peakTime;
                        curveValue = Math.sin(upProgress * Math.PI / 2);
                    } else {
                        const downProgress = (t - peakTime) / (1 - peakTime);
                        curveValue = Math.cos(downProgress * Math.PI / 2);
                    }

                    // 1. CẬP NHẬT VỊ TRÍ (BÁM ĐUỔI MỤC TIÊU ĐỘNG)
                    // BÍ QUYẾT: Đọc targetNode.worldPosition trực tiếp trong lúc bay
                    const end = targetNode.worldPosition;
                    Vec3.lerp(tempPos, start, end, t);

                    const height = curveValue * jumpHeight;
                    tempPos.y += height;
                    this.node.setWorldPosition(tempPos);

                    // 2. Cập nhật kích thước
                    const currentScale = baseScale + (curveValue * peakScaleBonus);
                    tempScale.set(currentScale, currentScale, currentScale);
                    this.node.setScale(tempScale);

                    // 3. QUAY MƯỢT VỀ (0,0,0) BẰNG EULER
                    tempEuler.x = this.lerpAngle(startEuler.x, targetEulerX, t);
                    tempEuler.y = this.lerpAngle(startEuler.y, targetEulerY, t);
                    tempEuler.z = this.lerpAngle(startEuler.z, targetEulerZ, t);

                    this.node.setRotationFromEuler(tempEuler);
                }
            })
            .call(() => {
                // Đích đến cuối cùng cũng bám sát Node mục tiêu
                this.node.setWorldPosition(targetNode.worldPosition);
                this.node.setScale(baseScale, baseScale, baseScale);

                this.node.setRotationFromEuler(0, 0, 0);

                this.moveTween = null;
                this.shadow.active = true

                onDone?.();
            })
            .start();
    }

    // === THÊM 2 HÀM PHỤ HỖ TRỢ TOÁN HỌC GÓC QUAY ===
    private getShortestAngle(current: number, target: number) {
        let diff = (target - current) % 360;
        if (diff > 180) diff -= 360;
        if (diff < -180) diff += 360;
        return current + diff;
    }

    // Hàm Lerp (nội suy) đơn giản
    private lerpAngle(start: number, end: number, t: number) {
        return start + (end - start) * t;
    }
}