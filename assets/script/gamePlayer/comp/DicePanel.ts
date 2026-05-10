import { _decorator, Animation, Component } from 'cc';
import { IDicePanel } from '../def/PanelDef';
const { ccclass } = _decorator;

@ccclass('DicePanel')
export class DicePanel extends Component implements IDicePanel {
    start() {

    }

    update(_deltaTime: number) {
        
    }

    public hideAll():void{
        this.node.active = false;
    }

    public showAll():void{
        this.node.active = true;
    }

    public playDiceAnim(): void {
    }

    public stopDiceAnim(): void {
    }

    public showDiceResult(_diceNumber: number): void {
    }

    public getDiceAni(): Animation | null {
        return null;
    }

    public hideDiceResultNode(): void {
    }

    public showDiceResultNode(): void {
    }

    public showDiceAnimNode(): void {
    }

    public hideDiceAnimNode(): void {
    }

    public reset(): void {
    }
}


