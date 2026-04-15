import { _decorator, Camera, Component, Node, tween, UITransform, Vec3 } from 'cc';
import { registerValue } from '../Core/DIContainer';
import { EventBus } from '../Core/EventBus';
import { GameEvent } from '../Core/GameEvent';
const { ccclass, property } = _decorator;

@ccclass('TutorialController')
export class TutorialController extends Component {

    protected onLoad(): void {
        registerValue("Tutorial", this)
        
    }

    protected onEnable(): void {
        EventBus.on(GameEvent.NEW_GAME, this.onNewgame)
    }
    protected onDisable(): void {
        EventBus.off(GameEvent.NEW_GAME, this.onNewgame)
    }
    protected start(): void {
        



        this.startRotateLoop()
    }


    onNewgame = () => {
        

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


