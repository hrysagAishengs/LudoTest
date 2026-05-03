# 格子查詢 API 使用指南

## 概述

本指南介紹如何使用新增的便捷 API 來查詢格子數據。這些 API 自動處理玩家視角到基本盤的座標轉換，讓格子查詢變得更簡單。

---

## 🎯 核心概念

### 座標系統

項目使用**兩套座標系統**：

1. **基本盤座標系**（Data Coordinates）
   - 數據存儲的座標系統
   - 永不改變
   - GameMapCenter 內部使用

2. **玩家視角座標系**（Player View Coordinates）
   - 玩家看到的座標系統
   - 隨視角旋轉改變
   - 遊戲邏輯使用

### 自動轉換

新增的 API 會自動：
- 將玩家視角座標轉換為基本盤座標
- 查詢數據
- 返回結果

---

## 📚 API 列表

### GameMapCenter（需要傳入 viewTransformer）

適用於已經持有 `viewTransformer` 的場景：

```typescript
// 基本查詢
getGridAtPlayerView(r, c, playerType, viewTransformer): IGridData | null
getGridStateInPlayerView(r, c, playerType, viewTransformer): GridState | null
getPositionAtPlayerView(r, c, playerType, viewTransformer): Vec3 | null
getNodeAtPlayerView(r, c, playerType, viewTransformer): Node | null

// 狀態檢查
isGridEmptyInPlayerView(r, c, playerType, viewTransformer): boolean
isGridOccupiedInPlayerView(r, c, playerType, viewTransformer): boolean

// 棋子查詢
getPawnsAtPlayerView(r, c, playerType, viewTransformer): any[]

// 標記查詢
getMarkersInPlayerView(r, c, playerType, viewTransformer): IMarker[]
hasMarkerInPlayerView(r, c, markerType, playerType, viewTransformer): boolean
addMarkerInPlayerView(r, c, marker, playerType, viewTransformer): void
```

### GameFactoryManager（最便捷）

自動獲取 `viewTransformer`，無需手動傳入：

```typescript
// 基本查詢
queryGridInPlayerView(r, c, playerType): IGridData | null
getGridStateInPlayerView(r, c, playerType): GridState | null
getPositionInPlayerView(r, c, playerType): Vec3 | null
getNodeInPlayerView(r, c, playerType): Node | null

// 狀態檢查
isGridEmptyInPlayerView(r, c, playerType): boolean
isGridOccupiedInPlayerView(r, c, playerType): boolean

// 棋子查詢
getPawnsInPlayerView(r, c, playerType): any[]

// 標記查詢
getMarkersInPlayerView(r, c, playerType): IMarker[]
hasMarkerInPlayerView(r, c, markerType, playerType): boolean
```

---

## 💡 使用範例

### 範例 1：查詢格子基本信息

```typescript
// 在 LudoGameManager 中
public checkGridInfo(r: number, c: number, playerType: number): void {
    // 使用最便捷的 API
    const grid = this._factoryManager.queryGridInPlayerView(r, c, playerType);
    
    if (grid) {
        console.log('格子狀態:', GridState[grid.state]);
        console.log('是否特殊格子:', grid.isSpecial);
        console.log('棋子數量:', grid.pawnsOnGrid.length);
        console.log('標記數量:', grid.markers.length);
    } else {
        console.log('格子不存在（越界）');
    }
}
```

### 範例 2：檢查格子狀態

```typescript
// 檢查玩家點擊的格子是否可移動
public canMoveToGrid(r: number, c: number, playerType: number): boolean {
    // 檢查格子是否為空
    const isEmpty = this._factoryManager.isGridEmptyInPlayerView(r, c, playerType);
    
    // 檢查格子狀態
    const state = this._factoryManager.getGridStateInPlayerView(r, c, playerType);
    
    // 不是禁止區且為空或是安全區
    return isEmpty || state === GridState.SAFE_ZONE;
}
```

### 範例 3：查詢格子上的棋子

```typescript
// 查詢某個格子上有哪些棋子
public getPawnsOnGrid(r: number, c: number, playerType: number): void {
    const pawns = this._factoryManager.getPawnsInPlayerView(r, c, playerType);
    
    if (pawns.length > 0) {
        console.log(`格子 [${r}, ${c}] 上有 ${pawns.length} 個棋子:`);
        pawns.forEach((pawn, index) => {
            console.log(`  棋子 ${index + 1}:`, pawn);
        });
    } else {
        console.log(`格子 [${r}, ${c}] 上沒有棋子`);
    }
}
```

### 範例 4：檢查標記

```typescript
// 檢查格子是否有特定標記
public checkGridMarkers(r: number, c: number, playerType: number): void {
    // 檢查是否有箭頭標記
    const hasArrow = this._factoryManager.hasMarkerInPlayerView(
        r, c, MarkerType.ARROW, playerType
    );
    
    // 檢查是否有安全區標記
    const hasSafe = this._factoryManager.hasMarkerInPlayerView(
        r, c, MarkerType.SAFE, playerType
    );
    
    console.log(`格子 [${r}, ${c}]:`);
    console.log(`  有箭頭: ${hasArrow}`);
    console.log(`  是安全區: ${hasSafe}`);
    
    // 獲取所有標記
    const markers = this._factoryManager.getMarkersInPlayerView(r, c, playerType);
    console.log(`  標記總數: ${markers.length}`);
}
```

### 範例 5：獲取格子世界座標

```typescript
// 將棋子移動到玩家視角下的某個格子
public movePawnToGrid(pawn: Node, r: number, c: number, playerType: number): void {
    const worldPos = this._factoryManager.getPositionInPlayerView(r, c, playerType);
    
    if (worldPos) {
        pawn.setWorldPosition(worldPos);
        console.log(`棋子已移動到 [${r}, ${c}]，世界座標: (${worldPos.x}, ${worldPos.y})`);
    }
}
```

### 範例 6：使用 GameMapCenter API（進階）

```typescript
// 如果你已經有 viewTransformer 和 mapCenter
public advancedQuery(r: number, c: number, playerType: number): void {
    const viewTransformer = this._factoryManager.getViewTransformer();
    const mapCenter = this._factoryManager.getGameMapCenter();
    
    if (viewTransformer && mapCenter) {
        // 使用 GameMapCenter 的 API
        const grid = mapCenter.getGridAtPlayerView(r, c, playerType, viewTransformer);
        
        if (grid) {
            console.log('格子數據:', grid);
            
            // 獲取更多詳細信息
            const pawns = mapCenter.getPawnsAtPlayerView(r, c, playerType, viewTransformer);
            const markers = mapCenter.getMarkersInPlayerView(r, c, playerType, viewTransformer);
            
            console.log(`棋子: ${pawns.length} 個`);
            console.log(`標記: ${markers.length} 個`);
        }
    }
}
```

---

## ⚠️ 注意事項

### 1. 座標範圍

確保座標在有效範圍內（0-14）：

```typescript
if (r < 0 || r >= 15 || c < 0 || c >= 15) {
    console.warn('座標越界');
    return;
}
```

### 2. playerType 參數

playerType 對應玩家位置：
- `0` = Blue（下方）
- `1` = Red（左方）
- `2` = Green（上方）
- `3` = Yellow（右方）

```typescript
// 錯誤：使用玩家顏色索引
const grid = factoryManager.queryGridInPlayerView(r, c, colorIndex); // ❌

// 正確：使用當前視角的 playerType
const grid = factoryManager.queryGridInPlayerView(r, c, currentPlayerType); // ✅
```

### 3. 返回 null 的情況

以下情況會返回 `null` 或空陣列：
- 座標越界
- ViewTransformer 未初始化
- MapCenter 未初始化

```typescript
const grid = factoryManager.queryGridInPlayerView(r, c, playerType);

if (!grid) {
    console.warn('無法查詢格子（未初始化或越界）');
    return;
}

// 安全使用 grid
console.log('格子狀態:', grid.state);
```

### 4. 性能考慮

如果需要大量查詢，考慮緩存 `viewTransformer`：

```typescript
// 不推薦：每次都獲取 viewTransformer
for (let i = 0; i < 100; i++) {
    factoryManager.queryGridInPlayerView(r, c, playerType); // 內部重複獲取 viewTransformer
}

// 推薦：緩存 viewTransformer
const viewTransformer = factoryManager.getViewTransformer();
const mapCenter = factoryManager.getGameMapCenter();

if (viewTransformer && mapCenter) {
    for (let i = 0; i < 100; i++) {
        mapCenter.getGridAtPlayerView(r, c, playerType, viewTransformer);
    }
}
```

---

## 🔍 與舊 API 的對比

### 舊方式（手動轉換）

```typescript
// ❌ 需要手動處理座標轉換
const viewTransformer = this._factoryManager.getViewTransformer();
const mapCenter = this._factoryManager.getGameMapCenter();

if (!viewTransformer || !mapCenter) {
    console.error('未初始化');
    return;
}

const [dataR, dataC] = viewTransformer.playerViewToBase(r, c, playerType);
const grid = mapCenter.getGridAt(dataR, dataC);
```

### 新方式（自動轉換）

```typescript
// ✅ 自動處理座標轉換
const grid = this._factoryManager.queryGridInPlayerView(r, c, playerType);
```

---

## 📊 完整使用示例

```typescript
export class LudoGameManager extends Component {
    
    @property(GameFactoryManager)
    private _factoryManager: GameFactoryManager = null!;
    
    /**
     * 處理玩家點擊格子
     */
    private onGridClicked(r: number, c: number): void {
        const currentPlayerType = this.getCurrentPlayerType();
        
        // 查詢格子基本信息
        const grid = this._factoryManager.queryGridInPlayerView(r, c, currentPlayerType);
        if (!grid) {
            console.log('格子不存在');
            return;
        }
        
        console.log('\n========== 格子資訊 ==========');
        console.log(`座標: [${r}, ${c}]（玩家視角）`);
        console.log(`座標: [${grid.gridCoord[0]}, ${grid.gridCoord[1]}]（基本盤）`);
        console.log(`狀態: ${GridState[grid.state]}`);
        console.log(`特殊格子: ${grid.isSpecial ? '是' : '否'}`);
        
        // 檢查狀態
        if (this._factoryManager.isGridEmptyInPlayerView(r, c, currentPlayerType)) {
            console.log('格子為空');
        } else if (this._factoryManager.isGridOccupiedInPlayerView(r, c, currentPlayerType)) {
            console.log('格子被占據');
        }
        
        // 查詢棋子
        const pawns = this._factoryManager.getPawnsInPlayerView(r, c, currentPlayerType);
        console.log(`棋子數量: ${pawns.length}`);
        
        // 查詢標記
        const markers = this._factoryManager.getMarkersInPlayerView(r, c, currentPlayerType);
        console.log(`標記數量: ${markers.length}`);
        
        markers.forEach((marker, index) => {
            console.log(`  標記 ${index + 1}: ${MarkerType[marker.type]}`);
        });
        
        console.log('================================\n');
    }
    
    /**
     * 獲取當前玩家類型
     */
    private getCurrentPlayerType(): number {
        // 根據實際邏輯返回當前玩家類型
        return 0; // 示例：返回 Blue 玩家
    }
}
```

---

## 🎓 總結

### 推薦使用順序

1. **優先使用 GameFactoryManager API**（最簡單）
   ```typescript
   factoryManager.queryGridInPlayerView(r, c, playerType)
   ```

2. **性能敏感場景使用 GameMapCenter API**（需緩存 viewTransformer）
   ```typescript
   mapCenter.getGridAtPlayerView(r, c, playerType, viewTransformer)
   ```

3. **避免直接使用基本盤座標**（除非你明確知道在做什麼）
   ```typescript
   mapCenter.getGridAt(dataR, dataC) // 僅在特殊情況使用
   ```

### 關鍵要點

✅ 使用玩家視角座標查詢  
✅ 讓 API 自動處理轉換  
✅ 檢查返回值是否為 null  
✅ 使用正確的 playerType  
✅ 性能敏感場景緩存 viewTransformer  

❌ 不要手動轉換座標  
❌ 不要混淆 playerType 和 colorIndex  
❌ 不要忘記檢查 null  
❌ 不要在大量查詢時重複獲取 viewTransformer  
