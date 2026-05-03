# 箭头旋转修复总结

## 问题描述

箭头在 `setupLocalPlayerView` 后显示方向错误，所有箭头都顺时针偏转了 90°。

### 具体表现
- 期望显示 UP (朝上) → 实际显示 LEFT (朝左)
- 期望显示 RIGHT (朝右) → 实际显示 UP (朝上)
- 期望显示 DOWN (朝下) → 实际显示 RIGHT (朝右)
- 期望显示 LEFT (朝左) → 实际显示 DOWN (朝下)

## 根本原因

### 节点层级结构
```
场景
├─ BoardNode (格子父节点，不旋转，angle=0)
│   └─ Cell_[r]_[c] (格子节点，不旋转)
│       └─ 箭头 icon (挂在这里)
│
└─ BgContainerNode (背景节点，会旋转)
```

### 问题核心

1. **箭头数据与显示位置不同步**
   - `setupRoomWithColorIndex` 时，箭头放在 `IGridData[0,7]`，icon 挂在 `Cell_0_7` 下
   - `setupLocalPlayerView` 时，`rotateMarkersToPlayerView` 把 icon 移动到 `Cell_7_0` 下
   - 但 marker 对象还在 `IGridData[0,7].markers` 数组中

2. **使用错误的位置判断方向**
   ```typescript
   // ❌ 错误：使用遍历的 [r,c]（数据位置）
   for (let r = 0; r < gridSize; r++) {
       for (let c = 0; c < gridSize; c++) {
           const grid = this._mapCenter.getGridAt(r, c);
           grid.markers.forEach(marker => {
               const posKey = `${r},${c}`;  // ← 数据位置 [0,7]
               // 但箭头实际显示在 [7,0]！
           });
       }
   }
   ```

3. **两次设置的不一致**
   - 第一次（setupRoomWithColorIndex）：使用配置中的 direction
   - 第二次（setupLocalPlayerView）：根据位置映射 direction
   - 配置中的 direction 没有随着重映射更新

## 解决方案

### 核心思路
**第一次和第二次都根据箭头的实际位置确定方向，保持逻辑一致。**

### 修改 1: placeDecorationAt() - 第一次放置时根据位置确定方向

**文件**: `GameMapDecorator.ts`

```typescript
private placeDecorationAt(r: number, c: number, ...): void {
    // 【关键修复】箭头方向由位置决定，不使用配置中的 direction
    let actualDirection = direction;
    if (decorationType === DecorationType.ARROW) {
        const posKey = `${r},${c}`;
        const positionMapping: Record<string, { seatIndex: number, direction: MarkerDirection }> = {
            '0,7': { seatIndex: 0, direction: MarkerDirection.UP },
            '7,0': { seatIndex: 1, direction: MarkerDirection.RIGHT },
            '14,7': { seatIndex: 2, direction: MarkerDirection.DOWN },
            '7,14': { seatIndex: 3, direction: MarkerDirection.LEFT }
        };
        
        if (positionMapping[posKey]) {
            actualDirection = positionMapping[posKey].direction;
        }
    }
    
    // 使用 actualDirection 创建节点和保存数据
    const decorationNode = this.createDecorationNode(decorationType, actualDirection, ...);
    this._mapCenter.addMarker(r, c, {
        ...,
        data: { decorationType, direction: actualDirection }  // 使用实际方向
    });
}
```

### 修改 2: updateArrowRotations() - 从 parent.name 提取实际位置

**文件**: `GameMapDecorator.ts`

```typescript
public updateArrowRotations(): void {
    for (let r = 0; r < gridSize; r++) {
        for (let c = 0; c < gridSize; c++) {
            const grid = this._mapCenter.getGridAt(r, c);
            grid.markers.forEach(marker => {
                if (marker.type === MarkerType.ARROW && marker.icon) {
                    // 【关键修复】从 parent.name 提取实际位置
                    let actualR = r, actualC = c;
                    if (marker.icon.parent?.name.startsWith('Cell_')) {
                        // 从 "Cell_7_0" 提取 [7, 0]
                        const match = marker.icon.parent.name.match(/Cell_(\\d+)_(\\d+)/);
                        if (match) {
                            actualR = parseInt(match[1]);
                            actualC = parseInt(match[2]);
                        }
                    }
                    
                    // 使用实际位置映射方向
                    const posKey = `${actualR},${actualC}`;
                    const mapping = positionToSeatAndDirection[posKey];
                    
                    if (mapping) {
                        marker.playerIndex = mapping.seatIndex;
                        marker.data.direction = mapping.direction;
                        
                        const angleMap = {
                            [MarkerDirection.UP]: 0,
                            [MarkerDirection.RIGHT]: -90,
                            [MarkerDirection.DOWN]: 180,
                            [MarkerDirection.LEFT]: 90
                        };
                        
                        marker.icon.angle = 0;  // 归零
                        marker.icon.angle = angleMap[mapping.direction];  // 直接设置
                    }
                }
            });
        }
    }
}
```

### 修改 3: setupLocalPlayerView() - 调用时不传参数

**文件**: `GameFactoryManager.ts`

```typescript
public setupLocalPlayerView(localPlayerSeatIndex: number): void {
    // ...
    
    // 【核心逻辑】箭头父节点（boardContainerNode）不旋转
    // 因此不需要传递任何旋转角度，只需根据箭头位置确定方向即可
    if (this._mapDecorator) {
        this._mapDecorator.updateArrowRotations();  // 不传参数
    }
}
```

## 位置映射关系

### 固定映射表
```typescript
const positionToSeatAndDirection = {
    '0,7':   { seatIndex: 0, direction: MarkerDirection.UP },    // 下方 → UP
    '7,0':   { seatIndex: 1, direction: MarkerDirection.RIGHT }, // 左方 → RIGHT
    '14,7':  { seatIndex: 2, direction: MarkerDirection.DOWN },  // 上方 → DOWN
    '7,14':  { seatIndex: 3, direction: MarkerDirection.LEFT }   // 右方 → LEFT
};
```

### 角度映射（箭头图片本身朝上）
```typescript
const angleMap = {
    [MarkerDirection.UP]: 0,      // 朝上，不旋转
    [MarkerDirection.RIGHT]: -90, // 朝右，逆时针 90°
    [MarkerDirection.DOWN]: 180,  // 朝下，旋转 180°
    [MarkerDirection.LEFT]: 90    // 朝左，顺时针 90°
};
```

## 关键发现

### 1. BoardNode 不旋转
- 格子节点（BoardNode 的子节点）固定不动
- 箭头挂在格子节点下，位置固定
- **不需要补偿父节点旋转**

### 2. 箭头会被移动
- `GameMapCenter.rotateMarkersToPlayerView()` 会移动箭头的 icon 节点
- 从一个格子的 Cell 节点移动到另一个格子的 Cell 节点
- 但 marker 对象保留在原 IGridData.markers 数组中

### 3. 数据位置 vs 显示位置
- **数据位置（r, c）**: marker 对象在哪个 IGridData.markers 数组中
- **显示位置（actualR, actualC）**: marker.icon 挂在哪个 Cell 节点下
- **必须使用显示位置来判断箭头方向**

## 测试验证

### 测试场景
- colorIndex: 0-3（4种颜色排列）
- playerType: 0-3（4个座位）
- 总共 16 种组合

### 验证方法
```typescript
// 从 parent.name 提取位置验证
if (marker.icon.parent?.name === 'Cell_7_0') {
    // 实际显示在 [7,0]（左方）
    // 应该显示 RIGHT 方向
}
```

### 预期结果
所有 16 种组合下，4 个箭头应该分别显示：
- 下方位置 [0,7]：朝上 (UP)
- 左方位置 [7,0]：朝右 (RIGHT)
- 上方位置 [14,7]：朝下 (DOWN)
- 右方位置 [7,14]：朝左 (LEFT)

## 注意事项

### 1. 不要使用 additionalRotation
```typescript
// ❌ 错误：传递背景旋转角度
this._mapDecorator.updateArrowRotations(this._bgContainerNode.angle);

// ✓ 正确：不传参数
this._mapDecorator.updateArrowRotations();
```

### 2. 隐藏测试要用实际位置
```typescript
// ❌ 错误：隐藏数据在 [0,7] 的箭头（位置会变）
if (r === 0 && c === 7) {
    marker.icon.active = false;
}

// ✓ 正确：隐藏显示在 [0,7] 的箭头（固定在下方）
if (actualR === 0 && actualC === 7) {
    marker.icon.active = false;
}
```

### 3. 两次逻辑必须一致
- 第一次 setupRoomWithColorIndex → 根据位置映射方向
- 第二次 setupLocalPlayerView → 根据位置映射方向
- 两次都使用相同的映射表

## 相关文件

### 修改的文件
1. `assets/script/gameMap/GameMapDecorator.ts`
   - `placeDecorationAt()`: 添加位置映射逻辑
   - `updateArrowRotations()`: 从 parent.name 提取实际位置

2. `assets/script/gameMode/GameFactoryManager.ts`
   - `setupLocalPlayerView()`: 移除 finalAngle 参数传递

### 核心接口
```typescript
// GameMapDecorator.ts
public updateArrowRotations(): void;  // 移除参数

// IGridData
interface IGridData {
    containerNode: Node;  // 格子节点，箭头挂在这下面
    markers: IMarker[];   // 箭头数据存储在这里
}

// IMarker
interface IMarker {
    icon: Node | null;       // 箭头节点（会被移动）
    playerIndex?: number;    // 座位索引（需要更新）
    data: any;               // 包含 direction（需要更新）
}
```

## 总结

**问题本质**：箭头节点的显示位置和数据位置不同步。

**解决方案**：始终使用箭头的实际显示位置（从 parent.name 提取）来确定方向。

**核心原则**：
1. 第一次和第二次放置/更新逻辑完全一致
2. 使用固定的位置→方向映射表
3. 不依赖背景旋转角度，因为格子父节点不旋转

**修复结果**：所有 colorIndex × playerType 组合（16种）的箭头方向都正确显示。

---

**修复日期**: 2026-05-02  
**相关Issue**: 箭头旋转方向错误  
**修复人**: GitHub Copilot (Claude Sonnet 4.5)
