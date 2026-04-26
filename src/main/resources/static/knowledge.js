/* xiaojieAI · knowledge admin
   ----------------------------------------------------------------------------
   - 后端目前只有 POST /ai/knowledge 与 POST /ai/knowledge/batch (无 list 接口)
   - 列表用 localStorage 维护本地视图; 待后端 list 接口落地后再换为 GET /ai/knowledge
   - 单篇: title/source/version/effective 进 metadata, content 单独
   - 批量: 拖拽多份 .md/.txt 或多 textarea 行, 仅 content; metadata 留空
   -------------------------------------------------------------------------- */
(function () {
    const STORAGE_KEY = 'xj-kb-local';

    const els = {
        listBody:     document.querySelector('[data-kb-list]'),
        empty:        document.querySelector('[data-kb-empty]'),
        countDocs:    document.querySelector('[data-kb-count]'),
        countSync:    document.querySelector('[data-kb-sync]'),
        tabs:         Array.from(document.querySelectorAll('[data-kb-tab]')),
        panes:        Array.from(document.querySelectorAll('[data-kb-pane]')),
        formSingle:   document.querySelector('[data-kb-form-single]'),
        formBatch:    document.querySelector('[data-kb-form-batch]'),
        drop:         document.querySelector('[data-kb-drop]'),
        dropInput:    document.querySelector('[data-kb-drop-input]'),
        batchList:    document.querySelector('[data-kb-batch-list]'),
        batchExtra:   document.querySelector('[data-kb-batch-extra]'),
        toast:        document.querySelector('[data-kb-toast]'),
        themeToggle:  document.querySelector('[data-theme-toggle]'),
        themeLabel:   document.querySelector('[data-theme-current]'),
        filterSrc:    document.querySelector('[data-kb-filter-src]'),
        filterQuery:  document.querySelector('[data-kb-filter-q]')
    };

    /* ---------- local store ---------- */
    const loadLocal = () => {
        try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
        catch { return []; }
    };
    const saveLocal = (docs) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
    };

    let docs = loadLocal();
    let pendingFiles = [];

    /* ---------- toast ---------- */
    let toastTimer = null;
    const toast = (text, kind = 'info') => {
        if (!els.toast) return;
        els.toast.textContent = text;
        els.toast.className = 'kb-toast is-visible' + (kind === 'success' ? ' is-success' : kind === 'error' ? ' is-error' : '');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => {
            els.toast.classList.remove('is-visible');
        }, 2400);
    };

    /* ---------- list rendering ---------- */
    const fmtDate = (ts) => new Date(ts).toISOString().slice(0, 10);

    const passesFilters = (doc) => {
        const src = els.filterSrc?.value || '';
        const q = (els.filterQuery?.value || '').trim().toLowerCase();
        if (src && doc.source !== src) return false;
        if (q) {
            const hay = `${doc.title} ${doc.source} ${doc.contentPreview}`.toLowerCase();
            if (!hay.includes(q)) return false;
        }
        return true;
    };

    const render = () => {
        if (!els.listBody) return;
        const visible = docs.filter(passesFilters);
        els.countDocs.textContent = String(docs.length);
        els.countSync.textContent = new Date().toTimeString().slice(0, 5);

        if (visible.length === 0) {
            els.listBody.innerHTML = '';
            els.empty.style.display = 'block';
            return;
        }
        els.empty.style.display = 'none';

        els.listBody.replaceChildren(
            ...visible.map((doc) => {
                const row = document.createElement('div');
                row.className = 'kb-row';

                const titleCell = document.createElement('div');
                const title = document.createElement('div');
                title.className = 'kb-row__title';
                title.textContent = doc.title || '(未命名)';
                const sub = document.createElement('div');
                sub.className = 'kb-row__title-sub';
                sub.textContent = doc.contentPreview || `${doc.contentLength} chars`;
                titleCell.append(title, sub);

                const src = document.createElement('div');
                src.className = 'kb-row__src';
                src.textContent = doc.source || '—';

                const ver = document.createElement('div');
                ver.className = 'kb-row__ver';
                ver.textContent = doc.version ? `v${doc.version}` : '—';

                const date = document.createElement('div');
                date.className = 'kb-row__date';
                date.textContent = doc.effectiveFrom || fmtDate(doc.createdAt);

                const ops = document.createElement('div');
                ops.className = 'kb-row__ops';
                const view = document.createElement('button');
                view.className = 'kb-row__op';
                view.textContent = '⊙';
                view.title = '查看本地预览';
                view.addEventListener('click', () => previewDoc(doc));
                const del = document.createElement('button');
                del.className = 'kb-row__op kb-row__op--danger';
                del.textContent = '×';
                del.title = '从本地视图移除 (后端向量不会删除)';
                del.addEventListener('click', () => removeDoc(doc.id));
                ops.append(view, del);

                row.append(titleCell, src, ver, date, ops);
                return row;
            })
        );
    };

    const previewDoc = (doc) => {
        toast(`本地预览: ${doc.title || '(未命名)'} · ${doc.contentLength} chars`, 'info');
    };

    const removeDoc = (id) => {
        docs = docs.filter((d) => d.id !== id);
        saveLocal(docs);
        render();
        toast('已从本地视图移除', 'info');
    };

    /* ---------- single ingest ---------- */
    els.formSingle?.addEventListener('submit', async (event) => {
        event.preventDefault();
        const fd = new FormData(els.formSingle);
        const title = (fd.get('title') || '').toString().trim();
        const source = (fd.get('source') || '').toString().trim();
        const version = (fd.get('version') || '').toString().trim();
        const effectiveFrom = (fd.get('effectiveFrom') || '').toString().trim();
        const content = (fd.get('content') || '').toString();
        const metadataRaw = (fd.get('metadata') || '').toString().trim();

        if (!content.trim()) {
            toast('content 不能为空', 'error');
            return;
        }

        let metadataExtra = {};
        if (metadataRaw) {
            try { metadataExtra = JSON.parse(metadataRaw); }
            catch { toast('metadata 不是合法 JSON', 'error'); return; }
        }
        const metadata = {
            ...metadataExtra,
            ...(title && { title }),
            ...(source && { source }),
            ...(version && { version }),
            ...(effectiveFrom && { effectiveFrom })
        };

        const submitBtn = els.formSingle.querySelector('[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'ingesting...';

        try {
            const response = await fetch('/ai/knowledge', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content, metadata })
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            docs.unshift({
                id: 'local-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
                title, source, version, effectiveFrom,
                contentLength: content.length,
                contentPreview: content.slice(0, 80).replace(/\s+/g, ' '),
                createdAt: Date.now()
            });
            saveLocal(docs);
            render();
            els.formSingle.reset();
            toast('已入库 · 向量化已提交', 'success');
        } catch (err) {
            toast(`入库失败: ${err.message}`, 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'ingest →';
        }
    });

    /* ---------- batch ingest: drag & drop + extra textarea lines ---------- */
    const renderBatchList = () => {
        if (!els.batchList) return;
        els.batchList.replaceChildren(
            ...pendingFiles.map((file, idx) => {
                const item = document.createElement('div');
                item.className = 'kb-batch-item';

                const i = document.createElement('span');
                i.className = 'kb-batch-item__index';
                i.textContent = String(idx + 1).padStart(2, '0');

                const name = document.createElement('span');
                name.className = 'kb-batch-item__name';
                name.textContent = file.name;

                const size = document.createElement('span');
                size.className = 'kb-batch-item__size';
                size.textContent = `${(file.size / 1024).toFixed(1)} KB`;

                const remove = document.createElement('button');
                remove.type = 'button';
                remove.className = 'kb-batch-item__remove';
                remove.textContent = '×';
                remove.addEventListener('click', () => {
                    pendingFiles.splice(idx, 1);
                    renderBatchList();
                });

                item.append(i, name, size, remove);
                return item;
            })
        );
    };

    const acceptFiles = (fileList) => {
        const accepted = ['md', 'txt', 'markdown'];
        for (const f of Array.from(fileList)) {
            const ext = f.name.split('.').pop()?.toLowerCase();
            if (accepted.includes(ext)) pendingFiles.push(f);
        }
        renderBatchList();
    };

    if (els.drop) {
        ['dragenter', 'dragover'].forEach((ev) => {
            els.drop.addEventListener(ev, (event) => {
                event.preventDefault();
                els.drop.classList.add('is-over');
            });
        });
        ['dragleave', 'drop'].forEach((ev) => {
            els.drop.addEventListener(ev, (event) => {
                event.preventDefault();
                els.drop.classList.remove('is-over');
            });
        });
        els.drop.addEventListener('drop', (event) => {
            acceptFiles(event.dataTransfer.files);
        });
        els.drop.addEventListener('click', () => els.dropInput?.click());
    }
    els.dropInput?.addEventListener('change', (event) => {
        acceptFiles(event.target.files);
        event.target.value = '';
    });

    els.formBatch?.addEventListener('submit', async (event) => {
        event.preventDefault();
        const extra = (els.batchExtra?.value || '')
            .split(/\n\s*---+\s*\n/)
            .map((s) => s.trim())
            .filter(Boolean);

        const fileContents = await Promise.all(
            pendingFiles.map((f) => f.text().then((text) => ({ name: f.name, text })))
        );

        const all = [...fileContents.map((x) => x.text), ...extra];
        if (all.length === 0) {
            toast('请拖入文件或在下方填入分段内容', 'error');
            return;
        }

        const submitBtn = els.formBatch.querySelector('[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'ingesting...';

        try {
            const response = await fetch('/ai/knowledge/batch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(all)
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const now = Date.now();
            const newDocs = [
                ...fileContents.map((x, idx) => ({
                    id: `local-batch-${now}-${idx}`,
                    title: x.name,
                    source: 'batch',
                    version: '',
                    effectiveFrom: '',
                    contentLength: x.text.length,
                    contentPreview: x.text.slice(0, 80).replace(/\s+/g, ' '),
                    createdAt: now
                })),
                ...extra.map((c, idx) => ({
                    id: `local-batch-${now}-extra-${idx}`,
                    title: `(batch #${idx + 1})`,
                    source: 'batch',
                    version: '',
                    effectiveFrom: '',
                    contentLength: c.length,
                    contentPreview: c.slice(0, 80).replace(/\s+/g, ' '),
                    createdAt: now
                }))
            ];
            docs = [...newDocs, ...docs];
            saveLocal(docs);
            render();

            pendingFiles = [];
            renderBatchList();
            if (els.batchExtra) els.batchExtra.value = '';
            toast(`已批量入库 ${all.length} 份`, 'success');
        } catch (err) {
            toast(`批量入库失败: ${err.message}`, 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'ingest batch →';
        }
    });

    /* ---------- tabs ---------- */
    els.tabs.forEach((tab) => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.kbTab;
            els.tabs.forEach((t) => t.setAttribute('aria-selected', String(t === tab)));
            els.panes.forEach((p) => p.setAttribute('aria-hidden', String(p.dataset.kbPane !== target)));
        });
    });

    /* ---------- filters ---------- */
    els.filterSrc?.addEventListener('change', render);
    els.filterQuery?.addEventListener('input', render);

    /* ---------- theme ---------- */
    const updateThemeLabel = () => {
        if (els.themeLabel) els.themeLabel.textContent = window.xjTheme.current();
    };
    updateThemeLabel();
    els.themeToggle?.addEventListener('click', () => window.xjTheme.toggle());
    document.addEventListener('xj:theme', updateThemeLabel);

    /* ---------- init ---------- */
    render();
})();
