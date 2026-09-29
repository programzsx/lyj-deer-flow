# app.gateway.path_utils-档案

源码路径是backend/app/gateway/path_utils.py。

## 一、这个模块是干什么的

path_utils.py是线程虚拟路径的共享解析。

线程里的文件用虚拟路径表示。

虚拟路径形如mnt/user-data/outputs/。

虚拟路径要转成真实文件系统路径。

这个模块负责转换。

转换同时约束路径不能越界。

这个模块只有80行。

## 二、模块里的主要成员

### 1、resolve_thread_virtual_path

resolve_thread_virtual_path解析虚拟路径。

输出是真实文件系统路径。

路径落在线程的用户数据目录里。

user_id可以显式传入。

不传时从上下文取有效用户。

用户隔离保证用户访问不了别人的线程目录。

### 2、outputs约束

OUTPUTS_VIRTUAL_ROOT是outputs虚拟根。

_OUTPUTS_ONLY_DETAIL是越界错误详情。

有些操作只允许outputs目录。

越界访问返回明确错误。

posixpath做路径规范化。

规范化消除路径穿越风险。

## 三、它和谁协作

上游是uploads.py、artifacts.py、skills.py。

这些路由解析虚拟路径时用它。

下游是deerflow.config.paths的路径配置。

线程隔离目录由路径配置决定。

## 重要性评级

评级是6分。

理由如下。

虚拟路径解析是文件功能的公共底座。

上传、产物、技能安装都靠它。

路径约束防目录穿越。

用户隔离防跨用户访问。

但它是纯辅助模块。

没有HTTP端点。

体量小，逻辑清晰。

所以评级是6分。
