import { _decorator, CCFloat, CCInteger, Color, Component, Enum, Material, Node, Sprite, Tween, tween, UITransform, Vec4 } from 'cc';
/**
     * RectBoardFill2 startOffset reference:
     * 0.000 = top left
     * 0.125 = top center
     * 0.250 = top right
     * 0.375 = right center
     * 0.500 = bottom right
     * 0.625 = bottom center
     * 0.750 = bottom left
     * 0.875 = left center
     *
     * direction:
     * 0 = original direction
     * 1 = reverse direction
     *
     * colorProgressMode:
     * 0 = color switch follows progress 0 -> 1
     * 1 = color switch follows progress 1 -> 0
     */
export enum FillDirection {
    TOP_LEFT,
    TOP_CENTER,
    TOP_RIGHT,
    RIGHT_CENTER,
    BOTTOM_RIGHT,
    BOTTOM_CENTER,
    BOTTOM_LEFT,
    LEFT_CENTER
}

Enum(FillDirection);

const { ccclass, property } = _decorator;

@ccclass('RectBoardFillLine')
export class RectBoardFillLine extends Component {
    @property(Sprite)
    sprite !: Sprite;

    @property({displayName:"線條厚度",tooltip:"線條厚度，0~0.5，相對於 Sprite 的矩形。"})
    thickness: number = 0.04;

    /**
     *  thicknessPx 預設現在是 0，如果 useThicknessPx = 1，描邊厚度會變成 0，
     *  看起來可能像沒描邊。建議面板測試時：
     *  useThicknessPx = 1
        thicknessPx = 8 或 10
     */
    @property({ 
        displayName: "使用像素厚度", 
        tooltip: "是否使用像素厚度，優先於 thickness 屬性。",
        slide: true, 
        range: [0, 1] 
    })
    useThicknessPx: number = 0;

    @property({ 
        type:CCInteger,
        displayName: "線條厚度 (像素)", 
        tooltip: "線條厚度，單位為像素，優先於 thickness 屬性。",
    })
    thicknessPx: number = 0;

    @property({ 
        type: Enum(FillDirection), 
        displayName: "起始位置", 
        tooltip: "填充起始位置，參考 FillDirection 枚舉。" 
    })
    startOffset: FillDirection = FillDirection.TOP_CENTER;

    @property({ 
        type: Color, 
        displayName: "起始顏色",
        tooltip: "請選擇面板的起始填充顏色" 
    })
    borderColor: Color = new Color(0, 255, 0, 255); // 預設為綠

    @property({ 
        type: Color, 
        displayName: "結束顏色",
        tooltip: "請選擇面板的結束填充顏色" 
    })
    borderColor2: Color = new Color(255, 0, 0, 255); // 預設為紅

    @property({ 
        displayName: "填充方向", 
        tooltip: "填充方向，0 = 順時針，1 = 逆時針。",
        slide: true, 
        range: [0, 1, 0.01] 
    })
    colorSwitchProgress: number = 0.5;

    @property({ 
        displayName: "顏色切換模式", 
        tooltip: "顏色切換模式，0 = 顏色切換跟隨 progress 0 -> 1，1 = 顏色切換跟隨 progress 1 -> 0",
        slide: true, 
        range: [0, 1, 0.01] 
    })
    colorProgressMode: number = 0.0;

    @property({ 
        displayName: "使用顏色混合", 
        tooltip: "是否使用顏色混合，當進度在 colorSwitchProgress 前後切換時，是否將兩種顏色混合。",
        slide: true, 
        range: [0, 1, 0.01] 
    })
    useColorBlend: number = 0;

    @property({ 
        displayName: "繪圖方向", 
        tooltip: "繪圖方向，0 = 順時針，1 = 逆時針。",
        slide: true, 
        range: [0, 1] 
    })
    direction: number = 0;

    @property({
        displayName: "初始進度",
        slide: true,
        range: [0, 1, 0.01]
    })
    progress: number = 0;


    private _material: Material = null!;
    private _spriteInfo: Vec4 = new Vec4();
    private _uvRect: Vec4 = new Vec4(0, 0, 1, 1);
    private _tween: Tween<any> | null = null;

    start() {
        this.init();
    }

    protected onEnable(): void {
       
    }

    public playProgressTween(duration: number = 1, from: number = 1, to: number = 0): void {
        this.ensureMaterial();
        this.syncMaterialData();

        console.log('[TestShader] playProgressTween start');
        console.log('[TestShader] from:', from, 'to:', to);

        const state = { progress: from };
        this._material.setProperty('colorProgressMode', from > to ? 1 : 0);
        this._material.setProperty('progress', state.progress);

        console.log('[TestShader] set progress:', state.progress);
        this._tween=new Tween(state)
            .to(duration, { progress: to }, {
                onUpdate: () => {
                    this._material.setProperty('progress', state.progress);
                    console.log('[TestShader] tween progress:', state.progress);
                }
            })
            .call(() => {
                this._tween = null;
            })
            .start();
    }

    public resetProgress(): void {
        this.stopProgressTween();
        this.init();
    }

    public stopProgressTween(): void {
        if (this._tween) {
            this._tween.stop();
            this._tween = null;
        }
    }

    public setRectBoardFillProperty(propertyName: string, value: number | Vec4 | Color): void {
        this.ensureMaterial();
        this.syncMaterialData();
        this._material.setProperty(propertyName, value);
    }

    private init(): void {
        
        this._material = this.sprite.getMaterialInstance(0);
        this.syncMaterialData(); 
    }


    private initProperty(): void {
        if (!this._material) {
            return;
        }

        this._material.setProperty('thickness', this.thickness);
        this._material.setProperty('useThicknessPx', this.useThicknessPx);
        this._material.setProperty('thicknessPx', this.thicknessPx);
        this._material.setProperty('startOffset', this.getStartOffsetValue(this.startOffset));
        this._material.setProperty('borderColor', this.borderColor);
        this._material.setProperty('borderColor2', this.borderColor2);
        this._material.setProperty('colorSwitchProgress', this.colorSwitchProgress);
        this._material.setProperty('colorProgressMode', this.colorProgressMode);
        this._material.setProperty('useColorBlend', this.useColorBlend);
        this._material.setProperty('direction', this.direction);
        this._material.setProperty('progress', this.progress);
    }

    private ensureMaterial(): void {
        if (!this._material) {
            this._material = this.sprite.getMaterialInstance(0);
        }
    }

    private syncMaterialData(): void {
        // spriteInfo 先保留，方便比對 local position 方案。
        // uvRect 是 RectBoardFill2 目前實際使用的方案。
        this.initProperty();
        this.syncSpriteInfo();
        this.syncUvRect();
    }

    private syncSpriteInfo(): void {
        if (!this.sprite || !this._material) {
            return;
        }

        const uiTransform = this.sprite.getComponent(UITransform);
        if (!uiTransform) {
            console.warn('[TestShader] Sprite missing UITransform, skip spriteInfo sync.');
            return;
        }

        const size = uiTransform.contentSize;
        const anchor = uiTransform.anchorPoint;
        this._spriteInfo.set(size.width, size.height, anchor.x, anchor.y);
        this._material.setProperty('spriteInfo', this._spriteInfo);

        console.log('[TestShader] spriteInfo:', this._spriteInfo);
    }

    private syncUvRect(): void {
        if (!this.sprite || !this._material || !this.sprite.spriteFrame) {
            return;
        }

        // SpriteFrame.uv 內含四個頂點實際對應到貼圖 / atlas 的 UV。
        // shader 需要這個範圍，才能把 v_uv0 轉回 Sprite 自己的 0~1 UV。
        const uv = this.sprite.spriteFrame.uv;
        if (!uv || uv.length < 8) {
            console.warn('[TestShader] SpriteFrame uv is invalid, skip uvRect sync.', uv);
            return;
        }

        let minU = uv[0];
        let maxU = uv[0];
        let minV = uv[1];
        let maxV = uv[1];

        for (let i = 2; i < uv.length; i += 2) {
            const u = uv[i];
            const v = uv[i + 1];
            minU = Math.min(minU, u);
            maxU = Math.max(maxU, u);
            minV = Math.min(minV, v);
            maxV = Math.max(maxV, v);
        }

        // uvRect = [minU, minV, width, height]。
        // shader 取樣仍使用 v_uv0，邊框判斷則使用正規化後的 local UV。
        this._uvRect.set(minU, minV, maxU - minU, maxV - minV);
        this._material.setProperty('uvRect', this._uvRect);

        console.log('[TestShader] spriteFrame uv:', uv);
        console.log('[TestShader] uvRect:', this._uvRect);
    }

    private getStartOffsetValue(position: FillDirection): number {
        
        switch (position) {
            case FillDirection.TOP_LEFT:
                return 0.000;
            case FillDirection.TOP_CENTER:
                return 0.125;
            case FillDirection.TOP_RIGHT:
                return 0.250;
            case FillDirection.RIGHT_CENTER:
                return 0.375;
            case FillDirection.BOTTOM_RIGHT:
                return 0.500;
            case FillDirection.BOTTOM_CENTER:
                return 0.625;
            case FillDirection.BOTTOM_LEFT:
                return 0.750;
            case FillDirection.LEFT_CENTER:
                return 0.875;
            default:
                return 0.125;
        }
    }

}


