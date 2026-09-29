# deerflow.config.runtime_paths-档案

## 一、这个模块是干什么的

这个模块解决独立运行时的路径问题。

DeerFlow的状态目录、项目根目录都可能需要动态确定。

这个模块提供一组简单的解析函数。

解析依据是环境变量和当前工作目录。

这个模块是config包里其他路径模块的地基。

`paths.py`和各配置文件的默认路径都从这里出发。

## 二、模块里的主要成员

### 1、project_root()

返回调用方项目的根目录。

优先读`DEER_FLOW_PROJECT_ROOT`环境变量。

环境变量指向的路径必须存在且是目录，否则报错。

没设环境变量就返回当前工作目录。

### 2、runtime_home()

返回可写的DeerFlow状态目录。

优先读`DEER_FLOW_HOME`环境变量。

没设就返回项目根下的`.deer-flow`目录。

blob存储、受管模型目录都挂在这个家目录下。

### 3、resolve_path()

把相对路径解析成绝对路径。

相对路径相对于项目根。

绝对路径原样返回。

### 4、existing_project_file()

在项目根下按候选名字找第一个存在的文件。

返回Path或None。

`app_config.py`用它找`config.yaml`。

`extensions_config.py`用它找`extensions_config.json`和`mcp_config.json`。

## 三、它和谁协作

`paths.py`、`app_config.py`、`extensions_config.py`、`managed_models.py`、`skills_config.py`都从这里取路径。

网关的MCP路由和记忆管理器也依赖它。

## 四、重要性评级

评级：7分。

理由：这个模块很小，但位置关键。所有配置文件的默认查找都建立在它上面。环境变量的校验保证错误配置能尽早暴露。
