# 地圖裝飾系統使用說明

## 概述

`GameMapDecorator` 負責 Ludo 棋盤上的裝飾資料與裝飾顯示，例如：

- 起點標記
- 箭頭
- 安全區
- 禁止符號

目前版本已改成 **資料寫入** 與 **視覺渲染** 分開處理。
裝飾資料會先寫入基本盤 `_gridData`，等玩家視角確定後，再把 icon node 掛到畫面上的正確格子。

## 新版流程

```text
initializeMapDecorator()
  -> applyDecorationData(config)
     只寫入基本盤資料，不建立 node

setupLocalPlayerView(localPlayerSeatIndex)
  -> viewTransformer.setCurrentPlayerView(...)
  -> renderDecorationView(viewTransformer, realPlayerIndex, localViewIndex, config)
     依目前玩家視角建立 node
```

## 核心 API

### applyDecorationData

```ts
decorator.applyDecorationData(config);
```

作用：

- 保存裝飾資源，例如 arrow icon、safe icon、forbidden icon
- 將裝飾資料寫入 `GameMapCenter`
- 寫入 marker 的 `dataCoord`
- 不建立任何視覺節點

這一步應該在 `initializeMapDecorator()` 階段呼叫。

### renderDecorationView

```ts
decorator.renderDecorationView(
    viewTransformer,
    realPlayerIndex,
    localViewIndex,
    decorationConfig
);
```

作用：

- 清除上一輪裝飾視覺節點
- 讀取基本盤 marker data
- 使用 `viewTransformer.baseToPlayerView(...)` 取得畫面座標
- 將 icon node 掛到 visual grid
- 更新 marker 的 `visualCoord`
- 箭頭方向依 `localViewIndex` 從 config 取得

這一步應該在 `setupLocalPlayerView()` 裡，玩家視角設定完成後呼叫。

### clearDecorationViewNodes

```ts
decorator.clearDecorationViewNodes();
```

作用：

- 移除目前 render 出來的 icon node
- 保留 `_gridData` 中的 marker 資料
- 將 `visualCoord` 還原為 `dataCoord`

## 裝飾資料寫入

`applyDecorationData()` 會依 `config.mapMarkerMode` 分流：

```ts
switch (config.mapMarkerMode) {
    case MarkerType.START:
        // 寫入起點資料
        break;
    case MarkerType.ARROW:
        // 寫入箭頭資料
        break;
    case MarkerType.SAFE:
        // 寫入安全區資料
        break;
    case MarkerType.FORBIDDEN:
        // 寫入禁止符號資料
        break;
}
```

寫入 marker 時，icon 會先保持 `null`：

```ts
{
    type: MarkerType.ARROW,
    icon: null,
    data: {
        decorationType: DecorationType.ARROW,
        direction: MarkerDirection.UP
    },
    playerIndex: 0
}
```

`GameMapCenter.addMarker()` 會補上：

```ts
marker.dataCoord = [baseR, baseC];
marker.visualCoord = [visualR, visualC];
```

## 視覺渲染

`renderDecorationView()` 會從基本盤 marker 取出：

```ts
const baseCoord = marker.dataCoord;
const markerRealIndex = marker.playerIndex;
```

接著透過 view transformer 換算畫面座標：

```ts
const [visualR, visualC] = viewTransformer.baseToPlayerView(
    baseR,
    baseC,
    realPlayerIndex
);
```

最後建立 node 並掛到 visual grid：

```ts
marker.icon = node;
marker.visualCoord = [visualR, visualC];
node.parent = visualGrid.containerNode;
```

## 箭頭方向

目前箭頭方向不走舊的旋轉修正流程。
方向來源是 marker 所屬玩家在目前畫面上的 `localViewIndex`：

```ts
const markerLocalViewIndex = viewTransformer.getLocalViewIndex(marker.playerIndex);
const direction = config.arrowPositions[markerLocalViewIndex].direction;
```

也就是：

- `localViewIndex = 0` 取 `arrowPositions[0]`
- `localViewIndex = 1` 取 `arrowPositions[1]`
- `localViewIndex = 2` 取 `arrowPositions[2]`
- `localViewIndex = 3` 取 `arrowPositions[3]`

這樣可以讓箭頭方向跟目前玩家視角一致。

## GameFactoryManager 整合

### initializeMapDecorator

初始化地圖裝飾時，只寫入資料：

```ts
this._mapDecorator.applyDecorationData(filteredConfig);
```

不要在這裡建立 icon node。

### setupLocalPlayerView

玩家視角確定後，再 render 裝飾：

```ts
const localViewIndex = viewTransformer.getLocalViewIndex(localPlayerSeatIndex);

this._mapDecorator.renderDecorationView(
    viewTransformer,
    localPlayerSeatIndex,
    localViewIndex,
    decorationConfig
);
```

## Debug

檢查基本盤資料是否寫入成功：

```ts
this._mapCenter.logSpecialGridData();
```

常見檢查點：

- marker 是否有寫進 `_gridData`
- `dataCoord` 是否是基本盤座標
- `visualCoord` 是否在 render 後改成畫面座標
- `playerIndex` 是否對應真實座位
- icon 是否只在 render 後才存在

## Deprecated 舊流程

以下方法是舊流程，已標記 `@deprecated`，後續會移除：

- `applyDecoration(...)`
- `setArrowIcon(...)`
- `setSafeIcon(...)`
- `setForbiddenIcon(...)`
- `updateArrowRotations()`

內部舊 helper：

- `markStartPoints(...)`
- `placeDecorations(...)`
- `placeDecorationAt(...)`
- `createDecorationNode(...)`
- `decorationToMarkerType(...)`
- `applyDirectionRotation(...)`

舊流程特色是「寫資料時直接建立 node」，目前不再建議使用。

## 注意事項

- `applyDecorationData()` 不應呼叫舊的 `applyDecoration()`。
- 基本盤 `_gridData` 只記錄原始資料，不要因視角切換覆蓋掉資料座標。
- icon node 是視覺層，應該由 `renderDecorationView()` 統一建立。
- 切換視角時，應清除舊 icon node 後重新 render。
- 舊的 `rotateMarkersView()` / `updateArrowRotations()` 會逐步淘汰。
