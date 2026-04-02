import { _decorator, Component, Node, Root } from 'cc';
import { container } from './DIContainer';
const { ccclass, property } = _decorator;

@ccclass('Clickable')
export class GameBehavior extends Component {
    protected _root: Root

    protected start(): void {
        this._root = container.resolve<Root>('Root')
    }

    public findFirstObjectByType<T extends Component>(
        type: new (...args: any[]) => T
    ): T | null {
        return this.getComponentInChildren(type);
    }

}


