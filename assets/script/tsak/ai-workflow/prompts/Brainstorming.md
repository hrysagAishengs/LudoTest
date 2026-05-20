# brainstorming.md

# 目標

當使用者提出需求時：

禁止直接開始實作 code。

必須先進行：

* 需求分析
* 架構思考
* 風險評估
* lifecycle 分析
* async 分析
* performance 分析
* extensibility 分析

---

# Brainstorming 流程

收到需求後，請依照以下順序進行：

---

## 1. 需求拆解

分析：

* 真正需求
* 核心功能
* 非功能需求
* 使用情境
* 邊界條件

---

## 2. 架構方向分析

提出可能方案：

* Architecture A
* Architecture B
* Architecture C

每個方案需包含：

* 優點
* 缺點
* 適用情境
* 擴充性
* 維護成本

---

## 3. Lifecycle 分析

需分析：

* node lifecycle
* component lifecycle
* resource cleanup
* callback cleanup
* pool recycle safety

---

## 4. Async 分析

需分析：

* promise flow
* race condition
* tween timing
* animation callback timing
* cancellation handling

---

## 5. 效能分析

需分析：

* draw call impact
* memory allocation
* pooling necessity
* update loop impact
* runtime instantiate/destroy risk

---

## 6. 擴充性分析

需分析未來是否可能：

* 多遊戲共用
* SDK 化
* plugin 化
* network sync
* replay system
* hot update support

---

## 7. 風險分析

需列出：

* 最可能出問題的地方
* 最容易產生 bug 的流程
* 最可能產生 memory leak 的區域
* 最可能產生 async 問題的流程

---

# Output Format

請輸出：

# 需求分析

# 架構方案

# Lifecycle 分析

# Async 分析

# 效能分析

# 擴充性分析

# 風險分析

# 建議方案

禁止直接開始撰寫 implementation code。
