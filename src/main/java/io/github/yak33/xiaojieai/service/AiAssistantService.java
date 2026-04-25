package io.github.yak33.xiaojieai.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.vectorstore.QuestionAnswerAdvisor;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.regex.Pattern;

/**
 * 关务系统 AI 助手服务
 * 
 * @author ZHANGCHAO
 */
@Service
public class AiAssistantService {

    private static final Logger log = LoggerFactory.getLogger(AiAssistantService.class);
    private static final Set<String> RAG_HINT_KEYWORDS = Set.of(
            "税则", "hs", "海关", "报关", "报关单", "申报", "归类", "监管条件", "税率", "税金",
            "流程", "节点", "订单", "关务", "法规", "制度", "sop", "操作手册", "指引", "口岸",
            "舱单", "单证", "税号", "编码", "商品归类", "增值税", "消费税", "征免", "知识库"
    );
    private static final Pattern BUSINESS_CODE_PATTERN = Pattern.compile("\\b[a-zA-Z]{0,4}\\d{6,}\\b");

    private final ChatClient plainChatClient;
    private final ChatClient ragChatClient;
    private final VectorStore vectorStore;

    public AiAssistantService(ChatClient.Builder builder, VectorStore vectorStore) {
        this.plainChatClient = builder.build();
        this.ragChatClient = builder
                .defaultAdvisors(QuestionAnswerAdvisor.builder(vectorStore)
                        .searchRequest(SearchRequest.builder().build())
                        .build())
                .build();
        this.vectorStore = vectorStore;
    }

    /**
     * 与 AI 助手对话 (基于 RAG)
     *
     * @param userMessage 用户消息
     * @return AI 回复
     */
    public String chat(String userMessage) {
        long startedAt = System.currentTimeMillis();
        boolean ragRoute = shouldUseRag(userMessage);
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

    private boolean shouldUseRag(String userMessage) {
        if (userMessage == null || userMessage.isBlank()) {
            return false;
        }

        String normalizedMessage = userMessage.toLowerCase();
        if (RAG_HINT_KEYWORDS.stream().anyMatch(normalizedMessage::contains)) {
            return true;
        }

        return BUSINESS_CODE_PATTERN.matcher(normalizedMessage).find();
    }
}
