import { _decorator, Component, Node } from 'cc';
import { print } from '../Core/utils';
import { container, registerValue } from '../Core/DIContainer';
import super_html_playable from '../Core/super_html_playable';
import { GameConfigSA } from './Config/GameConfigSA';
import { LevelDataSA } from './Config/LevelDataSA';
import { EventBus } from '../Core/EventBus';
import { GameEvent } from '../Core/GameEvent';
import { Food } from './Food';
import { GoalManager } from './GoalManager';
import { BufferManager } from './BufferManager';
const { ccclass, property } = _decorator;

@ccclass('GameManager')
export class GameManager extends Component {

    @property(GameConfigSA)
    public gameConfig: GameConfigSA = null

    @property(LevelDataSA)
    public currentLevelData: LevelDataSA = null


    protected onLoad(): void {
        registerValue('GameManager', this)
        registerValue('LevelData', this.currentLevelData)
        registerValue('GameConfig', this.gameConfig)
    }
    protected onEnable(): void {
        EventBus.on(GameEvent.SELECT_FOOD, this.onSelectFood)
        EventBus.on(GameEvent.LEVEL_COMPLETED, this.install)

    }
    protected onDisable(): void {
        EventBus.off(GameEvent.SELECT_FOOD, this.onSelectFood)
        EventBus.off(GameEvent.LEVEL_COMPLETED, this.install)
    }

    install() {
        super_html_playable.download()
    }

    protected start(): void {
        EventBus.emit(GameEvent.NEW_GAME)
    }

    onSelectFood = (food: Food) => {
        print("SELECT:", food.foodId)

        const goalManager = container.resolve<GoalManager>('GoalManager')
        const bufferManager = container.resolve<BufferManager>('BufferManager')

        // =========================
        // 1. TRY MATCH GOAL
        // =========================
        const goal = goalManager.findMatch(food.foodId)

        if (goal) {
            // MATCH SUCCESS
            goal.addItem(food)

            food.moveToGoal(goal.node)

            if (goal.isCompleted()) {
                // GoalManager tự xử lý spawn goal mới
                print("matched")

            }
        } else {
            // =========================
            // 2. ADD TO BUFFER
            // =========================
            const success = bufferManager.add(food)

            if (!success) {
                this.onLose()
                return
            }

            // move vào slot
            const slot = bufferManager.add(food)
            if (!slot) {
                this.onLose()
                return
            }

            food.moveToQueue(slot.node)
        }

        // =========================
        // 3. AUTO MATCH BUFFER
        // =========================
        this.checkAutoMatch()

        // =========================
        // 4. CHECK WIN
        // =========================
        if (goalManager.isAllCompleted()) {
            this.onWin()
        }
    }


    private checkAutoMatch() {
        const goalManager = container.resolve<GoalManager>('GoalManager')
        const bufferManager = container.resolve<BufferManager>('BufferManager')

        const foods = bufferManager.getAllFoods()

        for (const food of foods) {
            const goal = goalManager.findMatch(food.foodId)

            if (goal) {
                bufferManager.remove(food)

                goal.addItem(food)
                food.moveToGoal(goal.node)

                if (goal.isCompleted()) {
                    print("matched spawn goal mới")

                }
            }
        }
    }

    private onLose() {
        print("LOSE")
    }

    private onWin() {
        print("WIN")
        EventBus.emit(GameEvent.LEVEL_COMPLETED)
    }

    public test() {
        print("hello world")
    }
}


