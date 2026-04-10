import { _decorator, CCString, Node, Prefab } from 'cc';
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

    @property(Prefab) public matchedEffect: Prefab
    @property(Prefab) public confettiPrefab: Prefab



    @property(Prefab)
    public foods: Prefab[] = []


    public getItemById(id: string): Prefab {
        for (const item of this.foods) {
            const foodNode = item.data as Node 
            const food = foodNode.getComponent(Food)
            if(!food) continue
            if(food.foodId === id) {
                return item
            }
        }
    }


} 