# deerflow.persistence.feedback.sql-档案

## 一、这个模块是干什么的

这个模块是SQLAlchemy后端的反馈存储。

仓库类叫FeedbackRepository。

FeedbackRepository读写feedback表。

feedback表存用户对运行结果的点赞点踩和评论。

每个方法获取自己的短生命周期会话。

用完就释放。

## 二、模块里的主要成员

### 1、FeedbackRepository类

这个类持有会话工厂。

这个类的方法覆盖反馈的增删查改和聚合。

user_id参数有三态约定。

三态是AUTO、显式id、显式None。

AUTO从请求上下文解析。

显式id限定那个用户。

显式None绕过拥有者过滤。

显式None给迁移和CLI调用方用。

#### （1）create方法

create创建一条反馈记录。

rating必须是+1或-1。

否则抛ValueError。

创建后返回字典形式的行。

#### （2）get方法

get按feedback_id取一条反馈。

行不存在返回None。

行存在但user_id不匹配也返回None。

不匹配和缺失等价。

外来的反馈对外不可见。

#### （3）list_by_run方法和list_by_thread方法

list_by_run列出一个run的全部反馈。

list_by_thread列出一个线程的全部反馈。

都按创建时间正序。

都有limit上限。

#### （4）upsert方法

upsert创建或更新反馈。

键是(thread_id, run_id, user_id)。

行存在时更新rating和comment。

created_at也被刷新。

行不存在时插入新行。

#### （5）delete方法

delete删除一条反馈。

拥有者不匹配返回False。

#### （6）delete_by_run方法和delete_by_thread方法

delete_by_run删除当前用户对一个run的反馈。

delete_by_thread删除拥有者对一个线程全部run的反馈。

delete_by_thread支持三态user_id。

显式None删除所有用户的行。

#### （7）list_by_thread_grouped方法

这个方法返回按run_id分组的反馈。

返回{run_id: feedback字典}。

显式None时多个用户可能对同一个run有反馈。

所以排序要确定。

每个run保留最后一行。

最后一行是最近写的反馈。

created_at在更新时被刷新。

feedback_id打破平局。

#### （8）list_by_run_ids方法

这个方法只返回选定run的反馈。

排序语义和list_by_thread_grouped一致。

run_ids为空时直接返回空字典。

#### （9）aggregate_by_run方法

这个方法聚合一个run的反馈统计。

聚合在数据库侧完成。

一条SQL同时算出总数、正评数、负评数。

用func.count和func.sum加case。

返回{run_id, total, positive, negative}。

### 2、_row_to_dict方法

这个方法把行转成字典。

created_at用coerce_iso规范化。

SQLite读出来会丢时区。

coerce_iso把无时区的时间当作UTC。

输出永远带时区。

## 三、它和谁协作

### 1、它依赖谁

它依赖feedback/model.py的FeedbackRow。

它依赖deerflow.runtime.user_context的AUTO和resolve_user_id。

它依赖deerflow.utils.time的coerce_iso。

### 2、谁依赖它

Gateway的feedback路由用它处理用户反馈请求。

线程删除流程用delete_by_thread清理反馈。

## 四、重要性评级

评级是5分。

理由如下。

用户反馈的读写逻辑全在这里。

upsert和分组读取的确定性排序处理得仔细。

聚合用数据库侧计数。

扣分的原因是反馈是辅助功能。

反馈不参与运行的核心链路。

这个仓库也不被其他模块复用。
