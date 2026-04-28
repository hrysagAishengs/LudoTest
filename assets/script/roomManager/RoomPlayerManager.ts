import { Node, Prefab, instantiate, Vec3 } from "cc";
import { IPlayerEntity, IPlayerIdentity, IPlayerStatus } from "../gamePlayer/def/PlayerDataDef";
import { PlayerPanel } from "../gamePlayer/PlayerPanel";
import { RoomConfigGroup } from "../factorySys/component/ConfigProperty";
import { ColorSelector, PlayerColor } from "../gamePlayer/ColorSelector";

/**
 * 房間玩家管理器
 * 負責管理房間內所有玩家的數據和 UI 面板的綁定關係
 */
export class RoomPlayerManager {
    
    /** 場面上的 UI 面板組件 (動態生成或手動設置) */
    private _uiPanels: PlayerPanel[] = []; 

    /** 當前房間內活躍的玩家實體 (以 seatIndex 為 Key) */
    private _activePlayers: Map<number, IPlayerEntity> = new Map();
    
    /** 當前房間配置引用（由工廠設置） */
    private _currentRoomConfig: RoomConfigGroup | null = null;
    
    /** 當前視角的玩家索引 (0:Blue, 1:Red, 2:Green, 3:Yellow) */
    private _currentViewPlayerIndex: number = 0;
    
    /** 顏色選擇器（房間初始化時隨機分配顏色） */
    private _colorSelector: ColorSelector = new ColorSelector();
    
    /** 座位到棋盤顏色的映射 (seatIndex → PlayerColor)，房間初始化時隨機分配 */
    private _seatColorMap: Map<number, PlayerColor> = new Map();

    /**
     * 從配置初始化房間面板
     * @param roomConfigs - 房間配置數組
     * @param playerCount - 玩家數量
     */
    public initializeFromConfig(roomConfigs: RoomConfigGroup[], playerCount: number): void {
        // 查找匹配的配置
        const roomConfig = roomConfigs.find(config => config.playerCount === playerCount);
        
        if (!roomConfig) {
            console.error(`RoomPlayerManager: 找不到 ${playerCount} 人的房間配置`);
            return;
        }
        
        // 驗證必要屬性
        if (!roomConfig.playerPanelPrefab) {
            console.error('RoomPlayerManager: playerPanelPrefab 未設置');
            return;
        }
        
        if (!roomConfig.panelContainer) {
            console.error('RoomPlayerManager: panelContainer 未設置');
            return;
        }
        
        if (!roomConfig.chairs || roomConfig.chairs.length === 0) {
            console.error('RoomPlayerManager: chairs 座標列表為空');
            return;
        }
        
        // 保存配置引用
        this._currentRoomConfig = roomConfig;
        
        // 清空舊面板
        this._clearPanels();
        
        // 🎨 隨機分配所有座位的棋盤顏色（Server 給座位 index，客戶端隨機決定使用哪種顏色）
        this._seatColorMap = this._colorSelector.randomAssignColors(playerCount);
        console.log(`[RoomPlayerManager] 座位顏色分配完成：${this._getSeatColorSummary()}`);
        
        // 根據 chairs 動態生成面板
        // 索引對應玩家顏色: 0:Blue, 1:Red, 2:Green, 3:Yellow
        roomConfig.chairs.forEach((chairPos, playerColorIndex) => {
            const panelNode = instantiate(roomConfig.playerPanelPrefab);
            panelNode.name = `PlayerPanel_${this._getColorName(playerColorIndex)}`;
            panelNode.setParent(roomConfig.panelContainer);
            panelNode.setPosition(new Vec3(chairPos.x, chairPos.y, 0));
            
            const panel = panelNode.getComponent(PlayerPanel);
            if (panel) {
                this._uiPanels.push(panel);
            } else {
                console.error(`RoomPlayerManager: 面板 ${playerColorIndex} 缺少 PlayerPanel 組件`);
                panelNode.destroy();
            }
        });
        
        console.log(`RoomPlayerManager: 成功生成 ${this._uiPanels.length} 個玩家面板 (${playerCount}人局)`);
    }
    
    /**
     * 清空舊的面板節點
     * @private
     */
    private _clearPanels(): void {
        this._uiPanels.forEach(panel => {
            if (panel && panel.node) {
                panel.node.destroy();
            }
        });
        this._uiPanels = [];
    }
    
    /**
     * 根據索引獲取顏色名稱
     * @param index - 玩家顏色索引
     * @returns 顏色名稱
     * @private
     */
    private _getColorName(index: number): string {
        const colors = ['Blue', 'Red', 'Green', 'Yellow'];
        return colors[index] || 'Unknown';
    }
    
    /**
     * 獲取當前生成的面板數量
     * @returns 面板數量
     */
    public getPanelCount(): number {
        return this._uiPanels.length;
    }
    
    /**
     * 獲取指定索引的面板
     * @param index - 面板索引
     * @returns PlayerPanel 或 null
     */
    public getPanel(index: number): PlayerPanel | null {
        if (index < 0 || index >= this._uiPanels.length) {
            return null;
        }
        return this._uiPanels[index];
    }
    
    /**
     * 旋轉面板位置以適配當前玩家視角
     * 
     * 當棋盤旋轉時，玩家面板的位置也要相應旋轉
     * 
     * 位置映射規則（基於未旋轉的基本盤配置）：
     * - playerIndex=0 (Blue視角): Blue左下, Red左上, Green右上, Yellow右下
     * - playerIndex=1 (Red視角):  Red左下,  Green左上, Yellow右上, Blue右下
     * - playerIndex=2 (Green視角): Green左下, Yellow左上, Blue右上, Red右下
     * - playerIndex=3 (Yellow視角): Yellow左下, Blue左上, Red右上, Green右下
     * 
     * @param playerIndex - 當前玩家索引 (0:Blue, 1:Red, 2:Green, 3:Yellow)
     */
    public rotatePanelPositions(playerIndex: number): void {
        if (!this._currentRoomConfig || !this._currentRoomConfig.chairs) {
            console.error('RoomPlayerManager: 無法旋轉面板，配置未初始化');
            return;
        }
        
        if (playerIndex < 0 || playerIndex > 3) {
            console.error(`RoomPlayerManager: 無效的 playerIndex: ${playerIndex}`);
            return;
        }
        
        // 保存當前視角
        this._currentViewPlayerIndex = playerIndex;
        
        const chairs = this._currentRoomConfig.chairs;
        
        // 計算每個玩家類型應該顯示在哪個位置
        // 公式: positionIndex = (playerType - playerIndex + 4) % 4
        this._uiPanels.forEach((panel, panelIndex) => {
            // panelIndex 就是玩家類型 (0:Blue, 1:Red, 2:Green, 3:Yellow)
            const targetPositionIndex = (panelIndex - playerIndex + 4) % 4;
            
            // 獲取目標位置的座標
            if (targetPositionIndex < chairs.length) {
                const targetChair = chairs[targetPositionIndex];
                panel.node.setPosition(new Vec3(targetChair.x, targetChair.y, 0));
            }
        });
        
        const playerNames = ['Blue', 'Red', 'Green', 'Yellow'];
        console.log(`RoomPlayerManager: 面板位置已旋轉到 ${playerNames[playerIndex]} 視角`);
    }
    
    /**
     * 重置面板位置到默認狀態（Blue 視角）
     */
    public resetPanelPositions(): void {
        this.rotatePanelPositions(0);
    }
    
    /**
     * 獲取當前視角的玩家索引
     * @returns 當前視角的玩家索引
     */
    public getCurrentViewPlayerIndex(): number {
        return this._currentViewPlayerIndex;
    }

    /**
     * 設置 UI 面板數組
     * @param panels - 4 個 PlayerPanel 組件的數組
     */
    public setPanels(panels: PlayerPanel[]): void {
        if (!panels || panels.length !== 4) {
            console.error('面板數量必須為 4 個');
            return;
        }
        this._uiPanels = panels;
    }

    /**
     * 核心方法：初始化或玩家加入
     * @param identity - 玩家身份資訊
     * @param viewIndex - UI 面板的索引位置 (0-3)
     */
    public addPlayer(identity: IPlayerIdentity, viewIndex: number): void {
        // 驗證參數
        if (viewIndex < 0 || viewIndex >= this._uiPanels.length) {
            console.error(`無效的 viewIndex: ${viewIndex}`);
            return;
        }

        const targetPanel = this._uiPanels[viewIndex];
        if (!targetPanel) {
            console.error(`viewIndex ${viewIndex} 的面板未設置`);
            return;
        }

        // 檢查是否已存在
        if (this._activePlayers.has(identity.seatIndex)) {
            console.warn(`座位 ${identity.seatIndex} 已有玩家，將被覆蓋`);
        }
        
        // 🎨 從預分配的映射中獲取玩家棋盤顏色
        const playerColor = this._seatColorMap.get(identity.seatIndex);
        if (playerColor === undefined) {
            console.error(`座位 ${identity.seatIndex} 沒有預分配顏色，請先初始化房間`);
            return;
        }
        
        // 將顏色寫入玩家身份資訊
        identity.playerColor = playerColor;
        
        const colorName = ColorSelector.getColorNameByEnum(playerColor);
        console.log(`[RoomPlayerManager] 玩家 "${identity.nickname}" (座位 ${identity.seatIndex}) 使用棋盤顏色: ${colorName}`);

        const player: IPlayerEntity = {
            identity: identity,
            status: this.createInitialStatus(),
            panel: targetPanel,
            //pawns: [] // 這裡會根據玩家顏色初始化 4 顆棋子
        };

        this._activePlayers.set(identity.seatIndex, player);
        
        // 立即透過注入的 panel 進行初始化
        player.panel.initView(player.identity, player.status);
    }

    /**
     * 移除玩家
     * @param seatIndex - 座位索引 (0-3)
     * @returns 是否成功移除
     */
    public removePlayer(seatIndex: number): boolean {
        const player = this._activePlayers.get(seatIndex);
        if (!player) {
            console.warn(`座位 ${seatIndex} 沒有玩家`);
            return false;
        }

        // 清空面板 UI
        player.panel.clearView();

        // 從 Map 中移除
        this._activePlayers.delete(seatIndex);
        
        console.log(`玩家 ${player.identity.nickname} (座位 ${seatIndex}) 已離開`);
        return true;
    }

    /**
     * 根據座位索引獲取玩家
     * @param seatIndex - 座位索引 (0-3)
     * @returns 玩家實體，若不存在則返回 null
     */
    public getPlayer(seatIndex: number): IPlayerEntity | null {
        return this._activePlayers.get(seatIndex) || null;
    }

    /**
     * 獲取所有活躍玩家
     * @returns 所有玩家實體的數組
     */
    public getAllPlayers(): IPlayerEntity[] {
        return Array.from(this._activePlayers.values());
    }

    /**
     * 獲取玩家數量
     * @returns 當前房間內的玩家數量
     */
    public getPlayerCount(): number {
        return this._activePlayers.size;
    }

    /**
     * 更新玩家狀態 (部分更新)
     * @param seatIndex - 座位索引 (0-3)
     * @param statusUpdate - 需要更新的狀態欄位（部分更新）
     */
    public updatePlayerStatus(seatIndex: number, statusUpdate: Partial<IPlayerStatus>): void {
        const player = this._activePlayers.get(seatIndex);
        if (!player) {
            console.warn(`座位 ${seatIndex} 沒有玩家`);
            return;
        }

        // 合併狀態
        Object.assign(player.status, statusUpdate);

        // 更新對應的 UI
        this._updatePlayerUI(player, statusUpdate);
    }

    /**
     * 清空所有玩家
     */
    public clear(): void {
        // 清空所有面板 UI
        this._activePlayers.forEach(player => {
            if (player.panel) {
                player.panel.clearView();
            }
        });

        // 清空 Map
        this._activePlayers.clear();
        
        // 清空顏色映射
        this._seatColorMap.clear();
        this._colorSelector.reset();
        
        console.log('房間已清空');
    }
    
    /**
     * 獲取座位的棋盤顏色
     * @param seatIndex - 座位索引
     * @returns 棋盤顏色，若未分配則返回 undefined
     */
    public getSeatColor(seatIndex: number): PlayerColor | undefined {
        return this._seatColorMap.get(seatIndex);
    }
    
    /**
     * 獲取所有座位的棋盤顏色映射
     * @returns 座位顏色映射的副本
     */
    public getAllSeatColors(): Map<number, PlayerColor> {
        return new Map(this._seatColorMap);
    }
    
    /**
     * 設置本機玩家視角（本機玩家入桌時調用）
     * 返回需要旋轉的棋盤顏色，由外部調用 rotateBoardView
     * 
     * @param localPlayerSeatIndex - 本機玩家的座位索引
     * @returns 本機玩家的棋盤顏色，若失敗則返回 undefined
     */
    public getLocalPlayerColor(localPlayerSeatIndex: number): PlayerColor | undefined {
        const color = this._seatColorMap.get(localPlayerSeatIndex);
        if (color === undefined) {
            console.error(`[RoomPlayerManager] 無法獲取座位 ${localPlayerSeatIndex} 的顏色`);
            return undefined;
        }
        
        const colorName = ColorSelector.getColorNameByEnum(color);
        console.log(`[RoomPlayerManager] 本機玩家座位 ${localPlayerSeatIndex}，棋盤顏色: ${colorName}`);
        
        return color;
    }

    /**
     * 創建初始玩家狀態
     * @returns 初始化的玩家狀態對象
     */
    public createInitialStatus(): IPlayerStatus {
        return {
            money: 1000,            // 初始金錢
            isCurrentTurn: false,   // 不是當前回合
            countdown: 0,           // 倒計時 0
            diceResult: 0,          // 骰子結果 0
            isDiceRolling: false,   // 不在擲骰子
            isAuto: false,          // 不是託管模式
            tipText: ''             // 無提示文字
        };
    }

    // ==================== 私有輔助方法 ====================
    
    /**
     * 獲取座位顏色分配摘要（用於日誌）
     * @returns 顏色分配摘要字串
     * @private
     */
    private _getSeatColorSummary(): string {
        const summary: string[] = [];
        this._seatColorMap.forEach((color, seat) => {
            const colorName = ColorSelector.getColorNameByEnum(color);
            summary.push(`${seat}→${colorName}`);
        });
        return summary.join(', ');
    }

    /**
     * 根據狀態更新更新對應的 UI
     * @param player - 玩家實體
     * @param statusUpdate - 狀態更新內容
     * @private
     */
    private _updatePlayerUI(player: IPlayerEntity, statusUpdate: Partial<IPlayerStatus>): void {
        const panel = player.panel;
        if (!panel) return;

        // 根據更新的字段調用對應的 UI 方法
        if (statusUpdate.money !== undefined) {
            panel.updateMoney(statusUpdate.money);
        }

        if (statusUpdate.isCurrentTurn !== undefined) {
            panel.showTurn(statusUpdate.isCurrentTurn);
        }

        if (statusUpdate.countdown !== undefined && statusUpdate.countdown > 0) {
            panel.startCountdown(statusUpdate.countdown);
        } else if (statusUpdate.countdown === 0) {
            panel.stopCountdown();
        }

        if (statusUpdate.diceResult !== undefined && statusUpdate.diceResult > 0) {
            panel.showDiceResult(statusUpdate.diceResult);
        }

        if (statusUpdate.isDiceRolling !== undefined && statusUpdate.isDiceRolling) {
            panel.playDiceAnimation();
        }

        if (statusUpdate.isAuto !== undefined) {
            panel.setAutoMode(statusUpdate.isAuto);
        }

        if (statusUpdate.tipText !== undefined) {
            panel.showTip(statusUpdate.tipText);
        }
    }
}