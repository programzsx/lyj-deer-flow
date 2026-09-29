# _LauncherGrammar档案

类定义在backend/app/gateway/routers/mcp.py。

## 一、这个类是干什么的

这个类是MCP启动器命令行语法的描述。

MCP服务器通过包启动器启动。例如npm。例如uvx。每个启动器有自己的参数语法。哪些参数是布尔开关。哪些参数消耗下一个值。

这个类记录启动器的语法规则。后端用这些规则校验启动命令。这个类是一个NamedTuple。这个类不是Pydantic模型。

这是一个私有类。类名以下划线开头。这个类只在mcp.py内部使用。

## 二、类的成员

这个类有3个字段和1个方法。

### 1、exec_args

exec_args是启动器自己的参数集合。

这个字段是frozenset类型。

### 2、known_args

known_args是已知的参数集合。

这个字段是frozenset类型。

### 3、unknown_consumes_value

unknown_consumes_value表示未知参数是否消耗下一个值。

这个字段是布尔类型。

### 4、consumes_value方法

consumes_value判断一个参数是否消耗下一个token。

unknown_consumes_value为true时。不在known_args里的参数消耗值。为false时。在known_args里的参数消耗值。

## 三、它和谁协作

这个类在MCP服务器启动命令的校验中使用。

相关常量是_NPM_BOOLEAN_ARGS。这个常量从npm的配置定义生成。npm升级时要重新生成。

校验失败的方向是过度阻止。拒绝消息会指明参数名。

## 四、重要性评级

评分是4分。

理由如下。

MCP启动命令校验是安全边界的一部分。MCP API只允许隔离的启动器。拒绝任意Python命令。

参数语法错误会导致启动器行为不可预期。

这个类是内部结构。所以评4分。
