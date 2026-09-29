# SandboxInfo档案

## 一、这个类是干什么的

这个类是sandbox_info.py模块里的数据类。

这个类用@dataclass装饰。

这个类是唯一一个只有51行却贯穿全子包的元数据载体。

模块docstring说得很清楚。

这个类是沙箱元数据，用于跨进程发现和状态持久化。

这个类装的是重连一个已存在沙箱所需的全部信息。

重连场景有好几种。

Gateway进程和langgraph进程之间。

多个worker之间。

跨K8s Pod之间（配合共享存储）。

这个类解决的问题很明确。

沙箱是跨进程共享的资源。

进程A启动的沙箱需要被进程B发现并重连。

重连需要哪些信息。

沙箱ID、沙箱URL、容器名、容器ID、创建时间。

这些信息就是全部字段。

这个类在什么场景被使用。

场景是backend的create、discover、list_running返回值。

provider的所有生命周期编排都以它为数据交换格式。

## 二、类的成员

这个类有七个字段。

sandbox_id是沙箱的确定性ID。

sandbox_id是字符串。

sandbox_id由user_id和thread_id派生。

sandbox_url是沙箱API的访问地址。

例如http://localhost:8080或http://k3s:30001。

container_name是容器名。

container_name只有本地容器backend才有。

container_name为None表示远程模式。

container_id是容器ID。

container_id同样只有本地backend才有。

created_at是创建时间戳。

created_at默认用time.time()自动填。

request_headers是临时控制面凭证。

request_headers从本地Docker发现中重建。

request_headers故意排除在to_dict()和repr之外。

排除是为了凭证不通过元数据持久化或生命周期日志泄漏。

requires_replacement是发现专用的生命周期信号。

requires_replacement为True表示沙箱的持久化供给策略与本进程不兼容。

backend可以报告它，但绝不能在枚举时销毁它。

provider消费这个标志。

provider在取得本地销毁保留和跨实例销毁租约后才执行替换。

to_dict方法把五个持久化字段转成字典。

凭证和替换标志故意不进字典。

from_dict是类方法。

from_dict从字典恢复实例。

from_dict兼容旧的base_url键。

from_dict兼容缺失的created_at。

## 三、它和谁协作

它被backend.py的SandboxBackend全部接口方法使用。

create返回它。

discover返回它。

list_running返回列表。

is_alive和destroy接收它。

LocalContainerBackend、RemoteSandboxBackend都产出它。

AioSandboxProvider的_all_生命周期方法传递它。

provider的暖池字典装的就是SandboxInfo加时间戳的元组。

AioSandbox从它的sandbox_url和request_headers构造HTTP客户端。

它和_ContainerInspection有转换关系。

backend内部检查结果最终汇总成SandboxInfo暴露给provider。

它是全子包唯一跨backend和provider两层的元数据契约。

## 四、重要性评级（1-10分+理由）

评级是8分。

理由如下。

这个类是整个AIO沙包子包的数据交换契约。

backend和provider两层之间只有它一个通用载体。

没有它。

每对方法之间都要定义自己的参数元组。

跨进程持久化没有标准格式。

凭证防泄漏的设计也无处安放。

它被backend.py、local_backend.py、remote_backend.py、aio_sandbox_provider.py全部引用。

依赖点超过二十个。

它是纯数据类，没有行为风险。

删掉它等于重写整个子包的接口层。

代码量最小，地位却最高之一。

评级给8分。
