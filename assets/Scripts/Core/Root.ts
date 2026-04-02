import { _decorator, Component, Node } from 'cc';
import { registerValue } from './DIContainer';
const { ccclass, property } = _decorator;

@ccclass('Root')
export class Root extends Component {
    protected start(): void {
        registerValue('Root', this)
    }
}

