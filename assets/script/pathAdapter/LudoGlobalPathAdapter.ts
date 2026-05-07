/**
 * LUDO 棋盤路徑轉接器，以 server 格子編號為基礎。
 *
 * 格子編號系統：
 * - 公共路段：0-51，環形共 52 格。
 * - Home 路段：52-57（座位0）/ 58-63（座位1）/ 64-69（座位2）/ 70-75（座位3）。
 * - 基地 Slot：負數，座位0 -> -1~-4，座位1 -> -5~-8，座位2 -> -9~-12，座位3 -> -13~-16。
 */
export const LUDO_BOARD_CONST = {
    PUBLIC_TRACK_SIZE: 52,
    HOME_LENGTH: 6,
    PIECES_PER_PLAYER: 4,

    /** 各座位出發格子號 */
    PLAYER_START: [0, 13, 26, 39] as const,

    /** 轉入 home 前的最後一個公共路段格子，座位0 不走 51。 */
    PLAYER_HOME_ENTRY: [50, 11, 24, 37] as const,

    /** Home 路段第一格 */
    PLAYER_HOME_START: [52, 58, 64, 70] as const,

    /** 終點格子號 */
    PLAYER_HOME_END: [57, 63, 69, 75] as const,

    /**
     * 各座位第一顆棋子（index 0）的基地 Slot ID。
     * 第 j 顆棋子：BASE_SLOT_START[chair] - j。
     */
    BASE_SLOT_START: [-1, -5, -9, -13] as const,
} as const;

/**
 * 將 server global grid id 轉接到現有 pathIndex 系統。
 *
 * 這個 adapter 不處理棋盤座標，也不修改 BasicPathGenerator。
 * 它只負責：
 * - chairIndex -> 該玩家的 server global path。
 * - chairIndex + global grid id -> 該玩家路徑中的 pathIndex。
 * - from/to global grid id -> 移動路徑。
 */
export class LudoGlobalPathAdapter {
    /** 路徑快取：chairIndex -> 57 個格子號的陣列。 */
    private readonly _cache: Map<number, number[]> = new Map();

    /**
     * 取得指定座位的完整路徑。
     * index 0 = 出發點，index 56 = 終點。
     */
    public getPlayerPath(chairIndex: number): number[] {
        if (!this._cache.has(chairIndex)) {
            this._cache.set(chairIndex, this.buildPath(chairIndex));
        }
        return this._cache.get(chairIndex)!;
    }

    /**
     * 取得動畫用途路徑，包含起點與終點。
     * @param chairIndex 座位編號。
     * @param fromPos 當前格子號，可為負數基地 Slot。
     * @param toPos 目標格子號，使用 server global grid id。
     * @returns 途經格子號陣列；fromPos 是基地時直接回傳 [toPos]。
     */
    public getMovePath(chairIndex: number, fromPos: number, toPos: number): number[] {
        if (fromPos < 0) {
            return [toPos];
        }

        const path = this.getPlayerPath(chairIndex);
        const fromIdx = path.indexOf(fromPos);
        const toIdx = path.indexOf(toPos);

        if (fromIdx === -1 || toIdx === -1 || toIdx < fromIdx) {
            return [toPos];
        }

        return path.slice(fromIdx, toIdx + 1);
    }

    /**
     * 取得格子號在指定玩家路徑中的索引。
     * 基地格（負數）或不在路徑上的格子回傳 -1。
     */
    public getPathIndex(chairIndex: number, gridPos: number): number {
        if (gridPos < 0) {
            return -1;
        }
        return this.getPlayerPath(chairIndex).indexOf(gridPos);
    }

    /**
     * 取得到達終點所需的剩餘步數。
     * 基地格（負數）或不在路徑上的格子回傳 Infinity。
     */
    public getStepsToFinish(chairIndex: number, gridPos: number): number {
        if (gridPos < 0) {
            return Infinity;
        }

        const path = this.getPlayerPath(chairIndex);
        const curIdx = path.indexOf(gridPos);

        if (curIdx === -1) {
            return Infinity;
        }

        return (path.length - 1) - curIdx;
    }

    /**
     * 判斷指定格子是否為該座位的終點。
     */
    public isFinished(chairIndex: number, gridPos: number): boolean {
        return gridPos === LUDO_BOARD_CONST.PLAYER_HOME_END[chairIndex];
    }

    /**
     * 判斷是否在基地。
     */
    public isInBase(gridPos: number): boolean {
        return gridPos < 0;
    }

    /**
     * 取得指定座位、棋子索引對應的基地 Slot ID。
     * 例：getBaseSlotId(0, 0) -> -1，getBaseSlotId(1, 2) -> -7。
     */
    public getBaseSlotId(chairIndex: number, pieceIndex: number): number {
        return LUDO_BOARD_CONST.BASE_SLOT_START[chairIndex] - pieceIndex;
    }

    /**
     * 建立完整路徑：51 格公共路段 + 6 格 home，總長 57。
     */
    private buildPath(chairIndex: number): number[] {
        const {
            PUBLIC_TRACK_SIZE,
            HOME_LENGTH,
            PLAYER_START,
            PLAYER_HOME_ENTRY,
            PLAYER_HOME_START
        } = LUDO_BOARD_CONST;

        const path: number[] = [];
        const homeEntry: number = PLAYER_HOME_ENTRY[chairIndex];
        const homeStart: number = PLAYER_HOME_START[chairIndex];

        let pos: number = PLAYER_START[chairIndex];
        while (true) {
            path.push(pos);
            if (pos === homeEntry) {
                break;
            }
            pos = (pos + 1) % PUBLIC_TRACK_SIZE;
        }

        for (let i = 0; i < HOME_LENGTH; i++) {
            path.push(homeStart + i);
        }

        return path;
    }
}
