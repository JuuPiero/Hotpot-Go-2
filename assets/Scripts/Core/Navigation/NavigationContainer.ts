import { _decorator, Component, Node } from 'cc';
import { StackNavigator } from './StackNavigator';
import { registerValue } from '../DIContainer';
const { ccclass, property } = _decorator;

@ccclass('NavigationContainer')
export class NavigationContainer extends Component {
    @property({type : StackNavigator})
    public stack: StackNavigator = null;

    // public tab: tabNavigator = null;
    protected onLoad(): void {
        registerValue("Navigation", this)
    }

    protected start(): void {
        
        this.stack = this.getComponentInChildren(StackNavigator);
    }
}


