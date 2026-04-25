(function () {
    const shell = document.getElementById("demoShell");
    const panel = document.getElementById("assistantPanel");
    const stream = document.getElementById("chatStream");
    const form = document.getElementById("chatForm");
    const input = document.getElementById("messageInput");
    const sendButton = document.getElementById("sendButton");
    const voiceButton = document.getElementById("voiceButton");
    const floatingLauncher = document.getElementById("floatingLauncher");
    const inlineLauncher = document.getElementById("inlineLauncher");
    const closeAssistant = document.getElementById("closeAssistant");
    const modeButtons = Array.from(document.querySelectorAll(".mode-button"));
    const promptButtons = Array.from(document.querySelectorAll(".prompt-chip"));
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    let activeMode = "sidebar";

    const setMode = (mode) => {
        activeMode = mode;
        shell.classList.toggle("mode-sidebar", mode === "sidebar");
        shell.classList.toggle("mode-floating", mode === "floating");
        panel.classList.remove("is-collapsed");
        modeButtons.forEach((button) => {
            button.classList.toggle("is-active", button.dataset.mode === mode);
        });
        if (mode === "sidebar" && window.innerWidth > 760) {
            floatingLauncher.style.display = "none";
        }
    };

    const appendMessage = (role, content) => {
        const message = document.createElement("article");
        message.className = `message message-${role}`;

        const roleBadge = document.createElement("div");
        roleBadge.className = "message-role";
        roleBadge.textContent = role === "user" ? "You" : "AI";

        const bubble = document.createElement("div");
        bubble.className = "message-content";
        bubble.textContent = content;

        message.appendChild(roleBadge);
        message.appendChild(bubble);
        stream.appendChild(message);
        stream.scrollTop = stream.scrollHeight;
        return message;
    };

    const setBusy = (busy) => {
        sendButton.disabled = busy;
        voiceButton.disabled = busy;
        form.classList.toggle("is-busy", busy);
    };

    const sendMessage = async (message) => {
        const payload = message.trim();
        if (!payload) {
            return;
        }

        appendMessage("user", payload);
        input.value = "";
        setBusy(true);

        const placeholder = appendMessage("assistant", "正在处理...");

        try {
            const response = await fetch(`/ai/chat?message=${encodeURIComponent(payload)}`, {
                method: "GET",
                headers: {
                    "Accept": "text/plain"
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const answer = await response.text();
            placeholder.querySelector(".message-content").textContent = answer || "未返回内容";
        } catch (error) {
            placeholder.querySelector(".message-content").textContent =
                `请求失败：${error.message}。请确认后端服务、模型配置和 Qdrant 连接是否可用。`;
        } finally {
            setBusy(false);
            input.focus();
            stream.scrollTop = stream.scrollHeight;
        }
    };

    modeButtons.forEach((button) => {
        button.addEventListener("click", () => setMode(button.dataset.mode));
    });

    promptButtons.forEach((button) => {
        button.addEventListener("click", () => sendMessage(button.dataset.prompt || ""));
    });

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        sendMessage(input.value);
    });

    floatingLauncher.addEventListener("click", () => {
        setMode("floating");
        panel.classList.toggle("is-collapsed");
        if (!panel.classList.contains("is-collapsed")) {
            input.focus();
        }
    });

    inlineLauncher.addEventListener("click", () => {
        panel.classList.remove("is-collapsed");
        input.focus();
    });

    closeAssistant.addEventListener("click", () => {
        if (activeMode === "floating" || window.innerWidth <= 760) {
            panel.classList.add("is-collapsed");
        }
    });

    voiceButton.addEventListener("click", () => {
        if (!SpeechRecognition) {
            appendMessage("assistant", "当前浏览器不支持语音识别，可切换到 Chromium 内核浏览器继续验证。");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = "zh-CN";
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
        voiceButton.disabled = true;
        voiceButton.textContent = "识别中";

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            input.value = transcript;
            voiceButton.textContent = "语音";
            voiceButton.disabled = false;
            input.focus();
        };

        recognition.onerror = () => {
            appendMessage("assistant", "语音识别未成功，请重试或直接输入文本。");
            voiceButton.textContent = "语音";
            voiceButton.disabled = false;
        };

        recognition.onend = () => {
            voiceButton.textContent = "语音";
            voiceButton.disabled = false;
        };

        recognition.start();
    });

    window.addEventListener("resize", () => {
        if (window.innerWidth <= 760) {
            panel.classList.add("is-collapsed");
            floatingLauncher.style.display = "inline-flex";
            return;
        }

        if (activeMode === "sidebar") {
            panel.classList.remove("is-collapsed");
        }
    });

    setMode("sidebar");
})();
