import { _decorator, CCString, Collider, ERigidBodyType, Material, MeshRenderer, Node, Quat, RigidBody, Texture2D, tween, Vec3 } from 'cc';
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
    @property({
        type: CCString,
    })
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

    protected start(): void {
        this.rb = this.getComponent(RigidBody)
        this.floating = this.getComponent(FloatingItem)
        this.colliders = this.getComponents(Collider)
        this.renderer = this.getComponentInChildren(MeshRenderer)
    }

    public onClick() {
        this.clickFunc?.()
    }

    public flyToGoal(goal: Goal, onDone?: Function) {
        this.state = FoodState.MOVING_TO_GOAL
        // this.collider.enabled = false
        this.colliders.forEach(col => {
            col.enabled = false
        })
        this.rb.type = ERigidBodyType.KINEMATIC
        this.floating.enabled = false

        this.node.setRotationFromEuler(0, 0, 0)

        const target = goal.getPos()

        this.jumpTo(target, 3, 0.5, () => {
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
        this.state = FoodState.MOVING_TO_BUFFER
        this.colliders.forEach(col => {
            col.enabled = false
        })
        this.rb.type = ERigidBodyType.KINEMATIC
        this.floating.enabled = false
        buffer.food = this
        this.node.setRotationFromEuler(0, 0, 0)
        const target = buffer.spawnPos.worldPosition.clone()

        this.jumpTo(target, 3, 0.5, () => {
            this.node.setParent(buffer.node)
            this.node.setWorldPosition(target)

            if (this.shadow) {
                this.shadow.active = true
            }
            this.state = FoodState.DONE
            onDone?.()
        })
    }

    jumpTo(targetWorld: Vec3, jumpHeight = 2, duration = 0.5, onDone?: Function) {
        const start = this.node.worldPosition.clone()
        const end = targetWorld

        const temp = new Vec3()

        tween({ t: 0 })
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
                onDone?.()
            })
            .start()
    }


}
