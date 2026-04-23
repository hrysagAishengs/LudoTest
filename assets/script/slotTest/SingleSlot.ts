import { _decorator, CCInteger, Component, Graphics, Color, Mask, Layers, Node, Size, Sprite, SpriteFrame, tween, UITransform, v3, CCFloat, Enum } from 'cc';

//import { SymbolIconData } from './SymbolIconData';
import { SlotSymbolItem } from './SlotSymbolItem';
import { SymbolIconData } from './SymbolIconData';
const { ccclass, property } = _decorator;

/**
 * 老虎機初始化模式
 */
export enum SlotInitMode {
    /** 使用編輯器配置（開發/測試用） */
    EDITOR_CONFIG = 0,
    /** 運行時動態加載（生產環境） */
    RUNTIME_DYNAMIC = 1
}
/**
 *  const symbols = await loadFromServer(); // server返回的符號圖片數據，格式為 SymbolIconData[]
    const blurs = await loadBlursFromServer(); // 可選
    singleSlot.setRuntimeSymbols(symbols, blurs);
    singleSlot.init();
 * 
 */

@ccclass('SingleSlot')
export class SingleSlot extends Component {

    @property({ 
        type: Enum(SlotInitMode),
        displayName: "初始化模式",
        tooltip: "EDITOR_CONFIG=使用編輯器配置(開發測試), RUNTIME_DYNAMIC=運行時動態加載(生產環境)"
    })
    private _initMode: SlotInitMode = SlotInitMode.EDITOR_CONFIG;

    @property({ 
        type: [SymbolIconData], 
        visible: function() { return this._initMode === SlotInitMode.EDITOR_CONFIG; },
        displayName: "Symbol SpriteFrames",
        tooltip: "符號圖片資源（編輯器模式使用）"
    })
    private _editorSymbols: SymbolIconData[] = [];

    @property({ 
        type: [SymbolIconData],
        visible: function() { return this._initMode === SlotInitMode.EDITOR_CONFIG; },
        displayName: "Blur SpriteFrames (Optional)",
        tooltip: "模糊圖片資源（可選，若未設置則使用清晰圖）"
    })
    private _editorBlurs: SymbolIconData[] = [];

    // 運行時使用的數據（兩種模式共用）
    private _symbolSpriteFrames: SymbolIconData[] = [];
    private _blurSpriteFrames: SymbolIconData[] = [];

    @property({ type: CCInteger, visible: true, displayName: "MovingDistance", tooltip: "minimum moving distance for symbol" })
    private _movingDistance: number = 0;

    @property({ type: CCInteger, visible: true, displayName: "MovingSpeed", tooltip: "moving speed for symbol" })
    private _movingSpeed: number = 0;

    @property({ type: CCInteger, visible: true, displayName: "MaximumDistance", tooltip: "maximum moving distance" })
    private _maxDistance: number = 0;

    @property({ type: CCFloat, visible: true, displayName: "RollingTotalTime", tooltip: "total time for rolling(s)" })
    private _rollingTotalTime: number = 0;//--秒為單位

    @property({ type: SpriteFrame, visible: true, displayName: "SymbolFinalSpriteFrame", tooltip: "symbol Final SpriteFrame" })
    private _symbolFinalSpriteFrame: SpriteFrame = null;

    @property({ type: CCInteger, visible: true, displayName: "Acceleration", tooltip: "acceleration for symbol" })
    private _acceleration: number = 500;//--加速度

    @property({ type: CCInteger, visible: true, displayName: "maxVelocity", tooltip: "max velocity" })
    private _maxVelocity: number = 0;

    @property({ type: CCInteger, visible: true, displayName: "initialVelocity", tooltip: "init value for start Velocity" })
    private _initialVelocity: number = 1000; // 初始速度

    @property({ type: CCFloat, visible: true, displayName: "tweenBounceTime", tooltip: "bounce animation total time for tween" })
    private _tweenBounceTime: number = 1; // 彈跳動畫總時間(秒)

    private _startRollingIndexY: number = 0;
    private _velocity: number = 0;



    private _targetSymbolFinalY: number = 0; // 目標符號最終Y位置
    //--實際上真正在使用的rollingTotalTime(有另種情況是需要等待其他表演完才停止的狀況下需要改變TotalTime)
    private _realRollingTotalTime: number = 0;

    //================================================================================================
    private _slotSymbolItems: SlotSymbolItem[] = [];
    private _isStopping: boolean = false;
    private _countTime: number = 0;
    private _finalIconId: number = 0;
    private _resolvePromise: (() => void) | undefined; // promise resolve 函式
    private _stopResolvePromise: (() => void) | undefined; // promise resolve 函式(stop使用)
    private _ogStartRollingIndexY: number = 0;
    private _isConstantSpeed: boolean = false; // 是否進入等速運行

    public reset(): void {
        this._isStopping = false;
        this._countTime = 0;
        this._resolvePromise = undefined;
        this._stopResolvePromise = undefined;
        this._startRollingIndexY = this._ogStartRollingIndexY;
        this._velocity = this._initialVelocity; // 初始化速度
        this._targetSymbolFinalY = 0; // 初始化目標符號最終Y位置
        this._isConstantSpeed = false;
        if (this._slotSymbolItems) {
            for (let item of this._slotSymbolItems) {
                item.reset();
            }
        }

    }


    public clean(): void {
        this.reset();
        this._finalIconId = 0;
        console.log();
        if (this._slotSymbolItems) {
            while (this._slotSymbolItems.length > 0) {
                let symbol = this._slotSymbolItems.pop();
                this.node.removeChild(symbol.node);
                symbol.node.destroy();
            }
        }

    }

    /**
     * 設置運行時符號數據（RUNTIME_DYNAMIC 模式使用）
     * @param symbols 符號圖片數據
     * @param blurs 模糊圖片數據（可選）
     */
    public setRuntimeSymbols(symbols: SymbolIconData[], blurs?: SymbolIconData[]): void {
        this._symbolSpriteFrames = symbols;
        this._blurSpriteFrames = blurs || [];
    }

    public init(): void {
        // 根據模式初始化數據
        if (this._initMode === SlotInitMode.EDITOR_CONFIG) {
            this._symbolSpriteFrames = this._editorSymbols;
            this._blurSpriteFrames = this._editorBlurs;
        } else {
            // 運行時模式，需要先調用 setRuntimeSymbols
            if (this._symbolSpriteFrames.length === 0) {
                console.error('[SingleSlot] 運行時模式但未設置符號數據，請先調用 setRuntimeSymbols()');
                return;
            }
        }

        let maskSize: Size;

        for (let i = 0; i < 2; i++) {

            let symbolNode = new Node();
            symbolNode.layer = Layers.Enum.UI_2D;

            let uiTransform = symbolNode.addComponent(UITransform);
            let slotSymbolItem = symbolNode.addComponent(SlotSymbolItem);
            slotSymbolItem.normalSpriteFrame = this._symbolSpriteFrames[i].spriteFrame;
            slotSymbolItem.blurSpriteFrame = this.getBlurSpriteFramesSafe(this._symbolSpriteFrames[i].iconId);
            slotSymbolItem.spriteFrame = this._symbolSpriteFrames[i].spriteFrame;
            slotSymbolItem.symbolIndex = this._symbolSpriteFrames[i].iconId;
            slotSymbolItem.sizeMode = Sprite.SizeMode.CUSTOM;

            let ogSize = slotSymbolItem.spriteFrame.originalSize;
            maskSize = new Size(ogSize.width, ogSize.height);

            uiTransform.contentSize = maskSize;
            slotSymbolItem.maxDistance = -ogSize.height;
            slotSymbolItem.vy = 10;

            this._slotSymbolItems.push(slotSymbolItem);
            this.node.addChild(symbolNode);
            this._startRollingIndexY = ogSize.height;
            this._ogStartRollingIndexY = this._startRollingIndexY;

            if (i == 0) {
                slotSymbolItem.targetSymbol = true;

                //this._finalDistance=0;
            }
            if (i == 1) {
                //--上
                symbolNode.setPosition(0, ogSize.height);
            }

            /*
            if(i==2)
            {
                //-下
                symbolNode.setPosition(0,-ogSize.height);  
            }*/

            slotSymbolItem.initPosition = symbolNode.position;
            slotSymbolItem.movieDistance = symbolNode.position.y;
            slotSymbolItem.isRunning = true;
            slotSymbolItem.setOriginal();

        }

        this._velocity = this._initialVelocity; // 初始化速度
        this._targetSymbolFinalY = 0; // 初始化目標符號最終Y位置
        this._realRollingTotalTime = this._rollingTotalTime;

        //let mask = this.node.getComponent(Mask);
        let mask = this.node.parent.getComponent(Mask);//--改用sprit stencil來處理mask
        if (mask) {
            const spr = this.node.parent.getComponent(Sprite);
            //const uiTransform = this.node.getComponent(UITransform);
            if (spr) {
                const uiTransform = this.node.parent.getComponent(UITransform);
                uiTransform.contentSize = maskSize;
            }
            /*
            graphic.clear();
            graphic.fillColor = Color.WHITE;
            graphic.strokeColor = Color.WHITE;
            graphic.rect(-maskSize.width / 2, -maskSize.height / 2, maskSize.width, maskSize.height);
            graphic.fill();
            */

        } else {

            this.createMask(maskSize);
        }

    }

    private createMask(maskSize: Size): void {
        const mask = this.node.parent.addComponent(Mask);
        mask.type = Mask.Type.SPRITE_STENCIL;//--改用sprit stencil來處理mask
        //const spr = this.node.parent.getComponent(Sprite);
        let uiTransform = this.node.parent.getComponent(UITransform);
        if (!uiTransform) {
            uiTransform = this.node.parent.addComponent(UITransform);
        }
        uiTransform.setContentSize(maskSize.width, maskSize.height);

    }




    private run(deltaTime): void {
        //return;
        if (!this._isStopping) {
            this._countTime += deltaTime;

            if (!this._isConstantSpeed) {
                this._velocity += this._acceleration * deltaTime; // 加速度
                // 檢查是否達到最大速度，並切換到等速運行
                if (this._velocity >= this._maxVelocity) {
                    this._velocity = this._maxVelocity;
                    this._isConstantSpeed = true;
                }
            }

            if (this._countTime >= this._realRollingTotalTime) {
                this._isStopping = true;
            }
        }

        for (let i: number = 0; i < this._slotSymbolItems.length; i++) {

            let symbol = this._slotSymbolItems[i];

            if (symbol.isRunning) {
                let symbolY = this._velocity * deltaTime; // 使用deltaTime計算位移

                symbol.movieDistance -= symbolY;
                symbol.node.setPosition(v3(0, symbol.movieDistance, 0));

                if (symbol.node.position.y <= this._maxDistance) {

                    symbol.node.setPosition(v3(0, this._startRollingIndexY, 0));
                    symbol.movieDistance = this._startRollingIndexY;

                    if (this._isStopping) {

                        if (symbol.targetSymbol) {
                            symbol.spriteFrame = this.getSymbolIconSpriteFrame(this._finalIconId);
                            symbol.symbolIndex = this._finalIconId;
                            symbol.finalRolling = true;
                            this._targetSymbolFinalY = 0; // 設置目標符號最終Y位置  
                        } else {

                            symbol.isRunning = false;
                        }

                    } else {
                        let index = this.getRandomSymbolIndex();
                        symbol.normalSpriteFrame = this.getSymbolIconSpriteFrame(index);
                        symbol.blurSpriteFrame = this.getBlurSpriteFramesSafe(index);
                        symbol.setBlur();
                        symbol.symbolIndex = index;
                    }
                }
            }
        }

        if (this._isStopping) {
            let targetSymbol: SlotSymbolItem = this._slotSymbolItems.find(item => item.finalRolling);

            if (targetSymbol) {
                if (targetSymbol.node.position.y == this._startRollingIndexY) {
                    if (!targetSymbol.isTweenign) {
                        //this.unschedule(this.run);
                        targetSymbol.isTweenign = true;
                        tween(targetSymbol.node)
                            .to(this._tweenBounceTime, { position: v3(0, this._targetSymbolFinalY, 0) }, { easing: 'elasticOut' })
                            .call(() => {
                                this.unschedule(this.run);
                                if (this._resolvePromise) {
                                    this._resolvePromise();
                                    this._resolvePromise = undefined;
                                }
                                if (this._stopResolvePromise) {
                                    this._stopResolvePromise();
                                    this._stopResolvePromise = undefined;
                                }
                            })
                            .start()
                    }
                }

            }

        }
    }

    /**
     * 獲取模糊圖片（可選）
     * 如果沒有模糊圖片配置，則返回清晰圖片
     */
    private getBlurSpriteFramesSafe(iconId: number): SpriteFrame {
        // 如果沒有配置模糊圖片，返回清晰圖片
        if (this._blurSpriteFrames.length === 0) {
            return this.getSymbolIconSpriteFrame(iconId);
        }
        
        let symbolIconData = this._blurSpriteFrames.find(item => item.iconId == iconId);
        // 如果找不到對應的模糊圖，也返回清晰圖
        return symbolIconData ? symbolIconData.spriteFrame : this.getSymbolIconSpriteFrame(iconId);
    }

    private getSymbolIconSpriteFrame(iconId: number): SpriteFrame {
        let symbolIconData = this._symbolSpriteFrames.find(item => item.iconId == iconId);
        return symbolIconData.spriteFrame;
    }

    private getRandomSymbolIndex(extraNum?: number): number {

        let availableIndices: number[] = [];
        let currentSymbolIndices: number[] = this._slotSymbolItems.map(item => item.symbolIndex);

        if (extraNum && !currentSymbolIndices.includes(extraNum)) {
            currentSymbolIndices.push(extraNum);
        }
        // 建立可用的索引列表
        for (let i = 0; i < this._symbolSpriteFrames.length; i++) {
            if (!currentSymbolIndices.includes(this._symbolSpriteFrames[i].iconId)) {
                availableIndices.push(this._symbolSpriteFrames[i].iconId);
            }
        }
        // 如果沒有可用的索引，則返回 -1
        if (availableIndices.length === 0) {
            return -1;
        }
        // 從可用索引列表中隨機選擇一個索引
        let randomIndex = Math.floor(Math.random() * availableIndices.length);
        return availableIndices[randomIndex];
    }

    private resetSymbolData(starItem: number): void {
        this._isStopping = false;
        this._countTime = 0;
        this._velocity = this._initialVelocity; // 重置速度
        this._targetSymbolFinalY = 0; // 重置目標符號最終Y位置

        for (let symbol of this._slotSymbolItems) {
            if (symbol.targetSymbol) {
                symbol.normalSpriteFrame = this.getSymbolIconSpriteFrame(starItem);
                symbol.blurSpriteFrame = this.getBlurSpriteFramesSafe(starItem);
                symbol.setNormal();
                symbol.symbolIndex = starItem;

            } else {

                let index = this.getRandomSymbolIndex(starItem);
                symbol.normalSpriteFrame = this.getSymbolIconSpriteFrame(index);
                symbol.blurSpriteFrame = this.getBlurSpriteFramesSafe(index);
                symbol.setBlur();
                symbol.symbolIndex = index;
            }
            symbol.isRunning = true;
            symbol.finalRolling = false;
            symbol.isTweenign = false;
            symbol.node.setPosition(symbol.initPosition);
        }

    }

    //--改變滾動時間
    public changeRollingTotalTime(rollingTotalTime: number): void {
        if (rollingTotalTime > 0) {
            this._realRollingTotalTime = rollingTotalTime;
        }
    }
    //--使用極限大的滾動時間(通常是需要外部控制停止時機使用)
    public useMaxnumRollingTime(): void {
        this._realRollingTotalTime = Infinity;
    }
    //--使用預設設定的rollingTime
    public useDefaultRollingTime(): void {
        this._realRollingTotalTime = this._rollingTotalTime;
    }
    //--強制停輪
    public async stopRolling(): Promise<void> {
        this._isStopping = true;
        return new Promise<void>((resolve) => {
            this._stopResolvePromise = resolve; // 儲存 resolve 函式
        });
    }

    //---滾動開始並且指定盤面上初始的圖案
    public startRolling(finalIconId: number, starItem?: number): void {
        let previousValue: number = this._finalIconId;
        this._finalIconId = finalIconId;
        let realStartItem: number = starItem ? starItem : previousValue;//--沒有填就用上一把的結果當作開始圖案
        this.resetSymbolData(realStartItem);
        this.schedule(this.run, 0);
    }

    //---滾動開始(promise)並且指定盤面上初始的圖案
    public runPromiseRolling(finalIconId: number, starItem?: number): Promise<void> {
        return new Promise<void>((resolve) => {
            this._resolvePromise = resolve; // 儲存 resolve 函式
            this.startRolling(finalIconId, starItem); // 開始滾動
        });
    }


}


