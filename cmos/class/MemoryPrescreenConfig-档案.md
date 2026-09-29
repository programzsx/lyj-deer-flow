# MemoryPrescreenConfig档案

一、这个类是干什么的

MemoryPrescreenConfig是记忆预筛的配置类。预筛是抽取调用之上的成本门。这个类控制预筛要不要开。模式有三种。off表示不发请求也不改变行为。shadow表示只决策并记录。enforce表示跳过抽取调用。这个类继承自pydantic的BaseModel。

二、类的成员

（一）字段

- mode：字面量。取值是off、shadow或enforce。默认值是off。这个字段决定预筛的行为模式。
- use：字符串或None。默认值是None。这个字段是提供者类路径。例如deerflow.agents.memory.prescreen.typesafe:TypeSafeMemoryPrescreen。
- config：字典。默认值是空字典。这个字段是提供者私有的设置。以关键字参数传给提供者。

（二）方法

- _read_yaml_off：字段校验器。这个方法接受未加引号的YAML off。YAML 1.1把off解析成布尔False。这个校验器把False读回off字符串。

三、它和谁协作

MemoryConfig持有这个类。MemoryConfig的prescreen字段是这个类的实例。MemoryConfig的校验器确保mode不是off时use必须填写。enforce模式要求实测过的门。

四、重要性评级

评级：4分。

理由：预筛默认关闭。是成本优化的可选环节。但enforce模式会影响记忆抽取。所以重要性偏低到中等。
