import { GameModeFactory, IGameComponents } from '../defs/GameModeFactoryDef';
import { BasicBoardFactory } from './board/BasicBoardFactory';
import { BasicPathFactory } from './path/BasicPathFactory';

/**
 * 經典遊戲模式工廠
 * 
 * 組合以下子工廠：
 * - BasicBoardFactory：創建標準 15x15 棋盤
 * - BasicPathFactory：創建標準路徑
 * - PlayerSeatingFactory：創建十字形座位佈局
 */
export class ClassicGameModeFactory extends GameModeFactory {
    
    // 組合的子工廠
    //private _boardFactory: BoardFactory = new BasicBoardFactory();
    private _boardFactory: BasicBoardFactory = new BasicBoardFactory();
    private _pathFactory: BasicPathFactory = new BasicPathFactory();
    
    // 已創建的組件
    //private _components: IGameComponents | null = null;
    
    /**
     * 配置所有子工廠
     * 將配置分發到各個子工廠
     */
    protected configureSubFactories(): void {
        if (!this._config) return;
        
        // 配置 Board 工廠
        this._boardFactory.setMapConfig(this._config.boardConfig);
        // 配置 Path 工廠
        this._pathFactory.setPathConfig(this._config.pathConfig);
    
    }
    
    /**
     * 創建遊戲模式的所有組件
     */
    public async createGameComponents(): Promise<IGameComponents> {
        if (!this._config) {
            throw new Error('配置未設置，請先調用 setConfig()');
        }
        
        console.log('開始創建經典模式組件...');
        
        // 1. 創建棋盤（基礎）
        const boardGenerator = await this._boardFactory.createBoardGenerator();
        console.log('✓ 棋盤生成器創建完成');
        
        // 2. 創建路徑（依賴棋盤）
        const pathGenerator = this._pathFactory.createPathGenerator();
        const viewTransformer = this._pathFactory.createViewTransformer();
        console.log('✓ 路徑生成器創建完成');
        
        // 3. 創建玩家座位佈局
        //const playerSeating = PlayerSeatingFactory.createSeating(this._config.seatingConfig.layoutType);
        //playerSeating.initializeSeats();
        console.log('✓ 玩家座位佈局創建完成');
        
        // 4. 未來可添加更多組件
        // const ruleEngine = RuleEngineFactory.createRuleEngine(this._config.gameMode);
        // const uiLayout = UILayoutFactory.createLayout(this._config.gameMode);
        
        // 緩存組件
        this._components = {
            boardGenerator,
            pathGenerator,
            viewTransformer,
            //playerSeating
        };
        
        console.log('經典模式所有組件創建完成');
        
        return this._components;
    }
    
    /**
     * 獲取特定組件
     */
    public getComponent<T extends keyof IGameComponents>(componentName: T): IGameComponents[T] | null {
        return this._components?.[componentName] ?? null;
    }
    
    /**
     * 銷毀遊戲組件
     */
    public destroyGameComponents(): void {
        this._boardFactory.destroyBoardGenerator();
        this._pathFactory.destroyPathGenerator();
        this._components = null;
        console.log('經典模式組件已銷毀');
    }
}