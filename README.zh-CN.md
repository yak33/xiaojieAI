# xiaojieAI

[English](README.md) | [简体中文](README.zh-CN.md) | [日本語](README.ja.md)

xiaojieAI 是一个面向企业内部业务系统的 AI 智能底座原型，基于 Spring Boot、Spring AI、DashScope 与 Qdrant 构建，目标是为关务、货代及其他业务应用提供统一的智能助手能力。

## 项目概览

- 提供统一的 AI 对话入口
- 支持基于企业知识库的 RAG 问答
- 支持业务系统工具调用与能力编排
- 为浮动助手、侧边栏助手以及后续语音输入提供统一后端基础

## 技术栈

- Java 21
- Spring Boot 3.5.x
- Spring AI 1.1.x
- Spring AI Alibaba DashScope
- Qdrant Vector Store

## 当前能力

- 基础 AI 对话接口
- 知识文档上传与批量入库
- 基于向量检索的 RAG 问答链路

## 配置说明

仓库中仅保留可安全提交的配置：

- `src/main/resources/application.yaml`
  - 仅包含环境变量占位和安全默认值
- `src/main/resources/application-local.example.yaml`
  - 本地配置模板
- `src/main/resources/application-local.yaml`
  - 本地私有配置文件，已被 Git 忽略

如需使用本地配置启动，请启用 `local` profile：

```text
--spring.profiles.active=local
```

## 启动方式

前置条件：

- JDK 21
- 可用的 DashScope API Key
- 可访问的 Qdrant 服务

默认访问地址：

```text
http://localhost:8080
```

## 后续方向

- 接入关务、订单、流程等业务工具
- 输出结构化 command 以驱动宿主系统跳转与表单填充
- 提供基于 Web Component 的助手组件
- 增加流式响应、审计追踪与权限风控

## 作者

ZHANGCHAO
