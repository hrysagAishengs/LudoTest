import { Animation, Label, SpriteFrame,Node } from "cc";
import type { IPlayerIdentity, IPlayerStatus } from "./PlayerDataDef";

/**
 * 玩家頭像區塊介面。
 * 負責頭像圖片、倒數顯示與頭像 shader 狀態。
 */
export interface IPlayerHead{
    
    hideAll():void;

    showAll():void;
    
    /** 開始頭像倒數。 */
    runCountdown(cdDuration: number): void;

    /** 暫停或停止頭像倒數。 */
    stopCountdown(): void;

    /** 清除頭像倒數狀態。 */
    cleanCountdown():void;

    /** 重置頭像 shader 效果。 */
    resetShader():void;

    /** 設定玩家頭像圖片。 */
    setHeadSpriteFrame(spriteFrame: SpriteFrame): void;
}

export enum LightColor{
    GREEN,
    RED
}

/**
 * 玩家時間提示燈介面。
 * 負責控制倒數提示燈的亮滅、顏色與重置。
 */
export interface ITimeNotifyCountLight {
    
    hideAll():void;

    showAll():void;
    /** 點亮所有提示燈。 */
    allLightUp(): void;

    /** 關閉所有提示燈。 */
    allLightOff(): void;

    /** 點亮指定索引的提示燈。 */
    singleLightUp(index: number): void;

    /** 關閉指定索引的提示燈。 */
    singleLightOff(index: number): void;

    /** 變更指定索引的提示燈顏色。 */
    changeLightColor(index: number, color: LightColor): void;

    /** 重置提示燈狀態。 */
    reset():void;
}

/**
 * 骰子面板介面。
 * 負責骰子動畫、骰子結果顯示，以及相關節點開關。
 */
export interface IDicePanel{
    
    hideAll():void;

    showAll():void;
    /** 播放骰子動畫。 */
    playDiceAnim():void;

    /** 停止骰子動畫。 */
    stopDiceAnim():void;

    /** 顯示指定骰子結果。 */
    showDiceResult(diceNumber:number):void;

    /** 取得骰子動畫元件。 */
    getDiceAni():Animation | null;

    /** 關閉骰子結果節點。 */
    hideDiceResultNode():void;

    /** 開啟骰子結果節點。 */
    showDiceResultNode():void;

    /** 開啟骰子動畫節點。 */
    showDiceAnimNode():void;

    /** 關閉骰子動畫節點。 */
    hideDiceAnimNode():void;

    /** 重置骰子面板狀態。 */
    reset():void;
}

/**
 * 玩家資訊面板介面。
 * PlayerPanel 負責組合玩家基本資訊與三個子面板，
 * 頭像、時間提示燈、骰子顯示的細節由各自的子介面處理。
 */
export interface IPlayerInfoPanel{
    node: Node
    /** 玩家頭像與頭像倒數面板。 */
    playerHead: IPlayerHead;

    /** 玩家時間提示燈面板。 */
    timeNotifyCountLight: ITimeNotifyCountLight;

    /** 骰子顯示與骰子動畫面板。 */
    dicePanel: IDicePanel;

    /** 玩家名稱文字。 */
    playerName: Label;

    /** 玩家金額文字。 */
    playerMoney: Label;

    /** 依玩家人數與座位設定面板版面。 */
    setLayout(playerMaxNumber:number,localViewIndex:number):void;

    /** 初始化玩家資訊面板。 */
    initView(identity: IPlayerIdentity, status: IPlayerStatus): void;

    /** 清空玩家資訊面板。 */
    clearView(): void;

    /** 設定玩家名稱。 */
    setPlayerName(name: string): void;

    /** 設定玩家金額。 */
    setPlayerMoney(money: number | string): void;

    /** 設定玩家面板顏色。 */
    setPlayerColor(colorIndex: number): void;

    /** 顯示或隱藏目前回合提示。 */
    showTurn(isMyTurn: boolean): void;

    /** 顯示或隱藏自動模式。 */
    //setAutoMode(isAuto: boolean): void;

    /** 顯示提示文字。 */
    showTip(tipText: string): void;

    hideAll():void;

    showAll():void;
}
