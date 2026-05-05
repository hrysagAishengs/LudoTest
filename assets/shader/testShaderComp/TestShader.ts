import { _decorator, Component, Material, Sprite, tween, UITransform, Vec4 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('TestShader')
export class TestShader extends Component {
    @property(Sprite)
    sprite !: Sprite;
    private _material: Material = null!;
    private _spriteInfo: Vec4 = new Vec4();
    private _uvRect: Vec4 = new Vec4(0, 0, 1, 1);

    start() {
        this._material = this.sprite.getMaterialInstance(0);
        this.syncMaterialData();
    }

    public playProgressTween(duration: number = 1, from: number = 1, to: number = 0): void {
        if (!this._material) {
            this._material = this.sprite.getMaterialInstance(0);
        }
        this.syncMaterialData();

        console.log('[TestShader] playProgressTween start');
        console.log('[TestShader] from:', from, 'to:', to);

        const state = { progress: from };
        this._material.setProperty('progress', state.progress);

        console.log('[TestShader] set progress:', state.progress);

        tween(state)
            .to(duration, { progress: to }, {
                onUpdate: () => {
                    this._material.setProperty('progress', state.progress);
                    console.log('[TestShader] tween progress:', state.progress);
                }
            })
            .start();
    }

    private syncMaterialData(): void {
        // spriteInfo 先保留，方便比對 local position 方案。
        // uvRect 是 RectBoardFill2 目前實際使用的方案。
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
}
