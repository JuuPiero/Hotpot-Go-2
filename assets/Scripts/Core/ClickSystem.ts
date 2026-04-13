import { _decorator, Component, input, Input, EventMouse, PhysicsSystem, Camera, geometry, EventTouch, sys } from 'cc';
import { Clickable } from './Clickable';

const { ccclass } = _decorator;

@ccclass('ClickSystem')
export class ClickSystem extends Component {

    camera!: Camera;
    private _isProcessing: boolean = false;

    start() {
        this.camera = this.getComponent(Camera)!;
    }

    onEnable() {
        // Sử dụng TOUCH_END để đảm bảo nhận diện đầy đủ thao tác click/tap
        const eventType = sys.isMobile ? Input.EventType.TOUCH_END : Input.EventType.MOUSE_UP;
        input.on(eventType, this.onPointerDown, this);
    }

    onDisable() {
        const eventType = sys.isMobile ? Input.EventType.TOUCH_END : Input.EventType.MOUSE_UP;
        input?.off(eventType, this.onPointerDown, this);
    }

    onPointerDown(event: EventMouse | EventTouch) {
        // Ngăn chặn việc bấm quá nhanh gây chồng chéo logic trong 1 frame
        if (this._isProcessing) return;
        this._isProcessing = true;

        const pos = event.getLocation();
        
        // Giảm bớt số lượng tia nếu không thực sự cần thiết, 
        // hoặc ưu tiên tia ở tâm trước
        const offsets = [
            { x: 0, y: 0 },
            { x: 20, y: 0 }, { x: -20, y: 0 },
            { x: 0, y: 20 }, { x: 0, y: -20 }
        ];

        const ray = new geometry.Ray();

        for (let offset of offsets) {
            this.camera.screenPointToRay(pos.x + offset.x, pos.y + offset.y, ray);

            // Sử raycastClosest để tìm vật thể gần nhất ngay lập tức, nhanh hơn raycast thông thường
            if (PhysicsSystem.instance.raycastClosest(ray)) {
                const result = PhysicsSystem.instance.raycastClosestResult;
                const item = result.collider.node.getComponent(Clickable);
                
                if (item) {
                    item.onClick();
                    break; // Thoát vòng lặp ngay khi trúng
                }
            }
        }

        // Reset flag ở cuối frame để sẵn sàng cho cú click tiếp theo
        this._isProcessing = false;
    }
}