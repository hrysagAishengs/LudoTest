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
    private _pathMap: Record<number, number[][]> | null = null;//--即將刪除20260511
    private _originalPathMap: Record<number, number[][]> | null = null;  // 存儲原始路徑（未重映射）
    private _baseMap: Record<number, number[][]> | null = null;
    private _originalBaseMap: Record<number, number[][]> | null = null;  // 存儲原始基地（未重映射）
    private _slotIdMap: Record<number, number[]> | null = null;  // 存儲每個玩家的 SlotID 陣列
    
    // 基地坑位 Slot ID 配置
    private _baseSlotIdOffset: number = -1;  // 坑位 ID 起始值（預設 -1）
    private _slotsPerPlayer: number = 4;      // 每個玩家的坑位數量（預設 4）
    
    //--new
    private _dataRotationSteps :number=0;//數據旋轉次數（0-3，用於根據玩家視角轉換路徑和基地座標）
    private _currentPlayerView:number=-1;// 當前玩家座位（座位索引，0-3），由 setupLocalPlayerView 设置，用于路径转换方法中正确处理旋转
    //--20260511 NEW 快速查表O(1),舊版查詢方法是 O(n-->_originalPathMap.length)
    private _originalPathCoordIndexMap: Map<string, number> = new Map();
    
    /**
     * 設置路徑內容
     * @deprecated 20260511 此方法將被廢棄，
     * 因為將直接使用原始路徑來進行視角轉換，
     * 而不是在這裡維護一份重映射的路徑數據。
     * @param pathMap 所有玩家的路徑映射
     */
    public setPathContent(pathMap: Record<number, number[][]>): void {
        this._pathMap = pathMap;
        console.log('[BasicViewTransformer.setPathContent] _pathMap已更新：',this._pathMap);
    }

    /**
     *  設置原始路徑內容（未重映射的標準路徑）
     * @param originalPathMap 原始路徑映射 (0:Blue, 1:Red, 2:Green, 3:Yellow)
     */
    public setOriginalPathContent(originalPathMap: Record<number, number[][]>): void {
        this._originalPathMap = originalPathMap;
        this.rebuildOriginalPathCoordIndexMap();
        console.log('[BasicViewTransformer.setOriginalPathContent] _originalPathMap已更新：',this._originalPathMap);
    }


    /**
     *  設置原始基地內容（未重映射的標準基地）
     * @param originalBaseMap 原始基地映射 (0:Blue, 1:Red, 2:Green, 3:Yellow)
     */
    public setOriginalBaseContent(originalBaseMap: Record<number, number[][]>): void {
        this._originalBaseMap = originalBaseMap;
        console.log('[BasicViewTransformer.setOriginalBaseContent] _originalBaseMap已更新：',this._originalBaseMap);
    }

    /**
     * 設置基地棋子座標內容
     * @param baseMap 所有玩家的基地座標映射
     */
    public setBaseContent(baseMap: Record<number, number[][]>): void {
        this._baseMap = baseMap;
        console.log('[BasicViewTransformer.setBaseContent] _baseMap已更新：',this._baseMap);
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
     * 設定目前本機玩家視角。
     * 此方法由 GameFactoryManager 在 setupLocalPlayerView 時呼叫。
     *
     * 目前用途：
     * 1. 記錄本機玩家的真實座位索引，供 getLocalViewIndex / getRealIndexFromView 使用。
     * 2. 設定「基本盤座標轉到目前玩家視角」所需的資料旋轉次數。
     *
     * @param currentPlayerView 本機玩家真實座位索引（0-3）
     */
    public setCurrentPlayerView(playerView: number): void {
        this._dataRotationSteps  = playerView % 4;
        this._currentPlayerView=playerView;
        //this._totalRotationSteps = steps % 4;---old
    }

    // ========== 座標轉換方法 ==========

    /**
     * 從基本盤座標轉換到指定玩家視角的座標
     * 這裡是以<從基本盤轉到玩家視角下的幾何旋轉計算>
     *
     * @param row 基本盤的 row 座標
     * @param col 基本盤的 col 座標
     * @param currentPlayer 當前玩家視角索引（座位索引，0-3）
     * @returns 轉換後的座標 [row, col]
     *
     * 如果 row,col 是「某玩家自己座標系裡的相對座標」，那才需要：
     * dataRotationSteps + queryPlayerSeatIndex
     */
    public baseToPlayerView(row: number, col: number, currentPlayer: number): [number, number] {
        
        //const rotations = (this._baseColorRotation + currentPlayer) % 4;
        const rotations = this._dataRotationSteps; // 直接使用數據旋轉次數，因為它已經在 setCurrentPlayerView 中根據 playerView 設置好了
        const MAX = 14;

        let r = row;
        let c = col;
        console.log(`[baseToPlayerView] 输入基本盘坐标: [${row}, ${col}]，currentPlayer: ${currentPlayer}，计算 rotations: ${rotations}`);
        switch (rotations) {
            case 1: // 順時針 90 度 (旋轉 1 步 )
                return [c, MAX - r];
            case 2: // 順時針 180 度 (旋轉 2 步 )
                return [MAX - r, MAX - c];
            case 3: // 順時針 270 度 (旋轉 3步 )
                return [MAX - c, r];
            default: // 0 度 (原始狀態)
                return [r, c];
        }
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
     * 20260505 NEW: 根據路徑索引直接取得畫面座標
     * @param chairId Table idx座位id
     * @param pathIndex 路徑索引（在該玩家路徑陣列中的索引位置）
     * @returns 畫面座標 [row, col]，如果無法取得返回 null
     */
    public getPathCoordInViewByPathIndex(chairId: number, pathIndex: number): [number, number] | null {
        
        if (!this._originalPathMap) return null;

        const localViewIndex = this.getLocalViewIndex(chairId);
        const visualPath = this._originalPathMap[localViewIndex];

        const coord = visualPath?.[pathIndex];
        return coord ? [coord[0], coord[1]] : null;
    }

    /**
     * 取得路徑索引後轉為畫面座標
     * @param chairId Table idx座位id
     * @param startIndex 起點索引
     * @param steps 移動步數
     * @returns 畫面座標 [row, col]，如果超出路徑返回 null
     */
    public getPathCoordInViewByStartIndex(chairId:number,startIndex: number, steps: number): [number, number] | null {
        
        return this.getPathCoordInViewByPathIndex(chairId, startIndex + steps);
        /*
        const currentPath = this._originalPathMap?.[chairId];//--這個只是要去取出路徑原始資料來測試
        const endIndex = startIndex + steps;
        const baseEndPos = currentPath[endIndex];//--測試用

        const viewIndex = this.getLocalViewIndex(chairId);
        const visualPath = this._originalPathMap[viewIndex];
        const visualCoord = visualPath[endIndex];
        */
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
        
        //return visualCoord ? [visualCoord[0], visualCoord[1]] : null;

    }

    public getPathCoordInViewByPos(chairId:number,startPos: [number, number], steps: number): [number, number] | null {
        
        const startIndex = this.getIndexFormPathMapByPos(chairId,startPos);
        if(startIndex === -1) {
            console.error(`[getPathCoordInViewByPos] 无法找到起点位置在路径中的索引，chairId=${chairId}, startPos=[${startPos[0]}, ${startPos[1]}]`);
            return null;
        }

        return this.getPathCoordInViewByStartIndex(chairId, startIndex, steps);
    }

    private rebuildOriginalPathCoordIndexMap(): void {
        
        this._originalPathCoordIndexMap.clear();

        if (!this._originalPathMap) {
            return;
        }

        for (const chairIdText in this._originalPathMap) {
            const chairId = Number(chairIdText);
            const path = this._originalPathMap[chairId];

            if (!path) {
                continue;
            }

            for (let index = 0; index < path.length; index++) {
                const coord = path[index];
                if (!coord || coord.length < 2) {
                    continue;
                }

                const [r, c] = coord;
                this._originalPathCoordIndexMap.set(this.getPathCoordIndexKey(chairId, r, c), index);
            }
        }
    }

    
    private getPathCoordIndexKey(chairId: number, row: number, col: number): string {
        return `${chairId}:${row}:${col}`;
    }

    /**
     * NEW 20260511: 根據位置查表獲取路徑索引
     * @param chairId 
     * @param startPos 
     * @returns 
     */
    private getIndexFormPathMapByPos(chairId:number,startPos: [number, number]):number {
        
        if (!this._originalPathMap?.[chairId]) {
            console.error(`[getIndexFormPathMapByPos] chairId ${chairId} 的原始路徑數據不存在`);
            return -1;
        }

        return this._originalPathCoordIndexMap.get(
            this.getPathCoordIndexKey(chairId, startPos[0], startPos[1])
        ) ?? -1;
    }
   

    public getPathSegmentInViewByPos(chairId:number,startPos: [number, number], steps: number): [number, number][] | null {
        
        const startIndex = this.getIndexFormPathMapByPos(chairId,startPos);
        if(startIndex === -1) {
            console.error(`[getPathSegmentInViewByPos] 无法找到起点位置在路径中的索引，chairId=${chairId}, startPos=[${startPos[0]}, ${startPos[1]}]`);
            return null;
        }

        return this.getPathSegmentInViewByStartIndex(chairId, startIndex, steps);
    }

    /**
     * 20260505 NEW: 根據起點和終點索引直接取得路徑段的畫面座標列表
     * @param chairId Table idx座位id
     * @param startPathIndex 起點索引（在該玩家路徑陣列中的索引位置）
     * @param endPathIndex 終點索引（在該玩家路徑陣列中的索引位置）
     * @returns 路徑段的畫面座標列表，如果無法取得返回 null
     */
    public getPathSegmentInViewByPathIndex(chairId: number, startPathIndex: number, endPathIndex: number): [number, number][] | null {
        //const endIndex = startIndex + steps;
        //const currentPath = this._originalPathMap?.[chairId];//--這個只是要去取出路徑原始資料來測試
        //const baseEndPos = currentPath[endIndex];//--測試用
        if (!this._originalPathMap) return null;
        const viewIndex = this.getLocalViewIndex(chairId);
        const visualPath = this._originalPathMap[viewIndex];
        if (!visualPath) return null;
        const visualSegment: [number, number][] = [];
        for(let i=startPathIndex;i<=endPathIndex;i++){
            const visualCoord = visualPath[i];
            if(visualCoord) {
                visualSegment.push([visualCoord[0], visualCoord[1]]);
            }
        }
        return visualSegment.length > 0 ? visualSegment : null;
    
    }

    /**
     * 20260505 NEW: 根據起點索引和步數直接取得路徑段的畫面座標列表
     * @param chairId Table idx座位id
     * @param startIndex 起點索引（在該玩家路徑陣列中的索引位置）
     * @param steps 移動步數
     * @returns 路徑段的畫面座標列表，如果無法取得返回 null
     */
    public getPathSegmentInViewByStartIndex(chairId: number, startIndex: number, steps: number): [number, number][] | null {
        
        const endIndex = startIndex + steps;
        return this.getPathSegmentInViewByPathIndex(chairId, startIndex, endIndex);
        /*
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
        */
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

    //=========================即將刪除區域==============================================
     /**
     * @deprecated 20260511 此方法將被廢棄，
     * 因為將用_originalPathCoordIndexMap來直接查表獲取位置索引(0(1)時間複雜度)，
     * 舊方法是查表_originalPathMap (0(length)時間複雜度)
     * 
     * @param chairId 
     * @param startPos 
     * @returns 
     */
    private getIndexFormPathMapByPosOLD(chairId:number,startPos: [number, number]):number {
        
        const currentPath = this._originalPathMap?.[chairId];
        if(!currentPath) {
            console.error(`[getIndexFormPathMapByPos] chairId ${chairId} 的路徑數據不存在`);
            return -1;
        }
        const index = currentPath.findIndex(([r, c]) => r === startPos[0] && c === startPos[1]);
        
        return index;
    }
}
