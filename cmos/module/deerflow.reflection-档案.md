# deerflow.reflection包档案

## 一、这个模块是干什么的

deerflow.reflection包是反射工具的包门面。

源文件是backend/packages/harness/deerflow/reflection/__init__.py。

文件极小。

它只有一条导入语句加一个__all__。

它的角色是双成员门面。

它把两个反射函数直接暴露出去。

它没有懒加载。

它没有docstring。

它导入的对象很轻。

## 二、模块里的主要成员

它从resolvers模块导入两个成员。

成员是resolve_class、resolve_variable。

resolve_class按字符串路径解析类。

resolve_variable按字符串路径解析变量。

两个成员在__all__里。

这个包的全部公共面就是这两个函数。

它们是配置驱动的类选择机制的底层工具。

skills/storage用resolve_class解析SkillsConfig.use指向的存储类。

其他需要按配置选择实现类的场景也用它。

## 三、它和谁协作

它向内依赖resolvers模块。

它向外被skills/storage消费。

技能存储的工厂用resolve_class按配置实例化存储类。

它还被其他配置驱动场景使用。

凡是配置里有类路径的地方都依赖它。

它本身不依赖任何业务模块。

它是底层工具包。

## 四、重要性评级

评级是5分。

理由如下。

它是配置驱动类选择的底层工具。

skills/storage等工厂依赖它。

没有它，配置里的类路径无法实例化。

扣分点在于它内容极小。

只有两个函数。

功能单一。
