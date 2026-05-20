# AGENTS.md

# 專案概述

本專案使用：

* Cocos Creator 3.8.x
* TypeScript
* Component-based 架構
* 遵循3.8.X shader code 規範
* 可重用動畫系統

本專案重視：

* 可擴充性
* Lifecycle 安全性
* Async 安全性
* 效能穩定
* 系統可重用性
* 降低回歸風險

---

# 架構規範

## 基本原則

* 優先使用 組合Composition或是Dependency Injection，而非過度繼承
* 使用DI時，禁止實例直接注入!須採介面注入!
* 遵循 OOP SOLID 概念
* 避免不必要的抽象化
* 系統需保持模組化與可擴充
* 除非明確要求，不主動改動既有架構
* 減少隱性依賴
* 避免系統間高度耦合

## Public API 規範

* 不可破壞既有 Public API
* 不可隨意重新命名公開方法
* 優先保持向下相容

## 系統設計

* 系統需考慮未來擴充性
* 避免將遊戲特例硬編碼進通用系統
* 狀態切換必須明確且可追蹤

---
# Typescript 規範
## Set 與 map 規範
* 宣告一個set變數時不能是包含map
* 宣告一個map變數時存取物不能是set
* 禁止使用匿名函示,請宣告成變數指向Lambda function

# Cocos Creator 規範

## engine Lifecycle 限制

* 不要在 onLoad 做初始化或是賦予值的行為
* 初始賦值使用public init方法呼叫,可由外部流程呼叫
* 要做 _inited flag控制避免重複操作init
* onLoad 內呼叫public init即可
* 如遇到需要某component需要完成建立後才進行後續操作,可考慮Node.EventType.CHILD_ADDED監聽,
  或是設計成promise async/await驅動
* onDestroy只做相關變數屬性的null動作,如需相關清理請額外設計外部可呼叫的public destroy 方法來主動手動移除相關物件

## Node 存取

* 避免在 runtime loop 中使用 node.find
* 常用節點需快取
* 避免遊戲進行中大量深層 scene traversal

## ShaderCode 規範
* 不得憑記憶直接生出 Cocos builtin include 路徑
* 不得把其他引擎、其他 Cocos 版本、或不同渲染用途的shader 結構直接套用
* 新增 shader 前，應先確認專案使用的 Cocos Creator 版本
* 若找不到專案內可參考 shader，應先建立最小可編譯版本，確認通過後再加入自訂 uniform 與 fragment 邏輯
* 每次新增或更換 include 後，需告知使用者這是高風險區，應先測編譯再繼續功能開發
* UBO 欄位順序要注意 padding


## code Lifecycle 安全

* destroy /removeChild/removefromparent 前必須清除 listener
* destroy /removeChild/removefromparent 前必須清除 tween
* destroy /removeChild/removefromparent 前必須清除 promise resolve
* destroy /removeChild/removefromparent 前必須清除 schedule callback
* destroy /removeChild/removefromparent 前必須清除 reference
* Spine callback 使用後必須解除註冊
* 在active=true/false 需開啟或是關閉 事件監聽或是按鈕的interactable

## Object Pool

* recycle 前必須完整 resetData
* pool object 不可保留舊 reference
* 高頻流程避免 instantiate/destroy
* 不使用引擎原生的 NodePool

## Component 設計

* Component 職責需單一
* 避免 God Component
* 優先使用 controller/manager orchestration
* 如掛載Component的node 最終不會被呈現在scene上需考慮放棄使用component(除了聲音或其他相關硬性規定,非得用component)

---

# Async 規範

## Promise 安全

* 禁止 unresolved promise
* Promise 流程需盡可能支援 cancellation
* 避免隱性 async state mutation

## Callback 安全

* callback 使用後必須解除註冊
* 防止重複 callback 註冊
* 防止 dangling async listener
* 禁止跨類別使用 callback 設計

## Timing 安全

需注意以下流程的 race condition：

* tween
* Spine animation
* async callback
* scheduled task

---

# timer 規範

* 禁止使用 js原生的計時機制與相關方法,除非有必要,也需要進行討論
* 使用schedule時需一併撰寫unschedule功能
* 如需透過promise,做計時器相關的操作,一律改用tween驅動.且須提供cancel 方法

---

# tween 規範

* 如需外部呼叫停止的可控tween須將tween指給一個全域變數
* 需要獨立成一個方法來提供呼叫!禁止寫在其他邏輯的function內
* 有complete的需求(call) 就將twee的方法做成promise async/await
* 相關Promise規範請閱讀## Promise 安全

---

# Spine 規範

* Spine callback 必須解除註冊
* 避免 animation state 被互相覆蓋
* 防止 animation complete callback 重複觸發
* animation 被中斷時需正確 cleanup

---

# Audio 規範

* Audio 播放需支援 cleanup
* 防止 unmanaged audio source
* 避免 AudioSource reference leak
* group/list playback 需完整 cleanup callback

---

# 效能規範

## Draw Call

* 避免不必要 draw call
* 減少動態 UI rebuild
* 避免高成本 runtime mask

## Memory

* 避免 gameplay loop 中頻繁 allocation
* 高頻系統需重用 array/object
* 臨時物件優先使用 pooling

## Update Loop

* 避免在 update() 中執行重邏輯
* 優先 event-driven flow

---

# Minimal Change 原則

除非明確要求：

* 不可重寫整體架構
* 不可重構無關系統
* 不可增加不必要 design pattern
* 優先最小安全修改
* 不可重寫以定義好的底層演算法,除非有要求更動
---

# Debugging 流程

Debug 時必須：

1. 不可猜測
2. 建立 hypothesis
3. 收集 evidence
4. 縮小 root cause
5. 驗證後再修改
6. 修改後重新驗證

---

# 驗證清單

完成前必須確認：

* TypeScript compile 通過
* 無 unresolved promise
* 無 dangling callback
* 無 tween leak
* 無 Spine callback leak
* 無 event listener leak
* 無 pool reference leak
* 無明顯 lifecycle 問題
* 無 public API regression

---

# 實作流程規範

實作功能時：

1. 先分析需求
2. 必要時提出 architecture 建議
3. 建立 implementation plan
4. 分階段實作
5. 每階段完成後驗證

避免一次性大規模重寫。

---

# 禁止行為

* 隱性 singleton dependency
* unmanaged async state
* runtime scene traversal spam
* 未解除註冊 callback
* 無 cleanup 的 fire-and-forget async
* 大規模無關重構
* 過度工程化簡單問題
* 未經允許刪除舊代碼
