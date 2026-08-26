/* Journey of Kindness: optional, non-blocking post-level feedback card. */
(function () {
    'use strict';

    const script = document.currentScript;
    const level = Number(script && script.dataset.level);
    const SURVEY_PATH = '../feedback/';
    const TARGETS = {
        1: '#ataraxy-screen',
        2: '#ataraxy-screen',
        3: '#meditation-screen',
        4: '#ataraxy-screen',
        5: '#ataraxy-screen',
        6: '#screen-ataraxy .overlay > .text-center',
        7: '#mindfulness-screen .mindfulness-overlay',
        8: '#screen-finish .card'
    };
    const COPY = {
        zh: {
            title: '💛 幫我改進這一關',
            body: '約 30 秒，可略過；用你熟悉的語言留下這一關的演算法足跡。',
            button: '📝 打開善的演算法護照'
        },
        en: {
            title: '💛 Help improve this level',
            body: 'About 30 seconds and optional. Leave this level’s algorithm footprint in your language.',
            button: '📝 Open Kindness Algorithm Passport'
        },
        es: {
            title: '💛 Ayúdame a mejorar este nivel',
            body: 'Toma unos 30 segundos y es opcional. Deja la huella algorítmica de este nivel en tu idioma.',
            button: '📝 Abrir el Pasaporte de Algoritmos'
        }
    };

    let mounted = false;
    let card = null;
    const originalGtag = typeof window.gtag === 'function' ? window.gtag : null;

    function currentLanguage(hint) {
        if (COPY[hint]) return hint;
        const active = document.querySelector('.lang-btn.active, [id^="lang-"][class*="active"]');
        const marker = active && ((active.dataset && active.dataset.lang) || active.id || active.textContent || '');
        if (/\bes\b|spanish/i.test(marker)) return 'es';
        if (/\bzh\b|中文|chinese/i.test(marker)) return 'zh';
        if (/\ben\b|english/i.test(marker)) return 'en';
        const saved = localStorage.getItem('jok-lang');
        return COPY[saved] ? saved : 'en';
    }

    function surveyUrl(language) {
        const url = new URL(SURVEY_PATH, window.location.href);
        url.searchParams.set('level', String(level));
        url.searchParams.set('lang', currentLanguage(language));
        return url.toString();
    }

    function send(name, language) {
        try {
            if (originalGtag) originalGtag('event', name, {
                level: level,
                ui_language: language,
                survey_version: 'kindness_passport_2026_08'
            });
        } catch (e) {}
    }

    function renderLanguage(language) {
        if (!card) return;
        const lang = currentLanguage(language);
        const copy = COPY[lang];
        card.setAttribute('lang', lang === 'zh' ? 'zh-TW' : lang);
        card.querySelector('[data-feedback-title]').textContent = copy.title;
        card.querySelector('[data-feedback-body]').textContent = copy.body;
        card.querySelector('[data-feedback-link]').textContent = copy.button;
        card.querySelector('[data-feedback-link]').dataset.language = lang;
        card.querySelector('[data-feedback-link]').href = surveyUrl(lang);
    }

    function mount(language) {
        if (mounted || !Number.isInteger(level) || level < 1 || level > 8) return;
        const target = document.querySelector(TARGETS[level]);
        if (!target) return;

        mounted = true;
        if (!document.getElementById('jok-feedback-style')) {
            const style = document.createElement('style');
            style.id = 'jok-feedback-style';
            style.textContent = [
                '.jok-feedback-card{position:relative;z-index:40;width:min(460px,calc(100% - 24px));margin:16px auto 4px;padding:14px 16px;border:2px solid rgba(251,191,36,.9);border-radius:18px;background:linear-gradient(145deg,rgba(255,251,235,.97),rgba(254,243,199,.97));box-shadow:0 10px 30px rgba(30,41,59,.25);color:#334155;text-align:center;line-height:1.45;flex:0 0 auto}',
                '.jok-feedback-card h3{margin:0 0 4px;font-size:1.05rem;font-weight:800;color:#92400e}',
                '.jok-feedback-card p{margin:0 0 10px;font-size:.9rem;color:#475569}',
                '.jok-feedback-card a{display:inline-flex;min-height:44px;align-items:center;justify-content:center;padding:10px 18px;border-radius:999px;background:#ea580c;color:#fff!important;text-decoration:none;font-weight:800;box-shadow:0 5px 14px rgba(234,88,12,.3);touch-action:manipulation}',
                '.jok-feedback-card a:hover,.jok-feedback-card a:focus-visible{background:#c2410c;transform:translateY(-1px)}',
                '@media(max-width:640px){.jok-feedback-card{width:calc(100% - 20px);padding:12px;margin-top:12px}.jok-feedback-card h3{font-size:1rem}.jok-feedback-card p{font-size:.84rem}}'
            ].join('');
            document.head.appendChild(style);
        }

        card = document.createElement('section');
        card.className = 'jok-feedback-card';
        card.setAttribute('data-jok-feedback', String(level));
        card.setAttribute('aria-label', 'Journey of Kindness feedback');
        card.innerHTML = '<h3 data-feedback-title></h3><p data-feedback-body></p><a data-feedback-link target="_blank" rel="noopener noreferrer"></a>';
        const link = card.querySelector('[data-feedback-link]');
        link.href = surveyUrl(language);
        link.addEventListener('click', function () {
            send('feedback_open', link.dataset.language || currentLanguage());
        });
        target.appendChild(card);
        renderLanguage(language);
        send('feedback_prompt_view', currentLanguage(language));
    }

    window.gtag = function () {
        const args = Array.prototype.slice.call(arguments);
        if (originalGtag) originalGtag.apply(window, args);
        if (args[0] === 'event' && args[1] === 'level_complete') {
            const params = args[2] || {};
            window.setTimeout(function () { mount(params.ui_language); }, 0);
        }
    };

    document.addEventListener('click', function (event) {
        if (!mounted) return;
        if (event.target.closest('.lang-btn, [id^="lang-"]')) {
            window.setTimeout(function () { renderLanguage(); }, 0);
        }
    });
})();
