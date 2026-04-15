import { _decorator, Collider, Component, ICollisionEvent, Node, RigidBody, Vec3 } from 'cc';
import { Food } from './_Gameplay/Food';
const { ccclass, property } = _decorator;

@ccclass('FloatingItem')
export class FloatingItem extends Component {
    @property(RigidBody) public rigid: RigidBody = null!;

    @property([Node]) public floatPoints: Node[] = [];

    @property public waterLevel: number = 0;
    @property public floatStrength: number = 30;

    @property public waveHeight: number = 0.05;
    @property public waveSpeed: number = 2.0;

    // === CHỈ SỐ TRÔI DẠT ĐÃ ĐƯỢC GIẢM XUỐNG CỰC NHẸ ===
    @property public driftStrength: number = 0.2;  // Giảm từ 1.5 xuống 0.2 (Chỉ đẩy hiu hiu)
    @property public driftSpeed: number = 0.5;     // Trôi rất chậm
    @property public followStrength: number = 0.5; // Dây thun cực lỏng (giảm từ 3.0 xuống 0.5)

    private tempForce = new Vec3();
    private timeFlow = 0;
    private basePos = new Vec3();
    private randPhase = 0;
    public colliders: Collider[] = []
    
private lastSafePos = new Vec3();
    start() {
        this.rigid = this.getComponent(RigidBody)!;

        if (this.floatPoints.length === 0) {
            this.floatPoints.push(this.node);
        }

        this.basePos.set(this.node.worldPosition);

        this.rigid.linearDamping = 0.8; // Tăng ma sát để nó lờ đờ hơn
        this.rigid.angularDamping = 0.9;

        this.rigid.linearFactor = new Vec3(1, 1, 1);

        // KHÓA CHẾT 100% TRỤC XOAY (Không úp, không lật, không xoay ngang)
        this.rigid.angularFactor = new Vec3(0, 0, 0);

        this.timeFlow = Math.random() * 1000;
        this.randPhase = Math.random() * Math.PI * 2;
        this.colliders = this.getComponents(Collider)

        // ĐĂNG KÝ SỰ KIỆN VA CHẠM
        this.colliders.forEach(col => {
            col.on('onCollisionEnter', this.onCollisionEnter, this);
        });
       this.lastSafePos.set(this.node.worldPosition);
    }

    // Lực nảy nhẹ khi cụng nhau (Tăng số này lên vì dùng Impulse cần lực mạnh hơn một chút)
    private bounceForce: number = 3.0;

    // Thêm biến đếm thời gian để làm Cooldown
    private lastBounceTime: number = 0;

  private onCollisionEnter(event: ICollisionEvent) {
        // 1. BẢN THÂN KHÔNG PHẢI DYNAMIC (Đang trồi lên hoặc đang bay) -> Bỏ qua
        if (!this.rigid || this.rigid.type !== 1) return; // 1 là DYNAMIC

        const otherCollider = event.otherCollider;
        
        // Dùng chuỗi 'Food' để tránh lỗi import vòng lặp
        const otherFood = otherCollider.getComponent(Food);

        if (otherFood) {
            // 2. THẰNG KIA KHÔNG PHẢI DYNAMIC (Nó đang trồi lên hoặc đang bay) -> Bỏ qua
            // Chỉ để Physics tự đẩy rẽ nước êm ái, tuyệt đối KHÔNG cộng thêm lực búng
            if (!otherFood.rb || otherFood.rb.type !== 1) return;

            // 3. BỘ LỌC SPAM (COOLDOWN) CHỈ CHẠY KHI CẢ 2 ĐỀU ĐANG LỀNH BỀNH
            const currentTime = Date.now();
            if (currentTime - this.lastBounceTime < 300) return; 
            this.lastBounceTime = currentTime;

            const pushDir = new Vec3();
            Vec3.subtract(pushDir, this.node.worldPosition, otherCollider.node.worldPosition);

            pushDir.y = 0;

            if (pushDir.lengthSqr() > 0.0001) {
                pushDir.normalize(); 

                const impulse = new Vec3(pushDir.x * this.bounceForce, 0, pushDir.z * this.bounceForce);
                this.rigid.applyImpulse(impulse);
            }
        }
    }

    public resetAnchor() {
        this.basePos.set(this.node.worldPosition);
    }

    update(dt: number) {
        if (!this.rigid || this.rigid.type !== 1) return;

        this.timeFlow += dt * this.waveSpeed;
        const forcePerPoint = this.floatStrength / this.floatPoints.length;

        // CỜ KIỂM TRA BỊ ĐỘI LÊN ĐẦU
        let isStacked = false;

        // ===================================
        // 1. TÍNH LỰC NỔI & LỰC TRƯỢT CHỐNG CHỒNG
        // ===================================
        for (const p of this.floatPoints) {
            const worldPosY = p.worldPosition.y;
            const dynamicWaterLevel = this.waterLevel + Math.sin(this.timeFlow) * this.waveHeight;
            const depth = dynamicWaterLevel - worldPosY;

            if (depth > 0) {
                let appliedForce = depth * forcePerPoint;
                const maxAllowedForce = forcePerPoint * 1.5;
                if (appliedForce > maxAllowedForce) {
                    appliedForce = maxAllowedForce;
                }
                this.tempForce.set(0, appliedForce, 0);
                this.rigid.applyForce(this.tempForce, p.worldPosition);
            }
            else if (depth < -0.2) {
                // Nếu bị nhô lên khỏi mặt nước hơn 0.2 (đang cưỡi lên đầu cục khác)
                isStacked = true;

                // [FIX VĂNG XA 1]: Giảm lực hất từ 15.0 xuống 3.0 (Chỉ đẩy hích nhẹ ra)
                const slideX = (Math.random() - 0.5) * 3.0;
                const slideZ = (Math.random() - 0.5) * 3.0;
                this.tempForce.set(slideX, -5.0, slideZ); // Lực -5.0 kéo nó chúi xuống
                this.rigid.applyForce(this.tempForce, p.worldPosition);
            }
        }

        // ===================================
        // 2. TÍNH LỰC TRÔI DẠT (TRỤC X, Z)
        // ===================================
        const currentPos = this.node.worldPosition;
        const driftX = Math.sin(this.timeFlow * this.driftSpeed + this.randPhase) * this.driftStrength;
        const driftZ = Math.cos(this.timeFlow * this.driftSpeed * 0.8 + this.randPhase) * this.driftStrength;
        const pullX = (this.basePos.x - currentPos.x) * this.followStrength;
        const pullZ = (this.basePos.z - currentPos.z) * this.followStrength;

        this.tempForce.set(driftX + pullX, 0, driftZ + pullZ);
        this.rigid.applyForce(this.tempForce, this.node.worldPosition);

        // ===================================
        // 3. BỘ HÃM TỐC ĐỘ NGANG (THÔNG MINH HƠN)
        // ===================================
        const vel = new Vec3();
        this.rigid.getLinearVelocity(vel);
        const horizSpeedSqr = vel.x * vel.x + vel.z * vel.z;

        // [FIX VĂNG XA 2]: Khi bị kẹt, tốc độ trượt tối đa chỉ là 1.5 (hơi nhanh hơn lờ đờ một xíu)
        // chứ không để 5.0 như trước nữa. Nó sẽ từ từ lăn xuống êm ái.
        const maxHorizSpeed = isStacked ? 1.5 : 1.0;

        if (horizSpeedSqr > maxHorizSpeed * maxHorizSpeed) {
            const horizSpeed = Math.sqrt(horizSpeedSqr);
            vel.x = (vel.x / horizSpeed) * maxHorizSpeed;
            vel.z = (vel.z / horizSpeed) * maxHorizSpeed;
            this.rigid.setLinearVelocity(vel);
        }
    }

    // ========================================================
    // LỚP KHIÊN CUỐI CÙNG: CHỐNG DỊCH CHUYỂN TỨC THỜI (ANTI-TELEPORT)
    // ========================================================
    lateUpdate(dt: number) {
        if (!this.rigid || this.rigid.type !== 1) return;

        const currentPos = this.node.worldPosition;
        
        // Tính khoảng cách nó bị văng đi trong 1 khung hình (1 frame)
        const moveDist = Vec3.distance(currentPos, this.lastSafePos);

        // NẾU BỊ PHYSICS ENGINE ĐÁ VĂNG QUÁ MẠNH (> 0.15 units trong 1 frame là vô lý)
        if (moveDist > 0.15) {
            // 1. Tính hướng nó định văng đi
            const safeDir = new Vec3();
            Vec3.subtract(safeDir, currentPos, this.lastSafePos);
            
            // 2. Ép nó lại: "Mày chỉ được phép trượt đúng 0.05 units thôi, cấm bay xa!"
            safeDir.normalize().multiplyScalar(0.05); 
            
            const fixedPos = new Vec3();
            Vec3.add(fixedPos, this.lastSafePos, safeDir);
            
            // 3. Giật ngược nó lại vị trí an toàn
            this.node.setWorldPosition(fixedPos);
            
            // 4. Xóa sạch động năng điên rồ do Physics bơm vào trục X và Z
            const vel = new Vec3();
            this.rigid.getLinearVelocity(vel);
            vel.x = 0;
            vel.z = 0;
            this.rigid.setLinearVelocity(vel);
        }

        // Chốt vị trí an toàn cho khung hình tiếp theo
        this.lastSafePos.set(this.node.worldPosition);
    }
}