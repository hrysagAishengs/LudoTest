import { _decorator, color, Component, Graphics, Node, UITransform, Vec3 } from 'cc';
import { LudoGameMode } from './gameDef/GameDef';
import { GameFactoryManager } from './gameMode/GameFactoryManager';
const { ccclass, property } = _decorator;

/**
 * Ludo 遊戲管理器（業務層）
 * 
 * 職責：
 * 1. 遊戲流程控制
 * 2. 封裝所有業務 API
 * 3. 整合遊戲各個模組
 * 
 * 使用範例：
 * ```typescript
 * // 初始化遊戲
 * await ludoGameManager.initGame(LudoGameMode.CLASSIC);
 * 
 * // 設置房間（由 Server 傳入玩家數量）
 * ludoGameManager.setupRoom(4); // 4人局
 * 
 * // 獲取房間管理器並操作玩家
 * const roomManager = ludoGameManager.getRoomPlayerManager();
 * roomManager.addPlayer(playerIdentity, viewIndex);
 * 
 * // 使用業務 API
 * const pos = ludoGameManager.getCellPosition(5, 5);
 * ludoGameManager.movePlayer(player, 6);
 * ```
 */
@ccclass('LudoGameManager')
export class LudoGameManager extends Component {
    
    @property({type:Node,displayName:"testNode",tooltip:"TESTNODE",visible:true})
    private _testNode: Node = null;
    
    @property({type:GameFactoryManager,displayName:"遊戲工廠管理器",tooltip:"負責管理遊戲工廠和組件的管理器",visible:true})
    private _factoryManager: GameFactoryManager = null;
    

    /*
    @property({type:BoardGeneratorManager,displayName:"棋盤生成管理器",tooltip:"負責管理棋盤生成的組件",visible:true})
    private _boardGeneratorManager: BoardGeneratorManager = null!;
    private _pathManager: PathManager = new PathManager();
    */

    // ========== 遊戲流程控制 ==========

    /**
     * 初始化遊戲模式
     * @param gameMode 遊戲模式
     */
    public async initGame(gameMode: LudoGameMode): Promise<void> {
        await this._factoryManager.initGameMode(gameMode);
        console.log(`[LudoGameManager] 遊戲模式 ${LudoGameMode[gameMode]} 初始化完成`);
    }
    
    /**
     * 設置房間（根據玩家數量動態生成面板）
     * @param playerCount 玩家數量 (2/3/4)
     */
    public setupRoom(playerCount: number): void {
        this._factoryManager.setupRoom(playerCount);
        console.log(`[LudoGameManager] 房間設置完成：${playerCount} 人局`);
    }
    
    /**
     * 設置本機玩家視角（本機玩家入桌時調用）
     * 當收到 Server 通知"你是座位 X"時調用此方法，自動旋轉棋盤到對應視角
     * 
     * @param localPlayerSeatIndex - 本機玩家的座位索引（Server 單獨通知）
     * 
     * 使用範例：
     * ```typescript
     * // Server 通知：你是座位 2
     * ludoGameManager.setupLocalPlayerView(2);
     * // → 自動旋轉棋盤到座位 2 對應的顏色視角
     * ```
     */
    public setupLocalPlayerView(localPlayerSeatIndex: number): void {
        this._factoryManager.setupLocalPlayerView(localPlayerSeatIndex);
        console.log(`[LudoGameManager] 本機玩家視角設置完成 (座位 ${localPlayerSeatIndex})`);
    }

    /**
     * @deprecated 使用 initGame 代替
     */
    public async initGameMode(gameMode: LudoGameMode): Promise<void> {
        return this.initGame(gameMode);
    }

    //--廢棄
    public async setBoard(gameMode: LudoGameMode): Promise<void> {
        /*
        this._boardGeneratorManager.setGameMode(gameMode);
        await this._boardGeneratorManager.createBoardGenerator();
        this._pathManager.setGameMode(gameMode);
        await this._pathManager.createPathGenerator();
        console.log('棋盤和路徑生成完成，遊戲準備就緒');
        */
    }

    public testPathMode(): void {
        
        const playerType = 2// 0: Blue, 1: Red, 2: Green, 3: Yellow
        const roomMaxPlayerCount = 4;
        this.setupRoom(roomMaxPlayerCount);
        this.rotateBoardView(playerType);
        const playerDestination = this.getPlayerDestinationByPos(playerType, [1, 6], 9);
        console.log(`Player ${playerType} destination after moving 5 steps from [1, 6]:`, playerDestination);
        
        const playerDes=this.getPlayerDestinationByIndex(playerType, 0, 9);
        console.log(`Player ${playerType} AAAA after moving 5 steps from index 0:`, playerDes);
        
        //const playerPathSegment = this.getPlayerPathSegment(playerType, [1, 6], 9);
        //const playerPathSegment=this.getPlayerPathSegmentByIndex(playerType, 0, 9);
        const otherPlayerDestination = this.getOtherPlayerDestToGlobal(playerType, 1, 0, 9);
        const otherPlayerSegment = this.getOtherPlayerDestToGlobalSegment(playerType, 1, 0, 9);

        console.log('testSegment',otherPlayerSegment);
        //const drawPos=this.getCellPosition(otherPlayerDestination[0],otherPlayerDestination[1]);
        
        
        //console.log(`Player ${playerType} path segment from [1, 6] moving 5 steps:`, playerPathSegment);
        //const pos=this.getCellPosition(playerDes[0],playerDes[1]);
        //const test = this.getPlayerDestinationByPos(playerType, [1, 6], 55);
        //const pos=this.getCellPosition(test[0],test[1]);
        //this.testDraw(pos);

        const slotPos=this.getPlayerBSToGlobalByCurrentView(1, -8, playerType);
        const drawPos=this.getBaseSlotPosition(slotPos[0],slotPos[1]);
        //const slotPos=this.getPlayerBSToGlobalByCurrentView(0, -1, playerType);
        //const slotPos=this.getPlayerBSToGlobalByCurrentView(0, -1, playerType);    
        //const slotPos=this.getOtherPlayerBSByIdToGlobal(-1, playerType);
        //const drawPos=this.getBaseSlotPosition(slotPos[0],slotPos[1]);

        
        this.testDraw(drawPos);
        
        // ========== 測試：Slot ID 查詢功能 ==========
        console.log('=== 測試 Slot ID 查詢功能 ===');
        
        // 測試 1：獲取每個玩家的 Slot ID 陣列
        console.log('各玩家的 Slot ID:');
        for (let i = 0; i < 4; i++) {
            const slotIds = this.getPlayerSlotIds(i);
            const playerNames = ['Blue', 'Red', 'Green', 'Yellow'];
            console.log(`  ${playerNames[i]} (${i}):`, slotIds);
        }
        
        // 測試 2：反查 Slot ID 的信息
        console.log('\nSlot ID 反查測試:');
        const testSlotIds = [-1, -2, -5, -6, -10, -13, -16];
        testSlotIds.forEach(slotId => {
            const info = this.getSlotInfo(slotId);
            if (info) {
                const playerNames = ['Blue', 'Red', 'Green', 'Yellow'];
                console.log(`  SlotID ${slotId} -> ${playerNames[info.playerType]} (playerType=${info.playerType}, index=${info.index})`);
            }
        });
        
        // 測試 3：模擬實際使用場景
        console.log('\n模擬點擊棋子場景:');
        const clickedSlotId = -6;  // 假設玩家點擊了 Red 的第 2 個棋子
        const clickedInfo = this.getSlotInfo(clickedSlotId);
        if (clickedInfo) {
            const playerNames = ['Blue', 'Red', 'Green', 'Yellow'];
            console.log(`  玩家點擊了: ${playerNames[clickedInfo.playerType]} 的第 ${clickedInfo.index + 1} 個棋子`);
            console.log(`  可發送給 Server: { playerId: ${clickedInfo.playerType}, pieceIndex: ${clickedInfo.index} }`);
            
            // 進一步獲取該坑位在當前視角下的座標
            const slotCoord = this.getPlayerBSToGlobalByCurrentView(clickedInfo.playerType, clickedSlotId, playerType);
            if (slotCoord) {
                console.log(`  該棋子在視角 ${playerType} 下的座標: [${slotCoord[0]}, ${slotCoord[1]}]`);
            }
        }
        
        console.log('=== Slot ID 測試完成 ===\n');
        
        // ========== 測試：視角坐標轉換與地圖查詢 ==========
        console.log('=== 測試視角坐標轉換與地圖查詢 ===');
        
        // 場景：玩家2點擊了視覺坐標 [10, 10]，想查詢這個格子的數據
        const clickPlayerIndex = 2;  // 當前玩家視角（Green）
        const clickVisualCoord: [number, number] = [10, 10];  // 玩家看到的坐標
        
        // Step 1: 獲取 ViewTransformer
        const viewTransformer = this._factoryManager.getViewTransformer();
        if (!viewTransformer) {
            console.error('ViewTransformer 未初始化');
            return;
        }
        
        // Step 2: 視角坐標 → 基本盤坐標
        const [dataR, dataC] = viewTransformer.playerViewToBase(
            clickVisualCoord[0], 
            clickVisualCoord[1], 
            clickPlayerIndex
        );
        console.log(`視角坐標 [${clickVisualCoord}] → 基本盤坐標 [${dataR}, ${dataC}]`);
        
        // Step 3: 用基本盤坐標查詢數據
        const mapCenter = this._factoryManager.getGameMapCenter();
        if (!mapCenter) {
            console.error('GameMapCenter 未初始化');
            return;
        }
        
        const grid = mapCenter.getGridAt(dataR, dataC);
        if (grid) {
            console.log('格子數據:', {
                gridCoord: grid.gridCoord,
                state: grid.state,
                isSpecial: grid.isSpecial,
                markerCount: grid.markers.length
            });
            
            // Step 4: 檢查標記信息
            if (grid.markers.length > 0) {
                console.log('該格子的標記:');
                grid.markers.forEach((marker, index) => {
                    const playerNames = ['Blue', 'Red', 'Green', 'Yellow'];
                    const ownerInfo = marker.playerIndex !== undefined ? playerNames[marker.playerIndex] : '未知';
                    console.log(`  標記 ${index + 1}:`, {
                        type: marker.type,
                        owner: ownerInfo,
                        dataCoord: marker.dataCoord,
                        visualCoord: marker.visualCoord
                    });
                });
            } else {
                console.log('該格子沒有標記');
            }
        } else {
            console.log('格子不存在或越界');
        }
        
        console.log('=== 測試完成 ===');
        
        //console.log(`Player ${playerType} destination position in world coordinates:`, pos);    
        //const playerPathSegment = this._pathManager.getPlayerPathSegment(playerType, [1, 6], 5);
        //console.log(`Player ${playerType} path segment from [1, 6] moving 5 steps:`, playerPathSegment);
        //const otherPlayerDestination = this._pathManager.getOtherPlayerDestToGlobal(playerType, 1, 0, 5);
        //console.log(`Player ${playerType} sees other player 1 moving 5 steps from index 0:`, otherPlayerDestination);
        //const otherPlayerSegment = this._pathManager.getOtherPlayerDestToGlobalSegment(playerType, 1, 0, 5);
        //console.log(`Player ${playerType} sees other player 1 path segment moving 5 steps from index 0:`, otherPlayerSegment);
    }


    private testDraw(pos:Vec3):void{
        
        let testNode:Node=new Node();
        let uitransform=testNode.addComponent(UITransform);
        uitransform.setContentSize(48,48);
        let graphic:Graphics=testNode.addComponent(Graphics);
        graphic.fillColor=color(0,0,0,255);
        graphic.rect(-24,-24,48,48);
        graphic.fill();
        this._testNode.addChild(testNode);
        testNode.setPosition(pos);
    }


    //----move player----
    public movePlayerByPos(playerType: number, startPos: [number, number], steps: number): void {

    }

    public moveOtherPlayer(playerType: number, otherPlayerIndex: number, startIndex: number, steps: number): void {

    }

    // ========== 視角旋轉 API ==========
    
    /**
     * <移動>
     * 旋轉棋盤視角以適配當前玩家
     * 
     * 玩家位置映射：
     * - 0: Blue (左下) → 0° (不旋轉)
     * - 1: Red (左上) → 90°
     * - 2: Green (右上) → 180°
     * - 3: Yellow (右下) → 270°
     * 
     * @param playerIndex 當前玩家索引 (0:Blue左下, 1:Red左上, 2:Green右上, 3:Yellow右下)
     */
    public rotateBoardView(playerIndex: number): void {
        this._factoryManager.rotateBoardView(playerIndex);
    }
    
    /**
     * <移動>
     * 重置棋盤視角到默認狀態（玩家 0 視角 - Blue 在底部）
     */
    public resetBoardView(): void {
        this._factoryManager.resetBoardView();
    }
    
    // ========== Board 相關 API ==========
    
    /**
     * <移動>
     */
    public getCellPosition(r: number, c: number): Vec3 | null {
        return this._factoryManager.getBoardGenerator()?.getCellPosition(r, c) ?? null;
    }
    
    /**
     * <移動>
     */
    public getBaseSlotPosition(r: number, c: number): Vec3 | null {
        return this._factoryManager.getBoardGenerator()?.getBaseSlotPosition(r, c) ?? null;
    }

    /**
     * <移動>
     */
    public getGridSize(): number | null {
        return this._factoryManager.getBoardGenerator()?.getGridSize() ?? null;
    }
    
    /**
     * <移動>
     */
    public getAllPositions(): Vec3[][] | null {
        return this._factoryManager.getBoardGenerator()?.getAllPositions() ?? null;
    }
    
    // ========== Path 相關 API ==========
    
    /**
     * <移動>
     */
    public getPlayerPath(playerType: number): number[][] | null {
        return this._factoryManager.getPathGenerator()?.getPlayerPath(playerType) ?? null;
    }
    
    /**
     * <移動>
     */
    public getPlayerDestinationByPos(
        playerView: number,
        startPos: [number, number],
        steps: number
    ): [number, number] | null {
        return this._factoryManager.getViewTransformer()?.getDestinationByPos(
            playerView,
            startPos,
            steps
        ) ?? null;
    }
    
    /**
     * <移動>
     */
    public getPlayerDestinationByIndex(
        playerView: number,
        startIndex: number,
        steps: number
    ): [number, number] | null {
        return this._factoryManager.getViewTransformer()?.getDestinationByStartIndex(
            playerView,
            startIndex,
            steps
        ) ?? null;
    }
    
    /**
     * <移動>
     * 獲取從起點到終點的完整路徑段（基於起點位置）
     * 
     * @param playerView 當前玩家視角 (0:Blue, 1:Red, 2:Green, 3:Yellow)
     * @param startPos 起點位置 [row, col]（玩家視角下的座標）
     * @param steps 移動步數
     * @returns 路徑段陣列（包含起點和終點，均為玩家視角下的座標），如果超出路徑返回 null
     */
    public getPlayerPathSegment(
        playerView: number,
        startPos: [number, number],
        steps: number
    ): number[][] | null {
        return this._factoryManager.getViewTransformer()?.getPathSegmentByPos(
            playerView,
            startPos,
            steps
        ) ?? null;
    }

    /**
     * <移動>
     * 獲取從起點到終點的完整路徑段（基於起點索引）
     * 
     * @param playerView 當前玩家視角 (0:Blue, 1:Red, 2:Green, 3:Yellow)
     * @param startIndex 起點索引（在該玩家路徑陣列中的索引位置）
     * @param steps 移動步數
     * @returns 路徑段陣列（包含起點和終點，均為玩家視角下的座標），如果超出路徑返回 null
     */
    public getPlayerPathSegmentByIndex(
        playerView: number,
        startIndex: number,
        steps: number
    ): number[][] | null {
        return this._factoryManager.getViewTransformer()?.getPathSegmentByStartIndex(
            playerView,
            startIndex,
            steps
        ) ?? null;
    }

    /**
     * <移動>
     * 計算其他玩家從指定索引移動後的路徑段（返回當前玩家視角下的座標）
     * 
     * @param playerView 當前玩家視角 (0:Blue, 1:Red, 2:Green, 3:Yellow)
     * @param otherPlayer 在當前玩家視角下的其他玩家相對位置 (0:左下, 1:左上, 2:右上, 3:右下)
     * @param startIndex 其他玩家在**基本盤路徑**上的起點索引
     * @param steps 移動步數
     * @returns 路徑段陣列（包含起點和終點，均為當前玩家視角下的座標），如果超出路徑返回 null
     */
    public getOtherPlayerDestToGlobal(
        playerView: number,
        otherPlayer: number,
        startIndex: number,
        steps: number
    ): [number, number] | null {
        return this._factoryManager.getViewTransformer()?.getOtherPlayerDestToGlobal( 
            playerView,
            otherPlayer,
            startIndex,
            steps
        ) ?? null;
    }

    /**
     * <移動>
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
        return this._factoryManager.getViewTransformer()?.getOtherPlayerDestToGlobalSegment(
            playerView,
            otherPlayer,
            startIndex,
            steps
        ) ?? null;
    }

    // ========== 基地坑位相關 API ==========

    /**
     * <移動>
     * 根據 Slot ID 獲取指定玩家視角下的基地坑位座標 
     * @param playerView 當下玩家本身的視角
     * @param slotIndex 基地棋子編號
     * @returns 
     */
    public getCurrentPlayerBSToGlobal(playerView: number, slotIndex: number): [number, number] | null {
        return this._factoryManager.getViewTransformer()?.getBaseSlotInView(playerView, slotIndex) ?? null;
    }
    
    /**
     * <移動>
     * <以指定玩家的視角來看>:
     * 透過slotId來取得這個視角下的基地坑位座標
     * e.g:
     * 玩家視角是黃色(3),要取得紅色(1)玩家的slotId=-6的基地坑位座標-5 ~ -8
     * 就會換算旋轉下的座標回傳
     * @param playerType 希望取得的玩家類型 (0:藍, 1:紅, 2:綠, 3:黃)
     * @param slotId 坑位 ID（負數，如 -1, -2, ..., -16）
     * @param playerView 玩家的視角
     * @returns 玩家視角下的基地坑位座標 [row, col]，如果找不到則返回 null
     */
    public getPlayerBSToGlobalByCurrentView(playerType: number,slotId: number,playerView: number ): [number, number] | null {
        return this._factoryManager.getViewTransformer()?.getBaseSlotByCurrentView(playerType,slotId,playerView) ?? null;
    }

    /**
     * <移動>
     * 根據 Slot ID 獲取指定玩家視角下的基地坑位座標（自動從 Slot ID 換算玩家類型）
     * 
     * 此方法會自動從 Slot ID 計算出對應的玩家類型，無需手動傳入 playerType
     * 
     * @param slotId 坑位 ID（負數，如 -1, -2, ..., -16）
     * @param playerView 當前玩家視角 (0:Blue, 1:Red, 2:Green, 3:Yellow)
     * @returns 玩家視角下的基地坑位座標 [row, col]，如果找不到則返回 null
     */
    public getOtherPlayerBSByIdToGlobal(slotId: number, playerView: number): [number, number] | null {
        return this._factoryManager.getViewTransformer()?.getBaseSlotInViewById(slotId, playerView) ?? null;
    }

    /**
     * <移動>
     * 獲取所有玩家的基地坑位在某個視角下的座標
     * (用來取得初始狀態所有玩家基地坑位的座標，或是結束遊戲時顯示所有玩家基地坑位的座標) 
     * @param playerView 當前玩家視角 (0:Blue, 1:Red, 2:Green, 3:Yellow)
     * @returns 所有玩家的基地坑位座標映射（按玩家類型分組），如果找不到則返回 null
     */
    public getAllBSListByCurrentView(playerView: number): Record<number, number[][]> | null {
        return this._factoryManager.getViewTransformer()?.getAllBaseSlotsByCurrentView(playerView) ?? null;
    }

    // ========== Slot ID 查詢 API ==========

    /**
     * 獲取指定玩家的所有 Slot ID
     * 
     * @param playerType 玩家類型 (0:Blue, 1:Red, 2:Green, 3:Yellow)
     * @returns 該玩家的 Slot ID 陣列，如 [-1, -2, -3, -4]
     * 
     * 範例：
     * ```typescript
     * const blueSlots = ludoGameManager.getPlayerSlotIds(0);
     * // 返回 [-1, -2, -3, -4]
     * 
     * const redSlots = ludoGameManager.getPlayerSlotIds(1);
     * // 返回 [-5, -6, -7, -8]
     * ```
     */
    public getPlayerSlotIds(playerType: number): number[] | null {
        return this._factoryManager.getViewTransformer()?.getPlayerSlotIds(playerType) ?? null;
    }

    /**
     * 根據 Slot ID 反查玩家類型和在該玩家陣列中的索引
     * 
     * @param slotId 坑位 ID（負數，如 -1, -2, ..., -16）
     * @returns { playerType: 玩家類型, index: 在該玩家陣列中的索引 }，如果找不到則返回 null
     * 
     * 範例：
     * ```typescript
     * // 查詢 -2 屬於哪個玩家的第幾個坑位
     * const info = ludoGameManager.getSlotInfo(-2);
     * // 返回 { playerType: 0, index: 1 }  (Blue 的第 2 個坑位，索引從 0 開始)
     * 
     * // 查詢 -6 屬於哪個玩家
     * const info2 = ludoGameManager.getSlotInfo(-6);
     * // 返回 { playerType: 1, index: 1 }  (Red 的第 2 個坑位)
     * 
     * // 用於 Server 通信：當玩家點擊某個棋子時
     * const clickedSlotId = -3;
     * const slotInfo = ludoGameManager.getSlotInfo(clickedSlotId);
     * if (slotInfo) {
     *     console.log(`玩家 ${slotInfo.playerType} 的第 ${slotInfo.index + 1} 個棋子被點擊`);
     *     // 發送給 Server: { playerId: slotInfo.playerType, pieceIndex: slotInfo.index }
     * }
     * ```
     */
    public getSlotInfo(slotId: number): { playerType: number, index: number } | null {
        return this._factoryManager.getViewTransformer()?.getSlotInfo(slotId) ?? null;
    }

    /**
     * 將 Slot ID 轉換為玩家類型和陣列索引（元組格式）
     * 
     * @param slotId 坑位 ID（負數，如 -1, -2, ..., -16）
     * @returns [玩家類型, 陣列索引]，如果 slotId 無效則返回 null
     * 
     * 注意：此方法返回元組 [playerType, index]，如果需要對象格式請使用 getSlotInfo()
     * 
     * 範例：
     * ```typescript
     * const result = ludoGameManager.slotIdToIndex(-6);
     * // 返回 [1, 1] - [playerType, index]
     * 
     * if (result) {
     *     const [playerType, index] = result;
     *     console.log(`玩家 ${playerType} 的第 ${index + 1} 個棋子`);
     * }
     * ```
     */
    public slotIdToIndex(slotId: number): [number, number] | null {
        return this._factoryManager.getViewTransformer()?.slotIdToIndex(slotId) ?? null;
    }

    /**
     * 根據玩家類型和陣列索引生成 Slot ID
     * 
     * @param playerType 玩家類型 (0:Blue, 1:Red, 2:Green, 3:Yellow)
     * @param arrayIndex 陣列索引 (0~3)
     * @returns Slot ID（負數）
     * 
     * 範例：
     * ```typescript
     * // Server 返回數據: { playerId: 1, pieceIndex: 1 }
     * const slotId = ludoGameManager.indexToSlotId(1, 1);
     * // 返回 -6
     * 
     * // 用於初始化：為每個玩家的棋子生成 Slot ID
     * for (let playerType = 0; playerType < 4; playerType++) {
     *     for (let index = 0; index < 4; index++) {
     *         const slotId = ludoGameManager.indexToSlotId(playerType, index);
     *         console.log(`玩家 ${playerType} 的第 ${index + 1} 個棋子 Slot ID: ${slotId}`);
     *     }
     * }
     * 
     * // Server 通信場景
     * function onServerPieceMove(data: { playerId: number, pieceIndex: number, steps: number }) {
     *     const slotId = ludoGameManager.indexToSlotId(data.playerId, data.pieceIndex);
     *     const pieceNode = findPieceBySlotId(slotId);
     *     movePiece(pieceNode, data.steps);
     * }
     * ```
     */
    public indexToSlotId(playerType: number, arrayIndex: number): number {
        const transformer = this._factoryManager.getViewTransformer();
        if (!transformer) {
            console.error('[LudoGameManager] ViewTransformer 未初始化');
            return 0;
        }
        return transformer.indexToSlotId(playerType, arrayIndex);
    }
    
    // ========== 通用 API ==========
    
    /**
     * 獲取當前遊戲模式
     */
    public getCurrentGameMode(): LudoGameMode {
        return this._factoryManager.getCurrentGameMode();
    }
    
    /**
     * 獲取工廠管理器的初始化狀態（調試用）
     */
    public getFactoryStatus(): any {
        return this._factoryManager.getInitializationStatus();
    }
    
    /**
     * 獲取房間玩家管理器
     * @returns 房間玩家管理器實例，如果未初始化則返回 null
     */
    public getRoomPlayerManager() {
        return this._factoryManager.getRoomPlayerManager();
    }

    // ========== 地圖管理 API ==========
    
    /**
     * 測試地圖管理中心功能
     * 
     * 演示如何使用 GameMapCenter：
     * 1. 查詢格子數據
     * 2. 設置格子狀態
     * 3. 添加標記
     * 4. 占據者管理
     * 5. 批量操作
     */
    public testMapCenterFeatures(): void {
        const mapCenter = this._factoryManager.getGameMapCenter();
        if (!mapCenter) {
            console.error('[LudoGameManager] 地圖管理中心未初始化');
            return;
        }
        
        console.log('=== 地圖管理中心功能測試 ===');
        
        // 1. 查詢格子數據
        const grid = mapCenter.getGridAt(5, 5);
        if (grid) {
            console.log(`格子 [5,5] 的數據:`, {
                position: grid.position,
                state: grid.state,
                isSpecial: grid.isSpecial
            });
        }
        
        // 2. 設置格子狀態
        mapCenter.setGridState(1, 6, 1); // GridState.START_POINT
        console.log(`已將 [1,6] 設置為起點狀態`);
        
        // 3. 添加標記
        mapCenter.addMarker(1, 6, {
            type: 1, // MarkerType.START
            icon: null,
            data: { playerType: 0, isStartPoint: true }
        });
        console.log(`已為 [1,6] 添加起點標記`);
        
        // 4. 批量標記起點
        const blueStartPoints: [number, number][] = [[1, 6]];
        mapCenter.markStartPoints(blueStartPoints);
        console.log(`已批量標記藍色起點`);
        
        // 5. 檢查格子狀態
        const isEmpty = mapCenter.isGridEmpty(5, 5);
        const isOccupied = mapCenter.isGridOccupied(1, 6);
        console.log(`[5,5] 是否為空: ${isEmpty}`);
        console.log(`[1,6] 是否被占據: ${isOccupied}`);
        
        // 6. 獲取格子節點位置（用於繪製）
        const pos = mapCenter.getPositionAt(1, 6);
        if (pos) {
            console.log(`[1,6] 的世界坐標:`, pos);
            this.testDraw(pos);
        }
        
        console.log('=== 測試完成 ===');
    }
    
    /**
     * 初始化遊戲地圖標記
     * 
     * 標記所有特殊格子：
     * - 起點（4個玩家各1個）
     * - 安全區（可選）
     * - 終點（中心區域）
     */
    public initializeGameMapMarkers(): void {
        const mapCenter = this._factoryManager.getGameMapCenter();
        if (!mapCenter) {
            console.error('[LudoGameManager] 地圖管理中心未初始化');
            return;
        }
        
        // 定義 4 個玩家的起點坐標（基於標準 15x15 Ludo 棋盤）
        const startPoints: [number, number][] = [
            [1, 6],   // Blue 起點
            [6, 1],   // Red 起點（需確認實際坐標）
            [13, 8],  // Green 起點（需確認實際坐標）
            [8, 13]   // Yellow 起點（需確認實際坐標）
        ];
        
        // 標記所有起點
        for (const coord of startPoints) {
            mapCenter.setGridState(coord[0], coord[1], 1); // GridState.START_POINT
        }
        
        mapCenter.markStartPoints(startPoints);
        
        console.log('[LudoGameManager] 遊戲地圖標記初始化完成');
    }
    
    /**
     * 獲取地圖管理中心（供外部使用）
     */
    public getMapCenter() {
        return this._factoryManager.getGameMapCenter();
    }
    
    /**
     * 獲取地圖裝飾器（供外部使用）
     */
    public getMapDecorator() {
        return this._factoryManager.getMapDecorator();
    }
    
    /**
     * 測試地圖裝飾功能
     * 
     * 演示如何使用 GameMapDecorator：
     * 1. 獲取裝飾器
     * 2. 查看已應用的裝飾
     * 3. 動態添加裝飾
     */
    public testMapDecorator(): void {
        const decorator = this.getMapDecorator();
        if (!decorator) {
            console.error('[LudoGameManager] 地圖裝飾器未初始化');
            return;
        }
        
        const mapCenter = this.getMapCenter();
        if (!mapCenter) {
            console.error('[LudoGameManager] 地圖管理中心未初始化');
            return;
        }
        
        console.log('=== 地圖裝飾功能測試 ===');
        
        // 查看起點格子
        console.log('檢查起點格子 [1,6]:');
        const startGrid = mapCenter.getGridAt(1, 6);
        if (startGrid) {
            console.log('  狀態:', startGrid.state);
            console.log('  是否為特殊格子:', startGrid.isSpecial);
            console.log('  標記數量:', startGrid.markers.length);
        }
        
        // 獲取所有起點
        const startPoints = mapCenter.getGridsByState(4); // GridState.START_POINT
        console.log(`已標記的起點數量: ${startPoints.length}`);
        startPoints.forEach(([r, c]) => {
            console.log(`  起點坐標: [${r}, ${c}]`);
        });
        
        console.log('=== 測試完成 ===');
    }
    
    /**
     * 手動添加地圖裝飾
     * 
     * 範例：在指定位置添加箭頭、星號或禁止符號
     */
    public addCustomDecorations(): void {
        const decorator = this.getMapDecorator();
        if (!decorator) {
            console.error('[LudoGameManager] 地圖裝飾器未初始化');
            return;
        }
        
        // 範例：添加一些測試裝飾
        // 注意：這些裝飾會疊加在配置中的裝飾之上
        
        console.log('[LudoGameManager] 添加自定義裝飾（開發測試用）');
        
        // 可以在這裡調用 decorator 的方法來添加動態裝飾
        // 例如：根據遊戲進度動態添加特效標記
    }

    
}


