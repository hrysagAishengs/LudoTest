// assets/script/map/path/def/PathFactoryDef.ts

import { LudoGameMode } from '../../../gameDef/GameDef';

/**
 * 路径生成器接口
 * 所有路径生成器都必须实现这个接口
 * 
 * 职责：负责生成游戏路径数据
 */
export interface IPathGenerator {
    /**
     * 创建所有玩家的路径
     * 应该初始化并计算所有玩家的完整路径
     */
    createPaths(): void;
    
    /**
     * 获取所有玩家的路径映射
     * @returns 玩家类型 -> 路径坐标数组的映射
     *          例如: { 0: [[1,6], [2,6], ...], 1: [[8,1], ...], ... }
     */
    getPathMap(): Record<number, number[][]>;
    
    /**
     * 获取单个玩家的路径
     * @param playerType 玩家类型 (0:Blue, 1:Red, 2:Green, 3:Yellow)
     * @returns 该玩家的完整路径坐标数组
     */
    getPlayerPath(playerType: number): number[][];
}

/**
 * 视角转换器接口
 * 处理不同玩家视角的坐标转换和路径计算
 * 
 * 职责：负责坐标系转换和基于路径的计算
 */
export interface IViewTransformer {
    /**
     * 设置路径内容
     * 必须在使用转换功能前调用
     * @param pathMap 所有玩家的路径映射
     */
    setPathContent(pathMap: Record<number, number[][]>): void;
    
    // === 坐标转换方法 ===
    
    /**
     * 从基本盘坐标转换到指定玩家视角的坐标
     * @param row 基本盘的 row 坐标
     * @param col 基本盘的 col 坐标
     * @param currentPlayer 当前在左下角的玩家 (0:Blue, 1:Red, 2:Green, 3:Yellow)
     * @returns 转换后的坐标 [row, col]
     * 
     * 示例：Blue的基本盘起点 [1,6] 在Yellow视角下是 [8,1]
     */
    baseToPlayerView(row: number, col: number, currentPlayer: number): [number, number];
    
    /**
     * 从玩家视角坐标转换回基本盘坐标
     * @param row 玩家视角的 row 坐标
     * @param col 玩家视角的 col 坐标
     * @param currentPlayer 当前在左下角的玩家 (0:Blue, 1:Red, 2:Green, 3:Yellow)
     * @returns 转换后的基本盘坐标 [row, col]
     */
    playerViewToBase(row: number, col: number, currentPlayer: number): [number, number];
    
    // === 基于位置的路径计算 ===
    
    /**
     * 计算从起点位置移动指定步数后的终点位置
     * @param playerView 当前玩家视角 (0:Blue, 1:Red, 2:Green, 3:Yellow)
     * @param startPos 起点位置 [row, col]（玩家视角下的坐标）
     * @param steps 移动步数
     * @returns 终点位置 [row, col]（玩家视角下的坐标），如果超出路径返回 null
     * 
     * 示例：蓝色玩家从起点 [1,6] 移动 5 步 -> [6,6]
     */
    getDestinationByPos(playerView: number, startPos: [number, number], steps: number): [number, number] | null;
    
    /**
     * 获取从起点到终点的完整路径段（基于起点位置）
     * @param playerView 当前玩家视角 (0:Blue, 1:Red, 2:Green, 3:Yellow)
     * @param startPos 起点位置 [row, col]（玩家视角下的坐标）
     * @param steps 移动步数
     * @returns 路径段数组（包含起点和终点，均为玩家视角下的坐标），如果超出路径返回 null
     * 
     * 示例：[[1,6], [2,6], [3,6], [4,6], [5,6], [6,6]]（6个位置，包含起点和终点）
     */
    getPathSegmentByPos(playerView: number, startPos: [number, number], steps: number): number[][] | null;
    
    // === 基于索引的路径计算 ===
    
    /**
     * 计算从起点索引移动指定步数后的终点位置
     * @param playerView 当前玩家视角 (0:Blue, 1:Red, 2:Green, 3:Yellow)
     * @param startIndex 起点索引（在该玩家路径数组中的索引位置）
     * @param steps 移动步数
     * @returns 终点位置 [row, col]（玩家视角下的坐标），如果超出路径返回 null
     * 
     * 注意：索引从 0 开始，索引 0 通常是玩家的起飞点
     */
    getDestinationByStartIndex(playerView: number, startIndex: number, steps: number): [number, number] | null;
    
    /**
     * 获取从起点到终点的完整路径段（基于起点索引）
     * @param playerView 当前玩家视角 (0:Blue, 1:Red, 2:Green, 3:Yellow)
     * @param startIndex 起点索引（在该玩家路径数组中的索引位置）
     * @param steps 移动步数
     * @returns 路径段数组（包含起点和终点，均为玩家视角下的坐标），如果超出路径返回 null
     */
    getPathSegmentByStartIndex(playerView: number, startIndex: number, steps: number): number[][] | null;
    
    // === 多玩家视角转换 ===
    
    /**
     * 计算其他玩家从指定索引移动后的终点位置（返回当前玩家视角下的坐标）
     * @param playerView 当前玩家视角 (0:Blue, 1:Red, 2:Green, 3:Yellow)
     * @param otherPlayer 在当前玩家视角下的其他玩家相对位置 (0:左下, 1:左上, 2:右上, 3:右下)
     * @param startIndex 其他玩家在**基本盘路径**上的起点索引
     * @param steps 移动步数
     * @returns 终点位置 [row, col]（当前玩家视角下的坐标），如果超出路径返回 null
     * 
     * 示例：黄色玩家(3)视角下，查看左上角玩家(1=蓝色)从索引5移动3步的终点
     *      返回在黄色玩家视角下看到的蓝色玩家的终点坐标
     */
    getOtherPlayerDestToGlobal(
        playerView: number, 
        otherPlayer: number, 
        startIndex: number, 
        steps: number
    ): [number, number] | null;
    
    /**
     * 计算其他玩家从指定索引移动后的路径段（返回当前玩家视角下的坐标）
     * @param playerView 当前玩家视角 (0:Blue, 1:Red, 2:Green, 3:Yellow)
     * @param otherPlayer 在当前玩家视角下的其他玩家相对位置 (0:左下, 1:左上, 2:右上, 3:右下)
     * @param startIndex 其他玩家在**基本盘路径**上的起点索引
     * @param steps 移动步数
     * @returns 路径段数组（包含起点和终点，均为当前玩家视角下的坐标），如果超出路径返回 null
     */
    getOtherPlayerDestToGlobalSegment(
        playerView: number, 
        otherPlayer: number, 
        startIndex: number, 
        steps: number
    ): number[][] | null;
}

/**
 * 路径生成配置
 * 用于配置不同游戏模式下的路径生成参数
 */
export interface IPathConfig {
    /**
     * 游戏模式
     */
    gameMode: LudoGameMode;
    
    /**
     * 棋盘大小（可选）
     * @default 15
     */
    gridSize?: number;
    
    /**
     * 玩家数量（可选）
     * @default 4
     */
    playerCount?: number;
    
    /**
     * 外圈路径长度（可选）
     * 标准 Ludo 游戏为 52 格
     */
    outerPathLength?: number;
    
    /**
     * 内线路径长度（可选）
     * 标准 Ludo 游戏为 6 格
     */
    innerPathLength?: number;
}

/**
 * 路径工厂抽象类
 * 定义了创建路径生成器和视角转换器的标准流程
 * 
 * 所有具体的路径工厂都必须继承这个类并实现其抽象方法
 */
export abstract class PathFactory {
    /**
     * 设置路径配置
     * 在创建生成器之前必须调用
     * @param config 路径配置对象
     */
    abstract setPathConfig(config: IPathConfig): void;
    
    /**
     * 创建路径生成器
     * 应该返回一个已经初始化的路径生成器实例
     * @returns 路径生成器实例
     */
    abstract createPathGenerator(): IPathGenerator;
    
    /**
     * 创建视角转换器
     * 应该返回一个已经关联了路径数据的视角转换器实例
     * @returns 视角转换器实例
     */
    abstract createViewTransformer(): IViewTransformer;
    
    /**
     * 销毁路径生成器
     * 清理资源，释放内存
     */
    abstract destroyPathGenerator(): void;
}