/**
 * 玩家棋盤顏色列舉
 * 對應遊戲中的四種顏色陣營
 */
export enum PlayerColor {
    BLUE = 0,
    RED = 1,
    GREEN = 2,
    YELLOW = 3
}

/**
 * 顏色匹配結果
 */
export interface ColorMatchResult {
    /** 遊戲邏輯顏色（基於 Server 座位分配） */
    logicColor: PlayerColor;
    /** 邏輯顏色名稱 */
    logicColorName: string;
}

/**
 * 玩家顏色選擇器
 * 
 * 職責：
 * 隨機分配棋盤顏色給座位索引（Server 給座位 index，客戶端隨機決定使用哪種顏色）
 * 
 * 使用場景：
 * - 房間初始化時，一次性隨機分配所有座位的顏色
 * - 確保每個顏色只被使用一次（不重複）
 * 
 * 使用範例：
 * ```typescript
 * const selector = new ColorSelector();
 * 
 * // 房間初始化時隨機分配（4 人局）
 * const colorMap = selector.randomAssignColors(4);
 * // 可能結果: { 0→Green, 1→Yellow, 2→Blue, 3→Red }
 * ```
 */
export class ColorSelector {
    
    // ========== 靜態配置 ==========
    
    /**
     * 所有可用的棋盤顏色
     */
    private static readonly ALL_COLORS: PlayerColor[] = [
        PlayerColor.BLUE,
        PlayerColor.RED,
        PlayerColor.GREEN,
        PlayerColor.YELLOW
    ];
    
    /**
     * 邏輯顏色名稱映射（用於調試和日誌）
     */
    private static readonly COLOR_NAMES: Map<PlayerColor, string> = new Map([
        [PlayerColor.BLUE, 'Blue'],
        [PlayerColor.RED, 'Red'],
        [PlayerColor.GREEN, 'Green'],
        [PlayerColor.YELLOW, 'Yellow']
    ]);
    
    // ========== 實例狀態 ==========
    
    /** 已分配的顏色記錄（用於調試） */
    private assignedColors: Map<number, ColorMatchResult> = new Map();
    
    // ========== 核心方法 ==========
    
    /**
     * 隨機分配顏色給所有座位
     * 將可用顏色隨機打亂後按座位順序分配，確保每個顏色只用一次
     * 
     * @param playerCount - 玩家數量 (2/3/4)
     * @returns 座位索引到顏色的映射 Map<seatIndex, PlayerColor>
     */
    public randomAssignColors(playerCount: number): Map<number, PlayerColor> {
        if (playerCount < 2 || playerCount > 4) {
            throw new Error(`[ColorSelector] 無效的 playerCount: ${playerCount}，有效範圍 2-4`);
        }
        
        // 清空舊的分配記錄
        this.assignedColors.clear();
        
        // 複製顏色陣列並隨機打亂
        const shuffledColors = this._shuffleArray([...ColorSelector.ALL_COLORS]);
        
        // 取前 playerCount 個顏色分配給座位
        const colorMap = new Map<number, PlayerColor>();
        
        for (let seatIndex = 0; seatIndex < playerCount; seatIndex++) {
            const color = shuffledColors[seatIndex];
            const colorName = ColorSelector.COLOR_NAMES.get(color)!;
            
            colorMap.set(seatIndex, color);
            
            // 記錄到分配歷史
            this.assignedColors.set(seatIndex, {
                logicColor: color,
                logicColorName: colorName
            });
            
            console.log(`[ColorSelector] 座位 ${seatIndex} 隨機分配: ${colorName}`);
        }
        
        return colorMap;
    }
    
    /**
     * 獲取座位的已分配顏色
     * 
     * @param seatIndex - 座位索引
     * @returns 玩家邏輯顏色，若未分配則返回 undefined
     */
    public getAssignedColor(seatIndex: number): PlayerColor | undefined {
        const result = this.assignedColors.get(seatIndex);
        return result?.logicColor;
    }
    
    /**
     * 獲取邏輯顏色的名稱
     * 
     * @param color - 玩家邏輯顏色
     * @returns 顏色名稱字串
     */
    public getColorName(color: PlayerColor): string {
        return ColorSelector.COLOR_NAMES.get(color) || 'Unknown';
    }
    
    /**
     * 重置顏色選擇器
     * 清空已分配記錄
     * 適用於開始新遊戲或新房間時
     */
    public reset(): void {
        this.assignedColors.clear();
        console.log(`[ColorSelector] 已重置`);
    }
    
    /**
     * 獲取已分配的顏色資訊（用於調試）
     * 
     * @returns 已分配的座位和顏色映射
     */
    public getAssignedColors(): Map<number, ColorMatchResult> {
        return new Map(this.assignedColors);
    }
    
    // ========== 私有方法 ==========
    
    /**
     * Fisher-Yates 洗牌演算法
     * 隨機打亂陣列元素順序
     * 
     * @param array - 要打亂的陣列
     * @returns 打亂後的陣列（原地修改）
     * @private
     */
    private _shuffleArray<T>(array: T[]): T[] {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
    
    // ========== 工具方法 ==========
    
    /**
     * 靜態方法：根據顏色枚舉獲取顏色名稱
     * 
     * @param color - 玩家顏色枚舉
     * @returns 顏色名稱
     */
    public static getColorNameByEnum(color: PlayerColor): string {
        return ColorSelector.COLOR_NAMES.get(color) || 'Unknown';
    }
    
    /**
     * 靜態方法：驗證玩家數量是否有效
     * 
     * @param playerCount - 玩家數量
     * @returns 是否有效
     */
    public static isValidPlayerCount(playerCount: number): boolean {
        return playerCount >= 2 && playerCount <= 4;
    }
}
