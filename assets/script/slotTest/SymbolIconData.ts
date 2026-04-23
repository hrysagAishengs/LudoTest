import { _decorator, CCBoolean, CCInteger, Node, CCString, SpriteFrame } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('SymbolIconData')

export class SymbolIconData  {

   
    @property({ type: CCInteger, tooltip: 'symbol iconId for server' })
    public iconId: number = 0;

    @property({ type: SpriteFrame, tooltip: 'icon spriteFrame' })
    public spriteFrame: SpriteFrame = null;

}