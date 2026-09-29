# LarkInstallResult档案

源码位置：backend/packages/harness/deerflow/integrations/lark_cli.py

## 一、这个类是干什么的

LarkInstallResult是一次Lark集成安装的结果。

管理员点安装按钮。安装流程跑完。流程要报告装了多少技能。安装后的状态如何。有没有内容变化。这些信息装进LarkInstallResult。

LarkInstallResult是不可变的。类声明用了frozen=True。

## 二、类的成员

（一）字段

- success：安装是否成功。
- installed_skills：本次安装的技能名字元组。
- status：安装完成后的LarkIntegrationStatus。
- message：给人看的结果说明。安装函数会在消息里追加"技能内容相对上次安装有变化"的提示。

（二）方法

LarkInstallResult是dataclass。LarkInstallResult没有自定义方法。

## 三、它和谁协作

（一）产生者

install_lark_integration是唯一产生者。install_lark_integration的流程很长。先解析版本。再下载官方技能包。再解压校验。再注入DeerFlow共享指引。再计算内容SHA-256。再原子替换全局技能目录。本地AIO模式下还会安装沙箱运行时二进制。全部完成后组装LarkInstallResult。

（二）消费者

Gateway的管理安装端点是消费者。端点把结果返回给前端。

（三）对比

install_lark_integration目前只产生success=True的结果。失败直接抛异常。所以success字段是为契约完整性保留的。

## 四、重要性评级

评级：4分。

理由：LarkInstallResult是安装动作对外的返回契约。没有它安装结果就没有结构化载体。但它是纯粹的数据类。逻辑都在install_lark_integration里。给4分。
