import { _decorator, Component, instantiate, Node, Vec3 } from 'cc';
import { EventBus } from '../Core/EventBus';
import { GameEvent } from '../Core/GameEvent';
import { Target } from './Target';
import { GameConfigSA } from './GameConfigSA';
import { LevelDataSA, TargetData } from './LevelDataSA';
import { container, registerValue } from '../Core/DIContainer';
import { print } from '../Core/utils';
import { Food } from './Food';
const { ccclass, property } = _decorator;

@ccclass('TargetManager')
export class TargetManager extends Component {
    
    // @property(Node) public spawnsPos: Node[] = []
    @property public spacing: number = 2
    public count = 0

    @property({type: Target}) public allActiveTarget: Target[] = []

    @property({type: TargetData}) public targetQueue: TargetData[] = []


    public targets: Set<TargetData> = new Set<TargetData>()



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
        registerValue('TargetManager', this)
        this.gameConfig = container.resolve<GameConfigSA>('GameConfig')
        this.levelData = container.resolve<LevelDataSA>('LevelData')
    }

  
    onNewGame = () => {
        this.spawnDefaultTarget()
    }

    

    onMatched = () => {

    }


    public removeTarget(target: Target) {

    }


    private spawnDefaultTarget() {
        this.allActiveTarget = [];
        this.targets.clear()
        
        this.count = this.levelData.maxTarget < this.levelData.targets.length ? this.levelData.maxTarget : this.levelData.targets.length
        this.targetQueue = [...this.levelData.targets]



        const totalWidth = (this.count - 1) * this.spacing

        const startX = -totalWidth / 2;

        for (let i = 0; i < this.count; i++) {
            const node = instantiate(this.gameConfig.targetPrefab)
            
            node.setParent(this.node);
            node.name = `target_${i}`

            const x = startX + i * this.spacing;
            node.setPosition(new Vec3(x, -1, 0));

            const target = node.getComponent(Target);
            if (target) {
              
                this.allActiveTarget.push(target);
                // this.allTargets.splice( this.allTargets.indexOf(this.allTargets[i], 1))
            }
        }
    }



    public getMatchedTarget(food: Food) {
        for (const target of this.allActiveTarget) {
            if(target.foodId === food.id) {
                return target
            }
            
        }
        return null
    }

}


