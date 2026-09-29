# SaveModelRequest档案

类定义在backend/app/gateway/routers/managed_models.py。

## 一、这个类是干什么的

这个类是管理员保存共享模型的请求体。

管理员可以配置全局共享的模型。管理员调用PUT /api/managed-models接口保存。

管理员也可以调用POST /api/managed-models/test接口测试连通性。测试时也用这个类。

这个类是一个Pydantic模型。

这个类的核心是配置对象和版本号。版本号用来做并发保护。

## 二、类的成员

这个类有2个字段。

### 1、config

config是要保存的模型配置。

这个字段类型是ManagedModel。ManagedModel定义在deerflow.config.managed_models模块。

ManagedModel里包含模型名称、API密钥、接口地址等信息。

API密钥只在服务端使用。密钥不会返回给客户端。

### 2、expected_revision

expected_revision是客户端看到的旧版本号。

这个字段是字符串类型。这个字段可以为None。

这个字段实现乐观并发控制。客户端保存时带上旧版本号。

如果服务器上的版本已经变了。保存会失败。管理员需要重新加载后再保存。

None表示新建操作。新建时模型已存在也会失败。

## 三、它和谁协作

这个类被PUT /api/managed-models和POST /api/managed-models/test两个路由使用。

这两个路由都需要管理员权限。

保存时数据写入ManagedModelStore。ManagedModelStore来自deerflow.config.managed_models模块。

测试时会用config构建一个模型客户端。测试发送一个受限的工具调用探测。测试不保存配置。

测试还会处理密钥继承。expected_revision匹配旧记录且新配置没有密钥时。测试会借用旧记录的密钥。

这个类继承了Pydantic的BaseModel。这个类设置了extra="forbid"。

## 四、重要性评级

评分是6分。

理由如下。

共享模型是全系统对话的底层能力。管理员配置模型必须经过这个类。

expected_revision字段保护并发写入。没有它会出现配置互相覆盖。

测试路由也依赖这个类。测试功能让管理员保存前就能验证连通性。

这个类本身没有复杂逻辑。所以评6分。
