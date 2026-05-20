# spec-template.md

# 功能名稱

請填寫功能或系統名稱。

---

# 功能目標

描述此功能真正想解決的問題。

需包含：

* 核心目標
* 使用情境
* 最終預期效果

---

# 功能需求

列出必須支援的功能。

範例：

* 支援 replay
* 支援 seek
* 支援 async flow
* 支援 object pooling

---

# 非功能需求

列出系統品質需求。

例如：

* 不可產生額外 draw call
* 不可增加大量 memory allocation
* 必須支援 cancellation
* 必須可擴充

---

# 不在本次範圍（Non Goals）

非常重要。

列出：

「這次不處理什麼」

例如：

* 不處理 network sync
* 不處理 multiplayer
* 不處理 hot update

避免 AI 無限擴張需求。

---

# 架構設計

描述：

* 系統結構
* module 關係
* controller flow
* manager flow

---

# 資料流（Data Flow）

描述：

* 資料如何流動
* 誰產生
* 誰消費
* 誰持有 state

---

# 狀態流（State Flow）

描述：

* state transition
* lifecycle transition
* animation transition
* async transition

---

# Async Flow

需描述：

* Promise flow
* callback flow
* cancellation flow
* race condition handling

---

# Lifecycle 規範

需描述：

* init
* enter
* exit
* cleanup
* destroy
* pool recycle

---

# 效能需求

需分析：

* draw call impact
* memory allocation
* pooling strategy
* update cost
* instantiate/destroy risk

---

# 風險分析

列出：

* 最可能產生 bug 的地方
* 最可能 memory leak 的地方
* 最可能 async 出錯的流程
* 最可能 lifecycle 出錯的流程

---

# 未來擴充性

需思考：

* 是否可共用
* 是否可 SDK 化
* 是否可 plugin 化
* 是否支援多遊戲

---

# 驗證方式

需列出：

* compile 驗證
* runtime 驗證
* lifecycle 驗證
* async 驗證
* memory 驗證

---

# 建議 Implementation Plan

簡單列出：

* Phase1
* Phase2
* Phase3

不要直接開始寫 code。
