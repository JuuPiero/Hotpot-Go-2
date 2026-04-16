import { _decorator, Component, ERigidBodyType, instantiate, Node, Tween, tween, Vec3 } from 'cc';
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
        // EventBus.on(GameEvent.NEW_GAME, this.onNewGame);
    }

    protected onDisable(): void {
        // EventBus.off(GameEvent.NEW_GAME, this.onNewGame);
    }

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

        for (let i = 0; i < activeCount; i++) {
            const food = this.reserve.pop();
            const slot = this.spawnPoints[i];
            if (food && slot) {
                this.active.push(food);
                this.spawnActiveAtSlot(food, slot, i * 0.05);
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
    private spawnActiveAtSlot(food: Food, slot: Node, delay: number = 0) {
        this.usedSlots.set(food, slot);
        food.node.setParent(this.activeContainer);

        const targetPos = slot.worldPosition.clone();
        targetPos.y = this.activeContainer.worldPosition.y;

        targetPos.x += (Math.random() - 0.5) * 0.2;
        targetPos.z += (Math.random() - 0.5) * 0.2;

        // ===============================================
        // BÍ QUYẾT: KÉO NHẸ ĐỒ ĂN HƯỚNG VỀ TÂM NỒI ĐỂ NÉ TƯỜNG
        // ===============================================
        const potCenter = this.activeContainer.worldPosition;
        const dirToCenter = new Vec3();
        Vec3.subtract(dirToCenter, potCenter, targetPos);
        dirToCenter.y = 0; // Chỉ tính trên mặt phẳng ngang (X, Z)

        // Kéo nó vào giữa khoảng 0.4 đơn vị (đủ an toàn để bung scale 1.0 mà không chạm vách)
        if (dirToCenter.length() > 0.1) {
            dirToCenter.normalize().multiplyScalar(0.4); 
            targetPos.add(dirToCenter);
        }
        // ===============================================

        // Chốt startPos theo targetPos vừa tính để nó bay thẳng đứng lên
        const startPos = targetPos.clone();
        startPos.y -= 2;

        food.node.setWorldPosition(startPos);
        food.clickFunc = () => this.onFoodClicked(food);
        food.floating.enabled = false;

        this.startVerticalPop(food, targetPos);
    }

    // =========================
    // SPAWN HIDDEN
    // =========================
    private spawnHiddenAtSlot(food: Food, slot: Node) {

        food.node.setParent(this.hiddenContainer);

        const pos = slot.worldPosition.clone();
        pos.y = this.hiddenContainer.worldPosition.y;

        food.node.setWorldPosition(pos);
        food.node.setScale(0.63, 0.63, 0.63)
        food.rb.type = ERigidBodyType.KINEMATIC;
        food.floating.enabled = false;

        this.hiddenSlots.set(slot, food);
    }




    private onFoodClicked(food: Food) {
        EventBus.emit(GameEvent.SELECT_FOOD, food);

    }

    public removeFood(food: Food) {
        const slot = this.usedSlots.get(food);

        // Đã xóa phần lấy clickPos đi
        this.usedSlots.delete(food);
        this.removeActive(food);

        // Chỉ truyền slot xuống hàm pop
        this.popHiddenToActive(slot);
        this.spawnNewHidden(slot);
    }

    // Xóa tham số clickPos ở đây
    public popHiddenToActive(slot: Node | undefined) {
        if (!slot) return;

        let food = this.hiddenSlots.get(slot);

        if (!food) {
            if (this.hiddenSlots.size > 0) {
                let minDistance = Number.MAX_VALUE;
                let closestSlot: Node | null = null;
                let closestFood: Food | null = null;

                const targetPos = slot.worldPosition;

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

        // ===============================================
        // LẤY TỌA ĐỘ TỪ SLOT CHỨ KHÔNG LẤY TỪ CLICK NỮA
        // ===============================================
        const targetPos = slot.worldPosition.clone();
        targetPos.y = this.activeContainer.worldPosition.y;

        // Lệch tọa độ X, Z một chút xíu (giống hàm spawnActive) để lỡ có cục nào đang trôi dạt ngang qua 
        // thì cục trồi lên sẽ hất cục kia ra, không bị kẹt đè lên nhau
        targetPos.x += (Math.random() - 0.5) * 0.2;
        targetPos.z += (Math.random() - 0.5) * 0.2;

        const startPos = targetPos.clone();
        startPos.y = this.hiddenContainer.worldPosition.y;

        food.node.setWorldPosition(startPos);
        food.node.setScale(0.6, 0.6, 0.6);
        food.clickFunc = () => this.onFoodClicked(food);
        food.state = FoodState.IDLE

        this.startVerticalPop(food, targetPos);
    }
    // protected onDestroy(): void {
    //     Tween.stopAllByTarget(this.node);

    //     // 2. Dừng thêm các tween chạy trên object ảo (ví dụ tween lộn vòng flipObj)
    //     // Bằng cách gọi stop() trực tiếp từ biến lưu trữ nếu chúng đang tồn tại
    //     // if (this.moveTween) this.moveTween.stop();
    //     // if (this.rotTween) this.rotTween.stop();
    // }
 private startVerticalPop(food: Food, targetPos: Vec3, onDone?: Function) {
    food.node.setScale(0.5, 0.5, 0.5);
    food.rb.type = ERigidBodyType.KINEMATIC;
    if (food.colliders) {
        food.colliders.forEach(col => col.enabled = true);
    }

    // CHỈNH SỬA TẠI ĐÂY:
    const axis = 0; // Trục X
    const flipDir = Math.random() > 0.5 ? 1 : -1;

    // Các góc đích giúp vật thể nằm ngang hoặc dọc
    // 270 độ = quay 3/4 vòng
    // 360 độ = quay đúng 1 vòng (về vị trí ban đầu)
    // 450 độ = quay 1 vòng + 1/4 vòng
    const anchors = [270, 360, 240, 90, 180];
    const pickedAngle = anchors[Math.floor(Math.random() * anchors.length)];
    const targetAngle = pickedAngle * flipDir;

    const startEuler = food.node.eulerAngles.clone();
    let flipObj = { angle: 0 };

    // Tween xoay
    food.rotTween = tween(flipObj)
        .to(1.5, { angle: targetAngle }, { // Giảm xuống 1.5s cho cảm giác "nảy" hơn
            easing: 'quadOut',
            onUpdate: (target: any) => {
                const currentEuler = startEuler.clone();
                if (axis === 0) currentEuler.x += target.angle;
                else if (axis === 1) currentEuler.y += target.angle;
                else currentEuler.z += target.angle;

                food.node?.setRotationFromEuler(currentEuler);
            }
        })
        .start();

    // Tween di chuyển lên
    tween(food.node)
        .to(1.5, {
            worldPosition: targetPos,
            scale: new Vec3(1, 1, 1)
        }, { easing: 'quadOut' })
        .call(() => {
            food.rb.type = ERigidBodyType.DYNAMIC;
            if (food.rb) {
                food.rb.setLinearVelocity(Vec3.ZERO);
                food.rb.setAngularVelocity(Vec3.ZERO);
            }
            food.floating.resetAnchor();
            food.floating.enabled = true;
            food.state = FoodState.IDLE;
            onDone?.();
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

    private removeActive(food: Food) {
        const index = this.active.indexOf(food);
        if (index !== -1) {
            this.active.splice(index, 1);
        }
    }

    public getActiveFoods(): Food[] {
        return this.active;
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