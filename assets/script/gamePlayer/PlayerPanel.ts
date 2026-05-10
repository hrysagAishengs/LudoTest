import { _decorator, Color, color, Component, Label, Layout, Node, Sprite, SpriteFrame, Widget } from 'cc';
import { DicePanel } from './comp/DicePanel';
import { PlayerHead } from './comp/PlayerHead';
import { TimeNotifyCountLight } from './comp/TimeNotifyCountLight';
import type { IPlayerInfoPanel } from './def/PanelDef';
import type { IPlayerIdentity, IPlayerStatus } from './def/PlayerDataDef';

const { ccclass, property } = _decorator;

const COLOR_LIST = new Map<number, Color>([
    [0, color(140, 210, 255, 255)],
    [1, color(255, 120, 130, 255)],
    [2, color(150, 220, 160, 255)],
    [3, color(255, 245, 160, 255)]
]);

@ccclass('PlayerPanel')
export class PlayerPanel extends Component implements IPlayerInfoPanel {
    
    @property({ type: PlayerHead, tooltip: 'Player head panel', visible: true, displayName: 'PlayerHeadPanel' })
    private _playerHeadPanel: PlayerHead = null;

    @property({ type: DicePanel, tooltip: 'Dice panel', visible: true, displayName: 'DicePanel' })
    private _dicePanel: DicePanel = null;

    @property({ type: TimeNotifyCountLight, tooltip: 'Time notify count light panel', visible: true, displayName: 'TimeNotifyCountLightPanel' })
    private _timeNotifyCountLightPanel: TimeNotifyCountLight = null;
    //-4P換位
    @property({type:Layout, tooltip:'Layout component for player panel', visible:true, displayName:'LayoutComponent'})
    private _layoutComponent: Layout = null;

    @property({ type: Label, tooltip: 'Player name label', visible: true, displayName: 'PlayerNameLabel' })
    private _playerNameLabel: Label = null;

    @property({ type: Label, tooltip: 'Player money label', visible: true, displayName: 'PlayerMoneyLabel' })
    private _playerMoneyLabel: Label = null;

    @property({ type: Node, tooltip: 'Turn indicator', visible: true, displayName: 'TurnIndicator' })
    private _turnIndicator: Node = null;

    @property({ type: Label, tooltip: 'Tip label', visible: true, displayName: 'TipLabel' })
    private _tipLabel: Label = null;

    @property({ type: Node, tooltip: 'Auto mode icon', visible: true, displayName: 'AutoModeIcon' })
    private _autoModeIcon: Node = null;

    @property({ type: Label, tooltip: 'DevTable', visible: true, displayName: 'DevTable' })
    private _devTableLabel: Label = null;

    @property({ type: Label, tooltip: 'DevDiceResult', visible: true, displayName: 'DevDiceResult' })
    private _devDiceResultLabel: Label = null;

    @property({ type: Label, tooltip: 'DevInfo', visible: true, displayName: 'DevInfo' })
    private _devInfoLabel: Label = null;

    @property({ type: Node, tooltip: 'Background node', visible: true, displayName: 'BgNode' })
    private _bgNode: Node = null;

    public get playerHead(): PlayerHead {
        return this._playerHeadPanel;
    }

    public get timeNotifyCountLight(): TimeNotifyCountLight {
        return this._timeNotifyCountLightPanel;
    }

    public get dicePanel(): DicePanel {
        return this._dicePanel;
    }

    public get playerName(): Label {
        return this._playerNameLabel;
    }

    public get playerMoney(): Label {
        return this._playerMoneyLabel;
    }

    protected onLoad(): void {
        this._hideAllIndicators();
        this.setLayout(4,2); // 預設為4人遊戲，座位索引0，實際使用時應根據玩家數量和座位索引調整
    }

    public setLayout(playerMaxNumber: number, localViewIndex: number): void {
        
        //--test
        /*const testWidget = this.node.getComponent(Widget);
        testWidget.isAlignTop = true;
        testWidget.top = 10;
        testWidget.isAlignLeft = true;
        testWidget.left = 10;*/
        //--
        if (this._layoutComponent) {
            // 根據玩家數量和座位索引調整布局參數
            // 這裡的邏輯可以根據實際需求進行調整
            if (playerMaxNumber === 4) {
                if (localViewIndex === 0 ||localViewIndex === 1) {
                    this._layoutComponent.horizontalDirection = Layout.HorizontalDirection.LEFT_TO_RIGHT;
                }else{
                    this._layoutComponent.horizontalDirection = Layout.HorizontalDirection.RIGHT_TO_LEFT;
                }
            }
        }
    }

    public hideAll():void{

    }

    public showAll():void{
        
    }

    public initView(identity: IPlayerIdentity, status: IPlayerStatus): void {
        this.setPlayerName(identity.nickname);
        this.setPlayerMoney(status.money);

        if (identity.avatarSpriteFrame) {
            this.setHeadSpriteFrame(identity.avatarSpriteFrame);
        }

        this.showTurn(status.isCurrentTurn);
        this.setAutoMode(status.isAuto);
        this.showTip(status.tipText);
        this.setPlayerColor(identity.playerColor ?? 0);

        if (status.diceResult > 0) {
            this.showDiceResult(status.diceResult);
        }
    }

    public clearView(): void {
        this.setPlayerName('');
        this.setPlayerMoney('');
        this.showTip('');
        this.showTurn(false);
        this.setAutoMode(false);
        this.stopCountdown();
        this.playerHead?.cleanCountdown();
        this.playerHead?.resetShader();
        this.timeNotifyCountLight?.reset();
        this.dicePanel?.reset();
        this._hideAllIndicators();
    }

    public setPlayerName(name: string): void {
        if (this._playerNameLabel) {
            this._playerNameLabel.string = name;
        }
    }

    public setPlayerMoney(money: number | string): void {
        if (this._playerMoneyLabel) {
            this._playerMoneyLabel.string = `${money}`;
        }
    }

    public setPlayerColor(colorIndex: number): void {
        const colorValue = COLOR_LIST.get(colorIndex);
        const sprite = this._bgNode?.getComponent(Sprite);
        if (sprite && colorValue) {
            sprite.color = colorValue;
        }
    }

    public updateMoney(money: number): void {
        this.setPlayerMoney(money);
    }

    public showTurn(isMyTurn: boolean): void {
        if (this._turnIndicator) {
            this._turnIndicator.active = isMyTurn;
        }
    }

    /*
    public startCountdown(seconds: number): void {
        this.playerHead?.runCountdown(seconds);
    }*/

    public stopCountdown(): void {
        this.playerHead?.stopCountdown();
    }

    public playDiceAnimation(): void {
        this.dicePanel?.playDiceAnim();
    }

    public showDiceResult(result: number): void {
        this.dicePanel?.showDiceResult(result);
    }

    public setAutoMode(isAuto: boolean): void {
        if (this._autoModeIcon) {
            this._autoModeIcon.active = isAuto;
        }
    }

    public showTip(tipText: string): void {
        if (this._tipLabel) {
            this._tipLabel.string = tipText || '';
            this._tipLabel.node.active = !!tipText;
        }
    }

    public setHeadSpriteFrame(spriteFrame: SpriteFrame): void {
        this.playerHead?.setHeadSpriteFrame(spriteFrame);
    }

    /**
     * @deprecated Use setHeadSpriteFrame instead.
     */
    public loadAvatar(spriteFrame: SpriteFrame): void {
        this.setHeadSpriteFrame(spriteFrame);
    }

    private _hideAllIndicators(): void {
        if (this._turnIndicator) this._turnIndicator.active = false;
        if (this._autoModeIcon) this._autoModeIcon.active = false;
        if (this._tipLabel) this._tipLabel.node.active = false;
    }

    protected onDestroy(): void {
        this.stopCountdown();
    }
}
