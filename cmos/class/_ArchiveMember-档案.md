# _ArchiveMember档案

来源文件：`backend/app/gateway/artifact_archive.py`

## 一、这个类是干什么的

这个类是归档模块的内部辅助类。

这个类代表一个待打包的工件文件。

这个类在一个冻结的dataclass对象里记录四样信息。

第一样是`path`，这是文件在宿主机上的真实绝对路径。

第二样是`entry`，这是文件在ZIP包内的显示路径。

第三样是`initial`，这是文件第一次`lstat`得到的元数据。

第四样是`components`，这是从根目录到该文件沿途每一级目录的元数据，每级记录路径加设备号加inode号。

记录这些信息的目的只有一个。

目的是在打包前后反复比对文件身份。

比对身份可以防止打包过程中的符号链接替换攻击。

攻击者如果在中途把一个文件换成符号链接，设备号和inode号就会对不上。

对不上就立刻拒绝打包。

## 二、类的成员

这个类是`@dataclass(frozen=True)`装饰的冻结数据类。

这个类有四个字段。

### 1、字段path

`path`字段的类型是`Path`。

`path`字段存放文件通过`resolve(strict=True)`解析出来的真实路径。

`path`字段是`os.open`打开文件时实际使用的路径。

### 2、字段entry

`entry`字段的类型是`str`。

`entry`字段存放文件在ZIP压缩包内的条目名。

`entry`字段由虚拟路径去掉`mnt/user-data/outputs/`前缀后拼接而成。

### 3、字段initial

`initial`字段的类型是`os.stat_result`。

`initial`字段存放文件在校验阶段的原始元数据。

`initial`字段里的设备号和inode号是后续身份比对的基准。

### 4、字段components

`components`字段的类型是`tuple[tuple[Path, int, int], ...]`。

`components`字段记录路径上每个组件的元数据。

`components`字段包含用户数据根目录和outputs目录这两级。

`components`字段还包含从outputs到该文件的每一级中间目录。

## 三、它和谁协作

这个类由模块内的`_member()`函数创建。

这个类被模块内的`_copy_member()`函数消费。

`_copy_member()`函数在复制文件前后都拿这个类记录的身份做比对。

这个类是模块私有的，外部代码不直接使用这个类。

这个类的顶层入口是同模块的`build_artifact_archive()`函数。

## 四、重要性评级

评级：4分。

理由：这个类是归档安全校验机制的核心数据载体。没有这个类，防符号链接替换的比对就没有落脚点。但这个类本身只是个被动数据结构，不含任何行为逻辑。这个类只服务一个模块。所以这个类是重要但局部的辅助角色。
