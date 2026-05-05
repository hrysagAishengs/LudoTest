import { _decorator, Component, Material, Sprite, tween, Vec4 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('TestShader_OG')
export class TestShader_OG extends Component {
    @property(Sprite)
    sprite !: Sprite;

    private _material: Material = null!;
    private _uvRect: Vec4 = new Vec4(0, 0, 1, 1);

    start() {
        this._material = this.sprite.getMaterialInstance(0);
        this.syncUvRect();
    }

    public playProgressTween(duration: number = 1, from: number = 0, to: number = 1): void {
        if (!this._material) {
            this._material = this.sprite.getMaterialInstance(0);
        }

        this.syncUvRect();

        console.log('[TestShader_OG] playProgressTween start');
        console.log('[TestShader_OG] from:', from, 'to:', to);

        const state = { progress: from };
        this._material.setProperty('progress', state.progress);

        console.log('[TestShader_OG] set progress:', state.progress);

        tween(state)
            .to(duration, { progress: to }, {
                onUpdate: () => {
                    this._material.setProperty('progress', state.progress);
                    console.log('[TestShader_OG] tween progress:', state.progress);
                }
            })
            .start();
    }

    public syncUvRect(): void {
        if (!this.sprite || !this._material || !this.sprite.spriteFrame) {
            return;
        }

        /*
         * SpriteFrame.uv 內含四個頂點實際對應到貼圖 / atlas 的 UV。
         * RectBoardFill 若要修正 atlas UV 問題，可以用這個 uvRect 轉回 local 0~1。
         */
        const uv = this.sprite.spriteFrame.uv;
        if (!uv || uv.length < 8) {
            console.warn('[TestShader_OG] SpriteFrame uv is invalid, skip uvRect sync.', uv);
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
        this._uvRect.set(minU, minV, maxU - minU, maxV - minV);
        this._material.setProperty('uvRect', this._uvRect);

        console.log('[TestShader_OG] spriteFrame uv:', uv);
        console.log('[TestShader_OG] uvRect:', this._uvRect);
    }
}
