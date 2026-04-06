import { _decorator, CCInteger, CCString, Color, Prefab } from 'cc';
const { ccclass, property } = _decorator;
import { bh } from 'db://scriptable-asset/scriptable_runtime';



@ccclass('GoalData')
export class GoalData {
    @property public foodId: string = '123'
    @property public quantity: number = 1
}


@bh.createAssetMenu('LevelDataSA', 'Config/LevelData')
@bh.scriptable('LevelDataSA')
export class LevelDataSA extends bh.ScriptableAsset {
    public static readonly MATCH_QUANTITY = 3
    
    @property public maxGoalActive: number = 2
    @property(CCInteger) public maxBuffer: number = 4
    @property(CCInteger) public maxItemActive: number = 10
    @property(GoalData) public goals: GoalData[] = []

} 