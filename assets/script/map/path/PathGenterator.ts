// 藍色玩家外圈路徑 (52格)
// 起點 [1, 6]，順時針繞行
const BLUE_OUTER_PATH = [
    [1, 6], [2, 6], [3, 6], [4, 6], [5, 6], // 向上爬升
    [6, 5], [6, 4], [6, 3], [6, 2], [6, 1], [6, 0], // 左轉繞過紅區底部
    [7, 0], // 紅色轉折點
    [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], // 向上繞過紅區左側
    [9, 6], [10, 6], [11, 6], [12, 6], [13, 6], [14, 6], // 向上繞過紅區頂部
    [14, 7], // 綠色轉折點
    [14, 8], [13, 8], [12, 8], [11, 8], [10, 8], [9, 8], // 向下繞過綠區左側
    [8, 9], [8, 10], [8, 11], [8, 12], [8, 13], [8, 14], // 右轉繞過綠區頂部
    [7, 14], // 黃色轉折點
    [6, 14], [6, 13], [6, 12], [6, 11], [6, 10], [6, 9], // 向下繞過黃區右側
    [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8], // 向下繞過黃區底部
    [0, 7]  // 最後回到藍色箭頭格 (轉向入口)
];

// 藍色玩家內線路徑
const BLUE_INNER_PATH = [
    [1, 7], [2, 7], [3, 7], [4, 7], [5, 7], [6, 7] // 直衝中心
];

export class PathGenterator {
    
    private _pathMap: Record<number, number[][]> = {};

    get pathMap() {
        return this._pathMap;
    }
    
    public createPaths():void {
        // 獲取藍色基礎路徑 (包含 Outer + Inner)
        const base = [...BLUE_OUTER_PATH, ...BLUE_INNER_PATH];
        for (let playerType = 0; playerType < 4; playerType++) {
            // 根據玩家類型進行座標轉換
            this._pathMap[playerType] = base.map(coord => this.rotateCoords(coord[0], coord[1], playerType));  
        }   
    }
    /**
     * 將藍色路徑座標旋轉以適應其他玩家
     * @param row 原始 Row
     * @param col 原始 Col
     * @param playerType 0:藍, 1:紅, 2:綠, 3:黃
     */
    private rotateCoords(row: number, col: number, playerType: number): [number, number] {
        const center = 7; // 15x15 的中心索引是 7
        let r = row - center;
        let c = col - center;

        for (let i = 0; i < playerType; i++) {
            // 順時針旋轉 90 度公式: (r, c) -> (-c, r)
            let temp = r;
            r = -c;
            c = temp;
        }
        return [r + center, c + center];
    }

    public getPlayerPath(playerType: number): number[][] {
        return this._pathMap[playerType] || [];    
    }
}