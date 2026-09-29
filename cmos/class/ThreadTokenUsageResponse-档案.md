# ThreadTokenUsageResponse档案

类定义在backend/app/gateway/routers/thread_runs.py。

## 一、这个类是干什么的

这个类是对话token用量的响应体。

前端想看一个对话总共用了多少token。总量按模型拆分。按调用方拆分。还有上下文占用。

后端用这个类返回完整用量。这个类是一个Pydantic模型。

## 二、类的成员

这个类有8个字段。

### 1、thread_id

thread_id是对话编号。这个字段是字符串类型。这个字段必填。

### 2、total_tokens

total_tokens是token消耗总数。这个字段是整数类型。默认是0。

### 3、total_input_tokens

total_input_tokens是输入token总数。这个字段是整数类型。默认是0。

### 4、total_output_tokens

total_output_tokens是输出token总数。这个字段是整数类型。默认是0。

### 5、total_runs

total_runs是运行总数。这个字段是整数类型。默认是0。

### 6、by_model

by_model是按模型的用量拆分。

这个字段是字典类型。键是模型名称。值类型是ThreadTokenUsageModelBreakdown。默认是空字典。

### 7、by_caller

by_caller是按调用方的用量拆分。

这个字段类型是ThreadTokenUsageCallerBreakdown。默认是空对象。

### 8、context_usage

context_usage是上下文占用。

这个字段类型是ThreadContextUsage。默认是None。

## 三、它和谁协作

这个类被GET /api/threads/{id}/token-usage路由使用。

by_model字段由ThreadTokenUsageModelBreakdown组成。by_caller字段由ThreadTokenUsageCallerBreakdown组成。context_usage字段由ThreadContextUsage组成。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是5分。

理由如下。

token用量是用户关心的成本数据。这个类是对话级用量的完整视图。

三种拆分维度支持详细归因。上下文占用提示用户管理对话长度。

所以评5分。
