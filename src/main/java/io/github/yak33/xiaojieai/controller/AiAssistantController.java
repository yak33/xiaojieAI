package io.github.yak33.xiaojieai.controller;

import io.github.yak33.xiaojieai.dto.ChatCommand;
import io.github.yak33.xiaojieai.dto.ChatReply;
import io.github.yak33.xiaojieai.service.AiAssistantService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;

import java.util.List;
import java.util.Map;

/**
 * 关务系统 AI 助手控制器
 *
 * @author ZHANGCHAO
 */
@RestController
@RequestMapping("/ai")
public class AiAssistantController {

    private static final Logger log = LoggerFactory.getLogger(AiAssistantController.class);

    private final AiAssistantService aiAssistantService;

    public AiAssistantController(AiAssistantService aiAssistantService) {
        this.aiAssistantService = aiAssistantService;
    }

    /**
     * 同步对话：返回完整 {@link ChatReply}。
     */
    @PostMapping(path = "/chat", produces = MediaType.APPLICATION_JSON_VALUE)
    public ChatReply chat(@RequestBody ChatCommand command) {
        log.info("Received chat request, conversationId={}, messagePreview='{}'",
                command.conversationId(), abbreviate(command.message(), 80));
        return aiAssistantService.chat(command);
    }

    /**
     * 流式对话：以 SSE 命名事件 {@code meta / delta / done / error} 输出。
     */
    @PostMapping(path = "/chat/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<ServerSentEvent<Object>> chatStream(@RequestBody ChatCommand command) {
        log.info("Received chat stream request, conversationId={}, messagePreview='{}'",
                command.conversationId(), abbreviate(command.message(), 80));
        return aiAssistantService.chatStream(command);
    }

    /**
     * 上传知识文档
     */
    @PostMapping("/knowledge")
    public void uploadKnowledge(@RequestBody Map<String, Object> payload) {
        String content = (String) payload.get("content");
        @SuppressWarnings("unchecked")
        Map<String, Object> metadata = (Map<String, Object>) payload.get("metadata");
        log.info("Received knowledge upload request, contentLength={}, metadataKeys={}",
                content == null ? 0 : content.length(),
                metadata == null ? List.of() : metadata.keySet());
        aiAssistantService.uploadDocument(content, metadata);
    }

    /**
     * 批量上传知识文档
     */
    @PostMapping("/knowledge/batch")
    public void batchUpload(@RequestBody List<String> contents) {
        log.info("Received batch knowledge upload request, documentCount={}",
                contents == null ? 0 : contents.size());
        aiAssistantService.batchUpload(contents);
    }

    private String abbreviate(String text, int maxLength) {
        if (text == null || text.isBlank()) {
            return "";
        }
        return text.length() <= maxLength ? text : text.substring(0, maxLength) + "...";
    }
}
