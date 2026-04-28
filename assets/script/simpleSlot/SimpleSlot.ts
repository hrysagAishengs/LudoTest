import { _decorator, Component, Node, Sprite, SpriteFrame, UITransform, Size, Vec3, tween, Enum, Tween, math } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('SymbolMapping')
class SymbolMapping {
    @property({ displayName: '符號 ID' }) 
    public id: number = 0;
    @property({ type: SpriteFrame, displayName: '對應圖片' }) 
    public spriteFrame: SpriteFrame = null!;
}

enum RollDirection { UP_TO_DOWN = 1, DOWN_TO_UP = -1 }
export interface IRollData { symbolId: number; }

@ccclass('SimpleSlot')
export class SimpleSlot extends Component {

    // --- 編輯器屬性 ---
    @property({ type: [SymbolMapping], displayName: 'Symbol 映射設定' })
    public symbolConfigs: SymbolMapping[] = [];

    @property({ displayName: 'Symbol 尺寸' })
    private _symbolSize: Size = new Size(200, 200);
    @property
    get symbolSize() { return this._symbolSize; }
    set symbolSize(v) { this._symbolSize = v; this.refreshLayout(); }

    @property
    private _stepDistance: number = 100;// 預設 symbolSize.height / 2

    @property({ displayName: '步進距離 (預設半格)' })
    get stepDistance() { return this._stepDistance; }
    set stepDistance(v) { 
        this._stepDistance = v; 
        // 你可以在這裡加入一些保護邏輯，例如不允許為 0
        if(v <= 0) this._stepDistance = 1;
    }

    @property({ displayName: '每次更新(步進)的時間0.05 ~ 0.08' })
    public updateInterval: number = 0.1;

    @property({ type: Enum(RollDirection), displayName: '移動方向' })
    public direction: RollDirection = RollDirection.UP_TO_DOWN;

    @property({ displayName: 'Symbol 間距' })
    public spacing: number = 0;

    @property({ displayName: '使用加速' }) 
    public useAcceleration: boolean = true;
    
    @property({ displayName: '使用減速' }) 
    public useDeceleration: boolean = true;

    @property({ displayName: '固定滾行時間 (方案一)' })
    public idleDuration: number = 2.0;

    // --- 內部變數 ---
    private _nodes: Node[] = []; 
    private _content: Node = null!;
    private _mainTween: Tween<Node> = null!;
    private _isRolling: boolean = false;
    private _symbolMap: Map<number, SpriteFrame> = new Map();
    private _fullGridUnit: number = 0; 
    
    // 流程控制
    private _isStopping: boolean = false;
    private _tempDataIndex: number = 0;
    private _stopResolve: ((value: void | PromiseLike<void>) => void) | null = null;
    private _isWaitingForResult: boolean = false;

    onLoad() {
        this.initMap();
        this.initHierarchy();
        this.initDisplay();
    }

    private initDisplay() {
        // 初始狀態下：
        // _nodes[0] 是上方待命
        // _nodes[1] 是中心顯示 (最重要的那一格)
        // _nodes[2] 是下方待命

        const keys = Array.from(this._symbolMap.keys());
        if (keys.length === 0) return;

        this._nodes.forEach((node, index) => {
            const sp = node.getComponent(Sprite);
            if (sp) {
                // 隨機給予初始圖案，或者你可以指定 id
                const randomId = keys[Math.floor(Math.random() * keys.length)];
                sp.spriteFrame = this._symbolMap.get(randomId) || null;
            }
        });
    }

    private initMap() {
        this._symbolMap.clear();
        this.symbolConfigs.forEach(c => this._symbolMap.set(c.id, c.spriteFrame));
    }

    private initHierarchy() {
        this._content = new Node("Content");
        this.node.addChild(this._content);
        this.getComponent(UITransform)!.setContentSize(this._symbolSize);
        for (let i = 0; i < 3; i++) {
            let n = new Node(`Symbol_${i}`);
            n.addComponent(UITransform).setContentSize(this._symbolSize);
            n.addComponent(Sprite).sizeMode = Sprite.SizeMode.CUSTOM;
            this._content.addChild(n);
            this._nodes.push(n);
        }
        this._fullGridUnit = this._symbolSize.height + this.spacing;
        this.refreshLayout();
    }

    private refreshLayout() {
        const step = this._symbolSize.height + this.spacing;
        this._nodes[0].setPosition(0, step, 0);
        this._nodes[1].setPosition(0, 0, 0);
        this._nodes[2].setPosition(0, -step, 0);
        console.log();
    }

    /**
     * 計算總時間 = 加速(假設0.5s) + idleDuration + 最終資料移動時間
     */
    public getEstimatedTotalTime(dataCount: number): number {
        const accelTime = this.useAcceleration ? 0.5 : 0;
        const resultTime = dataCount * this.updateInterval * (this.stepDistance / (this._symbolSize.height + this.spacing));
        return accelTime + this.idleDuration + resultTime;
    }

    
    /**
     * 開始滾動
     * @param resultData 若傳入則跑固定時間後停止；若不傳則進入無限滾動模式。
     */
    public async startRoll(resultData?: IRollData[]): Promise<void> {
        if (this._isRolling) return;
        this._isRolling = true;
        this._isStopping = false;
        this._tempDataIndex = 0;
        this.initMap();

        const fullGridDist = this._symbolSize.height + this.spacing;
        const moveSign = this.direction === RollDirection.UP_TO_DOWN ? -1 : 1;
        const timePerFullGrid = fullGridDist / (this._stepDistance / this.updateInterval);

        return new Promise(async (resolve) => {
            this._stopResolve = resolve; // 保存 resolve 勾子

            if (resultData) {
                // --- 模式 A：固定時長模式 (原本邏輯) ---
                const resultTotalGrids = resultData.length + 1;
                const resultTime = resultTotalGrids * timePerFullGrid;

                // 原本邏輯（保留）
                const dynamicIdleDuration = Math.max(0.1, this.idleDuration - resultTime);
                const minIdleGrids = Math.ceil(dynamicIdleDuration / timePerFullGrid);

                // =======================
                //  加速段（可選）
                // =======================
                if (this.useAcceleration) {
                    const accelGrids = 2;
                    const accelTime = accelGrids * timePerFullGrid;

                    const accelTargetY =
                        this._content.position.y + (accelGrids * fullGridDist) * moveSign;

                    await this.runTweenTo(accelTargetY, accelTime, "quadIn", false);
                }

                // =======================
                // 等速段（原本 idle）
                // =======================
                const idleGrids = minIdleGrids;
                const idleTime = idleGrids * timePerFullGrid;

                const idleTargetY =
                    this._content.position.y + (idleGrids * fullGridDist) * moveSign;

                await this.runTweenTo(
                    idleTargetY,
                    idleTime,
                    "linear", // 固定等速
                    false
                );

                // =======================
                //  結果段（完全不動）
                // =======================
                await this.executeResultStep(
                    resultData,
                    resultTotalGrids,
                    resultTime,
                    idleTargetY,
                    moveSign
                );
                /*
                const resultTotalGrids = resultData.length + 1;
                const resultTime = resultTotalGrids * timePerFullGrid;
                const dynamicIdleDuration = Math.max(0.1, this.idleDuration - resultTime);
                const minIdleGrids = Math.ceil(dynamicIdleDuration / timePerFullGrid);
                
                const idleTargetY = this._content.position.y + (minIdleGrids * fullGridDist) * moveSign;
                await this.runTweenTo(idleTargetY, minIdleGrids * timePerFullGrid, this.useAcceleration ? "quadIn" : "linear", false);
                
                await this.executeResultStep(resultData, resultTotalGrids, resultTime, idleTargetY, moveSign);
                */
            } else {
                // --- 模式 B：無限滾動模式 ---
                this._isWaitingForResult = true;
                
                const accelGrids = 2;
                const accelTargetY = this._content.position.y + (accelGrids * fullGridDist) * moveSign;
                //  用同一套速度計算時間
                const accelTime = accelGrids * timePerFullGrid;

                await this.runTweenTo(
                    accelTargetY,
                    accelTime,
                    this.useAcceleration ? "quadIn" : "linear",
                    false
                );

                // 進入循環空轉，直到 _isWaitingForResult 變為 false
                while (this._isWaitingForResult) {
                    const loopGrids = 5; // 每次循環跑 5 格
                    const loopTargetY = this._content.position.y + (loopGrids * fullGridDist) * moveSign;
                    const loopTime = loopGrids * timePerFullGrid;
                    await this.runTweenTo(loopTargetY, loopTime, "linear", false);
                }
            }
        });
    }

    /**
     * 外部呼叫停止：送入最終結果資料
     */
    public async stopRoll(resultData: IRollData[]): Promise<void> {
        if (!this._isRolling || !this._isWaitingForResult) return;

        this._isWaitingForResult = false; // 標記為停止，while 迴圈會結束
        
        // 停止當前正在跑的循環 Tween，立即進入結果段
        if (this._mainTween) this._mainTween.stop();

        const fullGridDist = this._symbolSize.height + this.spacing;
        const moveSign = this.direction === RollDirection.UP_TO_DOWN ? -1 : 1;
        const timePerFullGrid = fullGridDist / (this._stepDistance / this.updateInterval);

        // 強迫對齊當前位置到最近的一格，避免停在半格中間
        const currentY = this._content.position.y;
        const alignedY = Math.round(currentY / fullGridDist) * fullGridDist;

        const resultTotalGrids = resultData.length + 1;
        const resultTime = resultTotalGrids * timePerFullGrid;

        await this.executeResultStep(resultData, resultTotalGrids, resultTime, alignedY, moveSign);
    }

    /**
     * 提取出來的結果段執行邏輯
     */
    private async executeResultStep(data: IRollData[], grids: number, time: number, startY: number, moveSign: number) {
        const resultDist = (grids * this._fullGridUnit) * moveSign;
        const resultTargetY = startY + resultDist;

        await this.runTweenTo(resultTargetY, time, this.useDeceleration ? "quadOut" : "linear", true, data);
        
        this._isRolling = false;
        if (this._stopResolve) {
            this._stopResolve();
            this._stopResolve = null;
        }
    }

    /**
     * 通用 Tween 移動方法 (移動到絕對位置)
     */
    private runTweenTo(targetY: number, duration: number, easing: any, isResultStage: boolean, data: IRollData[] = []): Promise<void> {
        return new Promise((resolve) => {
            const fullGridDist = this._symbolSize.height + this.spacing;
            this._mainTween = tween(this._content)
                .to(duration, { position: new Vec3(0, targetY, 0) }, {
                    easing: easing,
                    onUpdate: (target: Node) => {
                        // 偵錯用：console.log(`ContentY: ${target.position.y}`);
                        //console.log('_stepDistance',this._stepDistance);
                        this.checkLoop(target.position.y, fullGridDist, isResultStage, data);
                    }
                })
                .call(() => resolve())
                .start();
        });
    }



    private checkLoop(contentY: number, fullGridDist: number, isResultStage: boolean, data: IRollData[]) {
        const totalHeight = fullGridDist * 3; // 128 * 3 = 384

        this._nodes.forEach(node => {
            // 節點相對於 Roller 中心點的實際位置
            const worldY = node.position.y + contentY;

            if (this.direction === RollDirection.UP_TO_DOWN) {
                // 由上往下滾：節點 Y 越來越小。當小於負的一格高度時，判定為出界
                if (worldY < -fullGridDist) {
                    // 瞬移到最上方：原本位置 + 總長度
                    node.setPosition(0, node.position.y + totalHeight, 0);
                    this.updateTexture(node, isResultStage, data);
                }
            } else {
                // 由下往上滾：節點 Y 越來越大。當大於正的一格高度時，判定為出界
                if (worldY > fullGridDist) {
                    // 瞬移到最下方
                    node.setPosition(0, node.position.y - totalHeight, 0);
                    this.updateTexture(node, isResultStage, data);
                }
            }
        });
    }

    private updateTexture(node: Node, isResultStage: boolean, data: IRollData[]) {
        const sp = node.getComponent(Sprite);
        if (!sp) return;

        if (isResultStage) {
            // --- 確保不會越界取值  ---
            if (this._tempDataIndex < data.length) {
                const targetId = data[this._tempDataIndex].symbolId;
                const sf = this._symbolMap.get(targetId);
                
                if (sf) {
                    sp.spriteFrame = sf;
                    console.log(`[Result] 節點 ${node.name} 更換為 ID: ${targetId}, Index: ${this._tempDataIndex}`);
                }
                
                this._tempDataIndex++;
            } else {
                // 如果結果資料用完了，滾輪還在跑（這不該發生，但為了保險），就循環顯示最後一筆
                const lastId = data[data.length - 1].symbolId;
                sp.spriteFrame = this._symbolMap.get(lastId) || null;
            }
        } else {
            // Idle 階段... (保持原樣)
            const keys = Array.from(this._symbolMap.keys());
            const randomId = keys[Math.floor(Math.random() * keys.length)];
            sp.spriteFrame = this._symbolMap.get(randomId) || null;
        }
    }

    public stop() {
        if (this._mainTween) {
            this._mainTween.stop();
            this._isStopping = true;
            this._isRolling = false;
        }
    }
}