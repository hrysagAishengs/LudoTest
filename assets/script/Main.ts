import { _decorator, Component, Node } from 'cc';
import { LudoGameManager } from './LudoGameManager';
import { LudoGameMode } from './gameDef/GameDef';
import { IRollData, SimpleSlot } from './simpleSlot/SimpleSlot';
//import { BasicBoardGenerator } from './map/board/factory/board/BasicBoardGenerator';


const { ccclass, property } = _decorator;

@ccclass('Main')
export class Main extends Component {
    
    @property({type:LudoGameManager,displayName:"遊戲管理器",tooltip:"負責管理遊戲的組件",visible:true})
    private _ludoGameManager: LudoGameManager = null!;

    @property({type:SimpleSlot,displayName:"測試用節點",tooltip:"用於測試的節點",visible:true})
    private _testSlotNode: SimpleSlot = null!;
    start() {
        
        this.initGame();
    }

    public async testBtn():Promise<void>{
        // 測試按鈕觸發的邏輯
        
        const myData: IRollData[] = [
            { symbolId: 0 }, 
            { symbolId: 2 } // 最後一筆是結果
        ];

        console.log(`預計滾動總時間：${this._testSlotNode.getEstimatedTotalTime(myData.length)} 秒`);

        // 呼叫滾動並等待結束
        const startTime = Date.now();
        console.log("開始滾動...");
        await this._testSlotNode.startRoll(myData);
        const endTime = Date.now();
        console.log(`滾動結束，顯示結果！耗時: ${(endTime - startTime) / 1000} 秒`);
        
       // 1. 先讓它開始轉
       /* 
       this._testSlotNode.startRoll(); 

        // 2. 模擬伺服器延遲 (例如 3 秒後才拿到結果)
        setTimeout(() => {
            const serverResult = [{symbolId: 0}, {symbolId: 2}];
            this._testSlotNode.stopRoll(serverResult);
        }, 3000);
        */
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
        const playerMaxCount = 4; // 假設最多4個玩家
        //await this._ludoGameManager.setBoard(gameMode);
        //await this._ludoGameManager.initGameMode(gameMode);
        await this._ludoGameManager.initGame(gameMode);
    }

    private testMode():void{
        this._ludoGameManager.testPathMode();
    }



    
}


