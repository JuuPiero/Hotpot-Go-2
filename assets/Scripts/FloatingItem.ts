import { _decorator, Component, RigidBody, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('FloatingItem')
export class FloatingItem extends Component {

    @property floatStrength = 20        // lực nổi lên
    @property followStrength = 8        // giữ gần vị trí spawn
    @property waveStrength = 1.5        // sóng ngang nhẹ

    @property torqueStrength = 0.8      // xoay nhẹ
    @property tiltStrength = 6          // nghiêng theo sóng

    @property damping = 0.98            // giảm rung
    @property maxSpeed = 1.2
    @property maxAngular = 1.5

    private rigid!: RigidBody
    private basePos: Vec3 = new Vec3()

    private rand = Math.random() * 1000
    private temp = new Vec3()

    start() {
        this.rigid = this.getComponent(RigidBody)!
        this.basePos.set(this.node.worldPosition)

        // setup rigidbody cho "mềm"
        this.rigid.linearDamping = 0.8
        this.rigid.angularDamping = 0.8
    }

    update(dt: number) {
        const t = performance.now() * 0.001 + this.rand
        const pos = this.node.worldPosition

        // =========================
        // 1. FLOAT (lên xuống như sóng)
        // =========================
        const waveY = Math.sin(t * 1.5) * 0.2
        const targetY = this.basePos.y + waveY

        const forceY = (targetY - pos.y) * this.floatStrength
        this.rigid.applyForce(new Vec3(0, forceY, 0))

        // =========================
        // 2. GIỮ GẦN BASE (không drift xa)
        // =========================
        Vec3.subtract(this.temp, this.basePos, pos)

        const followForce = this.temp.clone().multiplyScalar(this.followStrength)
        this.rigid.applyForce(followForce)

        // =========================
        // 3. SÓNG NGANG NHẸ (rất nhỏ thôi)
        // =========================
        // const fx = Math.sin(t * 1.2) * this.waveStrength
        // const fz = Math.cos(t * 1.4) * this.waveStrength

        // this.rigid.applyForce(new Vec3(fx, 0, fz))

        // =========================
        // 4. NGHIÊNG THEO SÓNG (IMPORTANT)
        // =========================
        // const waveX = Math.sin(t * 1.3)
        // const waveZ = Math.cos(t * 1.1)

        // // độ dốc sóng → quyết định torque
        // const tiltX = waveZ * this.tiltStrength
        // const tiltZ = waveX * this.tiltStrength

        // // chỉ torque khi có sóng (không constant spin)
        // this.rigid.applyTorque(new Vec3(tiltX, 0, tiltZ))

        // =========================
        // 5. XOAY NHẸ LIÊN TỤC
        // =========================
        const spinY = Math.sin(t * 0.8) * this.torqueStrength
        this.rigid.applyTorque(new Vec3(0, spinY, 0))

        // =========================
        // 6. LIMIT (để không loạn)
        // =========================
        const vel = new Vec3()
        this.rigid.getLinearVelocity(vel)
        if (vel.length() > this.maxSpeed) {
            vel.normalize().multiplyScalar(this.maxSpeed)
            this.rigid.setLinearVelocity(vel)
        }

        const ang = new Vec3()
        this.rigid.getAngularVelocity(ang)
        ang.x = Math.max(-this.maxAngular, Math.min(this.maxAngular, ang.x))
        ang.y = Math.max(-this.maxAngular, Math.min(this.maxAngular, ang.y))
        ang.z = Math.max(-this.maxAngular, Math.min(this.maxAngular, ang.z))
        this.rigid.setAngularVelocity(ang)
    }
}