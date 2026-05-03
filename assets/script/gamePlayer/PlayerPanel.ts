import { _decorator, Component, Label, Node, Sprite, SpriteFrame, Color, color } from 'cc';
import { IPlayerIdentity, IPlayerStatus } from './def/PlayerDataDef';

const COLOR_LIST=new Map<number,Color>([
    [0,color(140, 210, 255, 255)],//藍
    [1,color(255, 120, 130, 255)],//紅
    [2,color(150, 220, 160, 255)],//綠
    [3,color(255, 245, 160, 255)]//黃
]);
const { ccclass, property } = _decorator;

/**
 * 玩家面板 UI 組件
 * 負責顯示單個玩家的資訊和狀態
 */
@ccclass('PlayerPanel')
export class PlayerPanel extends Component {
   
    @property({type:Label, tooltip:"玩家名稱",visible:true,displayName:'玩家名稱'})
    private _playerNameLabel: Label = null;

    @property({type:Label, tooltip:"玩家金錢",visible:true,displayName:'玩家金錢'})
    private _playerMoneyLabel: Label = null;

    @property({type:Sprite, tooltip:"玩家頭像",visible:true,displayName:'玩家頭像'})
    private _playerAvatar: Sprite = null;

    @property({type:Node,tooltip:'骰子動畫節點',visible:true,displayName:'骰子動畫'})
    private _diceAnimationNode: Node = null;

    @property({type:Sprite,tooltip:'骰子結果圖',visible:true,displayName:'骰子結果'})
    private _diceResultSprite: Sprite = null;

    @property({type:Node,tooltip:'計時器動畫節點',visible:true,displayName:'計時器動畫'})
    private _timerAnimationNode: Node = null;

    @property({type:Label,tooltip:'倒計時文本',visible:true,displayName:'倒計時'})
    private _countdownLabel: Label = null;

    @property({type:Node,tooltip:'回合指示器',visible:true,displayName:'回合指示器'})
    private _turnIndicator: Node = null;

    @property({type:Label,tooltip:'提示文本',visible:true,displayName:'提示文本'})
    private _tipLabel: Label = null;

    @property({type:Node,tooltip:'托管圖標',visible:true,displayName:'托管圖標'})
    private _autoModeIcon: Node = null;

    @property({type:Label,tooltip:'DevTable',visible:true,displayName:'Dev桌號'})
    private _devTableLabel: Label = null;

    @property({type:Label,tooltip:'DevDiceResult',visible:true,displayName:'Dev骰子結果'})
    private _devDiceResultLabel: Label = null;

    @property({type:Label,tooltip:'DevInfo',visible:true,displayName:'Dev資訊'})
    private _devInfoLabel: Label = null;

    @property({type:Node,tooltip:'bg',visible:true,displayName:'背景'})
    private _bgNode: Node = null;

    /** 骰子點數對應的圖集 */
    private _diceSpriteFrames: SpriteFrame[] = [];
    
    /** 倒計時計時器句柄 */
    private _countdownTimer: number = 0;

    /**
     * 設置骰子圖集
     * @param frames - 骰子點數對應的 SpriteFrame 數組 (1-6 對應索引 0-5)
     */
    set diceSpriteFrames(frames: SpriteFrame[]) {
        this._diceSpriteFrames = frames;
    }

    protected onLoad(): void {
        // 初始化 UI 元素狀態
        this._hideAllIndicators();
    }

    /**
     * 初始化玩家面板視圖
     * @param identity - 玩家身份資訊
     * @param status - 玩家狀態資訊
     */
    public initView(identity: IPlayerIdentity, status: IPlayerStatus) {
        // 初始化玩家名稱、金錢、頭像等 UI
        if (this._playerNameLabel) {
            this._playerNameLabel.string = identity.nickname;
        }
        if (this._playerMoneyLabel) {
            this._playerMoneyLabel.string = `金錢: ${status.money}`;
        }
        
        // 加載頭像
        if (identity.avatarSpriteFrame) {
            this.loadAvatar(identity.avatarSpriteFrame);
        }

        // 初始化其他狀態
        this.showTurn(status.isCurrentTurn);
        this.setAutoMode(status.isAuto);
        this.showTip(status.tipText);
        this.setPlayerColor(identity.playerColor ?? 0);
        
        if (status.diceResult > 0) {
            this.showDiceResult(status.diceResult);
        }
    }

    /**
     * 清空或重置 UI 元素狀態
     */
    public clearView() {
        // 清空或重置 UI 元素狀態
        if (this._playerNameLabel) this._playerNameLabel.string = '';
        if (this._playerMoneyLabel) this._playerMoneyLabel.string = '';
        if (this._playerAvatar) this._playerAvatar.spriteFrame = null;
        if (this._diceResultSprite) this._diceResultSprite.spriteFrame = null;
        if (this._tipLabel) this._tipLabel.string = '';
        
        this.stopCountdown();
        this._hideAllIndicators();
    }

    // ==================== 新增方法 ====================
    public setPlayerColor(colorIndex: number): void {
        
        const colorValue = COLOR_LIST.get(colorIndex);
        if (this._bgNode && colorValue) {
            const sprite = this._bgNode.getComponent(Sprite);
            if (sprite) {
                sprite.color = colorValue;
            }
        }
    }

    /**
     * 更新金錢顯示
     * @param money - 金錢數量
     */
    public updateMoney(money: number): void {
        if (this._playerMoneyLabel) {
            this._playerMoneyLabel.string = `金錢: ${money}`;
        }
    }

    /**
     * 顯示/隱藏回合指示器
     * @param isMyTurn - 是否是當前玩家的回合
     */
    public showTurn(isMyTurn: boolean): void {
        if (this._turnIndicator) {
            this._turnIndicator.active = isMyTurn;
        }
        
        // 如果是當前回合，可以添加高亮效果
        if (isMyTurn && this._timerAnimationNode) {
            this._timerAnimationNode.active = true;
        }
    }

    /**
     * 啟動倒計時
     * @param seconds - 倒計時秒數
     */
    public startCountdown(seconds: number): void {
        // 待實現
    }

    /**
     * 停止倒計時
     */
    public stopCountdown(): void {
        // 待實現
    }

    /**
     * 播放骰子滾動動畫
     */
    public playDiceAnimation(): void {
        if (this._diceAnimationNode) {
            this._diceAnimationNode.active = true;
            // 隱藏結果顯示
            if (this._diceResultSprite) {
                this._diceResultSprite.node.active = false;
            }
            
            // 這裡應該播放動畫組件，簡化處理
            // 實際項目中應該使用 Animation 或 Spine 組件
            console.log('播放骰子動畫');
        }
    }

    /**
     * 顯示骰子結果
     * @param result - 骰子點數 (1-6)
     */
    public showDiceResult(result: number): void {
        // 停止動畫
        if (this._diceAnimationNode) {
            this._diceAnimationNode.active = false;
        }
        
        // 顯示結果
        if (this._diceResultSprite && result >= 1 && result <= 6) {
            const frameIndex = result - 1; // 1-6 對應索引 0-5
            if (this._diceSpriteFrames[frameIndex]) {
                this._diceResultSprite.spriteFrame = this._diceSpriteFrames[frameIndex];
                this._diceResultSprite.node.active = true;
            } else {
                console.warn(`骰子圖集未設置或索引 ${frameIndex} 不存在`);
            }
        }
    }

    /**
     * 切換託管模式指示器
     * @param isAuto - 是否開啟託管模式
     */
    public setAutoMode(isAuto: boolean): void {
        if (this._autoModeIcon) {
            this._autoModeIcon.active = isAuto;
        }
    }

    /**
     * 顯示提示/消息
     * @param tipText - 提示文字內容
     */
    public showTip(tipText: string): void {
        if (this._tipLabel) {
            this._tipLabel.string = tipText || '';
            this._tipLabel.node.active = !!tipText;
        }
    }

    /**
     * 設置頭像
     * @param spriteFrame - 頭像的 SpriteFrame
     */
    public loadAvatar(spriteFrame: SpriteFrame): void {
        if (!this._playerAvatar || !spriteFrame) {
            return;
        }
        
        this._playerAvatar.spriteFrame = spriteFrame;
    }

    // ==================== 私有輔助方法 ====================

    /**
     * 更新倒計時顯示
     * @param seconds - 剩餘秒數
     * @private
     */
    private _updateCountdownDisplay(seconds: number): void {
        // 待實現
    }

    /**
     * 隱藏所有指示器
     * @private
     */
    private _hideAllIndicators(): void {
        if (this._turnIndicator) this._turnIndicator.active = false;
        if (this._autoModeIcon) this._autoModeIcon.active = false;
        if (this._diceAnimationNode) this._diceAnimationNode.active = false;
        if (this._diceResultSprite) this._diceResultSprite.node.active = false;
        if (this._timerAnimationNode) this._timerAnimationNode.active = false;
        if (this._tipLabel) this._tipLabel.node.active = false;
        if (this._countdownLabel) this._countdownLabel.node.active = false;
    }

    protected onDestroy(): void {
        // 清理倒計時計時器
        this.stopCountdown();
    }
}


