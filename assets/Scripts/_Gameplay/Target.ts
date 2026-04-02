import { _decorator, Component, Node } from 'cc';
import { Food } from './Food';
import { EventBus } from '../Core/EventBus';
import { GameEvent } from '../Core/GameEvent';
const { ccclass, property } = _decorator;

@ccclass('Target')
export class Target extends Component {
    @property public foodId: string = ''

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


