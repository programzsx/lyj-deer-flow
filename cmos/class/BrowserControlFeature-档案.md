# BrowserControlFeature档案

类定义在backend/app/gateway/routers/features.py。

## 一、这个类是干什么的

这个类是实时浏览器控制功能的可用性标记。

DeerFlow可以实时控制浏览器执行任务。这个功能需要浏览器能力支持。

前端调用GET /api/features接口。前端用这个类判断浏览器控制UI要不要显示。这个类是一个Pydantic模型。

这个类只有1个字段。这个类是FeaturesResponse的组成部分。

## 二、类的成员

这个类有1个字段。

### 1、enabled

enabled表示实时浏览器路由和UI是否可用。

这个字段是布尔类型。这个字段必填。

取值来自browser_capability能力对象。能力对象由config计算得出。

enabled为false时。前端隐藏浏览器控制的入口。

## 三、它和谁协作

这个类被GET /api/features路由使用。

这个类作为FeaturesResponse的browser_control字段类型。

这个类继承了Pydantic的BaseModel。

数据来源是app.gateway.browser_capability模块的browser_capability。

## 四、重要性评级

评分是3分。

理由如下。

这个类只是一个功能开关的载体。这个类只有1个字段。

浏览器能力的实际判断在browser_capability模块里。

前端靠这个标记避免发出后端会拒绝的请求。所以这个类有基础作用。
