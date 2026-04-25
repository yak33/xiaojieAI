package io.github.yak33.xiaojieai.controller;

import io.github.yak33.xiaojieai.service.AiAssistantService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.*;

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
     * 智能对话接口
     *
     * @param message 用户输入的关务问题
     * @return AI 助手的回答
     */
    @GetMapping("/chat")
    public String chat(@RequestParam String message) {
        log.info("Received chat request, messagePreview='{}'", abbreviate(message, 80));
        return aiAssistantService.chat(message);
    }

    /**
     * 上传知识文档
     *
     * @param payload 包含内容和元数据
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
     *
     * @param contents 文档内容列表
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
