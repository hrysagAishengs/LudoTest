import { IViewTransformer } from "../../defs/path/PathFactoryDef";

/**
 * 基礎視角轉換器
 * 處理標準 15x15 棋盤的視角轉換和路徑計算
 * 
 * 主要功能：
 * 1. 基本盤座標 ↔ 玩家視角座標的轉換
 * 2. 基於位置或索引的路徑計算
 * 3. 多玩家視角的座標轉換
 */
export class BasicViewTransformer implements IViewTransformer {
    
    private readonly BOARD_MAX_INDEX = 14; // 15x15 棋盤的最大索引
    private _pathMap: Record<number, number[][]> | null = null;
    private _baseMap: Record<number, number[][]> | null = null;
    
    // 基地坑位 Slot ID 配置
    private _baseSlotIdOffset: number = -1;  // 坑位 ID 起始值（預設 -1）
    private _slotsPerPlayer: number = 4;      // 每個玩家的坑位數量（預設 4）

    /**
     * 設置路徑內容
     * @param pathMap 所有玩家的路徑映射
     */
    public setPathContent(pathMap: Record<number, number[][]>): void {
        this._pathMap = pathMap;
    }

    /**
     * 設置基地棋子座標內容
     * @param baseMap 所有玩家的基地座標映射
     */
    public setBaseContent(baseMap: Record<number, number[][]>): void {
        this._baseMap = baseMap;
    }

    /**
     * 設置基地坑位 Slot ID 配置
     * @param offset 坑位 ID 起始值（預設 -1）
     * @param slotsPerPlayer 每個玩家的坑位數量（預設 4）
     */
    public setBaseSlotConfig(offset: number, slotsPerPlayer: number): void {
        this._baseSlotIdOffset = offset;
        this._slotsPerPlayer = slotsPerPlayer;
    }

    // ========== 座標轉換方法 ==========

    /**
     * 從基本盤座標轉換到指定玩家視角的座標
     * 
     * 轉換邏輯：
     * - Blue(0) → 0次旋轉
     * - Yellow(3) → 1次逆時針旋轉
     * - Green(2) → 2次逆時針旋轉
     * - Red(1) → 3次逆時針旋轉
     * 
     * @param row 基本盤的 row 座標
     * @param col 基本盤的 col 座標
     * @param currentPlayer 當前在左下角的玩家 (0:Blue, 1:Red, 2:Green, 3:Yellow)
     * @returns 轉換後的座標 [row, col]
     */
    public baseToPlayerView(row: number, col: number, currentPlayer: number): [number, number] {
        // 計算需要逆時針旋轉的次數
        const rotations = (4 - currentPlayer) % 4;
        
        let r = row;
        let c = col;

        for (let i = 0; i < rotations; i++) {
            // 逆時針旋轉90度公式: [r, c] → [14-c, r]
            const temp = r;
            r = this.BOARD_MAX_INDEX - c;
            c = temp;
        }

        return [r, c];
    }

    /**
     * 從基地坑位基本盤座標轉換到指定玩家視角的座標
     * 專門用於基地坑位的視角轉換（與路徑轉換邏輯不同）
     * 
     * 基地坑位使用區塊平移生成，需要特殊的視角轉換邏輯：
     * 1. 計算坑位在其所屬區塊內的相對位置
     * 2. 應用區塊級旋轉
     * 3. 轉換到目標區塊的絕對座標
     * 
     * 基本盤坐標順序（左上、右上、左下、右下）：
     * - Blue(0):   [3,1], [3,3], [1,1], [1,3]    -> slotId -1~-4
     * - Red(1):    [12,1], [12,3], [10,1], [10,3] -> slotId -5~-8
     * - Green(2):  [12,10], [12,12], [10,10], [10,12] -> slotId -9~-12
     * - Yellow(3): [3,10], [3,12], [1,10], [1,12]  -> slotId -13~-16
     * 
     * 範例：在 Yellow(3) 視角下，Red 的坑位轉換為：
     * - [12,1] -> [12,12], [12,3] -> [10,12], [10,1] -> [12,10], [10,3] -> [10,10]
     * 
     * @param row 基本盤的 row 座標
     * @param col 基本盤的 col 座標
     * @param currentPlayer 當前在左下角的玩家 (0:Blue, 1:Red, 2:Green, 3:Yellow)
     * @returns 轉換後的座標 [row, col]
     */
    public baseSlotToPlayerView(row: number, col: number, currentPlayer: number): [number, number] {
        // 確定該坐標屬於哪個玩家的區塊
        let ownerPlayer = -1;
        const blockSize = 2; // 每個區塊是 3x3，但坐標範圍是 0-2
        const baseMin = 1;   // Blue 區塊左下角 [1,1]
        const blockOffset = 9; // 區塊間距
        
        // 判斷屬於哪個玩家的區塊
        if (row >= baseMin && row <= baseMin + blockSize && col >= baseMin && col <= baseMin + blockSize) {
            ownerPlayer = 0; // Blue
        } else if (row >= baseMin + blockOffset && row <= baseMin + blockOffset + blockSize && col >= baseMin && col <= baseMin + blockSize) {
            ownerPlayer = 1; // Red
        } else if (row >= baseMin + blockOffset && row <= baseMin + blockOffset + blockSize && col >= baseMin + blockOffset && col <= baseMin + blockOffset + blockSize) {
            ownerPlayer = 2; // Green
        } else if (row >= baseMin && row <= baseMin + blockSize && col >= baseMin + blockOffset && col <= baseMin + blockOffset + blockSize) {
            ownerPlayer = 3; // Yellow
        }
        
        if (ownerPlayer === -1) return [row, col]; // 無法識別，返回原座標
        
        // 計算該玩家在基本盤上的區塊基準點
        let blockBaseRow = baseMin;
        let blockBaseCol = baseMin;
        if (ownerPlayer === 1) blockBaseRow += blockOffset; // Red
        if (ownerPlayer === 2) { blockBaseRow += blockOffset; blockBaseCol += blockOffset; } // Green
        if (ownerPlayer === 3) blockBaseCol += blockOffset; // Yellow
        
        // 轉換為相對坐標
        let relRow = row - blockBaseRow;
        let relCol = col - blockBaseCol;
        
        // 計算需要旋轉的次數（逆時針）
        const rotations = (4 - currentPlayer) % 4;
        
        // 應用旋轉（每次順時針 90 度，在相對坐標系統中）
        for (let i = 0; i < rotations; i++) {
            // 順時針 90 度: (r,c) → (blockSize-c, r)
            const temp = relRow;
            relRow = blockSize - relCol;
            relCol = temp;
        }
        
        // 計算目標玩家在視角轉換後的區塊位置
        // ownerPlayer 在基本盤的位置 -> 旋轉後的位置
        // 逆時針旋轉：position - currentPlayer
        const targetPlayer = (ownerPlayer - currentPlayer + 4) % 4;
        
        // 計算目標區塊的基準點
        let targetBlockRow = baseMin;
        let targetBlockCol = baseMin;
        if (targetPlayer === 1) targetBlockRow += blockOffset; // Red position
        if (targetPlayer === 2) { targetBlockRow += blockOffset; targetBlockCol += blockOffset; } // Green position
        if (targetPlayer === 3) targetBlockCol += blockOffset; // Yellow position
        
        // 轉回絕對坐標
        return [targetBlockRow + relRow, targetBlockCol + relCol];
    }

    /**
     * 從玩家視角座標轉換回基本盤座標
     * 
     * @param row 玩家視角的 row 座標
     * @param col 玩家視角的 col 座標
     * @param currentPlayer 當前在左下角的玩家 (0:Blue, 1:Red, 2:Green, 3:Yellow)
     * @returns 轉換後的基本盤座標 [row, col]
     */
    public playerViewToBase(row: number, col: number, currentPlayer: number): [number, number] {
        // 計算需要順時針旋轉的次數（與逆時針相反）
        const rotations = (4 - currentPlayer) % 4;
        
        let r = row;
        let c = col;

        for (let i = 0; i < rotations; i++) {
            // 順時針旋轉90度公式: [r, c] → [c, 14-r]
            const temp = r;
            r = c;
            c = this.BOARD_MAX_INDEX - temp;
        }

        return [r, c];
    }

    // ========== 基於位置的路徑計算 ==========

    /**
     * 計算從起點位置移動指定步數後的終點位置
     * 
     * @param playerView 當前玩家視角 (0:Blue, 1:Red, 2:Green, 3:Yellow)
     * @param startPos 起點位置 [row, col]（玩家視角下的座標）
     * @param steps 移動步數
     * @returns 終點位置 [row, col]（玩家視角下的座標），如果超出路徑返回 null
     */
    public getDestinationByPos(playerView: number, startPos: [number, number], steps: number): [number, number] | null {
        // 獲取該玩家在基本盤的路徑
        const basePath = this._pathMap?.[playerView];
        if (!basePath) return null;

        // 將玩家視角下的座標轉回基本盤座標
        const baseStartPos = this.playerViewToBase(startPos[0], startPos[1], playerView);
        
        // 在基本盤路徑中找到起點索引
        const startIndex = basePath.findIndex(([r, c]) => r === baseStartPos[0] && c === baseStartPos[1]);
        if (startIndex === -1) return null; // 起點不在路徑中

        // 計算終點索引
        const endIndex = startIndex + steps;
        if (endIndex < 0 || endIndex >= basePath.length) return null; // 超出路徑範圍

        // 獲取基本盤的終點座標
        const baseEndPos = basePath[endIndex];
        
        // 轉換回玩家視角
        return this.baseToPlayerView(baseEndPos[0], baseEndPos[1], playerView);
    }

    /**
     * 獲取從起點到終點的完整路徑段（基於起點位置）
     * 
     * @param playerView 當前玩家視角 (0:Blue, 1:Red, 2:Green, 3:Yellow)
     * @param startPos 起點位置 [row, col]（玩家視角下的座標）
     * @param steps 移動步數
     * @returns 路徑段陣列（包含起點和終點，均為玩家視角下的座標），如果超出路徑返回 null
     */
    public getPathSegmentByPos(playerView: number, startPos: [number, number], steps: number): number[][] | null {
        // 獲取該玩家在基本盤的路徑
        const basePath = this._pathMap?.[playerView];
        if (!basePath) return null;

        // 將玩家視角下的座標轉回基本盤座標
        const baseStartPos = this.playerViewToBase(startPos[0], startPos[1], playerView);
        
        // 在基本盤路徑中找到起點索引
        const startIndex = basePath.findIndex(([r, c]) => r === baseStartPos[0] && c === baseStartPos[1]);
        if (startIndex === -1) return null; // 起點不在路徑中

        // 計算終點索引
        const endIndex = startIndex + steps;
        if (endIndex < 0 || endIndex >= basePath.length) return null; // 超出路徑範圍

        // 獲取基本盤的路徑段
        const baseSegment = basePath.slice(startIndex, endIndex + 1);
        
        // 將整個路徑段轉換為玩家視角
        return baseSegment.map(([r, c]) => {
            const viewCoord = this.baseToPlayerView(r, c, playerView);
            return [viewCoord[0], viewCoord[1]];
        });
    }

    // ========== 基於索引的路徑計算 ==========

    /**
     * 計算從起點索引移動指定步數後的終點位置
     * 
     * @param playerView 當前玩家視角 (0:Blue, 1:Red, 2:Green, 3:Yellow)
     * @param startIndex 起點索引（在該玩家路徑陣列中的索引位置）
     * @param steps 移動步數
     * @returns 終點位置 [row, col]（玩家視角下的座標），如果超出路徑返回 null
     */
    public getDestinationByStartIndex(playerView: number, startIndex: number, steps: number): [number, number] | null {
        
        const basePath = this._pathMap?.[playerView];
        if (!basePath) return null;

        const endIndex = startIndex + steps;
        if (endIndex < 0 || endIndex >= basePath.length) return null;

        const baseEndPos = basePath[endIndex];
        return this.baseToPlayerView(baseEndPos[0], baseEndPos[1], playerView);
    }

    /**
     * 獲取從起點到終點的完整路徑段（基於起點索引）
     * 
     * @param playerView 當前玩家視角 (0:Blue, 1:Red, 2:Green, 3:Yellow)
     * @param startIndex 起點索引（在該玩家路徑陣列中的索引位置）
     * @param steps 移動步數
     * @returns 路徑段陣列（包含起點和終點，均為玩家視角下的座標），如果超出路徑返回 null
     */
    public getPathSegmentByStartIndex(playerView: number, startIndex: number, steps: number): number[][] | null {
        
        const basePath = this._pathMap?.[playerView];
        if (!basePath) return null;

        const endIndex = startIndex + steps;
        if (endIndex < 0 || endIndex >= basePath.length) return null;

        const baseSegment = basePath.slice(startIndex, endIndex + 1);
        return baseSegment.map(([r, c]) => this.baseToPlayerView(r, c, playerView));
    }

    // ========== 多玩家視角轉換 ==========

    /**
     * 計算其他玩家從指定索引移動後的終點位置（返回當前玩家視角下的座標）
     * 
     * @param playerView 當前玩家視角 (0:Blue, 1:Red, 2:Green, 3:Yellow)
     * @param otherPlayer 在當前玩家視角下的其他玩家相對位置 (0:左下, 1:左上, 2:右上, 3:右下)
     * @param startIndex 其他玩家在**基本盤路徑**上的起點索引
     * @param steps 移動步數
     * @returns 終點位置 [row, col]（當前玩家視角下的座標），如果超出路徑返回 null
     */
    public getOtherPlayerDestToGlobal(
        playerView: number,
        otherPlayer: number,
        startIndex: number,
        steps: number
    ): [number, number] | null {
        // 獲取該玩家在基本盤的路徑
        const basePath = this._pathMap?.[otherPlayer];
        if (!basePath) return null;

        const endIndex = startIndex + steps;
        if (endIndex < 0 || endIndex >= basePath.length) return null;

        const baseCoord = basePath[endIndex];
        
        // 轉換為當前玩家視角下的座標
        return this.baseToPlayerView(baseCoord[0], baseCoord[1], playerView);
    }

    /**
     * 計算其他玩家從指定索引移動後的路徑段（返回當前玩家視角下的座標）
     * 
     * @param playerView 當前玩家視角 (0:Blue, 1:Red, 2:Green, 3:Yellow)
     * @param otherPlayer 在當前玩家視角下的其他玩家相對位置 (0:左下, 1:左上, 2:右上, 3:右下)
     * @param startIndex 其他玩家在**基本盤路徑**上的起點索引
     * @param steps 移動步數
     * @returns 路徑段陣列（包含起點和終點，均為當前玩家視角下的座標），如果超出路徑返回 null
     */
    public getOtherPlayerDestToGlobalSegment(
        playerView: number,
        otherPlayer: number,
        startIndex: number,
        steps: number
    ): number[][] | null {
        // 獲取該玩家在基本盤的路徑
        const basePath = this._pathMap?.[otherPlayer];
        if (!basePath) return null;

        const endIndex = startIndex + steps;
        if (endIndex < 0 || endIndex >= basePath.length) return null;

        const baseSegment = basePath.slice(startIndex, endIndex + 1);
        
        // 轉換為當前玩家視角下的座標
        return baseSegment.map(([r, c]) => {
            const viewCoord = this.baseToPlayerView(r, c, playerView);
            return [viewCoord[0], viewCoord[1]];
        });
    }

    // ========== 基地坑位 Slot ID 轉換方法 ==========

    /**
     * 將 Slot ID 轉換為玩家類型和陣列索引
     * 
     * 轉換規則：
     * - 藍色 (playerType=0): -1~-4 → 陣列索引 0~3
     * - 紅色 (playerType=1): -5~-8 → 陣列索引 0~3
     * - 綠色 (playerType=2): -9~-12 → 陣列索引 0~3
     * - 黃色 (playerType=3): -13~-16 → 陣列索引 0~3
     * 
     * @param slotId 坑位 ID（負數，如 -1, -2, ..., -16）
     * @returns [玩家類型, 陣列索引]，如果 slotId 無效則返回 null
     */
    public slotIdToIndex(slotId: number): [number, number] | null {
        // 驗證 slotId 範圍
        const maxSlotId = this._baseSlotIdOffset;  // -1
        const minSlotId = this._baseSlotIdOffset - (this._slotsPerPlayer * 4) + 1;  // -16
        
        if (slotId > maxSlotId || slotId < minSlotId) {
            return null;
        }
        
        // 轉換公式
        const zeroBasedId = (-slotId) - 1;  // -1 變成 0, -16 變成 15
        const playerType = Math.floor(zeroBasedId / this._slotsPerPlayer);
        const arrayIndex = zeroBasedId % this._slotsPerPlayer;
        
        return [playerType, arrayIndex];
    }

    /**
     * 將玩家類型和陣列索引轉換為 Slot ID（反向轉換）
     * 
     * @param playerType 玩家類型 (0:藍, 1:紅, 2:綠, 3:黃)
     * @param arrayIndex 陣列索引 (0~3)
     * @returns Slot ID（負數）
     */
    public indexToSlotId(playerType: number, arrayIndex: number): number {
        const zeroBasedId = playerType * this._slotsPerPlayer + arrayIndex;
        return -(zeroBasedId + 1);
    }

    /**
     * 根據 Slot ID 獲取基地坑位的座標（基本盤座標）
     * 內部輔助方法，用於獲取未旋轉的原始坐標
     * 
     * @param slotId 坑位 ID（負數，如 -1, -2, ..., -16）
     * @returns 基地坑位的基本盤座標 [row, col]，如果找不到則返回 null
     */
    private getBaseSlotCoord(slotId: number): [number, number] | null {
        const result = this.slotIdToIndex(slotId);
        if (!result || !this._baseMap) return null;
        
        const [playerType, arrayIndex] = result;
        const slot = this._baseMap[playerType]?.[arrayIndex];
        return slot ? (slot as [number, number]) : null;
    }

    // ========== 基地坑位視角轉換方法 ==========

    /**
     * 根據 Slot ID 獲取指定玩家視角下的基地坑位座標
     * 
     * @param playerView 當前玩家視角 (0:Blue, 1:Red, 2:Green, 3:Yellow)
     * @param slotId 坑位 ID（負數，如 -1, -2, ..., -16）
     * @returns 玩家視角下的基地坑位座標 [row, col]，如果找不到則返回 null
     */
    public getBaseSlotInView(playerView: number, slotId: number): [number, number] | null {
        const baseCoord = this.getBaseSlotCoord(slotId);
        if (!baseCoord) return null;
        
        //return this.baseSlotToPlayerView(baseCoord[0], baseCoord[1], playerView);
        return baseCoord;
    }

    /**
     * 以指定玩家的視角來看，獲取在這個視角下另一個玩家的基地坑位座標列表
     * 
     * @param playerType 玩家類型 (0:藍, 1:紅, 2:綠, 3:黃)-要取得哪個玩家的基地坑位
     * @param playerView 當前玩家視角 (0:Blue, 1:Red, 2:Green, 3:Yellow)
     * @returns 玩家視角下的所有基地坑位座標陣列，如果找不到則返回 null
     */
    public getSingleBaseSlotListByCurrentView(playerType: number, playerView: number): number[][] | null {
        if (!this._baseMap || !this._baseMap[playerType]) return null;
        
        const baseSlots = this._baseMap[playerType];
        return baseSlots.map(([r, c]) => {
            const viewCoord = this.baseSlotToPlayerView(r, c, playerView);
            return [viewCoord[0], viewCoord[1]];
        });
    }

     /**
     * 
     * <以指定玩家的視角來看>:
     * 透過slotId來取得這個視角下的基地坑位座標
     * e.g:
     * 玩家視角是黃色(3),要取得紅色(1)玩家的slotId=-6的基地坑位座標-5 ~ -8
     * 就會換算旋轉下的座標回傳
     * @param playerType 玩家類型 (0:藍, 1:紅, 2:綠, 3:黃)
     * @param slotId 坑位 ID（負數，如 -1, -2, ..., -16）
     * @param playerView 當前玩家視角 (0:Blue, 1:Red, 2:Green, 3:Yellow)
     * @returns 玩家視角下的基地坑位座標 [row, col]，如果找不到則返回 null
     */
    public getBaseSlotByCurrentView(
        playerType: number, 
        slotId: number, 
        playerView: number
    ): [number, number] | null {
        // 先將 Slot ID 轉換為玩家類型和陣列索引
        const result = this.slotIdToIndex(slotId);
        if (!result) return null;
        
        const [idPlayerType, arrayIndex] = result;
        
        // 驗證玩家類型是否匹配
        if (idPlayerType !== playerType) return null;
        
        if (!this._baseMap || !this._baseMap[playerType]) return null;
        
        const slot = this._baseMap[playerType][arrayIndex];
        if (!slot) return null;
        // 將其他玩家的基本盤坐標轉換為當前玩家視角
        return this.baseSlotToPlayerView(slot[0], slot[1], playerView);
    }

    /**
     * 根據 Slot ID 獲取指定玩家視角下的基地坑位座標（自動從 Slot ID 換算玩家類型）
     * 
     * 此方法會自動從 Slot ID 計算出對應的玩家類型，無需手動傳入 playerType
     * 
     * @param slotId 坑位 ID（負數，如 -1, -2, ..., -16）
     * @param playerView 當前玩家視角 (0:Blue, 1:Red, 2:Green, 3:Yellow)
     * @returns 玩家視角下的基地坑位座標 [row, col]，如果找不到則返回 null
     */
    public getBaseSlotInViewById(slotId: number, playerView: number): [number, number] | null {
        // 自動從 Slot ID 轉換為玩家類型和陣列索引
        const result = this.slotIdToIndex(slotId);
        if (!result) return null;
        
        const [playerType, arrayIndex] = result;
        
        if (!this._baseMap || !this._baseMap[playerType]) return null;
        
        const slot = this._baseMap[playerType][arrayIndex];
        if (!slot) return null;
        
        // 將基本盤坐標轉換為當前玩家視角
        return this.baseSlotToPlayerView(slot[0], slot[1], playerView);
    }

    /**
     * 獲取所有玩家的基地坑位在某個視角下的座標
     * 
     * @param playerView 當前玩家視角 (0:Blue, 1:Red, 2:Green, 3:Yellow)
     * @returns 所有玩家的基地坑位座標映射（按玩家類型分組），如果找不到則返回 null
     */
    public getAllBaseSlotsByCurrentView(playerView: number): Record<number, number[][]> | null {
        if (!this._baseMap) return null;
        
        const result: Record<number, number[][]> = {};
        
        for (const playerType in this._baseMap) {
            const playerTypeNum = Number(playerType);
            const baseSlots = this._baseMap[playerTypeNum];
            
            result[playerTypeNum] = baseSlots.map(([r, c]) => {
                const viewCoord = this.baseSlotToPlayerView(r, c, playerView);
                return [viewCoord[0], viewCoord[1]];
            });
        }
        
        return result;
    }

   

   
}