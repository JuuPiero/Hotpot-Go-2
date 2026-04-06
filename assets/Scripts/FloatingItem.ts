import { _decorator, Component, Node, RigidBody, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('FloatingItem')
export class FloatingItem extends Component {

    @property(RigidBody)
    rigid: RigidBody = null!

    // ===== FLOAT POINTS =====
    @property([Node])
    floatPoints: Node[] = []

    // ===== WATER =====
    @property waterLevel = 0
    @property floatStrength = 5
    @property waveStrength = 0.5
    @property waveSpeed = 1

    // ===== FOLLOW BASE =====
    @property followStrength = 4

    // ===== LIMIT =====
    @property maxSpeed = 1.5
    @property maxAngular = 1.5

    private basePos = new Vec3()
    private temp = new Vec3()
    private vel = new Vec3()
    private ang = new Vec3()

    private rand = Math.random() * 1000

    start() {
        this.rigid = this.getComponent(RigidBody)
        this.basePos.set(this.node.worldPosition)

        // setup mềm
        this.rigid.linearDamping = 0.8
        this.rigid.angularDamping = 0.8
    }

    update(dt: number) {
        const t = performance.now() * 0.001 * this.waveSpeed + this.rand

        // =========================
        // 1. APPLY FLOAT PER POINT
        // =========================
        for (const p of this.floatPoints) {

            const world = p.worldPosition

            const waveY = this.getWave(world.x, world.z, t)
            const depth = waveY - world.y

            if (depth > 0) {
                const force = new Vec3(0, depth * this.floatStrength, 0)

                this.rigid.applyForce(force, world)
            }
        }

        // =========================
        // 2. GIỮ GẦN BASE (không drift xa)
        // =========================
        const pos = this.node.worldPosition
        Vec3.subtract(this.temp, this.basePos, pos)

        this.rigid.applyForce(
            this.temp.multiplyScalar(this.followStrength)
        )

        // =========================
        // 3. LIMIT VELOCITY
        // =========================
        this.rigid.getLinearVelocity(this.vel)

        if (this.vel.length() > this.maxSpeed) {
            this.vel.normalize().multiplyScalar(this.maxSpeed)
            this.rigid.setLinearVelocity(this.vel)
        }

        this.rigid.getAngularVelocity(this.ang)

        this.ang.x = Math.max(-this.maxAngular, Math.min(this.maxAngular, this.ang.x))
        this.ang.y = Math.max(-this.maxAngular, Math.min(this.maxAngular, this.ang.y))
        this.ang.z = Math.max(-this.maxAngular, Math.min(this.maxAngular, this.ang.z))

        this.rigid.setAngularVelocity(this.ang)
    }

    
    private getWave(x: number, z: number, t: number) {
        const wave1 = Math.sin(x * 0.5 + t) * this.waveStrength
        const wave2 = Math.cos(z * 0.4 + t * 1.2) * this.waveStrength

        return this.waterLevel + wave1 + wave2
    }
}