# ThreadDataMiddleware档案

来源文件：`backend/packages/harness/deerflow/agents/middlewares/thread_data_middleware.py`

## 一、这个类是干什么的

ThreadDataMiddleware为每次线程执行创建线程数据目录。

它创建的目录结构是三层。

基础目录下的threads目录。
线程id目录。
user-data目录。
user-data下分workspace、uploads、outputs三个子目录。

生命周期有两种模式。

lazy_init为true是默认模式。只计算路径。目录按需创建。
lazy_init为false是预创建模式。在before_agent里立即创建目录。

## 二、类的成员

### （一）字段

- `state_schema`：固定为ThreadDataMiddlewareState。

### （二）方法

钩子方法是重点。

- `before_agent`：线程执行开始时创建或计算线程数据目录。把路径写进状态。

核心方法：

- `__init__`：接收base_dir和lazy_init。
- `_get_thread_paths`：算出线程数据目录的路径。返回workspace、uploads、outputs三个路径。
- `_create_thread_directories`：实际创建目录。返回创建好的路径。

## 三、它和谁协作

- 它挂在中间件链的靠前位置。
- 它依赖Paths解析确定基础目录。
- 它创建的目录被沙箱、上传、产物输出共用。
- UploadsMiddleware和工具输出外部化依赖它建好的目录结构。

## 四、重要性评级

评级：5/10。

理由：线程目录是文件隔离的地基。没有它上传、工作区、输出没有落点。但它的逻辑就是建目录。复杂度低。失败也容易被下游发现。所以给5分。