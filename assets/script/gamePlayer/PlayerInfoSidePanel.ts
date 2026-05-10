import { _decorator, Color, color, Component, Label, Node, Sprite } from 'cc';

const { ccclass, property } = _decorator;

const COLOR_LIST = new Map<number, Color>([
    [0, color(140, 210, 255, 255)],
    [1, color(255, 120, 130, 255)],
    [2, color(150, 220, 160, 255)],
    [3, color(255, 245, 160, 255)]
]);

@ccclass('PlayerInfoSidePanel')
export class PlayerInfoSidePanel extends Component {

    @property({ type: Label, tooltip: 'Player name label', visible: true, displayName: 'PlayerNameLabel' })
    private _playerNameLabel: Label = null;

    @property({ type: Label, tooltip: 'Player money label', visible: true, displayName: 'PlayerMoneyLabel' })
    private _playerMoneyLabel: Label = null;

    @property({ type: Node, tooltip: 'Turn indicator', visible: true, displayName: 'TurnIndicator' })
    private _turnIndicator: Node = null;

    @property({ type: Label, tooltip: 'Tip label', visible: true, displayName: 'TipLabel' })
    private _tipLabel: Label = null;

    /*
    @property({ type: Node, tooltip: 'Auto mode icon', visible: true, displayName: 'AutoModeIcon' })
    private _autoModeIcon: Node = null;
    */

    @property({ type: Node, tooltip: 'Background node', visible: true, displayName: 'BgNode' })
    private _bgNode: Node = null;

    public get playerName(): Label {
        return this._playerNameLabel;
    }

    public get playerMoney(): Label {
        return this._playerMoneyLabel;
    }

    protected onLoad(): void {
        this.clearView();
    }

    public initView(name: string, money: number | string, colorIndex: number): void {
        this.setPlayerName(name);
        this.setPlayerMoney(money);
        this.setPlayerColor(colorIndex);
    }

    public clearView(): void {
        this.setPlayerName('');
        this.setPlayerMoney('');
        this.showTurn(false);
        // this.setAutoMode(false);
        this.showTip('');
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

    public showTurn(isMyTurn: boolean): void {
        if (this._turnIndicator) {
            this._turnIndicator.active = isMyTurn;
        }
    }

    public hideAll():void{
        this._playerNameLabel.node.active = false;
    }

    public showAll():void{
        this._playerNameLabel.node.active = true;
    }

    /*
    public setAutoMode(isAuto: boolean): void {
        if (this._autoModeIcon) {
            this._autoModeIcon.active = isAuto;
        }
    }*/

    public showTip(tipText: string): void {
        if (this._tipLabel) {
            this._tipLabel.string = tipText || '';
            this._tipLabel.node.active = !!tipText;
        }
    }
}
