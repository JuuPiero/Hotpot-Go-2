import { _decorator, Component, instantiate, Label, Node, tween, Vec3 } from 'cc';
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


    @property(Node) public iconPosition: Node = null

    @property(Node) public success: Node = null



    public init(foodId: string, required: number, icon?: Node) {
        this.foodId = foodId
        this.required = required
        this.count = 0

        const node = instantiate(icon)
        node.setParent(this.iconPosition)
        this.iconPosition.setScale(0.6, 0.6, 0.6)
        this.updateUI()
    }


    getTargetNode(): Node {
        const index = this.reservedCount
        this.reservedCount++
        return this.placesPos[index]
    }

    isCompleted(): boolean {
        return this.count === this.required
    }

    // THÊM HÀM NÀY: Kiểm tra xem đĩa đã được "đặt chỗ" kín chưa
    isFull(): boolean {
        return this.reservedCount >= this.required
    }

    public updateUI() {
        if (this.text) {
            this.text.string = `${this.count}/${this.required}`
        }
    }

    public playImpactEffect() {
        // Dừng các hiệu ứng rung trước đó (nếu người chơi bấm liên tục làm đồ ăn bay vào dồn dập)
        tween(this.node).stop();
        
        // Chạy chuỗi hiệu ứng: Lún xuống -> Nảy nhẹ -> Cân bằng
        tween(this.node)
            // Lún xuống và hơi chúi về phía trước do sức nặng
            .to(0.1, { scale: new Vec3(1.08, 0.92, 1.08), eulerAngles: new Vec3(6, 0, 0) }, { easing: 'quadOut' })
            
            // Đàn hồi bật ngược lại một chút
            .to(0.12, { scale: new Vec3(0.97, 1.03, 0.97), eulerAngles: new Vec3(-3, 0, 0) }, { easing: 'sineInOut' })
            
            // Trở về trạng thái tĩnh hoàn hảo
            .to(0.1, { scale: new Vec3(1, 1, 1), eulerAngles: new Vec3(0, 0, 0) }, { easing: 'sineIn' })
            .start();
    }

    public moveOut(target: Node, onDone?: Function) {
        const startPos = this.node.position.clone();
        // Vị trí bay lên (trục Y cao hơn một chút)
        const upPos = startPos.clone().add3f(0, 2, 0); 
        const targetPos = target.position.clone();

        this.success.active = true;

        tween(this.node)
            // BƯỚC 1: Bay vọt lên nhanh
            .to(0.25, { position: upPos, scale: new Vec3(1.2, 1.2, 1.2) }, { easing: 'quadOut' })

            // BƯỚC 2: Di chuyển sang target và thu nhỏ dần
            .parallel(
                tween().to(0.5, { position: targetPos }, { easing: 'sineInOut' }),
                tween().to(0.5, { scale: Vec3.ZERO }, { easing: 'quadIn' })
            )

            // BƯỚC 3: Hoàn tất
            .call(() => {
                onDone?.();
            })
            .start();
    }
}