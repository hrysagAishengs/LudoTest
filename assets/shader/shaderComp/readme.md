沒有同步 progress。

所以如果 prefab 掛的 material / effect 預設是：

progress = 1
shader 就會直接畫滿。又因為目前：

colorSwitchProgress = 0.5
colorProgressMode = 0
borderColor2 = red
當 progress = 1 時：

colorProgress = progress; // 1
colorProgress >= colorSwitchProgress // true
所以顏色會變成：

borderColor2 // 紅色
也就是你看到的「一掛上去就整個填滿紅色」。

=============================================
除了 progress = 1，還有幾種情況會讓它看起來像「一開始就畫滿」。

1. progress 沒有被初始化，吃到 effect 預設值
RectBoardFill2.effect 裡目前預設是：

progress: 1.0
===============================================
即使 .mtl 設成 0，如果 prefab 不是用那個 material，或 runtime getMaterialInstance() 生成的 instance 沒吃到你預期的值，就可能回到 effect 預設滿版。

2. colorProgressMode 搭配 progress 讓顏色直接切到紅
這不一定會讓範圍畫滿，但會讓已畫的部分直接變紅：

float colorProgress = colorProgressMode > 0.5 ? 1.0 - progress : progress;
vec4 switchColor = colorProgress >= colorSwitchProgress ? borderColor2 : borderColor;
如果：

colorProgressMode = 0
progress = 1
就是紅。

如果：

colorProgressMode = 1
progress = 0
也會紅。

3. thickness 太大
如果 thickness 設太大，例如接近：

0.5
你的 inBorder 判斷會讓整張 sprite 幾乎都算在 border 裡：

uv.x < thickness ||
uv.x > 1.0 - thickness ||
uv.y < thickness ||
uv.y > 1.0 - thickness
當 thickness = 0.5 時，整張圖幾乎都是 border。
所以即使不是路徑畫滿，也會看起來像整片被填色。

4. useThicknessPx = 1 且 thicknessPx 太大
如果使用像素厚度：

vec2 thicknessPixel = thicknessPx / spriteInfo.xy;
假設 sprite 是 100x100，thicknessPx = 50，就等於：

thickness = 0.5
一樣會整片變成 border。

5. spriteInfo.xy 沒同步正確
如果 spriteInfo 寬高太小，而 thicknessPx 又開著，就會放大厚度比例。

例如實際 sprite 是 120x120，但 spriteInfo.xy 錯成：

[10, 10]
那：

thicknessPx = 10
會變成：

thicknessPixel = 1.0
整張都會是 border。

6. uvRect 沒同步正確
uvRect 錯誤時，uv 可能被 clamp 成很偏的範圍，導致大量區域落在 border 判斷內：

vec2 uv = (v_uv0 - uvRect.xy) / uvRect.zw;
uv = clamp(uv, 0.0, 1.0);
尤其 prefab instantiate 後，如果 spriteFrame 尚未存在或 syncUvRect() 沒成功，shader 可能吃預設：

uvRect = [0, 0, 1, 1]
如果圖片來自 atlas，這就可能不準。

7. 掛錯 material / material instance
如果 prefab 上掛的是另一個材質，或公司那邊的 .mtl 舊版本裡：

progress = 1
thickness = 0.5
useColorBlend = 1
那 component 面板看起來正常，但實際 sprite material 不一定是你以為的那個。

最可能的三個
依你描述「一掛上去、沒操作、整個填滿紅色」，我會優先懷疑：

1. progress 初始值是 1
2. thickness 或 thicknessPx 太大
3. component 沒有同步 progress，material 吃 effect 預設值
所以最穩的做法是讓 RectBoardFillLine 初始化時強制同步這些：

progress
thickness
thicknessPx
useThicknessPx
spriteInfo
uvRect
colorProgressMode
這樣 prefab new 出來就不會吃到 material/effect 的殘留狀態。