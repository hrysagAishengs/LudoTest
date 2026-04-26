# 地圖裝飾系統使用說明

## 概述

地圖裝飾系統允許您在 Ludo 遊戲地圖上放置特殊圖示和標記，包括：
- **起點標記**：標示每個玩家的起始位置
- **箭頭裝飾**：指示方向或路徑
- **星號裝飾**：標示特殊位置或獎勵點
- **禁止符號**：標示禁止通行或特殊規則的格子

## 架構設計

### 核心組件

1. **MapDecorationConfigGroup** (`ConfigProperty.ts`)
   - 在編輯器中配置裝飾位置
   - 包含起點預設值

2. **GameMapDecorator** (`GameMapDecorator.ts`)
   - 讀取配置並應用到地圖
   - 創建裝飾節點
   - 管理裝飾生命週期

3. **DecorationType** (`GameMapDef.ts`)
   - 定義裝飾類型枚舉
   - ARROW = 箭頭
   - STAR = 星號
   - FORBIDDEN = 禁止符號

## 使用方法

### 1. 在編輯器中配置

在 Cocos Creator 編輯器的 Inspector 面板中：

1. 找到 `GameFactoryManager` 組件
2. 展開 `遊戲模式配置` 陣列
3. 選擇對應的遊戲模式配置
4. 展開 `地圖裝飾配置` (Map Decoration Config)

#### 配置選項

```typescript
// 起點坐標（預設值）
startPoints: [
    [1, 6],   // Blue 起點
    [6, 13],  // Red 起點
    [13, 8],  // Green 起點
    [8, 1]    // Yellow 起點
]

// 箭頭裝飾位置
arrowPositions: [
    [2, 7],
    [7, 12],
    // ... 更多坐標
]

// 星號裝飾位置
starPositions: [
    [3, 8],
    [8, 11],
    // ... 更多坐標
]

// 禁止符號位置
forbiddenPositions: [
    [5, 5],
    [10, 10],
    // ... 更多坐標
]
```

### 2. 自動應用裝飾

裝飾會在遊戲模式初始化時自動應用：

```typescript
// 在 LudoGameManager 中
await this.initGame(LudoGameMode.CLASSIC);

// 裝飾已自動應用
// 可以通過測試方法查看結果
this.testMapDecorator();
```

### 3. 程式碼中動態使用

#### 獲取裝飾器

```typescript
const decorator = ludoGameManager.getMapDecorator();
```

#### 設置圖示資源（可選）

```typescript
// 如果有自定義的圖示資源
decorator.setArrowIcon(arrowPrefab);
decorator.setStarIcon(starSpriteFrame);
decorator.setForbiddenIcon(forbiddenPrefab);
```

#### 手動應用配置

```typescript
const config = new MapDecorationConfigGroup();
config.arrowPositions = [[3, 7], [7, 11]];
config.starPositions = [[5, 5]];

decorator.applyDecoration(config);
```

#### 清除裝飾

```typescript
// 清除所有裝飾
decorator.clearAllDecorations();

// 清除特定類型的裝飾
decorator.clearDecorationsByType(DecorationType.ARROW);
decorator.clearDecorationsByType(DecorationType.STAR);
decorator.clearDecorationsByType(DecorationType.FORBIDDEN);
```

## 進階使用

### 動態添加裝飾

```typescript
// 在遊戲過程中動態添加裝飾
const mapCenter = ludoGameManager.getMapCenter();
const decorator = ludoGameManager.getMapDecorator();

// 方式 1：使用裝飾器的批量方法
decorator.applyDecoration({
    arrowPositions: [[5, 5], [6, 6]],
    starPositions: [[7, 7]],
    forbiddenPositions: []
});

// 方式 2：直接使用 GameMapCenter 添加標記
mapCenter.addMarker(8, 8, {
    type: MarkerType.ARROW,
    icon: customIconNode,
    data: { customData: 'value' }
});
```

### 查詢裝飾狀態

```typescript
const mapCenter = ludoGameManager.getMapCenter();

// 檢查格子是否有特定標記
const hasArrow = mapCenter.hasMarker(5, 5, MarkerType.ARROW);

// 獲取格子的所有標記
const markers = mapCenter.getMarkers(5, 5);

// 獲取所有特殊格子
const specialGrids = mapCenter.getAllSpecialGrids();
```

## 配置範例

### 標準 Ludo 配置

```typescript
// 標準 15x15 Ludo 遊戲的起點配置
startPoints: [
    [1, 6],   // Blue 起點（左下）
    [6, 13],  // Red 起點（左上）
    [13, 8],  // Green 起點（右上）
    [8, 1]    // Yellow 起點（右下）
]

// 箭頭標示外圈路徑方向
arrowPositions: [
    [0, 6],   // Blue 出發點上方
    [6, 14],  // Red 出發點右方
    [14, 8],  // Green 出發點下方
    [8, 0]    // Yellow 出發點左方
]

// 星號標示安全區
starPositions: [
    [2, 6],   // Blue 路徑上的安全區
    [6, 12],  // Red 路徑上的安全區
    [12, 8],  // Green 路徑上的安全區
    [8, 2]    // Yellow 路徑上的安全區
]
```

### 自定義遊戲模式配置

```typescript
// 範例：帶有障礙的遊戲模式
forbiddenPositions: [
    [7, 7],   // 中心障礙
    [3, 3],   // 左下障礙
    [3, 11],  // 左上障礙
    [11, 11], // 右上障礙
    [11, 3]   // 右下障礙
]

// 範例：帶有加速點的遊戲模式
starPositions: [
    [1, 8],   // 外圈加速點
    [4, 14],
    [8, 13],
    [14, 10],
    [13, 6],
    [10, 0]
]
```

## 工作流程

### 初始化流程

```
1. initGameMode()
   ↓
2. initializeGameMapCenter()
   ↓
3. initializeMapDecorator()
   ↓
4. applyDecoration(config)
   ↓
5. 裝飾應用完成
```

### 裝飾應用流程

```
applyDecoration()
├── markStartPoints() → 標記起點
├── placeDecorations(arrows) → 放置箭頭
├── placeDecorations(stars) → 放置星號
└── placeDecorations(forbidden) → 放置禁止符號
```

## 調試技巧

### 1. 查看裝飾日誌

```typescript
// 初始化時會輸出：
[GameMapDecorator] 開始應用地圖裝飾...
[GameMapDecorator] 已標記 4 個起點
[GameMapDecorator] 開始放置 箭頭，數量: 8
[GameMapDecorator] 箭頭 放置完成
[GameMapDecorator] 地圖裝飾完成
```

### 2. 測試裝飾功能

```typescript
// 在 LudoGameManager 中
ludoGameManager.testMapDecorator();
```

輸出範例：
```
=== 地圖裝飾功能測試 ===
檢查起點格子 [1,6]:
  狀態: 4 (START_POINT)
  是否為特殊格子: true
  標記數量: 1
已標記的起點數量: 4
  起點坐標: [1, 6]
  起點坐標: [6, 13]
  起點坐標: [13, 8]
  起點坐標: [8, 1]
=== 測試完成 ===
```

### 3. 視覺化檢查

如果沒有圖示資源，裝飾器會創建預設的佔位節點：
- 箭頭：黃色方塊
- 星號：紫色方塊
- 禁止符號：紅色方塊

這些佔位節點方便在開發階段視覺化確認位置。

## 整合建議

### 與遊戲邏輯整合

```typescript
// 檢查格子是否為禁止通行
public canMoveToGrid(row: number, col: number): boolean {
    const mapCenter = this.getMapCenter();
    const hasBlocked = mapCenter.hasMarker(row, col, MarkerType.DEBUFF);
    
    if (hasBlocked) {
        console.log('此格子被禁止通行');
        return false;
    }
    
    return true;
}

// 星號格子獲得額外獎勵
public applyGridEffect(row: number, col: number): void {
    const mapCenter = this.getMapCenter();
    const hasBonus = mapCenter.hasMarker(row, col, MarkerType.SPECIAL);
    
    if (hasBonus) {
        console.log('獲得星號獎勵！');
        // 應用獎勵邏輯
    }
}
```

### 與視角旋轉整合

裝飾使用的是**基本盤坐標**（view 0），會隨著棋盤整體旋轉：

```typescript
// 旋轉視角時，裝飾會跟著旋轉
ludoGameManager.rotateBoardView(1); // 旋轉到 Red 視角

// 裝飾的位置自動適配新視角
```

## 常見問題

### Q: 為什麼看不到裝飾圖示？

**A:** 檢查以下幾點：
1. 確認配置中的坐標是否正確（0-14 範圍內）
2. 檢查是否調用了 `initGame()` 初始化
3. 使用 `testMapDecorator()` 查看日誌確認裝飾已應用
4. 如果沒有設置圖示資源，會顯示預設佔位方塊

### Q: 如何更新裝飾配置？

**A:** 有兩種方式：
1. **編輯器中**：修改 GameModeConfig 的 mapDecorationConfig
2. **程式碼中**：調用 `decorator.applyDecoration(newConfig)`

### Q: 裝飾會影響遊戲性能嗎？

**A:** 不會。裝飾節點很輕量，只在初始化時創建一次。如果使用 SpriteFrame 而非 Prefab，性能更佳。

### Q: 能否為不同玩家顯示不同的裝飾？

**A:** 可以。使用動態裝飾功能：

```typescript
// 根據當前玩家動態添加裝飾
const currentPlayer = getCurrentPlayerIndex();
decorator.clearAllDecorations();

// 應用當前玩家專屬的裝飾配置
const playerConfig = getPlayerDecorationConfig(currentPlayer);
decorator.applyDecoration(playerConfig);
```

## 總結

地圖裝飾系統提供了靈活的方式來美化和增強遊戲地圖：

✅ **編輯器配置**：在 Inspector 面板輕鬆設置  
✅ **自動應用**：初始化時自動載入配置  
✅ **動態調整**：遊戲中可動態添加/移除  
✅ **類型安全**：完整的 TypeScript 類型定義  
✅ **易於擴展**：可輕鬆添加新的裝飾類型  
✅ **性能優化**：輕量級節點，不影響性能  

通過配置和程式碼的結合使用，您可以創造豐富多彩的遊戲體驗！
