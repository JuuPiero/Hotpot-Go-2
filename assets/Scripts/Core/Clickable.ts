import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Clickable')
export abstract class Clickable extends Component {
    public abstract onClick();
}


