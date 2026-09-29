# LarkAuthProbe档案

源码位置：backend/packages/harness/deerflow/integrations/lark_cli.py

## 一、这个类是干什么的

LarkAuthProbe是一个探测结果类。

LarkAuthProbe记录某个用户的Lark授权状态。

用户的授权状态有多种可能。lark-cli没装是一种。Lark应用没配置是一种。本地有token但没验证是一种。真正登录成功是一种。每种状态都装进LarkAuthProbe。

LarkAuthProbe是不可变的。类声明用了frozen=True。

## 二、类的成员

（一）字段

- status：状态字符串。取值包括unavailable、not_configured、not_authorized、error、authenticated。
- message：给人看的状态说明。
- user：已登录用户的用户名或openId。未登录时为None。
- verified：token是否经过了对Lark服务端的实时验证。本地只查token存在时verified为False。

（二）方法

LarkAuthProbe是dataclass。LarkAuthProbe没有自定义方法。

## 三、它和谁协作

（一）产生者

probe_lark_auth是唯一产生者。probe_lark_auth按顺序检查三件事。先看lark-cli路径。再看config.json里配没配应用。最后运行`auth status --json`命令。verify参数为True时会追加`--verify`做实时验证。

（二）消费者

get_lark_integration_status是消费者。get_lark_integration_status把LarkAuthProbe装进LarkIntegrationStatus的auth字段。这个字段暴露给设置页的状态接口。

complete_lark_auth是消费者。complete_lark_auth在完成设备码授权后读取status.auth.status。状态是authenticated才认定授权完成。

（三）使用约束

probe_lark_auth的docstring明确了使用成本。默认只查本地token，离线且便宜，适合频繁轮询的状态接口。verify=True要花一次网络往返，只留给显式的"完成授权"步骤。

## 四、重要性评级

评级：4分。

理由：LarkAuthProbe是授权状态对用户可见的唯一载体。前端的状态轮询依赖这个类。授权完成的判定也依赖这个类。但LarkAuthProbe本身只是数据载体。给4分。
