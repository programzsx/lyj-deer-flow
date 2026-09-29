# ExecResult档案

源码位置：backend/packages/harness/deerflow/integrations/lark_broker.py

## 一、这个类是干什么的

ExecResult是一次lark-cli调用的执行结果。

broker收到沙箱转发来的命令。broker执行lark-cli。执行完了要报告退出码、标准输出、标准错误、输出有没有被截断。这些信息装进ExecResult。

ExecResult是不可变的。类声明用了frozen=True。

## 二、类的成员

（一）字段

- exit_code：lark-cli子进程的退出码。
- stdout：标准输出的字节。
- stderr：标准错误的字节。
- truncated：输出是否被截断。stdout和stderr任何一个被截断都为True。

（二）方法

ExecResult是dataclass。ExecResult没有自定义方法。

## 三、它和谁协作

（一）产生者

run_lark_cli是主要产生者。run_lark_cli产生几种ExecResult。正常执行产生带真实退出码和输出的结果。子命令命中黑名单产生退出码126加错误消息。超时产生退出码124。二进制不存在产生退出码127。

_cap是辅助。_cap把超过4MB的输出截断。截断时truncated置True。

（二）消费者

make_handler里的Handler是消费者。Handler把ExecResult编码成JSON响应。stdout和stderr用base64编码。truncated原样传。

shim是最终消费者。沙箱里的lark-cli-shim.py解码base64。把stdout和stderr回放给调用方。按exit_code退出。传输失败时shim自己报错并以非零退出。broker故障不会伪装成一次成功的lark-cli运行。

## 四、重要性评级

评级：4分。

理由：ExecResult是broker的线上契约的一半。请求进、结果出。结果的结构就是ExecResult。truncated字段让截断对调用方可见。但它是纯粹的数据类。给4分。
