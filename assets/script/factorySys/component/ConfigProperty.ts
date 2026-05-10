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
 * 定義常見的桌型名稱，方便在面板快速選擇
 */
export enum TableTypeTag {
    TWO_PLAYER_MINI = 0,
    FOUR_PLAYER_CLASSIC = 1,
    SIX_PLAYER_DELUXE = 2,
    CUSTOM = 3
}
Enum(TableTypeTag);

//--NEW 20260509
export enum MarkerDirection {
    NONE = 0,           // 無方向
    UP = 1,              // 向上
    RIGHT = 2,           // 向右
    DOWN = 3,            // 向下
    LEFT = 4             // 向左
}
Enum(MarkerDirection);

export enum MapDecorationItemType {
    ARROW = 0,
    SAFE = 1,
    FORBIDDEN = 2
}
Enum(MapDecorationItemType);

export enum DecorationAssetType {
    NONE = 0,
    SPRITE_FRAME = 1,
    PREFAB = 2
}
Enum(DecorationAssetType);

export enum RoomAlignMode {
    POSITION = 0,
    WIDGET = 1,
}
Enum(RoomAlignMode);

export enum RoomPanelCreateMode {
    SINGLE_PANEL_PER_PLAYER = 0,
    SHARED_PANEL_CONTAINER = 1,
}
Enum(RoomPanelCreateMode);

export enum AlignMode{
    VERTICAL = 0,
    HORIZONTAL = 1,
}
Enum(AlignMode);

export enum VerticalAlignType {
    TOP = 0,
    CENTER = 1,
    BOTTOM = 2,
}
Enum(VerticalAlignType);

export enum HorizontalAlignType {
    LEFT = 0,
    CENTER = 1,
    RIGHT = 2,
}
Enum(HorizontalAlignType);


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


@ccclass('MapDecorationItem')
export class MapDecorationItem {
    
    @property({
        type: Vec2,
        displayName: '位置'
    })
    position: Vec2 = new Vec2(0, 0);

    @property({
        type: MarkerDirection,
        displayName: '方向',
    })
    direction: MarkerDirection = MarkerDirection.NONE;

    @property({
        type: DecorationAssetType,
        displayName: '資源類型'
    })
    assetType: DecorationAssetType = DecorationAssetType.SPRITE_FRAME;

    @property({
        type: SpriteFrame,
        displayName: 'SpriteFrame',
        visible: function(this: MapDecorationItem) {
            return this.assetType === DecorationAssetType.SPRITE_FRAME;
        }
    })
    spriteFrame: SpriteFrame | null = null;

    @property({
        type: Prefab,
        displayName: 'Prefab',
        visible: function(this: MapDecorationItem) {
            return this.assetType === DecorationAssetType.PREFAB;
        }
    })
    prefab: Prefab | null = null;

    @property({
        displayName: '大小'
    })
    size: number = 48;
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

    //---20260509 新增通用裝飾配置，包含箭頭、安全區、禁止符號等，根據 mapMarkerMode 顯示對應的配置欄位
    @property({ type: [MapDecorationItem] })
    decorations: MapDecorationItem[] = [];

    toFilteredConfig() {
        const config: any = {
            mapMarkerMode: this.mapMarkerMode
        };

        switch (this.mapMarkerMode) {
            case MarkerType.START:
                config.startPoints = this.startPoints;
                break;

            case MarkerType.ARROW: {
                const items = this.getDecorationItems();
                const first = items[0];

                config.arrowPositions = items;
                config.arrowIcon = first?.assetType === DecorationAssetType.PREFAB
                    ? first.prefab
                    : first?.spriteFrame ?? null;
                config.arrowSize = first?.size ?? 48;
                break;
            }

            case MarkerType.SAFE: {
                const items = this.getDecorationItems();
                const first = items[0];

                config.safePositions = items.map(item => item.position);
                config.safeIcon = first?.assetType === DecorationAssetType.PREFAB
                    ? first.prefab
                    : first?.spriteFrame ?? null;
                config.safeSize = first?.size ?? 48;
                break;
            }

            case MarkerType.FORBIDDEN: {
                const items = this.getDecorationItems();
                const first = items[0];

                config.forbiddenPositions = items.map(item => item.position);
                config.forbiddenIcon = first?.assetType === DecorationAssetType.PREFAB
                    ? first.prefab
                    : first?.spriteFrame ?? null;
                config.forbiddenSize = first?.size ?? 48;
                break;
            }
        }

        return config;
    }

    /**
     * 2026-05-09
     * 依外層 mapMarkerMode 取用目前這組通用裝飾設定。
     * MapDecorationItem 不再保存 decorationType，裝飾類型由 MapDecorationConfigGroup.mapMarkerMode 決定。
     */
    private getDecorationItems(): MapDecorationItem[] {
        return this.decorations;
    }

}


@ccclass('WidgetInfo')
export class WidgetInfo {
    @property({
        type: Enum(VerticalAlignType),
        displayName: '垂直對齊類型',
        tooltip: '垂直方向的對齊類型'
    })
    verticalAlignType: VerticalAlignType = VerticalAlignType.CENTER;

    @property({
        type: Enum(HorizontalAlignType),
        displayName: '水平對齊類型',
        tooltip: '水平方向的對齊類型'
    })
    horizontalAlignType: HorizontalAlignType = HorizontalAlignType.CENTER;

    @property({
        type: Vec2,
        displayName: '錨點',
        tooltip: '玩家 UI 的 anchorPoint，例如左上為 (0, 1)，右下為 (1, 0)'
    })
    anchorPoint: Vec2 = new Vec2(0.5, 0.5);

    @property({
        type: CCInteger,
        displayName: '上方距離',
        tooltip: '垂直對齊為 TOP 時使用',
        visible: function(this: WidgetInfo) {
            return this.verticalAlignType === VerticalAlignType.TOP;
        }
    })
    top: number = 0;

    @property({
        type: CCInteger,
        displayName: '垂直置中偏移',
        tooltip: '垂直對齊為 CENTER 時使用',
        visible: function(this: WidgetInfo) {
            return this.verticalAlignType === VerticalAlignType.CENTER;
        }
    })
    verticalCenter: number = 0;

    @property({
        type: CCInteger,
        displayName: '下方距離',
        tooltip: '垂直對齊為 BOTTOM 時使用',
        visible: function(this: WidgetInfo) {
            return this.verticalAlignType === VerticalAlignType.BOTTOM;
        }
    })
    bottom: number = 0;

    @property({
        type: CCInteger,
        displayName: '左方距離',
        tooltip: '水平對齊為 LEFT 時使用',
        visible: function(this: WidgetInfo) {
            return this.horizontalAlignType === HorizontalAlignType.LEFT;
        }
    })
    left: number = 0;

    @property({
        type: CCInteger,
        displayName: '水平置中偏移',
        tooltip: '水平對齊為 CENTER 時使用',
        visible: function(this: WidgetInfo) {
            return this.horizontalAlignType === HorizontalAlignType.CENTER;
        }
    })
    horizontalCenter: number = 0;

    @property({
        type: CCInteger,
        displayName: '右方距離',
        tooltip: '水平對齊為 RIGHT 時使用',
        visible: function(this: WidgetInfo) {
            return this.horizontalAlignType === HorizontalAlignType.RIGHT;
        }
    })
    right: number = 0;

    @property({
        type: CCInteger,
        displayName: '間距',
        tooltip: '額外間距設定，會加到目前選擇的水平與垂直距離上'
    })
    margin: number = 0;
}



/**
 * 房間配置組
 * 包含房間相關的配置參數，如玩家數量、座位配置等
 * 這些配置通常不會頻繁變動，但也不是完全固定的，可以根據需要調整
 */
@ccclass('RoomConfigGroup')
export class RoomConfigGroup {
    // ========== 玩家數量配置 ==========

    @property
    private _playerCount: number = 0;

    @property({
        type: CCInteger,
        displayName: '玩家數量',
        tooltip: '玩家數量，修改後會自動同步座位設定數量'
    })
    set playerCount(value: number) {
        this._playerCount = value;
        this.syncSeatConfigLength(value);
    }

    get playerCount(): number {
        return this._playerCount;
    }

    @property({
        type: Enum(RoomAlignMode),
        displayName: '座位配置模式',
        tooltip: 'POSITION 使用座標配置，WIDGET 使用 Widget 對齊配置'
    })
    public roomAlignMode: RoomAlignMode = RoomAlignMode.POSITION;

    @property({
        type: Enum(RoomPanelCreateMode),
        displayName: 'Panel Create Mode',
        tooltip: 'SINGLE_PANEL_PER_PLAYER creates one prefab per player. SHARED_PANEL_CONTAINER creates one shared container and returns adapters.'
    })
    public panelCreateMode: RoomPanelCreateMode = RoomPanelCreateMode.SINGLE_PANEL_PER_PLAYER;

    // ========== Position 模式 ==========

    @property({
        type: [Vec2],
        displayName: '椅子位置',
        tooltip: 'POSITION 模式使用，依玩家數量自動同步長度',
        visible: function(this: RoomConfigGroup) {
            return this.roomAlignMode === RoomAlignMode.POSITION;
        }
    })
    public chairs: Vec2[] = [];

    // ========== Widget 模式 ==========

    @property({
        type: [WidgetInfo],
        displayName: 'Widget 對齊設定',
        tooltip: 'WIDGET 模式使用，依玩家數量自動同步長度',
        visible: function(this: RoomConfigGroup) {
            return this.roomAlignMode === RoomAlignMode.WIDGET;
        }
    })
    public widgets: WidgetInfo[] = [];

    // ========== 面板資源配置 ==========

    @property({
        type: Prefab,
        displayName: '玩家面板 Prefab',
        tooltip: '玩家面板預製件'
    })
    public playerPanelPrefab: Prefab | null = null;

    @property({
        type: Node,
        displayName: '面板容器',
        tooltip: '面板容器節點，所有玩家面板的父節點'
    })
    public panelContainer: Node | null = null;

    /**
     * 同步座位設定數量。
     * POSITION 與 WIDGET 兩套資料都同步，避免切換模式時資料數量不一致。
     */
    private syncSeatConfigLength(count: number): void {
        this.syncChairsLength(count);
        this.syncWidgetsLength(count);
    }

    /**
     * 同步 POSITION 模式座標數量。
     */
    private syncChairsLength(count: number): void {
        while (this.chairs.length < count) {
            this.chairs.push(new Vec2(0, 0));
        }

        if (this.chairs.length > count) {
            this.chairs.length = count;
        }
    }

    /**
     * 同步 WIDGET 模式設定數量。
     */
    private syncWidgetsLength(count: number): void {
        while (this.widgets.length < count) {
            this.widgets.push(new WidgetInfo());
        }

        if (this.widgets.length > count) {
            this.widgets.length = count;
        }
    }
}




/**
 * 路徑配置組
 * 包含路徑生成相關的配置參數
 */
@ccclass('PathConfigGroup')
export class PathConfigGroup {
    
    @property({ 
        type: CCBoolean, // 強制指定型別為 Boolean
        tooltip: '產生測試路徑編號'
    })
    useTestPathIndex: boolean = false; // 修正拼字並初始化


    @property({ 
        type: Prefab,
        tooltip: '測試路徑容器',
        visible: function() { return this.useTestPathIndex; }
    })
    debugPrefab?: Prefab = null;
    
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
            slotsPerPlayer: this.slotsPerPlayer,
            useTestPathIndex: this.useTestPathIndex
        };
    }
}


/**
 * 單個座位的詳細配置
 * 用於定義 15x15 網格中的基地範圍
 */
@ccclass('SeatAreaConfig')
export class SeatAreaConfig {
    @property({ 
        type: CCInteger, 
        displayName: '座位索引', 
        tooltip: '對應玩家編號 (0=Blue, 1=Red, 2=Green, 3=Yellow)' 
    })
    public seatIndex: number = 0;

    // --- 區域定義 (15x15 網格中的範圍) ---
    @property({ type: CCInteger, displayName: '起始 Row (Y)' })
    public startRow: number = 0;

    @property({ type: CCInteger, displayName: '起始 Col (X)' })
    public startCol: number = 0;

    @property({ type: CCInteger, displayName: '區域寬度' })
    public width: number = 6;

    @property({ type: CCInteger, displayName: '區域高度' })
    public height: number = 6;

    /**
     * 判定某個網格座標是否屬於此座位區域
     */
    public isInside(row: number, col: number): boolean {
        return row >= this.startRow && row < this.startRow + this.height &&
               col >= this.startCol && col < this.startCol + this.width;
    }
}

@ccclass('SeatConfigGroup')
export class SeatConfigGroup {

    @property({
        type: Enum(TableTypeTag),
        displayName: '桌型標籤',
        tooltip: '在配置列表裡方便一眼看出這是什麼模式的設定'
    })
    public tableTag: TableTypeTag = TableTypeTag.FOUR_PLAYER_CLASSIC;

    // ========== 開局人數配置 (與陣列長度連動) ==========

    @property
    private _activePlayerCount: number = 4;

    @property({
        type: CCInteger,
        displayName: '開局人數 (Mode)',
        tooltip: '此模式實際開啟的玩家人數，會自動增減下方的座位配置數量',
        range: [1, 6, 1]
    })
    set activePlayerCount(value: number) {
        this._activePlayerCount = value;

        // --- 自動調整 seats 陣列長度 ---
        if (this.seats.length < value) {
            const diff = value - this.seats.length;
            for (let i = 0; i < diff; i++) {
                const newSeat = new SeatAreaConfig();
                // 根據當前陣列長度自動賦予預設索引
                newSeat.seatIndex = this.seats.length;
                this.seats.push(newSeat);
            }
        } else if (this.seats.length > value) {
            this.seats.length = value;
        }
    }

    get activePlayerCount() {
        return this._activePlayerCount;
    }

    // ========== 座位詳細設定 ==========

    @property({
        type: [SeatAreaConfig],
        displayName: '啟用座位列表',
        tooltip: '此列表中的座位即為開啟狀態，未列出的則視為關閉/反灰'
    })
    public seats: SeatAreaConfig[] = [
        new SeatAreaConfig(),
        new SeatAreaConfig(),
        new SeatAreaConfig(),
        new SeatAreaConfig()
    ];

    /**
     * 獲取目前啟用的玩家索引列表 (例如 [0, 2])
     */
    public getActiveIndices(): number[] {
        return this.seats.map(s => s.seatIndex);
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
        tooltip: '房間玩家面板配置（玩家數量和面板配置）'
    })
    roomPanelConfig: RoomConfigGroup[] = [new RoomConfigGroup()];
    
    @property({ 
        type: [MapDecorationConfigGroup],
        tooltip: '地圖裝飾配置（裝飾圖示和起點設定）'
    })
    mapDecorationConfig: MapDecorationConfigGroup[] = [new MapDecorationConfigGroup()];
    
    @property({ 
        type: [SeatConfigGroup],
        tooltip: '棋盤座位配置（玩家基地範圍和位置設定）'
    })
    boardBaseConfig: SeatConfigGroup[] = [new SeatConfigGroup()];
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
