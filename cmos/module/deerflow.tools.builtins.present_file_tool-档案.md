# deerflow.tools.builtins.present_file_tool-档案

## 一、这个模块是干什么的

这个文件定义present_files工具。

这个工具把输出文件呈现给用户。

用户能在客户端界面查看和下载这些文件。

只有/mnt/user-data/outputs下的文件能被呈现。

agent创建完文件并放到outputs目录后调用它。

## 二、模块里的主要成员

### 1、present_file_tool工具

工具接受filepaths列表。

工具返回Command。

Command更新artifacts列表和ToolMessage。

artifacts的合并由reducer处理。

reducer会合并和去重。

工具可以和其他工具安全并行调用。

#### （1）路径规范化

_normalize_presented_filepath把路径规范化到outputs契约。

接受两种路径。

一种是/mnt/user-data/outputs/report.md这样的虚拟路径。

一种是宿主侧线程outputs路径。

规范化先取线程id。

再从runtime.state取outputs_path。

虚拟路径走resolve_virtual_path解析。

宿主路径直接解析。

最后检查路径在outputs目录内。

不在outputs目录内就报错。

#### （2）错误处理

运行时状态缺失报错。

线程id缺失报错。

outputs路径缺失报错。

路径越界报错。

错误通过Command包装成ToolMessage。

### 2、docstring的使用指导

docstring指导模型什么时候用。

用的情况是文件要给用户查看下载或交互。

一次呈现多个相关文件。

创建完该呈现的文件后。

不用的情况是只需要自己读内容。

临时或中间文件不给用户看。

## 三、它和谁协作

它依赖deerflow.config.paths的虚拟路径解析。

它依赖deerflow.runtime.user_context的用户解析。

它依赖langgraph的Command机制。

它被tools.py加入BUILTIN_TOOLS。

它产生的artifacts进入ThreadState的artifacts字段。

客户端界面读取artifacts来展示文件。

## 四、重要性评级

评级是7分。

理由是这个文件是agent产出物交付给用户的唯一通道。

模型写完文件必须调用它用户才能看到。

路径规范化保证了越界文件不能被呈现。

不评高分的原因是逻辑相对简单。

核心的路径校验和reducer都在别处。
