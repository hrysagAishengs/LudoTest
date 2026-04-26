//---要改位置---不太能放這裡
/**
 * 介面上的槽位配置
 * 用於管理 UI 面板與座位的映射關係
 */
export interface IPanelSlot {
    /** UI 上的位置編號 (0-3，通常 0 是底部) */
    viewIndex: number;
    /** 當前佔據這個位置的是哪個原始座位 (0-3) */
    globalSeatIndex: number;
    /** 是否有玩家 */
    isOccupied: boolean;
}
