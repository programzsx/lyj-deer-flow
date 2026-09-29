# deerflow.authz.principal-档案

## 一、这个模块是干什么的

这个文件是Principal的构建器。

它是构建Principal的唯一受认可的方式。

第一层工具装配和第二层的护栏授权adapter都必须用这个构建器。

用同一个构建器身份语义才保持一致。

它是纯函数。不读全局配置。不缓存。不修改输入。

## 二、模块里的主要成员

### 1、normalize_authz_attributes函数

这个函数校验并复制authz_attributes到新字典。

这是共享的归一化点。Principal构建器和全部传播位置都用它。传播位置包括middleware、executor、task_tool。

归一化规则是这样的。

None返回空字典。

Mapping返回浅拷贝。

其他类型抛TypeError。不静默强转。

每个进程内的消费边界都会为非Mapping的值抛TypeError。

### 2、build_principal_from_context函数

这个函数从运行时上下文映射构建Principal。

输入是上下文映射。可以是config的context。也可以是从GuardrailRequest组装的字典。

default_role是默认角色。user_role是None或空字符串时用它。

处理规则是这样的。

user_role缺失或为空时用default_role。

存在但非空的角色不会被替换。只替换缺失的。

其他字段直接从上下文取。user_id、oauth_provider、oauth_id、channel_user_id。

is_internal只有显式为True才是True。

attributes走normalize_authz_attributes。

## 三、它和谁协作

它依赖authz.provider里的Principal。

它被authz.adapter调用。adapter每次请求重建Principal。

它被authz.tool_filter调用。

它被authz.sandbox_authz调用。

它是身份语义的单一收敛点。

## 四、重要性评级

评级是6分。

理由是这个文件是授权身份的单一构建点。

两层执行共用一个构建器。default_role和attributes的语义不会分叉。

归一化点统一保证了非Mapping的输入一定报错而不是静默通过。

不评更高分是因为它是纯函数。逻辑量小。没有决策逻辑。
