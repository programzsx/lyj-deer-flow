# deerflow.tui.session-档案

## 一、这个模块是干什么的

这个文件是TUI的嵌入式会话接线模块。

会话持有三样东西。

一样是DeerFlowClient。

一样是共享持久化写入器。

一样是后台数据库循环。

会话负责构建client。

client带持久checkpointer。

会话负责线程解析。

支持--continue和--resume。

恢复可以按id，也可以按标题。

## 二、模块里的主要成员

### 1、Session数据类

Session持有client、writer、loop。

#### （1）resolve_thread方法

这个方法解析要运行的线程id。

plan里带thread_id就按引用解析。

continue_recent就取最近的线程。

都没有就返回None，新开线程。

#### （2）resolve_ref方法

这个方法把线程引用解析成线程id。

引用可以是id或标题。

先按id精确匹配。

再按标题精确匹配。

都不匹配时按字面量处理。

字面量被当作id使用。

字面量要通过线程id契约校验。

校验失败给出明确的错误信息。

合法线程id是1到64个ASCII字母数字连字符下划线。

#### （3）recent_threads方法

recent_threads列出最近的线程。

给线程切换器用。

#### （4）close方法

close停止后台数据库循环并释放引擎。

先在循环里跑close_engine。

再关闭循环。

全部尽力而为。

### 2、open_session函数

open_session构建嵌入式会话。

先从配置拿checkpointer。

再构建DeerFlowClient。

persistence为False时不建持久化。

无头单次没有写入器，跳过。

persistence为True时建后台循环和写入器。

## 三、它和谁协作

它依赖deerflow.client的DeerFlowClient。

它依赖deerflow.runtime.checkpointer.provider的checkpointer。

它依赖deerflow.tui.persistence的写入器和循环。

它被cli.py和app.py调用。

app持有session来访问client和writer。

## 四、重要性评级

评级是6分。

理由是这个文件是TUI到嵌入式client的接线层。

checkpointer和持久化的构建都在这里。

线程解析支持id和标题两种引用。

无效引用有明确的错误。

不评高分的原因是它是接线层。

对话能力全在client里。
