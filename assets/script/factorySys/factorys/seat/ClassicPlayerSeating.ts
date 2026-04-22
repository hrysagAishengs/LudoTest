
import { IPlayerSeating } from "../../defs/seat/SeatFactoryDef";

/**
 * 经典模式座位布局
 * 固定的十字形座位排列
 */
class ClassicPlayerSeating implements IPlayerSeating {
    private _seatLayout: Map<number, number> = new Map();
    private _uiPositions: string[] = ['bottom-left', 'top-left', 'top-right', 'bottom-right'];
    
    public initializeSeats(): void {
        // 经典模式固定布局：Blue左下, Red左上, Green右上, Yellow右下
        this._seatLayout.set(0, 0); // Blue → 左下
        this._seatLayout.set(1, 1); // Red → 左上
        this._seatLayout.set(2, 2); // Green → 右上
        this._seatLayout.set(3, 3); // Yellow → 右下
    }
    
    public getSeatIndex(playerType: number): number {
        return this._seatLayout.get(playerType) ?? 0;
    }
    
    public getSeatUIPosition(seatIndex: number): string {
        return this._uiPositions[seatIndex] ?? 'bottom-left';
    }
    
    public rotateSeatView(newCurrentPlayer: number): void {
        // 经典模式座位不旋转，只是改变视角
        console.log(`视角切换到玩家 ${newCurrentPlayer}`);
    }

    public getAllSeats(): Map<number, number>{
        return this._seatLayout;
    }
}

/**
 * 玩家座位工厂
 * 根据配置创建不同的座位布局
 */
export class PlayerSeatingFactory {
    public static createSeating(layoutType: 'cross' | 'circle' | 'square' = 'cross'): IPlayerSeating {
        switch (layoutType) {
            case 'cross':
                return new ClassicPlayerSeating();
            // case 'circle':
            //     return new CirclePlayerSeating();
            default:
                return new ClassicPlayerSeating();
        }
    }
}