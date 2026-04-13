import { _decorator, Component, Node, Sprite, Color, tween, Tween, MeshRenderer } from 'cc';
import { Food } from './Food';
const { ccclass, property } = _decorator;

@ccclass('BufferItem')
export class BufferItem extends Component {
    @property({ type: Food }) public food: Food = null;
    @property(Node) spawnPos: Node;
    @property(MeshRenderer) visual: MeshRenderer;

    private _warningTween: Tween<any> = null;


    public setData(food: Food) {
        this.food = food;
    }


    public startWarning() {
        if (this._warningTween || !this.visual) return;

        let colorData = { intensity: 0 }; // 0: trắng, 1: đỏ đậm
        const mat = this.visual.getMaterialInstance(0);

        this._warningTween = tween(colorData)
            .to(0.8, { intensity: 1 }, {
                onUpdate: (target: any) => {
                    // Linear interpolation giữa trắng và đỏ
                    const r = 255;
                    const g = Math.floor(255 * (1 - target.intensity));
                    const b = Math.floor(255 * (1 - target.intensity));
                    mat.setProperty('mainColor', new Color(r, g, b, 255));
                },
                easing: 'sineInOut'  // easing mượt mà nhất
            })
            .to(0.8, { intensity: 0 }, {
                onUpdate: (target: any) => {
                    const r = 255;
                    const g = Math.floor(255 * (1 - target.intensity));
                    const b = Math.floor(255 * (1 - target.intensity));
                    mat.setProperty('mainColor', new Color(r, g, b, 255));
                },
                easing: 'sineInOut'
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
        const mat = this.visual.getMaterialInstance(0)
        if (this.visual) {
            mat.setProperty('mainColor', Color.WHITE)

        }
    }
}