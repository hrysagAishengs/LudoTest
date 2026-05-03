# 修复说明：getOtherPlayerDestToGlobal 视觉一致性（最终版）

## 问题诊断

### 测试结果
- **colorIndex=0, playerView=0**: 全部正确 ✓
- **colorIndex=0, playerView=1,2,3**: 全部正确 ✓
- **colorIndex=3, playerView=0**: 全部正确 ✓
- **colorIndex=3, playerView=1,2,3**: 全部错误 ✗

### 错误规律
playerView=1 的结果是 playerView=0 结果旋转了1次：
- [8,2] → [12,8] (旋转1次)
- [12,8] → [6,12] (旋转1次)
- [6,12] → [2,6] (旋转1次)

**结论**：代码**多旋转了 playerView 次**！

### 根本原因
```typescript
// 错误逻辑
const relativeRotations = playerView;
for (let i = 0; i < relativeRotations; i++) {
    // 旋转坐标...
}
return [r, c];  // ❌ 返回旋转后的坐标
```

**问题本质**：
1. `setupLocalPlayerView(playerView)` **已经旋转了整个棋盘底图和UI**
2. 坐标系统（如 `getCellPosition`）会根据旋转后的棋盘自动返回正确的屏幕位置
3. 如果 `getOtherPlayerDestToGlobal` 再次旋转坐标 → **双重旋转错误**！

---

## 修复方案

### 核心理念
**返回基本盘坐标，让底层坐标系统自动处理到屏幕的映射**

### 正确逻辑
```typescript
// ✅ 正确：直接返回基本盘坐标
const VISUAL_TO_ORIGINAL_COLOR = [0, 3, 2, 1];
const originalColor = VISUAL_TO_ORIGINAL_COLOR[otherPlayer];
const originalPath = this._originalPathMap[originalColor];
const baseCoord = originalPath[startIndex + steps];

// 不旋转，直接返回基本盘坐标
return [baseCoord[0], baseCoord[1]];
```

### 工作流程
1. **otherPlayer** 映射到原始颜色（固定映射）
2. 查询 **原始标准路径**（`_originalPathMap`）
3. 返回 **基本盘坐标**（不旋转）
4. 底层系统自动处理坐标到屏幕的转换

---

## 修复验证

### 所有组合测试（期望）
无论 colorIndex 和 playerView 如何变化，结果应保持固定：

| colorIndex | playerView | otherPlayer=1 | otherPlayer=2 | otherPlayer=3 |
|-----------|-----------|--------------|--------------|--------------|
| **0** | 0 | [8,2] ✓ | [12,8] ✓ | [6,12] ✓ |
| **0** | 1 | [8,2] ✓ | [12,8] ✓ | [6,12] ✓ |
| **0** | 2 | [8,2] ✓ | [12,8] ✓ | [6,12] ✓ |
| **0** | 3 | [8,2] ✓ | [12,8] ✓ | [6,12] ✓ |
| **1** | 0~3 | [8,2] ✓ | [12,8] ✓ | [6,12] ✓ |
| **2** | 0~3 | [8,2] ✓ | [12,8] ✓ | [6,12] ✓ |
| **3** | 0~3 | [8,2] ✓ | [12,8] ✓ | [6,12] ✓ |

**原理**：
- otherPlayer=1 → 原始 Yellow(3) → 路径索引1 → 基本盘坐标 [8,2]
- otherPlayer=2 → 原始 Green(2) → 路径索引1 → 基本盘坐标 [12,8]
- otherPlayer=3 → 原始 Red(1) → 路径索引1 → 基本盘坐标 [6,12]

---

## 修改文件清单

### BasicViewTransformer.ts
**修改1**: `getOtherPlayerDestToGlobal` 方法
- 移除旋转循环
- 直接返回 `[baseCoord[0], baseCoord[1]]`

**修改2**: `getOtherPlayerDestToGlobalSegment` 方法
- 移除旋转循环
- 直接返回 `baseSegment.map(([r, c]) => [r, c])`

---

## 架构说明

### 坐标系统分层
```
层级3: 屏幕坐标（由 getCellPosition 返回）
         ↑
         | setupLocalPlayerView 旋转
         |
层级2: 基本盘坐标（getOtherPlayerDestToGlobal 返回）✓
         ↑
         | 查询原始路径
         |
层级1: 原始路径数据（_originalPathMap）
```

### 职责分离
- **BasicViewTransformer**: 返回基本盘坐标
- **BoardGenerator**: 将基本盘坐标转换为屏幕位置（考虑旋转）
- **setupLocalPlayerView**: 旋转整个棋盘UI

---

## 关键洞察

### 为什么 colorIndex=0 时所有 playerView 都正确？
因为 colorIndex=0 时座位分配是标准的：
- 座位0=Blue, 座位1=Red, 座位2=Green, 座位3=Yellow
- 原始路径和重映射路径相同
- 旋转逻辑的错误被"掩盖"了

### 为什么 colorIndex≠0 时 playerView=0 正确？
因为 playerView=0 时不旋转（`relativeRotations=0`）：
- 直接返回基本盘坐标
- 结果正确

### 为什么 colorIndex≠0 时 playerView≠0 错误？
因为多旋转了 playerView 次：
- playerView=1: 旋转1次 → 错误
- playerView=2: 旋转2次 → 错误
- playerView=3: 旋转3次 → 错误

---

## 测试建议
编译并运行完整测试，验证所有 colorIndex × playerView × otherPlayer 组合：
```typescript
for (let colorIndex = 0; colorIndex < 4; colorIndex++) {
    setupRoomWithColorIndex(4, colorIndex);
    for (let playerView = 0; playerView < 4; playerView++) {
        setupLocalPlayerView(playerView);
        for (let otherPlayer = 1; otherPlayer <= 3; otherPlayer++) {
            const result = getOtherPlayerDestToGlobal(playerView, otherPlayer, 0, 1);
            // 验证：result 应该固定为 [8,2], [12,8], [6,12]
        }
    }
}
```
