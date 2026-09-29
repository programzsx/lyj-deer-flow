# deerflow.extensions.model_schema_worker档案

## 一、这个模块是干什么的

这个模块是一个一次性的schema工作进程。

它不是常驻服务。它由`model_invocation.py`按文件路径启动。启动在一个隔离的Python子进程里。子进程从标准输入读数据。子进程把校验结果写到标准输出。子进程退出。

它的职责只有两个。

第一个职责。校验一个JSON Schema是否是合法的Draft 2020-12对象schema。

第二个职责。校验一段模型输出是否符合那个schema。

只允许有界的JSON输入和固定的状态词通过管道。昂贵的schema检查和正则校验绝不在Gateway事件循环或它的GIL上执行。

## 二、模块里的主要成员

### 1、main函数

这是主入口。流程分两步。

第一步。校验schema。

- 从stdin读一行。解析成JSON。
- 检查schema的type必须是object。
- 递归检查schema。拒绝`$ref`、`$dynamicRef`、`$recursiveRef`。引用解析不被允许。拒绝非2020-12的`$schema`方言。
- 用`Draft202012Validator.check_schema`做正式检查。
- 任何一步失败打印`invalid_schema`。成功打印`ready`。

第二步。校验输出。

- 从stdin读一行。解析成JSON。解析时用`_reject_constant`拒绝非有限数。比如NaN和Infinity。
- 再用`json.dumps(allow_nan=False)`二次确认。
- 用`Draft202012Validator.validate`校验输出。
- 任何失败打印`invalid_output`。成功打印`valid`。

### 2、_reject_constant函数

解析时遇到NaN、Infinity这样的非有限JSON数直接抛异常。

### 3、_check_inline函数

递归遍历schema。拒绝引用。拒绝不支持的方言。schema里出现的任何`$ref`都让校验失败。因为引用解析需要网络访问或额外文件。这个子进程不允许。

### 4、协议约定

父进程和子进程的协议是固定的。

- 输入第一行是schema的JSON。
- 输入第二行可选。是待校验的内容的JSON。
- 输出状态词只有三个。`invalid_schema`、`ready`、`valid`。
- 输出`ready`加`valid`表示schema合法且输出匹配。
- 输出只有`invalid_schema`表示schema不合法。
- 输出`ready`加`invalid_output`表示schema合法但输出不匹配。

## 三、它和谁协作

这个模块被`deerflow.extensions.model_invocation._schema_validator`启动。父进程用`sys.executable -I`按文件路径启动。`-I`是隔离模式。不读用户的site配置。

这个模块依赖`jsonschema`库的`Draft202012Validator`。

这个模块本身不导入deerflow的任何东西。它是独立的最小进程。

## 四、重要性评级

评级是5分。

理由。这个模块支撑扩展模型调用的结构化输出校验。schema检查和正则校验是CPU密集的。放到子进程里跑保护了Gateway的事件循环和GIL。隔离模式启动防止用户site配置干扰。

引用拒绝的设计也关键。`$ref`解析需要网络或文件访问。在子进程里直接拒绝让这个面收敛到零。

但它的职责非常窄。它只做两步校验。返回固定的状态词。没有它，schema校验就得在Gateway进程里跑。那是一个性能问题。不是正确性问题。所以重要性是中等偏下。
