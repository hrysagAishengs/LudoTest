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
 * 從固定的4種顏色排列中隨機選擇一種，對應背景圖案的不同旋轉
 * 
 * 背景限制：
 * 因為背景圖案是固定的，只能通過旋轉來對齊，所以顏色排列限定為以下4種：
 * - [Blue, Red, Green, Yellow]   - 0° 旋轉
 * - [Yellow, Blue, Red, Green]   - 90° 旋轉
 * - [Green, Yellow, Blue, Red]   - 180° 旋轉
 * - [Red, Green, Yellow, Blue]   - 270° 旋轉
 * 
 * 使用場景：
 * - 房間初始化時，隨機選擇一種排列分配給所有座位
 * - 每種排列確保覆蓋所有4種顏色（不重複）
 * 
 * 使用範例：
 * ```typescript
 * const selector = new ColorSelector();
 * 
 * // 房間初始化時隨機選擇一種排列（4 人局）
 * const colorMap = selector.randomAssignColors(4);
 * // 可能結果: 座位0→Green, 座位1→Yellow, 座位2→Blue, 座位3→Red (180° 旋轉)
 * ```
 */
export class ColorSelector {
    
    // ========== 靜態配置 ==========
    
    /**
     * 固定的顏色排列組合（對應背景圖案的4種旋轉）
     * 因為背景圖案固定，只能從這4種排列中選擇
     * 
     * [座位0, 座位1, 座位2, 座位3]
     * - [B,R,G,Y]: 0° 基本盤
     * - [Y,B,R,G]: 90° 旋轉
     * - [G,Y,B,R]: 180° 旋轉
     * - [R,G,Y,B]: 270° 旋轉
     */
    private static readonly FIXED_COLOR_COMBINATIONS: PlayerColor[][] = [
        [PlayerColor.BLUE, PlayerColor.RED, PlayerColor.GREEN, PlayerColor.YELLOW],   // 0° 旋轉
        [PlayerColor.YELLOW, PlayerColor.BLUE, PlayerColor.RED, PlayerColor.GREEN],   // 90° 旋轉
        [PlayerColor.GREEN, PlayerColor.YELLOW, PlayerColor.BLUE, PlayerColor.RED],   // 180° 旋轉
        [PlayerColor.RED, PlayerColor.GREEN, PlayerColor.YELLOW, PlayerColor.BLUE]    // 270° 旋轉
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
     * 從固定的4種顏色排列中隨機選擇一種（對應背景圖案的不同旋轉）
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
        
        // 從4種固定排列中隨機選一種
        const randomIndex = Math.floor(Math.random() * ColorSelector.FIXED_COLOR_COMBINATIONS.length);
        const selectedCombination = ColorSelector.FIXED_COLOR_COMBINATIONS[randomIndex];
        
        const rotationNames = ['0°', '90°', '180°', '270°'];
        console.log(`[ColorSelector] 隨機選擇顏色排列: ${rotationNames[randomIndex]} 旋轉`);
        
        // 分配顏色給座位
        const colorMap = new Map<number, PlayerColor>();
        
        for (let seatIndex = 0; seatIndex < playerCount; seatIndex++) {
            const color = selectedCombination[seatIndex];
            const colorName = ColorSelector.COLOR_NAMES.get(color)!;
            
            colorMap.set(seatIndex, color);
            
            // 記錄到分配歷史
            this.assignedColors.set(seatIndex, {
                logicColor: color,
                logicColorName: colorName
            });
            
            console.log(`[ColorSelector] 座位 ${seatIndex} 分配: ${colorName}(${color})`);
        }
        
        return colorMap;
    }
    
    /**
     * 指定顏色排列索引來分配顏色（測試用）
     * 用於重現特定的基本盤狀態來調試
     * 
     * @param playerCount - 玩家數量 (2/3/4)
     * @param combinationIndex - 排列索引 (0=0°, 1=90°, 2=180°, 3=270°)
     * @returns 座位索引到顏色的映射 Map<seatIndex, PlayerColor>
     */
    public assignColorsByIndex(playerCount: number, combinationIndex: number): Map<number, PlayerColor> {
        if (playerCount < 2 || playerCount > 4) {
            throw new Error(`[ColorSelector] 無效的 playerCount: ${playerCount}，有效範圍 2-4`);
        }
        
        if (combinationIndex < 0 || combinationIndex >= ColorSelector.FIXED_COLOR_COMBINATIONS.length) {
            throw new Error(`[ColorSelector] 無效的 combinationIndex: ${combinationIndex}，有效範圍 0-3`);
        }
        
        // 清空舊的分配記錄
        this.assignedColors.clear();
        
        // 使用指定的排列
        const selectedCombination = ColorSelector.FIXED_COLOR_COMBINATIONS[combinationIndex];
        
        const rotationNames = ['0°', '90°', '180°', '270°'];
        console.log(`[ColorSelector] 手動指定顏色排列: ${rotationNames[combinationIndex]} 旋轉 (index=${combinationIndex})`);
        
        // 分配顏色給座位
        const colorMap = new Map<number, PlayerColor>();
        
        for (let seatIndex = 0; seatIndex < playerCount; seatIndex++) {
            const color = selectedCombination[seatIndex];
            const colorName = ColorSelector.COLOR_NAMES.get(color)!;
            
            colorMap.set(seatIndex, color);
            
            // 記錄到分配歷史
            this.assignedColors.set(seatIndex, {
                logicColor: color,
                logicColorName: colorName
            });
            
            console.log(`[ColorSelector] 座位 ${seatIndex} 分配: ${colorName}(${color})`);
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
