# HumanInputTextResponse档案

## 一、这个类是干什么的

HumanInputTextResponse是文本形式的人工输入响应的结构化载体。

DeerFlow的智能体可以暂停运行向用户提问。
用户回答后。
回答以结构化负载的形式附在消息元数据里回到智能体。
HumanInputTextResponse就是文本回答的数据形状。

这个类所在的human_input.py文件。
模块docstring说明。
这是结构化人工输入消息元数据的辅助模块。

这个类解决的问题很明确。

用户的回答不能是一段没有形状的文本。
回答需要带上下文。

第一。
回答要能关联到当初的提问。
request_id字段记录是哪个提问的回应。

第二。
回答要能区分形式。
response_kind字段记录这是文本回答还是选项回答。

第三。
回答要带版本。
version字段固定为1。
这是负载格式演进的锚点。
未来格式变化时旧负载仍能被识别。

第四。
回答要带来源。
source字段记录回答来自哪里。

这个类在什么场景被使用。

用户以自由文本形式回答智能体的提问时。
回答被包装成这个结构。
存进消息的additional_kwargs元数据。
读取方通过read_human_input_response函数从元数据里解析出这个结构。

## 二、类的成员（字段、方法，各自做什么）

### （一）字段

- version：负载格式版本。类型是Literal[1]。
固定为1。
这个字段是格式演进的锚点。
读取方校验version等于1才承认负载。

- kind：负载种类。类型是Literal["human_input_response"]。
固定为字符串"human_input_response"。
读取方校验这个字段确认负载类型。

- source：回答来源。类型是str。
记录回答来自哪个环节。
读取方要求这个字段是非空字符串。

- request_id：提问的请求id。类型是str。
关联到当初的提问。
没有这个字段。
回答无法对应到问题。
读取方要求非空。

- response_kind：回答形式。类型是Literal["text"]。
固定为"text"。
区别于选项回答的"option"。

- value：回答的文本内容。类型是str。
用户输入的原文。
读取方要求非空。

### （二）方法

这个类没有任何方法。
它是纯数据结构。

### （三）配套的读取函数

read_human_input_response函数负责从元数据里解析出这个结构。

解析规则如下。

- 元数据为空或没有human_input_response键就返回None。
- 负载不是映射就返回None。
- version不是1或kind不是human_input_response就返回None。
- source、request_id、value任一不是非空字符串就返回None。
- response_kind是text就构造HumanInputTextResponse。
- response_kind是option就读取option_id并构造HumanInputOptionResponse。
- 其他情况返回None。

模块常量HUMAN_INPUT_RESPONSE_KEY定义了元数据键名。
值是"human_input_response"。

## 三、它和谁协作

### （一）HumanInputOptionResponse

- 这是同文件里的姊妹类。
两者结构几乎相同。
区别是选项回答多一个option_id字段。
response_kind是"option"。
两者联合构成HumanInputResponse类型。
定义是HumanInputResponse = HumanInputTextResponse | HumanInputOptionResponse。

### （二）read_human_input_response函数

- 这个函数是这个类的主要构造入口。
负载经过函数的严格校验后。
才会以这个结构的形态返回。
校验不过就返回None。

### （三）协作的机制

- 消息元数据。回答附在消息的additional_kwargs里。
- 提问工具ask_clarification。发起提问并等待回答。
- 澄清中断机制。回答到达后运行恢复。
- 交互策略体系。RunInteractionMode决定是否允许提问。

### （四）数据流向

- 提问方向。智能体调用ask_clarification。运行暂停等待回答。
- 回答方向。用户文本回答被包装成这个结构。存进消息元数据。
- 读取方向。运行恢复后读取方从元数据解析出这个结构。
- 校验方向。version、kind、非空字段全部通过才被承认。

## 四、重要性评级（1-10分+理由）

评级是4分。

理由如下。

HumanInputTextResponse承载的是用户文本回答的结构化形态。
人机交互的正确性依赖回答能准确关联到提问。
request_id机制保证了这个关联。

version和kind的双锚点设计有实际价值。
负载经过严格校验才被承认。
伪造或不完整的负载被拒绝。
这避免了智能体把垃圾元数据当成用户回答。

但是要看到范围。
这个类只在交互式提问场景被使用。
非交互运行完全没有这个环节。
结构本身是六字段的纯数据结构。

如果删掉这个类。
文本回答就没有类型定义。
读取方只能解析松散字典。
校验逻辑失去结构锚点。
回答关联和格式演进的保证退化。

依赖它的地方包括HumanInputResponse联合类型、read_human_input_response函数、提问恢复链路。
范围集中。

综合来看。
这是交互回答链路里的辅助结构。
有用但体量小。
评级给4分。
