import { _decorator, Component, Node } from 'cc';
import { registerValue } from './DIContainer';
const { ccclass, property, executionOrder } = _decorator;

@ccclass('Root')
// @executionOrder(0)
export class Root extends Component {
    protected start(): void {
        registerValue('Root', this)
    }
}

