# xiaojieAI

[English](README.md) | [简体中文](README.zh-CN.md) | [日本語](README.ja.md)

xiaojieAI is an **AI platform / orchestration layer** for enterprise internal systems (customs, ERP, OA, and others). It is not a replacement for those systems; instead, it ships as an embedded assistant plus a unified backend that consolidates conversation, knowledge retrieval, future tool-calling, and policy guardrails into a single service that any host system can integrate with.

## Position

- **Not** a chat plugin bolted onto a single business system
- **Is** a group-wide AI capability platform with a backend skeleton and a paired assistant component
- Business facts stay in the source-of-truth systems; xiaojieAI handles dialogue, knowledge, capability orchestration, and audit

## Current Capabilities

- POST + DTO chat endpoint with reserved protocol fields (`conversationId / tenantId / userId / systemCode`)
- Server-Sent Events streaming with named events (`meta` / `delta` / `done` / `error`)
- Dual `ChatClient` wiring (plain / RAG) with a pluggable `RagRoutingPolicy`
- Default routing by domain keywords + business-code regex, covered by 14 table-driven tests
- Single and batch knowledge ingestion (`/ai/knowledge`, `/ai/knowledge/batch`)
- Mission Control style embedded assistant component: side / floating / fullscreen poses, light & dark themes
- Embed demo page that switches between mocked customs / ERP / OA hosts to validate zero-intrusion embedding
- Knowledge admin console with single/batch ingest and `.md` / `.txt` drag-and-drop

## Stack

- Java 21
- Spring Boot 3.5.x
- Spring AI 1.1.x
- Spring AI Alibaba DashScope (chat & embedding)
- Qdrant Vector Store
- Frontend: vanilla HTML / CSS / JS (no Vue / React for now)

## Project Layout

```text
src/main/java/io/github/yak33/xiaojieai/
├── XiaojieAiApplication.java
├── config/
│   └── AiClientConfiguration.java          # wires plain & rag ChatClients
├── controller/
│   └── AiAssistantController.java          # REST endpoints
├── dto/
│   ├── ChatCommand.java                    # request record (with reserved fields)
│   └── ChatReply.java                      # synchronous response record
├── routing/
│   ├── RagRoutingPolicy.java               # routing strategy interface
│   └── KeywordBasedRagRoutingPolicy.java   # default: keywords + business-code regex
└── service/
    └── AiAssistantService.java             # orchestration, invocation, audit

src/main/resources/static/
├── index.html / embed.css / embed.js       # embed demo
├── knowledge.html / knowledge.css / knowledge.js   # knowledge admin
├── assistant.css / assistant.js            # embedded assistant component
├── tokens.css                              # shared design tokens, dual theme
└── theme.js                                # theme switcher
```

## HTTP API

| Method | Path | Description |
|---|---|---|
| `POST` | `/ai/chat` | Synchronous chat, returns `ChatReply` |
| `POST` | `/ai/chat/stream` | SSE streaming chat, named events `meta` / `delta` / `done` / `error` |
| `POST` | `/ai/knowledge` | Ingest a single document (`content` + `metadata`) |
| `POST` | `/ai/knowledge/batch` | Batch ingest (`List<String>`) |

### SSE protocol

```text
event: meta
data: {"conversationId":"c-...","route":"rag"}

event: delta
data: {"content":"based on what you described, "}

event: done
data: {"durationMs":1834}

event: error
data: {"message":"..."}
```

When `conversationId` is omitted, the backend generates a UUID and returns it through the `meta` event so the frontend can cache it for multi-turn dialogue.

## Frontend Entries

| URL | Description |
|---|---|
| `/` | Embed demo: host mock + embedded assistant + demo bar (host / pose / theme) |
| `/knowledge.html` | Knowledge admin console: single & batch ingest, filters, local view |

## Configuration

Only safe-to-share configuration is committed:

- `src/main/resources/application.yaml` — environment-variable placeholders and safe defaults only
- `src/main/resources/application-local.example.yaml` — local configuration template
- `src/main/resources/application-local.yaml` — private local configuration, ignored by Git

To run with the local profile:

```text
--spring.profiles.active=local
```

## Run

Prerequisites:

- JDK 21
- A valid DashScope API key
- A reachable Qdrant instance

```bash
mvn spring-boot:run -D"spring-boot.run.profiles=local"
```

Default endpoint: `http://localhost:8080`

## Roadmap

Done:

- ✅ POST + DTO chat endpoint
- ✅ SSE streaming with named events
- ✅ Dual ChatClient + pluggable routing policy
- ✅ Embedded assistant component (three poses + dual theme)
- ✅ Knowledge admin console

In progress / planned:

- 🚧 Tool calling via `spring-ai-alibaba-agent-framework` (start with a read-only customs tool)
- 🚧 Multi-turn conversation context storage (`AssistantSession` domain model)
- 🚧 Audit trace (`AuditTrace`: full chain of model calls, retrieval hits, tool invocations)
- 🚧 Permission & risk tiers (`ExecutionPolicy`: writes require explicit confirmation)
- 🚧 Backend knowledge list / detail / delete endpoints
- 🚧 Web Component packaging of the assistant
- 🚧 Admin console for prompt and tool registry

## Author

ZHANGCHAO
