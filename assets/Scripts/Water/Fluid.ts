import { _decorator, Collider, Component, CylinderCollider, ITriggerEvent, Node, PlaneCollider, Vec3 } from 'cc';
import { BaseFluidInteractor } from './BaseFluidInteractor';
import { Perlin } from './Perlin';
const { ccclass, property } = _decorator;

@ccclass('Fluid')
export class Fluid extends Component {
    @property public density = 1;

    @property public drag = 1;

    @property public angularDrag = 1;

    @property(Collider) public coll!: Collider


    protected onLoad(): void {
        this.coll?.on('onTriggerEnter', this.onTriggerEnter, this)
        this.coll?.on('onTriggerExit', this.onTriggerExit, this)
        Perlin.init()
    }
    protected onDestroy(): void {
        this.coll?.off('onTriggerEnter', this.onTriggerEnter, this)
        this.coll?.off('onTriggerExit', this.onTriggerExit, this)
    }
    private onTriggerEnter(event: ITriggerEvent) {
        const fluidInteractor = event.otherCollider.getComponent(BaseFluidInteractor)
        
        if (fluidInteractor) {
            fluidInteractor.enterFluid(this);
        }
    }

    private onTriggerExit(event: ITriggerEvent) {
        const fluidInteractor = event.otherCollider.getComponent(BaseFluidInteractor)

        if (fluidInteractor) {
            fluidInteractor.exitFluid(this);
        }
    }
   
}