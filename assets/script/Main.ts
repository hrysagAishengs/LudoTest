import { _decorator, Component, Node } from 'cc';
import { LudoGameManager } from './LudoGameManager';
import { LudoGameMode } from './gameDef/GameDef';
//import { BasicBoardGenerator } from './map/board/factory/board/BasicBoardGenerator';


const { ccclass, property } = _decorator;

@ccclass('Main')
export class Main extends Component {
    
    @property({type:LudoGameManager,displayName:"遊戲管理器",tooltip:"負責管理遊戲的組件",visible:true})
    private _ludoGameManager: LudoGameManager = null!;

    start() {
        
        this.initGame();
    }

    private async initGame():Promise<void>{
        try {
            await this.testInit();
            this.testMode();
        } catch (error) {
            console.error('[Main] 遊戲初始化失敗:', error);
        }
    }

    private async testInit(): Promise<void> {
        // 這裡可以根據需要設置遊戲模式，並調用相應的 BoardGenerator 來生成棋盤
        const gameMode= LudoGameMode.CLASSIC; // 假設有一個經典模式
        //await this._ludoGameManager.setBoard(gameMode);
        //await this._ludoGameManager.initGameMode(gameMode);
        await this._ludoGameManager.initGame(gameMode);
    }

    private testMode():void{
        this._ludoGameManager.testPathMode();
    }



    
}


