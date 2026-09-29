# present_file_tool-档案

## 一、这个类是干什么的

present_file_tool不是类。

present_file_tool是tools/builtins/present_file_tool.py里的工具函数。

这个工具让文件对用户可见。

用户可以在客户端界面查看和渲染这些文件。

只有/mnt/user-data/outputs目录下的文件能被展示。

这个工具返回Command更新artifacts状态。

state更新由reducer处理，防止并行调用冲突。

这个模块位于backend/packages/harness/deerflow/tools/builtins/present_file_tool.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、present_file_tool函数

参数如下。

- runtime是注入的工具运行时。
- filepaths是要展示的绝对文件路径列表。
- tool_call_id是注入的工具调用id。

什么时候用这个工具。

让文件可查看、下载、交互时。

一次展示多个相关文件时。

创建了应该展示的文件之后。

什么时候不用。

只是自己处理需要读文件内容时。

临时或中间文件不打算给用户看时。

### 2、_normalize_presented_filepath函数

这个函数把展示路径规整到/mnt/user-data/outputs/*契约。

接受两种形式。

第一种是虚拟沙箱路径，例如/mnt/user-data/outputs/report.md。

第二种是主机侧线程输出路径。

返回规整后的虚拟路径。

runtime元数据缺失或路径在当前线程输出目录之外时报ValueError。

处理流程如下。

先解析thread_id。

再从runtime.state取thread_data的outputs_path。

虚拟前缀开头走resolve_virtual_path解析。

否则按主机路径解析。

最后用relative_to校验路径在outputs_dir内。

不在outputs目录里的路径报错。

### 3、_get_thread_id函数

这个函数从runtime上下文或RunnableConfig解析当前线程id。

三级回退。

runtime.context、runtime.config、get_config()。

### 4、返回Command

路径规整失败时返回错误ToolMessage。

成功时返回Command。

更新artifacts列表和成功ToolMessage。

merge_artifacts reducer负责合并和去重。

## 三、它和谁协作

- deerflow.config.paths的get_paths和resolve_virtual_path解析虚拟路径。
- resolve_runtime_user_id解析用户id。
- ThreadState的artifacts通道由reducer合并。
- ThreadDataMiddleware建立的outputs目录是路径校验的基准。

## 四、重要性评级

评级是6分。

理由如下。

这个工具是代理交付产物的出口。

write_file写的文件要靠它展示给用户。

路径规整严格限定在outputs目录。

防止展示其他目录的文件。

虚拟路径解析用和ThreadDataMiddleware相同的user_id。

保证解析到同一个用户级outputs目录。

但它的逻辑是路径处理。

规模小。

扣掉4分。
