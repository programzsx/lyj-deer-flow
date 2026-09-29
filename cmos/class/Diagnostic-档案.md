# Diagnostic档案

源码位置：backend/packages/harness/deerflow/extensions/loader.py

## 一、这个类是干什么的

Diagnostic是一条诊断信息。

Diagnostic表示加载期或运行期的一个问题。问题归属于某个具体的扩展。

仓库今天没有结构化的诊断通道。Diagnostic是一个刻意极简的通道。它唯一的职责是让失败可归属。

四个快捷构造器对应四个级别。级别有debug、info、warning、error。

## 二、类的成员

（一）字段

- level：级别。取值是debug、info、warning、error四选一。
- source：来源扩展的use字符串。
- message：问题描述。

（二）类方法

- error：构造error级别诊断。
- warning：构造warning级别诊断。
- info：构造info级别诊断。
- debug：构造debug级别诊断。

## 三、它和谁协作

（一）产生者

loader.py的load_extensions产生诊断。安装失败、入口点不可解析、版本不兼容都产生诊断。

isolation.py的IsolatedMiddleware产生诊断。扩展中间件的hook失败产生诊断。

（二）消费者

诊断被收集到列表里。Gateway把诊断记录到app.state.extension_diagnostics。诊断同时被logger输出。

## 四、重要性评级

评级：4分。

理由：Diagnostic是扩展系统可观测性的基础。fail-open策略依赖它。扩展静默失败是危险的。Diagnostic让每次失败都有归属。它只是个三字段数据类。给4分。
