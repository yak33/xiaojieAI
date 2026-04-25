package io.github.yak33.xiaojieai.routing;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * KeywordBasedRagRoutingPolicy 表驱动测试。
 * <p>
 * 用例分两类：
 * <ul>
 *     <li>表驱动：覆盖关键词命中、业务编号命中、纯闲聊不命中等典型情形；</li>
 *     <li>空白消息：null / "" / 仅空白字符 一律不走 RAG。</li>
 * </ul>
 *
 * @author ZHANGCHAO
 */
class KeywordBasedRagRoutingPolicyTest {

    private final KeywordBasedRagRoutingPolicy policy = new KeywordBasedRagRoutingPolicy();

    @ParameterizedTest(name = "[{index}] \"{0}\" -> rag={1}")
    @CsvSource(delimiter = '|', value = {
            "帮我查 530120260425001 的流程状态 | true",
            "查一下集成电路的税则信息          | true",
            "8542319000 这个税号是什么         | true",
            "HS 编码 8542 怎么归类             | true",
            "ABCD123456                       | true",
            "你好,今天天气怎么样               | false",
            "讲个笑话                         | false",
            "1+1等于几                        | false",
            "abc12345                         | false"
    })
    @DisplayName("命中关务关键词或业务编号则走 RAG，否则走 plain")
    void routesByKeywordOrBusinessCode(String message, boolean expected) {
        assertThat(policy.shouldUseRag(message)).isEqualTo(expected);
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = {"   ", "\t", "\n"})
    @DisplayName("空消息或仅空白字符一律不走 RAG")
    void emptyMessagesDoNotRoute(String message) {
        assertThat(policy.shouldUseRag(message)).isFalse();
    }
}
