import { _decorator, Component, Node, Vec3, Vec2, instantiate, UITransform, Label, Color, Layers } from 'cc';
import { LudoGameMode } from '../gameDef/GameDef';
import { GameModeFactory, IGameComponents, IGameModeConfig } from '../factorySys/defs/GameModeFactoryDef';
import { ClassicGameModeFactory } from '../factorySys/factorys/ClassicGameModeFactory';
import { GameModeConfig, GameModePropertyType, MapDecorationItem, MarkerDirection } from '../factorySys/component/ConfigProperty';
import { IBoardGenerator } from '../factorySys/defs/board/FactoryDef';
import { IPathGenerator, IViewTransformer } from '../factorySys/defs/path/PathFactoryDef';
import { GameMapCenter } from '../gameMap/GameMapCenter';
import { GameMapDecorator } from '../gameMap/GameMapDecorator';
import { RoomPlayerManager } from '../roomManager/RoomPlayerManager';
import { IGridData, IMarker, MarkerType, GridState } from '../gameMap/def/GameMapDef';
import { IPlayerIdentity } from '../gamePlayer/def/PlayerDataDef';
import { AniSysManager } from '../aniPresentSys/AniSysManager';

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
    
    // 原始數據（用於重映射）
    private _originalPathMap: Record<number, number[][]> | null = null;
    private _originalBaseMap: Record<number, number[][]> | null = null;
    private _originalSlotIdMap: Record<number, number[]> | null = null;
    private _originalDecorationConfigs: any[] | null = null;
    
    // 基準旋轉值（隨機基本盤的顏色索引）
    private _baseColorRotation: number = 0;
    
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
        
        // 保存原始數據（在任何旋轉之前）
        this.saveOriginalData();
        
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
        
        // 設置隨機基本盤
        this.setupRandomBaseboard();
        
        // 【新增】創建路徑調試面板（如果配置了）
        const propertyMode = this.convertToPropertyMode(this._currentGameMode);
        const editorConfig = this._gameModeConfig.find(c => c.gameMode === propertyMode);
        const pathConfig = editorConfig?.pathConfig;
        if (pathConfig?.useTestPathIndex && pathConfig.debugPrefab) {
            this.createPathDebugPanel(pathConfig.debugPrefab, editorConfig);
        }
        
        console.log(`[GameFactoryManager] 房間設置完成：${playerCount} 人局`);
    }
    
    /**
     * 測試方法：設置房間並指定顏色排列索引
     * 用於重現特定的基本盤狀態來調試問題
     * 
     * @param playerCount - 玩家數量 (2/3/4)
     * @param colorCombinationIndex - 顏色排列索引 (0=0°, 1=90°, 2=180°, 3=270°)
     * 
     * 使用範例：
     * ```typescript
     * // 重現 180° 旋轉的基本盤狀態
     * factoryManager.setupRoomWithColorIndex(4, 2);
     * ```
     */
    public setupRoomWithColorIndex(playerCount: number, colorCombinationIndex: number): void {
        if (playerCount < 2 || playerCount > 4) {
            console.error(`[GameFactoryManager] 無效的 playerCount: ${playerCount}，應在 2-4 之間`);
            return;
        }
        
        if (colorCombinationIndex < 0 || colorCombinationIndex > 3) {
            console.error(`[GameFactoryManager] 無效的 colorCombinationIndex: ${colorCombinationIndex}，應在 0-3 之間`);
            return;
        }
        
        console.log(`[GameFactoryManager] 【測試模式】設置房間：${playerCount}人局，顏色排列索引=${colorCombinationIndex}`);
        
        // 初始化房間管理器（使用指定的顏色排列）
        this.initializeRoomManagerWithColorIndex(playerCount, colorCombinationIndex);
        
        // 設置隨機基本盤
        this.setupRandomBaseboard();
        
        // 【新增】創建路徑調試面板（如果配置了）
        const propertyMode = this.convertToPropertyMode(this._currentGameMode);
        const editorConfig = this._gameModeConfig.find(c => c.gameMode === propertyMode);
        const pathConfig = editorConfig?.pathConfig;
        if (pathConfig?.useTestPathIndex && pathConfig.debugPrefab) {
            this.createPathDebugPanel(pathConfig.debugPrefab, editorConfig);
        }
        
        console.log(`[GameFactoryManager] 【測試模式】房間設置完成：${playerCount} 人局，顏色排列索引=${colorCombinationIndex}`);
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
     * 初始化房間管理器（測試模式：指定顏色排列索引）
     * @param playerCount - 玩家數量
     * @param colorCombinationIndex - 顏色排列索引
     * @private
     */
    private initializeRoomManagerWithColorIndex(playerCount: number, colorCombinationIndex: number): void {
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
        
        // 【測試模式】從配置初始化（使用指定的顏色排列索引）
        this._roomPlayerManager.initializeWithColorIndex(editorConfig.roomPanelConfig, playerCount, colorCombinationIndex);
        
        console.log('[GameFactoryManager] 房間管理器初始化完成（測試模式）');
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
    public testRotate(playerIndex: number) {
        const testAngles = [0, 270, 180, 90];
        const angle = 90-testAngles[playerIndex];
        this._bgContainerNode.angle=angle;
        //this._bgContainerNode.setRotationFromEuler(0, 0, angle);
        /*
        const angle = 90 * playerIndex; 
        // 應用旋轉（使用尤拉角，Z軸旋轉）
        this._bgContainerNode.setRotationFromEuler(0, 0, angle);
        */
    }
    /**
     * 旋轉棋盤視角以適配當前玩家
     * creator 的旋轉是逆時針為正（標準數學定義），因此旋轉角度計算如下
     * 起始點0度是在右邊(箭頭朝右)
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
        
        // 旋轉玩家面板位置--移除改由mapping
        /*
        if (this._roomPlayerManager) {
            this._roomPlayerManager.rotatePanelPositions(playerIndex);
        } else {
            console.warn('[GameFactoryManager] RoomPlayerManager 不存在，無法旋轉面板位置');
        }*/
        
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
     * 這是第二次旋轉：將玩家的座位位置旋轉到左下角
     * 
     * @param localPlayerSeatIndex - 本機玩家的座位索引（Server 單獨通知）
     */
    public setupLocalPlayerView(localPlayerSeatIndex: number): void {
        if (!this._bgContainerNode) {
            console.warn('[GameFactoryManager] 背景容器節點不存在，無法設置玩家視角');
            return;
        }
        
        // 【第二次旋轉底圖】讓玩家座位轉到左下角
        // 最終旋轉角度 = 基準旋轉 + 座位旋轉
        const finalAngle = (this._baseColorRotation + localPlayerSeatIndex) * 90;
        this._bgContainerNode.setRotationFromEuler(0, 0, finalAngle);
        
        // 計算總旋轉次數（用於其他元素）
        const totalRotations = (this._baseColorRotation + localPlayerSeatIndex) % 4;
        
        console.log(`[setupLocalPlayerView] _baseColorRotation=${this._baseColorRotation}, localPlayerSeatIndex=${localPlayerSeatIndex}, totalRotations=${totalRotations}`);
        
        //  通知 ViewTransformer 當前總旋轉次數（修復坐標轉換問題）
        const viewTransformer = this.getViewTransformer();
        if (viewTransformer) {
            console.log('[setupLocalPlayerView] 调用 setTotalRotation');
            viewTransformer.setTotalRotation(totalRotations,localPlayerSeatIndex);
        } else {
            console.log('[setupLocalPlayerView]  viewTransformer 为 null');
        }
        
        // 旋轉標記圖標的視覺位置
        if (this._gameMapCenter) {
            if (viewTransformer) {
                this._gameMapCenter.rotateMarkersView(totalRotations, viewTransformer);
            }
        }
        
        // 旋轉玩家面板位置--移除改由mapping
        /*
        if (this._roomPlayerManager) {
            this._roomPlayerManager.rotatePanelPositions(totalRotations);
        }*/
        
        // 更新箭頭旋轉角度（方案B：不重建，只更新角度）
        // 【核心逻辑】箭头父节点（boardContainerNode）不旋转，因此不需要传递任何旋转角度
        // 只需根据箭头当前位置确定方向，直接设置对应的角度即可
        if (this._mapDecorator) {
            console.log(`[setupLocalPlayerView] 调用 updateArrowRotations 更新箭头方向`);
            this._mapDecorator.updateArrowRotations();
        }
        
        const colorNames = ['Blue', 'Red', 'Green', 'Yellow'];
        console.log(`[GameFactoryManager] 本機玩家視角設置完成：座位 ${localPlayerSeatIndex}，總旋轉 ${finalAngle}度 (基準${this._baseColorRotation * 90}度 + 座位${localPlayerSeatIndex * 90}度)`);
    }
    
    
    public addPlayer(value:IPlayerIdentity,seatIndex:number):void{
        
        const viewTransformer = this.getViewTransformer();
        if (!viewTransformer) return;

        const localViewIndex=viewTransformer.getLocalViewIndex(seatIndex);
        const isPlayer=viewTransformer.isCurrentPlayerView(seatIndex);
        value.seatIndex=seatIndex;
        value.localViewIndex=localViewIndex;
        value.isPlayerOwner=isPlayer;
        
        if(this._roomPlayerManager){
            this._roomPlayerManager.addPlayer(value);
        }

    }
    // ========== 隨機基本盤與數據重映射 ==========
    
    /**
     * 保存原始數據（在任何旋轉之前）
     * @private
     */
    private saveOriginalData(): void {
        const viewTransformer = this.getViewTransformer();
        if (!viewTransformer) {
            console.warn('[GameFactoryManager] ViewTransformer 不存在，無法保存原始數據');
            return;
        }
        
        const pathGenerator = this.getPathGenerator();
        if (!pathGenerator) {
            console.warn('[GameFactoryManager] PathGenerator 不存在，無法保存原始數據');
            return;
        }
        
        // 深拷貝保存原始路徑數據
        this._originalPathMap = JSON.parse(JSON.stringify(pathGenerator.getPathMap()));
        
       
        
        // 深拷貝保存原始基地座標數據
        const baseSlotMap: Record<number, number[][]> = {};
        for (let playerType = 0; playerType < 4; playerType++) {
            const slots = pathGenerator.getPlayerBaseSlots(playerType);
            if (slots) {
                baseSlotMap[playerType] = JSON.parse(JSON.stringify(slots));
            }
        }
        this._originalBaseMap = baseSlotMap;
        
        // 深拷貝保存原始 SlotID 映射
        const slotIdMap: Record<number, number[]> = {};
        for (let playerType = 0; playerType < 4; playerType++) {
            const slotIds = pathGenerator.getPlayerSlotIds(playerType);
            if (slotIds) {
                slotIdMap[playerType] = [...slotIds];
            }
        }
        this._originalSlotIdMap = slotIdMap;
        
        // 深拷貝保存原始裝飾配置
        const propertyMode = this.convertToPropertyMode(this._currentGameMode);
        const editorConfig = this._gameModeConfig.find(c => c.gameMode === propertyMode);
        
        if (editorConfig?.mapDecorationConfig) {
            this._originalDecorationConfigs = editorConfig.mapDecorationConfig.map(config => {
                const filtered = config.toFilteredConfig();
                
                // 深拷貝 arrowPositions（保護原始配置）
                if (filtered.arrowPositions) {
                    filtered.arrowPositions = filtered.arrowPositions.map((item: MapDecorationItem) => 
                        new MapDecorationItem(
                            new Vec2(item.position.x, item.position.y),
                            item.direction
                        )
                    );
                }
                
                // 深拷貝 startPoints
                if (filtered.startPoints) {
                    filtered.startPoints = filtered.startPoints.map((pos: Vec2) => 
                        new Vec2(pos.x, pos.y)
                    );
                }
                
                return filtered;
            });
        }
        
        console.log('[GameFactoryManager] 原始數據已保存');
    }
    
    /**
     * 設置隨機基本盤並進行第一次旋轉
     * 使用座位0的顏色作為基本盤顏色（由 RoomPlayerManager 隨機分配）
     * @public
     */
    public setupRandomBaseboard(): void {
        // 1. 獲取亂數池0的顏色作為基本盤顏色（保證與實際分配一致）
        const seat0Color = this._roomPlayerManager.getSeatColor(0);
        if (seat0Color === undefined) {
            console.error('[GameFactoryManager] 無法獲取座位0的顏色，隨機基本盤設置失敗');
            return;
        }
        this._baseColorRotation = seat0Color;
        
        const colorNames = ['Blue', 'Red', 'Green', 'Yellow'];
        console.log(`[GameFactoryManager] 基本盤顏色（座位0）: ${seat0Color} (${colorNames[seat0Color]})`);
        
        // 2. 重映射所有數據
        this.remapAllDataByBaseColor(seat0Color);
        
        // 3. 【第一次旋轉底圖】對齊底圖圖案和數據
        if (this._bgContainerNode) {
            this._bgContainerNode.setRotationFromEuler(0, 0, seat0Color * 90);
            console.log(`[GameFactoryManager] 底圖已旋轉 ${seat0Color * 90}度對齊 ${colorNames[seat0Color]} 顏色`);
        }
        
        // 4. 重新應用裝飾（使用重映射後的數據）
        this.reapplyDecorations();
        
        console.log('[GameFactoryManager] 隨機基本盤設置完成');
    }
    
    /**
     * 根據隨機基本盤顏色重映射所有數據
     * @param baseColor - 基本盤左下角的顏色索引 (0-3)
     * @private
     */
    private remapAllDataByBaseColor(baseColor: number): void {
        
        const viewTransformer = this.getViewTransformer();
        if (!viewTransformer) {
            console.warn('[GameFactoryManager] ViewTransformer 不存在，無法重映射數據');
            return;
        }
        
        if (!this._originalPathMap) {
            console.warn('[GameFactoryManager] 原始數據不存在，無法重映射');
            return;
        }
        
        // 設置基本盤顏色旋轉索引（讓 ViewTransformer 知道如何計算旋轉）
        viewTransformer.setBaseColorRotation(baseColor);
        
        
        
        // 重映射路徑數據
        /*
        const newPathMap: Record<number, number[][]> = {};
        for (let i = 0; i < 4; i++) {
            const sourceColor = (baseColor + i) % 4;
            newPathMap[i] = this._originalPathMap[sourceColor];
            console.log(`[remapAllDataByBaseColor] 座位${i} <- 原始颜色${sourceColor}(${colorNames[sourceColor]}) (起点: [${this._originalPathMap[sourceColor][0]}])`);
        }*/
        
        // 【新增】將原始路徑傳遞給 ViewTransformer（用於 getOtherPlayerDestToGlobal）
        viewTransformer.setOriginalPathContent(this._originalPathMap);
        //--test--
        //const pathGenerator = this.getPathGenerator();
        //const oldPathMap = JSON.parse(JSON.stringify(pathGenerator.getPathMapOld()));
        //viewTransformer.setOriginalPathContentOld(oldPathMap);

        // 將重映射後的路徑傳遞給 ViewTransformer
        //viewTransformer.setPathContent(newPathMap);
        
     
        //  設置基地座標數據（不重映射，保持 index 順序）
        if (this._originalBaseMap) {
            // 將原始基地傳遞給 ViewTransformer（用於所有查詢）
            viewTransformer.setOriginalBaseContent(this._originalBaseMap);
            //  坑位不重映射，直接使用原始數據（位置固定按 index）
            viewTransformer.setBaseContent(this._originalBaseMap);
        }
        
        
        //  設置 SlotID 映射（不重映射，SlotID 固定對應 position index）
        if (this._originalSlotIdMap) {
            // SlotID 語義：-1~-4 → index0, -5~-8 → index1, -9~-12 → index2, -13~-16 → index3
            viewTransformer.setSlotIdMap(this._originalSlotIdMap);
        }
        
        console.log('[GameFactoryManager] 數據重映射完成（路徑已重映射，坑位保持 index 順序）');
    }
    
    /**
     * 重新應用裝飾配置（使用重映射後的數據）
     * @private
     */
    private reapplyDecorations(): void {
        if (!this._mapDecorator || !this._gameMapCenter) {
            console.warn('[GameFactoryManager] 裝飾器或地圖中心不存在，無法重新應用裝飾');
            return;
        }
        
        // 清除舊裝飾
        this._mapDecorator.clearAllDecorations();
        
        // 使用保存的原始配置
        if (this._originalDecorationConfigs && this._originalDecorationConfigs.length > 0) {
            this._originalDecorationConfigs.forEach(config => {
                // 創建副本避免修改原始數據
                const configCopy = { ...config };
                
                // 重映射 startPoints（如果存在）
                if (configCopy.startPoints && this._baseColorRotation !== 0) {
                    configCopy.startPoints = this.remapStartPoints(configCopy.startPoints);
                }
                
                // 重映射 arrowPositions（如果存在）
                if (configCopy.arrowPositions && this._baseColorRotation !== 0) {
                    configCopy.arrowPositions = this.remapArrowPositions(configCopy.arrowPositions);
                }
                
                // 傳遞調試信息給裝飾器
                const bgAngle = this._bgContainerNode ? this._bgContainerNode.angle : 0;
                this._mapDecorator.applyDecoration(configCopy, this._baseColorRotation, bgAngle);
            });
        }
        
        console.log('[GameFactoryManager] 裝飾配置已重新應用');
    }
    
    /**
     * 重映射起點座標陣列
     * @param originalPoints - 原始起點座標陣列 [Blue, Red, Green, Yellow]
     * @returns 重映射後的起點座標陣列
     * @private
     */
    private remapStartPoints(originalPoints: any[]): any[] {
        const newPoints: any[] = [];
        for (let i = 0; i < originalPoints.length; i++) {
            const sourceIndex = (this._baseColorRotation + i) % 4;
            newPoints[i] = originalPoints[sourceIndex];
        }
        return newPoints;
    }
    
    /**
     * 重映射箭頭位置和方向陣列
     * @param originalItems - 原始箭頭配置陣列 [Blue, Red, Green, Yellow]
     * @returns 重映射後的箭頭配置陣列
     * @private
     * 
     * 邏輯：position 和 direction 是綁定的（grid 位置決定方向）
     * 重映射時直接把源配置的 position 和 direction 一起拿過來
     */
    private remapArrowPositions(originalItems: MapDecorationItem[]): MapDecorationItem[] {
        const newItems: MapDecorationItem[] = [];
        
        for (let i = 0; i < originalItems.length; i++) {
            const sourceIndex = (this._baseColorRotation + i) % 4;
            const originalItem = originalItems[sourceIndex];
            
            // 直接使用源配置的 position 和 direction（它們是綁定的）
            console.log(`[GameFactoryManager] 重映射箭頭[${i}]: 源索引=${sourceIndex}, position=(${originalItem.position.x},${originalItem.position.y}), direction=${originalItem.direction}(${MarkerDirection[originalItem.direction]})`);
            
            // 創建新Item（深拷貝避免修改原配置）
            const newItem = new MapDecorationItem(
                new Vec2(originalItem.position.x, originalItem.position.y),
                originalItem.direction  // position 和 direction 一起拿過來
            );
            newItems[i] = newItem;
        }
        
        return newItems;
    }
    
    /**
     * 根據旋轉次數轉換方向枚舉
     * @param direction - 原始方向
     * @param rotationSteps - 旋轉次數 (0-3)，逆時針旋轉
     * @returns 轉換後的方向
     * @private
     * 
     * 轉換規則：
     * - rotationSteps=0: 不變
     * - rotationSteps=1 (90°): UP→LEFT, RIGHT→UP, DOWN→RIGHT, LEFT→DOWN
     * - rotationSteps=2 (180°): UP→DOWN, RIGHT→LEFT, DOWN→UP, LEFT→RIGHT
     * - rotationSteps=3 (270°): UP→RIGHT, RIGHT→DOWN, DOWN→LEFT, LEFT→UP
     */
    private rotateDirection(direction: MarkerDirection, rotationSteps: number): MarkerDirection {
        if (direction === MarkerDirection.NONE) {
            return direction;
        }
        
        // 公式：逆時針旋轉 rotationSteps 次
        // UP(1), RIGHT(2), DOWN(3), LEFT(4)
        const newDir = ((direction - 1 + rotationSteps) % 4) + 1;
        return newDir as MarkerDirection;
    }
    
    /**
     * 創建路徑調試面板（顯示路徑索引編號）
     * @param debugPrefab - 調試面板預製件
     * @param editorConfig - 編輯器配置
     * @private
     */
    private createPathDebugPanel(debugPrefab: any, editorConfig: GameModeConfig): void {
        if (!this._bgContainerNode || !this._gameMapCenter) {
            console.warn('[GameFactoryManager] 背景容器或地圖中心不存在，無法創建調試面板');
            return;
        }
        
        const pathGenerator = this.getPathGenerator();
        if (!pathGenerator) {
            console.warn('[GameFactoryManager] 路徑生成器不存在，無法創建調試面板');
            return;
        }
        
        // 1. 實例化 debugPrefab，添加到背景容器
        const debugPanel = instantiate(debugPrefab);
        debugPanel.name = 'PathDebugPanel';
        debugPanel.parent = this._bgContainerNode;
        
        // 2. 獲取 UITransform（用於坐標轉換）
        const panelTransform = debugPanel.getComponent(UITransform);
        if (!panelTransform) {
            console.warn('[GameFactoryManager] debugPrefab 缺少 UITransform 組件');
            return;
        }
        
        // 3. 獲取路徑（玩家0 = 重映射後的左下角玩家）
        const path = pathGenerator.getPlayerPath(0);
        if (!path || path.length === 0) {
            console.warn('[GameFactoryManager] 路徑數據不存在');
            return;
        }
        
        // 4. 獲取 cellSize
        const cellSize = editorConfig?.boardConfig?.cellSize || 48;
        
        // 5. 遍歷路徑創建 Label
        let labelCount = 0;
        path.forEach(([r, c], index) => {
            const grid = this._gameMapCenter!.getGridAt(r, c);
            if (grid) {
                // 獲取格子的世界坐標
                const worldPos = grid.containerNode.worldPosition;
                
                // 轉換為 debugPanel 的本地坐標
                const localPos = panelTransform.convertToNodeSpaceAR(worldPos);
                
                // 創建並添加 Label
                const labelNode = this.createPathIndexLabel(index, cellSize);
                labelNode.parent = debugPanel;
                labelNode.setPosition(localPos.x, localPos.y, 0);
                labelCount++;
            }
        });
        
        console.log(`[GameFactoryManager] 路徑調試面板已創建，共 ${labelCount} 個標籤`);
    }
    
    /**
     * 創建單個路徑索引標籤節點
     * @param index - 路徑索引
     * @param cellSize - 格子大小
     * @returns 標籤節點
     * @private
     */
    private createPathIndexLabel(index: number, cellSize: number): Node {
        const node = new Node(`PathIndex_${index}`);
        node.layer = Layers.Enum.UI_2D;
        
        // 添加 UITransform
        const transform = node.addComponent(UITransform);
        transform.setContentSize(cellSize, cellSize);
        transform.setAnchorPoint(0.5, 0.5);
        
        // 添加 Label 組件
        const label = node.addComponent(Label);
        label.string = index.toString();
        label.fontSize = 24;
        label.color = new Color(0, 0, 0, 255); // 黑色
        label.horizontalAlign = Label.HorizontalAlign.CENTER;
        label.verticalAlign = Label.VerticalAlign.CENTER;
        
        return node;
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
    
    // ========== 便捷查詢 API（自動處理座標轉換）==========
    
    /**
     * 用玩家視角座標查詢格子數據
     * 便捷方法，內部自動獲取 viewTransformer 並轉換座標
     * 
     * @param r 玩家視角下的行索引
     * @param c 玩家視角下的列索引
     * @param playerType 當前玩家類型 (0:Blue, 1:Red, 2:Green, 3:Yellow)
     * @returns 格子數據，如果未初始化或越界則返回 null
     * 
     * 使用範例：
     * ```typescript
     * // 查詢當前玩家視角下 [5, 5] 位置的格子
     * const grid = factoryManager.queryGridInPlayerView(5, 5, currentPlayerType);
     * if (grid) {
     *     console.log('格子狀態:', GridState[grid.state]);
     * }
     * ```
     */
    public queryGridInPlayerView(
        r: number, 
        c: number, 
        playerType: number
    ): IGridData | null {
        const viewTransformer = this.getViewTransformer();
        const mapCenter = this.getGameMapCenter();
        
        if (!viewTransformer || !mapCenter) {
            console.warn('[GameFactoryManager] ViewTransformer 或 MapCenter 未初始化');
            return null;
        }
        
        return mapCenter.getGridAtPlayerView(r, c, playerType, viewTransformer);
    }
    
    /**
     * 用玩家視角座標查詢格子狀態
     * 
     * @param r 玩家視角下的行索引
     * @param c 玩家視角下的列索引
     * @param playerType 當前玩家類型
     * @returns 格子狀態
     */
    public getGridStateInPlayerView(
        r: number, 
        c: number, 
        playerType: number
    ): GridState | null {
        const viewTransformer = this.getViewTransformer();
        const mapCenter = this.getGameMapCenter();
        
        if (!viewTransformer || !mapCenter) {
            return null;
        }
        
        return mapCenter.getGridStateInPlayerView(r, c, playerType, viewTransformer);
    }
    
    /**
     * 用玩家視角座標檢查格子是否為空
     * 
     * @param r 玩家視角下的行索引
     * @param c 玩家視角下的列索引
     * @param playerType 當前玩家類型
     * @returns 是否為空
     */
    public isGridEmptyInPlayerView(
        r: number, 
        c: number, 
        playerType: number
    ): boolean {
        const viewTransformer = this.getViewTransformer();
        const mapCenter = this.getGameMapCenter();
        
        if (!viewTransformer || !mapCenter) {
            return false;
        }
        
        return mapCenter.isGridEmptyInPlayerView(r, c, playerType, viewTransformer);
    }
    
    /**
     * 用玩家視角座標檢查格子是否被占據
     * 
     * @param r 玩家視角下的行索引
     * @param c 玩家視角下的列索引
     * @param playerType 當前玩家類型
     * @returns 是否被占據
     */
    public isGridOccupiedInPlayerView(
        r: number, 
        c: number, 
        playerType: number
    ): boolean {
        const viewTransformer = this.getViewTransformer();
        const mapCenter = this.getGameMapCenter();
        
        if (!viewTransformer || !mapCenter) {
            return false;
        }
        
        return mapCenter.isGridOccupiedInPlayerView(r, c, playerType, viewTransformer);
    }
    
    /**
     * 用玩家視角座標獲取格子上的棋子
     * 
     * @param r 玩家視角下的行索引
     * @param c 玩家視角下的列索引
     * @param playerType 當前玩家類型
     * @returns 棋子陣列
     */
    public getPawnsInPlayerView(
        r: number, 
        c: number, 
        playerType: number
    ): any[] {
        const viewTransformer = this.getViewTransformer();
        const mapCenter = this.getGameMapCenter();
        
        if (!viewTransformer || !mapCenter) {
            return [];
        }
        
        return mapCenter.getPawnsAtPlayerView(r, c, playerType, viewTransformer);
    }
    
    /**
     * 用玩家視角座標獲取格子的標記
     * 
     * @param r 玩家視角下的行索引
     * @param c 玩家視角下的列索引
     * @param playerType 當前玩家類型
     * @returns 標記陣列
     */
    public getMarkersInPlayerView(
        r: number, 
        c: number, 
        playerType: number
    ): IMarker[] {
        const viewTransformer = this.getViewTransformer();
        const mapCenter = this.getGameMapCenter();
        
        if (!viewTransformer || !mapCenter) {
            return [];
        }
        
        return mapCenter.getMarkersInPlayerView(r, c, playerType, viewTransformer);
    }
    
    /**
     * 用玩家視角座標檢查是否有特定標記
     * 
     * @param r 玩家視角下的行索引
     * @param c 玩家視角下的列索引
     * @param markerType 標記類型
     * @param playerType 當前玩家類型
     * @returns 是否有該標記
     */
    public hasMarkerInPlayerView(
        r: number, 
        c: number, 
        markerType: MarkerType, 
        playerType: number
    ): boolean {
        const viewTransformer = this.getViewTransformer();
        const mapCenter = this.getGameMapCenter();
        
        if (!viewTransformer || !mapCenter) {
            return false;
        }
        
        return mapCenter.hasMarkerInPlayerView(r, c, markerType, playerType, viewTransformer);
    }
    
    /**
     * 用玩家視角座標獲取格子的世界坐標
     * 
     * @param r 玩家視角下的行索引
     * @param c 玩家視角下的列索引
     * @param playerType 當前玩家類型
     * @returns 世界坐標
     */
    public getPositionInPlayerView(
        r: number, 
        c: number, 
        playerType: number
    ): Vec3 | null {
        const viewTransformer = this.getViewTransformer();
        const mapCenter = this.getGameMapCenter();
        
        if (!viewTransformer || !mapCenter) {
            return null;
        }
        
        return mapCenter.getPositionAtPlayerView(r, c, playerType, viewTransformer);
    }
    
    /**
     * 用玩家視角座標獲取格子節點
     * 
     * @param r 玩家視角下的行索引
     * @param c 玩家視角下的列索引
     * @param playerType 當前玩家類型
     * @returns 格子節點
     */
    public getNodeInPlayerView(
        r: number, 
        c: number, 
        playerType: number
    ): Node | null {
        const viewTransformer = this.getViewTransformer();
        const mapCenter = this.getGameMapCenter();
        
        if (!viewTransformer || !mapCenter) {
            return null;
        }
        
        return mapCenter.getNodeAtPlayerView(r, c, playerType, viewTransformer);
    }
}
