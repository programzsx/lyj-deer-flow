# _ClientSpec档案

源码位置：backend/packages/harness/deerflow/skills/skillscan/orchestrator.py

## 一、这个类是干什么的

_ClientSpec是一个Python HTTP客户端的规则声明。

SkillScan要发现HTTP外呼。实例客户端的构造和外呼是分开的。构造不做I/O。外呼是变量上的方法调用。单独看任何一条语句都不是call-name sink。信号只能跟最小高置信链走。_ClientSpec声明这条链需要的两部分。一部分是已知构造器。一部分是构造器支持的方法。

_ClientSpec是frozen dataclass。

## 二、类的成员

（一）字段

- methods：构造器支持的外呼方法集。frozenset。
- sync_context：是否要求同步上下文。默认False。
- async_context：是否要求异步上下文。默认False。

## 三、它和谁协作

（一）规则表

_PYTHON_CLIENT_SPECS是全部客户端声明。声明的客户端有这些。http.client.HTTPConnection和HTTPSConnection支持request、connect、send。requests.Session支持request、get、post等九个方法，sync_context为True。urllib3.PoolManager支持request、urlopen，sync_context为True。aiohttp.ClientSession支持八个方法，async_context为True。

（二）派生集合

_PYTHON_CLIENT_CONSTRUCTORS是全部构造器名。_PYTHON_CLIENT_SINK_METHODS是全部方法并集。这两个集合由_ClientSpec派生。

（三）排除项

只读操作不进methods。例如http.client的getresponse。这条信号只关心外呼I/O。

## 四、重要性评级

评级：4分。

理由：_ClientSpec是实例客户端外呼信号的声明单元。它把构造器和外呼方法钉在一起。声明式的表让规则可审查。派生集合由它计算。给4分。
