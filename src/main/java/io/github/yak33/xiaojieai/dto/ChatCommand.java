package io.github.yak33.xiaojieai.dto;

/**
 * AI 对话请求命令
 * <p>
 * 除 {@code message} 外，其余字段均为协议预留：现阶段调用方可不填，后续接入多租户、
 * 多业务系统、多轮对话时无需破坏接口。
 *
 * @param message        用户原始消息（必填）
 * @param conversationId 会话 ID，缺省则由后端自动生成并在响应中回填
 * @param tenantId       租户 / 集团组织标识
 * @param userId         调用用户标识
 * @param systemCode     来源业务系统编码，例如 saas-customs
 * @author ZHANGCHAO
 */
public record ChatCommand(
        String message,
        String conversationId,
        String tenantId,
        String userId,
        String systemCode
) {
}
