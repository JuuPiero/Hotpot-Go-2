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

    

    onMatched = () => {

    }


    // public removeTarget(target: Goal) {

    // }


    private spawnDefaultTarget() {
        this.allActiveGoal = [];
        this.targets.clear()
        
        this.count = this.levelData.maxGoalActive < this.levelData.goals.length ? this.levelData.maxGoalActive : this.levelData.goals.length
        this.targetQueue = [...this.levelData.goals]



        const totalWidth = (this.count - 1) * this.spacing

        const startX = -totalWidth / 2;

        for (let i = 0; i < this.count; i++) {
            const node = instantiate(this.gameConfig.goalItemPrefab)
            
            node.setParent(this.node);
            node.name = `target_${i}`

            const x = startX + i * this.spacing;
            node.setPosition(new Vec3(x, -1, 0));

            const goal = node.getComponent(Goal);
            if (goal) {
              
                this.allActiveGoal.push(goal);
                // this.allTargets.splice( this.allTargets.indexOf(this.allTargets[i], 1))
            }
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


