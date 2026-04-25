package io.github.yak33.xiaojieai.routing;

import org.springframework.stereotype.Component;

import java.util.Set;
import java.util.regex.Pattern;

/**
 * 默认的 RAG 路由策略：基于关务领域关键词集合与业务编号正则判定。
 * <p>
 * 触发 RAG 的两个条件（任一即可）：
 * <ul>
 *     <li>消息（lower-case 后）命中关务领域关键词集合中的任意一项；</li>
 *     <li>消息包含一个看起来像业务单据号的字符串：可选 0-4 位字母前缀 + 至少 6 位数字。</li>
 * </ul>
 *
 * @author ZHANGCHAO
 */
@Component
public class KeywordBasedRagRoutingPolicy implements RagRoutingPolicy {

    private static final Set<String> RAG_HINT_KEYWORDS = Set.of(
            "税则", "hs", "海关", "报关", "报关单", "申报", "归类", "监管条件", "税率", "税金",
            "流程", "节点", "订单", "关务", "法规", "制度", "sop", "操作手册", "指引", "口岸",
            "舱单", "单证", "税号", "编码", "商品归类", "增值税", "消费税", "征免", "知识库"
    );
    private static final Pattern BUSINESS_CODE_PATTERN = Pattern.compile("\\b[a-zA-Z]{0,4}\\d{6,}\\b");

    @Override
    public boolean shouldUseRag(String userMessage) {
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
