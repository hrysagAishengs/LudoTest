# architect-review.md

# 目標

當功能或系統完成後：

必須從：

* architecture
* maintainability
* extensibility
* async safety
* lifecycle safety
* performance

角度重新 review。

禁止只確認「能不能跑」。

---

# Review 原則

Review 時：

需以：

* Senior Engineer
* Tech Lead
* Client Architect

角度檢查。

---

# Review 重點

---

# 1. Architecture Review

需確認：

* 系統責任是否明確
* 是否過度 coupling
* 是否存在 hidden dependency
* 是否存在 giant manager
* 是否存在 unclear ownership

需確認：

* state flow 是否清楚
* lifecycle flow 是否清楚
* module boundary 是否合理

---

# 2. Extensibility Review

需確認：

* 是否容易擴充
* 是否容易共用
* 是否容易 plugin 化
* 是否容易 SDK 化

禁止：

* hardcode game-specific behavior
* magic flow
* hidden architecture assumption

---

# 3. Async Safety Review

需確認：

* promise flow 是否安全
* callback lifecycle 是否安全
* 是否存在 race condition
* 是否可能 unresolved promise
* cancellation flow 是否合理

需檢查：

* duplicate callback
* duplicate resolve
* async state mismatch

---

# 4. Lifecycle Review

需確認：

* destroy cleanup 是否完整
* callback unregister 是否完整
* tween cleanup 是否完整
* pool recycle 是否安全

禁止：

* stale reference
* dangling callback
* dangling tween
* dangling listener

---

# 5. Pooling Review

需確認：

* resetData 是否完整
* recycle timing 是否安全
* object reuse 是否可能殘留 state

需檢查：

* pool lifecycle
* stale state
* reused callback

---

# 6. Spine / Animation Review

需確認：

* animation state 是否安全
* callback 是否可能重複
* animation interrupt 是否正確 cleanup
* animation orchestration 是否清楚

---

# 7. Performance Review

需確認：

* 是否增加不必要 draw call
* 是否增加 runtime allocation
* 是否增加 update 負擔
* 是否存在 runtime instantiate/destroy

需檢查：

* memory allocation
* event spam
* scene traversal
* unnecessary update loop

---

# 8. Maintainability Review

需確認：

* code 是否易讀
* flow 是否容易追蹤
* state transition 是否明確
* debug 是否容易

禁止：

* hidden behavior
* magic timing
* side effect heavy logic

---

# 9. Regression Risk Review

需確認：

* 是否影響既有 API
* 是否影響既有 flow
* 是否可能破壞舊系統

需列出：

* 高風險修改點
* 潛在 regression 區域

---

# Output 格式

請輸出：

# Architecture 問題

# Async 問題

# Lifecycle 問題

# Performance 問題

# Maintainability 問題

# Regression Risk

# 建議改善方向

# 必須修正問題（Blocking Issues）

禁止只回答：

「看起來沒問題」
