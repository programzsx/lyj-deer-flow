# AdapterContext档案

来源文件：`backend/app/gateway/capabilities.py`

## 一、这个类是干什么的

这个类是能力中心适配器的调用上下文。

能力中心有多个适配器，比如MCP适配器、业务适配器、Lark适配器、技能适配器。

每个适配器都接收同一个`AdapterContext`对象。

这个类把适配器需要的环境信息打包成一个不可变对象。

打包的信息有四样。

第一样是当前HTTP请求。

第二样是应用配置。

第三样是用户id。

第四样是作用域。

作用域有两种取值，`deployment`表示部署级，`user`表示用户级。

这个类是冻结dataclass。对象创建后不能被修改。

不可变设计可以防止适配器之间意外篡改上下文。

## 二、类的成员

### 1、字段request

`request`字段的类型是FastAPI的`Request`。

`request`字段让适配器能访问原始HTTP请求。

适配器安装能力时要往下游传递这个request。

### 2、字段config

`config`字段的类型是`AppConfig`。

`config`字段是当前应用配置快照。

Lark适配器用它判断集成状态。

### 3、字段user_id

`user_id`字段的类型是`str`。

`user_id`字段是当前生效用户id。

用户级作用域下，`user_id`是请求用户的id。

部署级作用域下，`user_id`可能来自内部上下文。

### 4、字段scope

`scope`字段是`Literal["deployment", "user"]`类型，默认是`"deployment"`。

`scope`字段决定适配器读哪个存储。

MCP适配器用户级读用户MCP配置文件，部署级读共享配置。

## 三、它和谁协作

这个类由模块的`list_installations()`顶层函数创建。

这个类被所有`CapabilityAdapter`实现消费。

`MCPAdapter`、`BusinessAdapter`、`LarkAdapter`、`SkillAdapter`都接收这个类。

这个类的`request`字段最终被传给MCP安装函数和Lark安装函数。

## 四、重要性评级

评级：6分。

理由：这个类是能力中心适配器体系的统一参数契约。没有这个类，四个适配器就要各自声明一堆参数，作用域语义会发散。这个类的冻结设计保证了上下文不可被中途篡改。这个类贯穿能力中心所有读写路径。但这个类本身只是数据打包，不含逻辑。所以这个类是体系内重要的基础设施。
