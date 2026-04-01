import { _decorator, BoxCollider, CCFloat, Collider, Component, Node, randomRange, RigidBody, Vec3 } from 'cc';
import { Fluid } from './Fluid';
import { BaseBehavior } from '../BaseBehavior';
import { Perlin } from './Perlin';
const { ccclass, property } = _decorator;

@ccclass('BaseFluidInteractor')
export abstract class BaseFluidInteractor extends BaseBehavior {

    @property(RigidBody) public rb: RigidBody;
    @property(Collider) public coll: Collider;

    @property public volume: number = 0;
    @property public customVolume: number = 0;
    @property public dampeningFactor: number = 0.1;

    private waterDrag = 3;
    private waterAngularDrag = 1;
    private airDrag: number = 0;
    private airAngularDrag: number = 0;
    public inFluidCount: number = 0;
    public fluid: Fluid;

    @property public simulateWaterTurbulence: boolean;
    @property({ type: CCFloat, range: [0, 5] }) public turbulenceStrength: number = 1;

    public rndTimeOffset: number[] = [];

    private time: number = 0;

    @property public floatStrength = 2;

    public abstract fluidUpdate(dt: number);

    start() {
        if (!this.coll) {
            this.coll = this.node.getComponent(Collider);
        }
        if (!this.rb) {
            this.rb = this.node.getComponent(RigidBody);
        }

        if (this.rb) {
            this.airDrag = this.rb.linearDamping;
            this.airAngularDrag = this.rb.angularDamping;
        }

        // Calculate or set volume
        if (this.customVolume !== 0) {
            this.volume = this.customVolume;
        } else {
            this.volume = this.calculateVolume();
        }
    }

    update(dt: number) {
         super.update(dt);

        if (this.inFluidCount > 0) {
            this.time += dt / 4;
            this.fluidUpdate(dt);
        }
    }

    public onLoad() {
        this.rndTimeOffset = new Array(6);

        for (let i = 0; i < 6; i++) {
            this.rndTimeOffset[i] = randomRange(0, 6);
        }
    }


    // fixedUpdate(dt: number) {
    //     super.fixedUpdate(dt)
    //     this.time += dt / 4;

    //     if (this.inFluidCount > 0) {
    //         this.fluidUpdate(dt);
    //     }
    // }

    public generateTurbulence(): Vec3 {
        if (!this.simulateWaterTurbulence) {
            return Vec3.ZERO;
        }

        const x = Perlin.noise(
            this.time + this.rndTimeOffset[0],
            this.time + this.rndTimeOffset[1]
        ) * 2 - 1;

        const z = Perlin.noise(
            this.time + this.rndTimeOffset[4],
            this.time + this.rndTimeOffset[5]
        ) * 2 - 1;

        const turbulence = new Vec3(x, 0, z);
        turbulence.multiplyScalar(this.turbulenceStrength);

        return turbulence;
    }

    public enterFluid(enteredFluid: Fluid) {
        this.fluid = enteredFluid;
        this.inFluidCount++;

        this.waterDrag = this.fluid.drag;
        this.waterAngularDrag = this.fluid.angularDrag;

        this.rb.linearDamping = this.waterDrag;
        this.rb.angularDamping = this.waterAngularDrag;

        console.log('enter');

    }

    public exitFluid(fluidToExit: Fluid) {
        if (this.fluid == fluidToExit)
            this.fluid = null;

        this.inFluidCount--;

        if (this.inFluidCount == 0) {
            this.rb.linearDamping = this.airDrag;
            this.rb.angularDamping = this.airAngularDrag;
        }
        console.log('exit');

    }

    public calculateVolume(): number {
        // Calculate volume based on collider bounds
        if (this.coll && this.coll.worldBounds) {
            const bounds = this.coll.worldBounds;
            return bounds.halfExtents.x * 2 *
                bounds.halfExtents.y * 2 *
                bounds.halfExtents.z * 2;
        }

        const scale = this.node.scale;
        return scale.x * scale.y * scale.z;
    }
}


