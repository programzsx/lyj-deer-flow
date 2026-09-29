# ManagedModel档案

一、这个类是干什么的

ManagedModel是管理员托管的OpenAI兼容模型档案类。这些档案独立于YAML配置。档案存储在加密目录里。目录和本地密钥都在持久化运行时主目录下。这个类继承自pydantic的BaseModel。extra为forbid。字符串自动去空白。

二、类的成员

（一）字段

- name：字符串。必须匹配[A-Za-z0-9][A-Za-z0-9_.-]{0,99}。这个字段是模型的唯一名字。
- provider：字面量。取值是openai-compatible。默认值是openai-compatible。这个字段固定了提供者类型。
- display_name：字符串。默认值是空字符串。最长100。这个字段是显示名。
- model：字符串。长度1到200。这个字段是实际的模型名。
- base_url：字符串。最长2048。这个字段是API端点地址。
- api_key：SecretStr或None。默认值是None。这个字段是API密钥。用SecretStr防止意外打印。
- enabled：布尔值。默认值是True。这个字段表示档案是否启用。
- supports_vision：布尔值。默认值是False。这个字段表示是否支持视觉输入。
- context_window：整数或None。默认值是None。必须大于0。这个字段是上下文窗口大小。
- max_tokens：整数或None。默认值是None。必须大于0。这个字段是单次输出上限。
- revision：字符串或None。默认值是None。这个字段是乐观并发控制的修订号。

（二）方法

- valid_endpoint：字段校验器。这个方法校验base_url。必须是HTTP或HTTPS。不能带用户名密码。不能带query和fragment。端口不能为0。末尾斜杠被去掉。
- public：这个方法返回不含api_key的字典。加上has_api_key布尔值和source为managed。
- runtime_config：这个方法把档案转成ModelConfig。供运行时使用。api_key缺失时用not-required占位。提供者由base_url推导。

三、它和谁协作

ManagedModelStore持有这个类。ManagedModelStore的list和save方法构造和校验ManagedModel。merge_managed_models把启用的档案转成ModelConfig合并进AppConfig。ModelConfig是这个类转换的目标类型。

四、重要性评级

评级：7分。

理由：这个类承载生产环境的模型凭据。校验器阻止不安全的端点。SecretStr保护密钥不泄露。所以重要性中上。
