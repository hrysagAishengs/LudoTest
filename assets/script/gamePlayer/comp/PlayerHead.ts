import { _decorator, Component, SpriteFrame } from 'cc';
import { IPlayerHead } from '../def/PanelDef';
const { ccclass } = _decorator;

@ccclass('PlayerHead')
export class PlayerHead extends Component implements IPlayerHead {
    
    public hideAll():void{
        this.node.active = false;
    }

    public showAll():void{
        this.node.active = true;
    }
    
    public runCountdown(_cdDuration: number): void {
    }

    public stopCountdown(): void {
    }

    public cleanCountdown(): void {
    }

    public resetShader(): void {
    }

    public setHeadSpriteFrame(_spriteFrame: SpriteFrame): void {
    }
}


