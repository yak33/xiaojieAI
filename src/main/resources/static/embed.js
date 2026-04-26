/* xiaojieAI · embed demo page wiring
   ----------------------------------------------------------------------------
   - 宿主品牌切换 (customs / erp / oa)
   - pose 切换转发到 assistant.js
   - 主题切换显示当前值
   -------------------------------------------------------------------------- */
(function () {
    const HOSTS = {
        customs: {
            name: 'Acme 关务',
            hint: 'customs.acme.local',
            mark: '⌬',
            navItems: ['概览', '报关单', '税则', '流程'],
            sidebar: [
                { title: 'queue',   items: [['待归类', '184'], ['待复核', '36'], ['超时', '9']] },
                { title: 'archive', items: [['本月', '2,184'], ['本季', '6,109']] }
            ]
        },
        erp: {
            name: 'Acme ERP',
            hint: 'erp.acme.local',
            mark: '◫',
            navItems: ['首页', '采购单', '库存', '凭证'],
            sidebar: [
                { title: 'pending', items: [['采购审批', '24'], ['付款审批', '11'], ['对账', '7']] },
                { title: 'period',  items: [['本月凭证', '1,302'], ['本季', '4,876']] }
            ]
        },
        oa: {
            name: 'Acme OA',
            hint: 'oa.acme.local',
            mark: '◇',
            navItems: ['工作台', '审批', '日程', '通讯录'],
            sidebar: [
                { title: 'inbox',   items: [['待审批', '17'], ['抄送我', '42'], ['已逾期', '3']] },
                { title: 'today',   items: [['会议', '4'], ['任务', '9']] }
            ]
        }
    };

    const root = document.documentElement;
    const brandEl = document.querySelector('[data-host-brand]');
    const navEl = document.querySelector('[data-host-nav]');
    const sidebarEl = document.querySelector('[data-host-sidebar]');
    const hostBtns = Array.from(document.querySelectorAll('[data-host-switch] button'));
    const poseBtns = Array.from(document.querySelectorAll('[data-pose-switch] button'));
    const themeToggle = document.querySelector('[data-theme-toggle]');
    const themeLabel = document.querySelector('[data-theme-current]');

    const renderHost = (key) => {
        const host = HOSTS[key];
        if (!host) return;
        root.dataset.host = key;

        if (brandEl) {
            brandEl.querySelector('.host-brand__mark').textContent = host.mark;
            brandEl.querySelector('.host-brand__name').textContent = host.name;
            brandEl.querySelector('.host-brand__hint').textContent = host.hint;
        }
        if (navEl) {
            navEl.replaceChildren(
                ...host.navItems.map((label, idx) => {
                    const a = document.createElement('a');
                    a.className = 'host-nav__item' + (idx === 0 ? ' is-active' : '');
                    a.textContent = label;
                    return a;
                })
            );
        }
        if (sidebarEl) {
            sidebarEl.replaceChildren(
                ...host.sidebar.map((group) => {
                    const wrap = document.createElement('div');
                    wrap.className = 'host-sidebar__group';
                    const title = document.createElement('div');
                    title.className = 'host-sidebar__title';
                    title.textContent = group.title;
                    wrap.append(title);
                    group.items.forEach(([label, num]) => {
                        const item = document.createElement('div');
                        item.className = 'host-sidebar__item';
                        const l = document.createElement('span');
                        l.textContent = label;
                        const n = document.createElement('span');
                        n.className = 'num';
                        n.textContent = num;
                        item.append(l, n);
                        wrap.append(item);
                    });
                    return wrap;
                })
            );
        }

        hostBtns.forEach((btn) => {
            btn.setAttribute('aria-pressed', String(btn.dataset.hostValue === key));
        });
    };

    hostBtns.forEach((btn) => {
        btn.addEventListener('click', () => renderHost(btn.dataset.hostValue));
    });

    poseBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
            const pose = btn.dataset.poseValue;
            poseBtns.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
            document.dispatchEvent(new CustomEvent('xj:request-pose', { detail: { pose } }));
        });
    });

    document.addEventListener('xj:pose', (event) => {
        const pose = event.detail?.pose;
        if (!pose) return;
        document.documentElement.dataset.pose = pose;
        poseBtns.forEach((b) => {
            b.setAttribute('aria-pressed', String(b.dataset.poseValue === pose));
        });
    });

    const updateThemeLabel = () => {
        if (themeLabel) themeLabel.textContent = window.xjTheme.current();
    };
    updateThemeLabel();
    themeToggle?.addEventListener('click', () => {
        window.xjTheme.toggle();
    });
    document.addEventListener('xj:theme', updateThemeLabel);

    /* init */
    renderHost(root.dataset.host || 'customs');
})();
