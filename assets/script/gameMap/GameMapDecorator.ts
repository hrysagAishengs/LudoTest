import { Node, Sprite, SpriteFrame, instantiate, Prefab, UITransform, Color, Vec2, Layers } from 'cc';
import { GameMapCenter } from './GameMapCenter';
import { MarkerType, DecorationType, GridState, IMarker } from './def/GameMapDef';
import { MapDecorationConfigGroup, MapDecorationItem, MarkerDirection } from '../factorySys/component/ConfigProperty';
import { IViewTransformer } from '../factorySys/defs/path/PathFactoryDef';

/**
 * 地圖裝飾器
 * 
 * 職責：
 * 1. 讀取地圖裝飾配置
 * 2. 在指定格子上放置裝飾圖示（箭頭、星號、禁止符號）
 * 3. 標記起點位置
 * 
 */
const DEFAULT_ICON_SIZE = 48; // 預設圖示大小

type DecorationResource = {
    icon: Prefab | SpriteFrame | null;
    size: number;
};

export class GameMapDecorator {
    
    private _mapCenter: GameMapCenter;
    
    // 裝飾圖示資源（可選，如果有 Prefab 或 SpriteFrame）
    private _arrowIcon: Prefab | SpriteFrame | null = null;
    private _starIcon: Prefab | SpriteFrame | null = null;
    private _forbiddenIcon: Prefab | SpriteFrame | null = null;
    
    // 保存當前配置用於獲取尺寸等信息
    private _currentConfig: any = null;

    // 新資料流程使用的裝飾資源表。applyDecorationData 只保存資源，renderDecorationView 才建立節點。
    private _decorationResourceMap: Map<DecorationType, DecorationResource> = new Map();

    // 新資料流程使用的裝飾座標表。陣列 index 對應真實座位 index。
    private _decorationCoordMap: Map<DecorationType, [number, number][]> = new Map();
    private _decorationViewNodeMap: Map<string, Node> = new Map();
    
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
    
  
    // ========== 主要功能 ==========
    

    /**
     * 只將基本盤裝飾資料寫入 GameMapCenter，不建立任何視覺節點。
     * 視覺節點會等 setupLocalPlayerView 完成後，再由獨立流程依視角 mapping 建立。
     * @param config 裝飾設定
     */
    public applyDecorationData(config: any): void {
        console.log('[GameMapDecorator] 寫入基本盤裝飾資料...', config);

        this._currentConfig = config;
        this.saveDecorationResource(config);

        switch (config.mapMarkerMode) {
            case MarkerType.START:
                this.markStartPointData(config.startPoints);
                break;
            case MarkerType.ARROW:
                this.placeDecorationData(config.arrowPositions, DecorationType.ARROW);
                break;
            case MarkerType.SAFE:
                this.placeDecorationData(config.safePositions, DecorationType.SAFE);
                break;
            case MarkerType.FORBIDDEN:
                this.placeDecorationData(config.forbiddenPositions, DecorationType.FORBIDDEN);
                break;
            default:
                console.warn('[GameMapDecorator] 不支援的裝飾資料類型', config.mapMarkerMode);
        }

        this._mapCenter.logSpecialGridData();
    }

    /**
     * 保存 applyDecorationData 收到的各類裝飾資源。
     * 這裡只記錄 icon/size，不建立任何節點，讓資料寫入與視覺渲染保持分離。
     */
    private saveDecorationResource(config: any): void {
        switch (config.mapMarkerMode) {
            case MarkerType.ARROW:
                this._decorationResourceMap.set(DecorationType.ARROW, {
                    icon: config.arrowIcon ?? null,
                    size: config.arrowSize || DEFAULT_ICON_SIZE
                });
                break;
            case MarkerType.SAFE:
                this._decorationResourceMap.set(DecorationType.SAFE, {
                    icon: config.safeIcon ?? null,
                    size: config.safeSize || DEFAULT_ICON_SIZE
                });
                break;
            case MarkerType.FORBIDDEN:
                this._decorationResourceMap.set(DecorationType.FORBIDDEN, {
                    icon: config.forbiddenIcon ?? null,
                    size: config.forbiddenSize || DEFAULT_ICON_SIZE
                });
                break;
        }
    }

    /**
     * 清除目前由 renderDecorationView 建立的視覺節點。
     * 只移除 marker.icon，不刪除基本盤 marker 資料與格子狀態。
     */
    public clearDecorationViewNodes(): void {
        this._decorationViewNodeMap.clear();
        const allGrids = this._mapCenter.getAllGrids();
        let clearCount = 0;

        for (let r = 0; r < allGrids.length; r++) {
            for (let c = 0; c < allGrids[r].length; c++) {
                const grid = allGrids[r][c];
                if (!grid || !grid.markers) {
                    continue;
                }

                for (let i = 0; i < grid.markers.length; i++) {
                    const marker = grid.markers[i];
                    if (!this.isDecorationViewMarker(marker)) {
                        continue;
                    }

                    if (marker.icon) {
                        marker.icon.removeFromParent();
                        marker.icon.destroy();
                        marker.icon = null;
                        clearCount++;
                    }

                    marker.visualCoord = marker.dataCoord;
                }
            }
        }

        console.log(`[GameMapDecorator] 已清除 ${clearCount} 個裝飾視覺節點`);
    }

    /**
     * 依目前玩家視角，把基本盤 marker 資料渲染到對應的 visual grid。
     * 目前只處理 icon 掛載位置，不做箭頭方向 mapping。
     * @param viewTransformer 視角轉換器
     * @param realPlayerIndex Server 給的本機玩家真實座位索引
     * @param localViewIndex 本機玩家在目前畫面中的視覺座位索引
     * @param config 裝飾設定資料，先保留給後續 mapping/方向處理使用
     */
    public renderDecorationView(viewTransformer: IViewTransformer, realPlayerIndex: number, localViewIndex: number, config: any = null): void {
        this.clearDecorationViewNodes();
        console.log('[GameMapDecorator] renderDecorationView config:', config);

        const allGrids = this._mapCenter.getAllGrids();
        let renderCount = 0;

        for (let r = 0; r < allGrids.length; r++) {
            for (let c = 0; c < allGrids[r].length; c++) {
                const grid = allGrids[r][c];
                if (!grid || !grid.markers) {
                    continue;
                }

                for (let i = 0; i < grid.markers.length; i++) {
                    const marker = grid.markers[i];
                    if (!this.isDecorationViewMarker(marker)) {
                        continue;
                    }

                    const baseCoord = marker.dataCoord ?? [r, c];
                    const [baseR, baseC] = baseCoord;
                    const markerRealIndex = marker.playerIndex;
                    if (markerRealIndex === undefined) {
                        console.warn(`[GameMapDecorator] marker 缺少 playerIndex，略過 base=[${baseR}, ${baseC}]`);
                        continue;
                    }

                    const markerLocalViewIndex = viewTransformer.getLocalViewIndex(markerRealIndex);
                    const decorationType = marker.data?.decorationType as DecorationType;

                    // NEW 2026-05-09
                    // 保存此裝飾 marker 在目前畫面中的座位位置，供後續依 localViewIndex + MarkerType 查找節點。
                    marker.data = marker.data ?? {};
                    marker.data.localViewIndex = markerLocalViewIndex;

                    const [visualR, visualC] = viewTransformer.baseToPlayerView(baseR, baseC, realPlayerIndex);
                    const visualGrid = this._mapCenter.getGridAt(visualR, visualC);
                    if (!visualGrid) {
                        console.warn(`[GameMapDecorator] 找不到 visual grid [${visualR}, ${visualC}]，base=[${baseR}, ${baseC}]`);
                        continue;
                    }

                    const direction = this.resolveDirectionInView(marker, markerLocalViewIndex, config);
                    const node = this.createDecorationViewNode(decorationType, direction);
                    if (!node) {
                        console.warn(`[GameMapDecorator] 無法建立裝飾視覺節點 type=${DecorationType[decorationType]}`);
                        continue;
                    }

                    marker.icon = node;
                    marker.visualCoord = [visualR, visualC];
                    node.parent = visualGrid.containerNode;
                    this.cacheDecorationViewNode(markerLocalViewIndex, marker.type, node);
                    renderCount++;

                    console.log(
                        `[GameMapDecorator] renderDecorationView type=${DecorationType[decorationType]} base=[${baseR},${baseC}] visual=[${visualR},${visualC}] markerReal=${markerRealIndex} markerLocal=${markerLocalViewIndex} currentReal=${realPlayerIndex} currentLocal=${localViewIndex}`
                    );
                }
            }
        }

        console.log(`[GameMapDecorator] 裝飾視覺渲染完成，共 ${renderCount} 個`);
    }

    /**
     * 2026-05-09
     * 依目前畫面座位位置與 MarkerType 取得指定裝飾 marker。
     * 需要先執行 renderDecorationView，讓 marker.data.localViewIndex 完成寫入。
     */
    public getDecorationMarkerByLocalViewIndex(localViewIndex: number, markerType: MarkerType): IMarker | null {
        const allGrids = this._mapCenter.getAllGrids();

        for (let r = 0; r < allGrids.length; r++) {
            for (let c = 0; c < allGrids[r].length; c++) {
                const grid = allGrids[r][c];
                if (!grid?.markers) {
                    continue;
                }

                for (let i = 0; i < grid.markers.length; i++) {
                    const marker = grid.markers[i];
                    if (marker.type !== markerType) {
                        continue;
                    }

                    if (marker.data?.localViewIndex !== localViewIndex) {
                        continue;
                    }

                    return marker;
                }
            }
        }

        return null;
    }

    /**
     * 2026-05-09
     * 依目前畫面座位位置與 MarkerType 取得指定裝飾節點。
     * 例如：localViewIndex=0 + MarkerType.ARROW 可取得左下視覺位置的箭頭節點。
     */
    public getDecorationViewNodeByLocalViewIndex(localViewIndex: number, markerType: MarkerType): Node | null {
        return this._decorationViewNodeMap.get(this.getDecorationViewNodeKey(localViewIndex, markerType)) ?? null;
    }

    private cacheDecorationViewNode(localViewIndex: number, markerType: MarkerType, node: Node): void {
        this._decorationViewNodeMap.set(this.getDecorationViewNodeKey(localViewIndex, markerType), node);
    }

    private getDecorationViewNodeKey(localViewIndex: number, markerType: MarkerType): string {
        return `${localViewIndex}:${markerType}`;
    }

    /**
     * 判斷 marker 是否屬於新裝飾視覺流程。
     */
    private isDecorationViewMarker(marker: IMarker): boolean {
        return marker.type === MarkerType.ARROW
            || marker.type === MarkerType.SAFE
            || marker.type === MarkerType.FORBIDDEN;
    }

    /**
     * 新視覺流程專用的節點建立方法。
     * 箭頭方向由 renderDecorationView 解析後傳入，這裡只負責轉成節點角度。
     */
    private createDecorationViewNode(decorationType: DecorationType, direction: MarkerDirection): Node | null {
        const resource = this._decorationResourceMap.get(decorationType);
        const icon = resource?.icon ?? null;
        const size = resource?.size ?? DEFAULT_ICON_SIZE;

        let node: Node | null = null;
        if (icon instanceof Prefab) {
            node = instantiate(icon);
        } else if (icon instanceof SpriteFrame) {
            node = this.createSpriteNode(icon, this.getDecorationName(decorationType), size);
        } else {
            node = this.createPlaceholderNode(decorationType);
        }

        if (node && decorationType === DecorationType.ARROW && direction !== MarkerDirection.NONE) {
            node.angle = this.getDirectionAngle(direction);
        }

        return node;
    }

    /**
     * 箭頭方向依照 marker 所屬玩家在目前畫面上的 localViewIndex，
     * 從 config.arrowPositions[localViewIndex] 取得。
     */
    private resolveDirectionInView(marker: IMarker, localViewIndex: number, config: any): MarkerDirection {
        if (marker.type !== MarkerType.ARROW) {
            return marker.data?.direction ?? MarkerDirection.NONE;
        }

        const configList = Array.isArray(config) ? config : [config];
        const arrowConfig = configList.find(configSetting => configSetting?.mapMarkerMode === MarkerType.ARROW);
        const arrowItem = arrowConfig?.arrowPositions?.[localViewIndex];
        if (!arrowItem) {
            console.warn(`[GameMapDecorator] 找不到 arrowPositions[${localViewIndex}]，改用 marker 原始方向`);
            return marker.data?.direction ?? MarkerDirection.NONE;
        }
        console.log('[resolveDirectionInView] localViewIndex=', localViewIndex, 'arrowItem=', arrowItem);
        return arrowItem.direction ?? MarkerDirection.NONE;
    }



    /**
     * 基本方向對應角度。
     */
    private getDirectionAngle(direction: MarkerDirection): number {
        switch (direction) {
            case MarkerDirection.UP:
                return 0;
            case MarkerDirection.RIGHT:
                return -90;
            case MarkerDirection.DOWN:
                return 180;
            case MarkerDirection.LEFT:
                return 90;
            default:
                return 0;
        }
    }


    /**
     * 只寫入起點資料，不建立視覺節點。
     */
    private markStartPointData(startPoints: Vec2[] | number[][]): void {
        if (!startPoints || startPoints.length === 0) {
            console.warn('[GameMapDecorator] 沒有起點資料可寫入');
            return;
        }

        for (let playerIndex = 0; playerIndex < startPoints.length; playerIndex++) {
            const coord = this.resolveDecorationCoord(startPoints[playerIndex]);
            if (!coord) {
                console.warn('[GameMapDecorator] 起點資料座標格式錯誤', startPoints[playerIndex]);
                continue;
            }

            const [r, c] = coord;
            this._mapCenter.setGridState(r, c, GridState.START_POINT);
            this._mapCenter.addMarker(r, c, {
                type: MarkerType.START,
                icon: null,
                data: { isStartPoint: true },
                playerIndex: playerIndex
            });
        }
    }

    
    
    /**
     * 只寫入裝飾資料，不建立視覺節點。
     */
    private placeDecorationData(positions: Vec2[] | number[][] | MapDecorationItem[], decorationType: DecorationType): void {
        if (!positions || positions.length === 0) {
            return;
        }

        const coordList: [number, number][] = [];
        for (let playerIndex = 0; playerIndex < positions.length; playerIndex++) {
            const parsed = this.resolveDecorationData(positions[playerIndex]);
            if (!parsed) {
                console.warn('[GameMapDecorator] 裝飾資料座標格式錯誤', positions[playerIndex]);
                continue;
            }

            const [r, c] = parsed.coord;
            coordList[playerIndex] = [r, c];
            this._mapCenter.addMarker(r, c, {
                type: this.decorationDataToMarkerType(decorationType),
                icon: null,
                data: {
                    decorationType: decorationType,
                    direction: parsed.direction
                },
                playerIndex: playerIndex
            });

            const grid = this._mapCenter.getGridAt(r, c);
            if (grid) {
                grid.isSpecial = true;
            }
        }

        this._decorationCoordMap.set(decorationType, coordList);
    }

    private resolveDecorationData(source: Vec2 | number[] | MapDecorationItem): { coord: [number, number], direction: MarkerDirection } | null {
        let direction: MarkerDirection = MarkerDirection.NONE;

        if (source instanceof MapDecorationItem || (source && typeof source === 'object' && 'position' in source && 'direction' in source)) {
            const item = source as MapDecorationItem;
            direction = item.direction;
            return { coord: [item.position.x, item.position.y], direction };
        }

        const coord = this.resolveDecorationCoord(source);
        if (!coord) {
            return null;
        }

        return { coord, direction };
    }

    private resolveDecorationCoord(source: Vec2 | number[] | MapDecorationItem): [number, number] | null {
        if (source instanceof Vec2) {
            return [source.x, source.y];
        }

        if (Array.isArray(source)) {
            if (source.length < 2) {
                return null;
            }
            return [source[0], source[1]];
        }

        if (source instanceof MapDecorationItem || (source && typeof source === 'object' && 'position' in source)) {
            const item = source as MapDecorationItem;
            return [item.position.x, item.position.y];
        }

        return null;
    }

    /**
     * applyDecorationData 專用的類型轉換。
     * 資料寫入流程保持獨立，不共用原本視覺流程使用的 decorationToMarkerType。
     */
    private decorationDataToMarkerType(decorationType: DecorationType): MarkerType {
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
     *
     * @deprecated old flow，即將刪除。新流程請使用 decorationDataToMarkerType。
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

    // ========== 即將刪除區域：舊箭頭方向更新流程 ==========

    // ========== 即將刪除區域結束：舊箭頭方向更新流程 ==========
}
