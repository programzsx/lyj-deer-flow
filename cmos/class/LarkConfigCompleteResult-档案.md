# LarkConfigCompleteResult档案

源码位置：backend/packages/harness/deerflow/integrations/lark_cli.py

## 一、这个类是干什么的

LarkConfigCompleteResult是Lark应用配置流程的完成结果。

用户在浏览器完成授权。后端轮询Lark的注册端点拿到appId和appSecret。后端把凭证持久化。流程结束。成功与否、最终状态、新的代际号装进LarkConfigCompleteResult。

LarkConfigCompleteResult是不可变的。类声明用了frozen=True。

## 二、类的成员

（一）字段

- success：配置是否成功。
- status：配置完成后的LarkIntegrationStatus。
- message：给人看的结果说明。
- generation：完成校验后的流程代际号。

（二）方法

LarkConfigCompleteResult是dataclass。LarkConfigCompleteResult没有自定义方法。

## 三、它和谁协作

（一）产生者

产生者有两个。complete_lark_config是第一个。complete_lark_config先校验代际号。再轮询注册端点。Lark租户的场景下还要换Lark账号端点重新轮询一次才能拿到完整凭证。再在凭证锁内替换应用凭证。最后组装结果。

set_lark_app_credentials是第二个。set_lark_app_credentials走直接切换应用的路径。先校验凭证。再推进代际号。再原子替换凭证。最后组装同一个结果类型。

（二）消费者

Gateway的路由层是消费者。路由把结果返回给前端设置页。

## 四、重要性评级

评级：4分。

理由：LarkConfigCompleteResult是配置流程的收口契约。两个不同的配置路径复用同一个结果类型。但它是纯粹的数据类。给4分。
