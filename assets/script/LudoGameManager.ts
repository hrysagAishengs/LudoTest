import { _decorator, Color, color, Component, Graphics, instantiate, Node, Prefab, UITransform, Vec3 } from 'cc';
import { LudoGameMode } from './gameDef/GameDef';
import { GameFactoryManager } from './gameMode/GameFactoryManager';
import { IPlayerIdentity } from './gamePlayer/def/PlayerDataDef';
import { AniSysManager } from './aniPresentSys/AniSysManager';
import { IPawnInfo } from './gamePlayer/def/PawnDef';
import { Pawn } from './gamePlayer/Pawn';
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
    
    @property({type:Prefab,displayName:"測試用pawn",tooltip:"用於測試的Pawn組件",visible:true})
    private _testPawn: Prefab = null;
    
    @property({type:AniSysManager,displayName:"動畫系統管理器",tooltip:"負責管理動畫系統的組件",visible:true})
    private _aniSysManager: AniSysManager = null!;
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
     * 測試方法：設置房間並指定顏色排列索引
     * 用於重現特定的基本盤狀態來調試問題
     * 
     * @param playerCount - 玩家數量 (2/3/4)
     * @param colorCombinationIndex - 顏色排列索引 (0=0°, 1=90°, 2=180°, 3=270°)
     * 
     * 顏色排列對應：
     * - 0: [Blue, Red, Green, Yellow]   (0° 旋轉)
     * - 1: [Yellow, Blue, Red, Green]   (90° 旋轉)
     * - 2: [Green, Yellow, Blue, Red]   (180° 旋轉)
     * - 3: [Red, Green, Yellow, Blue]   (270° 旋轉)
     * 
     * 使用範例：
     * ```typescript
     * // 重現 180° 旋轉的基本盤狀態
     * ludoGameManager.setupRoomWithColorIndex(4, 2);
     * // 結果：座位0=Green, 座位1=Yellow, 座位2=Blue, 座位3=Red
     * ```
     */
    public setupRoomWithColorIndex(playerCount: number, colorCombinationIndex: number): void {
        this._factoryManager.setupRoomWithColorIndex(playerCount, colorCombinationIndex);
        console.log(`[LudoGameManager] 【測試模式】房間設置完成：${playerCount} 人局，顏色索引=${colorCombinationIndex}`);
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
        
       
        
       
        // ========== 原有测试代码（已注释） ==========
        //this._comprehensiveAPIValidation();
        this._testRotation();
    }

   

   


    private testDraw(pos:Vec3, color?:Color):void{
        if (!color) {
            color = new Color(0, 0, 0, 255);
        }
        let testNode:Node=new Node();
        let uitransform=testNode.addComponent(UITransform);
        uitransform.setContentSize(48,48);
        let graphic:Graphics=testNode.addComponent(Graphics);
        graphic.fillColor=color;
        graphic.rect(-24,-24,48,48);
        graphic.fill();
        this._testNode.addChild(testNode);
        testNode.setPosition(pos);
    }

    private async _testRotation(): Promise<void> {
        // ========== 先測試 getPlayerDestinationByIndex API ==========
        //this._testGetPlayerDestinationByIndexAPI();
        
        // ========== 然後繼續原有測試 ==========
        //this._factoryManager.testRotate(1);
        const roomMaxPlayerCount = 4;
        
        this.setupRoomWithColorIndex(roomMaxPlayerCount, 3);
     
        // 【調試】輸出座位和顏色的匹配結果
        const roomManager = this.getRoomPlayerManager();
        const colorNames = ['Blue', 'Red', 'Green', 'Yellow'];
        if (roomManager) {
            console.log('=== 座位颜色匹配 ===');
            for (let i = 0; i < roomMaxPlayerCount; i++) {
                const color = roomManager.getSeatColor(i);
                console.log(`  座位${i} = ${colorNames[color]}(${color})`);
            }
        }
        
        const playerType = 2;
        
        
        // 【調試】輸出該玩家的顏色
        if (roomManager) {
            const playerColor = roomManager.getSeatColor(playerType);
            console.log(`本機玩家座位${playerType}的顏色: ${colorNames[playerColor]}(${playerColor})`);
        }
        
        //return;
        this.setupLocalPlayerView(playerType);
        const playerInfo:IPlayerIdentity={
            uid: '',
            nickname: 'testPlayer',//-玩家暱稱
            avatarSpriteFrame:null,//-玩家頭像圖片
        }
        this._factoryManager.addPlayer(playerInfo,playerType);

        await this.createRoomPawns();

        // 測試1: 獲取玩家起點並繪製
        //const playerDes=this.getPlayerDestinationByIndex(playerType, 0, 0);
        const playerDes=this.getPathCoordInViewByStartIndex(playerType, 0, 10);
        const drawPos=this.getCellPosition(playerDes[0],playerDes[1]);
        console.log('起點座標 ownerPlayerDes:', playerDes);
        this.testDraw(drawPos, color(0,0,0,255));

        // 測試5: 測試 getOtherPlayerDestToGlobal（其他玩家的路徑）
        console.log('\n=== 測試 getOtherPlayerDestToGlobal ===');
        // otherPlayer=1 表示左上角的玩家（相對於當前視角）
        const path_testOtherPlayerChairId=3;
        const otherPlayerDes = this.getPathCoordInViewByStartIndex(path_testOtherPlayerChairId, 0, 1);
        if (otherPlayerDes) {
            const drawOtherPos = this.getCellPosition(otherPlayerDes[0], otherPlayerDes[1]);
            console.log(`其他玩家(左上角)的起點座標: [${otherPlayerDes[0]}, ${otherPlayerDes[1]}]`);
            if (drawOtherPos) {
                this.testDraw(drawOtherPos, color(0,0,0,125));  // 黑色半透明標記
            }
        }

        //--test--
        const testttt=this._factoryManager.getViewTransformer().getSeatBaseSlotInView(playerType, 0);
        
        // 測試2: 使用新的座位感知方法獲取第1個坑位
        const slotIndex=3;
        const slotData = this.getPlayerBaseBySlotIndex(playerType, slotIndex);  // 座位playerType的第1個坑位
        if (slotData) {
            const slotPos = this.getBaseSlotPosition(slotData[0], slotData[1]);
            const slotId=this.getPlayerSlotIdBySlotIndex(playerType, slotIndex);
            const slotList=this.getPlayerBSIdList(playerType);
            const allSlotList=this.getAllSlotIds();
            
            console.log('playerID', playerType, '坑位ID:', slotId, '對應的基本盤座標:', slotData,'坑為列表',slotList,'allSlotList',allSlotList);
           
            this.testDraw(slotPos, color(0,0,0,128));
        }

        //--玩家視角下其他的玩家坑位測試
        //--bug--如果玩家視角是playerType=3,但是這個API適用於<玩家視角下的相對座位>
        const otherPlayerIndex = 3;  // 左上角玩家(這裡是用chairId)
        const otherSlotData = this.getPlayerBaseBySlotIndex(otherPlayerIndex, slotIndex);
        if (otherSlotData) {
            const otherSlotPos = this.getBaseSlotPosition(otherSlotData[0], otherSlotData[1]);
            const otherSlotId=this.getPlayerSlotIdBySlotIndex(otherPlayerIndex, slotIndex);
            const otherSlotList=this.getPlayerBSIdList(otherPlayerIndex);
            console.log('otherPlayerID', otherPlayerIndex, 'otherSlotId:', otherSlotId, '對應的基本盤座標:', slotData,'坑為列表',otherSlotList);
            this.testDraw(otherSlotPos, color(255,0,0,128));  // 紅色半透明標記
        }
        
        // 測試3: 批量獲取所有坑位
        /*
        console.log(`\n座位${playerType}的所有坑位座標:`);
        const allSlots = this.getSeatAllBaseSlotsInView(playerType);
        if (allSlots) {
            allSlots.forEach((slot, index) => {
                console.log(`  坑位${index + 1}: [${slot[0]}, ${slot[1]}]`);
            });
        }
        
        // 測試4: 反向查詢（驗證第一個坑位）
        if (slotData) {
            const reverseInfo = this.getSlotInfoByCoord(slotData[0], slotData[1], playerType);
            if (reverseInfo) {
                const colorNames = ['Blue', 'Red', 'Green', 'Yellow'];
                console.log(`\n反向查詢 [${slotData[0]}, ${slotData[1]}]:`);
                console.log(`  座位: ${reverseInfo.seatIndex}`);
                console.log(`  坑位: 第${reverseInfo.slotOffset + 1}個`);
                console.log(`  顏色: ${colorNames[reverseInfo.playerColor]}`);
            }
        }
        
        
        
        // 測試其他玩家移動1步
        const otherPlayerMove1 = this.getPlayerDestinationByIndexInView(1, 0, 1);
        if (otherPlayerMove1) {
            console.log(`其他玩家(左上角)移動1步後的座標: [${otherPlayerMove1[0]}, ${otherPlayerMove1[1]}]`);
        }*/
        
    }

   

    

   

   


    

    //---testRotationRoom-
    private _testGridMap(): void {
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
    }

    // ========== AniSys API ==========
    public async createRoomPawns(): Promise<void> {
        
        const roomManager = this.getRoomPlayerManager();
        if (!roomManager) return;

        const players = roomManager.getAllPlayers();
        
        for (const player of players) {
            
            const seatIndex = player.identity.seatIndex;
            if (seatIndex === undefined) continue;

            const baseList=this.getPlayerBaseList(seatIndex);
            //getPlayerBSIdList
            const slotIdList=this.getPlayerSlotIdList(seatIndex);
            const len=baseList? baseList.length:0;
            for(let i=0;i<len;i++){
                
                const wpos=this._factoryManager.getBoardGenerator()?.getBaseSlotWorldPosition(baseList[i][0], baseList[i][1]);
                const slotId=slotIdList? slotIdList[i]:undefined;
                const pawnInfo: IPawnInfo = {
                    pathDataIndex: -1,
                    pathDataCoord: null,
                    localViewIndex: player.identity.localViewIndex,
                    localViewCoord: [baseList[i][0], baseList[i][1]],
                    slotId: slotId,
                    baseSlotIndex: i,
                    isInBase: true,
                    isInHome: true,
                    isMoving: false
                };

                const node = instantiate(this._testPawn);
                const pawn = node.getComponent(Pawn);
                pawn.init(pawnInfo, player.identity.playerColor, i);
                roomManager.addPawn(player.identity.seatIndex, i, pawn);
                await this._aniSysManager.showPawn(pawn, wpos);
            }
        }
    }    
    /**
     * 獲取動畫系統管理器
     * @returns 動畫系統管理器，如果未初始化則返回 null
     */
    public getAniSysManager(): AniSysManager | null {
        return this._aniSysManager;
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
     * 依照真實座位與路徑 index 取得目前畫面上的目的座標。
     *
     * @param chairId 真實座位 / 玩家 index。
     * @param startIndex 棋子目前所在的路徑 index。
     * @param steps 要前進的步數。
     * @returns 目前玩家視角下的棋盤座標 [row, col]，若路徑不存在或超出範圍則回傳 null。
     */
    public getPathCoordInViewByStartIndex(
        chairId: number,
        startIndex: number,
        steps: number
    ): [number, number] | null {
        return this._factoryManager.getViewTransformer()?.getPathCoordInViewByStartIndex(
            chairId,
            startIndex,
            steps
        ) ?? null;
    }

    /**
     * 依照真實座位與路徑 index 取得目前畫面上的移動路徑片段。
     *
     * @param chairId 真實座位 / 玩家 index。
     * @param startIndex 棋子目前所在的路徑 index。
     * @param steps 要前進的步數。
     * @returns 目前玩家視角下的路徑座標陣列，包含起點與終點；若路徑不存在或超出範圍則回傳 null。
     */
    public getPathSegmentInViewByStartIndex(chairId: number, startIndex: number, steps: number): number[][] | null {
        return this._factoryManager.getViewTransformer()?.getPathSegmentInViewByStartIndex(
            chairId,
            startIndex,
            steps
        ) ?? null;
    }

    /**
     * 依照真實座位與目前畫面上的起始座標取得目的座標。
     *
     * 這個 API 會先用 pos 反查該玩家目前視角路徑中的 index，再依照 steps 取得目的座標。
     *
     * @param chairId 真實座位 / 玩家 index。
     * @param pos 目前玩家視角下的起始棋盤座標 [row, col]。
     * @param steps 要前進的步數。
     * @returns 目前玩家視角下的目的座標 [row, col]，若座標不在路徑上或超出範圍則回傳 null。
     */
   public getPathCoordInViewByPos(chairId: number, pos: [number, number], steps: number): [number, number] | null{
        return this._factoryManager.getViewTransformer()?.getPathCoordInViewByPos(
            chairId,
            pos,
            steps
        ) ?? null;
   }


   /**
    * 依照真實座位與目前畫面上的起始座標取得移動路徑片段。
    *
    * 這個 API 會先用 pos 反查該玩家目前視角路徑中的 index，再依照 steps 取得路徑片段。
    *
    * @param chairId 真實座位 / 玩家 index。
    * @param pos 目前玩家視角下的起始棋盤座標 [row, col]。
    * @param steps 要前進的步數。
    * @returns 目前玩家視角下的路徑座標陣列，包含起點與終點；若座標不在路徑上或超出範圍則回傳 null。
    */
   public getPathSegmentInViewByPos(chairId: number, pos: [number, number], steps: number): number[][] | null {
        return this._factoryManager.getViewTransformer()?.getPathSegmentInViewByPos(
            chairId,
            pos,
            steps
        ) ?? null;
   }



    // ========== 基地坑位相關 API ==========

     /**
     * 根據玩家座位索引和坑位索引取得指定<玩家視角>下的基地坑位座標
     * 基本盤未旋轉的座標參照
     * @param chairIndex 玩家座位索引
     * @param slotIndex 坑位索引
     * @returns 指定玩家視角下的基地坑位座標 [row, col]，如果找不到返回 null
     */
    public getPlayerBaseBySlotIndex(chairIndex:number, slotIndex:number):[number,number] | null{
        return this._factoryManager.getViewTransformer()?.getPlayerBaseBySlotIndex(chairIndex, slotIndex) ?? null;
    }

    /**
     * 根據玩家座位索引和坑位索引取得指定<玩家視角>下的基地坑位 slotId
     * @param chairIndex 玩家座位索引
     * @param slotIndex 坑位索引
     * @returns 指定玩家視角下的基地坑位 ID，如果找不到返回 null
     */
    public getPlayerSlotIdBySlotIndex(chairIndex:number, slotIndex:number):number | null{
        return this._factoryManager.getViewTransformer()?.getPlayerSlotIdBySlotIndex(chairIndex, slotIndex) ?? null;
    }

    
    /**
     * 根據玩家座位索引和坑位 ID 取得指定<玩家視角>下的基地坑位座標
     * @param chairIndex 要取得的玩家座位索引
     * @param slotId 坑位 ID
     * @returns 指定玩家視角下的基地坑位座標 [row, col]，如果找不到返回 null
     */
    public getPlayerBaseBySlotId(chairIndex:number, slotId:number):[number,number] | null {
        return this._factoryManager.getViewTransformer()?.getPlayerBaseBySlotId(chairIndex, slotId) ?? null;
    }
    
    
    /**
     * 取得玩家視角下的基地坑位 ID 列表
     * @param chairIndex 座位索引
     * @returns 指定玩家視角下的基地坑位 ID 列表，如果找不到返回 null
     */
    public getPlayerSlotIdList(chairIndex:number):number[] | null {
        return this._factoryManager.getViewTransformer()?.getPlayerSlotIdList(chairIndex) ?? null;
    }
    
    /**
     * 取得玩家視角下的基地坑位座標列表
     * @param chairIndex 座位索引
     * @returns 指定玩家視角下的基地坑位座標列表，如果找不到返回 null
     */
    public getPlayerBaseList(chairIndex:number):[number,number][] | null {
        return this._factoryManager.getViewTransformer()?.getPlayerBaseList(chairIndex) ?? null;
    }

  

    // ========== Slot ID 查詢 API ==========
      /**
     * 取得玩家本身的基地坑位 ID 列表（玩家視角下）
     * @param playerView 玩家視角
     */
    public getPlayerBSIdList(playerView:number):number[] | null {
        return this._factoryManager.getViewTransformer()?.getPlayerBSIdList(playerView) ?? null;
    }
   
    public getAllSlotIds(): number[][] | null {
        return this._factoryManager.getViewTransformer()?.getAllSlotIds() ?? null;
    }
   
  
   

   
      /**
     * 將 Slot ID 轉換為玩家類型和陣列索引(為轉換座位前)
     * 
     * 轉換規則：
     * -(playerType=0): -1~-4 → 陣列索引 0~3
     * -(playerType=1): -5~-8 → 陣列索引 0~3
     * -(playerType=2): -9~-12 → 陣列索引 0~3
     * - (playerType=3): -13~-16 → 陣列索引 0~3
     * 
     * @param slotId 坑位 ID（負數，如 -1, -2, ..., -16）
     * @returns 包含 playerIndex（玩家索引）和 slotIndex（在該玩家陣列中的索引）的物件，如果 slotId 無效則返回 null
     */
    public slotIdToIndex(slotId: number): { playerIndex: number, slotIndex: number } | null {
        return this._factoryManager.getViewTransformer()?.slotIdToIndex(slotId) ?? null;
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


