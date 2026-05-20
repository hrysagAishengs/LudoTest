# implementation-plan-template.md

# 功能名稱

請填寫功能名稱。

---

# 實作目標

描述：

* 本次實作目標
* 本次完成範圍
* 本次不處理範圍

---

# 實作原則

必須遵守：

* Minimal Change
* 不可破壞 Public API
* 不可重寫無關架構
* 優先保持既有系統穩定
* 每個 Phase 完成後需驗證

---

# Phase 拆分規範

每個 Phase 必須：

* 可獨立驗證
* 可獨立 rollback
* 不可同時修改過多系統
* 優先降低風險

---

# Phase 1

## 目標

描述此階段目標。

---

## 修改範圍

列出：

* 哪些 class
* 哪些 module
* 哪些 flow

---

## Implementation Tasks

* Task 1
* Task 2
* Task 3

---

## Lifecycle 檢查

需確認：

* callback cleanup
* tween cleanup
* listener cleanup
* pool reset safety

---

## Async 檢查

需確認：

* promise flow
* cancellation
* race condition
* duplicate callback risk

---

## 驗證方式

需確認：

* compile pass
* runtime pass
* no memory leak
* no lifecycle issue
* no regression

---

## 風險

列出：

* 本階段可能問題
* 最容易出 bug 的地方

---

# Phase 2

（同樣格式）

---

# Phase 3

（同樣格式）

---

# 最終驗證

全部完成後需確認：

* TypeScript compile pass
* 無 unresolved promise
* 無 callback leak
* 無 tween leak
* 無 event leak
* 無 pool leak
* 無 lifecycle regression
* 無 public API regression

---

# 禁止行為

* 一次性大量重構
* 未驗證直接進下一階段
* 修改無關系統
* 過度 abstraction
* 未 cleanup async flow
* 未 cleanup callback
