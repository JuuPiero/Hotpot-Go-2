import { _decorator, Vec3, PhysicsSystem } from 'cc';
import { BaseFluidInteractor } from './BaseFluidInteractor';
const { ccclass } = _decorator;

@ccclass('BasicFluidInteractor')
export class BasicFluidInteractor extends BaseFluidInteractor {

    private tempVec = new Vec3();
    private velocity = new Vec3();

    public fluidUpdate(dt: number) {
        if (!this.fluid || !this.rb) return;

        let fluidSurface = this.fluid.node.worldPosition.y;

        if (this.fluid.coll && this.fluid.coll.worldBounds) {
            const bounds = this.fluid.coll.worldBounds;
            fluidSurface = bounds.center.y + bounds.halfExtents.y;
        }

        const worldPos = this.node.worldPosition;
        const difference = worldPos.y - fluidSurface;

        if (difference < 0) {

            const depth = Math.abs(difference);

            const gravity = Math.abs(PhysicsSystem.instance.gravity.y);

            this.tempVec.set(0, 1, 0);
            this.tempVec.multiplyScalar(
                this.floatStrength *
                depth *
                gravity *
                this.volume *
                this.fluid.density
            );

            if (this.simulateWaterTurbulence) {

                const turb1 = this.generateTurbulence();
                const turb2 = this.generateTurbulence();

                this.tempVec.add(turb1);

                this.rb.applyTorque(
                    turb2.clone().multiplyScalar(0.5)
                );
            }

            const offset = new Vec3(0.1, 0, 0); // lệch nhẹ
            Vec3.add(this.tempVec, worldPos, offset);

            this.rb.applyForce(this.tempVec, worldPos);

            this.rb.getLinearVelocity(this.velocity);

            this.velocity.multiplyScalar(-this.dampeningFactor * this.volume);

            this.rb.applyForce(this.velocity, worldPos);
        }
    }
}