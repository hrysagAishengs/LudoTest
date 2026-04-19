/**
 * 視角轉換工具類
 * 將基本盤的絕對座標轉換為特定玩家視角下的座標
 */
export class BoardViewTransformer {
    private readonly BOARD_MAX_INDEX = 14; // 15x15 棋盤的最大索引
    private _mapBoardContent:Record<number, number[][]> =null;

    set mapBoardContent(value: Record<number, number[][]>) {
        this._mapBoardContent = value;
    }

    /**
     * 從基本盤座標轉換到指定玩家視角的座標
     * @param row 基本盤的 row
     * @param col 基本盤的 col
     * @param currentPlayer 當前在左下角的玩家 (0:Blue, 1:Red, 2:Green, 3:Yellow)
     * @returns 轉換後的座標 [row, col]
     */
    public baseToPlayerView(row: number, col: number, currentPlayer: number): [number, number] {
        // 計算需要逆時針旋轉的次數
        // Blue(0)→0次, Yellow(3)→1次, Green(2)→2次, Red(1)→3次
        const rotations = (4 - currentPlayer) % 4;
        
        let r = row;
        let c = col;

        for (let i = 0; i < rotations; i++) {
            // 逆時針旋轉90度: [r, c] → [14-c, r]
            const temp = r;
            r = this.BOARD_MAX_INDEX - c;
            c = temp;
        }

        return [r, c];
    }

    /**
     * 從玩家視角座標轉換回基本盤座標
     * @param row 玩家視角的 row
     * @param col 玩家視角的 col
     * @param currentPlayer 當前在左下角的玩家 (0:Blue, 1:Red, 2:Green, 3:Yellow)
     * @returns 轉換後的座標 [row, col]
     */
    public playerViewToBase(row: number, col: number, currentPlayer: number): [number, number] {
        // 計算需要順時針旋轉的次數（與逆時針相反）
        const rotations = (4 - currentPlayer) % 4;
        
        let r = row;
        let c = col;

        for (let i = 0; i < rotations; i++) {
            // 順時針旋轉90度: [r, c] → [c, 14-r]
            const temp = r;
            r = c;
            c = this.BOARD_MAX_INDEX - temp;
        }

        return [r, c];
    }

    /**
     * 批量轉換路徑座標
     */
    public convertPath(path: number[][], currentPlayer: number, toBase: boolean = false): number[][] {
        return path.map(([r, c]) => 
            toBase ? this.playerViewToBase(r, c, currentPlayer) : this.baseToPlayerView(r, c, currentPlayer)
        );
    }

    /**
     * 計算從起點移動指定步數後的終點位置
     * @param playerView 當前玩家視角 (0:Blue, 1:Red, 2:Green, 3:Yellow)
     * @param startPos 起點位置 [row, col]（玩家視角下的座標）
     * @param steps 移動步數
     * @returns 終點位置 [row, col]（玩家視角下的座標），如果超出路徑返回 null
     */
    public getDestination(playerView: number, startPos: [number, number], steps: number): [number, number] | null {
        // 獲取該玩家在基本盤的路徑
        const basePath = this._mapBoardContent[playerView];
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
     * 獲取從起點到終點的完整路徑段
     * @param playerView 當前玩家視角 (0:Blue, 1:Red, 2:Green, 3:Yellow)
     * @param startPos 起點位置 [row, col]（玩家視角下的座標）
     * @param steps 移動步數
     * @returns 路徑段陣列（包含起點和終點，均為玩家視角下的座標），如果超出路徑返回 null
     */
    public getPathSegment(playerView: number, startPos: [number, number], steps: number): number[][] | null {
        // 獲取該玩家在基本盤的路徑
        const basePath = this._mapBoardContent[playerView];
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

    /**
     * 計算其他玩家從指定索引移動後的終點位置（返回當前玩家視角下的座標）
     * @param playerView 當前玩家的視角 (0:Blue, 1:Red, 2:Green, 3:Yellow)
     * @param otherPlayer 在當前玩家視角下的其他玩家位置 (0:左下, 1:左上, 2:右上, 3:右下)
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
        const basePath = this._mapBoardContent[otherPlayer];
        if (!basePath) return null;

        const endIndex = startIndex + steps;
        if (endIndex < 0 || endIndex >= basePath.length) return null; // 超出路徑範圍

        const baseCoord = basePath[endIndex];
        //console.log(`Other player ${otherPlayer} (base player ${baseCoord}) moves from index ${startIndex} to ${endIndex} on base path, coordinate:`, baseCoord);
        // 轉換為當前玩家視角下的座標
        return this.baseToPlayerView(baseCoord[0], baseCoord[1], playerView);
        
    }

    public getOtherPlayerDestToGlobalSegment(
        playerView: number, 
        otherPlayer: number, 
        startIndex: number, 
        steps: number
    ): number[][] | null {
        // 獲取該玩家在基本盤的路徑
        const basePath = this._mapBoardContent[otherPlayer];
        if (!basePath) return null;

        const endIndex = startIndex + steps;
        if (endIndex < 0 || endIndex >= basePath.length) return null; // 超出路徑範圍
        const baseSegment = basePath.slice(startIndex, endIndex + 1);
        //console.log(`Other player ${otherPlayer} (base player ${baseSegment}) moves from index ${startIndex} to ${endIndex} on base path, segment:`, baseSegment);
        // 轉換為當前玩家視角下的座標
        return baseSegment.map(([r, c]) => {
            const viewCoord = this.baseToPlayerView(r, c, playerView);
            return [viewCoord[0], viewCoord[1]];
        });
    }
}