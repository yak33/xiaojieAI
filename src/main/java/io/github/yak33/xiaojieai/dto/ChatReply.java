package io.github.yak33.xiaojieai.dto;

import java.util.List;

/**
 * AI 对话同步响应
 *
 * @param conversationId 会话 ID（与请求一致或后端生成）
 * @param answer         模型回答
 * @param route          实际走的通道：{@code rag} 或 {@code plain}
 * @param durationMs     端到端耗时，单位毫秒
 * @param citations      引用知识来源；现阶段固定为空列表，后续 RAG 治理接入后填充
 * @author ZHANGCHAO
 */
public record ChatReply(
        String conversationId,
        String answer,
        String route,
        long durationMs,
        List<String> citations
) {
}
