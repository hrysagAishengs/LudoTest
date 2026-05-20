# debugging.md

# 目標

當系統發生 bug 時：

禁止直接猜測原因。

必須使用：

* systematic debugging
* evidence-driven debugging
* root cause analysis

禁止直接大規模修改 code。

---

# Debugging 原則

## 禁止行為

禁止：

* 未分析直接修改
* 一次修改多個系統
* 用重構掩蓋問題
* 用大量 workaround 掩蓋 root cause
* 在未確認 root cause 前重寫架構

---

# 正確 Debugging 流程

必須依照以下順序：

---

## 1. 明確描述問題

需先確認：

* 問題現象
* 問題發生條件
* 是否可穩定重現
* 發生頻率
* 是否與 timing 有關
* 是否與 lifecycle 有關

---

## 2. 建立 Hypothesis

列出可能 root cause。

例如：

* async race condition
* tween timing drift
* duplicate callback
* stale reference
* lifecycle mismatch
* pool recycle timing

禁止直接認定唯一原因。

---

## 3. 收集 Evidence

需透過：

* log
* state trace
* callback trace
* lifecycle trace
* timing trace

確認：

* 實際執行順序
* callback 順序
* state transition
* promise resolve timing

禁止只靠猜測。

---

## 4. 縮小問題範圍

需確認：

* 問題發生在哪個 phase
* 哪個 system 造成
* 哪個 callback 開始異常
* 哪個 state 開始錯誤

避免一次懷疑整個系統。

---

## 5. 提出修正方案

修正方案需：

* minimal change
* low regression risk
* 可驗證
* 可 rollback

禁止：

* 大規模重構
* 無關 architecture 修改
* 過度 abstraction

---

## 6. 修正後驗證

需重新確認：

* 問題是否消失
* 是否產生新 bug
* 是否產生 regression
* lifecycle 是否正常
* callback 是否正常 cleanup
* promise 是否正常 resolve

---

# Async Debugging 規範

需特別檢查：

* unresolved promise
* duplicate resolve
* duplicate callback
* race condition
* cancellation timing
* tween overlap
* animation overlap

---

# Lifecycle Debugging 規範

需特別檢查：

* destroy timing
* callback cleanup timing
* pool recycle timing
* stale reference
* listener unregister

---

# Spine Debugging 規範

需特別檢查：

* animation complete callback
* callback unregister
* animation interrupt
* overlapping animation state

---

# Tween Debugging 規範

需特別檢查：

* tween overlap
* tween interrupt
* tween cleanup
* tween completion timing

---

# Output 規範

Debugging 時：

1. 先描述問題
2. 列出 hypothesis
3. 列出 evidence
4. 縮小 root cause
5. 提出修正方案
6. 最後才修改 code

禁止直接輸出大量修改 code。
