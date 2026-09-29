# MemorySignalClassificationConfig档案

一、这个类是干什么的

MemorySignalClassificationConfig是记忆信号分类的配置类。信号分类给抽取过程添加提示标签。这个类还带一个窄范围的否决权。否决权只能否决预筛的跳过决定。这个类不能单独决定抽取。也不能驱动删除。这个类继承自pydantic的BaseModel。

二、类的成员

（一）字段

- mode：字面量。取值是off、shadow或hints。默认值是off。off表示不发请求。shadow表示只记录。hints表示把标签合并进提示文本。
- use：字符串或None。默认值是None。这个字段是提供者类路径。例如deerflow.agents.memory.signals.typesafe:TypeSafeSignalClassifier。
- combine：字面量。取值是auto、always或never。默认值是auto。这个字段控制与预筛的请求合并方式。auto表示客户端设置都匹配时共享。always表示必须匹配。never表示每个侧单独发请求。
- config：字典。默认值是空字典。这个字段是提供者私有的设置。

（二）方法

- _read_yaml_off：字段校验器。这个方法接受未加引号的YAML off。YAML 1.1把off解析成布尔False。

三、它和谁协作

MemoryConfig持有这个类。MemoryConfig的signal_classification字段是这个类的实例。信号分类协调器读取这个实例。预筛的enforce模式可以接受这个类的否决。

四、重要性评级

评级：4分。

理由：信号分类默认关闭。只做提示合并和窄否决。不驱动核心决策。所以重要性偏低。
