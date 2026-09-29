# OpenVikingConfig-档案

## 一、这个类是干什么的

OpenVikingConfig是agents/memory/backends/openviking/config.py里的冻结数据类。

它是官方OpenViking内存adapter的验证配置。

凭证绑定的连接设置加现有DeerFlow策略。

trusted mode不再支持。

用USER API key和owner_user_id。

这个类位于backend/packages/harness/deerflow/agents/memory/backends/openviking/config.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、OpenVikingConfig字段

base_url默认http://127.0.0.1:1933。

storage_path是宿主注入的。

owner_user_id是凭证绑定的owner。

api_key从环境变量读。repr=False。不出现在日志。

api_key_env默认OPENVIKING_API_KEY。

default_peer_id默认deerflow。

timeout_seconds默认30。

search_top_k默认8。score_threshold可选。

max_injection_chars默认12000。

content_mode是auto、abstract、overview、read之一。

injection_query是注入检索query。

startup_policy是fail_fast或warn。

read_failure_policy是fail_open或raise。

write_failure_policy是log_and_drop或raise。

allow_insecure_http。

max_seen_message_ids默认512。

### 2、from_backend_config方法

trusted mode的auth_mode或account键拒绝。

自定义HTTP client字段已移除。出现时拒绝并列表。

retrieval和failure_policy是嵌套映射。

api_key_env必须非空。

从环境变量读api_key。

未知键拒绝。列出嵌套前缀名。

然后调_validate。

### 3、_validate方法

base_url必须是绝对http(s) URL。

纯HTTP只允许localhost、127.0.0.1、openviking主机。

其他主机需要allow_insecure_http为true。

owner_user_id不能为空。

api_key缺失时抛错并指名环境变量。

default_peer_id必须匹配安全peer模式。

不能用保留前缀df-agent-。

timeout必须有限正值。

search_top_k在1到100。

score_threshold有限且在0到1。

max_injection_chars在256到100000。

content_mode必须在枚举里。

injection_query不能为空。

startup_policy、read_failure_policy、write_failure_policy必须在枚举里。

max_seen_message_ids在16到10000。

### 4、辅助函数

is_safe_peer_id验证OpenViking actor peer的合法性。

_mapping收窄嵌套映射。

_number读数字旋钮。无值键当未设。

_optional_float处理score_threshold。

未设的阈值表示不应用。保持None。

不回退到默认。

_boolean接受true、1、yes、on及对应false。

其他抛错。

### 5、保留前缀

GENERATED_PEER_PREFIX是df-agent-。

生成peer用这个前缀。

default_peer_id不能用。

防止和生成peer碰撞。

## 三、它和谁协作

- OpenVikingMemoryManager在model_post_init解析它。
- 环境变量OPENVIKING_API_KEY保存密钥。
- session.py消费peer推导。

## 四、重要性评级

评级是5分。

理由如下。

这个类是OpenViking后端的配置边界。

trusted mode拒绝。自定义HTTP字段拒绝。

纯HTTP只允许localhost。

api_key从环境变量。repr=False。

peer id模式验证。保留前缀检查。

数值范围全部验证。

这些安全设计仔细。

扣掉5分。

扣分原因是它是单一后端的配置。
