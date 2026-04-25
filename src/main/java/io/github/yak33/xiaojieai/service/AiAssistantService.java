package io.github.yak33.xiaojieai.service;

import io.github.yak33.xiaojieai.routing.RagRoutingPolicy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 关务系统 AI 助手服务
 * <p>
 * 仅承担一次对话的编排：路由选 client、调用模型、记录审计日志，以及知识入库。
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
     * 与 AI 助手对话，按路由策略选择 plain / rag 通道。
     *
     * @param userMessage 用户消息
     * @return AI 回复
     */
    public String chat(String userMessage) {
        long startedAt = System.currentTimeMillis();
        boolean ragRoute = ragRoutingPolicy.shouldUseRag(userMessage);
        ChatClient activeChatClient = ragRoute ? ragChatClient : plainChatClient;
        log.info("Calling AI assistant, route={}, messageLength={}",
                ragRoute ? "rag" : "plain",
                userMessage == null ? 0 : userMessage.length());
        try {
            String answer = activeChatClient.prompt()
                    .user(userMessage)
                    .call()
                    .content();
            log.info("AI assistant completed, route={}, durationMs={}, answerLength={}",
                    ragRoute ? "rag" : "plain",
                    System.currentTimeMillis() - startedAt,
                    answer == null ? 0 : answer.length());
            return answer;
        } catch (Exception exception) {
            log.error("AI assistant failed, route={}, durationMs={}",
                    ragRoute ? "rag" : "plain",
                    System.currentTimeMillis() - startedAt,
                    exception);
            throw exception;
        }
    }

    /**
     * 上传关务政策或文档到知识库
     *
     * @param content  文档内容
     * @param metadata 元数据
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
     *
     * @param contents 文档内容列表
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
}
