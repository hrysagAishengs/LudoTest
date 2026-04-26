import { Node, Vec3 } from 'cc';

/**
 * 格子狀態枚舉
 */
export enum GridState {
    EMPTY = 0,           // 空白
    OCCUPIED = 1,        // 被占據
    BLOCKED = 2,         // 阻擋
    SAFE_ZONE = 3,       // 安全區
    START_POINT = 4,     // 起點
    END_POINT = 5        // 終點
}

/**
 * 標記類型枚舉
 */
export enum MarkerType {
    NONE = 0,            // 無標記
    START = 1,           // 起點標記
    SAFE = 2,            // 安全區標記
    ARROW = 3,           // 方向箭頭
    FORBIDDEN = 4,       // 禁止符號
    SPECIAL = 5          // 特殊標記
}

/**
 * 裝飾圖示類型枚舉
 */
export enum DecorationType {
    ARROW = 100,         // 箭頭圖示
    SAFE = 101,          // 安全區圖示
    FORBIDDEN = 102      // 禁止符號
}

/**
 * 標記介面
 */
export interface IMarker {
    type: MarkerType;    // 標記類型
    icon: Node | null;   // 圖標節點
    data: any;           // 附加數據
    playerIndex?: number; // 標記所屬玩家索引 (0:Blue, 1:Red, 2:Green, 3:Yellow)
    dataCoord?: [number, number];   // 數據所在坐標（基本盤坐標，不變）
    visualCoord?: [number, number]; // icon 當前顯示坐標（視角旋轉時更新）
}

/**
 * 格子數據介面
 * 包含格子的所有狀態和信息
 */
export interface IGridData {
    // === 基礎信息 ===
    containerNode: Node;             // 容器節點（視覺節點）
    position: Vec3;                  // 世界坐標
    gridCoord: [number, number];     // 網格坐標 [r, c]
    
    // === 狀態信息 ===
    state: GridState;                // 格子當前狀態
    
    // === 裝飾與標記 ===
    decorateNode: Node | null;       // 裝飾節點
    markers: IMarker[];              // 特殊符號列表
    isSpecial: boolean;              // 是否為特殊格子
    
    // === 占據者信息 ===
    pawnsOnGrid: any[];              // 格子上的棋子列表（之後要定義棋子的資料型別）
    occupant: any | null;            // 主要占據者
}

/**
 * 地圖配置介面
 */
export interface IGameMapConfig {
    gridSize: number;                // 格子數量
    enableMarkers: boolean;          // 是否啟用標記系統
    enableStateTracking: boolean;    // 是否啟用狀態追蹤
}
