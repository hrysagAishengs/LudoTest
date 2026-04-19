/**
 * this is a game definition 
 */

//--遊戲模式
export enum LudoGameMode {
    DEFAULT = -1,
    CLASSIC=0,
    QUICK = 1
}


export interface IGameConfig {
   gameMode: LudoGameMode;
}