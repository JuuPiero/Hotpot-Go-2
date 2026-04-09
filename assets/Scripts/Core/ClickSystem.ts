import { _decorator, Component, input, Input, EventMouse, PhysicsSystem, Camera, geometry, EventTouch, sys } from 'cc';
import { Clickable } from './Clickable';

const { ccclass } = _decorator;

@ccclass('ClickSystem')
export class ClickSystem extends Component {

    camera!: Camera;

    start() {
        this.camera = this.getComponent(Camera)!;
    }

    onEnable() {
        if (sys.isMobile) {
            input.on(Input.EventType.TOUCH_START, this.onPointerDown, this);
        }
        else {
            input.on(Input.EventType.MOUSE_DOWN, this.onPointerDown, this);
        }
    }

    onDisable() {

        if (sys.isMobile) {
            input?.off(Input.EventType.TOUCH_START, this.onPointerDown, this);
        }
        else {
            input?.off(Input.EventType.MOUSE_DOWN, this.onPointerDown, this);
        }
    }

    onPointerDown(event: EventMouse | EventTouch) {
        const pos = event.getLocation();
        const ray = new geometry.Ray();
        this.camera.screenPointToRay(pos.x, pos.y, ray);

        // Sử dụng raycast để lấy tất cả các vật thể va chạm
        if (PhysicsSystem.instance.raycast(ray)) {
            const results = PhysicsSystem.instance.raycastResults;

            // Sắp xếp kết quả theo khoảng cách từ gần đến xa (thường raycast đã sắp xếp sẵn)
            // Duyệt qua danh sách để tìm vật thể có Clickable đầu tiên
            for (let i = 0; i < results.length; i++) {
                const item = results[i].collider.node.getComponent(Clickable);
                if (item) {
                    item.onClick();
                    // Dừng lại sau khi tìm thấy mục tiêu đầu tiên có thể click
                    return;
                }
            }
        }
    }


}