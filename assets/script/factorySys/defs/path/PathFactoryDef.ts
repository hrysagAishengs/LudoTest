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
    //--for test
    //getPathMapOld(): Record<number, number[][]>;
    
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
    //getSlotInfo(slotId: number): { playerType: number, index: number } | null;
}

/**
 * 視角轉換器介面
 * 處理不同玩家視角的座標轉換和路徑計算
 * 
 * 職責：負責座標系轉換和基於路徑的計算
 */
export interface IViewTransformer {
    /**
     * 
     * @param playerView 真實座位索引
     * @returns 
     */
    isCurrentPlayerView(playerView:number):boolean;
    /**
     * 將真實座位索引轉換為當前畫面的視覺位置
     * 回傳 0:左下(自己), 1:左上, 2:右上, 3:右下
     */
    getLocalViewIndex(queryIndex: number): number;
     /**
     * 根據畫面上的位置，反查他是真實座位的哪一個 index
     */
    getRealIndexFromView(viewIndex: number): number;
    /**
     * 設定路徑內容
     * 必須在使用轉換功能前調用
     * @param pathMap 所有玩家的路徑映射
     */
    setPathContent(pathMap: Record<number, number[][]>): void;
    
    /**
     *  設定原始路徑內容（未重映射的標準路徑）
     * 用於 getOtherPlayerDestToGlobal 等方法，保證視覺一致性
     * @param originalPathMap 原始路徑映射 (0:Blue, 1:Red, 2:Green, 3:Yellow)
     */
    setOriginalPathContent(originalPathMap: Record<number, number[][]>): void;
    //--for test
    //setOriginalPathContentOld(originalPathMap: Record<number, number[][]>): void;
    
    /**
     *  設定原始基地內容（未重映射的標準基地）
     * 用於 slotId 查詢，因為 SlotID 固定對應顏色索引
     * @param originalBaseMap 原始基地映射 (0:Blue, 1:Red, 2:Green, 3:Yellow)
     */
    setOriginalBaseContent(originalBaseMap: Record<number, number[][]>): void;
    
    /**
     *  設置總旋轉次數（用於雙重旋轉系統）
     * 此方法由 GameFactoryManager 在 setupLocalPlayerView 時調用，
     * 通知 ViewTransformer 當前實際的總旋轉次數
     * 
     * @param steps 總旋轉次數 (0-3)
     * @param currentPlayerView 當前玩家視角索引（座位索引，0-3）
     * 
     * 背景說明：
     * 在雙重旋轉系統中，底圖會經歷兩次旋轉：
     * 1. 第一次旋轉：隨機基本盤設置（setupRandomBaseboard）
     * 2. 第二次旋轉：玩家視角設置（setupLocalPlayerView）
     * 
     * baseToPlayerView 需要知道實際的總旋轉次數才能正確轉換座標
     */
    setTotalRotation(steps: number, currentPlayerView: number): void;
    
    /**
     * 設置基本盤顏色旋轉索引
     * 此方法由 GameFactoryManager 在 setupRoomWithColorIndex 時調用
     * 
     * @param colorRotation 基本盤顏色旋轉索引 (0-3)
     * 
     * 背景說明：
     * 讓 ViewTransformer 知道基本盤的顏色旋轉索引，
     * 以便在 baseToPlayerView 中正確計算每個 playerView 的旋轉次數
     */
    setBaseColorRotation(colorRotation: number): void;
    
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
    // === InView path query APIs ===

    /**
     * Gets the visual board coordinate for a player's path index in the current view.
     * chairId is the real seat/player index.
     */
    getPathCoordInViewByStartIndex(chairId: number, startIndex: number, steps: number): [number, number] | null;

    /**
     * Gets the visual board coordinate segment for a player's path index range in the current view.
     * chairId is the real seat/player index.
     */
    getPathSegmentInViewByStartIndex(chairId: number, startIndex: number, steps: number): number[][] | null;

    /**
     * Finds the path index for a visual board coordinate in the current view.
     */
    //getPathIndexInViewByPos(chairId: number, pos: [number, number]): number | null;

    /**
     * Gets the visual board coordinate by first resolving a visual start position to a path index.
     */
    getPathCoordInViewByPos(chairId: number, pos: [number, number], steps: number): [number, number] | null;

    /**
     * Gets the visual board coordinate segment by first resolving a visual start position to a path index.
     */
    getPathSegmentInViewByPos(chairId: number, pos: [number, number], steps: number): number[][] | null;

   
    
    
    //======manager需要的在封裝接口==============================
  
    
    //======manager需要的在封裝接口==============================


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
    //getPlayerSlotIds(playerType: number): number[] | null;

    //--test--
    getSeatBaseSlotInView(playerView: number, slotIndex: number):[number,number] | null
    /**
     * 根據 Slot ID 反查玩家類型和陣列索引
     * @param slotId 坑位 ID（負數）
     * @returns { playerType, index } 或 null
     */
    //getSlotInfo(slotId: number): { playerType: number, index: number } | null;

    //======manager需要的在封裝接口==============================
    /**
     * 根據玩家座位索引和坑位索引取得指定<玩家視角>下的基地坑位座標
     * 基本盤未旋轉的座標參照
     * @param chairIndex 玩家座位索引
     * @param slotIndex 坑位索引
     * @returns 指定玩家視角下的基地坑位座標 [row, col]，如果找不到返回 null
     */
    getPlayerBaseBySlotIndex(chairIndex:number, slotIndex:number):[number,number] | null;
    
    /**
     * 根據玩家座位索引和坑位索引取得指定<玩家視角>下的基地坑位 slotId
     * @param chairIndex 玩家座位索引
     * @param slotIndex 坑位索引
     * @returns 指定玩家視角下的基地坑位 ID，如果找不到返回 null
     */
    getPlayerSlotIdBySlotIndex(chairIndex:number, slotIndex:number):number | null;
    
    
    /**
     * 根據玩家座位索引和坑位 ID 取得指定<玩家視角>下的基地坑位座標
     * @param chairIndex 要取得的玩家座位索引
     * @param slotId 坑位 ID
     * @returns 指定玩家視角下的基地坑位座標 [row, col]，如果找不到返回 null
     */
    getPlayerBaseBySlotId(chairIndex:number, slotId:number):[number,number] | null 
    
    
    /**
     * 取得玩家視角下的基地坑位 ID 列表
     * @param chairIndex 座位索引
     * @returns 指定玩家視角下的基地坑位 ID 列表，如果找不到返回 null
     */
    getPlayerSlotIdList(chairIndex:number):number[] | null
    
    /**
     * 取得玩家視角下的基地坑位座標列表
     * @param chairIndex 座位索引
     * @returns 指定玩家視角下的基地坑位座標列表，如果找不到返回 null
     */
    getPlayerBaseList(chairIndex:number):[number,number][] | null



    // === 基地坑位 Slot ID 轉換方法 ==============================
    /**
     * 取得玩家本身的基地坑位全局座標（玩家視角下）
     * @param seatIndex 坑位索引 (0~3)
     */
    getPlayerBSGlobalByIndex(seatIndex:number):[number,number] | null;
    /**
     * 取得玩家本身的基地坑位全局座標（玩家視角下）
     * @param slotId 坑位 ID（負數，如 -1, -2, ..., -4）
     */
    getPlayerBSGlobalById(slotId:number):[number,number] | null;
    /**
     * 取得玩家本身的基地坑位 ID（玩家視角下）
     * @param playerView 玩家視角 
     * @param seatIndex 坑位索引 (0~3)
     */
    getPlayerBSIdByIndex(playerView:number, seatIndex:number):number | null;
    /**
     * 取得玩家本身的基地坑位全局座標列表（玩家視角下）
     */
    getPlayerBSGlobalList():[number,number][] | null;
    /**
     * 取得玩家本身的基地坑位 ID 列表（玩家視角下）
     * @param playerView 玩家視角
     */
    getPlayerBSIdList(playerView:number):number[] | null;
    /**
     * 取得其他玩家的基地坑位全局座標（玩家視角下）
     * @param otherPlayerIndex 其他玩家索引 (0~3)
     * @param seatIndex 坑位索引 (0~3)
     */
    getOtherPlayerBSGlobalByIndex(otherPlayerIndex:number, seatIndex:number):[number,number] | null;
    /**
     * 取得其他玩家的基地坑位全局座標（玩家視角下）
     * @param otherPlayerIndex 其他玩家索引 (0~3)
     * @param slotId 坑位 ID（負數，如 -1, -2, ..., -16）
     */
    getOtherPlayerBSGlobalById(otherPlayerIndex:number, slotId:number):[number,number] | null;
    /**
     * 取得其他玩家的基地坑位 ID（玩家視角下）
     * @param otherPlayerIndex 其他玩家索引 (0~3)
     * @param seatIndex 坑位索引 (0~3)
     */
    getOtherPlayerBSIdByIndex(otherPlayerIndex:number, seatIndex:number):number | null;
    /**
     * 取得其他玩家的基地坑位全局座標列表（玩家視角下）
     * @param otherPlayerIndex 其他玩家索引 (0~3)
     */
    getOtherPlayerBSGlobalList(otherPlayerIndex:number):[number,number][] | null;
    /**
     * 取得其他玩家的基地坑位 ID 列表（玩家視角下）
     * @param otherPlayerIndex 其他玩家索引 (0~3)
     */
    getOtherPlayerBSIdList(otherPlayerIndex:number):number[] | null;

    // === 其他輔助方法 ===

    getAllSlotIds(): number[][] | null
    /**
     * 將 Slot ID 轉換為玩家類型和陣列索引
     * @param slotId 坑位 ID（負數，如 -1, -2, ..., -16）
     * @returns { playerIndex, slotIndex } 或 null
     * 
     * 轉換規則：
     * - 藍色 (playerType=0): -1~-4 → 陣列索引 0~3
     * - 紅色 (playerType=1): -5~-8 → 陣列索引 0~3
     * - 綠色 (playerType=2): -9~-12 → 陣列索引 0~3
     * - 黃色 (playerType=3): -13~-16 → 陣列索引 0~3
     */
    slotIdToIndex(slotId: number):{ playerIndex: number, slotIndex: number } | null
    
    
    
    
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
    // 用於測試的路徑編號，非必填，如果提供則會生成對應的測試路徑default false;
    useTestPathIndex?: boolean; 
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
