import { _decorator, Color, Component, Sprite, SpriteFrame,Node } from 'cc';
import { ITimeNotifyCountLight, LightColor } from '../def/PanelDef';
const { ccclass, property } = _decorator;

    
export interface internalObjStatus{
    currentColor:LightColor;//--目前顏色
    light:Node;//--燈號物件
    spriteComp?:Sprite;//--燈號物件上的Sprite組件，方便直接更換SpriteFrame
}

@ccclass('TimeNotifyCountLight')
export class TimeNotifyCountLight extends Component implements ITimeNotifyCountLight {
    
    @property({type:[Node],visible:true,displayName:"超時提示燈",tooltip:"超時提示燈的Sprite組件列表，依序對應每個玩家"})
    private _testSprites: Node[] = [];

    @property({type:SpriteFrame,visible:true,displayName:"greenSpriteFrame",tooltip:"綠色燈號的SpriteFrame"})
    private _greenSpriteFrame: SpriteFrame = null!;

    @property({type:SpriteFrame,visible:true,displayName:"redSpriteFrame",tooltip:"紅色燈號的SpriteFrame"})
    private _redSpriteFrame: SpriteFrame = null!;

    private _lightMap:Map<number,internalObjStatus>=new Map();

    protected onLoad(): void {
        
        const len=this._testSprites.length;

        for(let i=0;i<len;i++){
            const lightNode=this._testSprites[i];
            this._lightMap.set(i,{
                currentColor:LightColor.GREEN,
                light:lightNode,
                spriteComp:lightNode.getComponent(Sprite)
            });
            lightNode.active=false;
        }
    }
    
    protected start(): void {
        //測試用：依序點亮每個玩家的燈號，並在最後重置
    }

    public hideAll():void{
        this.node.active = false;
    }

    public showAll():void{
        this.node.active = true;
    }
    

    public allLightUp(): void {
        
        for(const lightStatus of this._lightMap.values()){
            lightStatus.currentColor=LightColor.GREEN;
            lightStatus.light.active=true;
            if(lightStatus.spriteComp){
                lightStatus.spriteComp.spriteFrame=this._greenSpriteFrame;
            }
        }
        
    }

    public allLightOff(): void {
        for(const lightStatus of this._lightMap.values()){
            lightStatus.currentColor=LightColor.RED;
            lightStatus.light.active=false;
            if(lightStatus.spriteComp){
                lightStatus.spriteComp.spriteFrame=this._redSpriteFrame;
            }
        }
    }

    public singleLightUp(_index: number): void {
        const lightStatus = this._lightMap.get(_index);
        if (lightStatus) {
            lightStatus.currentColor = LightColor.GREEN;
            lightStatus.light.active = true;
            if (lightStatus.spriteComp) {
                lightStatus.spriteComp.spriteFrame = this._greenSpriteFrame;
            }
        }
    }

    public singleLightOff(_index: number): void {
        const lightStatus = this._lightMap.get(_index);
        if (lightStatus) {
            lightStatus.currentColor = LightColor.RED;
            lightStatus.light.active = false;
            if (lightStatus.spriteComp) {
                lightStatus.spriteComp.spriteFrame = this._redSpriteFrame;
            }
        }
    }

    public changeLightColor(index: number, color: LightColor): void {
        const lightStatus = this._lightMap.get(index);
        if (lightStatus) {
            lightStatus.currentColor = color;
            if (lightStatus.spriteComp) {
                lightStatus.spriteComp.spriteFrame = color === LightColor.GREEN ? this._greenSpriteFrame : this._redSpriteFrame;
            }
        }
    }

    public reset(): void {
        this.allLightUp();
    }
}


