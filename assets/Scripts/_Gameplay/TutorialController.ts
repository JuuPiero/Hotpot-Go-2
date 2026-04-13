import { _decorator, Camera, Component, Node, tween, UITransform, Vec3 } from 'cc';
import { registerValue } from '../Core/DIContainer';
const { ccclass, property } = _decorator;

@ccclass('TutorialController')
export class TutorialController extends Component {

    protected onLoad(): void {
        registerValue("Tutorial", this)
    }
    protected start(): void {
        this.startRotateLoop()
    }
    startRotateLoop() {
        tween(this.node)
            .repeatForever(
                tween()
                    .to(0.2, { eulerAngles: new Vec3(0, -30, 0) })
                    .to(0.2, { eulerAngles: new Vec3(0, 15, 0) })

            )
            .start();
    }
}


