import { _decorator, Component, instantiate, Node, Vec3, tween } from 'cc';
import { EventBus } from '../Core/EventBus';
import { GameEvent } from '../Core/GameEvent';
import { Goal } from './Goal';
import { GameConfigSA } from './Config/GameConfigSA';
import { LevelDataSA, GoalData } from './Config/LevelDataSA';
import { container, registerValue } from '../Core/DIContainer';
import { print } from '../Core/utils';
import { Food } from './Food';

const { ccclass, property, executionOrder } = _decorator;

@ccclass('GoalManager')
export class GoalManager extends Component {
    @property public spacing: number = 2
    @property(Node) public outPoint: Node
    @property(Node) public inPoint: Node

    private gameConfig: GameConfigSA = null
    private levelData: LevelDataSA = null

    @property(Goal) public goals: Goal[] = []
    public goalQueue: GoalData[] = []

    // MỚI: Lưu lại các tọa độ cố định của các Slot
    private slotPositions: Vec3[] = []

    protected onLoad(): void {
        registerValue('GoalManager', this)
    }

    protected onEnable(): void {
        this.gameConfig = container.resolve<GameConfigSA>('GameConfig')
        this.levelData = container.resolve<LevelDataSA>('LevelData')
        EventBus.on(GameEvent.NEW_GAME, this.onNewGame)
    }

    protected onDisable(): void {
        EventBus.off(GameEvent.NEW_GAME, this.onNewGame)
    }

    onNewGame = () => {
        print('Goal')
        this.clear()

        this.goalQueue = [...this.levelData.goals]

        this.spawnInitialGoals()
    }

    private spawnInitialGoals() {
        const max = this.levelData.maxGoalActive

        const totalWidth = (max - 1) * this.spacing
        const startX = -totalWidth / 2

        for (let i = 0; i < max; i++) {
            const x = startX + i * this.spacing
            this.slotPositions[i] = new Vec3(x, 0, 0)

            if (this.goalQueue.length > 0) {
                // Đầu game thì đặt thẳng vào slotPosition
                const goal = this.createGoalFromQueue(this.slotPositions[i])

                // Trả scale về 1 vì đầu game không cần bay từ inPoint ra
                goal.node.setScale(1, 1, 1)

                this.goals[i] = goal
            } else {
                this.goals[i] = null
            }
        }
    }
    // Hàm phụ: Sinh Goal từ Queue để tái sử dụng code
    private createGoalFromQueue(startPos: Vec3): Goal {
        const data = this.goalQueue.shift()
        const node = instantiate(this.gameConfig.goalItemPrefab)

        // FIX GIẬT MÀN HÌNH: Set kích thước và vị trí TRƯỚC KHI setParent
        node.setScale(0, 0, 0)
        node.setPosition(startPos)

        node.setParent(this.node) // Lúc này đưa vào Scene nó đang tàng hình (scale = 0), cực kỳ an toàn

        const food = this.gameConfig.getItemById(data.foodId).data.getComponent(Food)
        const icon = food.getIcon()

        const goal = node.getComponent(Goal)
        goal.init(data.foodId, LevelDataSA.MATCH_QUANTITY, icon)

        return goal
    }

    private clear() {
        for (const goal of this.goals) {
            if (goal) goal.node.destroy()
        }

        this.goals = []
        this.goalQueue = []
        this.slotPositions = []
    }

    findMatch(foodId: string): Goal | null {
        for (const goal of this.goals) {
            // SỬA Ở ĐÂY: Dùng !goal.isFull() thay vì isCompleted()
            if (goal && goal.foodId === foodId && !goal.isFull()) {
                return goal
            }
        }
        return null
    }

    public onGoalCompleted(goal: Goal) {
        const index = this.goals.indexOf(goal)

        // Xóa hoàn toàn node của goal cũ để dọn rác
        goal.node.destroy()

        if (this.goalQueue.length > 0) {
            // Nếu còn hàng trong kho -> Gọi món mới bay đúng vào cái index đó
            this.spawnNextGoalAt(index)
        } else {
            // Nếu hết hàng -> Đánh dấu slot này là trống vĩnh viễn (null)
            this.goals[index] = null
        }
    }

    spawnNextGoalAt(index: number) {
        // 1. Lấy điểm xuất phát (inPoint)
        const startPos = this.inPoint.position.clone();

        // 2. Khởi tạo đĩa thức ăn
        const goal = this.createGoalFromQueue(startPos);
        this.goals[index] = goal;

        const targetPos = this.slotPositions[index];

        // 3. Setup trạng thái ban đầu: Nhỏ, tàng hình và hơi nghiêng về phía sau (lấy đà)
        goal.node.setScale(0.2, 0.2, 0.2);
        goal.node.setRotationFromEuler(0, 0, -25);

        // 4. Chuỗi Animation "Lên Món" (Served)
        tween(goal.node)
            // GIAI ĐOẠN 1: Bắn ra và Đập phanh (Quán tính)
            .parallel(
                // Bay cực nhanh đến đích
                tween().to(0.35, { position: targetPos }, { easing: 'expoOut' }),

                // Bị ép dẹt xuống do đập phanh đột ngột (Squash)
                tween().to(0.35, { scale: new Vec3(1.15, 0.85, 1.15) }, { easing: 'quadOut' }),

                // Quán tính hất đĩa đổ dồn về phía trước
                tween().to(0.35, { eulerAngles: new Vec3(0, 0, 10) }, { easing: 'quadOut' })
            )
            // GIAI ĐOẠN 2: Lắc lư để cân bằng (Settling)
            .parallel(
                // Đàn hồi kích thước (Dãn ra rồi nảy về mốc 1)
                tween()
                    .to(0.15, { scale: new Vec3(0.95, 1.05, 0.95) }, { easing: 'sineOut' })
                    .to(0.15, { scale: new Vec3(1, 1, 1) }, { easing: 'sineIn' }),

                // Đĩa chao đảo nhẹ qua lại rồi dừng hẳn
                tween()
                    .to(0.15, { eulerAngles: new Vec3(0, 0, -5) }, { easing: 'sineInOut' })
                    .to(0.15, { eulerAngles: new Vec3(0, 0, 0) }, { easing: 'sineIn' })
            )
            .start();
    }

    isAllCompleted(): boolean {
        // Game chỉ kết thúc khi KHÔNG còn Goal nào trên sân (tất cả đều null) VÀ queue rỗng
        return this.goals.every(g => g === null) && this.goalQueue?.length === 0
    }
}