import { Node, Vec3 } from 'cc';
import { IGridData, GridState, IMarker, MarkerType, IGameMapConfig } from './def/GameMapDef';
import { IViewTransformer } from '../factorySys/defs/path/PathFactoryDef';

/**
 * 遊戲地圖管理中心
 * <注意!!!!!>
 * 這裡的資料都是採用位旋轉的<基本盤座標來記錄>
 * 所以要查找相關資訊需要<將座標換成基本盤坐標系來查找>
 * // Step 1: 玩家當前視角座標 → 基本盤座標
    const [dataR, dataC] = viewTransformer.playerViewToBase(10, 10, 2);

    // Step 2: 用基本盤座標來查找
    const grid = mapCenter.getGridAt(dataR, dataC);
    const markers = grid.markers;  // 取得正確的資料
 * 
 * 職責：
 * 1. 管理所有格子的數據和狀態
 * 2. 提供格子查詢和修改接口
 * 3. 管理格子上的特殊標記
 * 4. 追蹤格子占據情況
 * 
 * 使用範例：
 * ```typescript
 * const mapCenter = new GameMapCenter();
 * mapCenter.initFromNodes(nodes, positions);
 * 
 * // 查詢格子
 * const grid = mapCenter.getGridAt(5, 5);
 * 
 * // 設置狀態
 * mapCenter.setGridState(1, 6, GridState.START_POINT);
 * 
 * // 添加標記
 * mapCenter.addMarker(1, 6, { type: MarkerType.START, icon: null, data: null });
 * ```
 */
export class GameMapCenter {
    
    private _gridData: IGridData[][] = [];
    private _gridSize: number = 15;
    private _config: IGameMapConfig = {
        gridSize: 15,
        enableMarkers: true,
        enableStateTracking: true
    };
    
    // 玩家標記索引緩存
    private _markersByPlayer: Map<number, IMarker[]> = new Map();
    
    // ========== 初始化 ==========
    
    /**
     * 從節點陣列初始化地圖數據
     * @param nodes 節點二維陣列
     * @param positions 位置二維陣列
     */
    public initFromNodes(nodes: Node[][], positions: Vec3[][]): void {
        this._gridSize = nodes.length;
        this._config.gridSize = this._gridSize;
        
        for (let r = 0; r < this._gridSize; r++) {
            this._gridData[r] = [];
            for (let c = 0; c < this._gridSize; c++) {
                this._gridData[r][c] = this.createGridData(
                    nodes[r][c],
                    positions[r][c],
                    [r, c]
                );
            }
        }
        
        console.log(`[GameMapCenter] 地圖初始化完成`,this._gridData);
    }
    
    /**
     * 創建格子數據
     * @param node 節點
     * @param position 位置
     * @param coord 坐標
     * @returns 格子數據
     */
    private createGridData(node: Node, position: Vec3, coord: [number, number]): IGridData {
        return {
            containerNode: node,
            position: position,
            gridCoord: coord,
            state: GridState.EMPTY,
            decorateNode: null,
            markers: [],
            isSpecial: false,
            pawnsOnGrid: [],
            occupant: null
        };
    }
    
    /**
     * 設置地圖配置
     * @param config 地圖配置
     */
    public setConfig(config: Partial<IGameMapConfig>): void {
        this._config = { ...this._config, ...config };
    }
    
    // ========== 格子訪問 ==========
    
    /**
     * 獲取指定坐標的格子數據
     * @param r 行索引
     * @param c 列索引
     * @returns 格子數據，如果越界則返回 null
     */
    public getGridAt(r: number, c: number): IGridData | null {
        if (r < 0 || r >= this._gridSize || c < 0 || c >= this._gridSize) {
            console.warn(`[GameMapCenter] 座標越界: [${r}, ${c}]`);
            return null;
        }
        return this._gridData[r]?.[c] ?? null;
    }
    
    /**
     * 獲取所有格子數據
     * @returns 格子數據二維陣列
     */
    public getAllGrids(): IGridData[][] {
        return this._gridData;
    }
    
    /**
     * 獲取格子的節點
     * @param r 行索引
     * @param c 列索引
     * @returns 節點，如果不存在則返回 null
     */
    public getNodeAt(r: number, c: number): Node | null {
        return this.getGridAt(r, c)?.containerNode ?? null;
    }
    
    /**
     * 獲取格子的世界坐標
     * @param r 行索引
     * @param c 列索引
     * @returns 世界坐標，如果不存在則返回 null
     */
    public getPositionAt(r: number, c: number): Vec3 | null {
        return this.getGridAt(r, c)?.position ?? null;
    }
    
    // ========== 狀態管理 ==========
    
    /**
     * 設置格子狀態
     * @param r 行索引
     * @param c 列索引
     * @param state 格子狀態
     */
    public setGridState(r: number, c: number, state: GridState): void {
        const grid = this.getGridAt(r, c);
        if (grid) {
            grid.state = state;
        }
    }
    
    /**
     * 獲取格子狀態
     * @param r 行索引
     * @param c 列索引
     * @returns 格子狀態，如果不存在則返回 null
     */
    public getGridState(r: number, c: number): GridState | null {
        return this.getGridAt(r, c)?.state ?? null;
    }
    
    /**
     * 檢查格子是否為空
     * @param r 行索引
     * @param c 列索引
     * @returns 是否為空
     */
    public isGridEmpty(r: number, c: number): boolean {
        const grid = this.getGridAt(r, c);
        return grid?.state === GridState.EMPTY && 
               grid?.occupant === null && 
               grid?.pawnsOnGrid.length === 0;
    }
    
    /**
     * 檢查格子是否被占據
     * @param r 行索引
     * @param c 列索引
     * @returns 是否被占據
     */
    public isGridOccupied(r: number, c: number): boolean {
        const grid = this.getGridAt(r, c);
        return grid?.state === GridState.OCCUPIED || 
               grid?.occupant !== null || 
               (grid?.pawnsOnGrid.length ?? 0) > 0;
    }
    
    // ========== 占據者管理 ==========
    
    /**
     * 設置格子占據者（主要占據者）
     * @param r 行索引
     * @param c 列索引
     * @param occupant 占據者
     */
    public setOccupant(r: number, c: number, occupant: any): void {
        const grid = this.getGridAt(r, c);
        if (grid) {
            grid.occupant = occupant;
            grid.state = GridState.OCCUPIED;
        }
    }
    
    /**
     * 移除格子占據者
     * @param r 行索引
     * @param c 列索引
     * @returns 被移除的占據者
     */
    public clearOccupant(r: number, c: number): any {
        const grid = this.getGridAt(r, c);
        if (grid) {
            const oldOccupant = grid.occupant;
            grid.occupant = null;
            
            // 如果沒有其他棋子，狀態改為空白
            if (grid.pawnsOnGrid.length === 0) {
                grid.state = GridState.EMPTY;
            }
            
            return oldOccupant;
        }
        return null;
    }
    
    /**
     * 獲取格子占據者
     * @param r 行索引
     * @param c 列索引
     * @returns 占據者，如果不存在則返回 null
     */
    public getOccupant(r: number, c: number): any | null {
        return this.getGridAt(r, c)?.occupant ?? null;
    }
    
    // ========== 棋子管理 ==========
    
    /**
     * 添加棋子到格子
     * @param r 行索引
     * @param c 列索引
     * @param pawn 棋子
     */
    public addPawn(r: number, c: number, pawn: any): void {
        const grid = this.getGridAt(r, c);
        if (grid) {
            grid.pawnsOnGrid.push(pawn);
            grid.state = GridState.OCCUPIED;
        }
    }
    
    /**
     * 從格子移除棋子
     * @param r 行索引
     * @param c 列索引
     * @param pawn 棋子
     * @returns 是否移除成功
     */
    public removePawn(r: number, c: number, pawn: any): boolean {
        const grid = this.getGridAt(r, c);
        if (grid) {
            const index = grid.pawnsOnGrid.indexOf(pawn);
            if (index >= 0) {
                grid.pawnsOnGrid.splice(index, 1);
                
                // 如果沒有其他棋子且沒有占據者，狀態改為空白
                if (grid.pawnsOnGrid.length === 0 && !grid.occupant) {
                    grid.state = GridState.EMPTY;
                }
                
                return true;
            }
        }
        return false;
    }
    
    /**
     * 獲取格子上的所有棋子
     * @param r 行索引
     * @param c 列索引
     * @returns 棋子陣列
     */
    public getPawnsAt(r: number, c: number): any[] {
        return this.getGridAt(r, c)?.pawnsOnGrid ?? [];
    }
    
    /**
     * 清空格子上的所有棋子
     * @param r 行索引
     * @param c 列索引
     * @returns 被清空的棋子陣列
     */
    public clearPawns(r: number, c: number): any[] {
        const grid = this.getGridAt(r, c);
        if (grid) {
            const oldPawns = [...grid.pawnsOnGrid];
            grid.pawnsOnGrid = [];
            
            // 如果沒有占據者，狀態改為空白
            if (!grid.occupant) {
                grid.state = GridState.EMPTY;
            }
            
            return oldPawns;
        }
        return [];
    }
    
    // ========== 特殊標記管理 ==========
    
    /**
     * 添加特殊標記
     * @param r 行索引（基本盤坐標）
     * @param c 列索引（基本盤坐標）
     * @param marker 標記
     */
    public addMarker(r: number, c: number, marker: IMarker): void {
        if (!this._config.enableMarkers) return;
        
        const grid = this.getGridAt(r, c);
        if (grid) {
            // 設置數據坐標和初始視覺坐標
            marker.dataCoord = [r, c];
            marker.visualCoord = [r, c];
            
            grid.markers.push(marker);
            grid.isSpecial = true;
            
            // 添加到玩家索引緩存 ⭐
            if (marker.playerIndex !== undefined) {
                if (!this._markersByPlayer.has(marker.playerIndex)) {
                    this._markersByPlayer.set(marker.playerIndex, []);
                }
                this._markersByPlayer.get(marker.playerIndex)!.push(marker);
            }
            
            // 如果有圖標，添加到節點上
            if (marker.icon) {
                marker.icon.parent = grid.containerNode;
            }
        }
    }
    
    /**
     * 移除特殊標記
     * @param r 行索引
     * @param c 列索引
     * @param markerType 標記類型
     * @returns 是否移除成功
     */
    public removeMarker(r: number, c: number, markerType: MarkerType): boolean {
        const grid = this.getGridAt(r, c);
        if (grid) {
            const index = grid.markers.findIndex(m => m.type === markerType);
            if (index >= 0) {
                const marker = grid.markers[index];
                
                // 從玩家索引緩存中移除 
                if (marker.playerIndex !== undefined) {
                    const playerMarkers = this._markersByPlayer.get(marker.playerIndex);
                    if (playerMarkers) {
                        const playerIndex = playerMarkers.indexOf(marker);
                        if (playerIndex >= 0) {
                            playerMarkers.splice(playerIndex, 1);
                        }
                    }
                }
                
                // 移除圖標節點
                if (marker.icon) {
                    marker.icon.removeFromParent();
                    marker.icon.destroy();
                }
                
                grid.markers.splice(index, 1);
                grid.isSpecial = grid.markers.length > 0;
                
                return true;
            }
        }
        return false;
    }
    
    /**
     * 檢查是否有特定標記
     * @param r 行索引
     * @param c 列索引
     * @param markerType 標記類型
     * @returns 是否有該標記
     */
    public hasMarker(r: number, c: number, markerType: MarkerType): boolean {
        const grid = this.getGridAt(r, c);
        return grid?.markers.some(m => m.type === markerType) ?? false;
    }
    
    /**
     * 獲取格子的所有標記
     * @param r 行索引
     * @param c 列索引
     * @returns 標記陣列
     */
    public getMarkers(r: number, c: number): IMarker[] {
        return this.getGridAt(r, c)?.markers ?? [];
    }
    
    /**
     * 清空格子的所有標記
     * @param r 行索引
     * @param c 列索引
     */
    public clearMarkers(r: number, c: number): void {
        const grid = this.getGridAt(r, c);
        if (grid) {
            // 从玩家索引缓存中移除
            grid.markers.forEach(marker => {
                if (marker.icon) {
                    marker.icon.removeFromParent();
                    marker.icon.destroy();
                }
                
                // 从玩家缓存中移除
                if (marker.playerIndex !== undefined) {
                    const playerMarkers = this._markersByPlayer.get(marker.playerIndex);
                    if (playerMarkers) {
                        const index = playerMarkers.indexOf(marker);
                        if (index >= 0) {
                            playerMarkers.splice(index, 1);
                        }
                    }
                }
            });
            
            grid.markers = [];
            grid.isSpecial = false;
        }
    }
    
    // ========== 批量操作 ==========
    
    /**
     * 標記起點格子（批量）
     * @param coords 坐標陣列
     */
    public markStartPoints(coords: [number, number][]): void {
        coords.forEach(([r, c]) => {
            this.setGridState(r, c, GridState.START_POINT);
            this.addMarker(r, c, {
                type: MarkerType.START,
                icon: null,
                data: { isStartPoint: true }
            });
        });
        
        console.log(`[GameMapCenter] 已標記 ${coords.length} 個起點`);
    }
    
    /**
     * 標記安全區（批量）
     * @param coords 坐標陣列
     */
    public markSafeZones(coords: [number, number][]): void {
        coords.forEach(([r, c]) => {
            this.setGridState(r, c, GridState.SAFE_ZONE);
            this.addMarker(r, c, {
                type: MarkerType.SAFE,
                icon: null,
                data: { isSafeZone: true }
            });
        });
        
        console.log(`[GameMapCenter] 已標記 ${coords.length} 個安全區`);
    }
    
    /**
     * 標記終點格子（批量）
     * @param coords 坐標陣列
     */
    public markEndPoints(coords: [number, number][]): void {
        coords.forEach(([r, c]) => {
            this.setGridState(r, c, GridState.END_POINT);
        });
        
        console.log(`[GameMapCenter] 已標記 ${coords.length} 個終點`);
    }
    
    /**
     * 清空指定區域的所有數據
     * @param coords 坐標陣列
     */
    public clearRegion(coords: [number, number][]): void {
        coords.forEach(([r, c]) => {
            const grid = this.getGridAt(r, c);
            if (grid) {
                grid.state = GridState.EMPTY;
                grid.occupant = null;
                grid.pawnsOnGrid = [];
                this.clearMarkers(r, c);
            }
        });
    }
    
    // ========== 查詢與統計 ==========
    
    /**
     * 獲取指定狀態的所有格子
     * @param state 格子狀態
     * @returns 格子坐標陣列
     */
    public getGridsByState(state: GridState): [number, number][] {
        const result: [number, number][] = [];
        
        for (let r = 0; r < this._gridSize; r++) {
            for (let c = 0; c < this._gridSize; c++) {
                if (this._gridData[r][c].state === state) {
                    result.push([r, c]);
                }
            }
        }
        
        return result;
    }
    
    /**
     * 獲取所有特殊格子
     * @returns 格子坐標陣列
     */
    public getAllSpecialGrids(): [number, number][] {
        const result: [number, number][] = [];
        
        for (let r = 0; r < this._gridSize; r++) {
            for (let c = 0; c < this._gridSize; c++) {
                if (this._gridData[r][c].isSpecial) {
                    result.push([r, c]);
                }
            }
        }
        
        return result;
    }
    
    /**
     * 獲取地圖大小
     * @returns 格子數量
     */
    public getGridSize(): number {
        return this._gridSize;
    }
    
    // ========== 視角旋轉功能 ==========
    
    /**
     * 旋轉所有標記圖標的視覺位置（數據層不變）
     * 
     * 工作原理：
     * - markers 數據仍保存在基本盤座標 [r, c] 的格子中
     * - 只移動 marker.icon 節點的父節點到新視角下的格子
     * - playerIndex = 0 時視覺位置與基本盤一致，無需移動
     * 
     * @param playerIndex 當前玩家索引 (0:Blue, 1:Red, 2:Green, 3:Yellow)
     * @param viewTransformer 視角轉換器
     */
    public rotateMarkersView(playerIndex: number, viewTransformer: IViewTransformer): void {
        // playerIndex = 0 時，視覺位置 = 基本盤位置，不需要移動
        if (playerIndex === 0) {
            console.log('[GameMapCenter] playerIndex=0，標記位置無需調整');
            return;
        }
        
        console.log(`[GameMapCenter] 開始旋轉標記到玩家 ${playerIndex} 視角...`);
        
        // 遍歷所有格子，找出有 markers 的格子
        for (let r = 0; r < this._gridSize; r++) {
            for (let c = 0; c < this._gridSize; c++) {
                const grid = this._gridData[r][c];
                
                // 跳過沒有 markers 的格子
                if (!grid || grid.markers.length === 0) {
                    continue;
                }
                
                // 計算該格子在新視角下的位置
                const [newR, newC] = viewTransformer.baseToPlayerView(r, c, playerIndex);
                
                // 獲取目標格子
                const targetGrid = this._gridData[newR]?.[newC];
                if (!targetGrid) {
                    console.warn(`[GameMapCenter] 目標格子 [${newR}, ${newC}] 不存在`);
                    continue;
                }
                
                // 移動所有 marker 的 icon 到新格子
                for (const marker of grid.markers) {
                    if (marker.icon) {
                        // 將 icon 的父節點改為目標格子的 containerNode
                        marker.icon.parent = targetGrid.containerNode;
                        
                        // 更新視覺坐標
                        marker.visualCoord = [newR, newC];
                        
                        // 標記所屬玩家信息
                        const playerNames = ['Blue', 'Red', 'Green', 'Yellow'];
                        const ownerPlayer = marker.playerIndex;
                        const ownerInfo = ownerPlayer !== undefined ? ` (玩家: ${playerNames[ownerPlayer]})` : '';
                        
                        console.log(`[GameMapCenter] 移動標記 icon (type: ${MarkerType[marker.type]}${ownerInfo}) 從 [${r},${c}] 到 [${newR},${newC}]`);
                    }
                }
            }
        }
        
        console.log('[GameMapCenter] 標記旋轉完成');
    }
    
    /**
     * 重置所有標記圖標到基本盤位置
     * 
     * 將所有 marker.icon 的父節點恢復到其數據所在格子的 containerNode
     * 用於切換回基本盤視角或重置視角狀態
     */
    public resetMarkersView(): void {
        console.log('[GameMapCenter] 重置標記到基本盤位置...');
        
        // 遍歷所有格子
        for (let r = 0; r < this._gridSize; r++) {
            for (let c = 0; c < this._gridSize; c++) {
                const grid = this._gridData[r][c];
                
                if (!grid || grid.markers.length === 0) {
                    continue;
                }
                
                // 將所有 marker 的 icon 父節點設置回該格子的 containerNode
                for (const marker of grid.markers) {
                    if (marker.icon && marker.icon.parent !== grid.containerNode) {
                        marker.icon.parent = grid.containerNode;
                        // 重置視覺坐標到數據坐標
                        marker.visualCoord = marker.dataCoord;
                    }
                }
            }
        }
        
        console.log('[GameMapCenter] 標記已重置到基本盤');
    }
    
    // ========== 按玩家查詢 ==========
    
    /**
     * 獲取特定玩家的所有標記
     * @param playerIndex 玩家索引 (0:Blue, 1:Red, 2:Green, 3:Yellow)
     * @param markerType 可選：篩選特定類型的標記
     * @returns 標記信息陣列，包含數據坐標、視覺坐標和標記對象
     */
    public getMarkersByPlayer(playerIndex: number, markerType?: MarkerType): Array<{
        dataCoord: [number, number],
        visualCoord: [number, number],
        marker: IMarker
    }> {
        
        const playerMarkers = this._markersByPlayer.get(playerIndex) || [];
        
        const result = [];
        for (const marker of playerMarkers) {
            // 如果指定了類型，進行篩選
            if (!markerType || marker.type === markerType) {
                result.push({
                    dataCoord: marker.dataCoord || [0, 0],
                    visualCoord: marker.visualCoord || [0, 0],
                    marker: marker
                });
            }
        }
        
        return result;
    }
    
    /**
     * 刪除特定玩家的標記
     * @param playerIndex 玩家索引 (0:Blue, 1:Red, 2:Green, 3:Yellow)
     * @param markerType 可選：只刪除特定類型的標記
     * @returns 被刪除的標記數量
     */
    public removeMarkersByPlayer(playerIndex: number, markerType?: MarkerType): number {
        
        const playerMarkers = this._markersByPlayer.get(playerIndex);
        if (!playerMarkers || playerMarkers.length === 0) {
            return 0;
        }
        
        let count = 0;
        
        // 倒序遍歷以安全刪除
        for (let i = playerMarkers.length - 1; i >= 0; i--) {
            const marker = playerMarkers[i];
            
            // 如果指定了類型，進行篩選
            if (markerType && marker.type !== markerType) {
                continue;
            }
            
            // 移除圖標節點
            if (marker.icon) {
                marker.icon.removeFromParent();
                marker.icon.destroy();
            }
            
            // 從格子中移除
            if (marker.dataCoord) {
                const [r, c] = marker.dataCoord;
                const grid = this.getGridAt(r, c);
                if (grid) {
                    const gridIndex = grid.markers.indexOf(marker);
                    if (gridIndex >= 0) {
                        grid.markers.splice(gridIndex, 1);
                    }
                    grid.isSpecial = grid.markers.length > 0;
                }
            }
            
            // 從玩家緩存中移除
            playerMarkers.splice(i, 1);
            count++;
        }
        
        const playerNames = ['Blue', 'Red', 'Green', 'Yellow'];
        const typeInfo = markerType !== undefined ? ` (類型: ${MarkerType[markerType]})` : '';
        console.log(`[GameMapCenter] 已刪除 ${playerNames[playerIndex]} 的 ${count} 個標記${typeInfo}`);
        
        return count;
    }
    
    /**
     * 統計各玩家的標記數量
     * @returns 各玩家標記數量的統計對象
     */
    public getMarkerStatsByPlayer(): Record<number, number> {
        
        const stats: Record<number, number> = {};
        
        this._markersByPlayer.forEach((markers, playerIndex) => {
            stats[playerIndex] = markers.length;
        });
        
        return stats;
    }
    
    /**
     * 清空整個地圖
     */
    public clear(): void {
        for (let r = 0; r < this._gridSize; r++) {
            for (let c = 0; c < this._gridSize; c++) {
                this.clearMarkers(r, c);
                const grid = this._gridData[r][c];
                if (grid) {
                    grid.state = GridState.EMPTY;
                    grid.occupant = null;
                    grid.pawnsOnGrid = [];
                    grid.isSpecial = false;
                }
            }
        }
        
        // 清空玩家索引緩存
        this._markersByPlayer.clear();
        
        console.log(`[GameMapCenter] 地圖已清空`);
    }
    
    // ========== 玩家視角查詢方法（便捷API）==========
    
    /**
     * 用玩家視角座標查詢格子數據
     * 自動將玩家視角座標轉換為基本盤座標
     * 
     * @param r 玩家視角下的行索引
     * @param c 玩家視角下的列索引
     * @param playerType 當前玩家類型 (0:Blue, 1:Red, 2:Green, 3:Yellow)
     * @param viewTransformer 視角轉換器
     * @returns 格子數據，如果越界則返回 null
     * 
     * 使用範例：
     * ```typescript
     * // 查詢當前玩家視角下 [5, 5] 位置的格子
     * const grid = mapCenter.getGridAtPlayerView(5, 5, currentPlayerType, viewTransformer);
     * if (grid) {
     *     console.log('格子狀態:', grid.state);
     *     console.log('格子上的棋子數量:', grid.pawnsOnGrid.length);
     * }
     * ```
     */
    public getGridAtPlayerView(
        r: number, 
        c: number, 
        playerType: number, 
        viewTransformer: IViewTransformer
    ): IGridData | null {
        const [dataR, dataC] = viewTransformer.playerViewToBase(r, c, playerType);
        return this.getGridAt(dataR, dataC);
    }
    
    /**
     * 用玩家視角座標設置格子狀態
     * 
     * @param r 玩家視角下的行索引
     * @param c 玩家視角下的列索引
     * @param state 格子狀態
     * @param playerType 當前玩家類型
     * @param viewTransformer 視角轉換器
     */
    public setGridStateInPlayerView(
        r: number, 
        c: number, 
        state: GridState, 
        playerType: number, 
        viewTransformer: IViewTransformer
    ): void {
        const [dataR, dataC] = viewTransformer.playerViewToBase(r, c, playerType);
        this.setGridState(dataR, dataC, state);
    }
    
    /**
     * 用玩家視角座標查詢格子狀態
     * 
     * @param r 玩家視角下的行索引
     * @param c 玩家視角下的列索引
     * @param playerType 當前玩家類型
     * @param viewTransformer 視角轉換器
     * @returns 格子狀態
     */
    public getGridStateInPlayerView(
        r: number, 
        c: number, 
        playerType: number, 
        viewTransformer: IViewTransformer
    ): GridState | null {
        const [dataR, dataC] = viewTransformer.playerViewToBase(r, c, playerType);
        return this.getGridState(dataR, dataC);
    }
    
    /**
     * 用玩家視角座標檢查格子是否為空
     * 
     * @param r 玩家視角下的行索引
     * @param c 玩家視角下的列索引
     * @param playerType 當前玩家類型
     * @param viewTransformer 視角轉換器
     * @returns 是否為空
     */
    public isGridEmptyInPlayerView(
        r: number, 
        c: number, 
        playerType: number, 
        viewTransformer: IViewTransformer
    ): boolean {
        const [dataR, dataC] = viewTransformer.playerViewToBase(r, c, playerType);
        return this.isGridEmpty(dataR, dataC);
    }
    
    /**
     * 用玩家視角座標檢查格子是否被占據
     * 
     * @param r 玩家視角下的行索引
     * @param c 玩家視角下的列索引
     * @param playerType 當前玩家類型
     * @param viewTransformer 視角轉換器
     * @returns 是否被占據
     */
    public isGridOccupiedInPlayerView(
        r: number, 
        c: number, 
        playerType: number, 
        viewTransformer: IViewTransformer
    ): boolean {
        const [dataR, dataC] = viewTransformer.playerViewToBase(r, c, playerType);
        return this.isGridOccupied(dataR, dataC);
    }
    
    /**
     * 用玩家視角座標獲取格子上的棋子
     * 
     * @param r 玩家視角下的行索引
     * @param c 玩家視角下的列索引
     * @param playerType 當前玩家類型
     * @param viewTransformer 視角轉換器
     * @returns 棋子陣列
     */
    public getPawnsAtPlayerView(
        r: number, 
        c: number, 
        playerType: number, 
        viewTransformer: IViewTransformer
    ): any[] {
        const [dataR, dataC] = viewTransformer.playerViewToBase(r, c, playerType);
        return this.getPawnsAt(dataR, dataC);
    }
    
    /**
     * 用玩家視角座標獲取格子的標記
     * 
     * @param r 玩家視角下的行索引
     * @param c 玩家視角下的列索引
     * @param playerType 當前玩家類型
     * @param viewTransformer 視角轉換器
     * @returns 標記陣列
     */
    public getMarkersInPlayerView(
        r: number, 
        c: number, 
        playerType: number, 
        viewTransformer: IViewTransformer
    ): IMarker[] {
        const [dataR, dataC] = viewTransformer.playerViewToBase(r, c, playerType);
        return this.getMarkers(dataR, dataC);
    }
    
    /**
     * 用玩家視角座標檢查是否有特定標記
     * 
     * @param r 玩家視角下的行索引
     * @param c 玩家視角下的列索引
     * @param markerType 標記類型
     * @param playerType 當前玩家類型
     * @param viewTransformer 視角轉換器
     * @returns 是否有該標記
     */
    public hasMarkerInPlayerView(
        r: number, 
        c: number, 
        markerType: MarkerType, 
        playerType: number, 
        viewTransformer: IViewTransformer
    ): boolean {
        const [dataR, dataC] = viewTransformer.playerViewToBase(r, c, playerType);
        return this.hasMarker(dataR, dataC, markerType);
    }
    
    /**
     * 用玩家視角座標添加標記
     * 
     * @param r 玩家視角下的行索引
     * @param c 玩家視角下的列索引
     * @param marker 標記對象
     * @param playerType 當前玩家類型
     * @param viewTransformer 視角轉換器
     */
    public addMarkerInPlayerView(
        r: number, 
        c: number, 
        marker: IMarker, 
        playerType: number, 
        viewTransformer: IViewTransformer
    ): void {
        const [dataR, dataC] = viewTransformer.playerViewToBase(r, c, playerType);
        this.addMarker(dataR, dataC, marker);
    }
    
    /**
     * 用玩家視角座標獲取格子的世界坐標
     * 
     * @param r 玩家視角下的行索引
     * @param c 玩家視角下的列索引
     * @param playerType 當前玩家類型
     * @param viewTransformer 視角轉換器
     * @returns 世界坐標
     */
    public getPositionAtPlayerView(
        r: number, 
        c: number, 
        playerType: number, 
        viewTransformer: IViewTransformer
    ): Vec3 | null {
        const [dataR, dataC] = viewTransformer.playerViewToBase(r, c, playerType);
        return this.getPositionAt(dataR, dataC);
    }
    
    /**
     * 用玩家視角座標獲取格子節點
     * 
     * @param r 玩家視角下的行索引
     * @param c 玩家視角下的列索引
     * @param playerType 當前玩家類型
     * @param viewTransformer 視角轉換器
     * @returns 格子節點
     */
    public getNodeAtPlayerView(
        r: number, 
        c: number, 
        playerType: number, 
        viewTransformer: IViewTransformer
    ): Node | null {
        const [dataR, dataC] = viewTransformer.playerViewToBase(r, c, playerType);
        return this.getNodeAt(dataR, dataC);
    }
}
