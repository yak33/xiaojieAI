package io.github.yak33.xiaojieai.service;

import io.github.yak33.xiaojieai.dto.ChatCommand;
import io.github.yak33.xiaojieai.dto.ChatReply;
import io.github.yak33.xiaojieai.routing.RagRoutingPolicy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * 关务系统 AI 助手服务
 * <p>
 * 仅承担一次对话的编排：路由选 client、调用模型（同步或流式）、记录审计日志，以及知识入库。
 * ChatClient 拼装由 {@code AiClientConfiguration} 负责，路由判定由 {@link RagRoutingPolicy} 负责。
 *
 * @author ZHANGCHAO
 */
@Service
public class AiAssistantService {

    private static final Logger log = LoggerFactory.getLogger(AiAssistantService.class);

    private final ChatClient plainChatClient;
    private final ChatClient ragChatClient;
    private final RagRoutingPolicy ragRoutingPolicy;
    private final VectorStore vectorStore;

    public AiAssistantService(@Qualifier("plainChatClient") ChatClient plainChatClient,
                              @Qualifier("ragChatClient") ChatClient ragChatClient,
                              RagRoutingPolicy ragRoutingPolicy,
                              VectorStore vectorStore) {
        this.plainChatClient = plainChatClient;
        this.ragChatClient = ragChatClient;
        this.ragRoutingPolicy = ragRoutingPolicy;
        this.vectorStore = vectorStore;
    }

    /**
     * 同步对话：按路由策略选择 plain / rag 通道，整段响应返回。
     */
    public ChatReply chat(ChatCommand command) {
        long startedAt = System.currentTimeMillis();
        String conversationId = resolveConversationId(command);
        boolean ragRoute = ragRoutingPolicy.shouldUseRag(command.message());
        String routeName = ragRoute ? "rag" : "plain";
        ChatClient activeChatClient = ragRoute ? ragChatClient : plainChatClient;

        log.info("Calling AI assistant, conversationId={}, route={}, messageLength={}",
                conversationId, routeName,
                command.message() == null ? 0 : command.message().length());
        try {
            String answer = activeChatClient.prompt()
                    .user(command.message())
                    .call()
                    .content();
            long durationMs = System.currentTimeMillis() - startedAt;
            log.info("AI assistant completed, conversationId={}, route={}, durationMs={}, answerLength={}",
                    conversationId, routeName, durationMs,
                    answer == null ? 0 : answer.length());
            return new ChatReply(conversationId, answer, routeName, durationMs, List.of());
        } catch (Exception exception) {
            log.error("AI assistant failed, conversationId={}, route={}, durationMs={}",
                    conversationId, routeName, System.currentTimeMillis() - startedAt,
                    exception);
            throw exception;
        }
    }

    /**
     * 流式对话：以命名 SSE 事件形式输出。
     * <ul>
     *     <li>{@code meta} —— 单次，下发会话元数据；</li>
     *     <li>{@code delta} —— 0..N 次，每次携带一段文本增量；</li>
     *     <li>{@code done} —— 单次，正常结束并下发耗时；</li>
     *     <li>{@code error} —— 单次，异常结束并下发错误信息（替代 {@code done}）。</li>
     * </ul>
     */
    public Flux<ServerSentEvent<Object>> chatStream(ChatCommand command) {
        long startedAt = System.currentTimeMillis();
        String conversationId = resolveConversationId(command);
        boolean ragRoute = ragRoutingPolicy.shouldUseRag(command.message());
        String routeName = ragRoute ? "rag" : "plain";
        ChatClient activeChatClient = ragRoute ? ragChatClient : plainChatClient;

        log.info("Calling AI assistant stream, conversationId={}, route={}, messageLength={}",
                conversationId, routeName,
                command.message() == null ? 0 : command.message().length());

        Flux<ServerSentEvent<Object>> meta = Flux.just(
                sse("meta", Map.of("conversationId", conversationId, "route", routeName))
        );

        Flux<ServerSentEvent<Object>> deltas = activeChatClient.prompt()
                .user(command.message())
                .stream()
                .content()
                .map(chunk -> sse("delta", Map.of("content", chunk)));

        Flux<ServerSentEvent<Object>> done = Flux.defer(() -> Flux.just(
                sse("done", Map.of("durationMs", System.currentTimeMillis() - startedAt))
        ));

        return Flux.concat(meta, deltas, done)
                .doOnComplete(() -> log.info(
                        "AI assistant stream completed, conversationId={}, route={}, durationMs={}",
                        conversationId, routeName, System.currentTimeMillis() - startedAt))
                .onErrorResume(error -> {
                    log.error("AI assistant stream failed, conversationId={}, route={}, durationMs={}",
                            conversationId, routeName, System.currentTimeMillis() - startedAt, error);
                    String reason = error.getMessage() == null ? "stream failed" : error.getMessage();
                    return Flux.just(sse("error", Map.of("message", reason)));
                });
    }

    /**
     * 上传关务政策或文档到知识库
     */
    public void uploadDocument(String content, Map<String, Object> metadata) {
        long startedAt = System.currentTimeMillis();
        Document document = new Document(content, metadata);
        vectorStore.add(List.of(document));
        log.info("Knowledge document uploaded, durationMs={}, contentLength={}, metadataKeys={}",
                System.currentTimeMillis() - startedAt,
                content == null ? 0 : content.length(),
                metadata == null ? List.of() : metadata.keySet());
    }

    /**
     * 批量上传文档
     */
    public void batchUpload(List<String> contents) {
        long startedAt = System.currentTimeMillis();
        List<Document> documents = contents.stream()
                .map(content -> new Document(content))
                .collect(Collectors.toList());
        vectorStore.add(documents);
        log.info("Batch knowledge upload completed, durationMs={}, documentCount={}",
                System.currentTimeMillis() - startedAt,
                contents == null ? 0 : contents.size());
    }

    private String resolveConversationId(ChatCommand command) {
        if (command != null
                && command.conversationId() != null
                && !command.conversationId().isBlank()) {
            return command.conversationId();
        }
        return "c-" + UUID.randomUUID();
    }

    private static ServerSentEvent<Object> sse(String event, Object data) {
        return ServerSentEvent.builder()
                .event(event)
                .data(data)
                .build();
    }
}
