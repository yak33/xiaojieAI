# xiaojieAI

[English](README.md) | [简体中文](README.zh-CN.md) | [日本語](README.ja.md)

xiaojieAI is an AI platform prototype for internal enterprise systems. Built with Spring Boot, Spring AI, DashScope, and Qdrant, it is intended to provide a unified assistant layer for customs, freight forwarding, and other business applications.

## Overview

- Unified AI conversation entry point
- RAG-based question answering over enterprise knowledge
- Tool calling and capability orchestration for business systems
- Standard backend foundation for floating assistants, side panels, and future voice input

## Tech Stack

- Java 21
- Spring Boot 3.5.x
- Spring AI 1.1.x
- Spring AI Alibaba DashScope
- Qdrant Vector Store

## Current Capabilities

- Basic AI chat endpoint
- Knowledge document ingestion and batch upload
- RAG pipeline backed by vector retrieval

## Configuration

The repository only keeps safe and shareable configuration:

- `src/main/resources/application.yaml`
  - environment-variable placeholders and safe defaults only
- `src/main/resources/application-local.example.yaml`
  - local configuration template
- `src/main/resources/application-local.yaml`
  - private local configuration, ignored by Git

To run with local configuration, enable the `local` profile:

```text
--spring.profiles.active=local
```

## Run

Prerequisites:

- JDK 21
- a valid DashScope API key
- an accessible Qdrant instance

Default endpoint:

```text
http://localhost:8080
```

## Roadmap

- Integrate customs, order, and workflow tools
- Return structured commands for host-system routing and form filling
- Provide a Web Component based assistant widget
- Add streaming responses, audit tracing, and permission guardrails

## Author

ZHANGCHAO
