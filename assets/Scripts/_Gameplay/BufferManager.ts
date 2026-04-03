import { _decorator, Component, instantiate, Node, Vec3 } from 'cc';
import { BufferItem } from './BufferItem';
import { EventBus } from '../Core/EventBus';
import { GameEvent } from '../Core/GameEvent';
import { LevelDataSA } from './Config/LevelDataSA';
import { container, registerValue } from '../Core/DIContainer';
import { GameConfigSA } from './Config/GameConfigSA';
import { GoalManager } from './GoalManager';
import { Food } from './Food';
import { print } from '../Core/utils';
const { ccclass, property } = _decorator;

@ccclass('BufferManager')
export class BufferManager extends Component {
    @property(BufferItem) public bufferSlots: BufferItem[] = []
    private levelData: LevelDataSA;
    private gameConfig: GameConfigSA
    private goalManager: GoalManager

    @property public spacing: number = 2
    @property public count: number = 0

    protected onLoad(): void {
        registerValue('BufferManager', this)
       
    }
    protected start(): void {
        this.levelData = container.resolve<LevelDataSA>('LevelData')
        this.gameConfig = container.resolve<GameConfigSA>('GameConfig')
        this.goalManager = container.resolve<GoalManager>('GoalManager')
        print(this.levelData)
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
        this.bufferSlots = [];
        this.node.removeAllChildren()
        this.count = this.levelData.maxBuffer
        const totalWidth = (this.count - 1) * this.spacing

        const startX = -totalWidth / 2;

        for (let i = 0; i < this.count; i++) {
            const node = instantiate(this.gameConfig.bufferItemPrefab)
            node.setParent(this.node);
            node.name = `slot_${i}`

            const x = startX + i * this.spacing;
            node.setPosition(new Vec3(x, -1, 0));

            const slot = node.getComponent(BufferItem);
            if (slot) {
                this.bufferSlots.push(slot);
            }
        }
    }

    public getAvailableQueueItem(): BufferItem | null {
        for (const item of this.bufferSlots) {
            if(item.food === null) return item
        }
        return null
    }

    public addFood(food: Food) {
        const slot = this.getAvailableQueueItem()

        if (!slot) {
            EventBus.emit(GameEvent.LEVEL_FAILED)
            return
        }

        slot.setData(food)

        const duplicates = this.bufferSlots.reduce((map, slotItem) => {
            if (slotItem.food) {
                map[slotItem.food.id] = (map[slotItem.food.id] || 0) + 1
            }
            return map
        }, {} as Record<string, number>)

        if (duplicates[food.id] >= LevelDataSA.MATCH_QUANTITY) {
            this.autoMatch(food.id)
        }

        if (!this.getAvailableQueueItem()) {
            EventBus.emit(GameEvent.BUFFER_FULL)
        }
    }

    private autoMatch(foodId: string) {
        const target = this.goalManager.getMatchedTarget({ id: foodId } as Food)
        if (!target) return

        let consumed = 0
        for (const slot of this.bufferSlots) {
            if (consumed >= LevelDataSA.MATCH_QUANTITY) break
            if (slot.food?.id === foodId) {
                const item = slot.food
                slot.food = null
                item.node.setParent(this.node)
                item.node.setPosition(slot.spawnPos.position)
                target.addItem(item)
                consumed++
            }
        }
        // ultimate matching event is emitted by Goal.addItem() when requirement is reached
    }
}


