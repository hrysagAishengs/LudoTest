import { Node, Sprite, SpriteFrame, instantiate, Prefab, UITransform, Color, Vec2, Layers } from 'cc';
import { GameMapCenter } from './GameMapCenter';
import { MarkerType, DecorationType, GridState } from './def/GameMapDef';
import { MapDecorationConfigGroup, MapDecorationItem, MarkerDirection } from '../factorySys/component/ConfigProperty';

/**
 * 地圖裝飾器
 * 
 * 職責：
 * 1. 讀取地圖裝飾配置
 * 2. 在指定格子上放置裝飾圖示（箭頭、星號、禁止符號）
 * 3. 標記起點位置
 * 
 * 使用範例：
 * ```typescript
 * const decorator = new GameMapDecorator(mapCenter);
 * await decorator.applyDecoration(config);
 * ```
 */
const DEFAULT_ICON_SIZE = 48; // 預設圖示大小
export class GameMapDecorator {
    
    private _mapCenter: GameMapCenter;
    
    // 裝飾圖示資源（可選，如果有 Prefab 或 SpriteFrame）
    private _arrowIcon: Prefab | SpriteFrame | null = null;
    private _starIcon: Prefab | SpriteFrame | null = null;
    private _forbiddenIcon: Prefab | SpriteFrame | null = null;
    
    // 保存當前配置用於獲取尺寸等信息
    private _currentConfig: any = null;
    
    // 調試信息（用於日志輸出）
    private _baseColorRotation: number = 0;
    private _bgContainerAngle: number = 0;
    
    /**
     * 構造函數
     * @param mapCenter 地圖管理中心
     */
    constructor(mapCenter: GameMapCenter) {
        this._mapCenter = mapCenter;
    }
    
    // ========== 資源設置 ==========
    
    /**
     * 設置箭頭圖示資源
     * @param icon Prefab 或 SpriteFrame
     */
    public setArrowIcon(icon: Prefab | SpriteFrame): void {
        this._arrowIcon = icon;
    }
    
    /**
     * 設置安全區圖示資源
     * @param icon Prefab 或 SpriteFrame
     */
    public setSafeIcon(icon: Prefab | SpriteFrame): void {
        this._starIcon = icon;
    }
    
    /**
     * 設置禁止符號圖示資源
     * @param icon Prefab 或 SpriteFrame
     */
    public setForbiddenIcon(icon: Prefab | SpriteFrame): void {
        this._forbiddenIcon = icon;
    }
    
    // ========== 主要功能 ==========
    
    /**
     * 應用裝飾配置到地圖
     * @param config 地圖裝飾配置
     * @param baseColorRotation 基本盤顏色旋轉（用於調試）
     * @param bgContainerAngle 背景容器旋轉角度（用於調試）
     */
    public applyDecoration(config: any, baseColorRotation: number = 0, bgContainerAngle: number = 0): void {
        
        console.log('[GameMapDecorator] 開始應用地圖裝飾...', config);
        
        // 保存配置引用
        this._currentConfig = config;
        this._baseColorRotation = baseColorRotation;
        this._bgContainerAngle = bgContainerAngle;

        switch (config.mapMarkerMode) {
            case MarkerType.START:
                console.log('[GameMapDecorator] 裝飾模式: 起點');
                this.markStartPoints(config.startPoints);
                break;
            case MarkerType.ARROW:
                console.log('[GameMapDecorator] 裝飾模式: 箭頭');
                if(config.arrowIcon){
                    this.setArrowIcon(config.arrowIcon);
                }
                this.placeDecorations(config.arrowPositions, DecorationType.ARROW);
                break;
            case MarkerType.SAFE:
                console.log('[GameMapDecorator] 裝飾模式: 安全區');
                if(config.safeIcon){
                    this.setSafeIcon(config.safeIcon);
                }
                this.placeDecorations(config.safePositions, DecorationType.SAFE);
                break;
            case MarkerType.FORBIDDEN:
                console.log('[GameMapDecorator] 裝飾模式: 禁止符號');
                if(config.forbiddenIcon){
                    this.setForbiddenIcon(config.forbiddenIcon);
                }
                this.placeDecorations(config.forbiddenPositions, DecorationType.FORBIDDEN);
                break;
            default:
                console.warn('[GameMapDecorator] 未知的裝飾模式:', config.mapMarkerMode);
        }
       
        
        console.log('[GameMapDecorator] 地圖裝飾完成');
    }
    
    
    /**
     * 標記起點格子
     * @param startPoints 起點坐標列表 (Vec2[] 或 number[][])
     *                    陣列 index 對應玩家索引 (0:Blue, 1:Red, 2:Green, 3:Yellow)
     */
    private markStartPoints(startPoints: Vec2[] | number[][]): void {
        
        if (!startPoints || startPoints.length === 0) {
            console.warn('[GameMapDecorator] 未配置起點坐標');
            return;
        }
        
        // 遍歷每個玩家的起點（index 即為 playerIndex）
        startPoints.forEach((pos, playerIndex) => {
            let r: number, c: number;
            
            if (pos instanceof Vec2) {
                r = pos.x;
                c = pos.y;
            } else {
                if (pos.length < 2) {
                    console.warn(`[GameMapDecorator] 無效的起點坐標:`, pos);
                    return;
                }
                r = pos[0];
                c = pos[1];
            }
            
            // 設置格子狀態
            this._mapCenter.setGridState(r, c, GridState.START_POINT);
            
            // 添加起點標記
            this._mapCenter.addMarker(r, c, {
                type: MarkerType.START,
                icon: null,
                data: { isStartPoint: true },
                playerIndex: playerIndex
            });
        });
        
        console.log(`[GameMapDecorator] 已標記 ${startPoints.length} 個起點`);
    }
    
    /**
     * 放置裝飾圖示
     * @param positions 位置列表 (Vec2[] 或 number[][])
     *                  陣列 index 對應玩家索引 (0:Blue, 1:Red, 2:Green, 3:Yellow)
     * @param decorationType 裝飾類型
     */
    /**
     * 放置裝飾
     * @param positions 位置列表 (Vec2[] | number[][] | MapDecorationItem[])
     *                  陣列 index 對應玩家索引 (0:Blue, 1:Red, 2:Green, 3:Yellow)
     * @param decorationType 裝飾類型
     */
    private placeDecorations(positions: Vec2[] | number[][] | MapDecorationItem[], decorationType: DecorationType): void {
        if (!positions || positions.length === 0) {
            return;
        }
        
        const decorationName = this.getDecorationName(decorationType);
        console.log(`[GameMapDecorator] 開始放置 ${decorationName}，數量: ${positions.length}`);
        
        // 遍歷每個玩家的裝飾位置（index 即為 playerIndex）
        positions.forEach((pos, playerIndex) => {
            let r: number, c: number;
            let direction: MarkerDirection = MarkerDirection.NONE;
            
            // 判斷數據類型並提取信息
            if (pos instanceof MapDecorationItem || (pos && typeof pos === 'object' && 'position' in pos && 'direction' in pos)) {
                // MapDecorationItem 類型（新結構）
                const item = pos as MapDecorationItem;
                r = item.position.x;
                c = item.position.y;
                direction = item.direction;
            } else if (pos instanceof Vec2) {
                // Vec2 類型（向後兼容）
                r = pos.x;
                c = pos.y;
            } else if (Array.isArray(pos)) {
                // number[] 類型（向後兼容）
                if (pos.length < 2) {
                    console.warn(`[GameMapDecorator] 無效的坐標:`, pos);
                    return;
                }
                r = pos[0];
                c = pos[1];
            } else {
                console.warn(`[GameMapDecorator] 未知的坐標格式:`, pos);
                return;
            }
            
            this.placeDecorationAt(r, c, decorationType, playerIndex, direction);
        });
        
        console.log(`[GameMapDecorator] ${decorationName} 放置完成`);
    }
    
    /**
     * 在指定格子放置裝飾
     * @param r 行索引
     * @param c 列索引
     * @param decorationType 裝飾類型
     * @param playerIndex 玩家索引 (0:Blue, 1:Red, 2:Green, 3:Yellow)
     * @param direction 方向（忽略，由位置决定）
     */
    private placeDecorationAt(r: number, c: number, decorationType: DecorationType, playerIndex: number, direction: MarkerDirection = MarkerDirection.NONE): void {
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
                console.log(`🎯 [placeDecorationAt] 箭头位置[${r},${c}] → 根据位置确定方向: ${MarkerDirection[actualDirection]}`);
            }
        }
        
        // 創建裝飾節點
        const decorationNode = this.createDecorationNode(decorationType, actualDirection, r, c, playerIndex);
        if (!decorationNode) {
            console.warn(`[GameMapDecorator] 無法創建裝飾節點，類型: ${decorationType}`);
            return;
        }
        
        // 獲取對應的 MarkerType
        const markerType = this.decorationToMarkerType(decorationType);
        
        // 添加到地圖
        this._mapCenter.addMarker(r, c, {
            type: markerType,
            icon: decorationNode,
            data: { decorationType: decorationType, direction: actualDirection },  // 使用实际方向
            playerIndex: playerIndex
        });
        
        // 設置為特殊格子
        const grid = this._mapCenter.getGridAt(r, c);
        if (grid) {
            grid.isSpecial = true;
        }
    }
    
    /**
     * 創建裝飾節點
     * @param decorationType 裝飾類型
     * @param direction 方向（用於箭頭旋轉）
     * @param r 行索引（用於日志）
     * @param c 列索引（用於日志）
     * @param playerIndex 玩家索引（用於日志）
     * @returns 裝飾節點，如果失敗返回 null
     */
    private createDecorationNode(decorationType: DecorationType, direction: MarkerDirection = MarkerDirection.NONE, r: number = -1, c: number = -1, playerIndex: number = -1): Node | null {
        let icon: Prefab | SpriteFrame | null = null;
        let size: number = 32;
        
        switch (decorationType) {
            case DecorationType.ARROW:
                icon = this._arrowIcon;
                size = this._currentConfig?.arrowSize || DEFAULT_ICON_SIZE;
                break;
            case DecorationType.SAFE:
                icon = this._starIcon;
                size = this._currentConfig?.safeSize || DEFAULT_ICON_SIZE;
                break;
            case DecorationType.FORBIDDEN:
                icon = this._forbiddenIcon;
                size = this._currentConfig?.forbiddenSize || DEFAULT_ICON_SIZE;
                break;
        }
        
        // 如果有圖示資源，使用圖示
        if (icon) {
            let node: Node | null = null;
            if (icon instanceof Prefab) {
                node = instantiate(icon);
            } else if (icon instanceof SpriteFrame) {
                node = this.createSpriteNode(icon, this.getDecorationName(decorationType), size);
            }
            
            // 應用方向旋轉（僅對箭頭生效）
            if (node && decorationType === DecorationType.ARROW && direction !== MarkerDirection.NONE) {
                this.applyDirectionRotation(node, direction, r, c, playerIndex);
            }
            
            return node;
        }
        
        // 如果沒有圖示資源，創建預設的佔位節點
        return this.createPlaceholderNode(decorationType);
    }
    
    /**
     * 從 SpriteFrame 創建節點
     * @param spriteFrame 精靈幀
     * @param name 節點名稱
     * @param size 圖示大小，預設 48
     * @returns 精靈節點
     */
    private createSpriteNode(spriteFrame: SpriteFrame, name: string, size: number = DEFAULT_ICON_SIZE): Node {
        
        const node = new Node(name);
        node.layer = Layers.Enum.UI_2D;
        const sprite = node.addComponent(Sprite);
        sprite.spriteFrame = spriteFrame;
        sprite.color = new Color(255, 255, 255, 200); // 可選：設置半透明效果
        
        // 防御性检查：避免重复添加 UITransform
        let transform = node.getComponent(UITransform);
        if (!transform) {
            transform = node.addComponent(UITransform);
        }
        
        const finalSize = size > 0 ? size : DEFAULT_ICON_SIZE; // 如果 size 為 0，使用預設值 DEFAULT_ICON_SIZE
        transform.setContentSize(finalSize, finalSize);
        
        return node;
    }
    
    /**
     * 創建預設佔位節點（用於調試）
     * @param decorationType 裝飾類型
     * @returns 佔位節點
     */
    private createPlaceholderNode(decorationType: DecorationType): Node {
        const node = new Node(`Placeholder_${this.getDecorationName(decorationType)}`);
        
        // 防御性检查：避免重复添加 UITransform
        let transform = node.getComponent(UITransform);
        if (!transform) {
            transform = node.addComponent(UITransform);
        }
        transform.setContentSize(24, 24);
        
        // 添加 Sprite 作為視覺佔位（可選）
        const sprite = node.addComponent(Sprite);
        
        // 根據類型設置不同顏色
        switch (decorationType) {
            case DecorationType.ARROW:
                sprite.color = new Color(255, 255, 0, 180); // 黃色
                break;
            case DecorationType.SAFE:
                sprite.color = new Color(255, 0, 255, 180); // 紫色
                break;
            case DecorationType.FORBIDDEN:
                sprite.color = new Color(255, 0, 0, 180); // 紅色
                break;
        }
        
        return node;
    }
    
    /**
     * 將裝飾類型轉換為標記類型
     * @param decorationType 裝飾類型
     * @returns 標記類型
     */
    private decorationToMarkerType(decorationType: DecorationType): MarkerType {
        switch (decorationType) {
            case DecorationType.ARROW:
                return MarkerType.ARROW;
            case DecorationType.SAFE:
                return MarkerType.SAFE;
            case DecorationType.FORBIDDEN:
                return MarkerType.FORBIDDEN;
            default:
                return MarkerType.NONE;
        }
    }
    
    /**
     * 獲取裝飾類型的名稱
     * @param decorationType 裝飾類型
     * @returns 名稱字串
     */
    private getDecorationName(decorationType: DecorationType): string {
        switch (decorationType) {
            case DecorationType.ARROW:
                return '箭頭';
            case DecorationType.SAFE:
                return '安全區';
            case DecorationType.FORBIDDEN:
                return '禁止符號';
            default:
                return '未知';
        }
    }
    
    /**
     * 應用方向旋轉到節點
     * @param node 要旋轉的節點
     * @param direction 方向枚舉
     * @param r 行索引
     * @param c 列索引
     * @param playerIndex 玩家索引
     */
    private applyDirectionRotation(node: Node, direction: MarkerDirection, r: number = -1, c: number = -1, playerIndex: number = -1): void {
        // 箭头图片本身朝上（0°）
        const angleMap = {
             [MarkerDirection.UP]: 0,
             [MarkerDirection.RIGHT]: -90,
             [MarkerDirection.DOWN]: 180,
             [MarkerDirection.LEFT]: 90
        };
        const baseAngle = angleMap[direction] || 0;
        
        console.log(`🎯 [applyDirectionRotation] 第一次放置箭头:`);
        console.log(`   位置: [${r}, ${c}]`);
        console.log(`   playerIndex: ${playerIndex}`);
        console.log(`   direction: ${MarkerDirection[direction]} (${direction})`);
        console.log(`   设置角度: ${baseAngle}°`);
        
        node.angle = baseAngle;
        
        console.log(`   实际角度: ${node.angle}°`);
    }
    
    // ========== 更新功能 ==========
    
    /**
     * 更新箭头旋转角度（用于视角切换时）
     * 
     * 核心逻辑：
     * 1. 箭头挂在 boardContainerNode 下的格子中，该父节点不旋转
     * 2. 因此箭头的 angle 属性直接等于屏幕显示角度
     * 3. 根据箭头当前位置确定座位索引和方向
     * 4. 归零后直接设置目标角度（UP=0°, RIGHT=-90°, DOWN=180°, LEFT=90°）
     */
    public updateArrowRotations(): void {
        const gridSize = this._mapCenter.getGridSize();
        let updateCount = 0;
        let totalArrowCount = 0;
        
        console.log('\n========================================')
        console.log('🔄 updateArrowRotations 调用');
        console.log('========================================')
        
        // 【调试】先遍历所有箭头，看看有多少个
        console.log('\n📊 扫描所有箭头位置:');
        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                const grid = this._mapCenter.getGridAt(r, c);
                if (grid?.markers) {
                    grid.markers.forEach(marker => {
                        if (marker.type === MarkerType.ARROW && marker.icon) {
                            totalArrowCount++;
                            const worldPos = marker.icon.parent?.getWorldPosition();
                            console.log(`  箭头#${totalArrowCount}: 数据位置[${r},${c}], playerIndex=${marker.playerIndex}, direction=${MarkerDirection[marker.data?.direction]}, angle=${marker.icon.angle}°`);
                            console.log(`      格子世界坐标: (${grid.position.x.toFixed(0)}, ${grid.position.y.toFixed(0)})`);
                            if (worldPos) {
                                console.log(`      箭头世界坐标: (${worldPos.x.toFixed(0)}, ${worldPos.y.toFixed(0)})`);
                            }
                        }
                    });
                }
            }
        }
        console.log(`\n总共找到 ${totalArrowCount} 个箭头\n`);
        
        // 核心逻辑：根据箭头当前位置确定座位索引和方向
        // setupLocalPlayerView 后，箭头的位置是固定的：
        // - [0, 7]（上方）→ 座位0 → UP
        // - [7, 0]（右方）→ 座位1 → RIGHT
        // - [14, 7]（下方）→ 座位2 → DOWN
        // - [7, 14]（左方）→ 座位3 → LEFT
        const positionToSeatAndDirection: Record<string, { seatIndex: number, direction: MarkerDirection }> = {
            '0,7': { seatIndex: 0, direction: MarkerDirection.UP },
            '7,0': { seatIndex: 1, direction: MarkerDirection.RIGHT },
            '14,7': { seatIndex: 2, direction: MarkerDirection.DOWN },
            '7,14': { seatIndex: 3, direction: MarkerDirection.LEFT }
        };
        
        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                const grid = this._mapCenter.getGridAt(r, c);
                if (grid?.markers) {
                    grid.markers.forEach(marker => {
                        if (marker.type === MarkerType.ARROW && marker.icon) {
                            // 【关键修复】箭头的 icon 可能已经被移动到其他格子，不能用遍历的 [r,c]
                            // 应该从 marker.icon.parent.name 提取实际位置
                            let actualR = r, actualC = c;
                            if (marker.icon.parent && marker.icon.parent.name.startsWith('Cell_')) {
                                // 从 "Cell_7_0" 提取 [7, 0]
                                const match = marker.icon.parent.name.match(/Cell_(\d+)_(\d+)/);
                                if (match) {
                                    actualR = parseInt(match[1]);
                                    actualC = parseInt(match[2]);
                                }
                            }
                            
                            const posKey = `${actualR},${actualC}`;
                            const mapping = positionToSeatAndDirection[posKey];
                            
                            if (mapping) {
                                // 更新 playerIndex（修正旋转后的错误）
                                const oldPlayerIndex = marker.playerIndex;
                                marker.playerIndex = mapping.seatIndex;
                                
                                // 更新方向枚举值
                                if (marker.data) {
                                    const oldDirection = marker.data.direction;
                                    marker.data.direction = mapping.direction;
                                    
                                    console.log(`\n📍 箭头更新:`);
                                    console.log(`  遍历位置 [r,c]: [${r}, ${c}]`);
                                    console.log(`  🔑 实际位置 (从parent): [${actualR}, ${actualC}]`);
                                    console.log(`  格子坐标 gridCoord: [${grid.gridCoord[0]}, ${grid.gridCoord[1]}]`);
                                    console.log(`  格子世界坐标 position: (${grid.position.x.toFixed(1)}, ${grid.position.y.toFixed(1)})`);
                                    console.log(`  posKey: "${posKey}"`);
                                    console.log(`  旧座位索引: ${oldPlayerIndex} → 新座位索引: ${mapping.seatIndex}`);
                                    console.log(`  旧方向: ${MarkerDirection[oldDirection]} (${oldDirection})`);
                                    console.log(`  新方向: ${MarkerDirection[mapping.direction]} (${mapping.direction})`);
                                }
                                
                                // 根据新的方向计算角度
                                // 箭头图片本身朝上（0°）
                                const angleMap = {
                                    [MarkerDirection.UP]: 0,
                                    [MarkerDirection.RIGHT]: -90,
                                    [MarkerDirection.DOWN]: 180,
                                    [MarkerDirection.LEFT]: 90
                                };
                                
                                const baseAngle = angleMap[mapping.direction] || 0;
                                
                                // 【关键】归零后直接设置目标角度
                                // 因为父节点（boardContainerNode）不旋转，angle 属性直接等于屏幕显示角度
                                const oldAngle = marker.icon.angle;
                                marker.icon.angle = 0;  // 先归零
                                marker.icon.angle = baseAngle;  // 直接设置目标角度
                                
                                console.log(`  设置前角度: ${oldAngle}°`);
                                console.log(`  目标角度: ${baseAngle}°`);
                                console.log(`  设置后角度: ${marker.icon.angle}°`);
                                console.log(`  节点名称: ${marker.icon.name}`);
                                console.log(`  节点UUID: ${marker.icon.uuid}`);
                                console.log(`  节点active: ${marker.icon.active}`);
                                console.log(`  节点parent: ${marker.icon.parent?.name || 'null'}`);
                                console.log(`  父节点angle: ${marker.icon.parent?.angle || 0}°`);
                                console.log(`  父父节点: ${marker.icon.parent?.parent?.name || 'null'}`);
                                console.log(`  父父节点angle: ${marker.icon.parent?.parent?.angle || 0}°`);
                                
                                // 【测试】如果是 [0,7]，隐藏箭头验证是否同一个节点(數據)
                                /*
                                if (r === 0 && c === 7) {
                                    console.log(`  🔴 [测试] 隐藏 [0,7] 箭头`);
                                    marker.icon.active = false;
                                }*/

                                if (actualR === 0 && actualC === 7) {  // 实际位置 [0,7]
                                    console.log(`  🔴 [测试] 隐藏显示在下方的箭头`);
                                    marker.icon.active = false;
                                }
                                                                
                                // 【强制刷新】标记节点为脏
                                if (marker.icon._uiProps && marker.icon._uiProps.uiTransformComp) {
                                    marker.icon._uiProps.uiTransformComp.setContentSize(
                                        marker.icon._uiProps.uiTransformComp.contentSize
                                    );
                                }
                                
                                updateCount++;
                            } else {
                                console.warn(`⚠️ 箭头位置 [${r},${c}] 不在预期的4个位置中，跳过`);
                            }
                        }
                    });
                }
            }
        }
        
        console.log(`\n✅ 共更新 ${updateCount} 个箭头`);
        console.log('========================================\n');
    }
    
    // ========== 清理功能 ==========
    
    /**
     * 移除所有裝飾
     */
    public clearAllDecorations(): void {
        const gridSize = this._mapCenter.getGridSize();
        
        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                this._mapCenter.clearMarkers(r, c);
            }
        }
        
        console.log('[GameMapDecorator] 已清除所有裝飾');
    }
    
    /**
     * 移除特定類型的裝飾
     * @param decorationType 裝飾類型
     */
    public clearDecorationsByType(decorationType: DecorationType): void {
        const gridSize = this._mapCenter.getGridSize();
        const markerType = this.decorationToMarkerType(decorationType);
        const decorationName = this.getDecorationName(decorationType);
        
        let count = 0;
        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                if (this._mapCenter.removeMarker(r, c, markerType)) {
                    count++;
                }
            }
        }
        
        console.log(`[GameMapDecorator] 已移除 ${count} 個${decorationName}`);
    }
}
