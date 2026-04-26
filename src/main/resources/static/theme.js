/* xiaojieAI · theme manager
   ----------------------------------------------------------------------------
   - 跟随系统偏好；用户显式切换后写入 localStorage
   - data-theme="light"|"dark" 写在 <html>
   - 切换时给 <html> 加 .theme-transitioning，触发 tokens.css 中的扫描线动效
   - 暴露 window.xjTheme.{current, set, toggle}, 并广播 'xj:theme' 事件
   -------------------------------------------------------------------------- */
(function () {
    const STORAGE_KEY = 'xj-theme';
    const root = document.documentElement;
    const media = window.matchMedia('(prefers-color-scheme: light)');

    const resolveInitial = () => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === 'light' || stored === 'dark') return stored;
        return media.matches ? 'light' : 'dark';
    };

    const apply = (theme, withTransition = false) => {
        if (withTransition) {
            root.classList.add('theme-transitioning');
            window.setTimeout(() => root.classList.remove('theme-transitioning'), 560);
        }
        root.dataset.theme = theme;
        document.dispatchEvent(new CustomEvent('xj:theme', { detail: { theme } }));
    };

    apply(resolveInitial());

    media.addEventListener('change', (event) => {
        if (!localStorage.getItem(STORAGE_KEY)) {
            apply(event.matches ? 'light' : 'dark');
        }
    });

    window.xjTheme = {
        current: () => root.dataset.theme,
        set: (theme) => {
            if (theme !== 'light' && theme !== 'dark') return;
            localStorage.setItem(STORAGE_KEY, theme);
            apply(theme, true);
        },
        toggle: () => {
            const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
            window.xjTheme.set(next);
        },
        clearOverride: () => {
            localStorage.removeItem(STORAGE_KEY);
            apply(media.matches ? 'light' : 'dark', true);
        }
    };
})();
