import { _decorator, CCString, Component, ERigidBodyType, Node, RigidBody, Texture2D } from 'cc';
import { GameManager } from './GameManager';
import { container } from '../Core/DIContainer';
import { Clickable } from '../Core/Clickable';
import { BufferManager } from './BufferManager';
import { Buoyancy } from '../Buoyancy';
import { GoalManager } from './GoalManager';
import { Goal } from './Goal';
import { EventBus } from '../Core/EventBus';
import { GameEvent } from '../Core/GameEvent';
import { print } from '../Core/utils';
const { ccclass, property } = _decorator;

@ccclass('Food')
export class Food extends Clickable {
    @property({
        type: CCString,
        readonly: true
    })
    public id: string = '123'

    @property(Texture2D)
    public icon: Texture2D;

    public canClick: boolean
    public buoyancy: Buoyancy;
    protected rb: RigidBody;

    protected bufferManager: BufferManager;
    protected goalManager: GoalManager;

    protected onLoad(): void {

    }

    start(): void {
        this.bufferManager = container.resolve<BufferManager>('BufferManager')
        this.goalManager = container.resolve<GoalManager>('GoalManager')

        this.buoyancy = this.getComponent(Buoyancy)
        this.rb = this.getComponent(RigidBody)
    }

    public onClick() {
        if (this.canClick === false) return

        const gameManager = container.resolve<GameManager>('GameManager')
        gameManager.test()

        const target = this.goalManager.getMatchedTarget(this)
        if (target) {
            this.moveToTarget(target)
        } else {
            print('Check and move to queue')
            this.moveToQueue()
        }

        EventBus.emit(GameEvent.FOOD_CONSUMED, this)
    }

    public moveToTarget(target: Goal) {
        this.buoyancy.enabled = false
        this.rb.type = ERigidBodyType.KINEMATIC
        target.addItem(this)
    }

    public moveToQueue() {
        this.buoyancy.enabled = false
        this.rb.type = ERigidBodyType.KINEMATIC
        this.bufferManager.addFood(this)
    }
}
