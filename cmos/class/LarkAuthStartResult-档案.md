# LarkAuthStartResult档案

源码位置：backend/packages/harness/deerflow/integrations/lark_cli.py

## 一、这个类是干什么的

LarkAuthStartResult是Lark用户授权流程的开始结果。

用户授权和应用配置是两个流程。应用配置绑定appId和appSecret。用户授权让具体用户登录。授权流程调用`lark-cli auth login --no-wait --json`。命令返回verification_url和device_code。这些信息装进LarkAuthStartResult。

LarkAuthStartResult的docstring说明了URL的安全性。返回的URL可以安全地展示在浏览器UI或聊天消息里。

LarkAuthStartResult是不可变的。类声明用了frozen=True。

## 二、类的成员

（一）字段

- verification_url：用户完成授权的URL。可以展示在浏览器UI或聊天消息里。
- device_code：设备码。要传回complete_lark_auth。
- generation：流程代际号。
- expires_in：设备码有效期秒数。CLI没给时为None。
- user_code：用户在授权页看到的短码。CLI没给时为None。
- hint：CLI返回的提示语。CLI没给时为None。

（二）方法

LarkAuthStartResult是dataclass。LarkAuthStartResult没有自定义方法。

## 三、它和谁协作

（一）产生者

start_lark_auth是唯一产生者。start_lark_auth先要求lark-cli路径存在。再拼`auth login --no-wait --json`命令。recommend、scope、domains参数会转成命令行参数。再在凭证锁内处理代际号。generation为None时推进新代际号。generation非None时校验已有代际号。再实际运行CLI命令。

（二）消费者

Gateway的路由层是消费者。路由把结果返回给前端或聊天消息。

complete_lark_auth是间接消费者。complete_lark_auth拿device_code和generation继续流程。

（三）对比

LarkAuthStartResult和LarkConfigStartResult字段很接近。区别是前者多了hint字段，后者多了brand和interval字段。前者走CLI命令。后者直接调Lark的HTTP端点。

## 四、重要性评级

评级：4分。

理由：LarkAuthStartResult是用户授权流程的入口载体。前端和聊天消息的授权链接靠它传递。但它是纯粹的数据类。给4分。
