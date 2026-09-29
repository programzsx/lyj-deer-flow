# deerflow.agents.memory.backends.openviking.config-档案

## 一、这个模块是干什么的

这个文件是OpenViking后端的配置模块。

这个文件为官方OpenViking记忆适配器提供经过校验的配置。

这个文件解析backend_config字典。

这个文件做了三类关键的事。

第一类是拒绝已经移除的旧配置。

第二类是解析嵌套的retrieval和failure_policy配置块。

第三类是校验每一项配置的合法性。

OpenViking用一个USERAPI密钥工作。

一个API密钥绑定一个配置的DeerFlow所有者。

所有者是owner_user_id指定的用户。

这个绑定关系是这个后端安全模型的核心。

## 二、模块里的主要成员

### 1、常量

_SAFE_PEER_RE是peer名字的正则。

peer名必须以小写字母或数字开头。

后面是最多63个小写字母、数字、下划线或横线。

总共最多64字符。

GENERATED_PEER_PREFIX是保留前缀。

保留前缀是df-agent-。

自动生成的peer用这个前缀。

用户的default_peer_id不能用这个前缀。

原因是保留前缀的peer和用户配置的peer不能互相伪装。

_REMOVED_CUSTOM_HTTP_FIELDS是已移除的自定义HTTP字段集合。

集合包含connect_timeout_seconds、max_connections、max_retries等七个字段。

原因是后端改用了官方适配器包。

传输层细节归官方包管。

配置里出现这些字段时直接报错。

### 2、OpenVikingConfig类

OpenVikingConfig是frozen加slots的dataclass。

frozen指构造后不能修改。

OpenVikingConfig保存凭据绑定的连接设置和既有策略。

主要配置项包括base_url、storage_path、owner_user_id、api_key、api_key_env、default_peer_id、timeout_seconds、search_top_k、score_threshold、max_injection_chars、content_mode、injection_query、startup_policy、read_failure_policy、write_failure_policy、allow_insecure_http、max_seen_message_ids。

api_key用field(repr=False)声明。

repr=False指密钥不会出现在repr输出里。

这防止密钥泄漏到日志。

api_key从环境变量读取。

环境变量名由api_key_env指定，默认OPENVIKING_API_KEY。

#### （1）from_backend_config方法

from_backend_config从backend_config字典构造配置。

from_backend_config先做两个拒绝检查。

第一个检查是trusted模式。

配置里出现auth_mode或account时报错。

原因是OpenViking的可信模式已经不再被这个后端支持。

现在要用USERAPI密钥加owner_user_id。

第二个检查是已移除字段。

配置里出现已移除的自定义HTTP字段时报错。

然后from_backend_config解析嵌套块。

retrieval块管检索配置。

failure_policy块管失败策略。

api_key_env为空时报错。

最后from_backend_config做未知键检查。

主层和两个嵌套块的未知键都被拒绝。

报错信息带retrieval.或failure_policy.前缀。

#### （2）_validate方法

_validate逐项校验配置。

base_url必须是绝对的http或https地址。

明文HTTP只在三种主机名下允许。

三种主机名是127.0.0.1、localhost、openviking。

其它主机的明文HTTP被拒绝。

除非显式设置allow_insecure_http为true。

这个开关只用于可信的内部网络。

owner_user_id不能为空。

API密钥不能为空。

密钥缺失时报错并点名环境变量。

default_peer_id必须通过safe peer正则。

default_peer_id不能用保留前缀df-agent-。

timeout_seconds必须是有限值且大于0。

search_top_k必须在1到100之间。

score_threshold可以是None。

score_threshold有值时必须是0到1之间的有限值。

max_injection_chars必须在256到100000之间。

content_mode必须是auto、abstract、overview、read之一。

injection_query不能为空。

startup_policy必须是fail_fast或warn。

read_failure_policy必须是fail_open或raise。

write_failure_policy必须是log_and_drop或raise。

max_seen_message_ids必须在16到10000之间。

### 3、is_safe_peer_id函数

is_safe_peer_id判断一个值是否合法。

合法性指可以用作OpenViking的actorpeer。

判断用_SAFE_PEER_RE全匹配。

### 4、三个解析helper函数

_mapping把值收窄成映射。

_mapping遇到非映射类型时报ValueError。

_number读数字配置项。

无值的键保留默认值。

无法转换的值报ValueError并点名键名。

_optional_float读可选的数字项。

这一项里None是有意义的值。

未设置的分数阈值表示不设阈值。

所以None保持为None，不落回默认值。

_boolean解析布尔项。

字符串形式接受true、1、yes、on和false、0、no、off。

其它值报ValueError。

原因是环境变量替换和YAML引号会让false以字符串形式到达。

## 三、它和谁协作

它被同目录openviking_manager.py调用。

OpenVikingMemoryManager在model_post_init里调用from_backend_config。

它被同目录session.py消费。

session.py使用GENERATED_PEER_PREFIX和is_safe_peer_id。

它通过manager.py注入的backend_config字典拿到全部配置。

它从环境变量读取API密钥。

## 四、重要性评级

评级是7分。

理由是这个文件守住了OpenViking后端的安全边界。

一个密钥绑定一个所有者的约束在这里校验。

密钥不进日志的repr=False在这里。

保留前缀防伪装在这里。

旧配置的拒绝检查也在这里。

不评更高分的原因是它是纯解析和校验代码。

它不承担记忆业务逻辑。
