import { LudoGameMode } from "../../gameDef/GameDef";
import { IPathConfig, IPathGenerator, IViewTransformer, PathFactory } from "./def/PathFactoryDef";
import { BasicPathFactory } from "./factorys/BasicPathFactory";


/**
 * 路徑生成管理器
 * 
 * 職責：
 * 1. 管理不同遊戲模式的路徑工廠
 * 2. 提供統一的路徑操作 API
 * 3. 管理路徑生成器和視角轉換器的生命週期
 * 
 * 使用方式：
 * ```typescript
 * // 設置遊戲模式
 * pathManager.setGameMode(LudoGameMode.CLASSIC);
 * // 創建路徑生成器
 * await pathManager.createPathGenerator();
 * // 使用路徑
 * const bluePath = pathManager.getSinglePlayerPath(0);
 * ```
 */
export class PathManager {
    
    private _mapPathFactory: Map<LudoGameMode, PathFactory> = new Map();
    private _currentPathConfig: IPathConfig | null = null;
    private _currentPathGenerator: IPathGenerator | null = null;
    private _currentViewTransformer: IViewTransformer | null = null;

    // 工廠註冊表
    private readonly FACTORY_REGISTRY = new Map<LudoGameMode, new () => PathFactory>([
        [LudoGameMode.CLASSIC, BasicPathFactory],
        // [LudoGameMode.QUICK, QuickPathFactory], // 未來添加
    ]);

    public init():void{

    }

    // ========== 設置和創建路徑生成器 ==========
    /**
     * 設置遊戲模式
     * @param gameMode 遊戲模式
     */
    public setGameMode(gameMode: LudoGameMode): void {
        this._currentPathConfig = this.setGameModeConfig(gameMode);
    }


    /**
     * 創建路徑生成器
     * 異步方法，確保路徑完全生成後再返回
     */
    public async createPathGenerator(): Promise<void> {
        
        if (!this._currentPathConfig) {
            console.error("路徑配置未設置。請在創建路徑生成器之前先設置路徑配置。");
            return;
        }

        const factory = this.getPathFactory(this._currentPathConfig.gameMode);
        if (factory) {
            factory.setPathConfig(this._currentPathConfig);
            this._currentPathGenerator = factory.createPathGenerator();
            this._currentViewTransformer = factory.createViewTransformer();
            this.createPaths(); // 生成路徑並設置視角轉換器內容
            console.log('路徑生成器和視角轉換器創建成功');
        } else {
            console.error(`找不到遊戲模式 ${this._currentPathConfig.gameMode} 的路徑工廠`);
        }
    }

     /**
     * 獲取路徑工廠
     * 如果工廠不存在，會自動創建
     */
    private getPathFactory(gameMode: LudoGameMode): PathFactory | null {
        if (!this._mapPathFactory.has(gameMode)) {
            const FactoryClass = this.FACTORY_REGISTRY.get(gameMode);
            
            if (FactoryClass) {
                this._mapPathFactory.set(gameMode, new FactoryClass());
            } else {
                console.warn(`遊戲模式 ${gameMode} 沒有註冊的路徑工廠`);
                return null;
            }
        }
        
        return this._mapPathFactory.get(gameMode) ?? null;
    }

     /**
     * 設置遊戲模式配置
     */
    private setGameModeConfig(gameMode: LudoGameMode): IPathConfig {
        return {
            gameMode: gameMode,
            gridSize: 15,
            playerCount: 4,
            outerPathLength: 52,
            innerPathLength: 6
        };
    }


    //--確認一下是否要留這個方法，還是直接在createPathGenerator裡面調用createPaths就好--
    public createPaths():void {
       this._currentPathGenerator.createPaths();
       this._currentViewTransformer.setPathContent(this._currentPathGenerator.getPathMap());
    }

    // ========== 路徑操作公共方法 ==========

    /**
     * 獲取所有玩家的路徑映射
     * @returns 玩家類型 -> 路徑座標陣列的映射，如果未初始化返回 null
     */
    public getBoardPath(gameType:number=0): Record<number, number[][]> {
        // 根據遊戲模式返回對應的路徑
        return this._currentPathGenerator.getPathMap();
    }

    /**
     * 獲取單個玩家的路徑
     * @param playerType 玩家類型 (0:Blue, 1:Red, 2:Green, 3:Yellow)
     * @returns 該玩家的完整路徑座標陣列，如果未初始化返回 null
     */
    public getSinglePlayerPath(playerType: number): number[][] {
       return this._currentPathGenerator.getPlayerPath(playerType);
    }

    // Blue的基本盘起点 [1,6] 在Yellow视角下应该是 [8,1]
    //ViewTransformer.baseToPlayerView(1, 6, 3); // 返回 [8, 1] ✓

    // Red的基本盘起点 [8,1] 在Yellow视角下应该是 [13,8]
    //ViewTransformer.baseToPlayerView(8, 1, 3); // 返回 [13, 8] ✓

    // Green的基本盘起点 [13,8] 在Yellow视角下应该是 [6,13]
    //ViewTransformer.baseToPlayerView(13, 8, 3); // 返回 [6, 13] ✓

    // Yellow的基本盘起点 [6,13] 在Yellow视角下应该是 [1,6]
    //ViewTransformer.baseToPlayerView(6, 13, 3); // 返回 [1, 6] ✓

    // ========== 座標轉換方法 ==========
    /**
     * 從基本盤座標轉換到指定玩家視角的座標
     * @param row 基本盤的 row
     * @param col 基本盤的 col
     * @param currentPlayer 當前在左下角的玩家 (0:Blue, 1:Red, 2:Green, 3:Yellow)
     * @returns 轉換後的座標 [row, col]
     */
    public getBaseToPlayerView(row: number, col: number, currentPlayer: number): [number, number] {
        return this._currentViewTransformer.baseToPlayerView(row, col, currentPlayer);
    }

    /**
     * 從玩家視角座標轉換回基本盤座標
     * @param row 玩家視角的 row
     * @param col 玩家視角的 col
     * @param currentPlayer 當前在左下角的玩家 (0:Blue, 1:Red, 2:Green, 3:Yellow)
     * @returns 轉換後的座標 [row, col]
     */
    public getPlayerToBaseView(row: number, col: number, currentPlayer: number): [number, number] {
        return this._currentViewTransformer.playerViewToBase(row, col, currentPlayer);
    }

    // ========== 基於位置的路徑計算 ==========

    

    // 示例1: 蓝色玩家从起点 [1,6] 移动 5 步
    //const destination = transformer.getDestination(0, [1, 6], 5);
    // 返回 [6, 6] 或对应位置
    /**
     * 計算從起點移動指定步數後的終點位置
     * @param playerView 當前玩家視角 (0:Blue, 1:Red, 2:Green, 3:Yellow)
     * @param startPos 起點位置 [row, col]（玩家視角下的座標）
     * @param steps 移動步數
     * @returns 終點位置 [row, col]（玩家視角下的座標），如果超出路徑返回 null
     */
    public getPlayerDestinationByPos(playerView: number, startPos: [number, number], steps: number): [number, number] | null {
        return this._currentViewTransformer.getDestinationByPos(playerView, startPos, steps);
    }

    // 示例2: 获取完整路径段
    //const pathSegment = transformer.getPathSegment(0, [1, 6], 5);
    // 返回 [[1,6], [2,6], [3,6], [4,6], [5,6], [6,6]] （6个位置，包含起点和终点）
    /**
     * 獲取從起點到終點的完整路徑段
     * @param playerView 當前玩家視角 (0:Blue, 1:Red, 2:Green, 3:Yellow)
     * @param startPos 起點位置 [row, col]（玩家視角下的座標）
     * @param steps 移動步數
     * @returns 路徑段陣列（包含起點和終點，均為玩家視角下的座標），如果超出路徑返回 null
     */
    public getPlayerPathSegmentByPos(playerView: number, startPos: [number, number], steps: number): number[][] | null {
        return this._currentViewTransformer.getPathSegmentByPos(playerView, startPos, steps);
    }

    // ========== 基於索引的路徑計算 ==========

   
    /**
     * 計算起點索引移動指定步數後的終點位置
     * @param playerView 當前玩家視角 (0:Blue, 1:Red, 2:Green, 3:Yellow)
     * @param startIndex 起點索引（基本盤路徑上的索引）
     * @param steps 移動步數
     * @returns 終點位置 [row, col]（玩家視角下的座標），如果超出路徑返回 null
     */
    public getPlayerDestinationByIndex(playerView: number, startIndex: number, steps: number): [number, number] | null {
        return this._currentViewTransformer.getDestinationByStartIndex(playerView, startIndex, steps);
    }

     /**
     * 獲取從起點到終點的完整路徑段（基於起點索引）
     * @param playerView 當前玩家視角 (0:Blue, 1:Red, 2:Green, 3:Yellow)
     * @param startIndex 起點索引（基本盤路徑上的索引）
     * @param steps 移動步數
     * @returns 路徑段陣列（包含起點和終點，均為玩家視角下的座標），如果超出路徑返回 null
     */
    public getPlayerPathSegmentByIndex(playerView: number, startIndex: number, steps: number): number[][] | null {
        return this._currentViewTransformer.getPathSegmentByStartIndex(playerView, startIndex, steps);
    }


    // ========== 多玩家視角轉換 ==========
    /**
     * 計算其他玩家從指定索引移動後的終點位置（返回當前玩家視角下的座標）
     * @param playerView 當前玩家視角 (0:Blue, 1:Red, 2:Green, 3:Yellow)
     * @param otherPlayer 在當前玩家視角下的其他玩家位置 (0:左下, 1:左上, 2:右上, 3:右下)
     * @param startIndex 其他玩家在**基本盤路徑**上的起點索引
     * @param steps 移動步數
     * @returns 終點位置 [row, col]（當前玩家視角下的座標），如果超出路徑返回 null
     */
    public getOtherPlayerDestToGlobal(playerView: number, otherPlayer: number, startIndex: number, steps: number): [number, number] | null {
        return this._currentViewTransformer.getOtherPlayerDestToGlobal(playerView, otherPlayer, startIndex, steps);
    }

    /**
     * 計算其他玩家從指定索引移動後的路徑段（返回當前玩家視角下的座標）
     * @param playerView 當前玩家視角 (0:Blue, 1:Red, 2:Green, 3:Yellow)
     * @param otherPlayer 在當前玩家視角下的其他玩家位置 (0:左下, 1:左上, 2:右上, 3:右下)
     * @param startIndex 其他玩家在**基本盤路徑**上的起點索引
     * @param steps 移動步數
     * @returns 路徑段陣列（包含起點和終點，均為當前玩家視角下的座標），如果超出路徑返回 null
     */
    public getOtherPlayerDestToGlobalSegment(playerView: number, otherPlayer: number, startIndex: number, steps: number): number[][] | null {
        return this._currentViewTransformer.getOtherPlayerDestToGlobalSegment(playerView, otherPlayer, startIndex, steps);
    }


    // ========== 清理方法 ==========

    /**
     * 移除路徑生成器
     * 清理資源，釋放記憶體
     */
    public removePathGenerator(): void {
        if (this._currentPathConfig) {
            const factory = this.getPathFactory(this._currentPathConfig.gameMode);
            factory?.destroyPathGenerator();
        }
        this._currentPathGenerator = null;
        this._currentViewTransformer = null;
        console.log('路徑生成器已移除');
    }

   

    //transformer.mapBoardContent = pathGenerator.pathMap;

    // 黄色玩家(3)视角下，查看左上角玩家(1=蓝色)从索引5移动3步的终点
    //const destination = transformer.getOtherPlayerDestToGlobal(3, 1, 5, 3);
    // 返回在黄色玩家视角下看到的蓝色玩家的终点坐标
    
   
}