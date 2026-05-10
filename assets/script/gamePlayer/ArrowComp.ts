import { _decorator, Component, Node, Sprite, SpriteFrame } from 'cc';
import { PlayerColor } from './ColorSelector';
const { ccclass, property } = _decorator;

@ccclass('ArrowComp')
export class ArrowComp extends Component {
   
    @property({type:[SpriteFrame],visible:true,tooltip:"箭頭圖片資源，順序為：blue, red, green, yellow",displayName:'箭頭圖片'})
    private _arrowSpriteFrames: SpriteFrame[] = [];

    public setArrowSpriteFrameByColor(color: PlayerColor):void{
        const spriteFrame = this._arrowSpriteFrames[color];
        if(spriteFrame){
            const sprite = this.getComponent(Sprite);
            if(sprite){
                sprite.spriteFrame = spriteFrame;
            }
        }
    }
}


