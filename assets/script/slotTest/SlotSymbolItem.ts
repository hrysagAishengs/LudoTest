import { _decorator, Component, Node, Sprite, SpriteFrame, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('SlotSymbolItem')
export class SlotSymbolItem extends Sprite {

    public symbolIndex: number = 0;

    public targetSymbol: boolean = false;

    public finalRolling: boolean = false;

    public isRunning: boolean = false;

    public isTweenign: boolean = false;

    public initPosition: Vec3 = null;

    private _blurSpriteFrame: SpriteFrame = null;

    //--reSet要用的參數
    private _ogMovieDistance: number;
    private _ogVy: number;
    private _ogMaxDistance: number;
    private _ogFinalRolling: boolean;
    private _ogPosition: Vec3;

    set blurSpriteFrame(value: SpriteFrame) {
        this._blurSpriteFrame = value;
    }

    private _normalSpriteFrame: SpriteFrame = null;

    set normalSpriteFrame(value: SpriteFrame) {
        this._normalSpriteFrame = value;
    }

    public vy: number = 0;

    public maxDistance: number = 0;

    public movieDistance: number = 0;


    constructor() {
        super();
    }

    public setBlur(): void {
        this.spriteFrame = this._blurSpriteFrame;
    }

    public setNormal(): void {
        this.spriteFrame = this._normalSpriteFrame;
    }

    public reset(): void {
        this.node.setPosition(this._ogPosition);
        this.movieDistance = this._ogMovieDistance;
        this.vy = this._ogVy;
        this.maxDistance = this._ogMaxDistance;
        this.finalRolling = this._ogFinalRolling;
        this.isRunning = false;
        this.isTweenign = false;
    }

    public setOriginal(): void {
        this._ogPosition = this.node.position.clone();
        this._ogMovieDistance = this.movieDistance;
        this._ogVy = this.vy;
        this._ogMaxDistance = this.maxDistance;
        this._ogFinalRolling = this.finalRolling;
    }
}


