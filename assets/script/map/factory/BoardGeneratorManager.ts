import { _decorator, Component, Node, Vec3 } from 'cc';
import { BoardFactory, BoardFactoryType, BoardResourceConfig, IBoardGenerator, ICreateBoardConfig } from './def/FactoryDef';
import { LudoGameMode } from '../../gameDef/GameDef';
import { BasicBoardFactory } from './factorys/BasicBoardFactory';
const { ccclass, property } = _decorator;

@ccclass('BoardGeneratorManager')
export class BoardGeneratorManager extends Component {
   
    @property({type:BoardResourceConfig,displayName:"棋盤資源配置",tooltip:"用於配置棋盤生成所需的資源，如格子預製件、背景圖片等",visible:true})
    private _boardResourceConfig: BoardResourceConfig[] = [new BoardResourceConfig()];
    private _mapBoardFactory:Map<LudoGameMode, BoardFactory> = new Map(); 
    private _currentBoardConfig: ICreateBoardConfig | null = null;
    private _currentBoard:IBoardGenerator | null = null;
    private readonly FACTORY_REGISTRY = new Map<BoardFactoryType, new () => BoardFactory>([
        [BoardFactoryType.CLASSIC, BasicBoardFactory],
        // [BoardFactoryType.QUICK, QuickBoardFactory], // 未来添加
    ]);
    start() {

    }
    //---setting and creating board generator---

    public setGameMode(gameMode: LudoGameMode): void {
        
        //this.registerBoardFactory(gameMode);
        this._currentBoardConfig = this.setGameModeConfig(gameMode);
    }

    public async createBoardGenerator(): Promise<void> {
        
        if(!this._currentBoardConfig){
            console.error("Board config is not set. Please set the board config before creating a board generator.");
            return;
        }
        
        const factory = this.getBoardFactory(this._currentBoardConfig.gameMode);
        if(factory){
            factory.setMapConfig(this._currentBoardConfig);
            this._currentBoard = await factory.createBoardGenerator();
        } else {
            console.error(`No BoardFactory found for game mode: ${this._currentBoardConfig.gameMode}`);
        }

    }

    private getBoardFactory(gameMode: LudoGameMode): BoardFactory | null {
        
        if(!this._mapBoardFactory.has(gameMode)){
            
            const config = this._boardResourceConfig.find(c => c.gameMode === gameMode);
            if(config?.factoryType){
                const FactoryClass = this.FACTORY_REGISTRY.get(config.factoryType); 
                if(FactoryClass){
                    this._mapBoardFactory.set(gameMode, new FactoryClass());
                }else{
                    console.warn(`No BoardFactory registered for game mode: ${gameMode}`);
                }

            }else{
                console.warn(`No factory config found for game mode: ${gameMode}`);
            }
            
        }
        const factory = this._mapBoardFactory.get(gameMode);
        return factory ? factory : null;
    }

    private setGameModeConfig(gameMode: LudoGameMode): ICreateBoardConfig {
        
        const config = this._boardResourceConfig.find(config => config.gameMode === gameMode);
        const gridPrefab = config?.useGridPrefab ? config.gridPrefab : null;
        const bgSpriteFrame = config?.useBgBoard ? config.bgSpriteFrame : null;
        const boardContainerNode = config?.boardContainerNode || null;
        const bgContainerNode = config?.useBgBoard ? config.bgContainerNode || null : null;
        const configGameMode = config?.gameMode !== undefined ? config.gameMode : LudoGameMode.DEFAULT;
        const configUsePosGridOnly = config?.usePosGridOnly !== undefined ? config.usePosGridOnly : false;

        const returnConfig: ICreateBoardConfig = {
            gameMode: configGameMode,
            gridPrefab: gridPrefab,
            bgSpriteFrame: bgSpriteFrame,
            boardContainerNode: boardContainerNode,
            bgContainerNode: bgContainerNode,
            usePosGridOnly: configUsePosGridOnly
        };
        return returnConfig;
        
    }

    //---setting and creating board generator---
    /**
     * 獲取指定格子的位置
     */
    public getCellPosition(r: number, c: number): Vec3 | null {
        
        if(this._currentBoard){
            return this._currentBoard.getCellPosition(r, c);
        }
        return null;
    }
    
    /**
     * 獲取所有格子位置
     */
    public getAllPositions(): Vec3[][] | null {
        if(this._currentBoard){
            return this._currentBoard.getAllPositions();
        }
        return null;
    }
    
    /**
     * 獲取棋盤的網格大小
     */
    public getGridSize(): number | null {
        if(this._currentBoard){
            return this._currentBoard.getGridSize();
        }
        return null;
    }

    public removeBoard(): void {
        if(this._currentBoard){
            this._currentBoard.removeBoard();
            this._currentBoard = null;
        }
    }
    //---public method for IBoardGenerator---

    
}


