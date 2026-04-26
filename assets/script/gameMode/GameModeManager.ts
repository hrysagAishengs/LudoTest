// ===== gameMode/GameModeManager.ts =====

import { _decorator, Component, Node, Vec3 } from 'cc';
import { LudoGameMode } from '../gameDef/GameDef';
import { GameModeFactory, IGameComponents, IGameModeConfig } from '../factorySys/defs/GameModeFactoryDef';
import { ClassicGameModeFactory } from '../factorySys/factorys/ClassicGameModeFactory';
import { GameModeConfig } from '../factorySys/component/ConfigProperty';

const { ccclass, property } = _decorator;

/**
 * 遊戲模式管理器
 * 
 * 使用範例：
 * ```typescript
 * // 一行代碼初始化所有
 * await gameModeManager.initGameMode(LudoGameMode.CLASSIC);
 * 
 * // 統一 API 訪問
 * gameModeManager.getPlayerDestinationByPos(...);
 * gameModeManager.getCellPosition(...);
 * ```
 * 
 * 職責：
 * 1. 管理遊戲模式的切換
 * 2. 統一管理所有遊戲組件的生命週期
 * 3. 提供統一的 API 訪問各個組件
 * 4. 從編輯器配置中讀取遊戲模式配置
 */
@ccclass('GameModeManager')
export class GameModeManager extends Component {
    
    @property({
        type: [GameModeConfig],
        tooltip: '遊戲模式配置列表（為每個遊戲模式配置一個 GameModeConfig）',
        displayName: '遊戲模式配置',
        visible: true
    })
    private _gameModeConfig: GameModeConfig[] = [new GameModeConfig()];
    

    private _currentFactory: GameModeFactory | null = null;
    private _currentComponents: IGameComponents | null = null;
    private _currentGameMode: LudoGameMode = LudoGameMode.DEFAULT;
    
    // 背景容器節點引用（用於視角旋轉）
    private _bgContainerNode: Node | null = null;
    
    // 工廠註冊表
    private readonly FACTORY_REGISTRY = new Map<LudoGameMode, new () => GameModeFactory>([
        [LudoGameMode.CLASSIC, ClassicGameModeFactory],
        // [LudoGameMode.QUICK, QuickGameModeFactory],
    ]);
    
    // ========== 初始化 ==========
    
    /**
     * 初始化遊戲模式
     * @param gameMode 遊戲模式
     * @param customConfig 自定義配置（可選）
     */
    public async initGameMode(gameMode: LudoGameMode): Promise<void> {
        // 清理舊的組件
        if (this._currentFactory) {
            this._currentFactory.destroyGameComponents();
        }
        
        // 設置當前遊戲模式
        this._currentGameMode = gameMode;
        
        // 獲取工廠類
        const FactoryClass = this.FACTORY_REGISTRY.get(gameMode);
        if (!FactoryClass) {
            console.error(`未找到遊戲模式 ${gameMode} 的工廠`);
            return;
        }
        
        // 創建工廠實例
        this._currentFactory = new FactoryClass();
        
        // 構建配置
        const config = this.buildConfig();
        if (!config) {
            console.error(`無法構建遊戲模式 ${LudoGameMode[gameMode]} 的配置`);
            return;
        }
        
        // 配置工廠
        this._currentFactory.setConfig(config);
        
        // 保存背景節點引用供視角旋轉使用
        if (config.boardConfig.boardResourceConfig.bgContainerNode) {
            this._bgContainerNode = config.boardConfig.boardResourceConfig.bgContainerNode;
        }
        
        // 創建所有組件
        this._currentComponents = await this._currentFactory.createGameComponents();
        
        console.log(`遊戲模式 ${LudoGameMode[gameMode]} 初始化完成`);
    }

    /**
     * 構建配置
     * 從編輯器配置的 _gameModeConfig 陣列中查找對應模式的配置
     * @returns IGameModeConfig 或 null（如果找不到配置）
     */
    private buildConfig(): IGameModeConfig | null {
        // 從配置陣列中找到對應遊戲模式的配置
        const editorConfig = this._gameModeConfig.find(c => c.gameMode === this._currentGameMode);
        
        if (!editorConfig) {
            console.warn(`未找到遊戲模式 ${LudoGameMode[this._currentGameMode]} 的配置`);
            return null;
        }
        
        // 轉換為 IGameModeConfig 介面
        return editorConfig.toIGameModeConfig();
    }
    
    // ========== 視角旋轉 API ==========
    
    /**
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
        if (!this._bgContainerNode) {
            console.warn('[GameModeManager] 背景容器節點不存在，無法旋轉視角');
            return;
        }
        
        // 驗證 playerIndex
        if (playerIndex < 0 || playerIndex > 3) {
            console.error(`[GameModeManager] 無效的 playerIndex: ${playerIndex}，應在 0-3 之間`);
            return;
        }
        
        // 計算旋轉角度：angle = 角度(degree)
        // playerIndex 0 → 0° (不旋轉)
        // playerIndex 1 → 90°
        // playerIndex 2 → 180°
        // playerIndex 3 → 270°
        //-Cocos Creator 的旋轉是逆時針=正（標準數學定義）
        const angle = 90 * playerIndex;
        
        // 應用旋轉（使用尤拉角，Z軸旋轉）
        this._bgContainerNode.setRotationFromEuler(0, 0, angle);
        
        const playerNames = ['Blue(左下)', 'Red(左上)', 'Green(右上)', 'Yellow(右下)'];
        console.log(`[GameModeManager] 棋盤視角已旋轉到玩家 ${playerIndex} - ${playerNames[playerIndex]} (${angle}°)`);
    }
    
    /**
     * 重置棋盤視角到默認狀態（玩家 0 視角 - Blue 在底部）
     */
    public resetBoardView(): void {
        this.rotateBoardView(0);
        console.log('[GameModeManager] 棋盤視角已重置到默認狀態');
    }
    
    // ========== Board 相關 API ==========
    
    public getCellPosition(r: number, c: number): Vec3 | null {
        return this._currentComponents?.boardGenerator.getCellPosition(r, c) ?? null;
    }
    
    public getBaseSlotPosition(r: number, c: number): Vec3 | null {
        return this._currentComponents?.boardGenerator.getBaseSlotPosition(r, c) ?? null;
    }

    public getGridSize(): number | null {
        return this._currentComponents?.boardGenerator.getGridSize() ?? null;
    }
    
    public getAllPositions(): Vec3[][] | null {
        return this._currentComponents?.boardGenerator.getAllPositions() ?? null;
    }
    
    // ========== Path 相關 API ==========
    
    public getPlayerPath(playerType: number): number[][] | null {
        return this._currentComponents?.pathGenerator.getPlayerPath(playerType) ?? null;
    }
    
    public getPlayerDestinationByPos(
        playerView: number,
        startPos: [number, number],
        steps: number
    ): [number, number] | null {
        return this._currentComponents?.viewTransformer.getDestinationByPos(
            playerView,
            startPos,
            steps
        ) ?? null;
    }
    
    public getPlayerDestinationByIndex(
        playerView: number,
        startIndex: number,
        steps: number
    ): [number, number] | null {
        return this._currentComponents?.viewTransformer.getDestinationByStartIndex(
            playerView,
            startIndex,
            steps
        ) ?? null;
    }
    
    /**
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
        return this._currentComponents?.viewTransformer.getPathSegmentByPos(
            playerView,
            startPos,
            steps
        ) ?? null;
    }

    /**
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
        return this._currentComponents?.viewTransformer.getPathSegmentByStartIndex(
            playerView,
            startIndex,
            steps
        ) ?? null;
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
    public getOtherPlayerDestToGlobal(
        playerView: number,
        otherPlayer: number,
        startIndex: number,
        steps: number
    ): [number, number] | null {
        return this._currentComponents?.viewTransformer.getOtherPlayerDestToGlobal( 
            playerView,
            otherPlayer,
            startIndex,
            steps
        ) ?? null;
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
        return this._currentComponents?.viewTransformer.getOtherPlayerDestToGlobalSegment(
            playerView,
            otherPlayer,
            startIndex,
            steps
        ) ?? null;
    }


    /**
     *根據 Slot ID 獲取指定玩家視角下的基地坑位座標 
     * @param playerView 當下玩家本身的視角
     * @param slotIndex 基地棋子編號
     * @returns 
     */
    public getCurrentPlayerBSToGlobal(playerView: number, slotIndex: number): [number, number] | null {
        return this._currentComponents?.viewTransformer.getBaseSlotInView(playerView, slotIndex) ?? null;
    }
    
    /**
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
        return this._currentComponents?.viewTransformer.getBaseSlotByCurrentView(playerType,slotId,playerView) ?? null;
    }

    /**
     * 根據 Slot ID 獲取指定玩家視角下的基地坑位座標（自動從 Slot ID 換算玩家類型）
     * 
     * 此方法會自動從 Slot ID 計算出對應的玩家類型，無需手動傳入 playerType
     * 
     * @param slotId 坑位 ID（負數，如 -1, -2, ..., -16）
     * @param playerView 當前玩家視角 (0:Blue, 1:Red, 2:Green, 3:Yellow)
     * @returns 玩家視角下的基地坑位座標 [row, col]，如果找不到則返回 null
     */
    public getOtherPlayerBSByIdToGlobal(slotId: number, playerView: number): [number, number] | null {
        return this._currentComponents?.viewTransformer.getBaseSlotInViewById(slotId, playerView) ?? null;
    }

    /**
     * 獲取所有玩家的基地坑位在某個視角下的座標
     * (用來取得初始狀態所有玩家基地坑位的座標，或是結束遊戲時顯示所有玩家基地坑位的座標) 
     * @param playerView 當前玩家視角 (0:Blue, 1:Red, 2:Green, 3:Yellow)
     * @returns 所有玩家的基地坑位座標映射（按玩家類型分組），如果找不到則返回 null
     */
    public getAllBSListByCurrentView(playerView: number): Record<number, number[][]> | null {
        return this._currentComponents?.viewTransformer.getAllBaseSlotsByCurrentView(playerView) ?? null;
    }
    
    // ========== PlayerSeating 相關 API ==========
    /*
    public getPlayerSeatIndex(playerType: number): number {
        return this._currentComponents?.playerSeating.getSeatIndex(playerType) ?? 0;
    }
    
    public getSeatUIPosition(seatIndex: number): string {
        return this._currentComponents?.playerSeating.getSeatUIPosition(seatIndex) ?? 'bottom-left';
    }
    
    public rotateSeatView(newCurrentPlayer: number): void {
        this._currentComponents?.playerSeating.rotateSeatView(newCurrentPlayer);
    }*/
    
    // ========== 通用 API ==========
    
    /**
     * 獲取特定組件（高級用法）
     */
    public getComponent<T extends keyof IGameComponents>(componentName: T): IGameComponents[T] | null {
        return this._currentFactory?.getComponent(componentName) ?? null;
    }
    
    /**
     * 獲取當前遊戲模式
     */
    public getCurrentGameMode(): LudoGameMode {
        return this._currentGameMode;
    }
    
    /**
     * 清理資源
     */
    public cleanup(): void {
        this._currentFactory?.destroyGameComponents();
        this._currentComponents = null;
        this._currentFactory = null;
        console.log('遊戲模式已清理');
    }
}