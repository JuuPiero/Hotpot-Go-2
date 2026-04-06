import { _decorator, CCString, Component, Node } from 'cc';
import { IScreen } from './IScreen';
const { ccclass, property } = _decorator;

@ccclass('ScreenBase')
export class ScreenBase extends Component implements IScreen {
   
    @property({type : CCString})
    public screenName: string = '';

    public enter(param?: object): void {
        this.node.active = true;
    }
    public exit(): void {
        this.node.active = false;
    }

   
}


