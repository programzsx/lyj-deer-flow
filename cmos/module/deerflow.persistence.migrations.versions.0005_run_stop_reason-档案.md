# 0005_run_stop_reason档案

## 一、这个迁移是干什么的

给`runs`表加`stop_reason`列。记录一个运行结束的原因。

## 二、做了什么schema变更

- 给`runs`加`stop_reason`列。String(50)。可为NULL。

## 三、涉及哪些表

只涉及`runs`表。

## 四、重要细节

用`safe_add_column`做幂等。升级用safe_add_column。降级用直接drop_column。

## 五、重要性评级

评级是5分。

理由。stop_reason让运行历史的终态可解释。运行是正常完成、被用户停止、还是被策略停止。这个字段承载这个信息。但变更本身很小。一列。
