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
    private _originalPathMap: Record<number, number[][]> | null = null;  // 存儲原始路徑（未重映射）
    //private _originalPathMapOld: Record<number, number[][]> | null = null;  //  存儲舊的原始路徑（未重映射）
    private _baseMap: Record<number, number[][]> | null = null;
    private _originalBaseMap: Record<number, number[][]> | null = null;  // 🆕 存儲原始基地（未重映射）
    private _slotIdMap: Record<number, number[]> | null = null;  // 🆕 存儲每個玩家的 SlotID 陣列
    
    // 基地坑位 Slot ID 配置
    private _baseSlotIdOffset: number = -1;  // 坑位 ID 起始值（預設 -1）
    private _slotsPerPlayer: number = 4;      // 每個玩家的坑位數量（預設 4）
    
    // 雙重旋轉系統追蹤
    private _baseColorRotation: number = 0;   // 基本盤顏色旋轉索引（第一次旋轉）
    private _totalRotationSteps: number = 0;  // 當前實際的總旋轉次數（0-3，用於 setupLocalPlayerView）

    private _currentPlayerView:number=-1;// 當前玩家座位（座位索引，0-3），由 setupLocalPlayerView 设置，用于路径转换方法中正确处理旋转
    /**
     * 設置路徑內容
     * @param pathMap 所有玩家的路徑映射
     */
    public setPathContent(pathMap: Record<number, number[][]>): void {
        this._pathMap = pathMap;
       
        // 【调试】输出设置后的路径数据
        console.log('[BasicViewTransformer.setPathContent] 路径数据已更新：',this._pathMap);
        
    }

    /**
     *  設置原始路徑內容（未重映射的標準路徑）
     * @param originalPathMap 原始路徑映射 (0:Blue, 1:Red, 2:Green, 3:Yellow)
     */
    public setOriginalPathContent(originalPathMap: Record<number, number[][]>): void {
        this._originalPathMap = originalPathMap;
        console.log('[BasicViewTransformer.setOriginalPathContent] 原始路径数据已设置');
    }

    /*
    public setOriginalPathContentOld(originalPathMap: Record<number, number[][]>): void {
        this._originalPathMapOld = originalPathMap;
        console.log('[BasicViewTransformer.setOriginalPathContentOld] 原始路径数据已设置');
    }*/

    /**
     *  設置原始基地內容（未重映射的標準基地）
     * @param originalBaseMap 原始基地映射 (0:Blue, 1:Red, 2:Green, 3:Yellow)
     */
    public setOriginalBaseContent(originalBaseMap: Record<number, number[][]>): void {
        this._originalBaseMap = originalBaseMap;
        console.log('[BasicViewTransformer.setOriginalBaseContent] 原始基地数据已设置');
    }

    /**
     * 設置基地棋子座標內容
     * @param baseMap 所有玩家的基地座標映射
     */
    public setBaseContent(baseMap: Record<number, number[][]>): void {
        this._baseMap = baseMap;
    }

    /**
     * 設置基地坑位 Slot ID 配置
     * @param offset 坑位 ID 起始值（預設 -1）
     * @param slotsPerPlayer 每個玩家的坑位數量（預設 4）
     */
    public setBaseSlotConfig(offset: number, slotsPerPlayer: number): void {
        this._baseSlotIdOffset = offset;
        this._slotsPerPlayer = slotsPerPlayer;
    }

    /**
     * 設置 Slot ID 映射表
     * @param slotIdMap 所有玩家的 Slot ID 映射
     */
    public setSlotIdMap(slotIdMap: Record<number, number[]>): void {
        this._slotIdMap = slotIdMap;
    }

    /**
     *  設置基本盤顏色旋轉索引
     * 此方法由 GameFactoryManager 在 setupRoomWithColorIndex 時調用
     * 
     * @param colorRotation 基本盤顏色旋轉索引 (0-3)
     */
    public setBaseColorRotation(colorRotation: number): void {
        this._baseColorRotation = colorRotation % 4;
        console.log(`[BasicViewTransformer] setBaseColorRotation 被调用，设置 _baseColorRotation = ${this._baseColorRotation}`);
    }

    /**
     * 🆕 設置總旋轉次數（用於雙重旋轉系統）
     * 此方法由 GameFactoryManager 在 setupLocalPlayerView 時調用，
     * 通知 ViewTransformer 當前實際的總旋轉次數
     * 
     * @param steps 總旋轉次數 (0-3)
     * @param playerView 當前玩家視角索引（座位索引，0-3）
     */
    public setTotalRotation(steps: number, playerView: number): void {
        this._totalRotationSteps = steps % 4;
        this._currentPlayerView=playerView;
        console.log(`[BasicViewTransformer] setTotalRotation 被调用，设置 _totalRotationSteps = ${this._totalRotationSteps}`);
    }

    // ========== 座標轉換方法 ==========

    /**
     * 從基本盤座標轉換到指定玩家視角的座標
     * 
     * 🔧 修復說明（2026-05-02）：
     * 原本完全忽略 currentPlayer 參數，導致 getOtherPlayerDestToGlobal 無法正確處理不同 playerView。
     * 現在根據 currentPlayer 參數動態計算旋轉次數：rotations = (_baseColorRotation + currentPlayer) % 4
     * 
     * @param row 基本盤的 row 座標
     * @param col 基本盤的 col 座標
     * @param currentPlayer 當前玩家視角索引（座位索引，0-3）
     * @returns 轉換後的座標 [row, col]
     */
    public baseToPlayerView(row: number, col: number, currentPlayer: number): [number, number] {
        // 🔧 修復：根據 currentPlayer 動態計算旋轉次數
        // rotations = 基本盤顏色旋轉 + 座位索引
        const rotations = (this._baseColorRotation + currentPlayer) % 4;
        console.log(`[baseToPlayerView] 输入: [${row}, ${col}], currentPlayer=${currentPlayer}, baseColorRotation=${this._baseColorRotation}, 旋转次数: ${rotations}`);
        
        let r = row;
        let c = col;

        for (let i = 0; i < rotations; i++) {
            // 逆時針旋轉90度公式: [r, c] → [14-c, r]
            const temp = r;
            r = this.BOARD_MAX_INDEX - c;
            c = temp;
            console.log(`[baseToPlayerView] 第${i+1}次旋转后: [${r}, ${c}]`);
        }

        console.log(`[baseToPlayerView] 输出: [${r}, ${c}]`);
        return [r, c];
    }

     /**
     * @param playerView 真實座位索引
     * @returns 
     */
    public isCurrentPlayerView(playerView:number):boolean {
        //const localViewIndex = this.getLocalViewIndex(playerView);
        //const localCurrentPlayerView = this.getLocalViewIndex(this._currentPlayerView);
        //return localViewIndex === localCurrentPlayerView;
        return playerView === this._currentPlayerView;
    }

    /**
     * 將真實座位索引轉換為當前畫面的視覺位置
     * 回傳 0:左下(自己), 1:左上, 2:右上, 3:右下
     */
    public getLocalViewIndex(queryIndex: number): number {
        return (queryIndex - this._currentPlayerView + 4) % 4;
    }

    /**
     * 根據畫面上的位置，反查他是真實座位的哪一個 index
     */
    public getRealIndexFromView(viewIndex: number): number {
        return (viewIndex + this._currentPlayerView) % 4;
    }

    /**
     * 從玩家視角座標轉換回基本盤座標
     * 幾何旋轉
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

    
    /**
     * 取得路徑索引後轉為畫面座標
     * @param chairId Table idx座位id
     * @param startIndex 起點索引
     * @param steps 移動步數
     * @returns 畫面座標 [row, col]，如果超出路徑返回 null
     */
    public getPathCoordInViewByStartIndex(chairId:number,startIndex: number, steps: number): [number, number] | null {
        
        
        const currentPath = this._originalPathMap?.[chairId];//--這個只是要去取出路徑原始資料來測試
        const endIndex = startIndex + steps;
        const baseEndPos = currentPath[endIndex];//--測試用

        const viewIndex = this.getLocalViewIndex(chairId);
        const visualPath = this._originalPathMap[viewIndex];
        const visualCoord = visualPath[endIndex];

        /*
        const currentPath = this._pathMap?.[chairId];
        const endIndex = startIndex + steps;
        const baseEndPos = currentPath[endIndex];
        //const currentPathIndex = currentPath.findIndex(([r, c]) => r === baseEndPos[0] && c === baseEndPos[1]);

        // 2. 把真實玩家 index 換成畫面位置
        const viewIndex = this.getLocalViewIndex(chairId);

        // 3. 用畫面位置去 originalPathMap-基本盤 找同 index 的座標
        const visualPath = this._originalPathMap[viewIndex];
        const visualCoord = visualPath[endIndex];
        */
        
        return visualCoord ? [visualCoord[0], visualCoord[1]] : null;

    }

    public getPathCoordInViewByPos(chairId:number,startPos: [number, number], steps: number): [number, number] | null {
        
        const startIndex = this.getIndexFormPathMapByPos(chairId,startPos);
        if(startIndex === -1) {
            console.error(`[getPathCoordInViewByPos] 无法找到起点位置在路径中的索引，chairId=${chairId}, startPos=[${startPos[0]}, ${startPos[1]}]`);
            return null;
        }

        return this.getPathCoordInViewByStartIndex(chairId, startIndex, steps);
    }



    private getIndexFormPathMapByPos(chairId:number,startPos: [number, number]):number {
        
        const currentPath = this._originalPathMap?.[chairId];
        if(!currentPath) {
            console.error(`[getIndexFormPathMapByPos] chairId ${chairId} 的路徑數據不存在`);
            return -1;
        }
        const index = currentPath.findIndex(([r, c]) => r === startPos[0] && c === startPos[1]);
        
        return index;
    }

    public getPathSegmentInViewByPos(chairId:number,startPos: [number, number], steps: number): [number, number][] | null {
        
        const startIndex = this.getIndexFormPathMapByPos(chairId,startPos);
        if(startIndex === -1) {
            console.error(`[getPathSegmentInViewByPos] 无法找到起点位置在路径中的索引，chairId=${chairId}, startPos=[${startPos[0]}, ${startPos[1]}]`);
            return null;
        }

        return this.getPathSegmentInViewByStartIndex(chairId, startIndex, steps);
    }

    public getPathSegmentInViewByStartIndex(chairId: number, startIndex: number, steps: number): [number, number][] | null {
        
        const endIndex = startIndex + steps;
        const currentPath = this._originalPathMap?.[chairId];//--這個只是要去取出路徑原始資料來測試
        const baseEndPos = currentPath[endIndex];//--測試用
        const viewIndex = this.getLocalViewIndex(chairId);
        const visualPath = this._originalPathMap[viewIndex];
        const visualSegment: [number, number][] = [];
        for(let i=startIndex;i<=endIndex;i++){
            const visualCoord = visualPath[i];
            if(visualCoord) {
                visualSegment.push([visualCoord[0], visualCoord[1]]);
            }
        }
        return visualSegment.length > 0 ? visualSegment : null;
    }

    
    //======manager需要的在封裝接口==============================
    

    /**
     * 
     * @param chairId 玩家座位索引
     * @param startIndex 起點索引（在該玩家路徑陣列中的索引位置）
     * @param steps 移動步數
     * @returns 目標座標，如果超出路徑返回 null
     */
    public getPlayerMoveDestForm(chairId:number, startIndex:number, steps:number):[number,number] | null {
        
        return this.getPathCoordInViewByStartIndex(chairId, startIndex, steps);
        //const isPlayerView = this.isCurrentPlayerView(chairId);
        
        /*
        if (isPlayerView) {
            return this.getDestinationByStartIndex(chairId, startIndex, steps);
        }else{
            const otherPlayerIndex = this.getLocalViewIndex(chairId);
            return this.getOtherPlayerDestToGlobal(chairId, otherPlayerIndex, startIndex, steps);
        }*/
    }

    


    //======manager需要的在封裝接口==============================
 
    //=====new slot轉換方法==================

    /**
     * 根據 playIndex 和 seatIndex 取得對應的 slot 列表
     * @param playIndex 遊戲開始索引 (0-3)
     * @param seatIndex 座位索引 (0-3)
     * @returns number[][] 對應的座標列表
     */
    private getSlotsByIndices(playIndex: number, seatIndex: number): number[][] {
        // 轉換公式：(座位 + 偏移量) % 總長度
        const targetIndex = (seatIndex + playIndex) % 4;
        return this._baseMap[targetIndex];
    }

    /**
     * 根據 playIndex 和 seatIndex 取得對應的 ID 列表
     * @param playIndex 遊戲開始索引 (0-3)
     * @param seatIndex 座位索引 (0-3)
     * @returns number[] 對應的負數 ID 列表
     */
    private getIdsByIndices(playIndex: number, seatIndex: number): number[] {
        // 轉換公式：(座位 + 偏移量) % 總長度
        const targetIndex = (seatIndex + playIndex) % 4;
        return this._slotIdMap[targetIndex];
    }

    private getSlotListById(slotId:number):number[] | null {
        
        if (!this._slotIdMap) return null;
        // 遍歷 Record 的所有 Value
        for (const key in this._slotIdMap) {
            const list = this._slotIdMap[key];
            if (list.includes(slotId)) {
                return list;
            }
        }

        return null; // 如果找不到則回傳 null
    }

    
   



   

    public getSeatBaseSlotInView(playerView: number, slotIndex: number):[number,number] | null {
        
        const playerOwnerBaseSlots = this.getSlotsByIndices(playerView, 0);
        const slotPosition = playerOwnerBaseSlots[slotIndex];
        const slotId = this.getIdsByIndices(playerView, 0);
        const playerOwner=this.getPlayerBSGlobalByIndex(slotIndex);
        const playerOwnerSlotId=this.getPlayerBSIdByIndex(playerView, slotIndex);
        const seatOwnerSlotId=this.getPlayerBSGlobalById(-5);
        return null;
    }

    //======manager需要的在封裝接口==============================

    /**
     * 根據玩家座位索引和坑位索引取得指定<玩家視角>下的基地坑位座標
     * 基本盤未旋轉的座標參照
     * @param chairIndex 玩家座位索引
     * @param slotIndex 坑位索引
     * @returns 指定玩家視角下的基地坑位座標 [row, col]，如果找不到返回 null
     */
    public getPlayerBaseBySlotIndex(chairIndex:number, slotIndex:number):[number,number] | null {
        
        const isPlayerView = this.isCurrentPlayerView(chairIndex);
        if (isPlayerView) {
            return this.getPlayerBSGlobalByIndex(slotIndex);
        }else {
            //--轉換回玩家視角的座標
            const otherPlayerIndex=this.getLocalViewIndex(chairIndex);
            return this.getOtherPlayerBSGlobalByIndex(otherPlayerIndex, slotIndex);
        }
    }

     /**
     * 根據玩家座位索引和坑位 ID 取得指定<玩家視角>下的基地坑位座標
     * @param chairIndex 要取得的玩家座位索引
     * @param slotIndex 坑位索引
     * @returns 指定玩家視角下的基地坑位座標 [row, col]，如果找不到返回 null
     */
    public getPlayerSlotIdBySlotIndex(chairIndex:number, slotIndex:number):number | null {
        
        const isPlayerView = this.isCurrentPlayerView(chairIndex);
        if (isPlayerView) {
            return this.getPlayerBSIdByIndex(chairIndex, slotIndex);
        }else {
            const otherPlayerIndex = this.getLocalViewIndex(chairIndex);
            return this.getOtherPlayerBSIdByIndex(otherPlayerIndex, slotIndex);
        }
    }

    /**
     * 根據玩家座位索引和坑位 ID 取得指定<玩家視角>下的基地坑位座標
     * @param chairIndex 要取得的玩家座位索引
     * @param slotId 坑位 ID
     * @returns 指定玩家視角下的基地坑位座標 [row, col]，如果找不到返回 null
     */
    public getPlayerBaseBySlotId(chairIndex:number, slotId:number):[number,number] | null {
        
        const isPlayerView = this.isCurrentPlayerView(chairIndex);
        if (isPlayerView) {
            return this.getPlayerBSGlobalById(slotId);
        }else {
            const otherPlayerIndex = this.getLocalViewIndex(chairIndex);
            return this.getOtherPlayerBSGlobalById(otherPlayerIndex, slotId);
        }
    }

    /**
     * 取得玩家視角下的基地坑位 ID 列表
     * @param chairIndex 座位索引
     * @returns 指定玩家視角下的基地坑位 ID 列表，如果找不到返回 null
     */
    public getPlayerSlotIdList(chairIndex:number):number[] | null {
        
        const isPlayerView = this.isCurrentPlayerView(chairIndex);
        if (isPlayerView) {
            return this.getPlayerBSIdList(chairIndex);
        } else {
            const otherPlayerIndex = this.getLocalViewIndex(chairIndex);
            return this.getOtherPlayerBSIdList(otherPlayerIndex);
        }
    }

    /**
     * 取得玩家視角下的基地坑位座標列表
     * @param chairIndex 座位索引
     * @returns 指定玩家視角下的基地坑位座標列表，如果找不到返回 null
     */
    public getPlayerBaseList(chairIndex:number):[number,number][] | null {
        
        const isPlayerView = this.isCurrentPlayerView(chairIndex);
        if (isPlayerView) {
            return this.getPlayerBSGlobalList();
        } else {
            const otherPlayerIndex = this.getLocalViewIndex(chairIndex);
            return this.getOtherPlayerBSGlobalList(otherPlayerIndex);
        }
    }

   //======manager需要的在封裝接口==============================





    //--回傳基本盤未旋轉的座標參照
    public getPlayerBSGlobalByIndex(seatIndex:number):[number,number] | null {
        
        const seatList=this._baseMap?.[0];
        if (seatList && seatList[seatIndex]) {
            const [x, y] = seatList[seatIndex]; // 假設你要拿該座位的第 1 個 slot
            return [x, y];
        }
        return null; // 預防 null 的預設值
    }

    
    public getPlayerBSGlobalById(slotId:number):[number,number] | null {
        
        const seatList=this._baseMap?.[0];
        const currentSlotAry=this.getSlotListById(slotId);
        if (seatList && currentSlotAry) {
            const slotIndex = currentSlotAry.indexOf(slotId);
            if (slotIndex !== -1 && seatList[slotIndex]) {
                const [x, y] = seatList[slotIndex]; 
                return [x, y];
            }
        }

        return null; // 預防 null 的預設值
    }

    
    /**
     * 
     * @param playerView playerIndex(旋轉依據)
     * @param seatIndex 坑位索引(4個坑位的索引0~3)
     * @returns 指定玩家視角下的基地坑位 ID，如果找不到返回 null
     */
    public getPlayerBSIdByIndex(playerView:number,seatIndex:number):number | null {
        
        const slotId = this.getIdsByIndices(playerView, 0);
        if (slotId && slotId[seatIndex]) {
            return slotId[seatIndex];
        }
        return null; // 預防 null 的預設值
    }



    public getPlayerBSGlobalList():[number,number][] | null {
        const seatList=this._baseMap?.[0];
        if (seatList) {
            return seatList as [number, number][];
        }
        return null; // 預防 null 的預設值
    }

    


    //--回傳基本盤未旋轉的座標參照
    public getOtherPlayerBSGlobalByIndex(otherPlayerIndex:number, seatIndex:number):[number,number] | null {
        
        const seatList=this._baseMap?.[otherPlayerIndex];
        if (seatList && seatList[seatIndex]) {
            const [x, y] = seatList[seatIndex]; 
            return [x, y];
        }
        return null; // 預防 null 的預設值
    }

    public getOtherPlayerBSGlobalById(otherPlayerIndex:number, slotId:number):[number,number] | null {
        
        const seatList=this._baseMap?.[otherPlayerIndex];
        const currentSlotAry=this.getSlotListById(slotId);
        if (seatList && currentSlotAry) {
            const slotIndex = currentSlotAry.indexOf(slotId);
            if (slotIndex !== -1 && seatList[slotIndex]) {
                const [x, y] = seatList[slotIndex];
                return [x, y];
            }
        }
        return null; // 預防 null 的預設值
    }

    public getOtherPlayerBSIdByIndex(otherPlayerIndex:number, seatIndex:number):number | null {
        
        const slotId = this.getIdsByIndices(otherPlayerIndex, 0);//--以玩家的視角來取得對應的 slotId 列表
        if (slotId && slotId[seatIndex]) {
            return slotId[seatIndex];
        }
        return null; // 預防 null 的預設值
    }

    public getOtherPlayerBSGlobalList(otherPlayerIndex:number):[number,number][] | null {
        const seatList=this._baseMap?.[otherPlayerIndex];
        if (seatList) {
            return seatList as [number, number][];
        }
        return null; // 預防 null 的預設值
    }

    public getOtherPlayerBSIdList(otherPlayerIndex:number):number[] | null {
        const slotIdList = this.getIdsByIndices(otherPlayerIndex, 0);   
        if (slotIdList) {
            return slotIdList as number[];
        }
        return null; // 預防 null 的預設值
    }


    // ========== Slot ID 查詢方法 ==========
    public getPlayerBSIdList(playerView:number):number[] | null {
        const slotIdList = this.getIdsByIndices(playerView, 0);
        if (slotIdList) {
            return slotIdList as number[];
        }
        return null; // 預防 null 的預設值
    }
    
    
    public getAllSlotIds(): number[][] | null{
        if (!this._slotIdMap) return null;
        const allSlotIds: number[][] = [];
        for (const playerType in this._slotIdMap) {
            allSlotIds.push(this._slotIdMap[playerType]);
        }
        return allSlotIds;
    }
   
      /**
     * 將 Slot ID 轉換為玩家類型和陣列索引(為轉換座位前)
     * 
     * 轉換規則：
     * - 藍色 (playerType=0): -1~-4 → 陣列索引 0~3
     * - 紅色 (playerType=1): -5~-8 → 陣列索引 0~3
     * - 綠色 (playerType=2): -9~-12 → 陣列索引 0~3
     * - 黃色 (playerType=3): -13~-16 → 陣列索引 0~3
     * 
     * @param slotId 坑位 ID（負數，如 -1, -2, ..., -16）
     * @returns 包含 playerIndex（玩家索引）和 slotIndex（在該玩家陣列中的索引）的物件，如果 slotId 無效則返回 null
     */
    public slotIdToIndex(slotId: number): { playerIndex: number, slotIndex: number } | null {
        // 驗證 slotId 範圍
        const maxSlotId = this._baseSlotIdOffset;  // -1
        const minSlotId = this._baseSlotIdOffset - (this._slotsPerPlayer * 4) + 1;  // -16
        
        if (slotId > maxSlotId || slotId < minSlotId) {
            return null;
        }
        
        // 轉換公式
        const zeroBasedId = (-slotId) - 1;  // -1 變成 0, -16 變成 15
        const playerType = Math.floor(zeroBasedId / this._slotsPerPlayer);
        const arrayIndex = zeroBasedId % this._slotsPerPlayer;
        
        return { playerIndex: playerType, slotIndex: arrayIndex };
    }


    /**
     * 根據 Slot ID 反查玩家類型和陣列索引
     * @param slotId 坑位 ID（負數，如 -1, -2, ..., -16）
     * @returns { playerType: 玩家類型, index: 在該玩家陣列中的索引 }，如果找不到則返回 null
     * 
     * 範例：
     * - slotId = -2 → { playerType: 0, index: 1 }  (Blue 的第 2 個坑位)
     * - slotId = -6 → { playerType: 1, index: 1 }  (Red 的第 2 個坑位)
     */
    /*
    public getSlotInfo(slotId: number): { playerType: number, index: number } | null {
        
        const result = this.slotIdToIndex(slotId);
        if (!result) return null;

        const { playerIndex, slotIndex } = result;
        return { playerType: playerIndex, index: slotIndex };
    }*/


    //=========================即將刪除區域==============================================
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
        // 🔧 修復（2026-05-02）：转换路径段中的每个点为视觉坐标
        const visualSegment = baseSegment.map(coord => 
            this.baseToPlayerView(coord[0], coord[1], playerView)
        );
        return visualSegment;
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
     * 示例：黃色玩家(3)視角下，查看左上角玩家(1=藍色)從索引5移動3步的終點
     *      返回在黃色玩家視角下看到的藍色玩家的終點座標
     */
    public getOtherPlayerDestToGlobal(
        playerView: number,
        otherPlayer: number,//--旋轉後的相對位置（0:左下, 1:左上, 2:右上, 3:右下）
        startIndex: number,
        steps: number
    ): [number, number] | null {
        // 🔧 核心修復（2026-05-02）：使用標準視覺路徑，而不是重映射路徑
        // 
        // otherPlayer 代表**固定視覺位置**（相對於視覺原點），不是實際座位
        // 標準視覺布局（固定映射到原始顏色）：
        //   otherPlayer=0 → 原始 Blue(0)  - 視覺左下角
        //   otherPlayer=1 → 原始 Yellow(3) - 視覺左上角
        //   otherPlayer=2 → 原始 Green(2)  - 視覺右上角
        //   otherPlayer=3 → 原始 Red(1)    - 視覺右下角
        
        if (!this._originalPathMap) {
            console.error('[getOtherPlayerDestToGlobal] 原始路徑未設置');
            return null;
        }
        
        // 視覺位置到原始顏色的固定映射
        const VISUAL_TO_ORIGINAL_COLOR = [0, 3, 2, 1];
        const originalColor = VISUAL_TO_ORIGINAL_COLOR[otherPlayer];
        
        // 查詢原始標準路徑（而非重映射路徑）
        const originalPath = this._originalPathMap[originalColor];
        if (!originalPath) return null;

        const endIndex = startIndex + steps;
        if (endIndex < 0 || endIndex >= originalPath.length) return null;

        const baseCoord = originalPath[endIndex];
        
        // 🔧 關鍵修復（2026-05-02 最終版）：直接返回基本盤坐標，不旋轉！
        // 
        // 原因：setupLocalPlayerView 已經旋轉了整個棋盤底圖和 UI
        // 坐標系統（如 getCellPosition）會自動根據旋轉後的棋盤位置返回正確的屏幕位置
        // 
        // 如果這裡再旋轉一次，就會導致雙重旋轉錯誤：
        // - playerView=0: 不旋轉 ✓
        // - playerView=1: 旋轉1次 → 錯誤（棋盤已經旋轉過了）✗
        // 
        // 正確做法：返回基本盤坐標，讓底層坐標系統自動處理
        const testVisualCoord = this.getPathCoordInViewByStartIndex(playerView, startIndex, steps);
        console.log();
        return [baseCoord[0], baseCoord[1]];
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
        // 🔧 核心修復：使用標準視覺路徑
        if (!this._originalPathMap) {
            console.error('[getOtherPlayerDestToGlobalSegment] 原始路徑未設置');
            return null;
        }
        
        // 視覺位置到原始顏色的固定映射
        const VISUAL_TO_ORIGINAL_COLOR = [0, 3, 2, 1];
        const originalColor = VISUAL_TO_ORIGINAL_COLOR[otherPlayer];
        
        // 查詢原始標準路徑
        const originalPath = this._originalPathMap[originalColor];
        if (!originalPath) return null;

        const endIndex = startIndex + steps;
        if (endIndex < 0 || endIndex >= originalPath.length) return null;

        const baseSegment = originalPath.slice(startIndex, endIndex + 1);
        
        // 🔧 關鍵修復（2026-05-02 最終版）：直接返回基本盤坐標，不旋轉！
        // 原因同 getOtherPlayerDestToGlobal：setupLocalPlayerView 已旋轉棋盤
        return baseSegment.map(([r, c]) => [r, c]);
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
        
        // 🔧 修復：查詢自己的路徑不需要旋轉
        return [baseEndPos[0], baseEndPos[1]];
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
        
        // 🔧 修復：查詢自己的路徑不需要旋轉，直接返回基本盤座標
        return baseSegment;
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
        if (!basePath) {
            console.log(`[getDestinationByStartIndex] pathMap[${playerView}] 不存在`);
            return null;
        }

        const endIndex = startIndex + steps;
        if (endIndex < 0 || endIndex >= basePath.length) {
            console.log(`[getDestinationByStartIndex] endIndex=${endIndex} 越界`);
            return null;
        }

        const baseEndPos = basePath[endIndex];
        console.log(`[getDestinationByStartIndex] 基本盘坐标 basePath[${endIndex}] = [${baseEndPos[0]}, ${baseEndPos[1]}]`);
        
        // 🔧 修復（2026-05-02）：转换为视觉坐标后返回
        // 使用 baseToPlayerView 转换，确保与 getOtherPlayerDestToGlobal 的逻辑隔离
        const visualCoord = this.baseToPlayerView(baseEndPos[0], baseEndPos[1], playerView);
        console.log(`[getDestinationByStartIndex] 转换为视觉坐标: [${visualCoord[0]}, ${visualCoord[1]}]`);
        const testVisualCoord = this.getPathCoordInViewByStartIndex(playerView, startIndex, steps);
        return visualCoord;
    }

      /**
     * 從基地坑位基本盤座標轉換到指定玩家視角的座標
     * 專門用於基地坑位的視角轉換（與路徑轉換邏輯不同）
     * 
     * 基地坑位使用區塊平移生成，需要特殊的視角轉換邏輯：
     * 1. 計算坑位在其所屬區塊內的相對位置
     * 2. 應用區塊級旋轉
     * 3. 轉換到目標區塊的絕對座標
     * 
     * 基本盤坐標順序（左上、右上、左下、右下）：
     * - Blue(0):   [3,1], [3,3], [1,1], [1,3]    -> slotId -1~-4
     * - Red(1):    [12,1], [12,3], [10,1], [10,3] -> slotId -5~-8
     * - Green(2):  [12,10], [12,12], [10,10], [10,12] -> slotId -9~-12
     * - Yellow(3): [3,10], [3,12], [1,10], [1,12]  -> slotId -13~-16
     * 
     * 範例：在 Yellow(3) 視角下，Red 的坑位轉換為：
     * - [12,1] -> [12,12], [12,3] -> [10,12], [10,1] -> [12,10], [10,3] -> [10,10]
     * 
     * @param row 基本盤的 row 座標
     * @param col 基本盤的 col 座標
     * @param currentPlayer 當前在左下角的玩家 (0:Blue, 1:Red, 2:Green, 3:Yellow)
     * @returns 轉換後的座標 [row, col]
     */
    public baseSlotToPlayerView(row: number, col: number, currentPlayer: number): [number, number] {
        // 確定該坐標屬於哪個玩家的區塊
        let ownerPlayer = -1;
        const blockSize = 2; // 每個區塊是 3x3，但坐標範圍是 0-2
        const baseMin = 1;   // Blue 區塊左下角 [1,1]
        const blockOffset = 9; // 區塊間距
        
        // 判斷屬於哪個玩家的區塊
        if (row >= baseMin && row <= baseMin + blockSize && col >= baseMin && col <= baseMin + blockSize) {
            ownerPlayer = 0; // Blue
        } else if (row >= baseMin + blockOffset && row <= baseMin + blockOffset + blockSize && col >= baseMin && col <= baseMin + blockSize) {
            ownerPlayer = 1; // Red
        } else if (row >= baseMin + blockOffset && row <= baseMin + blockOffset + blockSize && col >= baseMin + blockOffset && col <= baseMin + blockOffset + blockSize) {
            ownerPlayer = 2; // Green
        } else if (row >= baseMin && row <= baseMin + blockSize && col >= baseMin + blockOffset && col <= baseMin + blockOffset + blockSize) {
            ownerPlayer = 3; // Yellow
        }
        
        if (ownerPlayer === -1) return [row, col]; // 無法識別，返回原座標
        
        // 計算該玩家在基本盤上的區塊基準點
        let blockBaseRow = baseMin;
        let blockBaseCol = baseMin;
        if (ownerPlayer === 1) blockBaseRow += blockOffset; // Red
        if (ownerPlayer === 2) { blockBaseRow += blockOffset; blockBaseCol += blockOffset; } // Green
        if (ownerPlayer === 3) blockBaseCol += blockOffset; // Yellow
        
        // 轉換為相對坐標
        let relRow = row - blockBaseRow;
        let relCol = col - blockBaseCol;
        
        // 計算需要旋轉的次數（逆時針）
        const rotations = (4 - currentPlayer) % 4;
        
        // 應用旋轉（每次順時針 90 度，在相對坐標系統中）
        for (let i = 0; i < rotations; i++) {
            // 順時針 90 度: (r,c) → (blockSize-c, r)
            const temp = relRow;
            relRow = blockSize - relCol;
            relCol = temp;
        }
        
        // 計算目標玩家在視角轉換後的區塊位置
        // ownerPlayer 在基本盤的位置 -> 旋轉後的位置
        // 逆時針旋轉：position - currentPlayer
        const targetPlayer = (ownerPlayer - currentPlayer + 4) % 4;
        
        // 計算目標區塊的基準點
        let targetBlockRow = baseMin;
        let targetBlockCol = baseMin;
        if (targetPlayer === 1) targetBlockRow += blockOffset; // Red position
        if (targetPlayer === 2) { targetBlockRow += blockOffset; targetBlockCol += blockOffset; } // Green position
        if (targetPlayer === 3) targetBlockCol += blockOffset; // Yellow position
        
        // 轉回絕對坐標
        return [targetBlockRow + relRow, targetBlockCol + relCol];
    }
}
