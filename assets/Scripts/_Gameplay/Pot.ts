import { _decorator, Component, ERigidBodyType, instantiate, Node, tween, Vec3 } from 'cc';
import { Food } from './Food';
import { container, registerValue } from '../Core/DIContainer';
import { GameManager } from './GameManager';
import { EventBus } from '../Core/EventBus';
import { GameEvent } from '../Core/GameEvent';
import { GameConfigSA } from './Config/GameConfigSA';
import { LevelDataSA } from './Config/LevelDataSA';
import { delay, print, shuffle } from '../Core/utils';

const { ccclass, property } = _decorator;

@ccclass('Pot')
export class Pot extends Component {

    @property(Node) public activeContainer: Node;
    @property(Node) public hiddenContainer: Node;
    @property(Node) public spawnPointContainer: Node = null;

    private spawnPoints: Node[] = [];

    private active: Food[] = [];
    private hidden: Food[] = [];
    private reserve: Food[] = [];

    private usedSlots: Map<Food, Node> = new Map();     // active -> slot
    private hiddenSlots: Map<Node, Food> = new Map();   // slot -> hidden

    private maxActive: number = 0;

    protected gameManager: GameManager = null;
    protected gameConfig: GameConfigSA = null;

    onLoad() {
        registerValue('Pot', this);

        this.gameManager = container.resolve<GameManager>('GameManager');
        this.gameConfig = this.gameManager.gameConfig;

        this.spawnPoints = this.spawnPointContainer.children;
    }

    protected onEnable(): void {
        EventBus.on(GameEvent.NEW_GAME, this.onNewGame);
    }

    protected onDisable(): void {
        EventBus.off(GameEvent.NEW_GAME, this.onNewGame);
    }

    // =========================
    // INIT
    // =========================
    onNewGame = () => {
        this.clear();

        const level = this.gameManager.currentLevelData;
        this.maxActive = level.maxItemActive;

        const allFoods: Food[] = [];

        // create all food
        for (const goal of level.goals) {
            const prefab = this.gameConfig.getItemById(goal.foodId);
            const total = goal.quantity * LevelDataSA.MATCH_QUANTITY;

            for (let i = 0; i < total; i++) {
                const node = instantiate(prefab);
                const food = node.getComponent(Food);
                allFoods.push(food);
            }
        }

        shuffle(allFoods);
        this.reserve = allFoods;

        this.active = [];
        this.hidden = [];

        const activeCount = Math.min(this.maxActive, this.reserve.length);
        const hiddenCount = Math.min(this.maxActive, this.reserve.length - activeCount);

        // lấy active
        for (let i = 0; i < activeCount; i++) {
            const f = this.reserve.pop();
            if (f) this.active.push(f);
        }

        // lấy hidden
        for (let i = 0; i < hiddenCount; i++) {
            const f = this.reserve.pop();
            if (f) this.hidden.push(f);
        }

        // spawn theo slot
        for (let i = 0; i < this.spawnPoints.length; i++) {
            const slot = this.spawnPoints[i];

            if (this.active[i]) {
                this.spawnActiveAtSlot(this.active[i], slot);
            }

            if (this.hidden[i]) {
                this.spawnHiddenAtSlot(this.hidden[i], slot);
            }
        }
    }

    // =========================
    // SPAWN ACTIVE
    // =========================
    private spawnActiveAtSlot(food: Food, slot: Node) {

        tween(food.node).stop()
        this.usedSlots.set(food, slot);

        food.node.setParent(this.activeContainer);

        const pos = slot.worldPosition.clone();
        pos.y = this.activeContainer.worldPosition.y;

        food.node.setWorldPosition(pos);

        food.rb.type = ERigidBodyType.KINEMATIC;
        food.floating.enabled = false;
        food.clickFunc = () => this.onFoodClicked(food);
        // hiệu ứng nổi
        food.node.setScale(0.6, 0.6, 0.6);

        tween(food.node)
            .to(0.5, {
                worldPosition: pos,
                scale: new Vec3(1, 1, 1)
            })
            .call(() => {
                food.rb.type = ERigidBodyType.DYNAMIC;
                food.floating.enabled = true;
            })
            .start();
    }

    // =========================
    // SPAWN HIDDEN
    // =========================
    private spawnHiddenAtSlot(food: Food, slot: Node) {

        food.node.setParent(this.hiddenContainer);

        const pos = slot.worldPosition.clone();
        pos.y = this.hiddenContainer.worldPosition.y;

        food.node.setWorldPosition(pos);
        food.node.setScale(0.7, 0.7, 0.7)
        food.rb.type = ERigidBodyType.KINEMATIC;
        food.floating.enabled = false;


        this.hiddenSlots.set(slot, food);
    }

    // =========================
    // CLICK
    // =========================
    private onFoodClicked(food: Food) {
        EventBus.emit(GameEvent.SELECT_FOOD, food);

    }

    public removeFood(food) {
        const slot = this.usedSlots.get(food);
        this.usedSlots.delete(food);
        this.removeActive(food);
        this.popHiddenToActive(slot);
        this.spawnNewHidden(slot);
    }


    // =========================
    // POP HIDDEN → ACTIVE
    // =========================
    public popHiddenToActive(slot: Node | undefined) {
        if (!slot) return;

        const food = this.hiddenSlots.get(slot);
        if (!food) return;

        this.hiddenSlots.delete(slot);

        this.active.push(food);
        this.usedSlots.set(food, slot);

        food.node.setParent(this.activeContainer);

        const target = slot.worldPosition.clone();
        target.y = this.activeContainer.worldPosition.y;

        food.rb.type = ERigidBodyType.KINEMATIC;
        food.floating.enabled = false;

        food.node.setScale(0.4, 0.4, 0.4);

        food.clickFunc = () => this.onFoodClicked(food);

        tween(food.node).stop()
        tween(food.node)
            .to(0.3, {
                worldPosition: target,
                scale: new Vec3(1, 1, 1)
            }, { easing: 'quadOut' })
            .call(() => {
                food.rb.type = ERigidBodyType.DYNAMIC;
                food.floating.enabled = true;

            })
            .start();
    }
    // =========================
    // SPAWN HIDDEN MỚI
    // =========================
    public spawnNewHidden(slot: Node | undefined) {
        if (!slot) return;
        if (this.reserve.length === 0) return;


        const food = this.reserve.pop()!;
        this.hidden.push(food);
        this.spawnHiddenAtSlot(food, slot);
    }

    // =========================
    // REMOVE ACTIVE
    // =========================
    private removeActive(food: Food) {
        const index = this.active.indexOf(food);
        if (index !== -1) {
            this.active.splice(index, 1);
        }
    }

    // =========================
    // CLEAR
    // =========================
    private clear() {

        for (const food of this.active) {
            food.node.destroy();
        }

        for (const food of this.hidden) {
            food.node.destroy();
        }

        this.active = [];
        this.hidden = [];
        this.reserve = [];

        this.usedSlots.clear();
        this.hiddenSlots.clear();
    }
}