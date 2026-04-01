import { _decorator, Component } from 'cc';
const { ccclass } = _decorator;

@ccclass('BaseBehavior')
export class BaseBehavior extends Component {
    private _fixedDeltaTime: number = 0.02; // 50Hz
    private _accumulator: number = 0;

    update(dt: number) {
        const maxDeltaTime = 0.033; // ~30fps max
        const safeDt = Math.min(dt, maxDeltaTime);
        
        this._accumulator += safeDt;
        
        let iterations = 0;
        const maxIterations = 5;
        
        while (this._accumulator >= this._fixedDeltaTime && iterations < maxIterations) {
            this.fixedUpdate(this._fixedDeltaTime);
            this._accumulator -= this._fixedDeltaTime;
            iterations++;
        }
        
    }

    fixedUpdate(dt: number) {
        // Override this method in child classes
        // dt is fixed delta time
    }
    
    public setFixedDeltaTime(deltaTime: number) {
        if (deltaTime > 0) {
            this._fixedDeltaTime = deltaTime;
        }
    }
    
    public getFixedDeltaTime(): number {
        return this._fixedDeltaTime;
    }
}