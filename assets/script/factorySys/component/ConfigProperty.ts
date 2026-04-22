import { Vec3, Prefab, Component, Node, _decorator, SpriteFrame, CCBoolean, Enum } from 'cc';
import { LudoGameMode } from '../../gameDef/GameDef';
import { IGameModeConfig } from '../defs/GameModeFactoryDef';
import { IBoardConfig, IBoardResourceConfig, ICreateBoardConfig } from '../defs/board/FactoryDef';
import { IPathConfig } from '../defs/path/PathFactoryDef';

const { ccclass, property } = _decorator;

export enum BoardFactoryType {
    CLASSIC = 'Basic',
    QUICK = 'Quick'
}

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
        visible: function() { return this.useGridPrefab; }
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
    
    @property({ 
        tooltip: '是否只生成座標格子，不建立實際節點'
    })
    usePosGridOnly: boolean = false;
    
    // ========== 棋盤邏輯配置 ==========
    
    @property({ 
        tooltip: '棋盤網格大小（如 15 表示 15x15）'
    })
    gridSize: number = 15;
    
    @property({ 
        tooltip: '單個格子的視覺大小（像素）'
    })
    cellSize: number = 50;
    
    @property({ 
        tooltip: '棋盤容器的高度（像素），用於計算格子間距'
    })
    boardHeight: number = 720;
    
    @property({ 
        tooltip: '是否使用格子預製件來生成棋盤'
    })
    useGridPrefab: boolean = false;
    
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
                bgContainerNode: this.bgContainerNode,
                usePosGridOnly: this.usePosGridOnly
            },
            boardConfig: {
                gridSize: this.gridSize,
                cellSize: this.cellSize,
                boardHeight: this.boardHeight,
                useGridPrefab: this.useGridPrefab,
                useBgBoard: this.useBgBoard
            }
        };
    }
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
    
    /**
     * 轉換為 IPathConfig 介面
     * @param gridSize 從棋盤配置中獲取的網格大小
     */
    toIPathConfig(gridSize: number): IPathConfig {
        return {
            gridSize: gridSize,
            playerCount: this.playerCount,
            outerPathLength: this.outerPathLength,
            innerPathLength: this.innerPathLength
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
        type: Enum(LudoGameMode),
        tooltip: '遊戲模式類型'
    })
    gameMode: LudoGameMode = LudoGameMode.CLASSIC;
    
    @property({ 
        type: Enum(BoardFactoryType),
        tooltip: '選擇棋盤工廠類型'
    })
    factoryType: BoardFactoryType = BoardFactoryType.CLASSIC;
    
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
    
    /**
     * 轉換為 IGameModeConfig 介面
     * 用於傳遞給工廠類
     */
    toIGameModeConfig(): IGameModeConfig {
        return {
            gameMode: this.gameMode,
            boardConfig: this.boardConfig.toICreateBoardConfig(),
            pathConfig: this.pathConfig.toIPathConfig(this.boardConfig.gridSize)
        };
    }
}

// 保留舊的類別名稱以向後兼容（已棄用）
/**
 * @deprecated 請使用 GameModeConfig 代替
 */
@ccclass('GameModeFactoryConfig')
export class GameModeFactoryConfig extends GameModeConfig {
}
