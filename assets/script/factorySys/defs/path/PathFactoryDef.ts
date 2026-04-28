import { LudoGameMode } from '../../../gameDef/GameDef';

/**
 * 路徑生成器介面
 * 所有路徑生成器都必須實現這個介面
 * 
 * 職責：負責生成遊戲路徑資料
 */
export interface IPathGenerator {
    /**
     * 創建所有玩家的路徑
     * 應該初始化並計算所有玩家的完整路徑
     */
    createPaths(): void;
    /**
     * 產生所有玩家的基地棋子座標映射
     */
    createBaseMaps(): void;

    /**
     * 產生路徑與玩家基地座標的映射
     */
    createPathAndBaseMaps(): void;
    
    /**
     * 獲取所有玩家的路徑映射
     * @returns 玩家類型 -> 路徑座標陣列的映射
     *          例如: { 0: [[1,6], [2,6], ...], 1: [[8,1], ...], ... }
     */
    getPathMap(): Record<number, number[][]>;
    
    /**
     * 獲取單個玩家的路徑
     * @param playerType 玩家類型 (0:Blue, 1:Red, 2:Green, 3:Yellow)
     * @returns 該玩家的完整路徑座標陣列
     */
    getPlayerPath(playerType: number): number[][];
    /**
     * 獲取指定玩家的基地棋子座標
     * @param playerType 玩家類型 (0:Blue, 1:Red, 2:Green, 3:Yellow)
     * @returns 該玩家的基地棋子座標陣列
     */
    getPlayerBaseSlots(playerType: number): number[][];
    
    /**
     * 獲取所有玩家的 Slot ID 映射
     * @returns 玩家類型 -> Slot ID 陣列的映射
     */
    getSlotIdMap(): Record<number, number[]>;
    
    /**
     * 獲取指定玩家的所有 Slot ID
     * @param playerType 玩家類型 (0:藍, 1:紅, 2:綠, 3:黃)
     * @returns 該玩家的 Slot ID 陣列
     */
    getPlayerSlotIds(playerType: number): number[];
    
    /**
     * 根據 Slot ID 反查玩家類型和陣列索引
     * @param slotId 坑位 ID（負數）
     * @returns { playerType, index } 或 null
     */
    getSlotInfo(slotId: number): { playerType: number, index: number } | null;
}

/**
 * 視角轉換器介面
 * 處理不同玩家視角的座標轉換和路徑計算
 * 
 * 職責：負責座標系轉換和基於路徑的計算
 */
export interface IViewTransformer {
    /**
     * 設定路徑內容
     * 必須在使用轉換功能前調用
     * @param pathMap 所有玩家的路徑映射
     */
    setPathContent(pathMap: Record<number, number[][]>): void;
    
    // === 座標轉換方法 ===
    
    /**
     * 從基本盤座標轉換到指定玩家視角的座標
     * @param row 基本盤的 row 座標
     * @param col 基本盤的 col 座標
     * @param currentPlayer 當前在左下角的玩家 (0:Blue, 1:Red, 2:Green, 3:Yellow)
     * @returns 轉換後的座標 [row, col]
     * 
     * 示例：Blue的基本盤起點 [1,6] 在Yellow視角下是 [8,1]
     */
    baseToPlayerView(row: number, col: number, currentPlayer: number): [number, number];
    
    /**
     * 從玩家視角座標轉換回基本盤座標
     * @param row 玩家視角的 row 座標
     * @param col 玩家視角的 col 座標
     * @param currentPlayer 當前在左下角的玩家 (0:Blue, 1:Red, 2:Green, 3:Yellow)
     * @returns 轉換後的基本盤座標 [row, col]
     */
    playerViewToBase(row: number, col: number, currentPlayer: number): [number, number];
    
    // === 基於位置的路徑計算 ===
    
    /**
     * 計算從起點位置移動指定步數後的終點位置
     * @param playerView 當前玩家視角 (0:Blue, 1:Red, 2:Green, 3:Yellow)
     * @param startPos 起點位置 [row, col]（玩家視角下的座標）
     * @param steps 移動步數
     * @returns 終點位置 [row, col]（玩家視角下的座標），如果超出路徑返回 null
     * 
     * 示例：藍色玩家從起點 [1,6] 移動 5 步 -> [6,6]
     */
    getDestinationByPos(playerView: number, startPos: [number, number], steps: number): [number, number] | null;
    
    /**
     * 獲取從起點到終點的完整路徑段（基於起點位置）
     * @param playerView 當前玩家視角 (0:Blue, 1:Red, 2:Green, 3:Yellow)
     * @param startPos 起點位置 [row, col]（玩家視角下的座標）
     * @param steps 移動步數
     * @returns 路徑段陣列（包含起點和終點，均為玩家視角下的座標），如果超出路徑返回 null
     * 
     * 示例：[[1,6], [2,6], [3,6], [4,6], [5,6], [6,6]]（6個位置，包含起點和終點）
     */
    getPathSegmentByPos(playerView: number, startPos: [number, number], steps: number): number[][] | null;
    
    // === 基於索引的路徑計算 ===
    
    /**
     * 計算從起點索引移動指定步數後的終點位置
     * @param playerView 當前玩家視角 (0:Blue, 1:Red, 2:Green, 3:Yellow)
     * @param startIndex 起點索引（在該玩家路徑陣列中的索引位置）
     * @param steps 移動步數
     * @returns 終點位置 [row, col]（玩家視角下的座標），如果超出路徑返回 null
     * 
     * 注意：索引從 0 開始，索引 0 通常是玩家的起飛點
     */
    getDestinationByStartIndex(playerView: number, startIndex: number, steps: number): [number, number] | null;
    
    /**
     * 獲取從起點到終點的完整路徑段（基於起點索引）
     * @param playerView 當前玩家視角 (0:Blue, 1:Red, 2:Green, 3:Yellow)
     * @param startIndex 起點索引（在該玩家路徑陣列中的索引位置）
     * @param steps 移動步數
     * @returns 路徑段陣列（包含起點和終點，均為玩家視角下的座標），如果超出路徑返回 null
     */
    getPathSegmentByStartIndex(playerView: number, startIndex: number, steps: number): number[][] | null;
    
    // === 多玩家視角轉換 ===
    
    /**
     * 計算其他玩家從指定索引移動後的終點位置（返回當前玩家視角下的座標）
     * @param playerView 當前玩家視角 (0:Blue, 1:Red, 2:Green, 3:Yellow)
     * @param otherPlayer 在當前玩家視角下的其他玩家相對位置 (0:左下, 1:左上, 2:右上, 3:右下)
     * @param startIndex 其他玩家在**基本盤路徑**上的起點索引
     * @param steps 移動步數
     * @returns 終點位置 [row, col]（當前玩家視角下的座標），如果超出路徑返回 null
     * 
     * 示例：黃色玩家(3)視角下，查看左上角玩家(1=藍色)從索引5移動3步的終點
     *      返回在黃色玩家視角下看到的藍色玩家的終點座標
     */
    getOtherPlayerDestToGlobal(
        playerView: number, 
        otherPlayer: number, 
        startIndex: number, 
        steps: number
    ): [number, number] | null;
    
    /**
     * 計算其他玩家從指定索引移動後的路徑段（返回當前玩家視角下的座標）
     * @param playerView 當前玩家視角 (0:Blue, 1:Red, 2:Green, 3:Yellow)
     * @param otherPlayer 在當前玩家視角下的其他玩家相對位置 (0:左下, 1:左上, 2:右上, 3:右下)
     * @param startIndex 其他玩家在**基本盤路徑**上的起點索引
     * @param steps 移動步數
     * @returns 路徑段陣列（包含起點和終點，均為當前玩家視角下的座標），如果超出路徑返回 null
     */
    getOtherPlayerDestToGlobalSegment(
        playerView: number, 
        otherPlayer: number, 
        startIndex: number, 
        steps: number
    ): number[][] | null;
    
    // === 基地坑位設置方法 ===
    
    /**
     * 設定基地棋子座標內容
     * 必須在使用基地坑位轉換功能前調用
     * @param baseMap 所有玩家的基地座標映射
     */
    setBaseContent(baseMap: Record<number, number[][]>): void;
    
    /**
     * 設定基地坑位 Slot ID 配置
     * @param offset 坑位 ID 起始值（預設 -1）
     * @param slotsPerPlayer 每個玩家的坑位數量（預設 4）
     */
    setBaseSlotConfig(offset: number, slotsPerPlayer: number): void;
    
    /**
     * 設置 Slot ID 映射表
     * @param slotIdMap 所有玩家的 Slot ID 映射
     */
    setSlotIdMap(slotIdMap: Record<number, number[]>): void;
    
    /**
     * 獲取指定玩家的所有 Slot ID
     * @param playerType 玩家類型 (0:藍, 1:紅, 2:綠, 3:黃)
     * @returns 該玩家的 Slot ID 陣列或 null
     */
    getPlayerSlotIds(playerType: number): number[] | null;
    
    /**
     * 根據 Slot ID 反查玩家類型和陣列索引
     * @param slotId 坑位 ID（負數）
     * @returns { playerType, index } 或 null
     */
    getSlotInfo(slotId: number): { playerType: number, index: number } | null;
    
    // === 基地坑位 Slot ID 轉換方法 ===
    
    /**
     * 將 Slot ID 轉換為玩家類型和陣列索引
     * @param slotId 坑位 ID（負數，如 -1, -2, ..., -16）
     * @returns [玩家類型, 陣列索引]，如果 slotId 無效則返回 null
     * 
     * 轉換規則：
     * - 藍色 (playerType=0): -1~-4 → 陣列索引 0~3
     * - 紅色 (playerType=1): -5~-8 → 陣列索引 0~3
     * - 綠色 (playerType=2): -9~-12 → 陣列索引 0~3
     * - 黃色 (playerType=3): -13~-16 → 陣列索引 0~3
     */
    slotIdToIndex(slotId: number): [number, number] | null;
    
    /**
     * 將玩家類型和陣列索引轉換為 Slot ID（反向轉換）
     * @param playerType 玩家類型 (0:藍, 1:紅, 2:綠, 3:黃)
     * @param arrayIndex 陣列索引 (0~3)
     * @returns Slot ID（負數）
     */
    indexToSlotId(playerType: number, arrayIndex: number): number;
    
    // === 基地坑位視角轉換方法 ===
    
    /**
     * 根據 Slot ID 獲取指定玩家視角下的基地坑位座標
     * @param playerView 當前玩家視角 (0:Blue, 1:Red, 2:Green, 3:Yellow)
     * @param slotId 坑位 ID（負數，如 -1, -2, ..., -16）
     * @returns 玩家視角下的基地坑位座標 [row, col]，如果找不到則返回 null
     */
    getBaseSlotInView(playerView: number, slotId: number): [number, number] | null;
    
    /**
     * 以指定玩家的視角來看，獲取在這個視角下另一個玩家的基地坑位座標列表
     * 
     * @param playerType 玩家類型 (0:藍, 1:紅, 2:綠, 3:黃)-要取得哪個玩家的基地坑位
     * @param playerView 當前玩家視角 (0:Blue, 1:Red, 2:Green, 3:Yellow)
     * @returns 玩家視角下的所有基地坑位座標陣列，如果找不到則返回 null
     */
    getSingleBaseSlotListByCurrentView(playerType: number, playerView: number): number[][] | null;

    
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
    getBaseSlotByCurrentView(playerType: number, slotId: number, playerView: number): [number, number] | null;


    /**
     * 根據 Slot ID 獲取指定玩家視角下的基地坑位座標（自動從 Slot ID 換算玩家類型）
     * 
     * 此方法會自動從 Slot ID 計算出對應的玩家類型，無需手動傳入 playerType
     * @param slotId 坑位 ID（負數，如 -1, -2, ..., -16）
     * @param playerView 當前玩家視角 (0:Blue, 1:Red, 2:Green, 3:Yellow)
     * @returns 玩家視角下的基地坑位座標 [row, col]，如果找不到則返回 null
     */
    getBaseSlotInViewById(slotId: number, playerView: number): [number, number] | null ;
    
    
    /**
     * 根據 Slot ID 獲取指定玩家視角下的基地坑位座標（自動從 Slot ID 換算玩家類型）
     * 
     * 此方法會自動從 Slot ID 計算出對應的玩家類型，無需手動傳入 playerType
     * 
     * @param slotId 坑位 ID（負數，如 -1, -2, ..., -16）
     * @param playerView 當前玩家視角 (0:Blue, 1:Red, 2:Green, 3:Yellow)
     * @returns 玩家視角下的基地坑位座標 [row, col]，如果找不到則返回 null
     */
    getBaseSlotInViewById(slotId: number, playerView: number): [number, number] | null;

    /**
     * 獲取所有玩家的基地坑位在某個視角下的座標
     * @param playerView 當前玩家視角 (0:Blue, 1:Red, 2:Green, 3:Yellow)
     * @returns 所有玩家的基地坑位座標映射（按玩家類型分組），如果找不到則返回 null
     */
    getAllBaseSlotsByCurrentView(playerView: number): Record<number, number[][]> | null;
    
    
    
    
}

/**
 * 路徑生成配置
 * 用於配置不同遊戲模式下的路徑生成參數
 */
export interface IPathConfig {
     
    //- 棋盤大小（可選）--default 15x15
    gridSize?: number;
    //-玩家數量（可選）default 4
    playerCount?: number;
    //-外圈路徑長度（可選）標準 Ludo 遊戲為 default 52 格
    outerPathLength?: number;
    //-內線路徑長度（可選）標準 Ludo 遊戲為 default 6 格
    innerPathLength?: number;
    //-基地坑位 ID 起始值（可選）default -1
    baseSlotIdOffset?: number;
    //-每個玩家的坑位數量（可選）default 4
    slotsPerPlayer?: number;
}


/**
 * 路徑工廠抽象類
 * 定義了創建路徑生成器和視角轉換器的標準流程
 * 
 * 所有具體的路徑工廠都必須繼承這個類並實現其抽象方法
 */
export abstract class PathFactory {
    /**
     * 設定路徑配置
     * 在創建生成器之前必須調用
     * @param config 路徑配置對象
     */
    abstract setPathConfig(config: IPathConfig): void;
    
    /**
     * 創建路徑生成器
     * 應該返回一個已經初始化的路徑生成器實例
     * @returns 路徑生成器實例
     */
    abstract createPathGenerator(): IPathGenerator;
    
    /**
     * 創建視角轉換器
     * 應該返回一個已經關聯了路徑資料的視角轉換器實例
     * @returns 視角轉換器實例
     */
    abstract createViewTransformer(): IViewTransformer;
    
    /**
     * 銷毀路徑生成器
     * 清理資源，釋放記憶體
     */
    abstract destroyPathGenerator(): void;
}