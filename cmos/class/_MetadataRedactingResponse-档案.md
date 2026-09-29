# _MetadataRedactingResponse档案

类定义在backend/app/gateway/routers/threads.py。

## 一、这个类是干什么的

这个类是元数据脱敏的基类。

对话的元数据里可能有敏感信息。例如密钥。响应里的元数据需要脱敏。

这个类定义了一个元数据校验器。校验器在元数据验证前调用redact_metadata_secrets函数。敏感值被遮蔽。这个类是一个Pydantic模型。

这个类是私有基类。类名以下划线开头。这个类不直接用于响应。

## 二、类的成员

这个类没有自己的数据字段。

这个类有一个校验器。

### 1、_redact_legacy_metadata_secret校验器

这个校验器作用于metadata字段。

校验器在字段验证前运行。check_fields=False表示字段不存在也注册校验器。

校验器调用redact_metadata_secrets函数。函数遮蔽元数据里的敏感值。

### 2、设计意图

子类继承这个基类。子类的metadata字段自动获得脱敏能力。

脱敏规则统一在一处。子类不用重复写。

## 三、它和谁协作

三个类继承这个基类。

ThreadResponse继承它。ThreadStateResponse继承它。HistoryEntry继承它。

脱敏函数来自deerflow.runtime.secret_context模块。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是5分。

理由如下。

元数据脱敏是防止敏感信息泄漏的关键。对话元数据可能包含操作者写的密钥。

三个响应模型共享这个基类。脱敏规则统一维护。

这个类是安全边界的一部分。所以评5分。
