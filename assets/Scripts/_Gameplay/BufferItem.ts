import { _decorator, Component, Node, Quat, Vec3 } from 'cc';
import { Food } from './Food';
const { ccclass, property } = _decorator;

@ccclass('BufferItem')
export class BufferItem extends Component {
    @property({type: Food}) public food: Food = null
    @property(Node) spawnPos: Node;

    public setData(food: Food) {
        this.food = food
    }
}
