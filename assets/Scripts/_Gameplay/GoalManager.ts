import { _decorator, Component, instantiate, Node, Vec3 } from 'cc';
import { EventBus } from '../Core/EventBus';
import { GameEvent } from '../Core/GameEvent';
import { Goal } from './Goal';
import { GameConfigSA } from './Config/GameConfigSA';
import { LevelDataSA, GoalData } from './Config/LevelDataSA';
import { container, registerValue } from '../Core/DIContainer';
import { Food } from './Food';
const { ccclass, property } = _decorator;

@ccclass('GoalManager')
export class GoalManager extends Component {
    
    @property public spacing: number = 2
    public count = 0

    @property({type: Goal}) public allActiveGoal: Goal[] = []
    @property({type: GoalData}) public targetQueue: GoalData[] = []

    public targets: Set<GoalData> = new Set<GoalData>()


    protected gameConfig: GameConfigSA = null
    protected levelData: LevelDataSA = null

    protected onEnable(): void {
        EventBus.on(GameEvent.NEW_GAME, this.onNewGame)
        EventBus.on(GameEvent.ON_MATCHED, this.onMatched)
    }
    protected onDisable(): void {
        EventBus.off(GameEvent.NEW_GAME, this.onNewGame)
        EventBus.off(GameEvent.ON_MATCHED, this.onMatched)
    }

    protected onLoad(): void {
        registerValue('GoalManager', this)
        this.gameConfig = container.resolve<GameConfigSA>('GameConfig')
        this.levelData = container.resolve<LevelDataSA>('LevelData')
    }

    onNewGame = () => {
        this.spawnDefaultTarget()
    }

    onMatched = (goal: Goal) => {
        if (!goal) return

        const index = this.allActiveGoal.indexOf(goal)
        if (index !== -1) {
            this.allActiveGoal.splice(index, 1)
        }

        if (this.targetQueue.length > 0) {
            const nextData = this.targetQueue.shift()!
            this.spawnGoal(nextData, this.allActiveGoal.length)
            EventBus.emit(GameEvent.ON_NEW_TARGET_SPAWN, nextData)
        } else if (this.allActiveGoal.length === 0) {
            EventBus.emit(GameEvent.LEVEL_COMPLETED)
        }
    }


    // public removeTarget(target: Goal) {

    // }


    private spawnGoal(data: GoalData, index: number) {
        const node = instantiate(this.gameConfig.goalItemPrefab)
        node.setParent(this.node)
        node.name = `target_${index}`

        const totalWidth = (this.count - 1) * this.spacing
        const startX = -totalWidth / 2
        const x = startX + index * this.spacing
        node.setPosition(new Vec3(x, -1, 0))

        const goal = node.getComponent(Goal)
        if (goal) {
            goal.init({ foodId: data.foodId, quantity: data.quantity || LevelDataSA.MATCH_QUANTITY }, index)
            this.allActiveGoal.push(goal)
        }
    }

    private spawnDefaultTarget() {
        this.allActiveGoal = []
        this.targets.clear()

        this.count = this.levelData.maxGoalActive < this.levelData.goals.length ? this.levelData.maxGoalActive : this.levelData.goals.length
        this.targetQueue = [...this.levelData.goals]

        const totalWidth = (this.count - 1) * this.spacing
        const startX = -totalWidth / 2

        for (let i = 0; i < this.count; i++) {
            const current = this.targetQueue.shift()!
            this.spawnGoal(current, i)
        }
    }



    public getMatchedTarget(food: Food) {
        for (const target of this.allActiveGoal) {
            if(target.foodId === food.id) {
                return target
            }
        }
        return null
    }

}


