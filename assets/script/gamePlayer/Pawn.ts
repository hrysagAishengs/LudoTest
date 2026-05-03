import { _decorator, Button, Component, Label, Node } from 'cc';
import { IPawn, IPawnInfo } from './def/PawnDef';
import { PlayerColor } from './ColorSelector';
const { ccclass, property } = _decorator;

@ccclass('Pawn')
export class Pawn extends Component implements IPawn {
    
    @property({type:Label,displayName:"DevSlotId",tooltip:"棋子本體的 Slot ID",visible:true})
    private _devSlotId: Label | null = null;
    
    @property({type:Button,displayName:"測試按鈕",tooltip:"用於測試的按鈕",visible:true})
    private _pawnBtn: Button | null = null;

    private _pawnInfo: IPawnInfo | null = null;

    public slotId: number = -1;
    public playerColor: PlayerColor;
    public slotIndex: number = -1;
    
    protected onLoad(): void {
        
    }

    public init(info: IPawnInfo, playerColor: PlayerColor, slotIndex: number): void
    {
        this._pawnInfo = info;
        this.playerColor = playerColor;
        this.slotIndex = slotIndex;
        if (this._devSlotId) {
            this._devSlotId.string = info.slotId+"";
        }
    }

    public setSlotId(slotId: number) {
        this.slotId = slotId;
        if (this._devSlotId) {
            this._devSlotId.string = slotId+"";
        }
    }

    public getPawnInfo(): IPawnInfo | null {
        return this._pawnInfo;
    }

    public getPawnNode(): Node {
        return this.node;
    }
}


