import { _decorator, Component, instantiate, Node, Vec3 } from 'cc';
import { Food } from './Food';
import { container, registerValue } from '../Core/DIContainer';
import { GameManager } from './GameManager';
import { EventBus } from '../Core/EventBus';
import { GameEvent } from '../Core/GameEvent';
import { GameConfigSA } from './Config/GameConfigSA';
import { LevelDataSA } from './Config/LevelDataSA';
import { print, shuffle } from '../Core/utils';

const { ccclass, property } = _decorator;

@ccclass('Pot')
export class Pot extends Component {
    @property(Food)
    public hidden: Food[] = []   // layer 2
    @property(Food)
    public active: Food[] = []   // layer 1
    private maxActive: number = 0

    protected gameManger: GameManager = null
    protected gameConfig: GameConfigSA = null

    onLoad() {
        registerValue('Pot', this)
        this.gameManger = container.resolve<GameManager>('GameManager')
        this.gameConfig = this.gameManger.gameConfig
    }

    protected onEnable(): void {
        EventBus.on(GameEvent.NEW_GAME, this.onNewGame)
    }

    protected onDisable(): void {
        EventBus.off(GameEvent.NEW_GAME, this.onNewGame)
    }

    onNewGame = () => {
        this.clear()
        print('Pot')
        const level = this.gameManger.currentLevelData
        const goals = level.goals
        this.maxActive = level.maxItemActive

        const allFoods: Food[] = []

        // 1. CREATE ALL ITEMS
        for (const goal of goals) {
            const prefab = this.gameConfig.getItemById(goal.foodId)
            const total = goal.quantity * LevelDataSA.MATCH_QUANTITY

            for (let i = 0; i < total; i++) {
                const node = instantiate(prefab)
                const food = node.getComponent(Food)

                // gán id nếu cần

                allFoods.push(food)
            }
        }

        // 2. SHUFFLE
        shuffle(allFoods)

        // 3. INIT LAYERS
        this.hidden = [...allFoods].reverse()
        this.active = []

        // 4. FIRST FILL
        this.refill()
    }

    removeActive(food: Food) {
        const index = this.active.indexOf(food)
        if (index !== -1) {
            this.active.splice(index, 1)
        }
    }

    refill() {
        while (this.active.length < this.maxActive && this.hidden.length > 0) {
            const food = this.hidden.pop()!

            this.active.push(food)
            this.spawn(food)
        }
    }

    private spawn(food: Food) {
        food.node.setParent(this.node)

        // random vị trí trong nồi
        // const x = Math.random() * 300 - 150
        // const y = Math.random() * 200 - 100

        food.node.setPosition(Vec3.ZERO)

        // bind click
        food.clickFunc = () => this.onFoodClicked(food)
    }

    private clear() {
        // destroy toàn bộ node cũ
        for (const food of this.active) {
            food.node.destroy()
        }
        for (const food of this.hidden) {
            food.node.destroy()
        }

        this.active = []
        this.hidden = []
    }
  
    private onFoodClicked(food: Food) {
        this.removeActive(food)
        // gửi lên GameManager xử lý match
        EventBus.emit(GameEvent.SELECT_FOOD, food)

        this.refill()
    }

  
}