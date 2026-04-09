import { _decorator, Camera, Component, ERigidBodyType, instantiate, Node, sys, tween, Vec3 } from 'cc';
import { print } from '../Core/utils';
import { container, registerValue } from '../Core/DIContainer';
import super_html_playable from '../Core/super_html_playable';
import { GameConfigSA } from './Config/GameConfigSA';
import { LevelDataSA } from './Config/LevelDataSA';
import { EventBus } from '../Core/EventBus';
import { GameEvent } from '../Core/GameEvent';
import { Food, FoodState } from './Food';
import { GoalManager } from './GoalManager';
import { BufferManager } from './BufferManager';
import { NavigationContainer } from '../Core/Navigation/NavigationContainer';
import { Pot } from './Pot';
import { SoundManager } from '../Core/SoundManager';
import { Sounds } from '../Core/Sounds';
const { ccclass, property, executionOrder } = _decorator;

@ccclass('GameManager')
@executionOrder(1)
export class GameManager extends Component {

    @property(GameConfigSA) public gameConfig: GameConfigSA = null
    @property(LevelDataSA) public currentLevelData: LevelDataSA = null
    // @property(Node) public tutorial: Node;

    @property(Camera) subCamera: Camera = null



    @property public isWin = false
    @property public isLose = false


    private pot: Pot = null
    private goalManager: GoalManager = null
    private bufferManager: BufferManager = null
    private navigation: NavigationContainer = null

    protected onLoad(): void {
        registerValue('GameManager', this)
        registerValue('LevelData', this.currentLevelData)
        registerValue('GameConfig', this.gameConfig)
        super_html_playable.set_google_play_url(this.gameConfig.storeUrl)
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
        this.pot = container.resolve<Pot>('Pot')
    }


    onSelectFood = (food: Food) => {
        if (this.isLose) return

        // print("SELECT: " + food.foodId)

        const goal = this.goalManager.findMatch(food.foodId)
        if (goal) {
            // print("MOVE to goal")

            this.pot.removeFood(food)

            food.flyToGoal(goal, () => {
                if (goal.isCompleted()) {
                    print("MATCH")
                    const outPos = this.goalManager.outPoint
                    // const effect = instantiate(this.gameConfig.matchedEffect)
                    // effect.setParent(goal.node)
                    goal.moveOut(outPos, () => {

                        this.goalManager.onGoalCompleted(goal)
                        if (this.goalManager.isAllCompleted()) {
                            this.onWin()
                            return
                        }
                        // goal.node.destroy()

                        this.checkAutoMatch()
                    })
                }
            })
            return
        }
        const slot = this.bufferManager.add(food)
        if (slot) {

            this.pot.removeFood(food)
            if (this.bufferManager.slotLeft == 1) {
                console.log("WARNING")

            }
            else {
                // console.log("tắt WARNING")

            }

            food.flyToBuffer(slot, () => {

                if (this.bufferManager.isFull()) {
                    this.onLose()
                    return
                }


            })

        }

    }

    private checkAutoMatch() {

        const foods = this.bufferManager.getAllFoods()

        for (const food of foods) {
            const goal = this.goalManager.findMatch(food.foodId)

            if (goal) {
                this.bufferManager.remove(food)

                food.flyToGoal(goal, () => {
                    if (goal.isCompleted()) {
                        print("MATCH")
                        const outPos = this.goalManager.outPoint
                        goal.moveOut(outPos, () => {
                            this.goalManager.onGoalCompleted(goal)
                            if (this.goalManager.isAllCompleted()) {
                                this.onWin()
                                return
                            }
                            // goal.node.destroy()

                            this.checkAutoMatch()

                        })
                    }
                })

            }
        }
    }

    private onLose() {
        print("LOSE")
        SoundManager.instance.playOneShot(Sounds.Lose)
        this.isLose = true
        super_html_playable.game_end()
        this.navigation.stack.navigate('EndCard')
        EventBus.emit(GameEvent.LEVEL_COMPLETED)
    }

    private onWin() {
        print("WIN")
        SoundManager.instance.playOneShot(Sounds.Win)
        this.isWin = true
        super_html_playable.game_end()

        this.navigation.stack.navigate('EndCard')
        EventBus.emit(GameEvent.LEVEL_COMPLETED)
    }

    installGame = () => {
        super_html_playable.download()
    }

}