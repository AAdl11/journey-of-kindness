/* Journey of Kindness — one trilingual, level-aware feedback passport. */
(function () {
    'use strict';

    const FORM_VERSION = 'kindness_passport_2026_08';
    const params = new URLSearchParams(location.search);
    const fields = {
        clarity: 'entry.1836795989', difficulty: 'entry.80604527',
        helpful: 'entry.522681155', algorithm: 'entry.557430297'
    };
    const languageValues = {
        zh: '繁體中文（zh-TW）', en: 'English（en）', es: 'Español（es）'
    };
    const helpfulValues = [
        ['story', 'Story｜故事', '📖'],
        ['visual', 'Algorithm visualization｜演算法視覺呈現', '✨'],
        ['controls', 'Choices and controls｜選擇與操作', '🎮'],
        ['art', 'Art and music｜圖像與音樂', '🎨'],
        ['ataraxy', 'Ataraxy Portico｜靜心之門', '🪷']
    ];
    const copy = {
        zh: {
            eyebrow: '善的演算法護照', title: '留下你的演算法足跡',
            intro: '約 30 秒，完全自願。你的回饋會幫助我們把故事、演算法、操作、圖像與音樂做得更好。',
            levelLabel: '你剛完成哪一關？', chooseLevel: '請選擇關卡', levelKicker: '演算法印章',
            clarityQuestion: '玩完後，演算法有多清楚？', clarityHelp: '1＝還不清楚　5＝非常清楚',
            difficultyQuestion: '這一關的難度如何？', difficultyHelp: '1＝太簡單　5＝太困難',
            helpfulQuestion: '哪一部分對你最有幫助？', noQuiz: '這不是考試，只想知道你帶走了什麼。',
            optional: '選填', stuckQuestion: '哪裡讓你困惑或卡住？', improveQuestion: '如果只改一件事，你希望我們改什麼？',
            stuckPlaceholder: '例如：某個按鈕、說明、轉場或故事點……', improvePlaceholder: '你的點子可以很短。',
            submit: '送出善的足跡', notNow: '先不用，回到關卡', privacy: '不收集電子郵件；請不要填寫姓名或其他個人資料。',
            sending: '正在送出……', submitError: '請先完成上面的必填選項。',
            thanksTitle: '謝謝你留下善的足跡！', thanksBody: '你的回饋已送出，會成為下一次改進的依據。',
            returnLevel: '回到遊戲', another: '回饋另一關',
            helpful: {story:'故事',visual:'演算法視覺呈現',controls:'選擇與操作',art:'圖像與音樂',ataraxy:'靜心之門'}
        },
        en: {
            eyebrow: 'Kindness Algorithm Passport', title: 'Leave your algorithm footprint',
            intro: 'About 30 seconds and completely optional. Your feedback helps improve the story, algorithms, controls, art, and music.',
            levelLabel: 'Which level did you just complete?', chooseLevel: 'Choose a level', levelKicker: 'Algorithm stamp',
            clarityQuestion: 'How clear was the algorithm after playing?', clarityHelp: '1 = not clear yet　5 = very clear',
            difficultyQuestion: 'How difficult was this level?', difficultyHelp: '1 = too easy　5 = too difficult',
            helpfulQuestion: 'What part helped you most?', noQuiz: 'This is not a test—we only want to know what stayed with you.',
            optional: 'Optional', stuckQuestion: 'What confused you or caused you to get stuck?', improveQuestion: 'If we improved one thing, what should it be?',
            stuckPlaceholder: 'For example: a button, instruction, transition, or story moment…', improvePlaceholder: 'A short idea is perfect.',
            submit: 'Send my kindness footprint', notNow: 'Not now—return to level', privacy: 'No email is collected. Please do not enter your name or other personal information.',
            sending: 'Sending…', submitError: 'Please complete the required choices above.',
            thanksTitle: 'Thank you for leaving a kindness footprint!', thanksBody: 'Your feedback was sent and will guide the next improvement.',
            returnLevel: 'Return to the game', another: 'Review another level',
            helpful: {story:'Story',visual:'Algorithm visualization',controls:'Choices and controls',art:'Art and music',ataraxy:'Ataraxy Portico'}
        },
        es: {
            eyebrow: 'Pasaporte de Algoritmos de Bondad', title: 'Deja tu huella algorítmica',
            intro: 'Toma unos 30 segundos y es totalmente opcional. Tus comentarios nos ayudan a mejorar la historia, los algoritmos, los controles, el arte y la música.',
            levelLabel: '¿Qué nivel acabas de completar?', chooseLevel: 'Elige un nivel', levelKicker: 'Sello del algoritmo',
            clarityQuestion: 'Después de jugar, ¿qué tan claro quedó el algoritmo?', clarityHelp: '1 = aún no está claro　5 = muy claro',
            difficultyQuestion: '¿Qué tan difícil fue este nivel?', difficultyHelp: '1 = demasiado fácil　5 = demasiado difícil',
            helpfulQuestion: '¿Qué parte te ayudó más?', noQuiz: 'No es un examen; solo queremos saber qué aprendiste.',
            optional: 'Opcional', stuckQuestion: '¿Qué te confundió o dónde te atascaste?', improveQuestion: 'Si mejoráramos una sola cosa, ¿cuál debería ser?',
            stuckPlaceholder: 'Por ejemplo: un botón, una instrucción, una transición o parte de la historia…', improvePlaceholder: 'Una idea breve es perfecta.',
            submit: 'Enviar mi huella de bondad', notNow: 'Ahora no—volver al nivel', privacy: 'No se recopila tu correo. No escribas tu nombre ni otros datos personales.',
            sending: 'Enviando…', submitError: 'Completa primero las opciones obligatorias.',
            thanksTitle: '¡Gracias por dejar una huella de bondad!', thanksBody: 'Tus comentarios fueron enviados y guiarán la próxima mejora.',
            returnLevel: 'Volver al juego', another: 'Comentar otro nivel',
            helpful: {story:'Historia',visual:'Visualización del algoritmo',controls:'Opciones y controles',art:'Arte y música',ataraxy:'Portal de la Serenidad'}
        }
    };
    const levels = {
        1: {
            value:'Level 1｜A* Search（A* 搜尋）', symbol:'A*', color:'#16737a', soft:'#d9f1f0',
            title:{zh:'A* 搜尋｜找到善的路徑',en:'A* Search | Find a Path to Kindness',es:'Búsqueda A* | Encuentra el camino de la bondad'},
            story:{zh:'你在成本與未來估計之間，找到一條能真正抵達的路。',en:'You balanced cost-so-far with an estimate of what remained.',es:'Equilibraste el costo recorrido con una estimación de lo que faltaba.'},
            question:{zh:'A* 靠什麼選擇下一條路？',en:'What helped A* choose the next route?',es:'¿Qué ayudó a A* a elegir la siguiente ruta?'},
            options:[
                ['L1_COST','只看目前已花的成本','Only the cost so far','Solo el costo recorrido'],
                ['L1_ESTIMATE','只看剩餘距離的估計','Only the estimated distance remaining','Solo la distancia restante estimada'],
                ['L1_BOTH','同時考慮目前成本與未來估計','Both cost so far and the future estimate','El costo recorrido y la estimación futura'],
                ['L1_UNSURE','我還不確定','I am still not sure','Aún no estoy seguro/a']]
        },
        2: {
            value:'Level 2｜Propositional Logic（命題邏輯）', symbol:'P→Q', color:'#7257b5', soft:'#eee8fb',
            title:{zh:'命題邏輯｜讓結論有根據',en:'Propositional Logic | Give Conclusions a Foundation',es:'Lógica proposicional | Fundamenta las conclusiones'},
            story:{zh:'一個結論不是猜出來的，而是讓事實依規則連起來。',en:'A conclusion was not guessed; facts and rules made it follow.',es:'La conclusión no fue una adivinanza: surgió de hechos y reglas.'},
            question:{zh:'最後的結論為什麼成立？',en:'What made the final conclusion valid?',es:'¿Qué hizo válida la conclusión final?'},
            options:[['L2_FACTS','只有事實','Facts alone','Solo los hechos'],['L2_RULES','只有規則','Rules alone','Solo las reglas'],['L2_COMBINED','事實與邏輯規則結合','Facts combined with logical rules','Hechos combinados con reglas lógicas'],['L2_UNSURE','我還不確定','I am still not sure','Aún no estoy seguro/a']]
        },
        3: {
            value:'Level 3｜Markov Decision Process（馬可夫決策過程）', symbol:'MDP', color:'#db6a4f', soft:'#fde8e2',
            title:{zh:'馬可夫決策過程｜想得更遠',en:'Markov Decision Process | Think Beyond Now',es:'Proceso de decisión de Markov | Mira más allá'},
            story:{zh:'每一次選擇都不只影響現在，也會改變接下來可能發生的事。',en:'Each choice affected not only now, but also what could happen next.',es:'Cada decisión afectó el presente y también lo que podía ocurrir después.'},
            question:{zh:'MDP 要你同時考慮什麼？',en:'What did the MDP ask you to consider?',es:'¿Qué te pidió considerar el MDP?'},
            options:[['L3_NOW','只有眼前的回饋','Only the immediate reward','Solo la recompensa inmediata'],['L3_FINAL','只有最後結果','Only the final outcome','Solo el resultado final'],['L3_FUTURE','現在的回饋與未來後果','Current reward and future consequences','La recompensa actual y las consecuencias futuras'],['L3_UNSURE','我還不確定','I am still not sure','Aún no estoy seguro/a']]
        },
        4: {
            value:'Level 4｜Knowledge-Based Agent / Wumpus World（知識型代理）', symbol:'KB', color:'#2f7f62', soft:'#e0f1e8',
            title:{zh:'知識型代理｜從線索推理安全',en:'Knowledge-Based Agent | Infer Safety from Clues',es:'Agente basado en conocimiento | Infiere seguridad'},
            story:{zh:'代理看不到整個世界，卻能用感知與知識庫做出推論。',en:'The agent could not see the whole world, but inferred from percepts and knowledge.',es:'El agente no veía todo el mundo, pero infería usando percepciones y conocimiento.'},
            question:{zh:'代理如何判斷一個位置安全？',en:'How did the agent decide a place was safe?',es:'¿Cómo decidió el agente que un lugar era seguro?'},
            options:[['L4_HIDDEN','偷看隱藏地圖','By looking at a hidden map','Mirando un mapa oculto'],['L4_INFER','從感知與知識庫推論','By inferring from percepts and the knowledge base','Infiriendo de las percepciones y la base de conocimiento'],['L4_RANDOM','隨機猜測','By guessing randomly','Adivinando al azar'],['L4_UNSURE','我還不確定','I am still not sure','Aún no estoy seguro/a']]
        },
        5: {
            value:'Level 5｜Bayesian Networks（貝氏網路）', symbol:'P(H|E)', color:'#ba6d22', soft:'#faecd9',
            title:{zh:'貝氏網路｜讓信念隨證據更新',en:'Bayesian Networks | Update Belief with Evidence',es:'Redes bayesianas | Actualiza creencias con evidencia'},
            story:{zh:'新的證據出現時，原本的相信程度也應該跟著改變。',en:'When new evidence appeared, the strength of a belief changed with it.',es:'Cuando apareció nueva evidencia, también cambió la fuerza de la creencia.'},
            question:{zh:'什麼讓貝氏信念改變？',en:'What changed the Bayesian belief?',es:'¿Qué cambió la creencia bayesiana?'},
            options:[['L5_EVIDENCE','新的證據','New evidence','Nueva evidencia'],['L5_FIXED','永遠不變的固定規則','A fixed rule that never changes','Una regla fija que nunca cambia'],['L5_FINAL','只有最後答案','Only the final answer','Solo la respuesta final'],['L5_UNSURE','我還不確定','I am still not sure','Aún no estoy seguro/a']]
        },
        6: {
            value:'Level 6｜First-Order Logic（一階邏輯）', symbol:'∀x', color:'#8d4d91', soft:'#f2e3f3',
            title:{zh:'一階邏輯｜看見事實之間的關係',en:'First-Order Logic | See Relationships among Facts',es:'Lógica de primer orden | Ve relaciones entre hechos'},
            story:{zh:'不只看一筆紀錄，也要看人物、關係與規則，才能修正誤判。',en:'Correcting a misjudgment required facts, relationships, and rules—not one record.',es:'Corregir el error requirió hechos, relaciones y reglas, no un solo registro.'},
            question:{zh:'什麼修正了系統的誤判？',en:'What corrected the system misjudgment?',es:'¿Qué corrigió el error de juicio del sistema?'},
            options:[['L6_RECORD','只看一筆孤立紀錄','One isolated record','Un registro aislado'],['L6_RELATIONS','事實、關係與邏輯推論','Facts, relationships, and logical inference','Hechos, relaciones e inferencia lógica'],['L6_RANDOM','隨機覆蓋原判斷','A random override','Una anulación al azar'],['L6_UNSURE','我還不確定','I am still not sure','Aún no estoy seguro/a']]
        },
        7: {
            value:'Level 7｜AI Alignment（人工智慧對齊）', symbol:'AI↔人', color:'#bc5368', soft:'#f8e3e8',
            title:{zh:'AI 對齊｜讓目標不離開人的價值',en:'AI Alignment | Keep Goals Connected to Human Values',es:'Alineación de IA | Conecta metas con valores humanos'},
            story:{zh:'做得快不等於做得對；不同的人與後果都需要被看見。',en:'Doing something quickly is not the same as doing it rightly; people and consequences matter.',es:'Hacer algo rápido no equivale a hacerlo bien; importan las personas y las consecuencias.'},
            question:{zh:'對齊的 AI 應該考慮什麼？',en:'What should aligned AI consider?',es:'¿Qué debería considerar una IA alineada?'},
            options:[['L7_FAST','只有最快的結果','Only the fastest result','Solo el resultado más rápido'],['L7_VALUES','人的價值、利害關係人與後果','Human values, stakeholders, and consequences','Valores humanos, partes interesadas y consecuencias'],['L7_FIRST','只有程式設計者的第一句指令','Only the programmer’s first instruction','Solo la primera instrucción del programador'],['L7_UNSURE','我還不確定','I am still not sure','Aún no estoy seguro/a']]
        },
        8: {
            value:'Level 8｜Minimax · Alpha-Beta Pruning · MCTS', symbol:'🌳', color:'#365c9e', soft:'#e2eafb',
            title:{zh:'萬千未來之樹｜三種看見未來的方法',en:'The Tree of Many Futures | Three Ways to Look Ahead',es:'El árbol de muchos futuros | Tres formas de anticipar'},
            story:{zh:'從最壞情況、剪去不必要分支，到用模擬排練許多可能的未來。',en:'You moved from worst-case planning, to pruning, to rehearsing many futures through simulation.',es:'Pasaste de planear el peor caso, a podar ramas y ensayar muchos futuros mediante simulaciones.'},
            question:{zh:'三幕演算法最主要的差別是什麼？',en:'What changed across the three algorithm acts?',es:'¿Qué cambió entre los tres actos algorítmicos?'},
            options:[['L8_THREE','Minimax 看最壞情況；Alpha-Beta 略過無關分支；MCTS 模擬許多未來','Minimax plans for the worst case; Alpha-Beta skips irrelevant branches; MCTS rehearses many futures','Minimax planea el peor caso; Alpha-Beta omite ramas irrelevantes; MCTS ensaya muchos futuros'],['L8_SAME','三種方法完全一樣','All three methods are the same','Los tres métodos son iguales'],['L8_RANDOM','三種方法都只是隨機選擇','All three only make random choices','Los tres solo eligen al azar'],['L8_UNSURE','我還不確定','I am still not sure','Aún no estoy seguro/a']]
        }
    };

    const $ = selector => document.querySelector(selector);
    let lang = normalizeLanguage(params.get('lang') || localStorage.getItem('jok-lang') || document.documentElement.lang || 'en');
    let level = normalizeLevel(params.get('level'));
    let submitting = false;

    function normalizeLanguage(value) {
        value = String(value || '').toLowerCase();
        if (value.startsWith('zh')) return 'zh';
        if (value.startsWith('es')) return 'es';
        return 'en';
    }
    function normalizeLevel(value) {
        const number = Number(value);
        return Number.isInteger(number) && number >= 1 && number <= 8 ? number : 0;
    }
    function send(name, extra) {
        if (typeof window.gtag !== 'function') return;
        window.gtag('event', name, Object.assign({level: level || 'unselected', ui_language: lang, survey_version: FORM_VERSION}, extra || {}));
    }
    function preserveAnswers() {
        const data = {};
        new FormData($('#passport-form')).forEach((value, key) => { if (!key.startsWith('entry.755') && !key.startsWith('entry.146')) data[key] = value; });
        return data;
    }
    function restoreAnswers(data) {
        Object.keys(data || {}).forEach(name => {
            const value = data[name];
            const field = Array.from(document.querySelectorAll(`[name="${name}"]`)).find(el => el.value === value) || document.querySelector(`[name="${name}"]`);
            if (!field) return;
            if (field.type === 'radio') field.checked = true; else field.value = value;
        });
    }
    function fillStaticCopy() {
        document.documentElement.lang = lang === 'zh' ? 'zh-TW' : lang;
        document.title = copy[lang].title + ' | Journey of Kindness';
        document.querySelectorAll('[data-i18n]').forEach(node => { node.textContent = copy[lang][node.dataset.i18n] || ''; });
        document.querySelectorAll('[data-placeholder]').forEach(node => { node.placeholder = copy[lang][node.dataset.placeholder] || ''; });
        document.querySelectorAll('[data-lang]').forEach(button => {
            const active = button.dataset.lang === lang;
            button.classList.toggle('active', active);
            button.setAttribute('aria-pressed', String(active));
        });
        $('#backend-language').value = languageValues[lang];
    }
    function renderLevelSelect() {
        const select = $('#level-select');
        const selected = select.value || String(level || '');
        select.innerHTML = `<option value="">${copy[lang].chooseLevel}</option>` + Object.keys(levels).map(number => {
            const item = levels[number];
            return `<option value="${number}">Level ${number} · ${escapeHtml(item.title[lang].split('|')[0].trim())}</option>`;
        }).join('');
        select.value = selected;
    }
    function renderRatings() {
        const configs = [
            ['clarity', fields.clarity, copy[lang].clarityHelp],
            ['difficulty', fields.difficulty, copy[lang].difficultyHelp]
        ];
        configs.forEach(([key, name, label]) => {
            const selected = document.querySelector(`[data-rating="${key}"] input:checked`);
            const value = selected && selected.value;
            document.querySelector(`[data-rating="${key}"]`).innerHTML = [1,2,3,4,5].map(number => `<label><input type="radio" name="${name}" value="${number}" required${String(number) === value ? ' checked' : ''}><span aria-label="${escapeHtml(label)}: ${number}">${number}</span></label>`).join('');
        });
    }
    function renderHelpful() {
        const selected = document.querySelector(`[name="${fields.helpful}"]:checked`);
        const value = selected && selected.value;
        $('#helpful-options').innerHTML = helpfulValues.map(([key, backend, icon]) => `<label class="choice-card"><input type="radio" name="${fields.helpful}" value="${escapeHtml(backend)}" required${backend === value ? ' checked' : ''}><span class="choice-content"><span class="choice-icon" aria-hidden="true">${icon}</span><span class="choice-label">${escapeHtml(copy[lang].helpful[key])}</span></span></label>`).join('');
    }
    function renderAlgorithm() {
        if (!level) return;
        const item = levels[level];
        const selected = document.querySelector(`[name="${fields.algorithm}"]:checked`);
        const selectedCode = selected && selected.value.split(' | ')[0];
        $('#algorithm-question').textContent = item.question[lang];
        $('#algorithm-options').innerHTML = item.options.map(option => {
            const backend = `${option[0]} | ${option[2]}`;
            return `<label class="choice-card"><input type="radio" name="${fields.algorithm}" value="${escapeHtml(backend)}" required${option[0] === selectedCode ? ' checked' : ''}><span class="choice-content"><span class="choice-icon" aria-hidden="true">◈</span><span class="choice-label">${escapeHtml(option[{zh:1,en:2,es:3}[lang]])}</span></span></label>`;
        }).join('');
    }
    function renderLevel() {
        const form = $('#passport-form');
        const welcome = $('#level-welcome');
        if (!level) {
            form.hidden = true; welcome.hidden = true; $('#level-stamp').textContent = '?';
            return;
        }
        const item = levels[level];
        document.documentElement.style.setProperty('--level', item.color);
        document.documentElement.style.setProperty('--level-soft', item.soft);
        $('#level-stamp').textContent = level;
        $('#algorithm-symbol').textContent = item.symbol;
        $('#level-kicker').textContent = `${copy[lang].levelKicker} · Level ${level}`;
        $('#level-title').textContent = item.title[lang];
        $('#level-story').textContent = item.story[lang];
        $('#backend-level').value = item.value;
        const returnUrl = params.get('source') === 'outro' ? '../' : `../level${level}/`;
        $('#return-link').href = returnUrl;
        $('#success-return').href = returnUrl;
        welcome.hidden = false; form.hidden = false;
        renderAlgorithm();
    }
    function render(options) {
        const saved = options && options.preserve ? preserveAnswers() : {};
        fillStaticCopy(); renderLevelSelect(); renderRatings(); renderHelpful(); renderLevel(); restoreAnswers(saved);
    }
    function escapeHtml(value) {
        return String(value).replace(/[&<>"]/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[character]));
    }

    document.querySelectorAll('[data-lang]').forEach(button => button.addEventListener('click', () => {
        if (lang === button.dataset.lang) return;
        lang = button.dataset.lang; localStorage.setItem('jok-lang', lang);
        params.set('lang', lang); history.replaceState(null, '', `${location.pathname}?${params}`);
        render({preserve:true}); send('feedback_language_change');
    }));
    $('#level-select').addEventListener('change', event => {
        level = normalizeLevel(event.target.value);
        if (level) params.set('level', String(level)); else params.delete('level');
        params.set('lang', lang); history.replaceState(null, '', `${location.pathname}?${params}`);
        render({preserve:false}); send('feedback_level_select');
        if (level) $('#level-welcome').scrollIntoView({behavior:'smooth', block:'nearest'});
    });
    $('#passport-form').addEventListener('submit', event => {
        if (!event.currentTarget.checkValidity()) {
            $('#form-status').textContent = copy[lang].submitError;
            return;
        }
        submitting = true;
        $('#form-status').textContent = copy[lang].sending;
        $('#submit-button').disabled = true;
        send('feedback_submit_attempt');
    });
    $('#feedback-transport').addEventListener('load', () => {
        if (!submitting) return;
        submitting = false;
        $('#passport-form').hidden = true;
        $('#level-welcome').hidden = true;
        $('#success-panel').hidden = false;
        $('#success-panel').scrollIntoView({behavior:'smooth', block:'center'});
        send('feedback_submit_transport_complete');
    });
    $('#another-response').addEventListener('click', () => {
        $('#passport-form').reset(); level = 0; params.delete('level');
        history.replaceState(null, '', `${location.pathname}?${params}`);
        $('#success-panel').hidden = true; $('#submit-button').disabled = false; $('#form-status').textContent = '';
        render({preserve:false}); $('#level-select').focus();
    });

    render({preserve:false});
    send('feedback_page_view', {source: params.get('source') || 'level_completion'});
})();
