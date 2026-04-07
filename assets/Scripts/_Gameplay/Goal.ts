import { _decorator, Component, Label, Node, tween } from 'cc';
import { Food } from './Food';
import { EventBus } from '../Core/EventBus';
import { GameEvent } from '../Core/GameEvent';
const { ccclass, property } = _decorator;

@ccclass('Goal')
export class Goal extends Component {
    @property public foodId: string = ''
    @property(Label) public text: Label
    @property([Node]) public placesPos: Node[] = []

    public count: number = 0
    private required: number = 3
    


    init(foodId: string, required: number) {
        this.foodId = foodId
        this.required = required
        this.count = 0

        this.updateUI()
    }
    addItem(food: Food) {
        // const index = this.count
        this.count++
        this.updateUI()
    }

    getPos() {
        return this.placesPos[this.count - 1].position.clone()
    }

    isCompleted(): boolean {
        return this.count === this.required
    }

    private updateUI() {
        if (this.text) {
            this.text.string = ` ${this.foodId} ${this.count}/${this.required}`
        }
    }

}

