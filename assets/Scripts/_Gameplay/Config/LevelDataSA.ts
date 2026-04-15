import { _decorator, CCFloat, CCInteger, CCString } from 'cc';
const { ccclass, property } = _decorator;
import { bh } from 'db://scriptable-asset/scriptable_runtime';

@ccclass('GoalData')
export class GoalData {
    @property public foodId: string = '123'
    @property public quantity: number = 1
}

@bh.createAssetMenu('LevelDataSA', 'Config/LevelData')
@bh.scriptable('LevelDataSA')
export class LevelDataSA extends bh.ScriptableAsset {
    public static readonly MATCH_QUANTITY = 3
    
    @property public maxGoalActive: number = 2
    @property(CCInteger) public maxBuffer: number = 4
    @property(CCInteger) public maxItemActive: number = 10
    
    @property({ range: [0, 1], type: CCFloat, tooltip: "Tỉ lệ ra Goal khó" }) 
    public hardRate: number = 0.5

    @property({ tooltip: "Bật nếu muốn AI tự động sinh Goal" })
    public useAutoGenerator: boolean = false;

    // --- DÙNG CHO AUTO GENERATOR ---
    @property({ type: CCInteger, visible: function(this: LevelDataSA) { return this.useAutoGenerator; } }) 
    public totalGoals: number = 10;
    
    @property({ type: [CCString], visible: function(this: LevelDataSA) { return this.useAutoGenerator; } }) 
    public foodPool: string[] = [];

    // --- DÙNG CHO MANUAL (Cấu hình tay) ---
    @property({ type: [GoalData], visible: function(this: LevelDataSA) { return !this.useAutoGenerator; } }) 
    public goals: GoalData[] = []
}