# BrokerConfig档案

源码位置：backend/packages/harness/deerflow/integrations/lark_broker.py

## 一、这个类是干什么的

BrokerConfig是broker sidecar的运行时配置。

Lark的broker是一个长驻进程。broker持有lark-cli二进制和用户凭证。broker只对沙箱暴露命令面。沙箱里的shim把命令转发给broker。broker怎么找到二进制。监听哪里。凭证目录在哪里。拒绝哪些子命令。这些问题的答案就是BrokerConfig。

BrokerConfig是不可变的。类声明用了frozen=True。

## 二、类的成员

（一）字段

- lark_cli_path：lark-cli二进制的路径。broker用这个路径启动子进程。
- config_dir：Lark CLI的config目录。broker把它注入每个调用的环境变量。
- data_dir：Lark CLI的data目录。同上。
- host：监听地址。默认127.0.0.1。broker只绑定loopback。
- port：监听端口。默认8788。
- timeout_seconds：单次lark-cli调用的超时。默认120秒。
- deny_subcommands：被拒绝的lark-cli子命令前缀列表。每项是空格拼接的命令前缀。比如"config show"。匹配时跳过选项和选项值。空元组表示不拒绝任何子命令。这个黑名单是issue #4338加固的一部分。broker已经把凭证文件移出沙箱。但完整的命令面仍然可达。密钥导出类的子命令要在这里显式拒绝。

（二）方法

- credential_env：返回broker注入每次lark-cli调用的环境变量。包括config目录、data目录、关闭更新通知和技能通知。凭证路径由broker决定。客户端不能指定。沙箱进程无法把lark-cli指向别的profile。

## 三、它和谁协作

（一）产生者

_config_from_env是产生者。_config_from_env从环境变量构造BrokerConfig。环境变量包括DEERFLOW_LARK_BROKER_CLI、LARKSUITE_CLI_CONFIG_DIR、LARKSUITE_CLI_DATA_DIR、DEERFLOW_LARK_BROKER_HOST、DEERFLOW_LARK_BROKER_PORT、DEERFLOW_LARK_BROKER_TIMEOUT、DEERFLOW_LARK_BROKER_DENY_SUBCOMMANDS。空端口值按未设置处理。

（二）消费者

serve是消费者。serve用BrokerConfig启动HTTP服务器。

make_handler是消费者。make_handler把BrokerConfig闭包进请求处理类。

run_lark_cli是消费者。run_lark_cli用BrokerConfig执行每次调用。先检查deny_subcommands。命中就直接拒绝。再注入credential_env。再用argv列表加shell=False启动子进程。

## 四、重要性评级

评级：5分。

理由：BrokerConfig是broker模式的安全核心。凭证路径由broker独占决定。deny_subcommands收窄了提示注入攻击能触及的命令面。argv列表加shell=False防止参数被shell解释。所有防线的配置都集中在这个类。给5分。
