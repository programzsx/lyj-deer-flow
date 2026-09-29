# ReadBeforeWriteConfig档案

一、这个类是干什么的

ReadBeforeWriteConfig是先读后写文件门控的配置类。对应issue #3857。门控作用在修改文件的工具上。启用后write_file和str_replace会被阻止。阻止条件是文件在最后一次修改后没有被read_file读过。门控强迫代理先看文件的当前状态再改文件。这个类继承自pydantic的BaseModel。

二、类的成员

（一）字段

- enabled：布尔值。默认值是True。这个字段表示是否阻止写入没有被读过当前版本的已有文件。
- elide_blocked_payloads：布尔值。默认值是True。这个字段表示是否把被门控阻止的调用参数替换成占位符。被阻止的调用没有真正运行。这些参数在后续模型调用里是死重。只有请求副本被替换。存储的消息历史、回执和运行日志保留原始参数。
- elide_min_chars：整数。默认值是2000。最小值是0。这个字段表示只有长度达到这个值的参数才会被省略。短的参数保持可见。0表示省略所有非空参数。这是Python字符数。不是token数。

（二）方法

这个类没有自定义方法。所有约束都写在Field里。

三、它和谁协作

AppConfig持有这个类。AppConfig的read_before_write字段是这个类的实例。先读后写门控中间件读取这个实例。ToolOutputConfig的elide_superseded_writes和这个门控配合工作。

四、重要性评级

评级：6分。

理由：这个门控防止代理盲写文件。盲写会覆盖用户的修改。门控还省略死重参数来节省上下文。这直接影响上下文成本。所以重要性中等偏上。
