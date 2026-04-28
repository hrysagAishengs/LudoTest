import { _decorator, Component, Node, Vec3 } from 'cc';
import { LudoGameMode } from '../gameDef/GameDef';
import { GameModeFactory, IGameComponents, IGameModeConfig } from '../factorySys/defs/GameModeFactoryDef';
import { ClassicGameModeFactory } from '../factorySys/factorys/ClassicGameModeFactory';
import { GameModeConfig, GameModePropertyType } from '../factorySys/component/ConfigProperty';
import { IBoardGenerator } from '../factorySys/defs/board/FactoryDef';
import { IPathGenerator, IViewTransformer } from '../factorySys/defs/path/PathFactoryDef';
import { GameMapCenter } from '../gameMap/GameMapCenter';
import { GameMapDecorator } from '../gameMap/GameMapDecorator';
import { RoomPlayerManager } from '../roomManager/RoomPlayerManager';

const { ccclass, property } = _decorator;

/**
 * 遊戲工廠管理器
 * 
 * 職責：
 * 1. 管理遊戲模式的切換
 * 2. 統一管理所有遊戲組件的生命週期
 * 3. 提供組件訪問接口
 * 4. 從編輯器配置中讀取遊戲模式配置
 * 5. 管理地圖格子數據（GameMapCenter）
 * 6. 管理地圖裝飾（GameMapDecorator）
 * 7. 管理房間玩家面板（RoomPlayerManager）
 * 
 * 使用範例：
 * ```typescript
 * // 初始化遊戲模式
 * await factoryManager.initGameMode(LudoGameMode.CLASSIC);
 * 
 * // 設置房間（由 Server 傳入玩家數量）
 * factoryManager.setupRoom(4); // 4人局
 * 
 * // 獲取組件
 * const board = factoryManager.getBoardGenerator();
 * const path = factoryManager.getPathGenerator();
 * const mapCenter = factoryManager.getGameMapCenter();
 * const decorator = factoryManager.getMapDecorator();
 * const roomManager = factoryManager.getRoomPlayerManager();
 * ```
 */
@ccclass('GameFactoryManager')
export class GameFactoryManager extends Component {
    
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
    
    // 地圖管理中心
    private _gameMapCenter: GameMapCenter | null = null;
    
    // 地圖裝飾器
    private _mapDecorator: GameMapDecorator | null = null;
    
    // 房間玩家管理器
    private _roomPlayerManager: RoomPlayerManager | null = null;
    
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
     */
    public async initGameMode(gameMode: LudoGameMode): Promise<void> {
        // 清理舊的組件
        if (this._currentFactory) {
            this._currentFactory.destroyGameComponents();
        }
        
        // 清理舊的地圖裝飾器
        if (this._mapDecorator) {
            this._mapDecorator.clearAllDecorations();
            this._mapDecorator = null;
        }
        
        // 清理舊的地圖管理中心
        if (this._gameMapCenter) {
            this._gameMapCenter.clear();
            this._gameMapCenter = null;
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
        
        // 初始化地圖管理中心
        this.initializeGameMapCenter();
        
        // 初始化地圖裝飾器
        this.initializeMapDecorator();
        
        console.log(`遊戲模式 ${LudoGameMode[gameMode]} 初始化完成`);
    }
    
    /**
     * 設置房間（供外部調用，由 Server 傳入玩家數量）
     * @param playerCount - 玩家數量 (2/3/4)
     */
    public setupRoom(playerCount: number): void {
        if (playerCount < 2 || playerCount > 4) {
            console.error(`[GameFactoryManager] 無效的 playerCount: ${playerCount}，應在 2-4 之間`);
            return;
        }
        
        // 初始化房間管理器
        this.initializeRoomManager(playerCount);
        
        console.log(`[GameFactoryManager] 房間設置完成：${playerCount} 人局`);
    }
    
    /**
     * 初始化房間管理器
     * @param playerCount - 玩家數量
     * @private
     */
    private initializeRoomManager(playerCount: number): void {
        // 獲取當前模式的配置
        console.log(`[GameFactoryManager] 當前遊戲模式: ${LudoGameMode[this._currentGameMode]}`);
        const propertyMode = this.convertToPropertyMode(this._currentGameMode);
        console.log(`[GameFactoryManager] 查找配置模式: ${GameModePropertyType[propertyMode]}`);
    
        const editorConfig = this._gameModeConfig.find(c => c.gameMode === propertyMode);
        
         console.log(`[GameFactoryManager] 找到配置:`, editorConfig ? '是' : '否');
        console.log(`[GameFactoryManager] roomPanelConfig 存在:`, editorConfig?.roomPanelConfig ? '是' : '否');
        console.log(`[GameFactoryManager] roomPanelConfig 長度:`, editorConfig?.roomPanelConfig?.length);
        if (!editorConfig || !editorConfig.roomPanelConfig || editorConfig.roomPanelConfig.length === 0) {
            console.error('[GameFactoryManager] 未找到房間配置');
            return;
        }
        
        // 清理舊的房間管理器
        if (this._roomPlayerManager) {
            this._roomPlayerManager.clear();
            this._roomPlayerManager = null;
        }
        
        // 創建新的房間管理器
        this._roomPlayerManager = new RoomPlayerManager();
        
        // 從配置初始化
        this._roomPlayerManager.initializeFromConfig(editorConfig.roomPanelConfig, playerCount);
        
        console.log('[GameFactoryManager] 房間管理器初始化完成');
    }
    
    /**
     * 初始化地圖管理中心
     * 從 BoardGenerator 獲取節點和位置數據，構建地圖數據結構
     */
    private initializeGameMapCenter(): void {
        
        const boardGenerator = this.getBoardGenerator();
        if (!boardGenerator) {
            console.warn('[GameFactoryManager] 棋盤生成器不存在，無法初始化地圖管理中心');
            return;
        }
        
        // 獲取節點和位置數據
        const cells = (boardGenerator as any).getAllCells?.() || (boardGenerator as any)._cells;
        const positions = boardGenerator.getAllPositions();
        
        if (!cells || cells.length === 0 || !positions || positions.length === 0) {
            console.warn('[GameFactoryManager] 棋盤數據不存在，無法初始化地圖管理中心');
            return;
        }
        
        // 創建地圖管理中心並初始化
        this._gameMapCenter = new GameMapCenter();
        this._gameMapCenter.initFromNodes(cells, positions);
        
        console.log('[GameFactoryManager] 地圖管理中心初始化完成');
    }
    
    /**
     * 初始化地圖裝飾器
     * 創建裝飾器並應用配置中的裝飾設定
     */
    private initializeMapDecorator(): void {
        if (!this._gameMapCenter) {
            console.warn('[GameFactoryManager] 地圖管理中心不存在，無法初始化裝飾器');
            return;
        }
        
        // 創建裝飾器
        this._mapDecorator = new GameMapDecorator(this._gameMapCenter);
        
        // 獲取裝飾配置
        const propertyMode = this.convertToPropertyMode(this._currentGameMode);
        const editorConfig = this._gameModeConfig.find(c => c.gameMode === propertyMode);
        if (editorConfig && editorConfig.mapDecorationConfig && editorConfig.mapDecorationConfig.length > 0) {
            // 應用所有裝飾配置，使用 toFilteredConfig() 只提取當前模式相關的屬性
            editorConfig.mapDecorationConfig.forEach(config => {
                const filteredConfig = config.toFilteredConfig();
                this._mapDecorator.applyDecoration(filteredConfig);
            });
        } else {
            console.warn('[GameFactoryManager] 未找到地圖裝飾配置');
        }
        
        console.log('[GameFactoryManager] 地圖裝飾器初始化完成');
    }

    /**
     * 構建配置
     * 從編輯器配置的 _gameModeConfig 陣列中查找對應模式的配置
     * @returns IGameModeConfig 或 null（如果找不到配置）
     */
    private buildConfig(): IGameModeConfig | null {
        // 從配置陣列中找到對應遊戲模式的配置
        const propertyMode = this.convertToPropertyMode(this._currentGameMode);
        const editorConfig = this._gameModeConfig.find(c => c.gameMode === propertyMode);
        
        if (!editorConfig) {
            console.warn(`未找到遊戲模式 ${LudoGameMode[this._currentGameMode]} 的配置`);
            return null;
        }
        
        // 轉換為 IGameModeConfig 介面
        return editorConfig.toIGameModeConfig();
    }
    
    /**
     * 運行時枚舉 → 編輯器枚舉
     * 將 LudoGameMode 轉換為 GameModePropertyType 用於配置查找
     * @private
     */
    private convertToPropertyMode(mode: LudoGameMode): GameModePropertyType {
        switch (mode) {
            case LudoGameMode.CLASSIC:
                return GameModePropertyType.MODE_CLASSIC;
            case LudoGameMode.QUICK:
                return GameModePropertyType.MODE_QUICK;
            default:
                return GameModePropertyType.MODE_CLASSIC;
        }
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
            console.warn('[GameFactoryManager] 背景容器節點不存在，無法旋轉視角');
            return;
        }
        
        // 驗證 playerIndex
        if (playerIndex < 0 || playerIndex > 3) {
            console.error(`[GameFactoryManager] 無效的 playerIndex: ${playerIndex}，應在 0-3 之間`);
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
        
        // 旋轉標記圖標的視覺位置
        if (this._gameMapCenter) {
            const viewTransformer = this.getViewTransformer();
            if (viewTransformer) {
                this._gameMapCenter.rotateMarkersView(playerIndex, viewTransformer);
            } else {
                console.warn('[GameFactoryManager] ViewTransformer 不存在，無法旋轉標記');
            }
        }
        
        // 旋轉玩家面板位置
        if (this._roomPlayerManager) {
            this._roomPlayerManager.rotatePanelPositions(playerIndex);
        } else {
            console.warn('[GameFactoryManager] RoomPlayerManager 不存在，無法旋轉面板位置');
        }
        
        const playerNames = ['Blue(左下)', 'Red(左上)', 'Green(右上)', 'Yellow(右下)'];
        console.log(`[GameFactoryManager] 棋盤視角已旋轉到玩家 ${playerIndex} - ${playerNames[playerIndex]} (${angle}°)`);
    }
    
    /**
     * 重置棋盤視角到默認狀態（玩家 0 視角 - Blue 在底部）
     */
    public resetBoardView(): void {
        this.rotateBoardView(0);        
        // 重置標記到基本盤位置
        if (this._gameMapCenter) {
            this._gameMapCenter.resetMarkersView();
        }
        // 重置面板到基本盤位置（已通過 rotateBoardView(0) 完成）
        console.log('[GameFactoryManager] 棋盤視角已重置到默認狀態');
    }    
    /**
     * 設置本機玩家視角（本機玩家入桌時調用）
     * 根據本機玩家的座位索引，自動旋轉棋盤到對應視角
     * 
     * @param localPlayerSeatIndex - 本機玩家的座位索引（Server 單獨通知）
     */
    public setupLocalPlayerView(localPlayerSeatIndex: number): void {
        if (!this._roomPlayerManager) {
            console.error('[GameFactoryManager] RoomPlayerManager 未初始化，無法設置本機玩家視角');
            return;
        }
        
        // 從房間管理器獲取本機玩家的棋盤顏色
        const playerColor = this._roomPlayerManager.getLocalPlayerColor(localPlayerSeatIndex);
        
        if (playerColor === undefined) {
            console.error(`[GameFactoryManager] 無法獲取座位 ${localPlayerSeatIndex} 的棋盤顏色`);
            return;
        }
        
        // 根據棋盤顏色旋轉視角
        // PlayerColor 枚舉值 (0:Blue, 1:Red, 2:Green, 3:Yellow) 剛好對應 rotateBoardView 參數
        this.rotateBoardView(playerColor);
        
        console.log(`[GameFactoryManager] 本機玩家視角設置完成 (座位 ${localPlayerSeatIndex})`);
    }    
    // ========== 組件訪問 API ==========
    
    /**
     * 獲取所有遊戲組件
     * @returns 組件集合，如果未初始化則返回 null
     */
    public getGameComponents(): IGameComponents | null {
        return this._currentComponents;
    }
    
    /**
     * 獲取棋盤生成器
     * @returns 棋盤生成器，如果未初始化則返回 null
     */
    public getBoardGenerator(): IBoardGenerator | null {
        return this._currentComponents?.boardGenerator ?? null;
    }
    
    /**
     * 獲取路徑生成器
     * @returns 路徑生成器，如果未初始化則返回 null
     */
    public getPathGenerator(): IPathGenerator | null {
        return this._currentComponents?.pathGenerator ?? null;
    }
    
    /**
     * 獲取視角轉換器
     * @returns 視角轉換器，如果未初始化則返回 null
     */
    public getViewTransformer(): IViewTransformer | null {
        return this._currentComponents?.viewTransformer ?? null;
    }
    
    /**
     * 獲取地圖管理中心
     * @returns 地圖管理中心，如果未初始化則返回 null
     */
    public getGameMapCenter(): GameMapCenter | null {
        return this._gameMapCenter;
    }
    
    /**
     * 獲取地圖裝飾器
     * @returns 地圖裝飾器，如果未初始化則返回 null
     */
    public getMapDecorator(): GameMapDecorator | null {
        return this._mapDecorator;
    }
    
    /**
     * 獲取房間玩家管理器
     * @returns 房間玩家管理器，如果未初始化則返回 null
     */
    public getRoomPlayerManager(): RoomPlayerManager | null {
        return this._roomPlayerManager;
    }
    
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
     * 獲取組件初始化狀態（調試用）
     */
    public getInitializationStatus(): {
        initialized: boolean;
        gameMode: string;
        hasBoard: boolean;
        hasPath: boolean;
        hasView: boolean;
    } {
        return {
            initialized: this._currentComponents !== null,
            gameMode: LudoGameMode[this._currentGameMode],
            hasBoard: !!this._currentComponents?.boardGenerator,
            hasPath: !!this._currentComponents?.pathGenerator,
            hasView: !!this._currentComponents?.viewTransformer
        };
    }
    
    /**
     * 清理資源
     */
    public cleanup(): void {
        this._currentFactory?.destroyGameComponents();
        this._currentComponents = null;
        this._currentFactory = null;
        
        // 清理地圖裝飾器
        if (this._mapDecorator) {
            this._mapDecorator.clearAllDecorations();
            this._mapDecorator = null;
        }
        
        // 清理地圖管理中心
        if (this._gameMapCenter) {
            this._gameMapCenter.clear();
            this._gameMapCenter = null;
        }
        
        // 清理房間管理器
        if (this._roomPlayerManager) {
            this._roomPlayerManager.clear();
            this._roomPlayerManager = null;
        }
        
        console.log('遊戲模式已清理');
    }
}
