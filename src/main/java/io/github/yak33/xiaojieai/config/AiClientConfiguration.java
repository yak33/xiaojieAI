package io.github.yak33.xiaojieai.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.vectorstore.QuestionAnswerAdvisor;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * AI ChatClient 装配中心
 * <p>
 * 将 plain 与 rag 两路 {@link ChatClient} 的拼装从业务服务里剥离，业务层只负责编排与路由，
 * 不再持有 {@link ChatClient.Builder} 或 advisor 拼装细节。两个 Bean 方法各自接收独立的
 * builder 实例，避免共享状态带来的隐式时序耦合。
 *
 * @author ZHANGCHAO
 */
@Configuration
public class AiClientConfiguration {

    private static final Logger log = LoggerFactory.getLogger(AiClientConfiguration.class);

    /**
     * 不带 RAG 的纯对话客户端，承接闲聊与纯模型问答。
     */
    @Bean
    public ChatClient plainChatClient(ChatClient.Builder builder) {
        log.info("Configured plain ChatClient (no advisors)");
        return builder.build();
    }

    /**
     * 带 RAG 检索的客户端，承接关务知识、法规、SOP 等领域问答。
     */
    @Bean
    public ChatClient ragChatClient(ChatClient.Builder builder, VectorStore vectorStore) {
        log.info("Configured RAG ChatClient with QuestionAnswerAdvisor on vectorStore={}",
                vectorStore.getClass().getSimpleName());
        return builder
                .defaultAdvisors(QuestionAnswerAdvisor.builder(vectorStore)
                        .searchRequest(SearchRequest.builder().build())
                        .build())
                .build();
    }
}
