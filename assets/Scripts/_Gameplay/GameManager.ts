import { _decorator, Camera, Component, ERigidBodyType, instantiate, macro, Node, sys, tween, Vec3 } from 'cc';
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
import { TutorialController } from './TutorialController';
const { ccclass, property, executionOrder } = _decorator;


@ccclass('GameManager')
export class GameManager extends Component {

    @property(GameConfigSA) public gameConfig: GameConfigSA = null
    @property(LevelDataSA) public currentLevelData: LevelDataSA = null
    // @property(Node) public tutorial: Node;

    @property(Node) public confetti: Node = null

    @property public isWin = false
    @property public isLose = false

    private pot: Pot = null
    private goalManager: GoalManager = null
    private bufferManager: BufferManager = null
    private navigation: NavigationContainer = null
    private tutorial: TutorialController = null

    protected onLoad(): void {
        registerValue('GameManager', this)
        registerValue('LevelData', this.currentLevelData)
        registerValue('GameConfig', this.gameConfig)
        super_html_playable.set_google_play_url(this.gameConfig.storeUrl)
    }

    protected onEnable(): void {
        EventBus.on(GameEvent.SELECT_FOOD, this.onSelectFood)
        EventBus.on(GameEvent.LEVEL_COMPLETED, this.onWin)
        EventBus.on(GameEvent.LEVEL_LOSE, this.onLose)
    }

    protected onDisable(): void {
        EventBus.off(GameEvent.SELECT_FOOD, this.onSelectFood)
        EventBus.off(GameEvent.LEVEL_COMPLETED, this.onWin)
        EventBus.off(GameEvent.LEVEL_LOSE, this.onLose)
    }

    protected start(): void {
        // EventBus.emit(GameEvent.NEW_GAME)


        this.goalManager = container.resolve<GoalManager>('GoalManager')
        this.bufferManager = container.resolve<BufferManager>('BufferManager')
        this.navigation = container.resolve<NavigationContainer>('Navigation')
        this.pot = container.resolve<Pot>('Pot')
        this.tutorial = container.resolve<TutorialController>('Tutorial')
        SoundManager.instance.playMusic(Sounds.BACKGROUND_MUSIC)

        this.goalManager.onNewGame()
        this.pot.onNewGame()
        this.bufferManager.onNewGame()

    }

    onSelectFood = (food: Food) => {
        if (this.isLose) return
        if (this.tutorial.node.active) this.tutorial.node.active = false

        const goal = this.goalManager.findMatch(food.foodId)
        if (goal) {
            this.pot.removeFood(food)
            food.flyToGoal(goal, () => {
                if (goal.isCompleted()) {
                    print("MATCH")
                    SoundManager.instance.playOneShot(Sounds.Success)
                    const outPos = this.goalManager.outPoint
                    const effect = instantiate(this.gameConfig.matchedEffect)
                    effect.setParent(goal.node)

                    goal.moveOut(outPos, () => {
                        this.goalManager.onGoalCompleted(goal)
                        if (this.goalManager.isAllCompleted()) {
                            this.onWin()
                            return
                        }
                        
                        // FIX TẠI ĐÂY: Chờ 0.55s để đĩa mới yên vị rồi mới Auto Match
                        this.scheduleOnce(() => {
                            if (this.isWin || this.isLose) return;
                            this.checkAutoMatch()
                        }, 0.55);
                    })
                }
                else {
                    goal.playImpactEffect();
                }
            })
            return
        }
        const slot = this.bufferManager.add(food)
        if (slot) {
            if (this.bufferManager.slotLeft === 1) {
                console.log("WARNING")
                this.bufferManager.startWarning()
            }
            else {
                this.bufferManager.stopWarning()
            }

            this.pot.removeFood(food)

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
                this.bufferManager.stopWarning()

                food.flyToGoal(goal, () => {
                    if (goal.isCompleted()) {
                        print("MATCH")
                        SoundManager.instance.playOneShot(Sounds.Success)
                        const effect = instantiate(this.gameConfig.matchedEffect)
                        effect.setParent(goal.node)
                        const outPos = this.goalManager.outPoint
                        
                        goal.moveOut(outPos, () => {
                            this.goalManager.onGoalCompleted(goal)
                            if (this.goalManager.isAllCompleted()) {
                                this.onWin()
                                return
                            }
                            
                            // FIX TẠI ĐÂY (Vòng lặp đệ quy): Đợi đĩa mới yên vị mới rút tiếp từ Buffer
                            this.scheduleOnce(() => {
                                if (this.isWin || this.isLose) return;
                                this.checkAutoMatch()
                            }, 0.55);
                        })
                    }
                    else {
                        goal.playImpactEffect();
                    }
                })
            }
        }
    }

    private onLose() {
        print("LOSE")
        this.bufferManager.stopWarning()

        SoundManager.instance.playOneShot(Sounds.Lose)
        this.isLose = true
        super_html_playable.game_end()
        this.navigation.stack.navigate('EndCard')
        this.installGame()
    }

    private onWin() {
        print("WIN")
        this.confetti.active = true
        SoundManager.instance.playOneShot(Sounds.Win)
        this.isWin = true
        super_html_playable.game_end()
        this.navigation.stack.navigate('EndCard')
        this.installGame()
    }

    installGame = () => {
        super_html_playable.download()
    }
}