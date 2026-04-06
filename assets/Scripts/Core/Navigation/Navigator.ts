import { _decorator, Component, Node } from 'cc';
import { IScreen } from './IScreen';
import { ScreenBase } from './ScreenBase';
const { ccclass, property } = _decorator;

@ccclass('Navigator')
export abstract class Navigator extends Component {
    @property({type : ScreenBase})
    public currentScreen: ScreenBase;
    protected screens: Map<string, ScreenBase> = new Map<string, ScreenBase>();

    protected start(): void {
        var screens = this.getComponentsInChildren(ScreenBase);
        screens.forEach(screen => {
            this.screens.set(screen.screenName, screen);
        })
    }
    public abstract navigate(screenName: string, param? : object): void;
    // public abstract navigateTo<T>(param : object): void; //  where T : IScreen;
}


