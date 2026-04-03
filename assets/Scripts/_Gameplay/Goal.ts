import { _decorator, Component, Label, Node } from 'cc';
import { Food } from './Food';
import { EventBus } from '../Core/EventBus';
import { GameEvent } from '../Core/GameEvent';
const { ccclass, property } = _decorator;

@ccclass('Goal')
export class Goal extends Component {
    @property public foodId: string = ''
    @property(Label) public text: Label

    public count: number = 0
    public foods: Food[] = []
    public placesPos: Node[] = []
    public index: number

    public addItem(food: Food) {
        food.node.setParent(this.node) 
        this.count++
        this.updateUI();
        if(this.count === 3) {
            EventBus.emit(GameEvent.ON_MATCHED)
        }
    }

    public updateUI() {
        
    }
}


