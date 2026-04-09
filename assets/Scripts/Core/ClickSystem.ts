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

        // Mảng các độ lệch pixel (1 điểm tâm, 4 điểm xung quanh)
        // Tăng giảm con số 20 để chỉnh "độ nhạy" bù trừ (tính bằng pixel màn hình)
        const offsets = [
            { x: 0, y: 0 },     // Tâm
            { x: 20, y: 0 },    // Phải
            { x: -20, y: 0 },   // Trái
            { x: 0, y: 20 },    // Lên
            { x: 0, y: -20 }    // Xuống
        ];

        for (let offset of offsets) {
            const ray = new geometry.Ray();
            // Bắn tia ray với độ trượt (offset)
            this.camera.screenPointToRay(pos.x + offset.x, pos.y + offset.y, ray);

            if (PhysicsSystem.instance.raycast(ray)) {
                const results = PhysicsSystem.instance.raycastResults;

                // Tìm Clickable trong kết quả của tia này
                for (let i = 0; i < results?.length; i++) {
                    const item = results[i].collider.node.getComponent(Clickable);
                    if (item) {
                        item.onClick();
                        return; // Đã trúng mục tiêu, dừng hoàn toàn việc bắn các tia khác
                    }
                }
            }
        }
    }


}