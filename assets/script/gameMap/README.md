# GameMapCenter 使用說明

## 概述

`GameMapCenter` 是 Ludo 遊戲的地圖管理中心，負責管理所有格子的數據和狀態。它提供了豐富的 API 來操作格子狀態、標記、占據者等資訊。

## 架構設計

### 分離關注點

之前的 `BasicBoardGenerator` 同時負責格子生成和格子管理，職責過於繁重。重構後：

- **BasicBoardGenerator**：僅負責生成格子節點和計算位置
- **GameMapCenter**：專門負責格子數據的管理和狀態追蹤
- **GameFactoryManager**：統一管理兩者的生命週期

### 數據結構

```typescript
interface IGridData {
    containerNode: Node;           // 格子容器節點
    position: Vec3;                // 世界坐標位置
    gridCoord: [number, number];   // 格子坐標 [row, col]
    state: GridState;              // 格子狀態
    decorateNode: Node | null;     // 裝飾節點
    markers: IMarker[];            // 特殊標記列表
    isSpecial: boolean;            // 是否為特殊格子
    pawnsOnGrid: any[];            // 格子上的棋子列表
    occupant: any | null;          // 主要占據者
}
```

### 格子狀態（GridState）

```typescript
enum GridState {
    EMPTY = 0,        // 空白格子
    OCCUPIED = 1,     // 被占據
    BLOCKED = 2,      // 被阻擋
    SAFE_ZONE = 3,    // 安全區
    START_POINT = 4,  // 起點
    END_POINT = 5     // 終點
}
```

### 標記類型（MarkerType）

```typescript
enum MarkerType {
    NONE = 0,      // 無標記
    START = 1,     // 起點標記
    SAFE = 2,      // 安全區標記
    ARROW = 3,     // 方向箭頭
    BUFF = 4,      // 增益效果
    DEBUFF = 5,    // 減益效果
    SPECIAL = 6    // 特殊標記
}
```

## 使用範例

### 1. 初始化

GameMapCenter 會在 `GameFactoryManager.initGameMode()` 時自動初始化，您無需手動創建。

```typescript
// 在 LudoGameManager 中
await this.initGame(LudoGameMode.CLASSIC);

// 獲取地圖管理中心
const mapCenter = this.getMapCenter();
```

### 2. 查詢格子數據

```typescript
// 獲取指定坐標的格子數據
const grid = mapCenter.getGridAt(5, 5);
if (grid) {
    console.log('格子位置:', grid.position);
    console.log('格子狀態:', grid.state);
    console.log('是否為特殊格子:', grid.isSpecial);
}

// 獲取格子的節點
const node = mapCenter.getNodeAt(5, 5);

// 獲取格子的世界坐標
const position = mapCenter.getPositionAt(5, 5);
```

### 3. 設置格子狀態

```typescript
// 設置單個格子狀態
mapCenter.setGridState(1, 6, GridState.START_POINT);

// 獲取格子狀態
const state = mapCenter.getGridState(1, 6);

// 檢查格子是否為空
const isEmpty = mapCenter.isGridEmpty(5, 5);

// 檢查格子是否被占據
const isOccupied = mapCenter.isGridOccupied(1, 6);
```

### 4. 管理占據者

```typescript
// 設置格子占據者（主要占據者）
mapCenter.setOccupant(5, 5, playerPawn);

// 獲取格子占據者
const occupant = mapCenter.getOccupant(5, 5);

// 移除占據者
const removed = mapCenter.clearOccupant(5, 5);
```

### 5. 管理棋子

```typescript
// 添加棋子到格子（支持多個棋子）
mapCenter.addPawn(5, 5, pawn1);
mapCenter.addPawn(5, 5, pawn2);

// 獲取格子上的所有棋子
const pawns = mapCenter.getPawnsAt(5, 5);

// 移除特定棋子
const success = mapCenter.removePawn(5, 5, pawn1);

// 清空格子上的所有棋子
const removedPawns = mapCenter.clearPawns(5, 5);
```

### 6. 添加特殊標記

```typescript
// 添加起點標記
mapCenter.addMarker(1, 6, {
    type: MarkerType.START,
    icon: startIconNode,  // 可選：標記圖標節點
    data: { playerType: 0 }  // 可選：額外數據
});

// 檢查是否有特定標記
const hasStart = mapCenter.hasMarker(1, 6, MarkerType.START);

// 獲取格子的所有標記
const markers = mapCenter.getMarkers(1, 6);

// 移除特定標記
const removed = mapCenter.removeMarker(1, 6, MarkerType.START);

// 清空格子的所有標記
mapCenter.clearMarkers(1, 6);
```

### 7. 批量操作

```typescript
// 批量標記起點
const startPoints: [number, number][] = [
    [1, 6],   // Blue
    [6, 1],   // Red
    [13, 8],  // Green
    [8, 13]   // Yellow
];
mapCenter.markStartPoints(startPoints);

// 批量標記安全區
const safeZones: [number, number][] = [
    [2, 6], [6, 2], [12, 8], [8, 12]
];
mapCenter.markSafeZones(safeZones);

// 批量標記終點
const endPoints: [number, number][] = [
    [7, 7], [7, 8], [8, 7], [8, 8]
];
mapCenter.markEndPoints(endPoints);

// 清空指定區域
mapCenter.clearRegion([[5, 5], [5, 6], [6, 5]]);
```

### 8. 查詢與統計

```typescript
// 獲取所有特定狀態的格子
const startPoints = mapCenter.getGridsByState(GridState.START_POINT);
const safeZones = mapCenter.getGridsByState(GridState.SAFE_ZONE);

// 獲取所有特殊格子
const specialGrids = mapCenter.getAllSpecialGrids();

// 獲取地圖大小
const gridSize = mapCenter.getGridSize();

// 獲取所有格子數據（高級用法）
const allGrids = mapCenter.getAllGrids();
```

### 9. 在 LudoGameManager 中使用

```typescript
// 測試地圖管理中心功能
public testMapCenter(): void {
    this.testMapCenterFeatures();
}

// 初始化遊戲地圖標記
public setupGameBoard(): void {
    this.initializeGameMapMarkers();
}

// 在遊戲邏輯中使用
public placePawnOnGrid(pawn: any, row: number, col: number): void {
    const mapCenter = this.getMapCenter();
    if (mapCenter) {
        mapCenter.addPawn(row, col, pawn);
        mapCenter.setGridState(row, col, GridState.OCCUPIED);
    }
}

public movePawnFromGrid(pawn: any, row: number, col: number): void {
    const mapCenter = this.getMapCenter();
    if (mapCenter) {
        mapCenter.removePawn(row, col, pawn);
        
        // 如果格子上沒有其他棋子，設置為空白
        if (mapCenter.getPawnsAt(row, col).length === 0) {
            mapCenter.setGridState(row, col, GridState.EMPTY);
        }
    }
}
```

## 最佳實踐

### 1. 初始化順序

```typescript
// 正確的初始化順序
await ludoGameManager.initGame(LudoGameMode.CLASSIC);  // 1. 初始化遊戲模式
ludoGameManager.initializeGameMapMarkers();            // 2. 設置地圖標記
```

### 2. 狀態同步

當格子上的棋子變化時，記得同步更新格子狀態：

```typescript
// 添加棋子時
mapCenter.addPawn(row, col, pawn);
mapCenter.setGridState(row, col, GridState.OCCUPIED);

// 移除棋子時
mapCenter.removePawn(row, col, pawn);
if (mapCenter.getPawnsAt(row, col).length === 0) {
    mapCenter.setGridState(row, col, GridState.EMPTY);
}
```

### 3. 標記管理

使用標記系統來追蹤特殊格子：

```typescript
// 添加標記時設置 isSpecial
mapCenter.addMarker(row, col, {
    type: MarkerType.SPECIAL,
    icon: iconNode,
    data: { bonus: 2 }
});

// 查詢特殊格子
const specialGrids = mapCenter.getAllSpecialGrids();
```

### 4. 錯誤處理

始終檢查返回值是否為 null：

```typescript
const grid = mapCenter.getGridAt(row, col);
if (!grid) {
    console.warn(`格子 [${row}, ${col}] 不存在`);
    return;
}

// 安全地使用 grid
console.log('格子狀態:', grid.state);
```

## 配置選項

可以通過 `setConfig()` 方法自定義地圖配置：

```typescript
const mapCenter = this.getMapCenter();
if (mapCenter) {
    mapCenter.setConfig({
        gridSize: 15,
        enableMarkers: true,      // 啟用標記系統
        enableStateTracking: true // 啟用狀態追蹤
    });
}
```

## 調試技巧

### 1. 視覺化格子狀態

```typescript
// 使用 testDraw 方法在格子上繪製標記
const pos = mapCenter.getPositionAt(row, col);
if (pos) {
    this.testDraw(pos);
}
```

### 2. 日誌輸出

GameMapCenter 在關鍵操作時會輸出日誌：

```typescript
[GameMapCenter] 地圖初始化完成：15x15 = 225 個格子
[GameMapCenter] 已標記 4 個起點
[GameMapCenter] 已標記 4 個安全區
[GameMapCenter] 地圖已清空
```

### 3. 狀態檢查

```typescript
// 檢查地圖管理中心是否正確初始化
const mapCenter = this.getMapCenter();
if (!mapCenter) {
    console.error('地圖管理中心未初始化！');
}

// 檢查格子數量
const size = mapCenter.getGridSize();
console.log(`地圖大小: ${size}x${size}`);
```

## 常見問題

### Q: 為什麼獲取不到 GameMapCenter？

**A:** 確保已經調用 `initGame()` 並等待完成：

```typescript
await this.initGame(LudoGameMode.CLASSIC);
const mapCenter = this.getMapCenter();  // 現在可以獲取了
```

### Q: 如何處理多個棋子在同一格子的情況？

**A:** 使用 `pawnsOnGrid` 陣列來管理多個棋子：

```typescript
mapCenter.addPawn(row, col, pawn1);
mapCenter.addPawn(row, col, pawn2);

const allPawns = mapCenter.getPawnsAt(row, col);  // [pawn1, pawn2]
```

### Q: 標記的圖標如何管理？

**A:** 圖標節點會自動添加到格子的 containerNode 下：

```typescript
mapCenter.addMarker(row, col, {
    type: MarkerType.START,
    icon: iconNode,  // 會自動設置 parent 為格子節點
    data: null
});

// 移除標記時會自動清理圖標
mapCenter.removeMarker(row, col, MarkerType.START);
```

### Q: 如何重置整個地圖？

**A:** 使用 `clear()` 方法：

```typescript
const mapCenter = this.getMapCenter();
if (mapCenter) {
    mapCenter.clear();  // 清空所有狀態、標記、占據者
}
```

## 與其他系統的整合

### 與 BasicBoardGenerator 的關係

- `BasicBoardGenerator` 負責生成格子節點和計算位置
- `GameMapCenter` 使用這些節點和位置來初始化格子數據
- 兩者通過 `GameFactoryManager` 協調工作

### 與 LudoGameManager 的關係

- `LudoGameManager` 提供高層次的業務 API
- 通過 `getMapCenter()` 獲取 `GameMapCenter` 實例
- 在遊戲邏輯中使用 `GameMapCenter` 來管理格子狀態

### 與 ViewTransformer 的關係

- `ViewTransformer` 負責坐標轉換（不同玩家視角）
- `GameMapCenter` 使用**基本盤坐標**（view 0）存儲數據
- 在需要時通過 `ViewTransformer` 轉換到特定玩家視角

## 未來擴展

未來可以考慮添加以下功能：

1. **格子動畫系統**：為格子狀態變化添加動畫效果
2. **格子事件系統**：當格子被占據/釋放時觸發事件
3. **格子效果系統**：不同類型格子的特殊效果（加速、減速等）
4. **持久化支援**：保存/載入地圖狀態
5. **網格尋路整合**：結合 A* 等算法進行路徑規劃

## 總結

`GameMapCenter` 提供了完整的地圖管理解決方案，讓您可以：

- ✅ 輕鬆查詢和修改格子狀態
- ✅ 管理格子上的占據者和棋子
- ✅ 添加和管理特殊標記
- ✅ 批量操作多個格子
- ✅ 靈活擴展新功能

通過將格子管理與格子生成分離，代碼結構更加清晰，職責更加明確，便於後續維護和擴展。
