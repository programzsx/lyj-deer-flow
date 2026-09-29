# ToolArtifactConfig档案

一、这个类是干什么的

ToolArtifactConfig是工具产物句柄注册表的配置类。对应issue #4676。启用后工具结果里的产物引用会被捕获到ThreadState.tool_artifacts。产物因此能挺过上下文压缩。模型用短句柄art_xxxxxxxx引用产物。句柄在工具调用时被解析成真实引用。这个类继承自pydantic的BaseModel。

二、类的成员

（一）字段

- enabled：布尔值。默认值是True。这个字段表示是否启用产物捕获和句柄解析。
- max_entries：整数。默认值是100。取值范围是10到1000。这个字段限制每个线程保留的产物条目数。
- detect_refs_in_text：布尔值。默认值是True。这个字段表示是否保守扫描自由文本里的沙箱路径和远程文件URL。
- inject_model_context：布尔值。默认值是True。这个字段表示是否把可用句柄作为持久上下文注入模型请求。
- resolve_handles_in_args：布尔值。默认值是True。这个字段表示是否在执行前把工具参数里的句柄解析成真实引用。

（二）方法

这个类没有自定义方法。所有约束都写在Field里。

三、它和谁协作

AppConfig持有这个类。AppConfig的tool_artifacts字段是这个类的实例。产物注册表中间件读取这个实例。句柄注入和解析代码读取inject_model_context和resolve_handles_in_args。

四、重要性评级

评级：6分。

理由：产物句柄让大文件引用挺过上下文压缩。这是上下文管理的重要手段。默认开启。所以重要性中等偏上。
