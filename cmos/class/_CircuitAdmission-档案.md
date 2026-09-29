# _CircuitAdmission档案

来源文件：`backend/packages/harness/deerflow/agents/middlewares/llm_error_handling_middleware.py`

## 一、这个类是干什么的

_CircuitAdmission是一次熔断器准入的凭据。

LLMErrorHandlingMiddleware内部有一个熔断器。
熔断器有代数（generation）的概念。

请求通过熔断器的时候，会领到一条_CircuitAdmission。
凭据里记录了领凭据时的代数。

之后判断这次请求是否还拥有当前熔断代的时候，就比对凭据里的代数。
代数变了说明熔断器在请求执行期间发生了翻转。
旧的请求就不能去释放半开探针。
这样能防止一个旧调用误放另一个调用的探针。

## 二、类的成员

### （一）字段

- `generation`：领凭据时的熔断代数，默认-1。

### （二）方法

_CircuitAdmission没有定义自己的方法。
它是一个纯数据凭据。

## 三、它和谁协作

- LLMErrorHandlingMiddleware的`_check_circuit`发放它。
- LLMErrorHandlingMiddleware的`_owns_current_circuit_generation`校验它。
- LLMErrorHandlingMiddleware的`_release_half_open_probe`用它防止误释放。

## 四、重要性评级

评级：2/10。

理由：_CircuitAdmission只有一个整数字段。它是熔断器正确性的一个小零件。逻辑都在中间件里。所以分数很低。