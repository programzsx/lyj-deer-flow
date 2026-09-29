# resolve_variable-档案

## 一、这个类是干什么的

resolve_variable不是类。

resolve_variable是reflection/resolvers.py里的模块级泛型函数。

它从路径解析变量。

路径形如parent_package.sub_package.module:variable_name。

它支持类型验证。

它也服务于模型类的解析。

这个模块位于backend/packages/harness/deerflow/reflection/resolvers.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、resolve_variable函数

流程如下。

第一步按rsplit(":")拆模块路径和变量名。

格式不对时抛ImportError并给示例。

第二步import_module导入模块。

ModuleNotFoundError时构建缺失依赖提示。

其他ImportError保留原始消息。

第三步getattr取变量。

AttributeError时抛ImportError说明模块没定义该属性。

第四步类型验证。

expected_type提供时用isinstance检查。

不通过时抛ValueError并给出实际类型。

### 2、resolve_class函数

resolve_class解析类路径和类名。

例如langchain_openai:ChatOpenAI。

先调resolve_variable验证是类型。

base_class提供时检查子类关系。

不是子类时抛ValueError。

### 3、缺失依赖提示

_build_missing_dependency_hint构建可操作提示。

提示形如用uv add或pip install安装。

然后重启DeerFlow。

MODULE_TO_PACKAGE_HINTS映射已知集成。

例如langchain_openai映射langchain-openai。

导入错误由传递依赖触发时也优先提供者包提示。

例如google触发的错误提示langchain-google-genai。

下划线替换成连字符作为兜底。

## 三、它和谁协作

- 配置系统的扩展点用它解析自定义类。
- 模型工厂用它解析LangChain模型类。
- resolve_class包装它。

## 四、重要性评级

评级是4分。

理由如下。

这个函数是动态类加载的咽喉点。

所有用户配置的扩展类经过它。

缺失依赖提示可操作。用户能自己修。

类型和子类验证防止配置出非法对象。

这些质量不错。

扣掉6分。

扣分原因是它是小工具函数。

逻辑简单。失败面小。
