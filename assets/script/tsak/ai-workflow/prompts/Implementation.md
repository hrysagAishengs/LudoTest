# implementation.md

# 目標

當開始實作功能時：

必須遵守：

* Minimal Change
* Lifecycle Safety
* Async Safety
* Architecture Stability

禁止直接進行大規模重構。

---

# 實作原則

## Minimal Change

除非明確要求：

* 不可重寫既有架構
* 不可修改無關系統
* 不可順手重構其他模組
* 不可改變 public API
* 不可變更既有行為邏輯

優先：

* 最小安全修改
* 局部修改
* 可回滾修改

---

# 實作流程

開始實作前：

1. 先閱讀 spec
2. 先閱讀 Implementation plan
3. 確認本次 Phase 範圍
4. 確認不可修改範圍

禁止直接開始大量 coding。

---

# 修改範圍控制

每次修改：

* 優先只修改必要 class
* 避免擴散修改範圍
* 避免跨系統 coupling

若需修改額外系統：

必須先說明原因。

---

# Async 安全規範

必須確認：

* Promise 不會 unresolved
* callback 不會重複註冊
* callback 必須 cleanup
* tween 必須 cleanup
* schedule 必須 cleanup

需注意：

* race condition
* duplicate callback
* async state mismatch
* cancellation timing

---

# Lifecycle 安全規範

需確認：

* destroy 時完整 cleanup
* pool recycle 時完整 resetData
* Spine callback 已 unregister
* listener 已解除註冊

禁止：

* dangling callback
* dangling tween
* dangling listener
* stale pool reference

---

# Cocos Creator 規範

禁止：

* runtime loop 中大量 node.find
* gameplay 中大量 instantiate/destroy
* update() 中重邏輯

優先：

* pooling
* cache reference
* event-driven flow

---

# 架構穩定規範

禁止：

* 過度 abstraction
* 無意義 design pattern
* giant manager
* hidden singleton dependency

優先：

* 明確 state flow
* 明確 lifecycle
* 明確 ownership

---

# Coding 規範

優先：

* readable
* maintainable
* explicit behavior

避免：

* magic behavior
* hidden side effect
* unnecessary generic abstraction

---

# 每個 Phase 完成後

必須確認：

* compile pass
* runtime pass
* 無 lifecycle regression
* 無 async regression
* 無 callback leak
* 無 tween leak
* 無 event leak

禁止未驗證直接進下一階段。

---

# Output 規範

實作時：

1. 先說明本次修改目標
2. 說明修改範圍
3. 說明風險
4. 再開始 implementation

避免直接輸出大量 code。
