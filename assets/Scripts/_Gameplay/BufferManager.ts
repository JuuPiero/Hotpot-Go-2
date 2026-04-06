import { _decorator, Component, instantiate, Node, Vec3 } from 'cc';
import { BufferItem } from './BufferItem';
import { EventBus } from '../Core/EventBus';
import { GameEvent } from '../Core/GameEvent';
import { LevelDataSA } from './Config/LevelDataSA';
import { container, registerValue } from '../Core/DIContainer';
import { GameConfigSA } from './Config/GameConfigSA';
import { print } from '../Core/utils';
import { Food } from './Food';
const { ccclass, property } = _decorator;

@ccclass('BufferManager')
export class BufferManager extends Component {
    @property(BufferItem) public bufferSlots: BufferItem[] = []
    private levelData: LevelDataSA;
    private gameConfig: GameConfigSA

    @property public spacing: number = 2
    @property public count: number = 0

    protected onLoad(): void {
        registerValue('BufferManager', this)
        this.gameConfig = container.resolve<GameConfigSA>('GameConfig')
        this.levelData = container.resolve<LevelDataSA>('LevelData')
    }

    protected onEnable(): void {
        EventBus.on(GameEvent.NEW_GAME, this.onNewGame)

    }

    protected onDisable(): void {
        EventBus.off(GameEvent.NEW_GAME, this.onNewGame)
    }

    onNewGame = () => {
        print('Buffer')
        this.spawnItems()
    }

    private spawnItems() {
        this.bufferSlots = [];

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

    public getAvailableBuffer(): BufferItem | null {
        for (const item of this.bufferSlots) {
            if (item.food === null) return item
        }
        return null
    }


    add(food: Food): BufferItem | null {
        const slot = this.getAvailableBuffer()
        if (!slot) return null

        slot.setData(food)
        return slot
    }

    isFull(): boolean {
        return this.getAvailableBuffer() === null
    }

    getAllFoods(): Food[] {
        return this.bufferSlots
            .filter(s => s.food !== null)
            .map(s => s.food)
    }

    remove(food: Food) {
        for (const slot of this.bufferSlots) {
            if (slot.food === food) {
                slot.food = null
                return
            }
        }
    }
}