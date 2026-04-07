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

        if (!PhysicsSystem.instance.raycast(ray)) return;

        const result = PhysicsSystem.instance.raycastResults[0];
        const node = result.collider.node;

        const item = node.getComponent(Clickable);
        item?.onClick();

    }


}