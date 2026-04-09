import { _decorator, Component, RenderTexture, Camera, Material, view, CCInteger, Layers, Size, Vec3, Node } from 'cc';

const { ccclass, property, executeInEditMode } = _decorator;

/**
 * SceneTextureCapturer - Quản lý capture camera có sẵn và RenderTexture
 * 
 * Script này KHÔNG tạo camera mới, mà sử dụng camera có sẵn trong scene.
 * Chức năng chính:
 * 1. Auto resize texture theo screen size (đảm bảo aspect ratio đúng)
 * 2. Auto assign texture vào water material
 * 3. Tùy chọn sync transform với main camera
 * 4. Tùy chọn skip frames để tăng performance
 * 
 * @usage
 * 1. Tạo camera riêng trong scene (capture camera)
 * 2. Set targetTexture của camera đó = SceneTexture.rt
 * 3. Attach script này vào node bất kỳ
 * 4. Assign captureCamera, targetTexture, waterMaterial
 * 5. (Optional) Assign mainCamera nếu muốn sync transform
 */
@ccclass('SceneTextureCapturer')
@executeInEditMode
export class SceneTextureCapturer extends Component {
    //#region Properties
    @property({ type: Camera, tooltip: 'Camera dùng để capture scene (camera có sẵn trong scene)' })
    captureCamera: Camera | null = null;

    @property({ type: Camera, tooltip: '(Optional) Main camera - dùng để sync transform nếu cần' })
    mainCamera: Camera | null = null;

    @property({ type: RenderTexture, tooltip: 'RenderTexture để capture scene (SceneTexture.rt)' })
    targetTexture: RenderTexture | null = null;

    @property({ type: Material, tooltip: 'Material của water shader - auto assign opaqueTexture' })
    waterMaterial: Material | null = null;

    @property({ type: Node, tooltip: '(Optional) Water node để exclude khỏi capture camera (tránh WebGL feedback loop khi water sample targetTexture)' })
    waterNode: Node | null = null;

    @property({ type: Layers.Enum, tooltip: '(Optional) Layer để exclude khỏi capture camera (bổ sung cho waterNode nếu cần)' })
    excludeLayer: number = Layers.Enum.NONE;

    @property({ tooltip: 'Bật/tắt capture' })
    enableCapture: boolean = true;

    @property({ type: CCInteger, tooltip: 'Capture mỗi N frame. Cao hơn = performance tốt hơn, water "giật" hơn', min: 1, max: 10 })
    captureInterval: number = 1;

    @property({ tooltip: 'Scale resolution xuống (0.5 = half = 75% pixel savings)', min: 0.25, max: 1.0, step: 0.05 })
    resolutionScale: number = 0.5;

    @property({ tooltip: 'Sync transform với main camera mỗi frame (cần assign mainCamera)' })
    syncTransform: boolean = false;

    @property({ tooltip: 'Độ lệch vị trí giữa capture camera và main camera (local offset)' })
    positionOffset: Vec3 = new Vec3(0, 0, 0);

    @property({ tooltip: 'Sync cả rotation hay chỉ position' })
    syncRotation: boolean = true;

    @property({ tooltip: 'Tự động resize texture khi screen size thay đổi' })
    autoResizeTexture: boolean = true;

    @property({ tooltip: 'Tự động gán targetTexture vào captureCamera khi start' })
    autoAssignTextureToCamera: boolean = true;
    //#endregion

    //#region Private Variables
    private _frameCount: number = 0;
    private _isInitialized: boolean = false;
    private _lastScreenSize: Size = new Size(0, 0);
    //#endregion

    //#region Lifecycle
    onLoad() {
        this.initializeCapture();

        window.addEventListener('resize', this.updateCamera.bind(this));
        window.addEventListener('orientationchange', this.updateCamera.bind(this));
    }

    updateCamera() {
        if (!this._isInitialized || !this.enableCapture) return;
        
        // Sync transform với main camera (nếu bật)
        if (this.syncTransform && this.captureCamera && this.mainCamera) {
            this.syncCameraTransform();
        }

        // Check screen size change và auto resize texture
        if (this.autoResizeTexture) {
            this.checkScreenSizeChange();
        }

        this._frameCount++;
        
        // Kiểm tra interval - bật/tắt capture camera
        if (this.captureCamera) {
            const shouldCapture = this._frameCount % this.captureInterval === 0;
            this.captureCamera.enabled = shouldCapture;
        }
    }

    onDestroy() {
        this._isInitialized = false;
        window.removeEventListener('resize', this.updateCamera.bind(this));
        window.removeEventListener('orientationchange', this.updateCamera.bind(this));
    }
    //#endregion

    //#region initializeCapture
    /**
     * Khởi tạo capture system
     */
    private initializeCapture(): void {
        if (!this.validateSetup()) return;

        // Gán targetTexture vào capture camera (nếu bật)
        if (this.autoAssignTextureToCamera && this.captureCamera && this.targetTexture) {
            this.captureCamera.targetTexture = this.targetTexture;
            console.log('[SceneTextureCapturer] ✓ Assigned targetTexture to captureCamera');
        }

        // IMPORTANT (WebGL): tránh feedback loop khi water sample chính render target
        // Nếu capture camera render water (và water lại sample targetTexture) => GL_INVALID_OPERATION.
        this.applyCaptureCameraVisibilityExclusions();

        if (this.waterMaterial && !this.waterNode && !this.excludeLayer) {
            console.warn('[SceneTextureCapturer] ⚠ waterMaterial đã assign nhưng chưa cấu hình exclude (waterNode/excludeLayer). Hãy đảm bảo captureCamera KHÔNG render water, nếu không WebGL sẽ báo feedback loop (GL_INVALID_OPERATION).');
        }

        // Lưu screen size hiện tại
        const visibleSize = view.getVisibleSize();
        this._lastScreenSize.width = visibleSize.width;
        this._lastScreenSize.height = visibleSize.height;

        // Cập nhật resolution texture theo screen size
        this.updateTextureResolution();

        // Auto assign texture cho water material
        this.assignTextureToMaterial();

        this._isInitialized = true;
        this.logInitInfo();
    }
    //#endregion

    //#region validateSetup
    /**
     * Validate các property cần thiết
     */
    private validateSetup(): boolean {
        if (!this.captureCamera) {
            console.warn('[SceneTextureCapturer] ✗ captureCamera chưa được assign!');
            return false;
        }

        if (!this.targetTexture) {
            console.warn('[SceneTextureCapturer] ✗ targetTexture chưa được assign!');
            return false;
        }

        if (this.syncTransform && !this.mainCamera) {
            console.warn('[SceneTextureCapturer] ⚠ syncTransform = true nhưng mainCamera chưa được assign!');
        }

        if (this.captureCamera && this.mainCamera && this.captureCamera === this.mainCamera) {
            console.warn('[SceneTextureCapturer] ⚠ captureCamera == mainCamera. Hãy dùng camera riêng để capture vào RenderTexture; nếu không sẽ dễ dính WebGL feedback loop khi water sample opaqueTexture.');
        }

        return true;
    }

    //#region applyCaptureCameraVisibilityExclusions
    /**
     * Exclude water (hoặc 1 layer) khỏi capture camera để tránh read/write feedback loop trên WebGL.
     */
    private applyCaptureCameraVisibilityExclusions(): void {
        if (!this.captureCamera) return;

        let excludeMask = 0;
        if (this.waterNode) excludeMask |= this.waterNode.layer;
        if (this.excludeLayer) excludeMask |= this.excludeLayer;

        if (excludeMask === 0) return;

        const before = this.captureCamera.visibility;
        this.captureCamera.visibility = before & ~excludeMask;

        if (this.waterNode && (this.captureCamera.visibility & this.waterNode.layer) !== 0) {
            console.warn('[SceneTextureCapturer] ⚠ waterNode vẫn nằm trong visibility của captureCamera. Vui lòng đặt waterNode sang layer riêng và exclude layer đó.');
        }

        if (before !== this.captureCamera.visibility) {
            console.log('[SceneTextureCapturer] ✓ Applied captureCamera visibility exclusions');
        }
    }
    //#endregion
    //#endregion

    //#region syncCameraTransform
    /**
     * Sync transform từ main camera sang capture camera (với offset)
     */
    private syncCameraTransform(): void {
        if (!this.captureCamera || !this.mainCamera) return;

        const sourceNode = this.mainCamera.node;
        const targetNode = this.captureCamera.node;

        // Tính position với offset (offset theo local space của main camera)
        const worldPos = sourceNode.worldPosition.clone();
        this.captureCamera.orthoHeight = this.mainCamera.orthoHeight; // Sync ortho height nếu dùng orthographic camera
        this.captureCamera.fov = this.mainCamera.fov; // Sync FOV nếu dùng perspective camera
        
        // Apply offset theo hướng của main camera (local to world)
        if (this.positionOffset.x !== 0 || this.positionOffset.y !== 0 || this.positionOffset.z !== 0) {
            const offsetWorld = new Vec3();
            offsetWorld.add3f(this.positionOffset.x, this.positionOffset.y, this.positionOffset.z);
           // Vec3.transformQuat(offsetWorld, this.positionOffset, sourceNode.worldRotation);
            worldPos.add(offsetWorld);
        }
        
        targetNode.setWorldPosition(worldPos);
        
        // Sync rotation (nếu bật)
        if (this.syncRotation) {
            targetNode.setWorldRotation(sourceNode.worldRotation);
        }
    }
    //#endregion

    //#region checkScreenSizeChange
    /**
     * Kiểm tra screen size có thay đổi không (orientation change, window resize)
     * Nếu có thì auto resize texture
     */
    private checkScreenSizeChange(): void {
        const currentSize = view.getVisibleSize();
        
        // So sánh với last known size
        if (currentSize.width !== this._lastScreenSize.width || 
            currentSize.height !== this._lastScreenSize.height) {
            
            console.log(`[SceneTextureCapturer] Screen size changed: ${this._lastScreenSize.width}x${this._lastScreenSize.height} → ${currentSize.width}x${currentSize.height}`);
            
            // Update last size
            this._lastScreenSize.width = currentSize.width;
            this._lastScreenSize.height = currentSize.height;
            
            // Resize texture
            this.updateTextureResolution();
        }
    }
    //#endregion

    //#region updateTextureResolution
    /**
     * Cập nhật resolution của target texture theo screen size hiện tại
     * Đảm bảo aspect ratio luôn khớp với screen
     */
    private updateTextureResolution(): void {
        if (!this.targetTexture) return;

        const visibleSize = view.getVisibleSize();
        const width = Math.floor(visibleSize.width * this.resolutionScale);
        const height = Math.floor(visibleSize.height * this.resolutionScale);

        // Chỉ update nếu size thay đổi
        if (this.targetTexture.width !== width || this.targetTexture.height !== height) {
            this.targetTexture.resize(width, height);
            console.log(`[SceneTextureCapturer] Texture resized: ${width}x${height} (aspect: ${(width/height).toFixed(3)})`);
        }
    }
    //#endregion

    //#region assignTextureToMaterial
    /**
     * Gán texture vào material
     */
    private assignTextureToMaterial(): void {
        if (!this.waterMaterial || !this.targetTexture) return;

        this.waterMaterial.setProperty('opaqueTexture', this.targetTexture);
        console.log('[SceneTextureCapturer] ✓ Assigned texture to water material');
    }
    //#endregion

    //#region logInitInfo
    /**
     * Log thông tin khởi tạo
     */
    private logInitInfo(): void {
        const visibleSize = view.getVisibleSize();
        const fullPixels = visibleSize.width * visibleSize.height;
        const capturePixels = this.targetTexture!.width * this.targetTexture!.height;
        const pixelSavings = Math.round((1 - capturePixels / fullPixels) * 100);

        console.log('[SceneTextureCapturer] ✓ Initialized (using existing camera)');
        console.log(`  - Capture Camera: ${this.captureCamera?.node.name}`);
        console.log(`  - Texture: ${this.targetTexture!.width}x${this.targetTexture!.height} (${Math.round(this.resolutionScale * 100)}% of screen)`);
        console.log(`  - Pixel savings: ${pixelSavings}%`);
        console.log(`  - Capture interval: every ${this.captureInterval} frame(s)`);
        console.log(`  - Sync transform: ${this.syncTransform ? 'enabled' : 'disabled'}`);
    }
    //#endregion

    //#region setEnableCapture
    /**
     * Bật/tắt capture trong runtime
     */
    public setEnableCapture(enabled: boolean): void {
        this.enableCapture = enabled;
        if (this.captureCamera) {
            this.captureCamera.enabled = enabled;
        }
        console.log(`[SceneTextureCapturer] Capture ${enabled ? 'enabled' : 'disabled'}`);
    }
    //#endregion

    //#region setCaptureInterval
    /**
     * Set capture interval trong runtime
     * @param interval Số frame giữa mỗi lần capture (1-10)
     */
    public setCaptureInterval(interval: number): void {
        this.captureInterval = Math.max(1, Math.min(10, interval));
        console.log(`[SceneTextureCapturer] Capture interval: ${this.captureInterval} frames`);
    }
    //#endregion

    //#region setResolutionScale
    /**
     * Set resolution scale và resize texture
     * @param scale Scale factor (0.25 - 1.0)
     */
    public setResolutionScale(scale: number): void {
        this.resolutionScale = Math.max(0.25, Math.min(1.0, scale));
        this.updateTextureResolution();
        console.log(`[SceneTextureCapturer] Resolution scale: ${Math.round(this.resolutionScale * 100)}%`);
    }
    //#endregion

    //#region getPerformanceInfo
    /**
     * Lấy thông tin performance để debug
     */
    public getPerformanceInfo(): { pixelSavings: number; frameSkipRate: number; effectiveLoad: number } {
        const visibleSize = view.getVisibleSize();
        const fullPixels = visibleSize.width * visibleSize.height;
        const capturePixels = this.targetTexture ? this.targetTexture.width * this.targetTexture.height : 0;
        
        const pixelSavings = Math.round((1 - capturePixels / fullPixels) * 100);
        const frameSkipRate = Math.round((1 - 1 / this.captureInterval) * 100);
        
        // Effective load = (1 - pixel savings) * (1 - frame skip rate)
        const effectiveLoad = Math.round((capturePixels / fullPixels) * (1 / this.captureInterval) * 100);

        console.log(`[SceneTextureCapturer] Performance Info:`);
        console.log(`  - Pixel savings: ${pixelSavings}%`);
        console.log(`  - Frame skip rate: ${frameSkipRate}%`);
        console.log(`  - Effective GPU load: ${effectiveLoad}% of full camera`);
        
        return { pixelSavings, frameSkipRate, effectiveLoad };
    }
    //#endregion

    //#region getCaptureCamera
    /**
     * Lấy reference đến capture camera
     */
    public getCaptureCamera(): Camera | null {
        return this.captureCamera;
    }
    //#endregion

    //#region forceResizeTexture
    /**
     * Force resize texture ngay lập tức (gọi khi cần manual trigger)
     */
    public forceResizeTexture(): void {
        const visibleSize = view.getVisibleSize();
        this._lastScreenSize.width = visibleSize.width;
        this._lastScreenSize.height = visibleSize.height;
        this.updateTextureResolution();
        console.log(`[SceneTextureCapturer] Force resized to match screen: ${visibleSize.width}x${visibleSize.height}`);
    }
    //#endregion

    //#region getTextureInfo
    /**
     * Lấy thông tin texture hiện tại
     */
    public getTextureInfo(): { width: number; height: number; aspectRatio: number; screenAspect: number; isMatching: boolean } {
        const visibleSize = view.getVisibleSize();
        const texWidth = this.targetTexture?.width || 0;
        const texHeight = this.targetTexture?.height || 0;
        const textureAspect = texHeight > 0 ? texWidth / texHeight : 0;
        const screenAspect = visibleSize.height > 0 ? visibleSize.width / visibleSize.height : 0;
        const isMatching = Math.abs(textureAspect - screenAspect) < 0.01;

        console.log(`[SceneTextureCapturer] Texture Info:`);
        console.log(`  - Texture: ${texWidth}x${texHeight} (aspect: ${textureAspect.toFixed(3)})`);
        console.log(`  - Screen: ${visibleSize.width}x${visibleSize.height} (aspect: ${screenAspect.toFixed(3)})`);
        console.log(`  - Aspect ratio match: ${isMatching ? '✓' : '✗'}`);

        return { width: texWidth, height: texHeight, aspectRatio: textureAspect, screenAspect, isMatching };
    }
    //#endregion
}
