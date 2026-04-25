package io.github.yak33.xiaojieai.routing;

/**
 * RAG 路由策略：判断一次用户消息是否需要走带向量检索的 ChatClient。
 * <p>
 * 抽象成接口便于未来用嵌入相似度、轻量级 LLM 路由器或多策略组合替换默认实现，
 * 业务编排层不需要随之改动。
 *
 * @author ZHANGCHAO
 */
public interface RagRoutingPolicy {

    /**
     * @param userMessage 用户原始消息，可能为 {@code null} 或空白
     * @return {@code true} 表示编排器应使用 RAG 客户端，否则使用 plain 客户端
     */
    boolean shouldUseRag(String userMessage);
}
