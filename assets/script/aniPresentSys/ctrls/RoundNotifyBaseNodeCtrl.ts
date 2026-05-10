import { _decorator, Color, Component, Node, Sprite, Tween, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('RoundNotifyBaseNodeCtrl')
export class RoundNotifyBaseNodeCtrl extends Component {
   
    @property({type:Sprite,visible:true,tooltip:"玩家基地計時提示",displayName:"玩家基地計時提示Node"})
    private _baseTimeNotifySprite: Sprite = null!;

    @property({
        visible:true,
        tooltip:"透明度起始值，0~255",
        displayName:"透明度起始值",
        slide:true,
        range:[0,255]
    })
    private _startColorOpacity:number=128;

    @property({
        visible:true,
        tooltip:"是否注入填充顏色，注入後會使用fillColor作為底色，並且startColorOpacity和endColorOpacity會作用於fillColor的alpha通道",
        displayName:"是否注入填充顏色",
    })
    private _useFillColor:boolean=false;

    @property({
        type:Color,
        tooltip:"填充顏色，僅在useFillColor為true時生效",
        displayName:"填充顏色",
        visible:function(this:RoundNotifyBaseNodeCtrl){
            return this._useFillColor;
        }
    })
    private _fillColor:Color=new Color(255,255,255,255);
    
    @property({
        visible:true,
        tooltip:"漸變時間間隔，單位為秒",
        displayName:"漸變時間間隔",
    })
    private _aniFrequency:number=0;
    private _aniTween:Tween<any>|null=null;

    protected onLoad(): void {
        if(this._baseTimeNotifySprite && this._useFillColor){
            this._baseTimeNotifySprite.color=new Color(this._fillColor.r,this._fillColor.g,this._fillColor.b,this._startColorOpacity);
        }
    }
    
    private reset():void{
        
        this.node.angle=0;
        if(this._useFillColor){
            this._baseTimeNotifySprite.color=new Color(this._fillColor.r,this._fillColor.g,this._fillColor.b,this._startColorOpacity);
        }else{
            this._baseTimeNotifySprite.color=new Color(255,255,255,this._startColorOpacity);
        }
        
    }

    public moveRoundNotifyBaseNode(wPos: Vec3,localViewIndex:number):void{
        
        const rotation=localViewIndex*-90;//--左下缺角需要逆時針旋轉
        this.node.angle = rotation;
        this.node.setWorldPosition(wPos);
        
    }

    public stopAniTween():void{
        
        if(this._aniTween){
            this._aniTween.stop();
            this._aniTween=null;
        }
        this.reset();
        this.node.active=false;
    }

    public tweenColor():void{
        
        if(this._aniFrequency>0 && this.node.isValid){
            const targetColor=this._baseTimeNotifySprite.color;
            this._aniTween=new Tween(this._baseTimeNotifySprite)
            .to(this._aniFrequency,{ color: new Color(targetColor.r, targetColor.g, targetColor.b, 0) })
            .to(this._aniFrequency, { color: new Color(targetColor.r, targetColor.g, targetColor.b, this._startColorOpacity) })
            .union()
            .repeatForever()
            .start();
        }
    }
    


}


