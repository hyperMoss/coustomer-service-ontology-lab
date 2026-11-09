# Customer Service Ontology Lab · 客服本体与 Agent 架构实验室

[![CI](https://github.com/hyperMoss/customer-service-ontology-lab/actions/workflows/test.yml/badge.svg)](https://github.com/hyperMoss/customer-service-ontology-lab/actions/workflows/test.yml)

> 对照 [`hyperMoss/anker-OntoCare`](https://github.com/hyperMoss/anker-OntoCare) 和 [`hyperMoss/anker-haike`](https://github.com/hyperMoss/anker-haike) 的**独立教学项目**。包含互动课件、源码阅读路线以及可以运行和测试的最小业务内核。**非官方 Anker 产品，非生产客服系统，不执行任何真实退款/换货。**

## 学习什么？

- **Service Ontology**：业务对象、产品身份、知识与订单的关联；为什么不能只依赖向量相似度。
- **Decision Ontology**：通过显式规则确定候选动作；未知事实不等于否定事实。
- **Fact Ledger**：保留客户原话、事实极性、来源以及更正历史。
- **LangGraph**：状态机如何组织一轮消息，以及如何保存跨轮待答状态。
- **Authorization Gate**：办理资格、资料、安全、幂等、独立审查五项检查。
- **Idempotency**：重复提交和接口超时时如何避免盲目创建第二次服务单。

## 在线课程 / 页面导航

使用 GitHub Pages 可将此仓库发布为纯静态教学站点（见下文）。本地也可以直接打开 `index.html`，或使用 `npm run serve`。

| 顺序 | 课程 | 互动内容 |
|---|---|---|
| 01 | [从 S1 Pro 认识本体论](lessons/0001-ontology-through-s1-pro.html) | 概念与实体识别测验 |
| 02 | [OntoCare 的服务本体与决策本体](lessons/0002-ontocare-dual-ontology.html) | `allowed_actions()` 状态模拟 |
| 03 | [haike 的事实账本、状态机与执行闸门](lessons/0003-haike-fact-to-action.html) | 五项授权规则实验 |

速查表：[本体概念](reference/ontology-cheatsheet.html) · [双本体规则](reference/dual-ontology-decision-table.html) · [安全执行](reference/haike-execution-cheatsheet.html)

## 运行最小源码实验

需要 Node.js 20 或更高版本，**不需要安装任何第三方依赖**。

```bash
npm test
npm run demo
npm run serve
```

访问 `http://127.0.0.1:4173/` 阅读三课。

可运行的教学源码在：

```text
src/ontology.mjs     # Product → Knowledge 关系；产品身份消歧；候选动作
src/facts.mjs        # 有原话支持的 Fact Ledger 与事实更正
src/actions.mjs      # 五项检查 + 进程内教学版幂等执行器
src/demo.mjs         # 一个不涉及外部系统的完整演示

test/core.test.mjs   # 安全边界与行为测试
```

核心示例：

```js
import { resolveProduct, retrieveKnowledge } from './src/ontology.mjs';

const product = resolveProduct('我的 S1 Pro 扫地机滚刷不工作');
console.log(product.state); // PROBABLE（仍应核实产品身份）
console.log(retrieveKnowledge(product.product.id, '滚刷'));
```

**教学逻辑与原仓库的完整生产逻辑不是同一件事。** 本仓库的代码是为理解职责边界而重新编写的简化实现；没有真实 CRM、用户认证、订单、持久化、模型、退款履约或正式保修判定。

## 建议的产品化演进

- `NestJS`：渠道、会话、工单、订单及授权 API，负责数据库写入与审计。
- `Hono + Mastra`：Agent 理解和流程编排，输出结构化请求，不直接写业务数据库。
- `PostgreSQL`：`Product/Order/Issue/Fact/ActionExecution` 的持久化与约束。
- `Evidence/RAG`：按产品范围和知识版本检索，引用可追踪。
- `Action Gateway`：幂等键、策略审查、人工批准及外部接口对账。

详细边界见 [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)。**先把实体模型和业务不变量做对，再选择是否引入图数据库与更多 Agent。**

## 发布到 GitHub Pages

推送仓库后，打开 **Settings → Pages → Build and deployment → Source: GitHub Actions**。项目内已经提供 `.github/workflows/pages.yml`；首次启用 Pages 后即可从 Actions 发布。私有仓库的 Pages 可用性受账号计划与仓库设置影响。

## 来源和许可

- 教学方法：[Matt Pocock / teach Skill](https://github.com/mattpocock/skills/blob/main/skills/productivity/teach/SKILL.md)
- 被研究项目：[OntoCare](https://github.com/hyperMoss/anker-OntoCare) · [haike](https://github.com/hyperMoss/anker-haike)
- 标准概念：[W3C OWL 2 Primer](https://www.w3.org/TR/owl2-primer/)

本仓库的**独立示例代码与原创教学材料**采用 [MIT License](LICENSE)。此许可**不授予**对上述第三方项目源码、商标及数据的任何额外权利；如果将来直接迁移原仓库代码，应先确认相应原仓库及其上游许可。
