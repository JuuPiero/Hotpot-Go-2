import { _decorator, CCString, Color, Prefab } from 'cc';
const { ccclass, property } = _decorator;
import { bh } from 'db://scriptable-asset/scriptable_runtime';



@ccclass('TargetData')
export class TargetData {
    @property public foodId: string = '123'
    @property public quantity: number = 1
}



@bh.createAssetMenu('LevelDataSA', 'Config/LevelData')
@bh.scriptable('LevelDataSA')
export class LevelDataSA extends bh.ScriptableAsset {
    public static readonly MATCH_QUANTITY = 3
    
    @property public maxTarget: number = 2
    @property public maxQueue: number = 4

    @property public maxItemActive: number = 10

    @property(TargetData) public targets: TargetData[] = []

} 