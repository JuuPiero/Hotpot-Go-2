import { _decorator, Component, Label, Node, Vec3 } from 'cc';
import { Food } from './Food';
import { EventBus } from '../Core/EventBus';
import { GameEvent } from '../Core/GameEvent';
const { ccclass, property } = _decorator;

@ccclass('Goal')
export class Goal extends Component {
    @property public foodId: string = ''
    @property(Label) public text: Label

    public data: { foodId: string; quantity: number } = { foodId: '', quantity: 3 }
    public count: number = 0
    public foods: Food[] = []
    public placesPos: Node[] = []
    public index: number

    public init(data: { foodId: string; quantity: number }, index: number) {
        this.data = data
        this.foodId = data.foodId
        this.count = 0
        this.index = index
        if (this.text) {
            this.text.string = `${data.foodId} (${data.quantity})`
        }
        this.updateUI()
    }

    public addItem(food: Food) {
        food.node.setParent(this.node)
        food.node.setPosition(this.placesPos[this.count]?.position || new Vec3())
        this.count++
        this.foods.push(food)
        this.updateUI()

        if (this.count >= this.data.quantity) {
            EventBus.emit(GameEvent.ON_MATCHED, this)
        }
    }

    public updateUI() {
        if (this.text) {
            this.text.string = `${this.data.foodId}: ${this.count}/${this.data.quantity}`
        }
    }
}


