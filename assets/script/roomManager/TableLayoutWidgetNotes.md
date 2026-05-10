# TableLayout Widget Notes

## Widget 的基本理解
==========================================================
Widget 是用「父節點或指定 Target 的 UITransform 範圍」當基準，然後根據「掛 Widget 的那個節點自身 UITransform + AnchorPoint」去算它的 local position。

父節點 panelContainer
尺寸假設 720 x 1280
中心是 0,0
左下角就是 -360,-640
掛 Widget 的是：

PlayerPanelSlot_0
AnchorPoint = 0,0
Left = 50
Bottom = 50
意思就是：

把 PlayerPanelSlot_0 的 anchor 點，放到父節點左下角往內 50,50 的位置
所以算出來會類似：

slot.x = -360 + 50
slot.y = -640 + 50
也就是你前面看到的：

-310, -590
如果 anchor 是 0.5,0.5，那 Widget 對齊的就會是「節點中心點」。例如同樣 left/bottom 50，它會讓節點的左邊距/底邊距符合 50，因此 position 會自動加上半個寬高。

<<所以可以這樣記 >>

Widget 對齊的是「節點的邊界/中心線」，
但最後改的是「節點的位置」，
而 AnchorPoint 決定這個 position 代表節點身上的哪個點。

==========================================================

Widget 會用父節點，或指定的 Target 節點，作為對齊基準。
實際被移動的是「掛載 Widget 的節點」。

換句話說：

```text
Widget 對齊基準：父節點 / Target 的 UITransform 範圍
Widget 控制目標：掛載 Widget 的那個節點
Widget 最後結果：改變該節點的 local position
```

AnchorPoint 會影響 Widget 計算出來的位置代表節點身上的哪一個點。

例如左下角對齊：

```text
AnchorPoint = 0,0
Left = 50
Bottom = 50
```

意思是：

```text
把該節點的左下 anchor 點，放到父節點左下角往內 50,50 的位置。
```

如果父節點大小是 `720 x 1280`，而父節點中心是 `(0,0)`：

```text
父節點左下角 = -360,-640
節點位置 = -360 + 50, -640 + 50
節點位置 = -310,-590
```

所以看到節點 position 變成 `-310,-590` 是正常的。
那不是錯誤位置，而是 Widget 根據父節點尺寸和間距算出來的 local position。

## AnchorPoint 對 Widget 的影響

同樣是 `Left = 50`、`Bottom = 50`：

```text
AnchorPoint = 0,0
```

代表節點左下角被放在父節點左下角往內 `50,50`。

```text
AnchorPoint = 0.5,0.5
```

代表節點中心點會被用來表示 position。
Widget 為了讓節點邊界距離父節點左下角仍然是 `50,50`，會把 position 自動加上半個寬高。

因此可以這樣記：

```text
Widget 對齊的是節點的邊界或中心線。
但最後改的是節點的位置。
AnchorPoint 決定這個 position 代表節點身上的哪一個點。
```

## 為什麼 TableLayout 要多包一層 slot

PlayerPanel prefab 本身比較適合用中心座標編輯：

```text
PlayerPanel
AnchorPoint = 0.5,0.5
Position = 0,0

InfoTest4p
AnchorPoint = 0.5,0.5
Position = 0,0
```

這樣 prefab 內部的紅色底圖、頭像、骰子、文字等內容都可以用中心為基準排版。

但桌面座位排版時，四個角落會需要不同的 anchor：

```text
左下：AnchorPoint = 0,0
左上：AnchorPoint = 0,1
右上：AnchorPoint = 1,1
右下：AnchorPoint = 1,0
```

如果直接把 Widget 掛在 PlayerPanel prefab root 上，TableLayout 就必須改 PlayerPanel 的 anchor。
這會讓 prefab 自己的中心座標被破壞，造成內容位置看起來不直覺。

所以目前 WIDGET 模式改成：

```text
panelContainer
└─ PlayerPanelSlot_x
   └─ PlayerPanel_x
      └─ InfoTest4p
```

角色分工：

```text
PlayerPanelSlot_x
- Runtime 建立
- 掛 Widget
- 使用 WidgetInfo 的 anchorPoint / left / right / top / bottom / center
- 負責桌面座位定位

PlayerPanel_x
- instantiate(playerPanelPrefab) 產生
- 維持 AnchorPoint = 0.5,0.5
- 維持 prefab 自己的中心座標編輯方式
- 不負責桌面定位
```

## TableLayout 目前對 WIDGET 模式做的事情

在 `RoomAlignMode.WIDGET` 時，`TableLayout.applyWidgetLayout(...)` 會：

1. 取得 prefab root 的 `UITransform`。
2. 將 prefab root 的 anchor 設回 `0.5,0.5`。
3. 建立 runtime 節點 `PlayerPanelSlot_${layoutIndex}`。
4. 將 slot 掛到 `roomConfig.panelContainer`。
5. 將 slot 的 content size 設成 PlayerPanel prefab root 的 content size。
6. 將 slot 的 anchor 設成 `WidgetInfo.anchorPoint`。
7. 把 PlayerPanel prefab 改掛到 slot 底下。
8. 根據 slot anchor 計算 PlayerPanel 在 slot 內的中心偏移。
9. 將 Widget 掛到 slot 上。
10. 依照 `WidgetInfo` 套用上下左右或中心對齊。
11. 呼叫 `widget.updateAlignment()`。

中心偏移的公式是：

```ts
const panelOffsetX = (0.5 - widgetInfo.anchorPoint.x) * panelSize.width;
const panelOffsetY = (0.5 - widgetInfo.anchorPoint.y) * panelSize.height;
```

例如左下角 slot：

```text
slot anchor = 0,0
panel size = 240 x 250

panelOffsetX = (0.5 - 0) * 240 = 120
panelOffsetY = (0.5 - 0) * 250 = 125
```

所以 PlayerPanel 會被放在 slot 內的 `(120,125)`。
這代表 PlayerPanel 的中心點剛好落在 slot 的中心。

## POSITION 模式沒有改動

`RoomAlignMode.POSITION` 仍然維持原本流程：

```text
panelContainer
└─ PlayerPanel_x
```

也就是直接 instantiate prefab，掛到 `panelContainer`，再用 `roomConfig.chairs[layoutIndex]` 設定位置。

這次的 slot 包裝只影響 `RoomAlignMode.WIDGET`。

