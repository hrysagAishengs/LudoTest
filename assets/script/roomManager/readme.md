Server              Client (LudoGameManager)
  |                        |
  |--- 房间信息(4人) --->  |
  |                        | setupRoom(4)
  |                        | → 随机分配: 0→Yellow, 1→Green, 2→Blue, 3→Red
  |                        |
  |--- "你是座位 2" -----> |
  |                        | setupLocalPlayerView(2)
  |                        | → 查询颜色: Blue
  |                        | → 旋转棋盘: 180°
  |                        | → 完成 ✓
  |                        |
  |--- 玩家0加入 --------> |
  |                        | addPlayer(seat=0)
  |                        | → 分配颜色: Yellow
  |                        |
  |--- 玩家1加入 --------> |
  |                        | addPlayer(seat=1)
  |                        | → 分配颜色: Green