import { _decorator, Component, Node, tween, Vec3 } from 'cc';
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
import { Goal } from './Goal';
const { ccclass, property } = _decorator;

@ccclass('GameManager')
export class GameManager extends Component {

    @property(GameConfigSA)
    public gameConfig: GameConfigSA = null

    @property(LevelDataSA)
    public currentLevelData: LevelDataSA = null

    private pendingActions: number = 0
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

        const goal = goalManager.findMatch(food.foodId)

        if (goal) {
            // MATCH SUCCESS
            goal.addItem(food)
            food.moveToGoal(goal, () => {
                if (goal.isCompleted()) {
                    print('Match and refill new goal')
                    this.handleGoalCompleted(goal)
                }
            })

        } else {

            const slot = bufferManager.add(food)
            if (!slot) {
                this.onLose()
                return
            }
            food.moveToQueue(slot)
        }
        
    }

    private handleGoalCompleted(goal: Goal) {
        const goalManager = container.resolve<GoalManager>('GoalManager')
        tween(goal.node)
            .to(0.2, { scale: Vec3.ZERO })
            .call(() => {
                goalManager.onGoalCompleted(goal)
                this.checkAutoMatch()
                if(goalManager.isAllCompleted()) {
                    this.onWin()
                }
            })
            .start()
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
                food.moveToGoal(goal, () => {
                    if (goal.isCompleted()) {
                        this.handleGoalCompleted(goal)
                        if(goalManager.isAllCompleted()) {
                            this.onWin()
                        }
                    }
                })
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
