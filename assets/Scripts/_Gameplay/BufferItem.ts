import { _decorator, Component, Node, Sprite, Color, tween, Tween } from 'cc';
import { Food } from './Food';
const { ccclass, property } = _decorator;

@ccclass('BufferItem')
export class BufferItem extends Component {
    @property({ type: Food }) public food: Food = null;
    @property(Node) spawnPos: Node;
    @property(Sprite) visual: Sprite;

    private _warningTween: Tween<any> = null;

    // @property
    // get triggerWarning() { return false; }
    // set triggerWarning(v) {
    //     if (v) this.startWarning();
    // }

    public setData(food: Food) {
        this.food = food;
    }


    public startWarning() {
        if (this._warningTween || !this.visual) return;

        let colorData = { r: 255, g: 255, b: 255, a: 255 };

        this._warningTween = tween(colorData)
            .to(0.5, { r: 255, g: 0, b: 0, a: 255 }, { 
                onUpdate: (target: any) => {
                    this.visual.color = new Color(target.r, target.g, target.b, target.a);
                }
            })
            .to(0.5, { r: 255, g: 255, b: 255, a: 255 }, { 
                onUpdate: (target: any) => {
                    this.visual.color = new Color(target.r, target.g, target.b, target.a);
                }
            })
            .union()
            .repeatForever()
            .start();
    }

    public stopWarning() {
    if (this._warningTween) {
        this._warningTween.stop();
        this._warningTween = null;
    }

    // Đảm bảo Sprite trở lại màu trắng hoàn toàn
    if (this.visual) {
        this.visual.color = Color.WHITE;
    }
}
}