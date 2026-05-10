import { Label, Node, SpriteFrame } from 'cc';
import { DicePanel } from './comp/DicePanel';
import { PlayerHead } from './comp/PlayerHead';
import { TimeNotifyCountLight } from './comp/TimeNotifyCountLight';
import { PlayerInfoSidePanel } from './PlayerInfoSidePanel';
import type { IDicePanel, IPlayerHead, IPlayerInfoPanel, ITimeNotifyCountLight, LightColor } from './def/PanelDef';
import type { IPlayerIdentity, IPlayerStatus } from './def/PlayerDataDef';

const EMPTY_PLAYER_HEAD: IPlayerHead = {
    hideAll():void {},
    showAll():void {},
    runCountdown(): void {},
    stopCountdown(): void {},
    cleanCountdown(): void {},
    resetShader(): void {},
    setHeadSpriteFrame(_spriteFrame: SpriteFrame): void {},
};

const EMPTY_TIME_NOTIFY_COUNT_LIGHT: ITimeNotifyCountLight = {
    hideAll():void {},
    showAll():void {},
    allLightUp(): void {},
    allLightOff(): void {},
    singleLightUp(_index: number): void {},
    singleLightOff(_index: number): void {},
    changeLightColor(_index: number, _color: LightColor): void {},
    reset(): void {},
};

const EMPTY_DICE_PANEL: IDicePanel = {
    hideAll():void {},
    showAll():void {},
    playDiceAnim(): void {},
    stopDiceAnim(): void {},
    showDiceResult(_diceNumber: number): void {},
    getDiceAni() {
        return null;
    },
    hideDiceResultNode(): void {},
    showDiceResultNode(): void {},
    showDiceAnimNode(): void {},
    hideDiceAnimNode(): void {},
    reset(): void {},
};

export interface TwoPlayerInfoPanelAdapterOptions {
    sidePanel: PlayerInfoSidePanel;
    playerHead?: PlayerHead | null;
    dicePanel?: DicePanel | null;
    timeNotifyCountLight?: TimeNotifyCountLight | null;
}

export class TwoPlayerInfoPanelAdapter implements IPlayerInfoPanel {
    private readonly _sidePanel: PlayerInfoSidePanel;
    private readonly _playerHead: IPlayerHead;
    private readonly _dicePanel: IDicePanel;
    private readonly _timeNotifyCountLight: ITimeNotifyCountLight;

    public constructor(options: TwoPlayerInfoPanelAdapterOptions) {
        this._sidePanel = options.sidePanel;
        this._playerHead = options.playerHead ?? EMPTY_PLAYER_HEAD;
        this._dicePanel = options.dicePanel ?? EMPTY_DICE_PANEL;
        this._timeNotifyCountLight = options.timeNotifyCountLight ?? EMPTY_TIME_NOTIFY_COUNT_LIGHT;
    }

    public get node(): Node {
        return this._sidePanel.node;
    }

    public get playerHead(): IPlayerHead {
        return this._playerHead;
    }

    public get timeNotifyCountLight(): ITimeNotifyCountLight {
        return this._timeNotifyCountLight;
    }

    public get dicePanel(): IDicePanel {
        return this._dicePanel;
    }

    public get playerName(): Label {
        return this._sidePanel.playerName;
    }

    public get playerMoney(): Label {
        return this._sidePanel.playerMoney;
    }

    public setLayout(_playerMaxNumber: number, _localViewIndex: number): void {
        // The 2P bottom HUD owns side placement.
    }

    public hideAll():void{
        this._sidePanel.hideAll();
        this._playerHead.hideAll();
        //this._dicePanel.hideAll();
        this._timeNotifyCountLight.hideAll();
    }

    public showAll():void{
        this._sidePanel.showAll();
        this._playerHead.showAll();
        //this._dicePanel.showAll();
        this._timeNotifyCountLight.showAll();
    }

    public initView(identity: IPlayerIdentity, status: IPlayerStatus): void {
        this._sidePanel.initView(identity.nickname, status.money, identity.playerColor ?? 0);

        if (identity.avatarSpriteFrame) {
            this.playerHead.setHeadSpriteFrame(identity.avatarSpriteFrame);
        }

        this.showTurn(status.isCurrentTurn);
        //this.setAutoMode(status.isAuto);
        this.showTip(status.tipText);

        if (status.diceResult > 0) {
            this.dicePanel.showDiceResult(status.diceResult);
        }
    }

    public clearView(): void {
        this._sidePanel.clearView();
        this.playerHead.stopCountdown();
        this.playerHead.cleanCountdown();
        this.playerHead.resetShader();
        this.timeNotifyCountLight.reset();
        this.dicePanel.reset();
    }

    public setPlayerName(name: string): void {
        this._sidePanel.setPlayerName(name);
    }

    public setPlayerMoney(money: number | string): void {
        this._sidePanel.setPlayerMoney(money);
    }

    public setPlayerColor(colorIndex: number): void {
        this._sidePanel.setPlayerColor(colorIndex);
    }

    public showTurn(isMyTurn: boolean): void {
        this._sidePanel.showTurn(isMyTurn);
    }

    /*
    public setAutoMode(isAuto: boolean): void {
        this._sidePanel.setAutoMode(isAuto);
    }*/

    public showTip(tipText: string): void {
        this._sidePanel.showTip(tipText);
    }
}
