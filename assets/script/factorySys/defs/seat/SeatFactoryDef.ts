/**
 * 玩家座位配置參數
 */
export interface ISeatingConfig {
    //最大玩家數
    maxPlayers: number;
    //座位布局類型
    layoutType: 'cross' | 'circle' | 'square';
    //是否支持視角旋轉
    enableViewRotation: boolean;
}


/**
 * 玩家座位組件接口
 * 管理玩家的座位排列和顯示位置
 */
export interface IPlayerSeating {
    /**
     * 初始化座位佈局
     */
    initializeSeats(): void;
    
    /**
     * 獲取玩家的座位索引
     * @param playerType 玩家類型 (0:Blue, 1:Red, 2:Green, 3:Yellow)
     * @returns 座位索引（0:左下, 1:左上, 2:右上, 3:右下）
     */
    getSeatIndex(playerType: number): number;
    
    /**
     * 獲取座位的UI位置（用於顯示玩家資訊）
     * @param seatIndex 座位索引
     * @returns UI位置標識（如 'bottom-left', 'top-left' 等）
     */
    getSeatUIPosition(seatIndex: number): string;
    
    /**
     * 輪轉座位（切換當前玩家視角）
     * @param newCurrentPlayer 新的當前玩家
     */
    rotateSeatView(newCurrentPlayer: number): void;
    
    /**
     * 獲取所有座位資訊
     * @returns 座位索引到玩家類型的映射
     */
    getAllSeats(): Map<number, number>;
}