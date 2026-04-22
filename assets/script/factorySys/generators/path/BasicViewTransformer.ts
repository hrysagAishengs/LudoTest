//import { IViewTransformer } from '../def/PathFactoryDef';

import { IViewTransformer } from "../../defs/path/PathFactoryDef";

/**
 * 基礎視角轉換器
 * 處理標準 15x15 棋盤的視角轉換和路徑計算
 * 
 * 主要功能：
 * 1. 基本盤座標 ↔ 玩家視角座標的轉換
 * 2. 基於位置或索引的路徑計算
 * 3. 多玩家視角的座標轉換
 */
export class BasicViewTransformer implements IViewTransformer {
    
    private readonly BOARD_MAX_INDEX = 14; // 15x15 棋盤的最大索引
    private _pathMap: Record<number, number[][]> | null = null;

    /**
     * 設置路徑內容
     * @param pathMap 所有玩家的路徑映射
     */
    public setPathContent(pathMap: Record<number, number[][]>): void {
        this._pathMap = pathMap;
    }

    // ========== 座標轉換方法 ==========

    /**
     * 從基本盤座標轉換到指定玩家視角的座標
     * 
     * 轉換邏輯：
     * - Blue(0) → 0次旋轉
     * - Yellow(3) → 1次逆時針旋轉
     * - Green(2) → 2次逆時針旋轉
     * - Red(1) → 3次逆時針旋轉
     * 
     * @param row 基本盤的 row 座標
     * @param col 基本盤的 col 座標
     * @param currentPlayer 當前在左下角的玩家 (0:Blue, 1:Red, 2:Green, 3:Yellow)
     * @returns 轉換後的座標 [row, col]
     */
    public baseToPlayerView(row: number, col: number, currentPlayer: number): [number, number] {
        // 計算需要逆時針旋轉的次數
        const rotations = (4 - currentPlayer) % 4;
        
        let r = row;
        let c = col;

        for (let i = 0; i < rotations; i++) {
            // 逆時針旋轉90度公式: [r, c] → [14-c, r]
            const temp = r;
            r = this.BOARD_MAX_INDEX - c;
            c = temp;
        }

        return [r, c];
    }

    /**
     * 從玩家視角座標轉換回基本盤座標
     * 
     * @param row 玩家視角的 row 座標
     * @param col 玩家視角的 col 座標
     * @param currentPlayer 當前在左下角的玩家 (0:Blue, 1:Red, 2:Green, 3:Yellow)
     * @returns 轉換後的基本盤座標 [row, col]
     */
    public playerViewToBase(row: number, col: number, currentPlayer: number): [number, number] {
        // 計算需要順時針旋轉的次數（與逆時針相反）
        const rotations = (4 - currentPlayer) % 4;
        
        let r = row;
        let c = col;

        for (let i = 0; i < rotations; i++) {
            // 順時針旋轉90度公式: [r, c] → [c, 14-r]
            const temp = r;
            r = c;
            c = this.BOARD_MAX_INDEX - temp;
        }

        return [r, c];
    }

    // ========== 基於位置的路徑計算 ==========

    /**
     * 計算從起點位置移動指定步數後的終點位置
     * 
     * @param playerView 當前玩家視角 (0:Blue, 1:Red, 2:Green, 3:Yellow)
     * @param startPos 起點位置 [row, col]（玩家視角下的座標）
     * @param steps 移動步數
     * @returns 終點位置 [row, col]（玩家視角下的座標），如果超出路徑返回 null
     */
    public getDestinationByPos(playerView: number, startPos: [number, number], steps: number): [number, number] | null {
        // 獲取該玩家在基本盤的路徑
        const basePath = this._pathMap?.[playerView];
        if (!basePath) return null;

        // 將玩家視角下的座標轉回基本盤座標
        const baseStartPos = this.playerViewToBase(startPos[0], startPos[1], playerView);
        
        // 在基本盤路徑中找到起點索引
        const startIndex = basePath.findIndex(([r, c]) => r === baseStartPos[0] && c === baseStartPos[1]);
        if (startIndex === -1) return null; // 起點不在路徑中

        // 計算終點索引
        const endIndex = startIndex + steps;
        if (endIndex < 0 || endIndex >= basePath.length) return null; // 超出路徑範圍

        // 獲取基本盤的終點座標
        const baseEndPos = basePath[endIndex];
        
        // 轉換回玩家視角
        return this.baseToPlayerView(baseEndPos[0], baseEndPos[1], playerView);
    }

    /**
     * 獲取從起點到終點的完整路徑段（基於起點位置）
     * 
     * @param playerView 當前玩家視角 (0:Blue, 1:Red, 2:Green, 3:Yellow)
     * @param startPos 起點位置 [row, col]（玩家視角下的座標）
     * @param steps 移動步數
     * @returns 路徑段陣列（包含起點和終點，均為玩家視角下的座標），如果超出路徑返回 null
     */
    public getPathSegmentByPos(playerView: number, startPos: [number, number], steps: number): number[][] | null {
        // 獲取該玩家在基本盤的路徑
        const basePath = this._pathMap?.[playerView];
        if (!basePath) return null;

        // 將玩家視角下的座標轉回基本盤座標
        const baseStartPos = this.playerViewToBase(startPos[0], startPos[1], playerView);
        
        // 在基本盤路徑中找到起點索引
        const startIndex = basePath.findIndex(([r, c]) => r === baseStartPos[0] && c === baseStartPos[1]);
        if (startIndex === -1) return null; // 起點不在路徑中

        // 計算終點索引
        const endIndex = startIndex + steps;
        if (endIndex < 0 || endIndex >= basePath.length) return null; // 超出路徑範圍

        // 獲取基本盤的路徑段
        const baseSegment = basePath.slice(startIndex, endIndex + 1);
        
        // 將整個路徑段轉換為玩家視角
        return baseSegment.map(([r, c]) => {
            const viewCoord = this.baseToPlayerView(r, c, playerView);
            return [viewCoord[0], viewCoord[1]];
        });
    }

    // ========== 基於索引的路徑計算 ==========

    /**
     * 計算從起點索引移動指定步數後的終點位置
     * 
     * @param playerView 當前玩家視角 (0:Blue, 1:Red, 2:Green, 3:Yellow)
     * @param startIndex 起點索引（在該玩家路徑陣列中的索引位置）
     * @param steps 移動步數
     * @returns 終點位置 [row, col]（玩家視角下的座標），如果超出路徑返回 null
     */
    public getDestinationByStartIndex(playerView: number, startIndex: number, steps: number): [number, number] | null {
        
        const basePath = this._pathMap?.[playerView];
        if (!basePath) return null;

        const endIndex = startIndex + steps;
        if (endIndex < 0 || endIndex >= basePath.length) return null;

        const baseEndPos = basePath[endIndex];
        return this.baseToPlayerView(baseEndPos[0], baseEndPos[1], playerView);
    }

    /**
     * 獲取從起點到終點的完整路徑段（基於起點索引）
     * 
     * @param playerView 當前玩家視角 (0:Blue, 1:Red, 2:Green, 3:Yellow)
     * @param startIndex 起點索引（在該玩家路徑陣列中的索引位置）
     * @param steps 移動步數
     * @returns 路徑段陣列（包含起點和終點，均為玩家視角下的座標），如果超出路徑返回 null
     */
    public getPathSegmentByStartIndex(playerView: number, startIndex: number, steps: number): number[][] | null {
        
        const basePath = this._pathMap?.[playerView];
        if (!basePath) return null;

        const endIndex = startIndex + steps;
        if (endIndex < 0 || endIndex >= basePath.length) return null;

        const baseSegment = basePath.slice(startIndex, endIndex + 1);
        return baseSegment.map(([r, c]) => this.baseToPlayerView(r, c, playerView));
    }

    // ========== 多玩家視角轉換 ==========

    /**
     * 計算其他玩家從指定索引移動後的終點位置（返回當前玩家視角下的座標）
     * 
     * @param playerView 當前玩家視角 (0:Blue, 1:Red, 2:Green, 3:Yellow)
     * @param otherPlayer 在當前玩家視角下的其他玩家相對位置 (0:左下, 1:左上, 2:右上, 3:右下)
     * @param startIndex 其他玩家在**基本盤路徑**上的起點索引
     * @param steps 移動步數
     * @returns 終點位置 [row, col]（當前玩家視角下的座標），如果超出路徑返回 null
     */
    public getOtherPlayerDestToGlobal(
        playerView: number,
        otherPlayer: number,
        startIndex: number,
        steps: number
    ): [number, number] | null {
        // 獲取該玩家在基本盤的路徑
        const basePath = this._pathMap?.[otherPlayer];
        if (!basePath) return null;

        const endIndex = startIndex + steps;
        if (endIndex < 0 || endIndex >= basePath.length) return null;

        const baseCoord = basePath[endIndex];
        
        // 轉換為當前玩家視角下的座標
        return this.baseToPlayerView(baseCoord[0], baseCoord[1], playerView);
    }

    /**
     * 計算其他玩家從指定索引移動後的路徑段（返回當前玩家視角下的座標）
     * 
     * @param playerView 當前玩家視角 (0:Blue, 1:Red, 2:Green, 3:Yellow)
     * @param otherPlayer 在當前玩家視角下的其他玩家相對位置 (0:左下, 1:左上, 2:右上, 3:右下)
     * @param startIndex 其他玩家在**基本盤路徑**上的起點索引
     * @param steps 移動步數
     * @returns 路徑段陣列（包含起點和終點，均為當前玩家視角下的座標），如果超出路徑返回 null
     */
    public getOtherPlayerDestToGlobalSegment(
        playerView: number,
        otherPlayer: number,
        startIndex: number,
        steps: number
    ): number[][] | null {
        // 獲取該玩家在基本盤的路徑
        const basePath = this._pathMap?.[otherPlayer];
        if (!basePath) return null;

        const endIndex = startIndex + steps;
        if (endIndex < 0 || endIndex >= basePath.length) return null;

        const baseSegment = basePath.slice(startIndex, endIndex + 1);
        
        // 轉換為當前玩家視角下的座標
        return baseSegment.map(([r, c]) => {
            const viewCoord = this.baseToPlayerView(r, c, playerView);
            return [viewCoord[0], viewCoord[1]];
        });
    }
}