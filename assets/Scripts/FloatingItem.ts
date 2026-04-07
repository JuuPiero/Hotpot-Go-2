import { _decorator, Component, Node, RigidBody, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('FloatingItem')
export class FloatingItem extends Component {

    @property(RigidBody)
    rigid: RigidBody = null!;

    @property([Node])
    floatPoints: Node[] = [];

    @property waterLevel = 0;
    @property floatStrength = 8;      // lực nổi mạnh hơn gravity
    @property waterDrag = 3;          // lực cản khi dưới nước
    @property waveStrength = 0.2;
    @property waveSpeed = 1;

    @property followStrength = 0.5;   // giữ gần vị trí ban đầu

    @property maxSpeed = 1.0;
    @property maxAngular = 0.5;

    private basePos = new Vec3();
    private temp = new Vec3();
    private vel = new Vec3();
    private ang = new Vec3();
    private rand = Math.random() * 1000;

    start() {
        this.rigid = this.getComponent(RigidBody)!;
        this.basePos.set(this.node.worldPosition);

        // mềm và ổn định hơn
        this.rigid.linearDamping = 0.8;
        this.rigid.angularDamping = 0.8;
        // RẤT QUAN TRỌNG
        // this.rigid.setCollisionDetectionMode(1); // CONTINUOUS
    }

    update(dt: number) {

        const t = performance.now() * 0.001 * this.waveSpeed + this.rand;

        // ======================
        // FLOAT PER POINT
        // ======================
        for (const p of this.floatPoints) {

            const world = p.worldPosition;
            const waveY = this.getWave(world.x, world.z, t);
            const depth = waveY - world.y;

            if (depth > 0) {

                // lực nổi
                this.temp.set(0, depth * this.floatStrength, 0);
                this.rigid.applyForce(this.temp, world);

                // water drag (giảm rung + không văng)
                this.rigid.getLinearVelocity(this.vel);
                this.vel.multiplyScalar(1 - this.waterDrag * dt);
                this.rigid.setLinearVelocity(this.vel);
            }
        }

        // ======================
        // GIỮ GẦN BASE (không trôi khỏi nồi)
        // ======================
        const pos = this.node.worldPosition;
        Vec3.subtract(this.temp, this.basePos, pos);
        this.temp.multiplyScalar(this.followStrength);
        this.rigid.applyForce(this.temp);

        // ======================
        // LIMIT SPEED
        // ======================
        this.rigid.getLinearVelocity(this.vel);
        if (this.vel.length() > this.maxSpeed) {
            this.vel.normalize().multiplyScalar(this.maxSpeed);
            this.rigid.setLinearVelocity(this.vel);
        }

        // ======================
        // LIMIT ROTATION
        // ======================
        this.rigid.getAngularVelocity(this.ang);

        this.ang.x = Math.max(-this.maxAngular, Math.min(this.maxAngular, this.ang.x));
        this.ang.y = Math.max(-this.maxAngular, Math.min(this.maxAngular, this.ang.y));
        this.ang.z = Math.max(-this.maxAngular, Math.min(this.maxAngular, this.ang.z));

        this.rigid.setAngularVelocity(this.ang);
    }

    private getWave(x: number, z: number, t: number) {
        const wave1 = Math.sin(x * 0.5 + t) * this.waveStrength;
        const wave2 = Math.cos(z * 0.4 + t * 1.2) * this.waveStrength;
        return this.waterLevel + wave1 + wave2;
    }
}