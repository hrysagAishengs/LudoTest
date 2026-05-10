import { _decorator, Component } from 'cc';
import { DicePanel } from './comp/DicePanel';
import { PlayerHead } from './comp/PlayerHead';
import { TimeNotifyCountLight } from './comp/TimeNotifyCountLight';
import type { IPlayerInfoPanel } from './def/PanelDef';
import { PlayerInfoSidePanel } from './PlayerInfoSidePanel';
import { TwoPlayerInfoPanelAdapter } from './TwoPlayerInfoPanelAdapter';

const { ccclass, property } = _decorator;

export enum TwoPlayerPanelSide {
    LEFT = 0,
    RIGHT = 1,
}

@ccclass('TwoPlayerBottomPanel')
export class TwoPlayerBottomPanel extends Component {

    @property({ type: PlayerInfoSidePanel, tooltip: 'Left player info panel', visible: true, displayName: 'LeftInfoPanel' })
    private _leftInfoPanel: PlayerInfoSidePanel = null;

    @property({ type: PlayerInfoSidePanel, tooltip: 'Right player info panel', visible: true, displayName: 'RightInfoPanel' })
    private _rightInfoPanel: PlayerInfoSidePanel = null;

    @property({ type: PlayerHead, tooltip: 'Left player head', visible: true, displayName: 'LeftPlayerHead' })
    private _leftPlayerHead: PlayerHead = null;

    @property({ type: PlayerHead, tooltip: 'Right player head', visible: true, displayName: 'RightPlayerHead' })
    private _rightPlayerHead: PlayerHead = null;

    @property({ type: DicePanel, tooltip: 'Shared center dice panel', visible: true, displayName: 'CenterDicePanel' })
    private _centerDicePanel: DicePanel = null;

    @property({ type: TimeNotifyCountLight, tooltip: 'Shared time notify count light', visible: true, displayName: 'TimeNotifyCountLight' })
    private _timeNotifyCountLight: TimeNotifyCountLight = null;

    private _leftAdapter: TwoPlayerInfoPanelAdapter | null = null;
    private _rightAdapter: TwoPlayerInfoPanelAdapter | null = null;

    protected onLoad(): void {
        this.createAdapters();
        this.hideAll();
    }

    public createAdapters(): void {
        if (this._leftInfoPanel) {
            this._leftAdapter = new TwoPlayerInfoPanelAdapter({
                sidePanel: this._leftInfoPanel,
                playerHead: this._leftPlayerHead,
                dicePanel: this._centerDicePanel,
                timeNotifyCountLight: this._timeNotifyCountLight,
            });
        }

        if (this._rightInfoPanel) {
            this._rightAdapter = new TwoPlayerInfoPanelAdapter({
                sidePanel: this._rightInfoPanel,
                playerHead: this._rightPlayerHead,
                dicePanel: this._centerDicePanel,
                timeNotifyCountLight: this._timeNotifyCountLight,
            });
        }
    }

    public getPanelAdapter(side: TwoPlayerPanelSide): IPlayerInfoPanel | null {
        this.ensureAdapters();

        if (side === TwoPlayerPanelSide.LEFT) {
            return this._leftAdapter;
        }

        return this._rightAdapter;
    }

    public getPanelAdapterByLocalViewIndex(localViewIndex: number): IPlayerInfoPanel | null {
        if (localViewIndex === 0) {
            return this.getPanelAdapter(TwoPlayerPanelSide.LEFT);
        }

        if (localViewIndex === 2) {
            return this.getPanelAdapter(TwoPlayerPanelSide.RIGHT);
        }

        return null;
    }

    public hideAll(): void {
        this._leftAdapter?.hideAll();
        this._rightAdapter?.hideAll();
    }

    public showAll(): void {
        this._leftAdapter?.showAll();
        this._rightAdapter?.showAll();
    }

    public clearView(): void {
        this.ensureAdapters();
        this._leftAdapter?.clearView();
        this._rightAdapter?.clearView();
    }

    private ensureAdapters(): void {
        if (!this._leftAdapter || !this._rightAdapter) {
            this.createAdapters();
        }
    }
}
