import { _decorator, Component, Label, Node } from 'cc';
import { Food } from './Food';
import { EventBus } from '../Core/EventBus';
import { GameEvent } from '../Core/GameEvent';
const { ccclass, property } = _decorator;

@ccclass('Goal')
export class Goal extends Component {
    @property public foodId: string = ''
    @property(Label) public text: Label
    @property([Node]) public placesPos: Node[] = []

    private count: number = 0
    private required: number = 3

    init(foodId: string, required: number) {
        this.foodId = foodId
        this.required = required
        this.count = 0

        this.updateUI()
    }
    addItem(food: Food) {
        const index = this.count

        if (this.placesPos[index]) {
            food.node.setParent(this.placesPos[index])
            food.node.setPosition(0, 0, 0)
        } else {
            food.node.setParent(this.node)
        }

        this.count++
        this.updateUI()
    }

    isCompleted(): boolean {
        return this.count >= this.required
    }

    private updateUI() {
        if (this.text) {
            this.text.string = `${this.count}/${this.required}`
        }
    }
}

