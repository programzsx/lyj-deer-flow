# MemoryPrescreenProvider-档案

## 一、这个类是干什么的

MemoryPrescreenProvider是agents/memory/prescreen/contract.py里的Protocol。

它是可插拔memory pre-screen的契约。

runtime_checkable装饰。

这个类位于backend/packages/harness/deerflow/agents/memory/prescreen/contract.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、name属性

provider的名字。

### 2、decide方法

它对这个batch返回verdict。

None是没有意见。问题级失败或没东西可判。调用者当fallback。extract。

请求级失败传播TypeSafeError。不是None。

这样round的audit记录可以说request_failed。不是"没有verdict"。

其他异常是provider bug。updater仍然照常extract。

decide是同步的。

updater跑在debounce Timer或executor线程上。必须不碰event loop。

### 3、release_policy_parameters方法

它返回影响行为的参数。给assembly identity用。

永不是credential。

### 4、duck-typed解析

provider通过class path解析。resolve_memory_prescreen。

mode是off、shadow、enforce。

## 三、它和谁协作

- DeerMem updater通过memory层的judge消费它。
- TypeSafeMemoryPrescreen是它的TypeSafe实现。
- resolve_memory_prescreen按class path解析它。

## 四、重要性评级

评级是5分。

理由如下。

这个Protocol是pre-screen的契约核心。

decide的错误语义明确。None是没有意见。TypeSafeError是请求失败。其他是bug。

同步约束。不碰event loop。

release_policy_parameters永不是credential。

这些是prescreen正确性的关键。

扣掉5分。

扣分原因是它是接口契约。机械在实现里。
