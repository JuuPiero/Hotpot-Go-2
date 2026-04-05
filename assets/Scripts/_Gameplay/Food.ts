import { _decorator, CCString, Component, ERigidBodyType, Node, RigidBody, Texture2D, Vec3 } from 'cc';
import { GameManager } from './GameManager';
import { container } from '../Core/DIContainer';
import { Clickable } from '../Core/Clickable';
import { BufferManager } from './BufferManager';
import { Buoyancy } from '../Buoyancy';
import { GoalManager } from './GoalManager';
import { print } from '../Core/utils';
import { PotLayer } from './PotLayer';
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
        // this.moveToQueue()
    }

    moveToGoal(target: Node) {
        print("moveToGoal")
        this.node.setParent(target)
        this.node.setPosition(Vec3.ZERO)
    }

    moveToQueue(target: Node) {
        print("moveToQueue")
        this.node.setParent(target)
        this.node.setPosition(Vec3.ZERO)
    }
}
