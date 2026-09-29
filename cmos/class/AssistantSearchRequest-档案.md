# AssistantSearchRequest档案

类定义在backend/app/gateway/routers/assistants_compat.py。

## 一、这个类是干什么的

这个类是搜索助手的请求体。

前端调用POST /api/assistants/search接口搜索助手。前端用这个类传搜索条件。

这个类是一个Pydantic模型。这个类的所有字段都是可选的。不传任何条件就是列出全部助手。

## 二、类的成员

这个类有5个字段。

### 1、graph_id

graph_id按图编号过滤。这个字段是字符串类型。默认是None。

### 2、name

name按名称过滤。这个字段是字符串类型。默认是None。

过滤是模糊匹配。请求里的name出现在助手名称里就算匹配。匹配不区分大小写。

### 3、metadata

metadata按元数据过滤。这个字段是字典类型。默认是None。

注意当前路由实现没有使用这个字段。这个字段只是兼容LangGraph平台的格式。

### 4、limit

limit是返回数量上限。这个字段是整数类型。默认是10。

这个字段最小1。最大1000。

### 5、offset

offset是分页偏移量。这个字段是整数类型。默认是0。

这个字段最小0。

## 三、它和谁协作

这个类被POST /api/assistants/search路由使用。

这个类作为search_assistants函数的body参数。body本身可以为None。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是3分。

理由如下。

这个类只是搜索条件的容器。这个类只有5个简单字段。

过滤和分页逻辑在路由函数里。metadata字段甚至没有实际生效。

前端初始化时需要用到它。所以这个类有基础作用。
