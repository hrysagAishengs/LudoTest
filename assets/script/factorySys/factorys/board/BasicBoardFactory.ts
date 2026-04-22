import { _decorator, Prefab,Node, Sprite, SpriteFrame } from 'cc';
import { BoardFactory, IBoardGenerator, ICreateBoardConfig } from '../../defs/board/FactoryDef';
import { BasicBoardGenerator } from '../../generators/board/BasicBoardGenerator';
//import { BoardFactory, IBoardGenerator, ICreateBoardConfig } from '';
//import { BasicBoardGenerator } from '../board/BasicBoardGenerator';

export class BasicBoardFactory extends BoardFactory {
    
    private _currentConfig: ICreateBoardConfig | null = null;
    private _currentBoard: BasicBoardGenerator | null = null;
    
    public setMapConfig(resorceConfig: ICreateBoardConfig): void {
        this._currentConfig = resorceConfig;
    }

    public async createBoardGenerator(): Promise<IBoardGenerator> {
        
        const boardContainerNode = this._currentConfig?.boardResourceConfig.boardContainerNode;
        const bgContainerNode = this._currentConfig?.boardResourceConfig.bgContainerNode;
        
        if(!this._currentBoard){
            this._currentBoard = new BasicBoardGenerator();
        }
        
        // 設置棋盤配置參數
        if(this._currentConfig?.boardConfig) {
            this._currentBoard.setConfig(
                this._currentConfig.boardConfig.gridSize,
                this._currentConfig.boardConfig.cellSize,
                this._currentConfig.boardConfig.boardHeight
            );
        }
        
        this._currentBoard.cellPrefab = this._currentConfig?.boardResourceConfig.gridPrefab || null;
        this._currentBoard.nodeContainer = boardContainerNode || null;
        const useGridPrefab = this._currentConfig?.boardConfig.useGridPrefab || false;
        //--生成棋盤
        await this._currentBoard.generateBoard(useGridPrefab);
        
        if(this._currentConfig?.boardResourceConfig.bgSpriteFrame && bgContainerNode){
            const sp=bgContainerNode.getComponent(Sprite);
            if(sp){
                sp.spriteFrame = this._currentConfig.boardResourceConfig.bgSpriteFrame;
            } else {
                this.createBgSprite(this._currentConfig.boardResourceConfig.bgSpriteFrame, bgContainerNode);
            }
        }

        return this._currentBoard;
    }

    public destroyBoardGenerator(): void {
        if(this._currentBoard){
            this._currentBoard.removeBoard();
            this._currentBoard = null;
        }   
    }

    private createBgSprite(bgSpriteFrame: SpriteFrame, parentNode: Node): void {
       
        const sprite = parentNode.addComponent(Sprite);
        sprite.type = Sprite.Type.SIMPLE;
        sprite.sizeMode = Sprite.SizeMode.CUSTOM;
        sprite.trim = false;
        sprite.spriteFrame = bgSpriteFrame;
    }
}