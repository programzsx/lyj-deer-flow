# LarkCliProbeResponse档案

类定义在backend/app/gateway/routers/integrations.py。

## 一、这个类是干什么的

这个类是lark-cli探测结果的响应体。

Lark集成需要lark-cli命令行工具。系统想知道这个工具是否可用。工具在哪里。版本是什么。

后端探测后用这个类返回结果。这个类是一个Pydantic模型。

## 二、类的成员

这个类有4个字段。

### 1、available

available表示lark-cli是否可用。

这个字段是布尔类型。这个字段必填。

可用包括两种情况。DeerFlow托管的。或者PATH上已有的。

### 2、path

path是解析出的可执行文件路径。

这个字段是字符串类型。默认是None。

宿主机路径是管理员可见的信息。非管理员会被遮蔽。

### 3、version

version是lark-cli的版本。这个字段是字符串类型。默认是None。

### 4、error

error是探测失败的消息。这个字段是字符串类型。默认是None。

## 三、它和谁协作

这个类作为LarkIntegrationStatusResponse的cli字段类型。

由_cli_probe_to_response函数从LarkCliProbe探测对象转换而来。

这个类继承了Pydantic的BaseModel。

## 四、重要性评级

评分是3分。

理由如下。

这个类是Lark集成诊断信息的一部分。路径遮蔽保护宿主机信息。

这个类只有4个字段。

所以评3分。
