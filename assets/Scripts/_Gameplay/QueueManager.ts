import { _decorator, Component, instantiate, Node, Vec3 } from 'cc';
import { QueueItem } from './QueueItem';
import { EventBus } from '../Core/EventBus';
import { GameEvent } from '../Core/GameEvent';
import { LevelDataSA } from './LevelDataSA';
import { container, registerValue } from '../Core/DIContainer';
import { GameConfigSA } from './GameConfigSA';
const { ccclass, property } = _decorator;

@ccclass('QueueManager')
export class QueueManager extends Component {
    @property(QueueItem) public items: QueueItem[] = []
    private levelData: LevelDataSA;
    private gameConfig: GameConfigSA

    @property public spacing: number = 2
    @property public count: number = 0

    protected onLoad(): void {
        registerValue('QueueManager', this)
        this.levelData = container.resolve<LevelDataSA>('LevelData')
        this.gameConfig = container.resolve<GameConfigSA>('GameConfig')
    }

    protected onEnable(): void {
        EventBus.on(GameEvent.NEW_GAME, this.onNewGame)
    }

    protected onDisable(): void {
        EventBus.off(GameEvent.NEW_GAME, this.onNewGame)
    }

    onNewGame = () => {
        // const queueItem = instantiate()
        this.spawnItems()
    }

    private spawnItems() {
        this.items = [];

        
        this.count = this.levelData.maxQueue
        const totalWidth = (this.count - 1) * this.spacing

        const startX = -totalWidth / 2;

        for (let i = 0; i < this.count; i++) {
            const node = instantiate(this.gameConfig.queueItemPrefab)
            node.setParent(this.node);
            node.name = `slot_${i}`

            const x = startX + i * this.spacing;
            node.setPosition(new Vec3(x, -1, 0));

            const slot = node.getComponent(QueueItem);
            if (slot) {
                this.items.push(slot);
            }
        }
    }

    public getAvailableQueueItem(): QueueItem | null {
        for (const item of this.items) {
            if(item.food === null) return item
        }
        return null
    }
}


