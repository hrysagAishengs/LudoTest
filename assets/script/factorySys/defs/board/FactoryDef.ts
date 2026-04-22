import { Vec3, Prefab, Component,Node, _decorator, SpriteFrame, CCBoolean, Enum } from 'cc';
import { LudoGameMode } from '../../../gameDef/GameDef';

const { ccclass, property } = _decorator;
/**
 * 所有棋盤生成器都必須實現這個interface
 */
export interface IBoardGenerator {
    //-生成棋盤
    generateBoard(useGridPrefab?: boolean): Promise<void>;
    //-獲取指定格子的位置
    getCellPosition(r: number, c: number): Vec3;
    //-獲取所有格子位置
    getAllPositions(): Vec3[][];
    //-獲取棋盤的網格大小
    getGridSize(): number;
    removeBoard(): void;
}

export interface IBoardResourceConfig {
    gridPrefab?: Prefab;//格子預製件（可選
    bgSpriteFrame?: SpriteFrame;//背景圖片（可選
    boardContainerNode?: Node;// 棋盤生成的父節點 
    bgContainerNode?: Node;//背景容器節點（可選
    usePosGridOnly?: boolean; // 是否只生成座標格子，不建立實際節點
}

export interface IBoardConfig {
    
    gridSize: number;//棋盤網格大小（如 15x15）
    cellSize: number;//單個格子的視覺大小（像素）
    boardHeight: number;//棋盤容器的高度（像素），用於計算格子間距
    useGridPrefab: boolean;//是否使用格子預製件來生成棋盤
    useBgBoard: boolean;//是否使用背景圖片 
}



//--建立棋盤的config--準備刪除配置與資源分開
export interface ICreateBoardConfig{
    
    /*
    gridPrefab?: Prefab; // 是否使用格子預製件來生成棋盤
    bgSpriteFrame?: SpriteFrame; // 棋盤背景圖片的SpriteFrame
    usePosGridOnly?: boolean; // 是否只生成座標格子，不建立實際節點
    gameMode?: LudoGameMode; // 遊戲模式
    boardContainerNode?: Node; // 棋盤生成的父節點   
    bgContainerNode?: Node; // 是否使用整張圖片當作棋盤背景來生成棋盤 
    */
    boardResourceConfig: IBoardResourceConfig;
    boardConfig: IBoardConfig;
}





//--產生棋盤的抽象工廠類別，定義了生成棋盤的基本方法
export abstract class BoardFactory {
    
    abstract setMapConfig(resorceConfig: ICreateBoardConfig): void;
    abstract createBoardGenerator(): Promise<IBoardGenerator>;
    abstract destroyBoardGenerator(): void;
}

