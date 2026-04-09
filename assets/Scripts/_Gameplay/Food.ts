import { _decorator, CCString, Collider, ERigidBodyType, Material, MeshRenderer, Node, Quat, RigidBody, Texture2D, tween, Tween, Vec3 } from 'cc'; // Thêm import Tween
import { Clickable } from '../Core/Clickable';
import { Goal } from './Goal';
import { BufferItem } from './BufferItem';
import { FloatingItem } from '../FloatingItem';
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
    @property(Texture2D) public icon: Texture2D;
    @property(Node) public shadow: Node;

    public clickFunc: Function;

    @property(RigidBody) public rb: RigidBody
    @property(FloatingItem) public floating: FloatingItem
    @property(MeshRenderer) public renderer: MeshRenderer = null
    public colliders: Collider[] = []

    @property public state: FoodState

    // Giữ reference của tween di chuyển để quản lý chặt chẽ hơn
    private moveTween: Tween<any> = null;

    protected start(): void {
        this.rb = this.getComponent(RigidBody)
        this.floating = this.getComponent(FloatingItem)
        this.colliders = this.getComponents(Collider)
        this.renderer = this.getComponentInChildren(MeshRenderer)
    }

    public onClick() {
        if (this.state !== FoodState.IDLE) return
        this.clickFunc?.()
    }

    public flyToGoal(goal: Goal, onDone?: Function) {
        if (this.state === FoodState.MOVING_TO_GOAL || this.state === FoodState.DONE) return;

        this.prepareForFlight();
        this.state = FoodState.MOVING_TO_GOAL

        const target = goal.getPos()

        this.jumpTo(target, 8, 1, () => {
            goal.count++
            goal.foods.push(this)
            goal.updateUI()
            this.node.setParent(goal.node)
            this.node.setWorldPosition(target)

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

        this.jumpTo(target, 6, 1, () => {
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
        const start = this.node.worldPosition.clone()
        const end = targetWorld
        const temp = new Vec3()

        // Gán tween vào biến moveTween
        this.moveTween = tween({ t: 0 })
            .to(duration, { t: 1 }, {
                easing: 'quadOut',
                onUpdate: (obj) => {
                    const t = obj.t

                    // Lerp position (X, Z)
                    Vec3.lerp(temp, start, end, t)

                    // Parabola Y
                    const height = Math.sin(Math.PI * t) * jumpHeight
                    temp.y += height

                    this.node.setWorldPosition(temp)
                }
            })
            .call(() => {
                this.node.setWorldPosition(end)
                this.moveTween = null; // Clear khi hoàn thành
                onDone?.()
            })
            .start()
    }
}