import { _decorator, CCString, Component, ERigidBodyType, Node, RigidBody, Texture2D } from 'cc';
import { GameManager } from './GameManager';
import { container } from '../Core/DIContainer';
import { Clickable } from '../Core/Clickable';
import { QueueManager } from './QueueManager';
import { Buoyancy } from '../Buoyancy';
import { TargetManager } from './TargetManager';
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

    protected queueManager: QueueManager;
    protected targetManager: TargetManager;

    protected onLoad(): void {

    }

    start(): void {
        this.queueManager = container.resolve<QueueManager>('QueueManager')
        this.targetManager = container.resolve<TargetManager>('TargetManager')

        this.buoyancy = this.getComponent(Buoyancy)
        this.rb = this.getComponent(RigidBody)
    }

    public onClick() {
        const gameManager = container.resolve<GameManager>('GameManager');
        gameManager.test()

        const target = this.targetManager.getMatchedTarget(this)
        if(target) {
            this.moveToTarget()
            return

        }
        print("Check and move to queue")
        // this.moveToQueue()

    }

    public moveToTarget() {
        print('Move to target')
    }

    public moveToQueue() {
        const queueItem = this.queueManager.getAvailableQueueItem()
        queueItem?.setData(this)
        this.buoyancy.enabled = false
        this.rb.type = ERigidBodyType.KINEMATIC
        
    }
}
