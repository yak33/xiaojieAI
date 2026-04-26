# xiaojieAI

[English](README.md) | [简体中文](README.zh-CN.md) | [日本語](README.ja.md)

xiaojieAI 是面向集团内部业务系统（关务、ERP、OA 等）的 **AI 智能底座 / 中台**。它不替代业务系统本身，而是以嵌入式助手与统一编排层的形式，把自然语言、知识检索、未来的工具调用与权限风控集中到一个可被任何宿主系统集成的服务里。

## 项目定位

- **不是**某个业务系统的"聊天插件"
- **是**集团级 AI 能力中台的服务端骨架与配套助手组件
- 业务事实仍由原系统负责；xiaojieAI 负责对话、知识、能力编排与审计

## 当前能力

- POST + DTO 化的同步对话接口，预留 `conversationId / tenantId / userId / systemCode` 协议字段
- SSE 命名事件流式响应（`meta` / `delta` / `done` / `error`）
- 双 ChatClient 装配（plain / RAG）+ 可插拔 `RagRoutingPolicy` 路由策略
- 关务领域关键词集合 + 业务编号正则的默认路由判定（含 14 用例 table-driven 单测）
- 知识文档单篇 / 批量入库（`/ai/knowledge` / `/ai/knowledge/batch`）
- Mission Control 风格的嵌入式助手组件：side / floating / fullscreen 三态，亮 / 暗双主题
- 集成演示页：可切换关务 / ERP / OA 三种宿主品牌，验证零侵入嵌入
- 知识库管理后台：单篇与批量入库、本地视图与拖拽 .md / .txt

## 技术栈

- Java 21
- Spring Boot 3.5.x
- Spring AI 1.1.x
- Spring AI Alibaba DashScope（chat & embedding）
- Qdrant Vector Store
- 前端：原生 HTML / CSS / JS（暂不引入 Vue / React）

## 项目结构

```text
src/main/java/io/github/yak33/xiaojieai/
├── XiaojieAiApplication.java
├── config/
│   └── AiClientConfiguration.java          # plain / rag 两路 ChatClient 装配
├── controller/
│   └── AiAssistantController.java          # REST 端点
├── dto/
│   ├── ChatCommand.java                    # 请求 record（含协议预留字段）
│   └── ChatReply.java                      # 同步响应 record
├── routing/
│   ├── RagRoutingPolicy.java               # 路由策略接口
│   └── KeywordBasedRagRoutingPolicy.java   # 默认实现：关键词 + 业务编号
└── service/
    └── AiAssistantService.java             # 仅承担编排、调用与审计

src/main/resources/static/
├── index.html / embed.css / embed.js       # 集成演示页
├── knowledge.html / knowledge.css / knowledge.js   # 知识库管理后台
├── assistant.css / assistant.js            # 嵌入式助手组件
├── tokens.css                              # 共享设计变量与双主题
└── theme.js                                # 主题切换器
```

## HTTP 接口

| 方法 | 路径 | 说明 |
|---|---|---|
| `POST` | `/ai/chat` | 同步对话，返回 `ChatReply` |
| `POST` | `/ai/chat/stream` | SSE 流式对话，命名事件 `meta` / `delta` / `done` / `error` |
| `POST` | `/ai/knowledge` | 单篇文档入库（`content` + `metadata`） |
| `POST` | `/ai/knowledge/batch` | 批量入库（`List<String>`） |

### SSE 协议

```text
event: meta
data: {"conversationId":"c-...","route":"rag"}

event: delta
data: {"content":"按你的描述,"}

event: done
data: {"durationMs":1834}

event: error
data: {"message":"..."}
```

`conversationId` 缺省时由后端 UUID 生成并通过 `meta` 事件回传，前端可缓存以串联多轮对话。

## 前端入口

| URL | 说明 |
|---|---|
| `/` | 集成演示页：宿主 mock + 嵌入式助手 + 演示控制条（host / pose / theme） |
| `/knowledge.html` | 知识库管理后台：单篇 / 批量入库、过滤、本地视图 |

## 配置说明

仓库中仅保留可安全提交的配置：

- `src/main/resources/application.yaml` — 仅环境变量占位与安全默认值
- `src/main/resources/application-local.example.yaml` — 本地配置模板
- `src/main/resources/application-local.yaml` — 本地私有配置（已被 Git 忽略）

启用本地 profile：

```text
--spring.profiles.active=local
```

## 启动方式

前置条件：

- JDK 21
- 可用的 DashScope API Key
- 可访问的 Qdrant 实例

```bash
mvn spring-boot:run -D"spring-boot.run.profiles=local"
```

默认地址：`http://localhost:8080`

## Roadmap

已完成：

- ✅ POST + DTO 化对话接口
- ✅ SSE 流式响应（命名事件）
- ✅ 双 ChatClient + 可插拔路由策略
- ✅ 嵌入式助手组件（三态 + 双主题）
- ✅ 知识库管理后台

后续计划：

- 🚧 业务工具调用（基于 `spring-ai-alibaba-agent-framework`，先做关务只读工具样例）
- 🚧 多轮对话上下文存储（`AssistantSession` 域模型）
- 🚧 审计追踪（`AuditTrace`：模型调用、检索命中、工具调用全链路记录）
- 🚧 权限与风险等级（`ExecutionPolicy`：高风险写入需人工确认）
- 🚧 后端知识库列表 / 详情 / 删除接口
- 🚧 助手组件 Web Component 化
- 🚧 Prompt 与工具注册管理端

## 作者

ZHANGCHAO
