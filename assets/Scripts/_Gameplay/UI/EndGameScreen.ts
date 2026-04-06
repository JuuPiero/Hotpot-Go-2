import { _decorator, Button, Component, Label, Node, tween, Vec3 } from 'cc';
import { GameManager } from '../GameManager';
import { ScreenBase } from '../../Core/Navigation/ScreenBase';
import { container } from '../../Core/DIContainer';
const { ccclass, property } = _decorator;

@ccclass('EndGameScreen')
export class EndGameScreen extends ScreenBase {
    @property({type: Button})
    public installBtn: Button = null;


    @property({type: Node})
    public logo: Node = null;

    protected start(): void {

        
        tween(this.logo)
            .to(0.5, { scale: new Vec3(0.5, 0.5, 1.1) })
            .to(0.5, { scale: new Vec3(0.6, 0.6, 1) }) 
            .union()
            .repeatForever()
            .start();
        tween(this.installBtn.node)
            .to(0.5, { scale: new Vec3(0.7, 0.7, 1.1) }) 
            .to(0.5, { scale: new Vec3(0.8, 0.8, 1) }) 
            .union()
            .repeatForever()
            .start();
    }


    protected onLoad(): void {
        this.installBtn.node?.on(Button.EventType.CLICK, this.install, this);
        // this.node.on(Button.EventType.CLICK, this.install, this);

    }
    protected onDestroy(): void {
        this.installBtn.node?.off(Button.EventType.CLICK, this.install, this);
        // this.node?.off(Button.EventType.CLICK, this.install, this);
    }

    install() { 
        container.resolve<GameManager>('GameManager').installGame()
    }
    
}


