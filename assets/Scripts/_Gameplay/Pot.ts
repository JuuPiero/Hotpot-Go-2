import { _decorator, Component, ERigidBodyType, instantiate, Node, tween, Vec3 } from 'cc';
import { Food } from './Food';
import { container, registerValue } from '../Core/DIContainer';
import { GameManager } from './GameManager';
import { EventBus } from '../Core/EventBus';
import { GameEvent } from '../Core/GameEvent';
import { GameConfigSA } from './Config/GameConfigSA';
import { LevelDataSA } from './Config/LevelDataSA';
import { print, shuffle } from '../Core/utils';

const { ccclass, property } = _decorator;

@ccclass('Pot')
export class Pot extends Component {
    @property(Food)
    public hidden: Food[] = []   // layer 2
    @property(Food)
    public active: Food[] = []   // layer 1

    private reserve: Food[] = [] // chưa spawn


    @property(Node) public activeContainer: Node;
    @property(Node) public hiddenContainer: Node;




    private maxActive: number = 0

    protected gameManger: GameManager = null
    protected gameConfig: GameConfigSA = null


    @property hiddenY = -1.5   // đáy nồi
    @property activeY = 0      // mặt nước



    onLoad() {
        registerValue('Pot', this)
        this.gameManger = container.resolve<GameManager>('GameManager')
        this.gameConfig = this.gameManger.gameConfig
    }

    protected onEnable(): void {
        EventBus.on(GameEvent.NEW_GAME, this.onNewGame)
    }

    protected onDisable(): void {
        EventBus.off(GameEvent.NEW_GAME, this.onNewGame)
    }

    onNewGame = () => {
        print("Pot")
        this.clear()

        const level = this.gameManger.currentLevelData
        this.maxActive = level.maxItemActive

        const allFoods: Food[] = []

        for (const goal of level.goals) {
            const prefab = this.gameConfig.getItemById(goal.foodId)
            const total = goal.quantity * LevelDataSA.MATCH_QUANTITY

            for (let i = 0; i < total; i++) {
                const node = instantiate(prefab)
                const food = node.getComponent(Food)
                allFoods.push(food)
            }
        }



        shuffle(allFoods)

        this.reserve = allFoods

        //  CHIA 2 LAYER CHUẨN
        this.active = []
        this.hidden = []
        const total = this.reserve.length

        const activeCount = Math.min(this.maxActive, total)
        const hiddenCount = Math.min(this.maxActive, total - activeCount)

        for (let i = 0; i < activeCount; i++) {
            const f = this.reserve.pop()
            if (f) this.active.push(f)
        }

        for (let i = 0; i < hiddenCount; i++) {
            const f = this.reserve.pop()
            if (f) this.hidden.push(f)
        }

        this.active.forEach(f => this.spawnActive(f))
        this.hidden.forEach(f => this.spawnHidden(f))
    }
    private getRandomPos(y: number) {
        const radius = 2

        const angle = Math.random() * Math.PI * 2
        const r = Math.sqrt(Math.random())

        return new Vec3(
            Math.cos(angle) * r * radius,
            y,
            Math.sin(angle) * r * radius
        )
    }

    private spawnActive(food: Food | undefined) {
        if (!food) return

        food.rb.type = ERigidBodyType.DYNAMIC
        food.floating.enabled = true

        food.node.setParent(this.activeContainer)
        const radius = 1.5

        const angle = Math.random() * Math.PI * 2
        const r = Math.sqrt(Math.random())

        const x = Math.cos(angle) * r * radius
        const z = Math.sin(angle) * r * radius

        food.node.setPosition(new Vec3(x, 0, z))
        // food.node.setPosition(this.getRandomPos(this.activeY))

        food.setClickable(true)
        food.clickFunc = () => this.onFoodClicked(food)
    }

    private spawnHidden(food: Food) {
        food.rb.type = ERigidBodyType.KINEMATIC
        food.floating.enabled = false

        food.node.setParent(this.hiddenContainer)

        const radiusX = 2
        const radiusZ = 2

        const angle = Math.random() * Math.PI * 2
        const r = Math.sqrt(Math.random())

        const x = Math.cos(angle) * r * radiusX
        const z = Math.sin(angle) * r * radiusZ

        food.node.setPosition(new Vec3(x, 0, z))
        food.setClickable(false)
        food.clickFunc = () => this.onFoodClicked(food)
    }

    removeActive(food: Food) {
        const index = this.active.indexOf(food)
        if (index !== -1) {
            this.active.splice(index, 1)
        }
    }


    private clear() {
        // destroy toàn bộ node cũ
        for (const food of this.active) {
            food.node.destroy()
        }
        for (const food of this.hidden) {
            food.node.destroy()
        }

        this.active = []
        this.hidden = []
    }

    private onFoodClicked(food: Food) {
        this.removeActive(food)

        EventBus.emit(GameEvent.SELECT_FOOD, food)

        //  hidden -> active
        this.popHiddenToActive()

        //  spawn hidden mới
        this.spawnNewHidden()
    }


    private popHiddenToActive() {
        if (this.hidden.length === 0) return

        const food = this.hidden.pop()!

        this.active.push(food)
        food.node.setParent(this.activeContainer)

        const radius = 1.5

        const angle = Math.random() * Math.PI * 2
        const r = Math.sqrt(Math.random())

        const x = Math.cos(angle) * r * radius
        const z = Math.sin(angle) * r * radius

        food.node.setPosition(new Vec3(x, 0, z))
        food.rb.type = ERigidBodyType.DYNAMIC
        food.floating.enabled = true
        food.setClickable(true)

        // tween(food.node)
        //     .to(0.2, {
        //         position: new Vec3(x, 0, z)
        //     }, { easing: 'quadOut' })
        //     .start().call(() => {


        //     })
    }

    private spawnNewHidden() {
        if (this.reserve.length === 0) return

        const food = this.reserve.pop()!

        this.hidden.push(food)
        this.spawnHidden(food)
    }

}
