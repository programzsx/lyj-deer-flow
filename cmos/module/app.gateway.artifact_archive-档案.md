# app.gateway.artifact_archive-档案

源码路径是backend/app/gateway/artifact_archive.py。

## 一、这个模块是干什么的

artifact_archive.py负责产物归档ZIP。

thread_runs的artifacts/archive端点调用它。

归档把一次运行产生的文件打成ZIP。

下载归档让用户一次拿走全部产物。

这个模块有270行。

## 二、模块里的主要成员

### 1、build_artifact_archive

build_artifact_archive是入口函数。

输入是一组文件。

输出是ZIP字节流。

### 2、失败封闭

失败封闭是fail closed。

ArchiveMember检查每个文件。

链接样式的路径被拒绝。

拒绝防止符号链接逃逸。

大小超限返回_too_large。

_deadline检查截止时间。

归档有总截止时间，防止无限构建。

### 3、成员复制

_copy_member复制一个文件进ZIP。

复制时计算SHA-256。

_hash_descriptor用文件描述符算哈希。

复制有硬上限。

### 4、路径规范

虚拟路径前缀是mnt/user-data/outputs/。

临时编辑前缀是.artifact-edit-。

目录名常量来自deerflow.constants。

## 三、它和谁协作

上游是thread_runs的归档端点。

下游是线程文件系统和产物输出目录。

依赖deerflow.constants的目录常量。

## 重要性评级

评级是5分。

理由如下。

产物归档方便用户批量下载。

失败封闭和链接拒绝是安全关键点。

截止时间和大小上限防资源耗尽。

但归档是辅助功能。

不归档，用户仍能逐个下载产物。

核心运行路径不依赖它。

所以评级是5分。
