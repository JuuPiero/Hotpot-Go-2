import { _decorator, Component, ERigidBodyType, instantiate, Node, tween, Vec3 } from 'cc';
import { Food, FoodState } from './Food';
import { container, registerValue } from '../Core/DIContainer';
import { GameManager } from './GameManager';
import { EventBus } from '../Core/EventBus';
import { GameEvent } from '../Core/GameEvent';
import { GameConfigSA } from './Config/GameConfigSA';
import { LevelDataSA } from './Config/LevelDataSA';
import { print, shuffle } from '../Core/utils';

const { ccclass, property, executionOrder } = _decorator;

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
    // =========================
    // INIT
    // =========================
    onNewGame = () => {
        print('Pot')
        this.clear();

        const level = this.gameManager.currentLevelData;
        this.maxActive = level.maxItemActive;

        // 1. Khởi tạo các tệp bài
        const earlyDeck: Food[] = [];
        const midDeck: Food[] = [];
        const lateDeck: Food[] = [];

        // Lấy số lượng goal được hiển thị ngay khi bắt đầu
        const initialGoalCount = level.maxGoalActive || 3;

        // 2. Phân loại Food vào tệp dựa trên tiến độ Goal
        level.goals.forEach((goal, index) => {
            const prefab = this.gameConfig.getItemById(goal.foodId);
            const total = goal.quantity * LevelDataSA.MATCH_QUANTITY;

            for (let i = 0; i < total; i++) {
                const node = instantiate(prefab);
                const food = node.getComponent(Food);

                if (index < initialGoalCount) {
                    // Thuộc những Goal đầu tiên -> Chắc chắn phải có mặt sớm
                    earlyDeck.push(food);
                } else if (index < initialGoalCount + 2) {
                    // Những Goal gối đầu (sắp xuất hiện) -> Cho ra ở giữa game
                    midDeck.push(food);
                } else {
                    // Những Goal nằm tít phía sau -> Phải đào sâu mới thấy
                    lateDeck.push(food);
                }
            }
        });

        // 3. Trộn (Shuffle) độc lập từng tệp
        shuffle(earlyDeck);
        shuffle(midDeck);
        shuffle(lateDeck);

        // (Tùy chọn) Thêm một chút "Nhiễu" (Noise) để game không bị quá dễ đoán
        // Đảo 1-2 item của midDeck vào earlyDeck để rác nhẹ đầu game
        if (midDeck.length > 0 && earlyDeck.length > 0) {
            const noiseItem = midDeck.pop();
            if (noiseItem) earlyDeck.unshift(noiseItem); // Nhét vào cuối của tệp xuất hiện đầu
        }

        // 4. Ghép tệp vào Reserve. 
        // Do hàm pop() lấy từ mảng cuối lên, earlyDeck phải đặt ở cuối cùng
        this.reserve = [...lateDeck, ...midDeck, ...earlyDeck];

        const activeCount = Math.min(this.maxActive, this.reserve?.length);
        const hiddenCount = Math.min(this.maxActive, this.reserve?.length - activeCount);

        // ... [Giữ nguyên đoạn code spawn Active và Hidden phía dưới] ...
        for (let i = 0; i < activeCount; i++) {
            const food = this.reserve.pop();
            const slot = this.spawnPoints[i];
            if (food && slot) {
                this.active.push(food);
                this.spawnActiveAtSlot(food, slot);
            }
        }

        for (let i = 0; i < hiddenCount; i++) {
            const food = this.reserve.pop();
            const slot = this.spawnPoints[i];
            if (food && slot) {
                this.hidden.push(food);
                this.spawnHiddenAtSlot(food, slot);
            }
        }
    }
    // =========================
    // SPAWN ACTIVE
    // =========================
    private spawnActiveAtSlot(food: Food, slot: Node) {
        this.usedSlots.set(food, slot);
        food.node.setParent(this.activeContainer);

        const targetPos = slot.worldPosition.clone();
        targetPos.y = this.activeContainer.worldPosition.y;

        // Đặt vị trí xuất phát ở dưới thấp (dưới mặt nước)
        const startPos = targetPos.clone();
        startPos.y -= 2; // Thấp xuống 2 đơn vị hoặc dùng hiddenContainer.worldPosition.y

        food.node.setWorldPosition(startPos);
        food.node.setScale(0.5, 0.5, 0.5); // Bắt đầu nhỏ

        food.rb.type = ERigidBodyType.KINEMATIC;
        food.floating.enabled = false;
        food.clickFunc = () => this.onFoodClicked(food);

        tween(food.node)
            .to(0.6, {
                worldPosition: targetPos,
                scale: new Vec3(1, 1, 1)
            }, { easing: 'backOut' }) // backOut tạo độ nảy khi trồi lên mặt nước
            .call(() => {
                food.rb.type = ERigidBodyType.DYNAMIC;
                food.floating.enabled = true;
                food.state = FoodState.IDLE
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
        food.node.setScale(0.8, 0.8, 0.8)
        food.rb.type = ERigidBodyType.KINEMATIC;
        food.floating.enabled = false;


        this.hiddenSlots.set(slot, food);
    }


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

    public popHiddenToActive(slot: Node | undefined) {
        if (!slot) return;

        let food = this.hiddenSlots.get(slot);

        // Nếu slot này hết hidden, tìm hidden ở slot GẦN NHẤT
        if (!food) {
            if (this.hiddenSlots.size > 0) {
                let minDistance = Number.MAX_VALUE;
                let closestSlot: Node | null = null;
                let closestFood: Food | null = null;

                const targetPos = slot.worldPosition;

                // Duyệt qua tất cả các slot đang có food ẩn
                for (const [otherSlot, otherFood] of this.hiddenSlots.entries()) {
                    const dist = Vec3.distance(targetPos, otherSlot.worldPosition);
                    if (dist < minDistance) {
                        minDistance = dist;
                        closestSlot = otherSlot;
                        closestFood = otherFood;
                    }
                }

                if (closestSlot && closestFood) {
                    food = closestFood;
                    this.hiddenSlots.delete(closestSlot);
                } else {
                    return;
                }
            } else {
                return;
            }
        } else {
            this.hiddenSlots.delete(slot);
        }

        const hIdx = this.hidden.indexOf(food);
        if (hIdx > -1) this.hidden.splice(hIdx, 1);

        this.active.push(food);
        this.usedSlots.set(food, slot);
        food.node.setParent(this.activeContainer);

        // Đặt food về tọa độ X, Z của slot mục tiêu NGAY LẬP TỨC ở tầng ẩn
        const startPos = slot.worldPosition.clone();
        startPos.y = this.hiddenContainer.worldPosition.y;

        const targetPos = slot.worldPosition.clone();
        targetPos.y = this.activeContainer.worldPosition.y;

        food.node.setWorldPosition(startPos); // Nhảy bộp về đúng vị trí X, Z dưới đáy
        food.node.setScale(0.6, 0.6, 0.6);
        food.clickFunc = () => this.onFoodClicked(food);
        food.state = FoodState.IDLE

        // Chỉ chạy tween trồi lên theo chiều dọc
        this.startVerticalPop(food, targetPos);
    }
    // Hàm phụ để xử lý hiệu ứng trồi lên và bật vật lý
    private startVerticalPop(food: Food, targetPos: Vec3) {
        food.node.setScale(0.4, 0.4, 0.4);

        // 1. TẮT va chạm tạm thời để không "đấm" các đồ ăn khác văng đi
        if (food.colliders) {
            food.colliders.forEach(col => col.enabled = false);
        }

         tween(food.node)
            .to(0.4, {
                worldPosition: targetPos,
                scale: new Vec3(1, 1, 1)
            }, { easing: 'quadOut' }) // 2. Bỏ backOut, dùng quadOut để trồi lên êm ái, không bị lố đà
            .call(() => {
                food.rb.type = ERigidBodyType.DYNAMIC;
                if (food.rb) {
                    food.rb.setLinearVelocity(Vec3.ZERO);
                    food.rb.setAngularVelocity(Vec3.ZERO);
                    food.rb.linearFactor = new Vec3(0.1, 1, 0.1); // KHÓA TRỤC NGANG
                }
                if (food.colliders) {
                    food.colliders.forEach(col => col.enabled = true);
                }
                food.floating.enabled = true;
            })
            .start();
    }
    // =========================
    // SPAWN HIDDEN MỚI
    // =========================
    public spawnNewHidden(slot: Node | undefined) {
        if (this.reserve.length === 0) return;

        let targetSlot = slot;

        if (slot && this.hiddenSlots.has(slot)) {
            targetSlot = this.spawnPoints.find(s => !this.hiddenSlots.has(s));
        }

        if (!targetSlot) return; // Không còn chỗ để chứa hidden mới

        const food = this.reserve.pop()!;
        this.hidden.push(food);
        this.spawnHiddenAtSlot(food, targetSlot);
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