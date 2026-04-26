import { Node, Sprite, SpriteFrame, instantiate, Prefab, UITransform, Color, Vec2, Layers } from 'cc';
import { GameMapCenter } from './GameMapCenter';
import { MarkerType, DecorationType, GridState } from './def/GameMapDef';
import { MapDecorationConfigGroup } from '../factorySys/component/ConfigProperty';

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
     */
    public applyDecoration(config: any): void {
        
        console.log('[GameMapDecorator] 開始應用地圖裝飾...', config);
        
        // 保存配置引用
        this._currentConfig = config;

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
    private placeDecorations(positions: Vec2[] | number[][], decorationType: DecorationType): void {
        if (!positions || positions.length === 0) {
            return;
        }
        
        const decorationName = this.getDecorationName(decorationType);
        console.log(`[GameMapDecorator] 開始放置 ${decorationName}，數量: ${positions.length}`);
        
        // 遍歷每個玩家的裝飾位置（index 即為 playerIndex）
        positions.forEach((pos, playerIndex) => {
            let r: number, c: number;
            
            if (pos instanceof Vec2) {
                r = pos.x;
                c = pos.y;
            } else {
                if (pos.length < 2) {
                    console.warn(`[GameMapDecorator] 無效的坐標:`, pos);
                    return;
                }
                r = pos[0];
                c = pos[1];
            }
            
            this.placeDecorationAt(r, c, decorationType, playerIndex);
        });
        
        console.log(`[GameMapDecorator] ${decorationName} 放置完成`);
    }
    
    /**
     * 在指定格子放置裝飾
     * @param r 行索引
     * @param c 列索引
     * @param decorationType 裝飾類型
     * @param playerIndex 玩家索引 (0:Blue, 1:Red, 2:Green, 3:Yellow)
     */
    private placeDecorationAt(r: number, c: number, decorationType: DecorationType, playerIndex: number): void {
        // 創建裝飾節點
        const decorationNode = this.createDecorationNode(decorationType);
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
            data: { decorationType: decorationType },
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
     * @returns 裝飾節點，如果失敗返回 null
     */
    private createDecorationNode(decorationType: DecorationType): Node | null {
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
            if (icon instanceof Prefab) {
                return instantiate(icon);
            } else if (icon instanceof SpriteFrame) {
                return this.createSpriteNode(icon, this.getDecorationName(decorationType), size);
            }
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
