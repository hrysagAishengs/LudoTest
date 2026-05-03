import { Node } from 'cc';
import { PlayerColor } from '../ColorSelector';
export interface IPawnInfo {
    
    pathDataIndex: number; // 真實路徑位置
    pathDataCoord: [number, number] | null; // 真實路徑坐標
    localViewIndex: number; // 本地視角位置
    localViewCoord: [number, number] | null; // 本地視角坐標
    slotId: number; // 棋子對應的 Slot ID(-1-16)，對應玩家的棋子編號和位置
    baseSlotIndex: number | null; // 棋子對應的基地 SlotIndex(0~3)，如果不在基地則為 null
    isInBase: boolean; // 是否在基地
    isInHome: boolean; // 是否在終點
    isMoving: boolean; // 是否正在移動
}

export interface IPawn{
    slotId: number;
    playerColor: PlayerColor;
    slotIndex: number;
    getPawnInfo(): IPawnInfo;
    getPawnNode(): Node;
    init(info: IPawnInfo, playerColor: PlayerColor, slotIndex: number): void;
    setSlotId(slotId: number): void;
}