import { _decorator, CCString, Collider, ERigidBodyType, Material, MeshRenderer, Node, Quat, RigidBody, Texture2D, tween, Vec3 } from 'cc';
import { Clickable } from '../Core/Clickable';
import { print } from '../Core/utils';
import { Goal } from './Goal';
import { BufferItem } from './BufferItem';
import { FloatingItem } from '../FloatingItem';
const { ccclass, property } = _decorator;

enum FoodState {
    IDLE,
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
    @property (MeshRenderer) public renderer: MeshRenderer = null
    public collider: Collider

    @property
    public clickable = false


    @property public state: FoodState

    protected start(): void {
        this.rb = this.getComponent(RigidBody)
        this.floating = this.getComponent(FloatingItem)
        this.collider = this.getComponent(Collider)
        this.renderer = this.getComponentInChildren(MeshRenderer)
    }

    public onClick() {
        if (!this.clickable) return
        this.clickFunc?.()
    }



    moveToGoal(target: Goal, onDone?: Function) {
        this.clickable = false
        this.rb.type = ERigidBodyType.KINEMATIC
        this.floating.enabled = false
        this.collider.enabled = false
        const worldPos = this.node.worldPosition.clone()
        const targetWorldPos = target.node.worldPosition.clone()
        const root = target.node.parent!

        this.node.setParent(root)
        this.node.setWorldPosition(worldPos)

        const targetLocalPos = new Vec3()
        root.inverseTransformPoint(targetLocalPos, targetWorldPos)
        const pos = target.getPos()

        tween(this.node)
            .to(0.4, {
                position: targetLocalPos,
            }, { easing: 'quadIn' })
            .call(() => {
                this.node.setParent(target.node)
                this.node.setPosition(pos)
                this.node.setRotationFromEuler(0, 0, 0);
                this.node.setScale(0.7, 0.7, 0.7)
                if (this.shadow) {
                    this.shadow.active = true
                }
                this.state = FoodState.DONE
                onDone?.()
            })
            .start()
    }
    setClickable(value) {
        this.clickable = value
    }
    moveToQueue(target: BufferItem, onDone?: Function) {
        print("moveToQueue");
        this.clickable = false

        this.rb.type = ERigidBodyType.KINEMATIC
        this.floating.enabled = false;
        this.collider.enabled = false

        const worldPos = this.node.worldPosition.clone()
        const targetWorldPos = target.node.worldPosition.clone()
        const root = target.node.parent!

        this.node.setParent(root)
        this.node.setWorldPosition(worldPos)

        const targetLocalPos = new Vec3()
        root.inverseTransformPoint(targetLocalPos, targetWorldPos)

        tween(this.node)
            .to(0.2, {
                eulerAngles: Vec3.ZERO
            })
            .to(0.4, {
                position: targetLocalPos,
            }, { easing: 'quadIn' })
            .call(() => {
                this.node.setParent(target.node)
                this.node.setPosition(target.spawnPos.position)
                if (this.shadow) {
                    this.shadow.active = true
                }
                onDone?.() // callback
            })
            .start()
    }
}
