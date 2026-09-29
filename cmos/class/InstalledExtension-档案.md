# InstalledExtension档案

源码位置：backend/packages/harness/deerflow/extensions/manager.py

## 一、这个类是干什么的

InstalledExtension是一次安装的结果。

ExtensionManager的install方法装好一个扩展。安装完成后返回InstalledExtension。InstalledExtension描述这个被变成可导入、已激活的扩展。

InstalledExtension是不可变的。类声明用了frozen=True。

## 二、类的成员

（一）字段

- name：入口点名字。
- distribution：Python分发名。
- use：入口点目标。格式是module.path:install。

（二）方法

InstalledExtension是dataclass。InstalledExtension没有自定义方法。

## 三、它和谁协作

（一）产生者

ExtensionManager的_install方法产生InstalledExtension。安装成功后返回。

（二）消费者

extensions/cli.py的安装命令消费这个结果。CLI向运维展示安装结果。

## 四、重要性评级

评级：2分。

理由：InstalledExtension只是一个三字段的结果数据类。安装的逻辑全在ExtensionManager里。但它是安装操作的正式返回值。给2分。
