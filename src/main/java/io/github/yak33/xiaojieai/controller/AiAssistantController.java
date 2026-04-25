package io.github.yak33.xiaojieai.controller;

import io.github.yak33.xiaojieai.service.AiAssistantService;
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
        aiAssistantService.uploadDocument(content, metadata);
    }

    /**
     * 批量上传知识文档
     *
     * @param contents 文档内容列表
     */
    @PostMapping("/knowledge/batch")
    public void batchUpload(@RequestBody List<String> contents) {
        aiAssistantService.batchUpload(contents);
    }
}
