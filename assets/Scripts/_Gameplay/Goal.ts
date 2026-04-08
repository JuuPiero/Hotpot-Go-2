import { _decorator, Component, Label, Node, tween, Vec3 } from 'cc';
import { Food } from './Food';
const { ccclass, property } = _decorator;

@ccclass('Goal')
export class Goal extends Component {
    @property public foodId: string = ''
    @property(Label) public text: Label
    @property([Node]) public placesPos: Node[] = []
    @property(Food) public foods: Food[] = []

    @property public count: number = 0 // đã tới nơi
    private reservedCount: number = 0 // đã đặt slot
    private required: number = 3



    init(foodId: string, required: number) {
        this.foodId = foodId
        this.required = required
        this.count = 0

        this.updateUI()
    }

    addItem(food: Food) {
        this.count++
        this.foods.push(food)
        // this.updateUI()
    }

    getPos() {
        const index = this.reservedCount
        this.reservedCount++  
        return this.placesPos[index].worldPosition.clone()
    }

    isCompleted(): boolean {
        return this.count === this.required
    }

    public updateUI() {
        if (this.text) {
            this.text.string = ` ${this.foodId} ${this.count}/${this.required}`
        }
    }


    public moveOut(target: Node, onDone?: Function) {
        const startPos = this.node.position.clone()
        const upPos = startPos.clone().add3f(0, 2, 0)

        tween(this.node)
            .parallel(
                // Move lên
                tween().to(0.2, {
                    position: upPos
                }),

                // Move tới target
                tween().to(0.4, {
                    position: target.position.clone()
                }),

                // Scale nhỏ lại
                tween().to(0.5, {
                    scale: Vec3.ZERO
                })
            )
            .call(() => {
                onDone?.()
            })
            .start()
    }
}

