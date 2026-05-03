import { SpriteFrame } from "cc";
import { PlayerPanel } from "../PlayerPanel";
import { PlayerColor } from "../ColorSelector";
import { IPawn} from "./PawnDef";

/**
 * 玩家靜態身分
 * 包含玩家的基礎資訊，不會頻繁變動
 */
export interface IPlayerIdentity {
    /** 玩家唯一識別碼 */
    uid: string;
    /** 玩家暱稱 */
    nickname: string;
    /** 玩家頭像圖片 */
    avatarSpriteFrame: SpriteFrame | null;
    /** 原始座位編號 (Server 分配) */
    seatIndex?: number;

    localViewIndex?: number; // 本地視角座位編號 (0~3)，根據玩家數量和座位分配計算得出
    /** 棋盤顏色（客戶端隨機分配：0=Blue, 1=Red, 2=Green, 3=Yellow） */
    playerColor?: PlayerColor;
    isPlayerOwner?: boolean; // 是否為玩家本人
}

/**
 * 玩家動態狀態
 * 用於 UI 刷新，會頻繁變動的數據
 */
export interface IPlayerStatus {
    /** 玩家金錢 */
    money: number;
    /** 是否是當前回合 */
    isCurrentTurn: boolean;
    /** 當前剩餘秒數 */
    countdown: number;
    /** 骰子結果 (0-6) */
    diceResult: number;
    /** 是否正在擲骰子 */
    isDiceRolling: boolean;
    /** 是否託管 */
    isAuto: boolean;
    /** 提示字串 (例如："輪到你了") */
    tipText: string;
}



/**
 * 整合玩家對象
 * 包含玩家的完整資訊和對應的 UI 面板引用
 */
export interface IPlayerEntity {
    /** 基礎身分資訊 */
    identity: IPlayerIdentity;
    
    /** 當前動態數據 */
    status: IPlayerStatus;
    
    /** UI 引用 (關鍵：直接操作面板) */
    panel: PlayerPanel; 
    
    // 4. 棋子實體 (之後邏輯會用到)
    pawns:Map<number,IPawn>;
    //pawns: Pawn[]; 
}


