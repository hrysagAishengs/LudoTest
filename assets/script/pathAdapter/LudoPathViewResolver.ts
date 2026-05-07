import { IViewTransformer } from '../factorySys/defs/path/PathFactoryDef';
import { LudoGlobalPathAdapter } from './LudoGlobalPathAdapter';

/**
 * 將 server global grid id 轉成目前玩家視角可用的 path / view coord。
 *
 * 這個 resolver 只處理：
 * - server global id -> pathIndex
 * - server global id -> 目前畫面上的 [row, col]
 * - from/to server global id -> server global path / view coord path
 *
 * 不處理 Cocos local/world position，避免和動畫系統耦合。
 */
export class LudoPathViewResolver {
    constructor(
        private readonly _globalPathAdapter: LudoGlobalPathAdapter,
        private readonly _viewTransformer: IViewTransformer
    ) {}

    /**
     * 取得 server global grid id 在指定玩家路徑中的 pathIndex。
     */
    public getPathIndexByGlobalId(chairId: number, globalId: number): number {
        return this._globalPathAdapter.getPathIndex(chairId, globalId);
    }

    /**
     * 將 server global grid id 轉成目前玩家視角下的棋盤座標。
     */
    public getViewCoordByGlobalId(chairId: number, globalId: number): [number, number] | null {
        const pathIndex = this.getPathIndexByGlobalId(chairId, globalId);
        if (pathIndex < 0) {
            return null;
        }

        return this._viewTransformer.getPathCoordInViewByPathIndex(chairId, pathIndex);
    }

    /**
     * 取得 from/to 之間的 server global grid id 路徑。
     */
    public getGlobalMovePath(chairId: number, fromGlobalId: number, toGlobalId: number): number[] {
        return this._globalPathAdapter.getMovePath(chairId, fromGlobalId, toGlobalId);
    }

    /**
     * 取得 from/to 之間，目前玩家視角下的棋盤座標路徑。
     */
    public getViewMovePath(chairId: number, fromGlobalId: number, toGlobalId: number): [number, number][] {
        const globalPath = this.getGlobalMovePath(chairId, fromGlobalId, toGlobalId);
        const viewPath: [number, number][] = [];

        for (let i = 0; i < globalPath.length; i++) {
            const viewCoord = this.getViewCoordByGlobalId(chairId, globalPath[i]);
            if (viewCoord) {
                viewPath.push(viewCoord);
            }
        }

        return viewPath;
    }
}
