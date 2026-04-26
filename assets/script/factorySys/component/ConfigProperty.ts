import { Vec3, Vec2, Prefab, Component, Node, _decorator, SpriteFrame, CCBoolean, Enum, CCInteger } from 'cc';
import { LudoGameMode } from '../../gameDef/GameDef';
import { IGameModeConfig } from '../defs/GameModeFactoryDef';
import { IBoardConfig, IBoardResourceConfig, ICreateBoardConfig, BoardGenerateMode } from '../defs/board/FactoryDef';
import { IPathConfig } from '../defs/path/PathFactoryDef';
import { MarkerType } from '../../gameMap/def/GameMapDef';


const { ccclass, property } = _decorator;

export enum BoardFactoryType {
    TYPE_CLASSIC = 0,
    TYPE_QUICK = 1
}

Enum(BoardFactoryType);

export enum GameModePropertyType {
    MODE_CLASSIC = 0,
    MODE_QUICK = 1
}

Enum(GameModePropertyType);

/**
 * 棋盤配置組
 * 包含棋盤相關的所有配置參數（資源 + 邏輯）
 */
@ccclass('BoardConfigGroup')
export class BoardConfigGroup {
    
    // ========== 棋盤資源配置 ==========
    
    @property({ 
        type: Prefab,
        tooltip: '格子預製件（可選）',
        visible: function() { return this.generateMode === BoardGenerateMode.PREFAB_GRID; }
    })
    gridPrefab?: Prefab = null;
    
    @property({ 
        type: SpriteFrame,
        tooltip: '棋盤背景圖片的 SpriteFrame（可選）',
        visible: function() { return this.useBgBoard; }
    })
    bgSpriteFrame?: SpriteFrame = null;
    
    @property({ 
        type: Node,
        tooltip: '棋盤生成的父節點'
    })
    boardContainerNode?: Node = null;
    
    @property({ 
        type: Node,
        tooltip: '背景容器節點（可選）',
        visible: function() { return this.useBgBoard; }
    })
    bgContainerNode?: Node = null;
    
    // ========== 棋盤邏輯配置 ==========
    
    @property({ 
        tooltip: '棋盤網格大小（如 15 表示 15x15）'
    })
    gridSize: number = 15;
    
    @property({ 
        tooltip: '單個格子的視覺大小（像素）'
    })
    cellSize: number = 48;
    
    @property({ 
        tooltip: '棋盤容器的高度（像素），用於計算格子間距'
    })
    boardHeight: number = 720;
    
    @property({ 
        type: Enum(BoardGenerateMode),
        tooltip: '棋盤生成模式：PREFAB_GRID=使用預製件(可視化), POS_ONLY=只計算座標(最輕量), DYNAMIC_GRID=動態空節點(推薦)'
    })
    generateMode: BoardGenerateMode = BoardGenerateMode.DYNAMIC_GRID;
    
    @property({ 
        tooltip: '是否使用背景圖片'
    })
    useBgBoard: boolean = false;
    
    /**
     * 轉換為 ICreateBoardConfig 介面
     */
    toICreateBoardConfig(): ICreateBoardConfig {
        return {
            boardResourceConfig: {
                gridPrefab: this.gridPrefab,
                bgSpriteFrame: this.bgSpriteFrame,
                boardContainerNode: this.boardContainerNode,
                bgContainerNode: this.bgContainerNode
            },
            boardConfig: {
                gridSize: this.gridSize,
                cellSize: this.cellSize,
                boardHeight: this.boardHeight,
                generateMode: this.generateMode,
                useBgBoard: this.useBgBoard
            }
        };
    }
}

/**
 * 地圖裝飾配置組
 * 定義地圖上需要裝飾的格子位置和類型
 * 陣列上面的index對應玩家類型>>
 * (0:Blue, 1:Red, 2:Green, 3:Yellow)
 * 這是為旋轉棋盤視角做準備的，確保每個玩家的起點都能有對應的裝飾配置
 */
@ccclass('MapDecorationConfigGroup')
export class MapDecorationConfigGroup {

    // ========== 起點配置 ==========
    @property({ 
        type: Enum(MarkerType),
        tooltip: '地圖裝飾類型（影響格子標記的類型）'
    })
    mapMarkerMode: MarkerType = MarkerType.START;

    @property({
        type: [Vec2], 
        displayName: '玩家起點座標',
        tooltip: '玩家起點座標列表',
        visible: function(this: MapDecorationConfigGroup) { 
            return this.mapMarkerMode === MarkerType.START; 
        }
    })
    public startPoints: Vec2[] = [
        new Vec2(1, 6), 
        new Vec2(6, 13), 
        new Vec2(13, 8), 
        new Vec2(8, 1)
    ];

    // ========== 箭頭裝飾 ==========
    // 修正：如果你想在面板手動輸入座標，建議繼續使用 Vec2 陣列
    // 如果硬要用 number[]，面板只會顯示一長串數字，不直觀。
    @property({
        type: [Vec2],
        displayName: '箭頭裝飾位置',
        tooltip: '箭頭裝飾的格子座標 (x=row, y=col)',
        // 當模式為 ARROW 時才顯示
        visible: function(this: MapDecorationConfigGroup) { 
            return this.mapMarkerMode === MarkerType.ARROW; 
        }
    })
    public arrowPositions: Vec2[] = [];

   

    // ========== 安全裝飾 ==========
    @property({
        type: [Vec2],
        displayName: '安全裝飾位置',
        tooltip: '安全裝飾的格子座標 (x=row, y=col)',
        // 當模式為 SAFE 時才顯示
        visible: function(this: MapDecorationConfigGroup) { 
            return this.mapMarkerMode === MarkerType.SAFE; 
        }
    })
    //public starPositions: Vec2[] = [];
    public safePositions: Vec2[] = [];

    // ========== 禁止符號裝飾 ==========
    @property({
        type: [Vec2],
        displayName: '禁止符號位置',
        tooltip: '禁止符號裝飾的格子座標 (x=row, y=col)',
        // 當模式為 FORBIDDEN 時才顯示
        visible: function(this: MapDecorationConfigGroup) { 
            return this.mapMarkerMode === MarkerType.FORBIDDEN; 
        }
    })
    public forbiddenPositions: Vec2[] = [];

    // 新增的 Icon 屬性
    @property({
        type: SpriteFrame,
        displayName: '禁止符號圖示',
        tooltip: '要顯示的禁止符號圖片',
        visible: function(this: MapDecorationConfigGroup) { 
            return this.mapMarkerMode === MarkerType.FORBIDDEN; 
        }
    })
    public forbiddenIcon: SpriteFrame | null = null;

    @property({
        displayName: '禁止符號圖示大小',
        tooltip: '禁止符號圖示的大小',
        visible: function(this: MapDecorationConfigGroup) { 
            return this.mapMarkerMode === MarkerType.FORBIDDEN; 
        }
    })
    public forbiddenSize:number = 0;
    
    
    @property({
        type: SpriteFrame,
        displayName: '安全符號圖示',
        tooltip: '要顯示的安全符號圖片',
        visible: function(this: MapDecorationConfigGroup) { 
            return this.mapMarkerMode === MarkerType.SAFE; 
        }
    })
    public safeIcon: SpriteFrame | null = null;

    @property({
        displayName: '安全符號圖示大小',
        tooltip: '安全符號圖示的大小',
        visible: function(this: MapDecorationConfigGroup) { 
            return this.mapMarkerMode === MarkerType.SAFE; 
        }
    })
    public safeSize:number = 0;

     @property({
        type: SpriteFrame,
        displayName: '箭頭符號圖示',
        tooltip: '要顯示的箭頭符號圖片',
        visible: function(this: MapDecorationConfigGroup) { 
            return this.mapMarkerMode === MarkerType.ARROW; 
        }
    })
    public arrowIcon: SpriteFrame | null = null;

    @property({
        displayName: '箭頭符號圖示大小',
        tooltip: '箭頭符號圖示的大小',
        visible: function(this: MapDecorationConfigGroup) { 
            return this.mapMarkerMode === MarkerType.ARROW; 
        }
    })
    public arrowSize:number = 0;

    /**
     * 只提取當前模式相關的資料
     */
    toFilteredConfig() {
        // 基本資料：模式
        const config: any = {
            mapMarkerMode: this.mapMarkerMode
        };

        // 根據模式動態加入欄位
        switch (this.mapMarkerMode) {
            case MarkerType.START:
                config.startPoints = this.startPoints;
                break;
            case MarkerType.ARROW:
                config.arrowPositions = this.arrowPositions;
                config.arrowIcon = this.arrowIcon; // 儲存資源名稱或 UUID
                config.arrowSize = this.arrowSize;
                break;
            case MarkerType.SAFE:
                config.safePositions = this.safePositions;
                config.safeIcon = this.safeIcon;
                config.safeSize = this.safeSize;

                break;
            case MarkerType.FORBIDDEN:
                config.forbiddenPositions = this.forbiddenPositions;
                config.forbiddenIcon = this.forbiddenIcon;
                config.forbiddenSize = this.forbiddenSize;
                break;
        }

        return config;
    }
}

/**
 * 房間配置組
 * 包含房間相關的配置參數，如玩家數量、座位配置等
 * 這些配置通常不會頻繁變動，但也不是完全固定的，可以根據需要調整
 */
@ccclass('RoomConfigGroup')
export class RoomConfigGroup {
    
    // ========== 玩家數量配置 ==========
    
    // 1. 定義一個私有變數來儲存實際數值
    @property
    private _playerCount: number = 0;

    // 2. 使用 get/set 暴露給面板
    @property({ 
        type:  CCInteger,
        tooltip: '玩家數量，修改後會自動同步下方椅子座標數量'
    })
    set playerCount(value: number) {
        this._playerCount = value;
        
        // --- 自動調整陣列長度的邏輯 ---
        
        // 如果新長度比舊的大，補上新的 Vec2
        if (this.chairs.length < value) {
            const diff = value - this.chairs.length;
            for (let i = 0; i < diff; i++) {
                this.chairs.push(new Vec2(0, 0));
            }
        } 
        // 如果新長度比舊的小，刪除多餘的
        else if (this.chairs.length > value) {
            this.chairs.length = value;
        }
        
        console.log(`已自動更新椅子數量至: ${this.chairs.length}`);
    }

    get playerCount(): number {
        return this._playerCount;
    }

    // ========== 座位配置 ==========
    
    @property({
        type: [Vec2],
        displayName: '椅子位置',
        tooltip: '根據玩家數量自動生成的座標列表 (索引對應顏色: 0:Blue, 1:Red, 2:Green, 3:Yellow)',
    })
    public chairs: Vec2[] = [];
    
    // ========== 面板資源配置 ==========
    
    @property({
        type: Prefab,
        tooltip: '玩家面板預製件'
    })
    public playerPanelPrefab: Prefab | null = null;
    
    @property({
        type: Node,
        tooltip: '面板容器節點（所有玩家面板的父節點）'
    })
    public panelContainer: Node | null = null;
}

/**
 * 路徑配置組
 * 包含路徑生成相關的配置參數
 */
@ccclass('PathConfigGroup')
export class PathConfigGroup {
    
    @property({ 
        tooltip: '玩家數量（預設 4）'
    })
    playerCount: number = 4;
    
    @property({ 
        tooltip: '外圈路徑長度（標準 Ludo 遊戲為 52 格）'
    })
    outerPathLength: number = 52;
    
    @property({ 
        tooltip: '內線路徑長度（標準 Ludo 遊戲為 6 格）'
    })
    innerPathLength: number = 6;
    
    @property({ 
        tooltip: '基地坑位 ID 起始值（預設 -1，負數）'
    })
    baseSlotIdOffset: number = -1;
    
    @property({ 
        tooltip: '每個玩家的坑位數量（預設 4）'
    })
    slotsPerPlayer: number = 4;
    
    /**
     * 轉換為 IPathConfig 介面
     * @param gridSize 從棋盤配置中獲取的網格大小
     */
    toIPathConfig(gridSize: number): IPathConfig {
        return {
            gridSize: gridSize,
            playerCount: this.playerCount,
            outerPathLength: this.outerPathLength,
            innerPathLength: this.innerPathLength,
            baseSlotIdOffset: this.baseSlotIdOffset,
            slotsPerPlayer: this.slotsPerPlayer
        };
    }
}

/**
 * 遊戲模式配置
 * 可在 Cocos Creator 編輯器面板上設定，用於生成 IGameModeConfig
 */
@ccclass('GameModeConfig')
export class GameModeConfig {
    
    // ========== 基本配置 ==========
    
    @property({ 
        type: Enum(GameModePropertyType),
        tooltip: '遊戲模式類型（編輯器配置用）'
    })
    gameMode: GameModePropertyType = GameModePropertyType.MODE_CLASSIC;
    
    @property({ 
        type: Enum(BoardFactoryType),
        tooltip: '選擇棋盤工廠類型'
    })
    factoryType: BoardFactoryType = BoardFactoryType.TYPE_CLASSIC;
    
    // ========== 配置組 ==========
    
    @property({ 
        type: BoardConfigGroup,
        tooltip: '棋盤配置（包含資源和邏輯參數）'
    })
    boardConfig: BoardConfigGroup = new BoardConfigGroup();
    
    @property({ 
        type: PathConfigGroup,
        tooltip: '路徑配置（路徑生成參數）'
    })
    pathConfig: PathConfigGroup = new PathConfigGroup();

    @property({ 
        type: [RoomConfigGroup],
        tooltip: '房間配置（玩家數量和座位配置）'
    })
    roomConfig: RoomConfigGroup[] = [new RoomConfigGroup()];
    
    @property({ 
        type: [MapDecorationConfigGroup],
        tooltip: '地圖裝飾配置（裝飾圖示和起點設定）'
    })
    mapDecorationConfig: MapDecorationConfigGroup[] = [new MapDecorationConfigGroup()];
    
    /**
     * 轉換為 IGameModeConfig 介面
     * 用於傳遞給工廠類
     */
    toIGameModeConfig(): IGameModeConfig {
        return {
            gameMode: this.convertToLudoGameMode(),
            boardConfig: this.boardConfig.toICreateBoardConfig(),
            pathConfig: this.pathConfig.toIPathConfig(this.boardConfig.gridSize)
        };
    }
    
    /**
     * 編輯器枚舉 → 運行時枚舉
     * 將 GameModePropertyType 轉換為 LudoGameMode
     */
    private convertToLudoGameMode(): LudoGameMode {
        switch (this.gameMode) {
            case GameModePropertyType.MODE_CLASSIC:
                return LudoGameMode.CLASSIC;
            case GameModePropertyType.MODE_QUICK:
                return LudoGameMode.QUICK;
            default:
                return LudoGameMode.CLASSIC;
        }
    }
}

// 保留舊的類別名稱以向後兼容（已棄用）
/**
 * @deprecated 請使用 GameModeConfig 代替
 */
@ccclass('GameModeFactoryConfig')
export class GameModeFactoryConfig extends GameModeConfig {
}
