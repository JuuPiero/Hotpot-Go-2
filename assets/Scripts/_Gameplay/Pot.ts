import { _decorator, Component, Node, instantiate, Prefab } from 'cc';
import { PotLayer } from './PotLayer';
import { GameConfigSA } from './Config/GameConfigSA';
import { LevelDataSA } from './Config/LevelDataSA';
import { EventBus } from '../Core/EventBus';
import { GameEvent } from '../Core/GameEvent';
import { container, registerValue } from '../Core/DIContainer';
import { Food } from './Food';

const { ccclass, property } = _decorator;

@ccclass('Pot')
export class Pot extends Component {
    @property(PotLayer)
    public potLayers: PotLayer[] = []

    @property(Node)
    public layerOnePositions: Node[] = []

    @property(Node)
    public layerTwoPositions: Node[] = []

    @property public maxActive: number = 6

    private gameConfig: GameConfigSA
    private levelData: LevelDataSA
    private activeFoods: Food[] = []

    protected onLoad(): void {
        registerValue('Pot', this)
        this.gameConfig = container.resolve<GameConfigSA>('GameConfig')
        this.levelData = container.resolve<LevelDataSA>('LevelData')
    }

    protected onEnable(): void {
        EventBus.on(GameEvent.NEW_GAME, this.onNewGame)
        EventBus.on(GameEvent.FOOD_CONSUMED, this.onFoodConsumed)
    }

    protected onDisable(): void {
        EventBus.off(GameEvent.NEW_GAME, this.onNewGame)
        EventBus.off(GameEvent.FOOD_CONSUMED, this.onFoodConsumed)
    }

    onNewGame = () => {
        this.clearActiveFoods()
        this.spawnInitialFoods()
    }

    onFoodConsumed = (food: Food) => {
        const idx = this.activeFoods.indexOf(food)
        if (idx !== -1) {
            this.activeFoods.splice(idx, 1)
        }
        this.scheduleOnce(() => {
            this.spawnNextFood()        
        }, 0.1)
    }

    private clearActiveFoods() {
        this.activeFoods.forEach(f => f.node.destroy())
        this.activeFoods = []
    }

    private spawnInitialFoods() {
        const firstLayerCount = Math.min(this.layerOnePositions.length, this.maxActive)
        const secondLayerCount = Math.min(this.layerTwoPositions.length, this.maxActive - firstLayerCount)

        for (let i = 0; i < firstLayerCount; i++) {
            this.spawnFoodAtPosition(this.layerOnePositions[i])
        }
        for (let i = 0; i < secondLayerCount; i++) {
            this.spawnFoodAtPosition(this.layerTwoPositions[i])
        }
    }

    private spawnNextFood() {
        const allSpots = [...this.layerOnePositions, ...this.layerTwoPositions]
        const freeSlot = allSpots.find(pos => !pos.children.length)
        if (freeSlot) {
            this.spawnFoodAtPosition(freeSlot)
        }
    }

    private spawnFoodAtPosition(position: Node) {
        if (!this.gameConfig?.foods || this.gameConfig.foods.length === 0) return

        const foodPrefab = this.gameConfig.foods[Math.floor(Math.random() * this.gameConfig.foods.length)]
        const node = instantiate(foodPrefab as Prefab)
        node.setParent(position)
        node.setPosition(0, 0, 0)

        const food = node.getComponent(Food)
        if (food) {
            food.canClick = true
            this.activeFoods.push(food)
        }
    }
}



