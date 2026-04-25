package io.github.yak33.xiaojieai.service;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.vectorstore.QuestionAnswerAdvisor;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 关务系统 AI 助手服务
 * 
 * @author ZHANGCHAO
 */
@Service
public class AiAssistantService {

    private final ChatClient chatClient;
    private final VectorStore vectorStore;

    public AiAssistantService(ChatClient.Builder builder, VectorStore vectorStore) {
        this.chatClient = builder
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
        return chatClient.prompt()
                .user(userMessage)
                .call()
                .content();
    }

    /**
     * 上传关务政策或文档到知识库
     *
     * @param content  文档内容
     * @param metadata 元数据
     */
    public void uploadDocument(String content, Map<String, Object> metadata) {
        Document document = new Document(content, metadata);
        vectorStore.add(List.of(document));
    }

    /**
     * 批量上传文档
     *
     * @param contents 文档内容列表
     */
    public void batchUpload(List<String> contents) {
        List<Document> documents = contents.stream()
                .map(content -> new Document(content))
                .collect(Collectors.toList());
        vectorStore.add(documents);
    }
}
