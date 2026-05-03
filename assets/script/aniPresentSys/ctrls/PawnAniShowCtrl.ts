import {  Node, Vec3 } from 'cc';
import { IPawn } from "../../gamePlayer/def/PawnDef";

export class PawnAniShowCtrl {
    
    private _stage: Node;
    private _pawnNodeMap:Map<number,IPawn[]>;
    constructor(stage: Node){
        this._stage=stage;
        this._pawnNodeMap=new Map();
    }

    public removePawn(pawn: IPawn): void {
        
        const slotIndex = pawn.getPawnInfo().baseSlotIndex;
        if (slotIndex === null) {
            console.warn(`[PawnAniShowCtrl] 無法移除棋子，因為 slotIndex 為 null`);
            return;
        }
        const pawns = this._pawnNodeMap.get(slotIndex);
        if (pawns) {
            const index = pawns.indexOf(pawn);
            if (index !== -1) {
                pawns.splice(index, 1);
            }
        }
        this._stage.removeChild(pawn.getPawnNode());
    }

    public showPawn(pawn: IPawn, wpos: Vec3): Promise<void> {
        
        return new Promise((resolve)=>{
            
            const pawnNode=pawn.getPawnNode();
            this._stage.addChild(pawnNode);
            pawnNode.setWorldPosition(wpos);
            const slotIndex=pawn.getPawnInfo().baseSlotIndex;
            const slotId=pawn.getPawnInfo().slotId;
            pawn.setSlotId(slotId);
            if (!this._pawnNodeMap.has(slotIndex)) {
                this._pawnNodeMap.set(slotIndex, []);
            }
            this._pawnNodeMap.get(slotIndex)!.push(pawn);
            resolve();
        });
        
    }
}