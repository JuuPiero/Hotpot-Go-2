import { _decorator, CCString, Component, ERigidBodyType, Node, RigidBody, Texture2D, tween, Vec3 } from 'cc';
import { GameManager } from './GameManager';
import { container } from '../Core/DIContainer';
import { Clickable } from '../Core/Clickable';
import { BufferManager } from './BufferManager';
import { Buoyancy } from '../Buoyancy';
import { GoalManager } from './GoalManager';
import { print } from '../Core/utils';
import { PotLayer } from './PotLayer';
import { Goal } from './Goal';
import { EventBus } from '../Core/EventBus';
import { GameEvent } from '../Core/GameEvent';
import { BufferItem } from './BufferItem';
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

    protected onLoad(): void {
    }

    public onClick() {
        this.clickFunc?.()
    }

    moveToGoal(target: Goal, onDone?: Function) {
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
        print("moveToQueue")
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
