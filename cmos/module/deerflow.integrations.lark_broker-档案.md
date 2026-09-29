# deerflow.integrations.lark_broker

## 一、这个模块是干什么的

这个模块是Lark CLI的沙箱凭据代理。

背景是这样的。

代理在沙箱里运行。

沙箱里可能要用lark-cli工具。

lark-cli需要凭据才能工作。

凭据包括长期有效的应用密钥。

凭据还包括OAuth令牌。

老的方案把这些凭据目录直接挂进沙箱。

问题来了。

沙箱里的bash工具能读到原始凭据文件。

这是泄露。

这个模块实现新方案。

新方案是一个代理进程。

代理进程长期运行。

它拥有lark-cli和凭据。

它只暴露命令面。

命令面走loopback网络。

沙箱里放一个很小的lark-cli垫片。

垫片在PATH上。

垫片把参数和标准输入转发给代理。

原始凭据文件永远不出现在沙箱文件系统里。

这个模块只用Python标准库。

因为同一个模块要跑在最小化的代理sidecar镜像里。

sidecar镜像没有额外的依赖。

## 二、模块里的主要成员

- main：入口。读取环境配置，启动HTTP服务。
- BrokerConfig：代理配置。包含端口、超时、并发上限、子命令黑名单等。
- run_lark_cli(config, args, stdin)：执行一次lark-cli命令。返回执行结果。
- make_handler(config)：构造HTTP处理器。处理/exec和/health两个端点。
- serve(config)：启动ThreadingHTTPServer。
- install_shim(dest_dir, version)：把lark-cli垫片安装到沙箱的bin目录。
- render_launcher_script(shim_path)：渲染垫片脚本内容。
- parse_deny_subcommands：解析子命令黑名单。黑名单可用环境变量覆盖。
- _denied_subcommand：判断命令是否被黑名单挡住。
- ExecResult：执行结果。包含输出、退出码。
- 防护措施包括这些。
- 请求体上限1MiB。输出上限4MiB。默认超时120秒。并发上限8。
- 每连接的socket超时30秒。防止沙箱声明大Content-Length却不发body。

## 三、它和谁协作

- 它和沙箱里的lark-cli垫片协作。垫片转发命令给它。
- 它被integrations/lark_cli.py引用。集成安装时决定是否启用代理模式。
- 它被community/aio_sandbox/aio_sandbox_provider.py消费。沙箱编排时按配置部署代理。
- 它被sandbox/tools.py引用。工具侧查询代理是否激活。

## 四、重要性评级

评级是6分。

理由是它是凭据安全的关键一环。

原始凭据文件不出沙箱依赖它。

它的防护参数防止被攻破的沙箱耗尽代理。

黑名单机制给了运维一层额外控制。

但它只在Lark集成加代理模式下运行，适用面有限。
