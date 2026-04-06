import { _decorator, Component, Node, sys, tween, Vec3 } from 'cc';
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
import { NavigationContainer } from '../Core/Navigation/NavigationContainer';
const { ccclass, property } = _decorator;

@ccclass('GameManager')
export class GameManager extends Component {

    @property(GameConfigSA)
    public gameConfig: GameConfigSA = null

    @property(LevelDataSA) public currentLevelData: LevelDataSA = null

    @property(Node) public tutorial: Node;


    @property public isWin = false
    @property public isLose = false

    private goalManager: GoalManager = null
    private bufferManager: BufferManager = null
    private navigation: NavigationContainer = null

    protected onLoad(): void {
        registerValue('GameManager', this)
        registerValue('LevelData', this.currentLevelData)
        registerValue('GameConfig', this.gameConfig)
    }

    protected onEnable(): void {
        EventBus.on(GameEvent.SELECT_FOOD, this.onSelectFood)
        EventBus.on(GameEvent.LEVEL_COMPLETED, this.installGame)

    }
    protected onDisable(): void {
        EventBus.off(GameEvent.SELECT_FOOD, this.onSelectFood)
        EventBus.off(GameEvent.LEVEL_COMPLETED, this.installGame)
    }

    

    protected start(): void {
        EventBus.emit(GameEvent.NEW_GAME)
        this.goalManager = container.resolve<GoalManager>('GoalManager')
        this.bufferManager = container.resolve<BufferManager>('BufferManager')
        this.navigation = container.resolve<NavigationContainer>('Navigation')
    }


    onSelectFood = (food: Food) => {
        if(this.isLose) return

        print("SELECT: " + food.foodId)
        const goal = this.goalManager.findMatch(food.foodId)

        if (goal) {
            goal.addItem(food)

            food.moveToGoal(goal, () => {
                if (goal.isCompleted()) {
                    print('Match and refill new goal')
                    this.handleGoalCompleted(goal)
                }
            })

        } else {

            const slot = this.bufferManager.add(food)
            if (!slot) {
                this.onLose()
                return
            }
            food.moveToQueue(slot, () => {
                if(this.bufferManager.isFull()) {
                    this.onLose()
                }
            })
        }
    }

    private handleGoalCompleted(goal: Goal) {
        const goalManager = container.resolve<GoalManager>('GoalManager')
        tween(goal.node)
            .to(0.3, {
                position: this.node.position.add3f(0, 2, 0)
            })
            .to(0.3, {
                position: goalManager.outPoint.position.clone()
            })
            .to(0.2, { scale: Vec3.ZERO })
            .call(() => {
                goalManager.onGoalCompleted(goal)
                this.checkAutoMatch()
                if (goalManager.isAllCompleted()) {
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
                    }
                })

            }
        }
    }

    private onLose() {
        print("LOSE")
        this.isLose = true
        super_html_playable.game_end()
        this.navigation.stack.navigate('EndCard')
        EventBus.emit(GameEvent.LEVEL_COMPLETED)
    }

    private onWin() {
        print("WIN")
        this.isWin = true
        super_html_playable.game_end()
        
        this.navigation.stack.navigate('EndCard')
        EventBus.emit(GameEvent.LEVEL_COMPLETED)

    }

    public installGame() {
        super_html_playable.download()
    }

    public test() {
        print("hello world")
    }
}