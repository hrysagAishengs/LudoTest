import { _decorator, Component, Node, Vec3 } from 'cc';
import { PawnAniShowCtrl } from './ctrls/PawnAniShowCtrl';
import { IPawn } from '../gamePlayer/def/PawnDef';
const { ccclass, property } = _decorator;

@ccclass('AniSysManager')
export class AniSysManager extends Component {
    
    @property({type:Node,displayName:"棋子動畫顯示舞台",tooltip:"棋子動畫顯示的舞台節點",visible:true}) 
    private _pawnShowStage: Node = null!;
    private _pawnShowCtrl: PawnAniShowCtrl = null!;  

    private _stage:Node = null!; 
    protected onLoad(): void {
        this._stage=this.node;
        this._pawnShowCtrl = new PawnAniShowCtrl(this._pawnShowStage);
    }

    public init():void{

    }

    update(deltaTime: number) {
        
    }

    public async showPawn(pawn: IPawn,wpos:Vec3): Promise<void> {
        await this._pawnShowCtrl.showPawn(pawn,wpos);  
    }
}


