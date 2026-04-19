import { BoardViewTransformer } from "./BoardViewTransformer";
import { PathGenterator } from "./PathGenterator";

export class PathManager {
    
    private _pathGenerator: PathGenterator = new PathGenterator();
    private _boardViewTransformer: BoardViewTransformer = new BoardViewTransformer();

    public createPaths():void {
       this._pathGenerator.createPaths();
       this._boardViewTransformer.mapBoardContent = this._pathGenerator.pathMap;
    }

    // Blue的基本盘起点 [1,6] 在Yellow视角下应该是 [8,1]
    //ViewTransformer.baseToPlayerView(1, 6, 3); // 返回 [8, 1] ✓

    // Red的基本盘起点 [8,1] 在Yellow视角下应该是 [13,8]
    //ViewTransformer.baseToPlayerView(8, 1, 3); // 返回 [13, 8] ✓

    // Green的基本盘起点 [13,8] 在Yellow视角下应该是 [6,13]
    //ViewTransformer.baseToPlayerView(13, 8, 3); // 返回 [6, 13] ✓

    // Yellow的基本盘起点 [6,13] 在Yellow视角下应该是 [1,6]
    //ViewTransformer.baseToPlayerView(6, 13, 3); // 返回 [1, 6] ✓
    /**
     * 從基本盤座標轉換到指定玩家視角的座標
     * @param row 基本盤的 row
     * @param col 基本盤的 col
     * @param currentPlayer 當前在左下角的玩家 (0:Blue, 1:Red, 2:Green, 3:Yellow)
     * @returns 轉換後的座標 [row, col]
     */
    public getBaseToPlayerView(row: number, col: number, currentPlayer: number): [number, number] {
        return this._boardViewTransformer.baseToPlayerView(row, col, currentPlayer);
    }

    /**
     * 從玩家視角座標轉換回基本盤座標
     * @param row 玩家視角的 row
     * @param col 玩家視角的 col
     * @param currentPlayer 當前在左下角的玩家 (0:Blue, 1:Red, 2:Green, 3:Yellow)
     * @returns 轉換後的座標 [row, col]
     */
    public getPlayerToBaseView(row: number, col: number, currentPlayer: number): [number, number] {
        return this._boardViewTransformer.playerViewToBase(row, col, currentPlayer);
    }


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
    public getPlayerDestination(playerView: number, startPos: [number, number], steps: number): [number, number] | null {
        return this._boardViewTransformer.getDestination(playerView, startPos, steps);
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
    public getPlayerPathSegment(playerView: number, startPos: [number, number], steps: number): number[][] | null {
        return this._boardViewTransformer.getPathSegment(playerView, startPos, steps);
    }

    /**
     * 計算其他玩家從指定索引移動後的終點位置（返回當前玩家視角下的座標）
     * @param playerView 當前玩家視角 (0:Blue, 1:Red, 2:Green, 3:Yellow)
     * @param otherPlayer 在當前玩家視角下的其他玩家位置 (0:左下, 1:左上, 2:右上, 3:右下)
     * @param startIndex 其他玩家在**基本盤路徑**上的起點索引
     * @param steps 移動步數
     * @returns 終點位置 [row, col]（當前玩家視角下的座標），如果超出路徑返回 null
     */
    public getOtherPlayerDestToGlobal(playerView: number, otherPlayer: number, startIndex: number, steps: number): [number, number] | null {
        return this._boardViewTransformer.getOtherPlayerDestToGlobal(playerView, otherPlayer, startIndex, steps);
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
        return this._boardViewTransformer.getOtherPlayerDestToGlobalSegment(playerView, otherPlayer, startIndex, steps);
    }

   

    //transformer.mapBoardContent = pathGenerator.pathMap;

    // 黄色玩家(3)视角下，查看左上角玩家(1=蓝色)从索引5移动3步的终点
    //const destination = transformer.getOtherPlayerDestToGlobal(3, 1, 5, 3);
    // 返回在黄色玩家视角下看到的蓝色玩家的终点坐标
    
    /**
     * 
     * @param gameType 遊戲模式
     * 
     */
    public getBoardPath(gameType:number=0): Record<number, number[][]> {
        // 根據遊戲模式返回對應的路徑
        return this._pathGenerator.pathMap;
    }

    public getSinglePlayerPath(playerType: number): number[][] {
       return this._pathGenerator.getPlayerPath(playerType);
    }
}