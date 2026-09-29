# validate_public_http_url-档案

## 一、这个类是干什么的

validate_public_http_url不是类。

validate_public_http_url是community/url_safety.py里的模块级函数。

url_safety.py是server端web工具的共享URL安全检查。

这个函数在server端web工具fetch之前验证http(s) URL。

URL应被拒绝时返回Error字符串。

调用方可以继续时返回None。

检查对自托管fetch和render服务刻意保守。

那些服务跑在部署网络里。

否则能到达云metadata或私有主机。

这叫SSRF防护。

这个模块位于backend/packages/harness/deerflow/community/url_safety.py。

## 二、类的成员（字段、方法，各自做什么）

### 1、validate_public_http_url函数

流程如下。

第一步解析URL。

scheme必须是http或https。netloc必须存在。

第二步allow_private_addresses为True时直接放行。

第三步hostname规整。

去尾部点。转小写。

在阻止名单里时拒绝。

阻止名单是localhost和metadata.google.internal。

第四步字面量IP判断。

host是IP字面量时直接用它。

否则DNS解析出所有地址。

解析失败的host拒绝。fail closed。

第五步检查所有候选地址。

任一是阻止地址就拒绝。

### 2、is_blocked_address函数

它判断web工具默认不应到达的地址。

私有、回环、链路本地、保留、多播、未指定都阻止。

### 3、resolve_host_addresses函数

它把hostname解析成所有IP地址供SSRF筛查。

getaddrinfo解析。

gaierror和UnicodeError时返回空列表。

解析失败会被上层fail closed拒绝。

### 4、SSRF威胁模型

自托管fetch服务在部署网络里。

攻击者可以让服务fetch云metadata地址。

例如169.254.169.254。

或私有主机。

is_blocked_address阻止所有私有段。

包括IPv6的ula和link-local。

metadata.google.internal在阻止名单。

### 5、search_time_range.py

search_time_range.py是支持的内置web搜索提供者的共享相对时间范围契约。

SearchTimeRange是day、week、month、year。

DDGS_TIMELIMIT_BY_TIME_RANGE映射ddgs参数。

day映射d等。

BRAVE_FRESHNESS_BY_TIME_RANGE映射brave的freshness参数。

day映射pd等。

## 三、它和谁协作

- community的web工具提供者调用它。例如firecrawl、crawl4ai、jina_ai。
- resolver参数可注入。测试用。
- socket和ipaddress做解析和判断。

## 四、重要性评级

评级是7分。

理由如下。

这个模块是server端web工具的SSRF守门员。

DNS解析出所有地址再检查。不是只查字面量。

解析失败fail closed。

阻止私有、回环、链路本地、保留、多播。

云metadata地址被阻止。

allow_private_addresses是显式opt-in。

这些是SSRF防护的关键。

被多个web工具提供者共享。

扣掉3分。

扣分原因是它是纯检查函数。防御还有沙箱层兜底。
