# verification.md

# 目標

當功能實作完成後：

禁止直接宣稱完成。

必須進行：

* compile verification
* runtime verification
* lifecycle verification
* async verification
* performance verification

確認系統真正可安全運作。

---

# Verification 原則

禁止：

* 未驗證直接完成
* 未測試直接進下一階段
* 忽略 warning
* 忽略 lifecycle 問題
* 忽略 async 問題

---

# 1. Compile Verification

必須確認：

* TypeScript compile pass
* 無 type error
* 無 import error
* 無 unresolved reference

需確認：

* generic type 正確
* interface 正確
* public API 正確

---

# 2. Runtime Verification

必須確認：

* 功能正常運作
* flow 正常
* state transition 正常
* animation flow 正常

需確認：

* 無 runtime exception
* 無 undefined state
* 無 invalid reference

---

# 3. Async Verification

必須確認：

* promise 正常 resolve
* 無 unresolved promise
* 無 duplicate resolve
* callback timing 正常
* cancellation flow 正常

需檢查：

* race condition
* async ordering
* duplicate callback
* callback cleanup

---

# 4. Lifecycle Verification

必須確認：

* destroy cleanup 正常
* callback unregister 正常
* tween cleanup 正常
* listener cleanup 正常

需確認：

* 無 dangling callback
* 無 dangling tween
* 無 dangling listener
* 無 stale reference

---

# 5. Pool Verification

必須確認：

* resetData 正常
* recycle timing 正常
* object reuse 正常

需檢查：

* stale state
* reused callback
* reused tween
* reused async state

---

# 6. Spine / Animation Verification

必須確認：

* animation flow 正常
* callback timing 正常
* animation interrupt 正常 cleanup

需確認：

* 無 callback overlap
* 無 animation state corruption
* 無 animation leak

---

# 7. Tween Verification

必須確認：

* tween completion 正常
* tween interrupt 正常
* tween cleanup 正常

需檢查：

* tween overlap
* tween leak
* incorrect timing

---

# 8. Performance Verification

必須確認：

* 無明顯 draw call 增加
* 無大量 runtime allocation
* 無 update loop overload

需檢查：

* instantiate/destroy frequency
* pooling effectiveness
* scene traversal
* unnecessary update logic

---

# 9. Regression Verification

必須確認：

* 既有功能未破壞
* public API 未破壞
* 既有 flow 正常

需檢查：

* old feature compatibility
* old async flow
* old lifecycle flow

---

# Output 格式

請輸出：

# Compile Verification

# Runtime Verification

# Async Verification

# Lifecycle Verification

# Performance Verification

# Regression Verification

# 發現問題

# 尚未驗證項目

禁止只回答：

「已完成」
