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

//--建立棋盤的config
export interface ICreateBoardConfig{
    gridPrefab?: Prefab; // 是否使用格子預製件來生成棋盤
    bgSpriteFrame?: SpriteFrame; // 棋盤背景圖片的SpriteFrame
    usePosGridOnly?: boolean; // 是否只生成座標格子，不建立實際節點
    gameMode?: LudoGameMode; // 遊戲模式
    boardContainerNode?: Node; // 棋盤生成的父節點   
    bgContainerNode?: Node; // 是否使用整張圖片當作棋盤背景來生成棋盤 
}

export enum BoardFactoryType {
    CLASSIC = 'Basic',
    QUICK = 'Quick'
}


@ccclass('BoardResourceConfig')
export class BoardResourceConfig  {
    @property({
        type:Prefab,
        tooltip: '使用Prefab來生成棋盤格子', 
        visible: function() { return this.useGridPrefab; }  
    })
    gridPrefab?: Prefab = null;

    @property({
        //type:CCBoolean,
        tooltip:'是否使用Prefab來生成棋盤格子，若為false則只會生成座標資訊，不會建立實際節點'
    })
    public useGridPrefab: boolean = false;

    @property({
        type:SpriteFrame,
        tooltip: '棋盤背景圖片的SpriteFrame',
        visible: function() { return this.useBgBoard; }
    })
    bgSpriteFrame?: SpriteFrame = null;

    @property({
        type:Node,
        tooltip: '使用整張圖片當作棋盤背景來生成棋盤的父節點',
        visible: function() { return this.useBgBoard; }
    })
    bgContainerNode?: Node = null;

    @property({
        //type:CCBoolean,
        tooltip:'是否使用Sprite來生成棋盤背景'
    })
    public useBgBoard: boolean = false;

    @property({type:Node})
    boardContainerNode?: Node = null;

    @property
    usePosGridOnly?: boolean = false;
    @property
    gameMode?: LudoGameMode = LudoGameMode.CLASSIC;

    @property({
        type: Enum(BoardFactoryType),
        tooltip: '選擇工廠類型'
    })
    factoryType: BoardFactoryType = BoardFactoryType.CLASSIC;
   
}


//--產生棋盤的抽象工廠類別，定義了生成棋盤的基本方法
export abstract class BoardFactory {
    
    abstract setMapConfig(resorceConfig: ICreateBoardConfig): void;
    abstract createBoardGenerator(): Promise<IBoardGenerator>;
    abstract destroyBoardGenerator(): void;
}

