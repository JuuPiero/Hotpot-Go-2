import { _decorator, Component, RigidBody, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Buoyancy')
export class Buoyancy extends Component {

    @property floatStrength = 20;
    @property waterDrag = 2;
    @property waveSpeed = 1;

    @property waterLevel = 0;

    private rigid: RigidBody | null = null;

    // 4 điểm đáy (local space)
    private floatPoints: Vec3[] = [
        new Vec3(-0.5, 0, -0.5),
        new Vec3(0.5, 0, -0.5),
        new Vec3(-0.5, 0, 0.5),
        new Vec3(0.5, 0, 0.5),
    ];

    start() {
        this.rigid = this.getComponent(RigidBody);
    }
    getWaveHeight(x: number, z: number, time: number) {

        const wave1 = Math.sin(x * 0.5 + time) * 0.5;
        const wave2 = Math.cos(z * 0.4 + time * 1.2) * 0.3;

        return this.waterLevel + wave1 + wave2;
    }

    update(dt: number) {

        if (!this.rigid) return;

        const time = performance.now() * 0.001 * this.waveSpeed;

        for (let p of this.floatPoints) {

            // convert local point -> world
            const worldPoint = new Vec3();
            Vec3.transformMat4(
                worldPoint,
                p,
                this.node.worldMatrix
            );

            const waterHeight = this.getWaveHeight(worldPoint.x, worldPoint.z, time);
            const depth = waterHeight - worldPoint.y;

            if (depth > 0) {

                const force = new Vec3(0, depth * this.floatStrength, 0);

                // áp lực tại vị trí -> tạo torque
                this.rigid.applyForce(force, worldPoint);
            }
        }

        // giảm rung
       const v: Vec3 = new Vec3() 
       this.rigid.getLinearVelocity(v);
       v.multiplyScalar(1 - dt * this.waterDrag); 
       this.rigid.setLinearVelocity(v);
    }
}


