//import { PathFactory, IPathConfig, IPathGenerator, IViewTransformer } from '../def/PathFactoryDef';
//import { BasicPathGenerator } from '../generator/BasicPathGenerator';
//import { BasicViewTransformer } from '../generator/BasicViewTransformer';

import { IPathConfig, IPathGenerator, IViewTransformer, PathFactory } from "../../defs/path/PathFactoryDef";
import { BasicPathGenerator } from "../../generators/path/BasicPathGenerator";
import { BasicViewTransformer } from "../../generators/path/BasicViewTransformer";


/**
 * 基礎路徑工廠
 * 創建標準 Ludo 遊戲的路徑生成器和視角轉換器
 * 
 * 使用流程：
 * 1. 調用 setPathConfig() 設置配置
 * 2. 調用 createPathGenerator() 創建並初始化路徑生成器
 * 3. 調用 createViewTransformer() 創建視角轉換器（會自動關聯路徑數據）
 * 4. 使用完畢後調用 destroyPathGenerator() 清理資源
 * 
 * 職責：
 * 1. 管理路徑生成器和視角轉換器的生命週期
 * 2. 確保配置正確傳遞給生成器
 * 3. 確保視角轉換器正確關聯路徑數據
 * 4. 提供清理資源的方法
 */
export class BasicPathFactory extends PathFactory {
    
    private _currentConfig: IPathConfig | null = null;
    private _currentGenerator: BasicPathGenerator | null = null;
    private _currentTransformer: BasicViewTransformer | null = null;

    /**
     * 設置路徑配置
     * @param config 路徑配置對象
     */
    public setPathConfig(config: IPathConfig): void {
        this._currentConfig = config;
    }

    /**
     * 創建路徑生成器
     * @returns 已初始化的路徑生成器實例
     */
    public createPathGenerator(): IPathGenerator {
        if (!this._currentGenerator) {
            this._currentGenerator = new BasicPathGenerator();
        }
        
        // 設置配置（如果有的話）
        if (this._currentConfig) {
            this._currentGenerator.setConfig(this._currentConfig);
            console.log('路徑生成器配置已設置');
        } else {
            console.warn('路徑配置未設置，將使用預設值');
        }
        
        // 執行路徑生成
        this._currentGenerator.createPaths();
        
        return this._currentGenerator;
    }

    /**
     * 創建視角轉換器
     * @returns 已關聯路徑數據的視角轉換器實例
     */
    public createViewTransformer(): IViewTransformer {
        if (!this._currentTransformer) {
            this._currentTransformer = new BasicViewTransformer();
        }
        
        // 將路徑數據設置到轉換器中
        if (this._currentGenerator) {
            this._currentTransformer.setPathContent(this._currentGenerator.getPathMap());
            console.log('視角轉換器已關聯路徑數據');
        } else {
            console.warn('路徑生成器尚未創建，視角轉換器可能無法正常工作');
        }
        
        return this._currentTransformer;
    }

    /**
     * 銷毀路徑生成器
     * 清理資源，釋放記憶體
     */
    public destroyPathGenerator(): void {
        this._currentGenerator = null;
        this._currentTransformer = null;
        console.log('路徑生成器已銷毀');
    }
}