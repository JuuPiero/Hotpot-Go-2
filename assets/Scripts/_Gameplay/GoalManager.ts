import { _decorator, Component, instantiate, Node, Vec3 } from 'cc';
import { EventBus } from '../Core/EventBus';
import { GameEvent } from '../Core/GameEvent';
import { Goal } from './Goal';
import { GameConfigSA } from './Config/GameConfigSA';
import { LevelDataSA, GoalData } from './Config/LevelDataSA';
import { container, registerValue } from '../Core/DIContainer';
import { Food } from './Food';
import { print } from '../Core/utils';

const { ccclass, property } = _decorator;

@ccclass('GoalManager')
export class GoalManager extends Component {
    @property public spacing: number = 2

    private gameConfig: GameConfigSA = null
    private levelData: LevelDataSA = null

    private goals: Goal[] = []           // active goals
    private goalQueue: any[] = []       // queue từ level data

    protected onLoad(): void {
        registerValue('GoalManager', this)
        this.gameConfig = container.resolve<GameConfigSA>('GameConfig')
        this.levelData = container.resolve<LevelDataSA>('LevelData')
    }

    protected start(): void {
        
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

    private spawnNextGoal() {
        if (this.goalQueue.length === 0) return

        const data = this.goalQueue.shift()

        const node = instantiate(this.gameConfig.goalItemPrefab)
        node.setParent(this.node)

        const goal = node.getComponent(Goal)
        goal.init(data.foodId, data.quantity * LevelDataSA.MATCH_QUANTITY)

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

    addItemToGoal(food: Food): boolean {
        const goal = this.findMatch(food.foodId)
        if (!goal) return false

        goal.addItem(food)

        if (goal.isCompleted()) {
            this.onGoalCompleted(goal)
        }

        return true
    }

    private onGoalCompleted(goal: Goal) {
        this.goals = this.goals.filter(g => g !== goal)

        // spawn goal mới
        this.spawnNextGoal()

        this.layout()

        // TODO: emit event nếu cần
    }

    isAllCompleted(): boolean {
        return this.goals.length === 0 && this.goalQueue.length === 0
    }
}


