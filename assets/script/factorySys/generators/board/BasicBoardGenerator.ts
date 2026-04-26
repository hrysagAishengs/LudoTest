import { _decorator, Component, Node, Vec3, UITransform, instantiate, Prefab, Color, Sprite } from 'cc';
import { IBoardGenerator, BoardGenerateMode } from '../../defs/board/FactoryDef';



export class BasicBoardGenerator implements IBoardGenerator{
     
    public cellPrefab: Prefab = null!; // 產生底圖基本單位一個簡單的白色方塊 Prefab
    public nodeContainer: Node = null!; // 棋盤生成的父節點

    // === 棋盤配置參數（從配置傳入） ===
    private _gridSize: number = 15; // 棋盤格子數量（預設 15x15）
    private _boardHeight: number = 720; // 棋盤容器高度（像素，預設 720）
    private _cellSize: number = 48; // 單個格子的視覺大小（像素，預設 48）
    
    /**
     * 格子間距（中心點到中心點的距離）
     * 計算公式：棋盤高度 / 格子數
     * 
     * 解釋：
     * - 格子緊密排列，無間隙
     * - 720 / 15 = 48 像素（每個格子佔用 48 像素）
     * - 格子大小 = 格子間距 = 48 像素
     */
    private get CELL_SPACING(): number {
        return this._boardHeight / this._gridSize;
    }

    // 儲存所有格子的引用，方便之後透過座標找節點
    private _cells: Node[][] = [];
    // 儲存所有格子的座標位置（不建立實際節點時使用）
    private _cellPositions: Vec3[][] = [];
    
    /**
     * 設置棋盤配置參數
     * @param gridSize 棋盤格子數量
     * @param cellSize 單個格子的視覺大小
     * @param boardHeight 棋盤容器的高度
     */
    public setConfig(gridSize: number, cellSize: number, boardHeight: number): void {
        this._gridSize = gridSize;
        this._cellSize = cellSize;
        this._boardHeight = boardHeight;
    }
    
    //=========interface methods========================================
    public async generateBoard(mode: BoardGenerateMode = BoardGenerateMode.PREFAB_GRID): Promise<void>{
       
        return new Promise((resolve,reject) => {
            try{
                switch (mode) {
                    case BoardGenerateMode.DYNAMIC_GRID:
                        this.createDynamicGrid();
                        break;
                    case BoardGenerateMode.PREFAB_GRID:
                        this.createPrefabGrid();
                        break;
                    case BoardGenerateMode.POS_ONLY:
                        this.createPosGridOnly();
                        break;
                    default:
                        console.error(`未知的棋盤生成模式: ${mode}`);
                        reject(new Error(`Unknown board generate mode: ${mode}`));
                        return;
                }
                resolve();
            }catch (error) {
                console.error('Error generating board:', error);
                reject(error);
            }
       });
    }

    // 讓 Pawn 調用座標
    public getCellPosition(r: number, c: number): Vec3 {
        // 如果有實際節點，返回節點位置；否則返回預計算的座標
        if(this._cells.length > 0 && this._cells[r] && this._cells[r][c]){
            return this._cells[r][c].position;
        }
        return this._cellPositions[r]?.[c] || new Vec3(0, 0, 0);
    }

    /**
     * 獲取玩家基地坑位的位置座標(放置旗子的地方)
     * 獲取基地坑位的座標
     * @param r 較小的 row 索引 (例如 1)
     * @param c 較小的 col 索引 (例如 1)
     */
    public getBaseSlotPosition(r: number, c: number):Vec3{
        // 先取出左下角那一格的中心座標
        const basePos = this.getCellPosition(r, c);
        // 向右偏移半格，向上偏移半格，即為四格交會的中心點
        const halfCell = this._cellSize / 2; // (因為預設基礎單位是 48)
        return new Vec3(basePos.x + halfCell, basePos.y + halfCell, basePos.z);
    }

    public getAllBaseSlotPositions(): Vec3[][] {
        /**
         *  blue (左下)：傳入 (1, 1), (1, 3), (3, 1), (3, 3)
            red (左上)：傳入 (10, 1), (10, 3), (12, 1), (12, 3)
            green (右上)：傳入 (10, 10), (10, 12), (12, 10), (12, 12)
            yellow (右下)：傳入 (1, 10), (1, 12), (3, 10), (3, 12)
            這是四個玩家基地坑位的中心點座標，對應棋盤上的四格交會處，適合放置旗子等遊戲元素
         */
        const baseSlotPositions: Vec3[][] = [];
        const baseCoords = [
            [[1, 1], [1, 3], [3, 1], [3, 3]], // blue
            [[10, 1], [10, 3], [12, 1], [12, 3]], // red
            [[10, 10], [10, 12], [12, 10], [12, 12]], // green
            [[1, 10], [1, 12], [3, 10], [3, 12]] // yellow
        ];
        for (const playerSlots of baseCoords) {
            const playerBasePositions: Vec3[] = [];
            for (const [r, c] of playerSlots) {
                playerBasePositions.push(this.getBaseSlotPosition(r, c));
            }
            baseSlotPositions.push(playerBasePositions);
        }
        return baseSlotPositions;
    }
     /**
     * 獲取全部棋盤座標陣列
     */
    public getAllPositions(): Vec3[][] {
        return this._cellPositions;
    }
    
    /**
     * 獲取全部棋盤節點陣列（用於地圖管理）
     * @returns 節點二維陣列
     */
    public getAllCells(): Node[][] {
        return this._cells;
    }

    public getGridSize(): number {
        return this._gridSize;
    }

    /**
     * 獲取格子大小
     */
    public getCellSize(): number {
        return this._cellSize;
    }

    /**
     * 獲取格子間距
     */
    public getCellSpacing(): number {
        return this.CELL_SPACING;
    }

    /**
     * 獲取棋盤高度
     */
    public getBoardHeight(): number {
        return this._boardHeight;
    }

    public removeBoard(): void{
        
        if(this._cells.length > 0){
            for(let r=0; r<this._cells.length; r++){
                for(let c=0; c<this._cells[r].length; c++){
                    const cell = this._cells[r][c];
                    cell?.removeFromParent();
                    cell?.destroy();
                }
            }
            this._cells = [];
        }
        this._cellPositions = [];
    }

    //=========interface methods========================================

    private createPrefabGrid():void {
        // 計算偏移量，讓棋盤的中心點剛好在 Node 的 (0,0) 位置
        const offset = (this._gridSize - 1) * this.CELL_SPACING / 2;
       
        for (let r = 0; r < this._gridSize; r++) {
            this._cells[r] = [];
            for (let c = 0; c < this._gridSize; c++) {
                const cell = instantiate(this.cellPrefab);
                cell.parent = this.nodeContainer;

                // 根據我們對齊的邏輯：Col 為橫向(X)，Row 為縱向(Y)
                const posX = c * this.CELL_SPACING - offset;
                const posY = r * this.CELL_SPACING - offset;
                
                cell.setPosition(new Vec3(posX, posY, 0));
                cell.name = `Cell_${r}_${c}`;
                
                this._cells[r][c] = cell;

                // 這裡可以根據座標塗色，方便你肉眼驗證
                this.debugColorize(r, c, cell);
            }
        }
    }

    /**
     * 直接生成棋盤座標陣列（用於已有背景圖片的情況）
     * 不建立實際的 Prefab 節點，只計算並儲存每個格子的座標位置
     * 
     * 座標計算邏輯：
     * 1. 使用 CELL_SPACING（格子間距）來計算每個格子的中心點位置
     * 2. 格子間距 = (棋盤高度 - 格子大小) / (格子數 - 1)
     * 3. 通過偏移量讓整個棋盤居中在 (0, 0) 位置
     */
    private createPosGridOnly(): void {
        // 計算偏移量，讓棋盤的中心點剛好在 (0,0) 位置
        const offset = (this._gridSize - 1) * this.CELL_SPACING / 2;

        for (let r = 0; r < this._gridSize; r++) {
            this._cellPositions[r] = [];
            for (let c = 0; c < this._gridSize; c++) {
                // 根據邏輯：Col 為橫向(X)，Row 為縱向(Y)
                // 使用 CELL_SPACING 計算格子中心點位置
                const posX = c * this.CELL_SPACING - offset;
                const posY = r * this.CELL_SPACING - offset;
                
                this._cellPositions[r][c] = new Vec3(posX, posY, 0);
            }
        }

        console.log(`棋盤生成配置：
            - 格子數量: ${this._gridSize} x ${this._gridSize}
            - 格子大小: ${this._cellSize} px
            - 棋盤高度: ${this._boardHeight} px
            - 格子間距: ${this.CELL_SPACING.toFixed(2)} px
            - 總偏移量: ${offset.toFixed(2)} px
        `);
    }

    private debugColorize(r: number, c: number, cell: Node) {
        const sprite = cell.getComponent(Sprite);
        if (!sprite) return;

        // 驗證我們剛剛討論的藍色起飛點 [1, 6]
        if (r === 1 && c === 6) {
            sprite.color = new Color(0, 0, 255); // 藍色起飛點
        } 
        // 驗證藍色進入終點的箭頭轉折點 [0, 7]
        else if (r === 0 && c === 7) {
            sprite.color = new Color(100, 100, 255); // 淺藍色轉折點
        }
        // 標示中心終點區域
        else if (r >= 6 && r <= 8 && c >= 6 && c <= 8) {
            sprite.color = new Color(200, 200, 200); // 灰色中心
        }
    }

    /**
     * 動態創建空節點網格（不使用 Prefab）
     * 每個格子是一個帶 UITransform 的空 Node，緊密排列
     * 適用於有背景圖的情況，通過實際 Node 獲取坐標，自動適配縮放
     */
    private createDynamicGrid(): void {
        // 計算偏移量，讓棋盤中心在 (0,0)
        const offset = (this._gridSize - 1) * this.CELL_SPACING / 2;
       
        for (let r = 0; r < this._gridSize; r++) {
            this._cells[r] = [];
            this._cellPositions[r] = [];
            for (let c = 0; c < this._gridSize; c++) {
                // 創建空節點
                const cell = new Node(`Cell_${r}_${c}`);
                cell.parent = this.nodeContainer;

                // 添加 UITransform 並設置尺寸
                const transform = cell.addComponent(UITransform);
                transform.setContentSize(this._cellSize, this._cellSize);
                transform.setAnchorPoint(0.5, 0.5); // 錨點在中心
                
                // 計算位置（Col=X, Row=Y）
                const posX = c * this.CELL_SPACING - offset;
                const posY = r * this.CELL_SPACING - offset;
                cell.setPosition(posX, posY, 0);
                
                this._cells[r][c] = cell;
                this._cellPositions[r][c] = new Vec3(posX, posY, 0);
            }
        }
        
        console.log(`動態網格生成完成：${this._gridSize}x${this._gridSize} = ${this._gridSize * this._gridSize} 個節點`);
    }

}