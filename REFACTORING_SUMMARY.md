# Grid Management Refactoring Summary

## 重構目標

將格子管理邏輯從 `BasicBoardGenerator` 中分離出來，建立專門的地圖管理系統。

## 改動概覽

### 1. 新增檔案

#### `gameMap/def/GameMapDef.ts`
定義地圖數據結構和介面：

- **GridState** 枚舉：格子狀態（空白、占據、阻擋、安全區、起點、終點）
- **MarkerType** 枚舉：標記類型（起點、安全區、箭頭、增益、減益、特殊）
- **IGridData** 介面：格子數據結構
  - containerNode: 格子節點
  - position: 世界坐標
  - gridCoord: 格子坐標
  - state: 格子狀態
  - markers: 標記列表
  - isSpecial: 是否為特殊格子
  - pawnsOnGrid: 棋子列表
  - occupant: 主要占據者
- **IMarker** 介面：標記數據結構
- **IGameMapConfig** 介面：地圖配置

#### `gameMap/GameMapCenter.ts`
地圖管理中心，提供完整的格子管理 API：

**初始化**
- `initFromNodes()`: 從節點陣列初始化
- `setConfig()`: 設置地圖配置

**格子訪問**
- `getGridAt()`: 獲取指定格子
- `getAllGrids()`: 獲取所有格子
- `getNodeAt()`: 獲取格子節點
- `getPositionAt()`: 獲取格子位置

**狀態管理**
- `setGridState()`: 設置格子狀態
- `getGridState()`: 獲取格子狀態
- `isGridEmpty()`: 檢查是否為空
- `isGridOccupied()`: 檢查是否被占據

**占據者管理**
- `setOccupant()`: 設置占據者
- `clearOccupant()`: 移除占據者
- `getOccupant()`: 獲取占據者

**棋子管理**
- `addPawn()`: 添加棋子
- `removePawn()`: 移除棋子
- `getPawnsAt()`: 獲取棋子列表
- `clearPawns()`: 清空棋子

**標記管理**
- `addMarker()`: 添加標記
- `removeMarker()`: 移除標記
- `hasMarker()`: 檢查標記
- `getMarkers()`: 獲取標記列表
- `clearMarkers()`: 清空標記

**批量操作**
- `markStartPoints()`: 批量標記起點
- `markSafeZones()`: 批量標記安全區
- `markEndPoints()`: 批量標記終點
- `clearRegion()`: 清空區域

**查詢統計**
- `getGridsByState()`: 獲取特定狀態格子
- `getAllSpecialGrids()`: 獲取所有特殊格子
- `getGridSize()`: 獲取地圖大小
- `clear()`: 清空地圖

#### `gameMap/README.md`
完整的使用說明文檔

### 2. 修改檔案

#### `BasicBoardGenerator.ts`

**新增方法**
```typescript
public getAllCells(): Node[][] {
    return this._cells;
}
```
提供訪問內部節點陣列的公共方法。

**修改方法**
```typescript
private createDynamicGrid(): void {
    // ...
    this._cellPositions[r][c] = new Vec3(posX, posY, 0);  // 新增：同時存儲位置
}
```
在創建動態網格時同時填充 `_cellPositions` 陣列。

#### `GameFactoryManager.ts`

**新增屬性**
```typescript
private _gameMapCenter: GameMapCenter | null = null;
```

**修改方法**
```typescript
public async initGameMode(gameMode: LudoGameMode): Promise<void> {
    // ...
    this._currentComponents = await this._currentFactory.createGameComponents();
    
    // 新增：初始化地圖管理中心
    this.initializeGameMapCenter();
    
    console.log(`遊戲模式 ${LudoGameMode[gameMode]} 初始化完成`);
}
```

**新增方法**
```typescript
private initializeGameMapCenter(): void {
    // 從 BoardGenerator 獲取節點和位置
    // 創建並初始化 GameMapCenter
}

public getGameMapCenter(): GameMapCenter | null {
    return this._gameMapCenter;
}
```

**修改方法**
```typescript
public cleanup(): void {
    // ...
    
    // 新增：清理地圖管理中心
    if (this._gameMapCenter) {
        this._gameMapCenter.clear();
        this._gameMapCenter = null;
    }
    
    console.log('遊戲模式已清理');
}
```

#### `LudoGameManager.ts`

**新增方法**
```typescript
/**
 * 測試地圖管理中心功能
 */
public testMapCenterFeatures(): void {
    // 演示 GameMapCenter 的各種功能
}

/**
 * 初始化遊戲地圖標記
 */
public initializeGameMapMarkers(): void {
    // 批量標記起點、安全區、終點
}

/**
 * 獲取地圖管理中心
 */
public getMapCenter() {
    return this._factoryManager.getGameMapCenter();
}
```

## 架構改進

### Before (重構前)

```
BasicBoardGenerator
├── 生成格子節點 ✓
├── 計算格子位置 ✓
├── 管理格子數據 ✗ (職責過重)
└── 提供格子查詢 ✗ (職責過重)
```

### After (重構後)

```
BasicBoardGenerator
├── 生成格子節點 ✓
└── 計算格子位置 ✓

GameMapCenter
├── 管理格子數據 ✓
├── 追蹤格子狀態 ✓
├── 管理占據者和棋子 ✓
├── 管理特殊標記 ✓
└── 提供查詢和批量操作 ✓

GameFactoryManager
├── 協調兩者的生命週期 ✓
└── 提供統一訪問接口 ✓
```

## 設計原則

### 1. 單一職責原則 (SRP)
- `BasicBoardGenerator` 只負責格子的生成和位置計算
- `GameMapCenter` 只負責格子數據的管理和狀態追蹤

### 2. 開放封閉原則 (OCP)
- 通過介面定義數據結構，易於擴展新功能
- 新增格子狀態或標記類型不需要修改核心邏輯

### 3. 依賴反轉原則 (DIP)
- `GameFactoryManager` 協調組件間的依賴關係
- 各組件通過介面互動，降低耦合度

### 4. 介面隔離原則 (ISP)
- 提供豐富的 API，但每個 API 功能單一
- 使用者可以只使用需要的功能

## 使用流程

### 初始化
```typescript
// 1. 初始化遊戲模式（自動創建 GameMapCenter）
await ludoGameManager.initGame(LudoGameMode.CLASSIC);

// 2. 設置地圖標記
ludoGameManager.initializeGameMapMarkers();

// 3. 獲取地圖管理中心
const mapCenter = ludoGameManager.getMapCenter();
```

### 遊戲中使用
```typescript
// 查詢格子
const grid = mapCenter.getGridAt(5, 5);

// 設置狀態
mapCenter.setGridState(5, 5, GridState.OCCUPIED);

// 添加棋子
mapCenter.addPawn(5, 5, pawn);

// 添加標記
mapCenter.addMarker(1, 6, {
    type: MarkerType.START,
    icon: null,
    data: { playerType: 0 }
});
```

## 測試

### 測試方法

在 `LudoGameManager` 中調用：

```typescript
// 測試基本功能
ludoGameManager.testMapCenterFeatures();

// 查看控制台輸出驗證結果
```

### 預期輸出

```
=== 地圖管理中心功能測試 ===
格子 [5,5] 的數據: { position: Vec3, state: 0, isSpecial: false }
已將 [1,6] 設置為起點狀態
已為 [1,6] 添加起點標記
已批量標記藍色起點
[5,5] 是否為空: true
[1,6] 是否被占據: true
[1,6] 的世界坐標: Vec3(x, y, z)
=== 測試完成 ===
```

## 編譯檢查

✅ 無編譯錯誤
✅ 所有類型檢查通過
✅ 介面定義完整

## 優勢

### 1. 清晰的職責分離
- 格子生成與格子管理分離
- 代碼結構更清晰，易於理解

### 2. 易於擴展
- 新增格子屬性只需擴展 `IGridData`
- 新增功能只需在 `GameMapCenter` 中添加方法

### 3. 統一管理
- 所有格子數據集中在 `GameMapCenter`
- 避免數據散落在各處

### 4. 豐富的 API
- 提供 40+ 個方法
- 涵蓋查詢、修改、批量操作等各種場景

### 5. 類型安全
- 完整的 TypeScript 類型定義
- 編譯時捕獲錯誤

## 未來擴展建議

### 1. 事件系統
```typescript
// 當格子狀態改變時觸發事件
mapCenter.on('stateChanged', (row, col, oldState, newState) => {
    console.log(`格子 [${row},${col}] 狀態從 ${oldState} 變為 ${newState}`);
});
```

### 2. 持久化
```typescript
// 保存地圖狀態
const data = mapCenter.serialize();

// 載入地圖狀態
mapCenter.deserialize(data);
```

### 3. 尋路整合
```typescript
// 基於格子狀態的 A* 尋路
const path = mapCenter.findPath(start, end, {
    avoidOccupied: true,
    useSafeZones: true
});
```

### 4. 動畫系統
```typescript
// 格子狀態變化動畫
mapCenter.setGridStateWithAnimation(row, col, GridState.OCCUPIED, {
    duration: 0.3,
    easing: 'easeOut'
});
```

## 總結

本次重構成功地將格子管理邏輯從 `BasicBoardGenerator` 中分離出來，建立了專門的 `GameMapCenter` 來管理地圖數據。這樣的設計：

- ✅ 職責更加清晰
- ✅ 代碼更易維護
- ✅ 功能更易擴展
- ✅ 類型更加安全
- ✅ 架構更加合理

符合現代軟體工程的設計原則，為後續開發奠定了良好的基礎。
