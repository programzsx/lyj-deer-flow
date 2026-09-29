# InstallRequest档案

类定义在backend/app/gateway/routers/capabilities.py。

## 一、这个类是干什么的

这个类是安装插件时的请求体。

用户想让DeerFlow安装一个插件。用户要把插件信息发给后端。

后端用这个类接收信息。这个类是一个Pydantic模型。

这个类负责校验请求格式。格式不对就返回422错误。

## 二、类的成员

这个类有4个字段。

### 1、plugin_id

plugin_id是要安装的插件编号。

这个字段是字符串类型。这个字段必填。

后端用这个字段在插件目录里查找插件。找不到就返回404。

### 2、name

name是安装后的名称。

这个字段是字符串类型。这个字段默认是空字符串。

这个字段最长128个字符。

### 3、configuration

configuration是插件的配置项。

这个字段是字典类型。这个字段默认是空字典。

不同插件需要不同的配置。例如API密钥就放在这里。

### 4、scope

scope是安装范围。

这个字段只有两个合法值。

deployment表示部署级安装。user表示用户级安装。

这个字段默认是deployment。

安装范围影响权限检查。deployment范围需要管理员权限。

## 三、它和谁协作

这个类被POST /api/capabilities/installations路由使用。

这个类作为install函数的body参数。

这个类继承了Pydantic的BaseModel。

这个类设置了extra="forbid"。请求里出现未知字段会被拒绝。

## 四、重要性评级

评分是5分。

理由如下。

安装插件是能力系统的入口操作。这个类是安装操作的唯一请求格式。

这个类本身只是数据容器。这个类没有业务逻辑。

这个类决定安装范围。安装范围影响权限检查。所以这个类有一定重要性。
