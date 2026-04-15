import { _decorator, Component, instantiate, Node, Vec3, tween } from 'cc';
import { EventBus } from '../Core/EventBus';
import { GameEvent } from '../Core/GameEvent';
import { Goal } from './Goal';
import { GameConfigSA } from './Config/GameConfigSA';
import { LevelDataSA, GoalData } from './Config/LevelDataSA';
import { container, registerValue } from '../Core/DIContainer';
import { print } from '../Core/utils';
import { Food } from './Food';
import { Pot } from './Pot'; // <-- Nhớ import Pot nhé

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

    private slotPositions: Vec3[] = []

    protected onLoad(): void {
        registerValue('GoalManager', this)
    }

    protected onEnable(): void {
        this.gameConfig = container.resolve<GameConfigSA>('GameConfig')
        this.levelData = container.resolve<LevelDataSA>('LevelData')
        // EventBus.on(GameEvent.NEW_GAME, this.onNewGame)
    }

    protected onDisable(): void {
        // EventBus.off(GameEvent.NEW_GAME, this.onNewGame)
    }

    onNewGame = () => {
        print('Goal')
        this.clear()

        // BÍ QUYẾT 1 (FIX BUG): Ép phẳng (Flatten) goalQueue
        // Nếu Level config: { foodId: 'Shrimp', quantity: 2 }, ta phải tách ra thành 2 object riêng biệt 
        // để đẻ ra 2 đĩa Tôm riêng rẽ, chứ không phải 1 đĩa chứa gấp đôi số tôm.
        this.goalQueue = [];
        for (const goal of this.levelData.goals) {
            for (let i = 0; i < goal.quantity; i++) {
                this.goalQueue.push({ foodId: goal.foodId, quantity: 1 });
            }
        }

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
                // Thay vì lấy bừa, lấy qua thuật toán AI
                const goal = this.createDynamicGoal(this.slotPositions[i])
                
                if (goal) {
                    goal.node.setScale(1, 1, 1)
                    this.goals[i] = goal
                } else {
                    this.goals[i] = null
                }
            } else {
                this.goals[i] = null
            }
        }
    }

    // ==========================================
    // THUẬT TOÁN AI ĐẠO DIỄN (DYNAMIC GOAL PICKER)
    // ==========================================
    private pickNextDynamicGoal(): GoalData | null {
        if (this.goalQueue.length === 0) return null;

        const pot = container.resolve<Pot>('Pot');
        const activeFoods = pot.getActiveFoods(); 
        
        // Đọc Config độ khó của màn chơi (Mặc định 0.5 nếu chưa cấu hình)
        const hardRate = this.levelData.hardRate !== undefined ? this.levelData.hardRate : 0.5;

        // 1. Đếm xem món nào đang nổi trên mặt nước
        const activeCountMap = new Map<string, number>();
        for (const food of activeFoods) {
            const count = activeCountMap.get(food.foodId) || 0;
            activeCountMap.set(food.foodId, count + 1);
        }

        // 2. Phân loại độ khó
        const easyGoals: GoalData[] = [];
        const normalGoals: GoalData[] = [];
        const hardGoals: GoalData[] = [];

        for (const goal of this.goalQueue) {
            const activeCount = activeCountMap.get(goal.foodId) || 0;
            if (activeCount >= LevelDataSA.MATCH_QUANTITY) {
                easyGoals.push(goal); // Quá dễ: Món này đang nổi đủ bộ 3 cái trên mặt nước
            } else if (activeCount > 0) {
                normalGoals.push(goal); // Bình thường: Có vài cái nổi, phải đào nhẹ
            } else {
                hardGoals.push(goal); // Khó: Chìm lỉm ở dưới đáy hoặc chưa thèm xuất hiện
            }
        }

        // 3. Xúc xắc chọn Goal
        const roll = Math.random();
        let selectedGoal: GoalData | null = null;

        if (roll < hardRate) {
            // Ép người chơi (Ưu tiên: Khó -> Thường -> Dễ)
            selectedGoal = this.getRandomGoal(hardGoals) || this.getRandomGoal(normalGoals) || this.getRandomGoal(easyGoals);
        } else {
            // Cho người chơi xả hơi (Ưu tiên: Dễ -> Thường -> Khó)
            selectedGoal = this.getRandomGoal(easyGoals) || this.getRandomGoal(normalGoals) || this.getRandomGoal(hardGoals);
        }

        // 4. Lấy ra khỏi kho (Queue)
        if (selectedGoal) {
            const index = this.goalQueue.indexOf(selectedGoal);
            if (index > -1) this.goalQueue.splice(index, 1);
        }

        return selectedGoal;
    }

    private getRandomGoal(goals: GoalData[]): GoalData | null {
        if (goals.length === 0) return null;
        return goals[Math.floor(Math.random() * goals.length)];
    }

    // ==========================================
    // SINH GOAL TỪ THUẬT TOÁN ĐÃ TÍNH TOÁN
    // ==========================================
    private createDynamicGoal(startPos: Vec3): Goal | null {
        // Lấy Data dựa trên phân tích bàn cờ hiện tại
        const data = this.pickNextDynamicGoal()
        if (!data) return null;

        const node = instantiate(this.gameConfig.goalItemPrefab)

        node.setScale(0, 0, 0)
        node.setPosition(startPos)
        node.setParent(this.node) 

        const food = this.gameConfig.getItemById(data.foodId).data.getComponent(Food)
        const icon = food.getIcon()

        const goal = node.getComponent(Goal)
        // Set mặc định mỗi Goal là 1 đĩa (MATCH_QUANTITY thường = 3)
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
            if (goal && goal.foodId === foodId && !goal.isFull()) {
                return goal
            }
        }
        return null
    }

    public onGoalCompleted(goal: Goal) {
        const index = this.goals.indexOf(goal)
        goal.node.destroy()

        if (this.goalQueue.length > 0) {
            this.spawnNextGoalAt(index)
        } else {
            this.goals[index] = null
        }
    }

    spawnNextGoalAt(index: number) {
        const startPos = this.inPoint.position.clone();

        // Thay vì lấy tuần tự, gọi AI ra bốc món
        const goal = this.createDynamicGoal(startPos);
        if (!goal) return;

        this.goals[index] = goal;
        const targetPos = this.slotPositions[index];

        goal.node.setScale(0.2, 0.2, 0.2);
        goal.node.setRotationFromEuler(0, 0, -25);

        tween(goal.node)
            .parallel(
                tween().to(0.35, { position: targetPos }, { easing: 'expoOut' }),
                tween().to(0.35, { scale: new Vec3(1.15, 0.85, 1.15) }, { easing: 'quadOut' }),
                tween().to(0.35, { eulerAngles: new Vec3(0, 0, 10) }, { easing: 'quadOut' })
            )
            .parallel(
                tween()
                    .to(0.15, { scale: new Vec3(0.95, 1.05, 0.95) }, { easing: 'sineOut' })
                    .to(0.15, { scale: new Vec3(1, 1, 1) }, { easing: 'sineIn' }),
                tween()
                    .to(0.15, { eulerAngles: new Vec3(0, 0, -5) }, { easing: 'sineInOut' })
                    .to(0.15, { eulerAngles: new Vec3(0, 0, 0) }, { easing: 'sineIn' })
            )
            .start();
    }

    isAllCompleted(): boolean {
        return this.goals.every(g => g === null) && this.goalQueue?.length === 0
    }
}