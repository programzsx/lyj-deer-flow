# LarkConfigStartResult档案

源码位置：backend/packages/harness/deerflow/integrations/lark_cli.py

## 一、这个类是干什么的

LarkConfigStartResult是Lark应用配置流程的开始结果。

配置Lark应用要走浏览器流程。用户点"连接飞书"。后端向Lark的注册端点发起begin请求。请求拿到user_code和device_code。后端拼出验证URL。这些信息装进LarkConfigStartResult返回给前端。前端拿verification_url让用户去浏览器完成授权。

LarkConfigStartResult是不可变的。类声明用了frozen=True。

## 二、类的成员

（一）字段

- verification_url：用户在浏览器打开的验证URL。URL带着user_code和运行时CLI版本参数。
- device_code：设备码。完成配置时要传回complete_lark_config。
- generation：流程代际号。防止被更新的操作覆盖。
- expires_in：设备码有效期秒数。Lark端点没给时为None。
- interval：建议轮询间隔秒数。Lark端点没给时为None。
- user_code：用户在浏览器看到的短码。
- brand：品牌。默认feishu。

（二）方法

LarkConfigStartResult是dataclass。LarkConfigStartResult没有自定义方法。

## 三、它和谁协作

（一）产生者

start_lark_config是唯一产生者。start_lark_config先在凭证锁内推进流程代际号。再向Feishu账号端点发begin请求。再拼验证URL。

（二）消费者

Gateway的路由层是消费者。路由把结果返回给前端。前端展示验证URL。

complete_lark_config是间接消费者。complete_lark_config拿device_code和generation继续流程。generation不匹配就抛LarkFlowSupersededError。

## 四、重要性评级

评级：4分。

理由：LarkConfigStartResult是浏览器配置流程的第一步载体。没有它用户就没有可点的授权入口。但它是纯粹的数据类。给4分。
