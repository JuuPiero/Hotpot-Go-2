import { _decorator, CCString, Collider, ERigidBodyType, Node, RigidBody, Texture2D, tween, Vec3 } from 'cc';
import { Clickable } from '../Core/Clickable';
import { print } from '../Core/utils';
import { Goal } from './Goal';
import { BufferItem } from './BufferItem';
import { FloatingItem } from '../FloatingItem';
const { ccclass, property } = _decorator;

@ccclass('Food')
export class Food extends Clickable {
    @property({
        type: CCString,
    })
    public foodId: string = '123'
    @property(Texture2D)
    public icon: Texture2D;
    public clickFunc: Function;

    public rb: RigidBody
    public floating: FloatingItem
    public collider: Collider

    protected start(): void {
        this.rb = this.getComponent(RigidBody)
        this.floating = this.getComponent(FloatingItem)
        this.collider = this.getComponent(Collider)
    }

    public onClick() {
        this.clickFunc?.()
    }

    moveToGoal(target: Goal, onDone?: Function) {
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

        tween(this.node)
            .to(0.4, {
                position: targetLocalPos,
            }, { easing: 'quadIn' })
            .call(() => {
                this.node.setParent(target.node)
                this.node.setPosition(Vec3.ZERO)
                this.node.setScale(0.4, 0.4, 0.4)

                onDone?.() // ⭐ callback
            })
            .start()
    }

    moveToQueue(target: BufferItem, onDone?: Function) {
        print("moveToQueue");
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
            .to(0.4, {
                position: targetLocalPos,
            }, { easing: 'quadIn' })
            .call(() => {
                this.node.setParent(target.node)
                this.node.setPosition(target.spawnPos.position)
                // this.node.setScale(0.4, 0.4, 0.4)

                onDone?.() // callback
            })
            .start()
        // this.node.setParent(target)
        // this.node.setPosition(Vec3.ZERO)
    }
}
