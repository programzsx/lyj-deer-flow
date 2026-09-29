# LarkCliProbe档案

源码位置：backend/packages/harness/deerflow/integrations/lark_cli.py

## 一、这个类是干什么的

LarkCliProbe是一个探测结果类。

LarkCliProbe记录lark-cli二进制在Gateway上的可用性。

 Gateway进程需要知道lark-cli装没装。装在哪里。版本是多少。回答这些问题的动作叫探测。探测的结果装进LarkCliProbe。

LarkCliProbe是不可变的。类声明用了frozen=True。

## 二、类的成员

（一）字段

- available：lark-cli是否可用。可用指二进制存在且能成功执行`--version`。
- path：lark-cli的路径。不可用时可能为None。
- version：版本号字符串。来自`lark-cli --version`的输出。
- error：失败原因。available为False时给出说明。

（二）方法

LarkCliProbe是dataclass。LarkCliProbe没有自定义方法。

## 三、它和谁协作

（一）产生者

probe_lark_cli是产生者。probe_lark_cli先解析lark-cli的路径。路径来自DeerFlow管理的npm安装目录或系统PATH。找不到路径就直接返回不可用的探测结果。找到路径就交给_probe_lark_cli_at_path。

_probe_lark_cli_at_path也是产生者。_probe_lark_cli_at_path实际运行`--version`命令。命令超时5秒。退出码非零或运行异常都会产生不可用的探测结果。

（二）消费者

get_lark_integration_status是消费者。get_lark_integration_status把LarkCliProbe装进LarkIntegrationStatus的cli字段。

_ensure_managed_gateway_lark_cli是消费者。_ensure_managed_gateway_lark_cli读LarkCliProbe的version字段。版本相同就跳过重装。

_install_managed_gateway_lark_cli是消费者。_install_managed_gateway_lark_cli在npm安装完成后用LarkCliProbe确认装出来的CLI能跑。

## 四、重要性评级

评级：4分。

理由：LarkCliProbe是整个Lark集成状态可见性的基础。版本对齐逻辑依赖这个类。安装决策也依赖这个类。但LarkCliProbe本身只是数据载体。逻辑都在产生者函数里。给4分。
