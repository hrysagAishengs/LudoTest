# GameMap 模組說明

## 概述

`gameMap` 負責管理 Ludo 棋盤上的格子資料、特殊標記與裝飾資料。
目前版本的核心原則是：

- **基本盤資料不旋轉**：`GameMapCenter` 永遠保存基本盤座標。
- **視覺節點延後建立**：裝飾資料先寫進 grid，等 `setupLocalPlayerView()` 決定玩家視角後再渲染。
- **資料與視覺分離**：`dataCoord` 表示資料所在格，`visualCoord` 表示目前畫面顯示格。

## 核心類別

### GameMapCenter

管理整張 `_gridData`，包含每格狀態、marker、棋子與容器節點。

主要責任：

- 初始化每格 `IGridData`
- 查詢格子資料、節點、座標
- 寫入或移除 marker
- 管理棋子占據狀態
- 保留基本盤資料與目前視覺座標

### GameMapDecorator

負責地圖裝飾資料與視覺節點。

目前新流程：

1. `applyDecorationData(config)`
   只把基本盤裝飾資料寫入 `GameMapCenter`，不建立任何 icon node。

2. `renderDecorationView(viewTransformer, realPlayerIndex, localViewIndex, config)`
   在 `setupLocalPlayerView()` 後，依目前玩家視角 mapping 出視覺位置，並建立 icon node。

3. `clearDecorationViewNodes()`
   清除目前渲染出的裝飾視覺節點，但保留基本盤 marker 資料。

## 資料結構

### IGridData

```ts
interface IGridData {
    containerNode: Node;
    position: Vec3;
    gridCoord: [number, number];
    state: GridState;
    decorateNode: Node | null;
    markers: IMarker[];
    isSpecial: boolean;
    pawnsOnGrid: any[];
    occupant: any | null;
}
```

### IMarker

```ts
interface IMarker {
    type: MarkerType;
    icon: Node | null;
    data: any;
    playerIndex?: number;
    dataCoord?: [number, number];
    visualCoord?: [number, number];
}
```

`dataCoord` 是基本盤座標，不會因視角改變。
`visualCoord` 是目前畫面上的顯示座標，會在 render view 時更新。

### MarkerType

```ts
enum MarkerType {
    NONE = 0,
    START = 1,
    SAFE = 2,
    ARROW = 3,
    FORBIDDEN = 4,
    SPECIAL = 5
}
```

### DecorationType

```ts
enum DecorationType {
    ARROW = 100,
    SAFE = 101,
    FORBIDDEN = 102
}
```

## 新版初始化流程

```text
GameFactoryManager.initGameMode()
  -> initializeGameMapCenter()
  -> initializeMapDecorator()
      -> GameMapDecorator.applyDecorationData(config)
         只寫入基本盤 marker data

GameFactoryManager.setupLocalPlayerView(localPlayerSeatIndex)
  -> viewTransformer.setCurrentPlayerView(...)
  -> GameMapDecorator.renderDecorationView(...)
     依玩家視角建立裝飾 icon node
```

## addMarker

`GameMapCenter.addMarker()` 支援同時記錄基本盤座標與視覺座標。

```ts
mapCenter.addMarker(baseR, baseC, marker, visualR, visualC);
```

參數：

- `baseR`, `baseC`：資料所在的基本盤座標
- `marker`：要加入的 marker
- `visualR`, `visualC`：目前畫面顯示座標，可省略，預設等於基本盤座標

範例：

```ts
mapCenter.addMarker(0, 7, {
    type: MarkerType.ARROW,
    icon: null,
    data: {
        decorationType: DecorationType.ARROW,
        direction: MarkerDirection.UP
    },
    playerIndex: 0
});
```

寫入後：

```ts
marker.dataCoord   // [0, 7]
marker.visualCoord // [0, 7]，或傳入的 visual 座標
```

## 常用查詢

```ts
const grid = mapCenter.getGridAt(row, col);
const node = mapCenter.getNodeAt(row, col);
const position = mapCenter.getPositionAt(row, col);
const markers = mapCenter.getMarkers(row, col);
const specialGrids = mapCenter.getAllSpecialGrids();
const allGrids = mapCenter.getAllGrids();
```

## 棋子占據

```ts
mapCenter.addPawn(row, col, pawn);
mapCenter.removePawn(row, col, pawn);
mapCenter.clearPawns(row, col);

mapCenter.setOccupant(row, col, pawn);
mapCenter.clearOccupant(row, col);
```

棋子移動時，呼叫端需要依遊戲規則同步更新格子狀態。

## 裝飾資料檢查

`GameMapCenter.logSpecialGridData()` 可用來檢查目前 `_gridData` 裡是否已寫入特殊 marker。

```ts
mapCenter.logSpecialGridData();
```

它會列出：

- grid 座標
- `GridState`
- marker type
- `dataCoord`
- `visualCoord`
- `playerIndex`
- 是否已有 icon node

## Deprecated

以下屬於舊視覺旋轉流程，已標記為 `@deprecated`，後續會移除：

- `GameMapCenter.rotateMarkersView(...)`
- `GameMapDecorator.applyDecoration(...)`
- `GameMapDecorator.updateArrowRotations()`
- `GameMapDecorator` 內部舊 helper：
  - `markStartPoints`
  - `placeDecorations`
  - `placeDecorationAt`
  - `createDecorationNode`
  - `applyDirectionRotation`

新版請改用：

- `applyDecorationData(...)`
- `renderDecorationView(...)`
- `clearDecorationViewNodes()`

## 注意事項

- `GameMapCenter` 儲存的是基本盤資料，不要把視覺旋轉後的位置直接覆蓋掉原始資料。
- 裝飾 icon node 應由 `renderDecorationView()` 建立。
- 切換玩家視角時，先清除舊 icon node，再依新視角重新 render。
- 箭頭方向目前依 `localViewIndex` 從 config 取出，而不是再靠舊的旋轉修正流程。
