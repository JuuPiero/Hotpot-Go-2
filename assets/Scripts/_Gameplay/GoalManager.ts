import { _decorator, Component, instantiate, Node, Vec3 } from 'cc';
import { EventBus } from '../Core/EventBus';
import { GameEvent } from '../Core/GameEvent';
import { Goal } from './Goal';
import { GameConfigSA } from './Config/GameConfigSA';
import { LevelDataSA, GoalData } from './Config/LevelDataSA';
import { container, registerValue } from '../Core/DIContainer';
import { print } from '../Core/utils';
import { SoundManager } from '../Core/SoundManager';
import { Sounds } from '../Core/Sounds';

const { ccclass, property } = _decorator;

@ccclass('GoalManager')
export class GoalManager extends Component {
    @property public spacing: number = 2
    @property(Node) public outPoint: Node
    @property(Node) public inPoint: Node


    private gameConfig: GameConfigSA = null
    private levelData: LevelDataSA = null
    
    @property(Goal) public goals: Goal[] = []           // active goals
    public goalQueue: any[] = []       // queue từ level data

    protected onLoad(): void {
        registerValue('GoalManager', this)
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
        print('Goal')
        this.clear()

        this.goalQueue = [...this.levelData.goals]

        this.spawnInitialGoals()
    }

    private spawnInitialGoals() {
        const max = this.levelData.maxGoalActive

        for (let i = 0; i < max; i++) {
            this.spawnNextGoal()
        }

        this.layout()
    }

    spawnNextGoal = () => {
        if (this.goalQueue.length === 0) return
        const data: GoalData = this.goalQueue.shift()
        const node = instantiate(this.gameConfig.goalItemPrefab)
        node.setParent(this.node)

        const goal = node.getComponent(Goal)
        goal.init(data.foodId, LevelDataSA.MATCH_QUANTITY)

        this.goals.push(goal)
    }
    private layout() {
        const totalWidth = (this.goals.length - 1) * this.spacing
        const startX = -totalWidth / 2

        for (let i = 0; i < this.goals.length; i++) {
            const x = startX + i * this.spacing
            this.goals[i].node.setPosition(new Vec3(x, 0, 0))
        }
    }

    private clear() {
        for (const goal of this.goals) {
            goal.node.destroy()
        }

        this.goals = []
        this.goalQueue = []
    }

    findMatch(foodId: string): Goal | null {
        for (const goal of this.goals) {
            if (goal.foodId === foodId && !goal.isCompleted()) {
                return goal
            }
        }
        return null
    }


    public onGoalCompleted(goal: Goal) {
        // EventBus.emit(GameEvent.ON_GOAL_COMPLETED)
        SoundManager.instance.playOneShot(Sounds.Success)

        const index = this.goals.indexOf(goal)
        // remove nhưng GIỮ index
        this.goals.splice(index, 1)

        // spawn vào đúng vị trí đó
        this.spawnNextGoalAt(index)
    }


    spawnNextGoalAt(index: number) {
        if (this.goalQueue.length === 0) return

        const data = this.goalQueue.shift()

        const node = instantiate(this.gameConfig.goalItemPrefab)
        node.setParent(this.node)
        node.setPosition(this.inPoint.position.clone())
        
        const goal = node.getComponent(Goal)
        goal.init(data.foodId, LevelDataSA.MATCH_QUANTITY)

        this.goals.splice(index, 0, goal)

        this.layout()
    }

    isAllCompleted(): boolean {
        return this.goals.length === 0 && this.goalQueue.length === 0
    }
}