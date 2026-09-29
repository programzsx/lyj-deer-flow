# RunStatus档案

源码位置：backend/packages/harness/deerflow/runtime/runs/schemas.py

## 一、这个类是干什么的

RunStatus是一个枚举类。

RunStatus定义单个运行的生命周期状态。

RunStatus的值有6个。

- pending：等待启动。
- running：正在执行。
- success：成功结束。
- error：出错结束。
- timeout：超时结束。
- interrupted：被中断。

RunStatus继承StrEnum。枚举值同时是字符串。序列化到store时用`status.value`。

RunStatus的转换路径是固定的。pending先转running。running再转success、error、timeout或interrupted。interrupted还可以经回滚路径转error。

存储层的update_status只允许pending、running、interrupted行转换。terminal状态不可再改。

## 二、类的成员

（一）枚举值

- pending：pending。运行已接纳但还没启动。
- running：running。运行正在执行。
- success：success。运行成功完成。
- error：error。运行出错完成。
- timeout：timeout。运行超时完成。
- interrupted：interrupted。运行被取消或被打断。

（二）方法

RunStatus继承StrEnum。RunStatus没有自定义方法。

## 三、它和谁协作

（一）RunRecord

RunRecord的status字段类型是RunStatus。运行内存态用这个枚举。

（二）RunManager

RunManager的set_status、try_start、cancel等方法读写RunStatus。状态转换判断都基于这个枚举。

（三）存储层

RunStore的update_status、start_run等方法接收status字符串。字符串值来自RunStatus.value。MemoryRunStore用字符串比较状态。

（四）worker层

worker.py的run_agent在终态处理时使用RunStatus。

## 四、重要性评级

评级：4分。

理由：RunStatus是运行生命周期的词汇表。所有状态判断都依赖这个枚举。状态集合的约定贯穿manager、worker、store三层。但它是纯枚举。没有逻辑。所以给4分。
