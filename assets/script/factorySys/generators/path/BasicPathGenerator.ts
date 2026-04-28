
import { IPathGenerator, IPathConfig } from "../../defs/path/PathFactoryDef";

// 藍色玩家外圈路徑 (52格)
// 起點 [1, 6]，順時針繞行
const BLUE_OUTER_PATH = [
    [1, 6], [2, 6], [3, 6], [4, 6], [5, 6], // 向上爬升
    [6, 5], [6, 4], [6, 3], [6, 2], [6, 1], [6, 0], // 左轉繞過紅區底部
    [7, 0], // 紅色轉折點
    [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], // 向上繞過紅區左側
    [9, 6], [10, 6], [11, 6], [12, 6], [13, 6], [14, 6], // 向上繞過紅區頂部
    [14, 7], // 綠色轉折點
    [14, 8], [13, 8], [12, 8], [11, 8], [10, 8], [9, 8], // 向下繞過綠區左側
    [8, 9], [8, 10], [8, 11], [8, 12], [8, 13], [8, 14], // 右轉繞過綠區頂部
    [7, 14], // 黃色轉折點
    [6, 14], [6, 13], [6, 12], [6, 11], [6, 10], [6, 9], // 向下繞過黃區右側
    [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8], // 向下繞過黃區底部
    [0, 7]  // 最後回到藍色箭頭格 (轉向入口)
];

// 藍色玩家內線路徑(直衝中心)
const BLUE_INNER_PATH = [
    [1, 7], [2, 7], [3, 7], [4, 7], [5, 7], [6, 7]
];

// 藍色玩家基地棋子座標 (4個坑位)
// 對應棋盤上的四格交會處，適合放置旗子
// 其他玩家座標由 translateBaseCoords 自動轉換：
// Blue:   [3,1], [3,3], [1,1], [1,3]
// Red:    [12,1], [12,3], [10,1], [10,3]    (row+9)
// Green:  [12,10], [12,12], [10,10], [10,12] (row+9, col+9)
// Yellow: [3,10], [3,12], [1,10], [1,12]    (col+9)
const BLUE_BASE_SLOTS = [
    [3, 1],[3, 3],[1, 1],[1, 3]
];



/**
 * 基礎路徑產生器，提供標準的路徑生成邏輯和座標轉換方法
 * 
 * 注意：當前實現專為 15×15 標準 Ludo 棋盤設計
 * - gridSize：固定為 15（路徑座標硬編碼）
 * - playerCount：支援 2-4 人（可配置）
 * - outerPathLength：固定為 52 格
 * - innerPathLength：固定為 6 格
 */
export class BasicPathGenerator implements IPathGenerator {
    
    private _pathMap: Record<number, number[][]> = {};
    private _baseMap: Record<number, number[][]> = {};
    private _slotIdMap: Record<number, number[]> = {};  // 🆕 存儲每個玩家的 SlotID 陣列
    
    // 硬編碼配置（當前實現限制）
    private readonly GRID_SIZE = 15;  // 路徑座標為 15×15 棋盤設計，不可更改
    
    // 可配置參數
    private _playerCount: number = 4;  // 預設 4 人遊戲
    
    // SlotID 配置
    private _baseSlotIdOffset: number = -1;  // 坑位 ID 起始值（預設 -1）
    private _slotsPerPlayer: number = 4;      // 每個玩家的坑位數量（預設 4）
    
    /**
     * 設置路徑配置
     * 
     * 當前實現限制：
     * - 只支援 15×15 棋盤（gridSize 固定為 15）
     * - 路徑長度固定（outerPathLength: 52, innerPathLength: 6）
     * - 玩家數量可配置（2-4 人）
     * 
     * @param config 路徑配置
     */
    public setConfig(config: IPathConfig): void {
        // 接收 SlotID 配置
        if (config.baseSlotIdOffset !== undefined) {
            this._baseSlotIdOffset = config.baseSlotIdOffset;
        }
        if (config.slotsPerPlayer !== undefined) {
            this._slotsPerPlayer = config.slotsPerPlayer;
        }
        // 驗證 gridSize
        if (config.gridSize !== undefined && config.gridSize !== 15) {
            console.warn(
                `[BasicPathGenerator] 只支援 15×15 棋盤，` +
                `傳入的 gridSize ${config.gridSize} 將被忽略。` +
                `路徑座標是為 15×15 棋盤硬編碼設計的。`
            );
        }
        
        // 接收並驗證 playerCount
        if (config.playerCount !== undefined) {
            if (config.playerCount < 2 || config.playerCount > 4) {
                console.warn(
                    `[BasicPathGenerator] playerCount 應在 2-4 之間，` +
                    `傳入值 ${config.playerCount} 無效，使用預設值 4`
                );
                this._playerCount = 4;
            } else {
                this._playerCount = config.playerCount;
            }
        }
        
        // 驗證路徑長度（資訊性警告）
        if (config.outerPathLength !== undefined && config.outerPathLength !== 52) {
            console.warn(
                `[BasicPathGenerator] 當前外圈路徑長度固定為 52 格，` +
                `配置值 ${config.outerPathLength} 將被忽略`
            );
        }
        
        if (config.innerPathLength !== undefined && config.innerPathLength !== 6) {
            console.warn(
                `[BasicPathGenerator] 當前內線路徑長度固定為 6 格，` +
                `配置值 ${config.innerPathLength} 將被忽略`
            );
        }
    }

    public createPaths(): void {
        // 獲取藍色基礎路徑 (包含 Outer + Inner)
        const basePath = [...BLUE_OUTER_PATH, ...BLUE_INNER_PATH];
        
        for (let playerType = 0; playerType < this._playerCount; playerType++) {
            // 根據玩家類型進行座標轉換
            this._pathMap[playerType] = basePath.map(coord => 
                this.rotateCoords(coord[0], coord[1], playerType)
            );
        }
        
        console.log(`路徑生成完成：共 ${this._playerCount} 玩家，每條路徑 ${basePath.length} 格`);
        console.log('all paths:', this._pathMap);
    }

     /**
     * 產生所有玩家的基地棋子座標映射
     * 基於藍色玩家的基地座標進行平移轉換（保持順時針順序）
     */
    public createBaseMaps(): void {
        for (let playerType = 0; playerType < this._playerCount; playerType++) {
            // 根據玩家類型進行座標轉換（使用專門的基地坐標轉換方法）
            this._baseMap[playerType] = BLUE_BASE_SLOTS.map(coord => 
                this.translateBaseCoords(coord[0], coord[1], playerType)
            );
            
            // 🆕 同時生成 SlotID 陣列
            const startSlotId = this._baseSlotIdOffset - (playerType * this._slotsPerPlayer);
            this._slotIdMap[playerType] = Array.from(
                { length: this._slotsPerPlayer }, 
                (_, i) => startSlotId - i
            );
        }
        
        console.log(`基地座標生成完成：共 ${this._playerCount} 玩家，每個基地 ${BLUE_BASE_SLOTS.length} 個坑位`);
        console.log('all base maps:', this._baseMap);
        console.log('all slot ID maps:', this._slotIdMap);
    }
    //--兩個一起產生
    public createPathAndBaseMaps(): void {
        this.createPaths();
        this.createBaseMaps();
    }

    public getPathMap(): Record<number, number[][]> {
        return this._pathMap;
    }

    public getPlayerPath(playerType: number): number[][] {
        if (!this._pathMap[playerType]) {
            console.warn(`玩家 ${playerType} 的路徑不存在`);
            return [];
        }
        return this._pathMap[playerType];
    }

    /**
     * 獲取所有玩家的基地棋子座標映射
     */
    public getBaseMap(): Record<number, number[][]> {
        return this._baseMap;
    }

    /**
     * 獲取指定玩家的基地棋子座標
     * @param playerType 玩家類型 (0:藍, 1:紅, 2:綠, 3:黃)
     */
    public getPlayerBaseSlots(playerType: number): number[][] {
        if (!this._baseMap[playerType]) {
            console.warn(`玩家 ${playerType} 的基地座標不存在`);
            return [];
        }
        return this._baseMap[playerType];
    }

    /**
     * 獲取所有玩家的 Slot ID 映射
     * @returns 玩家類型 -> Slot ID 陣列的映射
     *          例如: { 0: [-1,-2,-3,-4], 1: [-5,-6,-7,-8], ... }
     */
    public getSlotIdMap(): Record<number, number[]> {
        return this._slotIdMap;
    }

    /**
     * 獲取指定玩家的所有 Slot ID
     * @param playerType 玩家類型 (0:藍, 1:紅, 2:綠, 3:黃)
     * @returns 該玩家的 Slot ID 陣列，如 [-1, -2, -3, -4]
     */
    public getPlayerSlotIds(playerType: number): number[] {
        if (!this._slotIdMap[playerType]) {
            console.warn(`玩家 ${playerType} 的 Slot ID 不存在`);
            return [];
        }
        return this._slotIdMap[playerType];
    }

    /**
     * 根據 Slot ID 反查玩家類型和陣列索引
     * @param slotId 坑位 ID（負數，如 -1, -2, ..., -16）
     * @returns { playerType: 玩家類型, index: 在該玩家陣列中的索引 }，如果找不到則返回 null
     * 
     * 範例：
     * - slotId = -2 → { playerType: 0, index: 1 }  (Blue 的第 2 個坑位)
     * - slotId = -6 → { playerType: 1, index: 1 }  (Red 的第 2 個坑位)
     */
    public getSlotInfo(slotId: number): { playerType: number, index: number } | null {
        for (const playerType in this._slotIdMap) {
            const slots = this._slotIdMap[playerType];
            const index = slots.indexOf(slotId);
            if (index !== -1) {
                return { playerType: Number(playerType), index };
            }
        }
        return null;
    }

    /**
     * 將藍色基地坑位座標平移以適應其他玩家
     * 基地坑位採用區塊平移而非旋轉，以保持順時針排列順序
     * 
     * @param row 原始 Row
     * @param col 原始 Col
     * @param playerType 0:藍(左下), 1:紅(左上), 2:綠(右上), 3:黃(右下)
     * @returns 轉換後的座標 [row, col]
     * 
     * 轉換規則：
     * - Blue(0):   基準 [3,1], [3,3], [1,1], [1,3]
     * - Red(1):    row+9 → [12,1], [12,3], [10,1], [10,3]
     * - Green(2):  row+9, col+9 → [12,10], [12,12], [10,10], [10,12]
     * - Yellow(3): col+9 → [3,10], [3,12], [1,10], [1,12]
     */
    private translateBaseCoords(row: number, col: number, playerType: number): [number, number] {
        const offset = 9;  // 基地區塊間距（從左下到左上/右下的距離）
        
        switch(playerType) {
            case 0: // Blue (左下) - 基準位置
                return [row, col];
            case 1: // Red (左上) - row方向平移
                return [row + offset, col];
            case 2: // Green (右上) - 對角平移
                return [row + offset, col + offset];
            case 3: // Yellow (右下) - col方向平移
                return [row, col + offset];
            default:
                return [row, col];
        }
    }

    /**
     * 將藍色路徑座標旋轉以適應其他玩家
     * @param row 原始 Row
     * @param col 原始 Col
     * @param playerType 0:藍, 1:紅, 2:綠, 3:黃
     */
    private rotateCoords(row: number, col: number, playerType: number): [number, number] {
        const center = Math.floor(this.GRID_SIZE / 2); // 15x15 的中心索引是 7
        let r = row - center;
        let c = col - center;

        // 順時針旋轉 90 度 * playerType 次
        for (let i = 0; i < playerType; i++) {
            // 順時針旋轉 90 度公式: (r, c) -> (-c, r)
            let temp = r;
            r = -c;
            c = temp;
            /*
            const temp = r;
            r = c;
            c = -temp;
            */
        }

        return [r + center, c + center];
    }
}