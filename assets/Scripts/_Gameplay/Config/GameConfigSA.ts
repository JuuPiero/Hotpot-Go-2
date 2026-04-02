import { _decorator, CCString, Color, Prefab } from 'cc';
const { ccclass, property } = _decorator;
import { bh } from 'db://scriptable-asset/scriptable_runtime';
import { Food } from '../Food';

@bh.createAssetMenu('GameConfigSA', 'Config/GameConfig')
@bh.scriptable('GameConfigSA')
export class GameConfigSA extends bh.ScriptableAsset {
    @property(CCString)
    public storeUrl: string = 'abc.com'

   

    @property(Prefab) public bufferItemPrefab: Prefab;

    @property(Prefab) public goalItemPrefab: Prefab;


    @property(Prefab)
    public foods: Prefab[] = []


    public getItemById(id: string) {
        for (const item of this.foods) {
            const food = item.data.getComponent(Food)
            if(!food) continue
            if(food.id === id) {
                return food
            }
        }
    }

} 