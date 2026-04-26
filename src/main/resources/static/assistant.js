/* xiaojieAI · assistant interaction
   ----------------------------------------------------------------------------
   - 挂载点：[data-xj-assistant-root]
   - 角色标记: data-xj-stream / -form / -input / -send / -voice
              data-xj-pose / -collapse / -prompt / -session / -route
   - 后端契约: POST /ai/chat/stream → SSE meta|delta|done|error
   -------------------------------------------------------------------------- */
(function () {
    const root = document.querySelector('[data-xj-assistant-root]');
    if (!root) return;

    const $ = (sel) => root.querySelector(sel);
    const $$ = (sel) => Array.from(root.querySelectorAll(sel));

    const stream = $('[data-xj-stream]');
    const form = $('[data-xj-form]');
    const input = $('[data-xj-input]');
    const sendBtn = $('[data-xj-send]');
    const voiceBtn = $('[data-xj-voice]');
    const promptBtns = $$('[data-xj-prompt]');
    const poseBtns = $$('[data-xj-pose]');
    const collapseBtn = $('[data-xj-collapse]');
    const launcher = document.querySelector('[data-xj-launcher]');
    const sessionEl = $('[data-xj-session]');
    const routeEl = $('[data-xj-route]');

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    let conversationId = null;

    /* ----- pose ----- */
    const setPose = (pose) => {
        if (!['side', 'floating', 'fullscreen'].includes(pose)) return;
        root.dataset.pose = pose;
        root.dataset.collapsed = 'false';
        poseBtns.forEach((btn) => {
            btn.setAttribute('aria-pressed', String(btn.dataset.xjPose === pose));
        });
        document.dispatchEvent(new CustomEvent('xj:pose', { detail: { pose } }));
    };

    /* ----- DOM helpers ----- */
    const stamp = () => {
        const d = new Date();
        const pad = (n) => String(n).padStart(2, '0');
        return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    };

    const appendMessage = (role, content) => {
        const article = document.createElement('article');
        article.className = `message message-${role}`;
        const header = document.createElement('div');
        header.className = 'message-role';
        header.textContent = role === 'user' ? 'user' : 'ai';
        header.dataset.time = stamp();
        const bubble = document.createElement('div');
        bubble.className = 'message-content';
        if (typeof content === 'string') {
            bubble.textContent = content;
        } else if (content instanceof Node) {
            bubble.append(content);
        }
        article.append(header, bubble);
        stream.append(article);
        stream.scrollTop = stream.scrollHeight;
        return article;
    };

    const renderStreaming = (bubble, text) => {
        bubble.replaceChildren(document.createTextNode(text));
        const cursor = document.createElement('span');
        cursor.className = 'streaming-cursor';
        bubble.append(cursor);
    };

    const setBusy = (busy) => {
        if (sendBtn) sendBtn.disabled = busy;
        if (voiceBtn) voiceBtn.disabled = busy;
        form?.classList.toggle('is-busy', busy);
    };

    /* ----- SSE parser ----- */
    const parseSseBlock = (block) => {
        const lines = block.split('\n');
        let event = 'message';
        let dataStr = '';
        for (const line of lines) {
            if (line.startsWith('event:')) event = line.slice(6).trim();
            else if (line.startsWith('data:')) dataStr += line.slice(5).trim();
        }
        if (!dataStr) return null;
        try { return { event, data: JSON.parse(dataStr) }; }
        catch { return null; }
    };

    /* ----- main send loop ----- */
    const sendMessage = async (rawMessage) => {
        const payload = (rawMessage || '').trim();
        if (!payload) return;

        appendMessage('user', payload);
        if (input) input.value = '';
        setBusy(true);

        const placeholder = appendMessage('assistant', '');
        const bubble = placeholder.querySelector('.message-content');
        const spinner = document.createElement('span');
        spinner.className = 'message-spinner';
        spinner.textContent = 'thinking';
        bubble.append(spinner);

        let answerText = '';
        let firstDelta = false;
        let routeName = null;
        let durationMs = null;

        try {
            const response = await fetch('/ai/chat/stream', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'text/event-stream'
                },
                body: JSON.stringify({
                    message: payload,
                    conversationId
                })
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });

                const events = buffer.split(/\n\n/);
                buffer = events.pop() ?? '';

                for (const block of events) {
                    const parsed = parseSseBlock(block);
                    if (!parsed) continue;
                    const { event, data } = parsed;

                    if (event === 'meta') {
                        conversationId = data.conversationId ?? conversationId;
                        routeName = data.route ?? routeName;
                        if (sessionEl && conversationId) {
                            sessionEl.textContent = conversationId.slice(0, 18);
                        }
                        if (routeEl && routeName) {
                            routeEl.textContent = routeName;
                            routeEl.dataset.route = routeName;
                        }
                    } else if (event === 'delta') {
                        if (!firstDelta) {
                            firstDelta = true;
                        }
                        answerText += data.content ?? '';
                        renderStreaming(bubble, answerText);
                        stream.scrollTop = stream.scrollHeight;
                    } else if (event === 'done') {
                        durationMs = data.durationMs;
                    } else if (event === 'error') {
                        bubble.replaceChildren(document.createTextNode(
                            `请求失败: ${data.message ?? '未知错误'}`
                        ));
                        return;
                    }
                }
            }

            // finalize: drop cursor, append trail
            bubble.replaceChildren(document.createTextNode(answerText || '未返回内容'));
            if (firstDelta) {
                const trail = document.createElement('div');
                trail.className = 'message-trail';
                if (routeName) {
                    const r = document.createElement('span');
                    r.className = 'route';
                    r.textContent = routeName;
                    trail.append(r);
                }
                if (durationMs != null) {
                    const d = document.createElement('span');
                    d.textContent = `${durationMs} ms`;
                    trail.append(d);
                }
                placeholder.append(trail);
            }
        } catch (err) {
            bubble.replaceChildren(document.createTextNode(
                `请求失败: ${err.message}。请确认后端服务、模型与 Qdrant 连接是否可用。`
            ));
        } finally {
            setBusy(false);
            input?.focus();
            stream.scrollTop = stream.scrollHeight;
        }
    };

    /* ----- bindings ----- */
    poseBtns.forEach((btn) => {
        btn.addEventListener('click', () => setPose(btn.dataset.xjPose));
    });
    promptBtns.forEach((btn) => {
        btn.addEventListener('click', () => sendMessage(btn.dataset.xjPrompt || ''));
    });
    form?.addEventListener('submit', (event) => {
        event.preventDefault();
        sendMessage(input?.value || '');
    });
    input?.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
            event.preventDefault();
            sendMessage(input.value);
        }
    });
    collapseBtn?.addEventListener('click', () => {
        if (root.dataset.pose === 'floating') {
            root.dataset.collapsed = 'true';
        } else if (root.dataset.pose === 'fullscreen') {
            setPose('side');
        }
    });
    launcher?.addEventListener('click', () => {
        if (root.dataset.pose !== 'floating') setPose('floating');
        root.dataset.collapsed = 'false';
        input?.focus();
    });

    voiceBtn?.addEventListener('click', () => {
        if (!SpeechRecognition) {
            appendMessage('assistant', '当前浏览器不支持语音识别，可切换到 Chromium 内核浏览器继续验证。');
            return;
        }
        const recognition = new SpeechRecognition();
        recognition.lang = 'zh-CN';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
        const original = voiceBtn.textContent;
        voiceBtn.disabled = true;
        voiceBtn.textContent = 'rec...';
        recognition.onresult = (event) => {
            if (input) input.value = event.results[0][0].transcript;
        };
        recognition.onerror = () => appendMessage('assistant', '语音识别未成功，请重试或直接输入文本。');
        recognition.onend = () => {
            voiceBtn.disabled = false;
            voiceBtn.textContent = original;
            input?.focus();
        };
        recognition.start();
    });

    /* ----- 外部事件: 演示控制条切换 pose ----- */
    document.addEventListener('xj:request-pose', (event) => {
        if (event.detail?.pose) setPose(event.detail.pose);
    });

    /* ----- init ----- */
    setPose(root.dataset.pose || 'side');
    if (sessionEl) sessionEl.textContent = '—';
    if (routeEl) routeEl.textContent = '—';
})();
