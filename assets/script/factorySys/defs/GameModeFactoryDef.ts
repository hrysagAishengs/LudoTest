// ===== gameDef/GameModeFactoryDef.ts =====

import { LudoGameMode } from '../../gameDef/GameDef';
import { IBoardConfig, IBoardGenerator, ICreateBoardConfig } from './board/FactoryDef';
import { IPathConfig, IPathGenerator, IViewTransformer } from './path/PathFactoryDef';
import { Vec3, Prefab, SpriteFrame, Node } from 'cc';
import { IPlayerSeating } from './seat/SeatFactoryDef';

/**
 * 棋盤資源配置
 * 定義棋盤生成所需的資源參數
 */
/*
export interface IBoardResourceConfig {
    //格子預製件（可選
    gridPrefab?: Prefab;
    ///背景圖片（可選
    bgSpriteFrame?: SpriteFrame;
    //棋盤容器節點（可選）
    boardContainerNode?: Node;
    //背景容器節點（可選
    bgContainerNode?: Node;
}*/

/**
 * 棋盤配置參數
 */
/*
export interface IBoardConfig {
    //棋盤網格大小（如 15x15）
    gridSize: number;
    //單個格子的視覺大小（像素）
    cellSize: number;
    //棋盤容器的高度（像素），用於計算格子間距
    boardHeight: number;
    //是否使用格子預製件來生成棋盤
    useGridPrefab: boolean;
    //是否使用背景圖片 
    useBgBoard: boolean;
}
*/
/**
 * 路徑配置參數
 */
/*
export interface IPathConfig {
    //玩家數量
    playerCount: number;
    //外圈路徑長度（標準 Ludo 為 52 格
    outerPathLength: number;
    //內線路徑長度（標準 Ludo 為 6 格
    innerPathLength: number;
}*/

/**
 * 玩家座位配置參數
 */
/*
export interface ISeatingConfig {
    //最大玩家數
    maxPlayers: number;
    //座位布局類型
    layoutType: 'cross' | 'circle' | 'square';
    //是否支持視角旋轉
    enableViewRotation: boolean;
}*/

/**
 * 遊戲模式配置
 * 包含該模式下所有組件的配置參數
 * 
 * 使用範例：
 * ```typescript
 * const config: IGameModeConfig = {
 *   gameMode: LudoGameMode.CLASSIC,
 *   boardConfig: { gridSize: 15, cellSize: 50, ... },
 *   pathConfig: { playerCount: 4, ... },
 *   seatingConfig: { maxPlayers: 4, layoutType: 'cross', ... }
 * };
 * ```
 */
export interface IGameModeConfig {
    /** 遊戲模式類型 */
    gameMode: LudoGameMode;
    
    /** 棋盤配置 */
    boardConfig: ICreateBoardConfig;
    
    /** 路徑配置 */
    pathConfig: IPathConfig;
    
    /** 玩家座位配置 */
    //seatingConfig: ISeatingConfig;
    
    // ========== 未來可擴展的配置 ==========
    
    /** 規則引擎配置（可選） */
    // ruleConfig?: IRuleConfig;
    
    /** UI佈局配置（可選） */
    // uiConfig?: IUIConfig;
    
    /** 動畫配置（可選） */
    // animationConfig?: IAnimationConfig;
}



/**
 * 遊戲組件集合
 * 包含該模式所需的所有組件實例
 * 
 * 組件分類：
 * - 核心組件：Board、Path（必須）
 * - 邏輯組件：Seating（必須）
 * - 擴展組件：Rule、UI、Animation（可選）
 */
export interface IGameComponents {
    // ========== 核心組件（必須） ==========
    
    /** 棋盤生成器 */
    boardGenerator: IBoardGenerator;
    
    /** 路徑生成器 */
    pathGenerator: IPathGenerator;
    
    /** 視角轉換器 */
    viewTransformer: IViewTransformer;
    
    // ========== 邏輯組件（必須） ==========
    
    /** 玩家座位管理器 */
    //playerSeating: IPlayerSeating;
    
    // ========== 擴展組件（可選） ==========
    
    /** 規則引擎（未來） */
    // ruleEngine?: IRuleEngine;
    
    /** UI佈局管理器（未來） */
    // uiLayout?: IUILayout;
    
    /** 動畫控制器（未來） */
    // animationController?: IAnimationController;
    
    /** 計分板（未來） */
    // scoreBoard?: IScoreBoard;
}

/**
 * 遊戲模式工廠抽象類
 * 
 * 職責：
 * 1. 管理遊戲組件的創建和銷毀
 * 2. 協調各個子工廠（BoardFactory、PathFactory 等）
 * 3. 確保組件按照正確的依賴順序創建
 * 
 * 設計模式：
 * - 抽象工廠模式：定義創建一系列相關組件的接口
 * - 組合模式：內部組合多個子工廠
 * - 模板方法模式：定義創建流程框架
 * 
 * 實現要求：
 * - 所有子類必須實現 configureSubFactories() 和 createGameComponents()
 * - 創建順序：Board → Path → Seating → 其他
 * - 必須處理創建失敗的情況
 * 
 * 使用範例：
 * ```typescript
 * class ClassicGameModeFactory extends GameModeFactory {
 *   protected configureSubFactories(): void {
 *     this._boardFactory.setMapConfig(...);
 *     this._pathFactory.setPathConfig(...);
 *   }
 *   
 *   public async createGameComponents(): Promise<IGameComponents> {
 *     const board = await this._boardFactory.createBoardGenerator();
 *     const path = this._pathFactory.createPathGenerator();
 *     const seating = PlayerSeatingFactory.createSeating(...);
 *     return { boardGenerator: board, pathGenerator: path, ... };
 *   }
 * }
 * ```
 */
export abstract class GameModeFactory {
    /** 當前遊戲模式配置 */
    protected _config: IGameModeConfig | null = null;
    
    /** 已創建的組件集合（緩存） */
    protected _components: IGameComponents | null = null;
    
    /**
     * 設置遊戲模式配置
     * 
     * 此方法會：
     * 1. 保存配置
     * 2. 調用 configureSubFactories() 配置所有子工廠
     * 
     * @param config 遊戲模式配置對象
     */
    public setConfig(config: IGameModeConfig): void {
        this._config = config;
        this.configureSubFactories();
    }
    
    /**
     * 配置所有子工廠
     * 
     * 子類必須實現此方法，將配置分發到各個子工廠。
     * 
     * 實現範例：
     * ```typescript
     * protected configureSubFactories(): void {
     *   this._boardFactory.setMapConfig({
     *     gameMode: this._config.gameMode,
     *     gridSize: this._config.boardConfig.gridSize,
     *     ...
     *   });
     *   
     *   this._pathFactory.setPathConfig({
     *     gameMode: this._config.gameMode,
     *     playerCount: this._config.pathConfig.playerCount,
     *     ...
     *   });
     * }
     * ```
     */
    protected abstract configureSubFactories(): void;
    
    /**
     * 創建遊戲模式的所有組件
     * 
     * 必須按照依賴順序創建：
     * 1. Board（基礎，無依賴）
     * 2. Path（依賴 Board 的格子大小等）
     * 3. Seating（依賴玩家數量）
     * 4. 其他組件（依賴前面的組件）
     * 
     * @returns Promise<IGameComponents> 創建的組件集合
     * @throws Error 如果配置未設置或創建失敗
     * 
     * 實現範例：
     * ```typescript
     * public async createGameComponents(): Promise<IGameComponents> {
     *   if (!this._config) {
     *     throw new Error('配置未設置');
     *   }
     *   
     *   // 1. 創建棋盤
     *   const boardGenerator = await this._boardFactory.createBoardGenerator();
     *   
     *   // 2. 創建路徑
     *   const pathGenerator = this._pathFactory.createPathGenerator();
     *   const viewTransformer = this._pathFactory.createViewTransformer();
     *   
     *   // 3. 創建座位
     *   const playerSeating = PlayerSeatingFactory.createSeating(
     *     this._config.seatingConfig.layoutType
     *   );
     *   playerSeating.initializeSeats();
     *   
     *   return { boardGenerator, pathGenerator, viewTransformer, playerSeating };
     * }
     * ```
     */
    public abstract createGameComponents(): Promise<IGameComponents>;
    
    /**
     * 獲取特定組件
     * 
     * 用於延遲加載或獲取單個組件的場景。
     * 
     * @param componentName 組件名稱
     * @returns 組件實例，如果未創建則返回 null
     * 
     * 使用範例：
     * ```typescript
     * const board = factory.getComponent('boardGenerator');
     * const path = factory.getComponent('pathGenerator');
     * ```
     */
    public getComponent<T extends keyof IGameComponents>(
        componentName: T
    ): IGameComponents[T] | null {
        return this._components?.[componentName] ?? null;
    }
    
    /**
     * 獲取所有組件
     * 
     * @returns 所有已創建的組件，如果未創建則返回 null
     */
    public getAllComponents(): IGameComponents | null {
        return this._components;
    }
    
    /**
     * 銷毀遊戲組件
     * 
     * 此方法會：
     * 1. 調用各個子工廠的銷毀方法
     * 2. 清空組件緩存
     * 3. 釋放資源
     * 
     * 實現範例：
     * ```typescript
     * public destroyGameComponents(): void {
     *   this._boardFactory.destroyBoardGenerator();
     *   this._pathFactory.destroyPathGenerator();
     *   this._components = null;
     *   console.log('組件已銷毀');
     * }
     * ```
     */
    public abstract destroyGameComponents(): void;
    
    /**
     * 獲取當前配置
     * 
     * @returns 當前的遊戲模式配置，如果未設置則返回 null
     */
    public getConfig(): IGameModeConfig | null {
        return this._config;
    }
}

/**
 * 組件創建選項
 * 用於控制組件的創建行為
 */
/*
export interface IComponentCreateOptions {
    //是否強制重新創建（即使已存在
    forceRecreate?: boolean;
    
    //是否跳過初始化
    skipInitialization?: boolean;
    
    //自定義資源配置
    customResources?: IBoardResourceConfig;
}*/

/**
 * 工廠狀態枚舉
 */
export enum FactoryState {
    /** 未初始化 */
    UNINITIALIZED = 0,
    /** 配置中 */
    CONFIGURING = 1,
    /** 已配置 */
    CONFIGURED = 2,
    /** 創建中 */
    CREATING = 3,
    /** 已創建 */
    CREATED = 4,
    /** 銷毀中 */
    DESTROYING = 5,
    /** 已銷毀 */
    DESTROYED = 6,
    /** 錯誤 */
    ERROR = -1
}

/**
 * 
 * // 1. 定义配置
const config: IGameModeConfig = {
    gameMode: LudoGameMode.CLASSIC,
    boardConfig: { gridSize: 15, ... },
    pathConfig: { playerCount: 4, ... },
    seatingConfig: { maxPlayers: 4, layoutType: 'cross', ... }
};

// 2. 设置配置
factory.setConfig(config);

// 3. 创建组件
const components = await factory.createGameComponents();

// 4. 使用组件
components.boardGenerator.getCellPosition(0, 0);
components.playerSeating.getSeatIndex(0);
 */