# deerflow.guardrails包档案

## 一、这个模块是干什么的

deerflow.guardrails包是工具调用前授权中间件的包门面。

源文件是backend/packages/harness/deerflow/guardrails/__init__.py。

它的角色是立即导入式门面。

它把护栏子系统的全部公共API一次性导入并暴露。

它没有懒加载。

docstring一句话说明定位。

定位是工具调用前的授权中间件。

护栏在工具真正执行之前判断这次调用是否放行。

## 二、模块里的主要成员

它从四个模块导入成员。

builtin模块提供AllowlistProvider。

AllowlistProvider是允许清单提供者。

这是内置的简单护栏实现。

middleware模块提供GuardrailMiddleware。

GuardrailMiddleware是接入代理图的中间件。

provider模块提供GuardrailDecision、GuardrailProvider、GuardrailReason、GuardrailRequest。

GuardrailProvider是护栏提供者契约。

GuardrailRequest是护栏请求。

GuardrailDecision是护栏裁决。

GuardrailReason是裁决理由。

typesafe模块提供TypeSafeGuardrailError、TypeSafeGuardrailProvider。

TypeSafeProvider是接入TypeSafe远程判定服务的护栏实现。

全部八个成员在__all__里。

## 三、它和谁协作

它向内聚合builtin、middleware、provider、typesafe四个模块。

它向外被代理组装逻辑消费。

组装逻辑把GuardrailMiddleware放进主图。

它与deerflow.authz协作。

authz的GuardrailAuthorizationAdapter把授权裁决转成这里的形状。

它与deerflow.typesafe协作。

typesafe包提供共享传输层。

guardrails/typesafe.py是传输层上的一个适配器。

类型安全判定是fail-closed的。

判定出错时按拒绝处理。

## 四、重要性评级

评级是6分。

理由如下。

它是工具执行前安全闸门的正式契约入口。

GuardrailProvider契约和GuardrailMiddleware是护栏机制的核心。

它同时暴露内置实现和TypeSafe实现。

两种实现共享同一契约。

扣分点在于它完全不做懒加载。

导入它要连带四个模块。

对这种小而稳定的子系统，代价可以接受。
