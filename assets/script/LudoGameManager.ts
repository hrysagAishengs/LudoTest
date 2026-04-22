import { _decorator, color, Component, Graphics, Node, UITransform, Vec3 } from 'cc';
import { BoardGeneratorManager } from './map/factory/BoardGeneratorManager';
import { PathManager } from './map/path/PathManager';
import { LudoGameMode } from './gameDef/GameDef';
import { GameModeManager } from './gameMode/GameModeManager';
const { ccclass, property } = _decorator;

@ccclass('LudoGameManager')
export class LudoGameManager extends Component {
    
    @property({type:Node,displayName:"testNode",tooltip:"TESTNODE",visible:true})
    private _testNode: Node = null;
    
    @property({type:GameModeManager,displayName:"遊戲模式管理器",tooltip:"負責管理遊戲模式的組件",visible:true})
    private _gameModeManager: GameModeManager = null;
    

    /*
    @property({type:BoardGeneratorManager,displayName:"棋盤生成管理器",tooltip:"負責管理棋盤生成的組件",visible:true})
    private _boardGeneratorManager: BoardGeneratorManager = null!;
    private _pathManager: PathManager = new PathManager();
    */

    public async initGameMode(gameMode: LudoGameMode): Promise<void> {
        return this._gameModeManager.initGameMode(gameMode);
    }

    //--廢棄
    public async setBoard(gameMode: LudoGameMode): Promise<void> {
        /*
        this._boardGeneratorManager.setGameMode(gameMode);
        await this._boardGeneratorManager.createBoardGenerator();
        this._pathManager.setGameMode(gameMode);
        await this._pathManager.createPathGenerator();
        console.log('棋盤和路徑生成完成，遊戲準備就緒');
        */
    }

    public testPathMode(): void {
        
        const playerType = 3; // 0: Blue, 1: Red, 2: Green, 3: Yellow
        this._gameModeManager.rotateBoardView(1);
        const playerDestination = this._gameModeManager.getPlayerDestinationByPos(playerType, [1, 6], 9);
        console.log(`Player ${playerType} destination after moving 5 steps from [1, 6]:`, playerDestination);
        
        const playerDes=this._gameModeManager.getPlayerDestinationByIndex(playerType, 0, 9);
        console.log(`Player ${playerType} AAAA after moving 5 steps from index 0:`, playerDes);
        
        
        const pos=this._gameModeManager.getCellPosition(playerDes[0],playerDes[1]);
        this.testDraw(pos);
        //console.log(`Player ${playerType} destination position in world coordinates:`, pos);    
        //const playerPathSegment = this._pathManager.getPlayerPathSegment(playerType, [1, 6], 5);
        //console.log(`Player ${playerType} path segment from [1, 6] moving 5 steps:`, playerPathSegment);
        //const otherPlayerDestination = this._pathManager.getOtherPlayerDestToGlobal(playerType, 1, 0, 5);
        //console.log(`Player ${playerType} sees other player 1 moving 5 steps from index 0:`, otherPlayerDestination);
        //const otherPlayerSegment = this._pathManager.getOtherPlayerDestToGlobalSegment(playerType, 1, 0, 5);
        //console.log(`Player ${playerType} sees other player 1 path segment moving 5 steps from index 0:`, otherPlayerSegment);
    }


    private testDraw(pos:Vec3):void{
        
        let testNode:Node=new Node();
        let uitransform=testNode.addComponent(UITransform);
        uitransform.setContentSize(50,50);
        let graphic:Graphics=testNode.addComponent(Graphics);
        graphic.fillColor=color(0,0,0,255);
        graphic.rect(-25,-25,50,50);
        graphic.fill();
        this._testNode.addChild(testNode);
        testNode.setPosition(pos);
    }


    //----move player----
    public movePlayerByPos(playerType: number, startPos: [number, number], steps: number): void {

    }

    public moveOtherPlayer(playerType: number, otherPlayerIndex: number, startIndex: number, steps: number): void {

    }

    
}


