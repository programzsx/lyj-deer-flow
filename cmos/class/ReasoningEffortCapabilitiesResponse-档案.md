# ReasoningEffortCapabilitiesResponse档案

类定义在backend/app/gateway/routers/models.py。

## 一、这个类是干什么的

这个类是模型推理力度能力的响应体。

不同模型接受不同的力度值。有的模型用low、medium、high。有的模型用max。有的用其他词汇。

这个类描述一个模型接受哪些力度值。这个类是一个Pydantic模型。

这个类是ReasoningCapabilitiesResponse的组成部分。

## 二、类的成员

这个类有3个字段。

### 1、values

values是模型接受的力度值列表。

这个字段是字符串列表类型。这个字段必填。

值按显示顺序排列。值使用供应商自己的词汇。

### 2、default

default是调用者不选择时使用的力度。

这个字段是字符串类型。默认是None。

### 3、aliases

aliases是通用值到供应商值的映射。

这个字段是字典类型。默认是空字典。

键是DeerFlow的通用力度值。值是供应商的实际值。前端可以用通用值做UI。用映射找到实际值。

## 三、它和谁协作

这个类作为ReasoningCapabilitiesResponse的effort字段类型。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是4分。

理由如下。

力度词汇不一致是实际痛点。这个类用values加aliases的组合解决了这个问题。

前端可以显示通用值。后端负责映射到供应商词汇。

这个类只是数据容器。所以评4分。
