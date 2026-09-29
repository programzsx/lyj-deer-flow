# LarkAuthCompleteResult档案

源码位置：backend/packages/harness/deerflow/integrations/lark_cli.py

## 一、这个类是干什么的

LarkAuthCompleteResult是Lark用户授权流程的完成结果。

用户在浏览器完成授权。后端调用`lark-cli auth login --device-code`等待授权落盘。等待结束后再探测一次授权状态。成功与否、最终状态、说明装进LarkAuthCompleteResult。

LarkAuthCompleteResult是不可变的。类声明用了frozen=True。

## 二、类的成员

（一）字段

- success：授权是否真正完成。判定条件是status.auth.status等于authenticated。
- status：完成后的LarkIntegrationStatus。这次status带着verify_auth=True的实时验证结果。
- message：给人看的结果说明。授权完成给完成提示。未完成给status.auth.message或pending提示。

（二）方法

LarkAuthCompleteResult是dataclass。LarkAuthCompleteResult没有自定义方法。

## 三、它和谁协作

（一）产生者

complete_lark_auth是唯一产生者。complete_lark_auth的流程有三步。第一步校验device_code非空。wait_timeout_seconds必须在5到45秒之间。第二步在凭证锁内校验代际号。代际号不匹配就抛LarkFlowSupersededError。再运行CLI命令等待授权。第三步用verify_auth=True重新获取状态。最后组装结果。

（二）消费者

Gateway的路由层是消费者。路由把结果返回给前端。

（三）对比

LarkAuthCompleteResult和LarkConfigCompleteResult不同。前者没有generation字段。因为授权流程不需要在完成后再次推进代际号。

## 四、重要性评级

评级：4分。

理由：LarkAuthCompleteResult是授权流程的收口契约。success的判定依赖实时验证而不是本地token存在。这让前端不会把未验证的授权当成成功。但它是纯粹的数据类。给4分。
