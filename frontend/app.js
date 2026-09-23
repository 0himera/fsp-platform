const app = document.getElementById('app');
const toast = document.getElementById('toast');

const state = { me: null, competitions: [], rankings: [], disciplines: [], detail: null };
const levels = {
  rf_championship: 'Чемпионат / Кубок России',
  all_russian: 'Всероссийское соревнование',
  interregional: 'Межрегиональное соревнование',
  rd_championship: 'Чемпионат / Кубок Дагестана',
  regional: 'Региональное соревнование'
};
const ranks = { none: 'Без разряда', III: 'III разряд', II: 'II разряд', I: 'I разряд', KMS: 'КМС', MS: 'МС', MSMK: 'МСМК', ZMS: 'ЗМС' };
const statuses = { draft: 'Черновик', open: 'Регистрация открыта', running: 'Идёт соревнование', completed: 'Завершено' };
const stages = { standalone: 'Отдельный зачёт', qualification: 'Отбор', final: 'Финал' };

function h(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

function fmtDate(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(value));
}

function fmtDateTime(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

function fmtPoints(value) {
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 }).format(value || 0);
}

function localDate(value) {
  const date = value ? new Date(value) : new Date();
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function discipline(code) {
  return state.disciplines.find(item => item.code === code)?.name || code;
}

async function api(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  const response = await fetch(path, { credentials: 'same-origin', ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Ошибка ${response.status}`);
  return data;
}

function notify(message, error = false) {
  toast.textContent = message;
  toast.className = error ? 'show error' : 'show';
  clearTimeout(notify.timer);
  notify.timer = setTimeout(() => { toast.className = ''; }, 3500);
}

async function refresh() {
  const [me, competitions, rankings, disciplines] = await Promise.all([
    api('/api/me').catch(() => null),
    api('/api/competitions'),
    api('/api/rankings'),
    api('/api/disciplines')
  ]);
  state.me = me;
  state.competitions = competitions;
  state.rankings = rankings.athletes;
  state.disciplines = disciplines;
}

function layout(content, title) {
  const user = state.me?.user;
  const path = location.pathname;
  const nav = [
    ['/', 'Соревнования'],
    ['/rankings', 'Рейтинг'],
    ['/info', 'Информация'],
    [user?.role === 'organizer' ? '/admin' : '/profile', user?.role === 'organizer' ? 'Организатор' : 'Мой профиль']
  ];
  return `<div class="site">
    <header class="site-header"><div class="header-inner">
      <a href="/" data-link class="brand"><span class="brand-mark">{ }</span><span><strong>АРЕНА</strong><small>ФСП ДАГЕСТАНА</small></span></a>
      <nav aria-label="Основная навигация">${nav.map(([url, label]) => `<a href="${url}" data-link class="${path === url || (url === '/' && path.startsWith('/competitions')) ? 'active' : ''}">${label}</a>`).join('')}</nav>
      <div class="account">${user ? `<span>${h(user.full_name || 'Организатор')}</span><button type="button" class="link-button" data-action="logout">Выйти</button>` : `<a href="/login" data-link>Войти</a>`}</div>
    </div></header>
    <main class="container"><div class="page-title"><h1>${h(title)}</h1></div>${content}</main>
    <footer>Арена ФСП РД · Внутренний рейтинг не заменяет официальные спортивные разряды.</footer>
  </div>`;
}

function competitionCard(c) {
  return `<article class="card competition" data-search="${h((c.title + ' ' + discipline(c.discipline_code)).toLowerCase())}">
    <div class="card-head"><span class="tag ${h(c.status)}">${h(statuses[c.status] || c.status)}</span><span class="subtle">${h(stages[c.stage] || stages.standalone)} · ${h(c.format === 'team' ? 'Команды' : 'Личный зачёт')}</span></div>
    <h2><a href="/competitions/${c.id}" data-link>${h(c.title)}</a></h2>
    <p class="subtle">${h(discipline(c.discipline_code))}</p>
    <div class="meta"><span>${h(fmtDate(c.starts_at))}</span><span>${h(c.location || 'Онлайн')}</span><span>${c.registrations_count} заявок</span></div>
    <div class="card-bottom"><span>${h(levels[c.level_code] || c.level_code)}</span><a href="/competitions/${c.id}" data-link>Подробнее →</a></div>
  </article>`;
}

function competitionsPage() {
  const list = [...state.competitions].sort((a, b) => {
    const order = { open: 0, running: 1, completed: 2, draft: 3 };
    return (order[a.status] - order[b.status]) || new Date(b.starts_at) - new Date(a.starts_at);
  });
  return `<div class="intro"><p>Соревнования, заявки и опубликованные результаты в одном месте.</p>
    ${state.me?.user.role === 'organizer' ? '<a class="button primary" href="/admin" data-link>Управление соревнованиями</a>' : ''}</div>
    <div class="toolbar"><input id="event-search" type="search" placeholder="Найти соревнование" aria-label="Найти соревнование"><span class="subtle">${list.length} соревнований</span></div>
    <div class="cards" id="competition-list">${list.length ? list.map(competitionCard).join('') : '<div class="empty">Пока нет соревнований.</div>'}</div>`;
}

function rankingPage() {
  const rows = state.rankings.map(a => `<tr data-search="${h((a.full_name + ' ' + a.city).toLowerCase())}">
    <td><strong>${a.rating_place}</strong></td><td><a href="/athletes/${a.id}" data-link>${h(a.full_name)}</a><small>${h(a.city || a.organization || '')}</small></td>
    <td>${h(ranks[a.rank_code] || a.rank_code)}</td><td class="number">${h(fmtPoints(a.result_points))}</td><td class="number">${h(fmtPoints(a.rank_points))}</td><td class="number total">${h(fmtPoints(a.rating))}</td></tr>`).join('');
  return `<p class="intro-text">Рейтинг учитывает четыре лучших результата и подтверждённый разряд. Каждый балл можно проверить в профиле спортсмена.</p>
    <div class="toolbar"><input id="ranking-search" type="search" placeholder="Найти спортсмена" aria-label="Найти спортсмена"><span class="subtle">${state.rankings.length} спортсменов</span></div>
    <div class="card table-scroll"><table><thead><tr><th>№</th><th>Спортсмен</th><th>Разряд</th><th class="number">Соревнования</th><th class="number">Разряд</th><th class="number">Итого</th></tr></thead><tbody id="ranking-rows">${rows || '<tr><td colspan="6">Пока нет спортсменов.</td></tr>'}</tbody></table></div>
    <details class="card rules"><summary>Как рассчитывается рейтинг</summary><p>Баллы результата = уровень × коэффициент места × поправка на число финишировавших × относительное место × давность. Отбор не даёт рейтинговых очков; финал считается по этой формуле. Последнее место и зачёт с одним участником дают 0. Учитываются четыре лучших результата.</p><p>Очки плавно снижаются до нуля за три года. Бонус за разряд снижается по времени с последнего результативного выступления и обнуляется через два года.</p></details>`;
}

function resultList(results, format) {
  if (!results.length) return '<p class="subtle">Протокол пока не опубликован.</p>';
  return `<div class="card table-scroll"><table><thead><tr><th>Место</th><th>${format === 'team' ? 'Команда' : 'Спортсмен'}</th><th>Результат</th></tr></thead><tbody>${results.map(r => `<tr><td><strong>${r.place}</strong></td><td>${r.athlete_id ? `<a href="/athletes/${r.athlete_id}" data-link>${h(r.name)}</a>` : h(r.name)}</td><td>${h(r.score_text || '—')}</td></tr>`).join('')}</tbody></table></div>`;
}

function registrationsList(registrations) {
  if (!registrations.length) return '<p class="subtle">Заявок пока нет.</p>';
  return `<div class="card table-scroll"><table><thead><tr><th>Спортсмен</th><th>Город</th><th>Организация</th></tr></thead><tbody>${registrations.map(r => `<tr><td><a href="/athletes/${r.athlete_id}" data-link>${h(r.full_name)}</a></td><td>${h(r.city || '—')}</td><td>${h(r.organization || '—')}</td></tr>`).join('')}</tbody></table></div>`;
}

function teamList(teams) {
  if (!teams.length) return '<p class="subtle">Команды ещё не сформированы.</p>';
  return `<div class="cards">${teams.map(t => `<div class="card team"><div class="card-head"><strong>${h(t.name)}</strong>${state.me?.user.role === 'organizer' && !state.detail.results.length ? `<button class="link-button" data-action="delete-team" data-id="${t.id}">Удалить</button>` : ''}</div><p class="subtle">${t.members.map(m => h(m.full_name)).join(', ')}</p></div>`).join('')}</div>`;
}

function teamForm(detail) {
  const assigned = new Set(detail.teams.flatMap(t => t.members.map(m => m.athlete_id)));
  const available = detail.registrations.filter(r => !assigned.has(r.athlete_id));
  if (!available.length) return '<p class="subtle">Все зарегистрированные спортсмены уже состоят в командах.</p>';
  return `<details class="card form-panel"><summary>Сформировать команду</summary><form data-form="team" data-id="${detail.competition.id}">
    <label>Название команды<input name="name" required maxlength="100" placeholder="Название команды"></label>
    <fieldset><legend>Участники из заявок</legend>${available.map(r => `<label class="checkbox"><input type="checkbox" name="member_ids" value="${r.athlete_id}"> ${h(r.full_name)}</label>`).join('')}</fieldset>
    <button class="button primary" type="submit">Создать команду</button></form></details>`;
}

function resultsForm(detail) {
  const c = detail.competition;
  const entries = c.format === 'team' ? detail.teams.map(t => ({ id: t.id, name: t.name })) : detail.registrations.map(r => ({ id: r.athlete_id, name: r.full_name }));
  if (!entries.length) return '<p class="subtle">Для публикации протокола нужны зарегистрированные участники или команды.</p>';
  const existing = new Map(detail.results.map(r => [r.team_id || r.athlete_id, r]));
  return `<details class="card form-panel"><summary>${detail.results.length ? 'Исправить протокол' : 'Опубликовать результаты'}</summary>
    <form data-form="results" data-id="${c.id}"><p class="subtle">Укажите места финишировавших. Пустое место означает, что участник не завершил зачёт. Публикация завершит соревнование.${c.stage === 'qualification' ? ' Результаты отбора сохранятся без рейтинговых очков.' : ' Рейтинг пересчитается.'}</p>
    ${entries.map((entry, i) => `<div class="result-input"><strong>${h(entry.name)}</strong><label>Место<input type="number" min="1" max="${entries.length}" name="place_${entry.id}" value="${existing.get(entry.id)?.place ?? (detail.results.length ? '' : i + 1)}"></label><label>Результат<input type="text" maxlength="200" name="score_${entry.id}" value="${h(existing.get(entry.id)?.score_text || '')}" placeholder="Баллы, задачи…"></label></div>`).join('')}
    <button class="button primary" type="submit">Опубликовать протокол</button></form></details>`;
}

function competitionForm(existing = null) {
  const now = Date.now();
  const c = existing || { title: '', level_code: 'regional', discipline_code: state.disciplines[0]?.code || 'algorithmic', format: 'individual', stage: 'standalone', starts_at: new Date(now - 3600000).toISOString(), ends_at: new Date(now + 5 * 3600000).toISOString(), registration_deadline: new Date(now + 3 * 3600000).toISOString(), location: '', description: '', status: 'open' };
  return `<details class="card form-panel" ${existing ? '' : 'open'}><summary>${existing ? 'Редактировать соревнование' : 'Создать соревнование'}</summary>
    <form data-form="competition" data-id="${existing?.id || ''}"><div class="form-grid">
      <label class="wide">Название<input name="title" value="${h(c.title)}" minlength="3" maxlength="160" required></label>
      <label>Уровень<select name="level_code">${Object.entries(levels).map(([key, label]) => `<option value="${key}" ${c.level_code === key ? 'selected' : ''}>${h(label)}</option>`).join('')}</select></label>
      <label>Дисциплина<select name="discipline_code">${state.disciplines.map(d => `<option value="${h(d.code)}" ${c.discipline_code === d.code ? 'selected' : ''}>${h(d.name)}</option>`).join('')}</select></label>
      <label>Формат<select name="format"><option value="individual" ${c.format === 'individual' ? 'selected' : ''}>Личный</option><option value="team" ${c.format === 'team' ? 'selected' : ''}>Командный</option></select></label>
      <label>Этап<select name="stage">${Object.entries(stages).map(([key, label]) => `<option value="${key}" ${c.stage === key ? 'selected' : ''}>${h(label)}</option>`).join('')}</select></label>
      <label>Отбор для финала<select name="qualifying_competition_id"><option value="">Не выбран</option>${state.competitions.filter(item => item.stage === 'qualification' && item.id !== c.id).map(item => `<option value="${item.id}" ${c.qualifying_competition_id === item.id ? 'selected' : ''}>${h(item.title)}</option>`).join('')}</select></label>
      <label>Проходное место в финал<input type="number" name="qualifying_place_limit" min="1" max="10000" value="${c.qualifying_place_limit || ''}" placeholder="Например, 200"></label>
      <label>Статус<select name="status">${['draft', 'open', 'running'].map(key => `<option value="${key}" ${c.status === key ? 'selected' : ''}>${statuses[key]}</option>`).join('')}</select></label>
      <label>Начало<input type="datetime-local" name="starts_at" value="${localDate(c.starts_at)}" required></label>
      <label>Завершение<input type="datetime-local" name="ends_at" value="${localDate(c.ends_at)}" required></label>
      <label>Заявки до<input type="datetime-local" name="registration_deadline" value="${localDate(c.registration_deadline)}" required></label>
      <label>Место<input name="location" value="${h(c.location)}" maxlength="160" placeholder="Город или онлайн"></label>
      <label class="wide">Описание<textarea name="description" maxlength="3000">${h(c.description)}</textarea></label>
    </div><button class="button primary" type="submit">${existing ? 'Сохранить' : 'Создать'}</button></form></details>`;
}

function competitionDetailPage(detail) {
  const c = detail.competition;
  const user = state.me?.user;
  const qualifier = state.competitions.find(item => item.id === c.qualifying_competition_id);
  const finals = state.competitions.filter(item => item.qualifying_competition_id === c.id);
  const canRegister = user?.role === 'athlete' && c.status === 'open' && new Date(c.registration_deadline) > new Date();
  const registerAction = !user ? `<a class="button primary" href="/login" data-link>Войти для заявки</a>` : canRegister && !detail.registered ? `<button class="button primary" data-action="register" data-id="${c.id}">Подать заявку</button>` : canRegister && detail.registered ? `<button class="button secondary" data-action="unregister" data-id="${c.id}">Отменить заявку</button>` : '';
  return `<p class="back"><a href="/" data-link>← Все соревнования</a></p>
    <div class="card detail-head"><div class="card-head"><span class="tag ${h(c.status)}">${h(statuses[c.status])}</span><span class="subtle">${h(stages[c.stage] || stages.standalone)} · ${h(levels[c.level_code])}</span></div>
      <h2>${h(c.title)}</h2><p>${h(c.description || 'Описание будет добавлено организатором.')}</p>
      <div class="meta"><span>Начало: ${h(fmtDateTime(c.starts_at))}</span><span>Заявки до: ${h(fmtDateTime(c.registration_deadline))}</span><span>${h(c.location || 'Онлайн')}</span><span>${h(discipline(c.discipline_code))}</span><span>${c.format === 'team' ? 'Командный зачёт' : 'Личный зачёт'}</span></div>
      ${qualifier ? `<p><a href="/competitions/${qualifier.id}" data-link>← Протокол отбора: ${h(qualifier.title)}</a></p>` : ''}
      ${c.stage === 'final' ? `<p class="subtle">В финал проходят участники отбора до ${c.qualifying_place_limit}-го места.</p>` : ''}
      ${finals.map(item => `<p><a href="/competitions/${item.id}" data-link>Финал: ${h(item.title)} →</a></p>`).join('')}
      ${c.stage === 'qualification' ? '<p class="subtle">Отбор определяет участников финала и не начисляет рейтинговых очков.</p>' : ''}
      <div class="actions">${registerAction}${detail.registered ? '<span class="success">Вы зарегистрированы</span>' : ''}</div>
    </div>
    <section><h2>Результаты</h2>${resultList(detail.results, c.format)}</section>
    ${c.format === 'team' ? `<section><h2>Команды</h2>${teamList(detail.teams)}</section>` : ''}
    <section><h2>Участники · ${detail.registrations.length}</h2>${registrationsList(detail.registrations)}</section>
    ${user?.role === 'organizer' ? `<section><h2>Управление</h2>${c.status !== 'completed' ? competitionForm(c) : ''}${c.format === 'team' && c.status !== 'completed' ? teamForm(detail) : ''}${resultsForm(detail)}</section>` : ''}`;
}

function athletePage(a, own = false) {
  const resultCards = a.results.map(result => `<div class="card result"><div><strong>${h(result.competition)}</strong><p class="subtle">${h(fmtDate(result.ends_at))} · ${h(stages[result.stage] || stages.standalone)} · ${h(discipline(result.discipline))} · ${result.place}-е из ${result.finishers}</p>
    <small>${h(levels[result.level])} · место ×${h(fmtPoints(result.place_factor))} · масштаб ×${h(fmtPoints(result.size_factor))} · относительное место ×${h(fmtPoints(result.relative_factor))} · давность ×${h(fmtPoints(result.decay))}</small></div>
    <div class="result-points"><strong>${h(fmtPoints(result.points))}</strong><small>${result.stage === 'qualification' ? 'Отбор · без очков' : result.included ? 'В топ-4' : 'Не входит'}</small></div></div>`).join('');
  return `<div class="card athlete-head"><div><span class="tag">${h(ranks[a.rank_code] || a.rank_code)}</span><h2>${h(a.full_name)}</h2><p class="subtle">${h([a.city, a.organization].filter(Boolean).join(' · ') || 'Данные профиля')}</p><p class="subtle">${h(a.disciplines.map(discipline).join(', ') || 'Дисциплины пока не указаны')}</p></div>
    <div class="big-score"><strong>${h(fmtPoints(a.rating))}</strong><span>баллов · № ${a.rating_place}</span></div></div>
    <div class="score-grid"><div class="card"><span>Лучшие результаты</span><strong>${h(fmtPoints(a.result_points))}</strong></div><div class="card"><span>Разряд</span><strong>+${h(fmtPoints(a.rank_points))}</strong></div><div class="card"><span>Активность</span><strong>${Math.round(a.activity_factor * 100)}%</strong></div></div>
    ${own ? profileForm(a) : ''}
    ${state.me?.user.role === 'organizer' ? rankForm(a) : ''}
    <section><h2>История результатов</h2>${resultCards || '<div class="empty">Результатов пока нет.</div>'}</section>
    ${own ? `<section><h2>Мои заявки</h2><div id="my-registrations" class="subtle">Загрузка…</div></section>` : ''}`;
}

function profileForm(a) {
  return `<details class="card form-panel"><summary>Редактировать профиль</summary><form data-form="profile"><div class="form-grid">
    <label>ФИО<input name="full_name" value="${h(a.full_name)}" required></label><label>Город<input name="city" value="${h(a.city)}"></label>
    <label class="wide">Организация<input name="organization" value="${h(a.organization)}"></label>
    <fieldset class="wide"><legend>Дисциплины</legend>${state.disciplines.map(d => `<label class="checkbox"><input type="checkbox" name="disciplines" value="${h(d.code)}" ${a.disciplines.includes(d.code) ? 'checked' : ''}> ${h(d.name)}</label>`).join('')}</fieldset>
    </div><button class="button primary" type="submit">Сохранить профиль</button></form></details>`;
}

function rankForm(a) {
  return `<details class="card form-panel"><summary>Подтвердить разряд</summary><form data-form="rank" data-id="${a.id}" class="inline-form"><label>Разряд<select name="rank_code">${Object.entries(ranks).map(([code, name]) => `<option value="${code}" ${a.rank_code === code ? 'selected' : ''}>${name}</option>`).join('')}</select></label><button class="button primary" type="submit">Сохранить</button></form></details>`;
}

function adminPage() {
  if (state.me?.user.role !== 'organizer') return '<div class="empty">Войдите под аккаунтом организатора для управления соревнованиями.</div>';
  return `<p class="intro-text">Создайте соревнование, откройте заявки, затем внесите итоговый протокол. Профили и рейтинг обновятся автоматически.</p>
    ${competitionForm()}
    <details class="card form-panel"><summary>Справочник дисциплин</summary>
      ${state.disciplines.map(d => `<form data-form="discipline-rename" data-code="${h(d.code)}" class="inline-form"><label>${h(d.code)}<input name="name" value="${h(d.name)}" required maxlength="120"></label><button class="button" type="submit">Сохранить</button></form>`).join('')}
      <form data-form="discipline-create" class="inline-form"><label>Код<input name="code" pattern="[a-z][a-z0-9_]{1,31}" placeholder="new_discipline" required></label><label>Название<input name="name" maxlength="120" required></label><button class="button" type="submit">Добавить</button></form>
    </details>
    <section><h2>Все соревнования</h2><div class="cards">${state.competitions.map(competitionCard).join('') || '<div class="empty">Соревнований пока нет.</div>'}</div></section>`;
}

function informationPage() {
  return `<p class="intro-text">Единая площадка Федерации спортивного программирования Республики Дагестан для спортсменов, соревнований и результатов.</p>
    <div class="cards">
      <article class="card team"><h2>Календарь</h2><p class="subtle">Предстоящие и завершённые старты, заявки и итоговые протоколы.</p><a href="/" data-link class="button">Открыть соревнования</a></article>
      <article class="card team"><h2>Методика рейтинга</h2><p class="subtle">Уровень турнира, место, число финишировавших, давность и подтверждённый разряд.</p><a href="/rankings" data-link class="button">Посмотреть правила</a></article>
      <article class="card team"><h2>Новости</h2><p class="subtle">Платформа работает в пилотном режиме. Здесь будут публиковаться новости Федерации и анонсы стартов.</p></article>
      <article class="card team"><h2>Документы и материалы</h2><p class="subtle">Раздел предусмотрен для положений, регламентов и правил вида спорта. Материалы добавляются Федерацией после утверждения.</p></article>
    </div>`;
}

function authPage(register = false) {
  return `<div class="card auth-card"><h2>${register ? 'Создать аккаунт спортсмена' : 'Войти в аккаунт'}</h2><form data-form="${register ? 'register' : 'login'}">
    ${register ? '<label>ФИО<input name="full_name" required minlength="2" autocomplete="name"></label>' : ''}
    <label>Электронная почта<input type="email" name="email" required autocomplete="email"></label>
    <label>Пароль<input type="password" name="password" required minlength="8" autocomplete="${register ? 'new-password' : 'current-password'}"></label>
    ${register ? '<label>Город<input name="city"></label><label>Организация<input name="organization"></label>' : ''}
    <button class="button primary" type="submit">${register ? 'Зарегистрироваться' : 'Войти'}</button></form>
    <p class="subtle">${register ? 'Уже есть аккаунт? <a href="/login" data-link>Войти</a>' : 'Нет аккаунта? <a href="/register" data-link>Зарегистрироваться</a>'}</p></div>`;
}

let renderId = 0;
async function render() {
  const id = ++renderId;
  const path = location.pathname;
  try {
    let content, title;
    if (path === '/' || path === '/competitions') { title = 'Соревнования'; content = competitionsPage(); }
    else if (path === '/rankings') { title = 'Рейтинг спортсменов'; content = rankingPage(); }
    else if (path === '/info') { title = 'Информация'; content = informationPage(); }
    else if (path === '/admin') { title = 'Кабинет организатора'; content = adminPage(); }
    else if (path === '/login') { title = 'Вход'; content = authPage(false); }
    else if (path === '/register') { title = 'Регистрация'; content = authPage(true); }
    else if (path === '/profile') {
      if (!state.me?.athlete) { go('/login'); return; }
      title = 'Мой профиль'; content = athletePage(state.me.athlete, true);
    } else if (/^\/competitions\/\d+$/.test(path)) {
      state.detail = await api(`/api${path}`);
      title = 'Соревнование'; content = competitionDetailPage(state.detail);
    } else if (/^\/athletes\/\d+$/.test(path)) {
      const athlete = await api(`/api${path}`);
      title = 'Профиль спортсмена'; content = athletePage(athlete);
    } else { title = 'Страница не найдена'; content = '<p>Проверьте адрес или вернитесь к <a href="/" data-link>соревнованиям</a>.</p>'; }
    if (id !== renderId) return;
    document.title = `${title} · Арена ФСП РД`;
    app.innerHTML = layout(content, title);
    if (path === '/profile') {
      api('/api/me/registrations').then(items => {
        const target = document.getElementById('my-registrations');
        if (target) target.innerHTML = items.length ? items.map(c => `<p><a href="/competitions/${c.id}" data-link>${h(c.title)}</a> · ${h(statuses[c.status])}</p>`).join('') : 'Заявок пока нет.';
      }).catch(() => {});
    }
  } catch (error) {
    if (id === renderId) app.innerHTML = layout(`<div class="empty">${h(error.message)}</div>`, 'Ошибка');
  }
}

function go(path) {
  history.pushState({}, '', path);
  window.scrollTo(0, 0);
  render();
}

async function afterChange(message, path = location.pathname) {
  await refresh();
  notify(message);
  go(path);
}

document.addEventListener('click', async event => {
  const link = event.target.closest('a[data-link]');
  if (link && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
    event.preventDefault(); go(link.getAttribute('href')); return;
  }
  const button = event.target.closest('[data-action]');
  if (!button) return;
  const action = button.dataset.action;
  const id = button.dataset.id;
  button.disabled = true;
  try {
    if (action === 'retry') { await refresh(); await render(); return; }
    if (action === 'logout') { await api('/api/auth/logout', { method: 'POST' }); await afterChange('Вы вышли из аккаунта', '/'); }
    if (action === 'register') { await api(`/api/competitions/${id}/register`, { method: 'POST' }); await afterChange('Заявка подана'); }
    if (action === 'unregister') { await api(`/api/competitions/${id}/register`, { method: 'DELETE' }); await afterChange('Заявка отменена'); }
    if (action === 'delete-team') { await api(`/api/competitions/${state.detail.competition.id}/teams/${id}`, { method: 'DELETE' }); await afterChange('Команда удалена'); }
  } catch (error) { notify(error.message, true); }
  finally { button.disabled = false; }
});

document.addEventListener('input', event => {
  const value = event.target.value?.trim().toLowerCase();
  if (event.target.id === 'event-search') document.querySelectorAll('#competition-list .competition').forEach(item => item.hidden = !item.dataset.search.includes(value));
  if (event.target.id === 'ranking-search') document.querySelectorAll('#ranking-rows tr[data-search]').forEach(item => item.hidden = !item.dataset.search.includes(value));
});

document.addEventListener('submit', async event => {
  const form = event.target.closest('form[data-form]');
  if (!form) return;
  event.preventDefault();
  const button = form.querySelector('button[type=submit]');
  button.disabled = true;
  const data = new FormData(form);
  try {
    switch (form.dataset.form) {
      case 'login': {
        const result = await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ email: data.get('email'), password: data.get('password') }) });
        await afterChange('Вы вошли в аккаунт', result.user.role === 'organizer' ? '/admin' : '/profile');
        break;
      }
      case 'register': {
        await api('/api/auth/register', { method: 'POST', body: JSON.stringify({ email: data.get('email'), password: data.get('password'), full_name: data.get('full_name'), city: data.get('city'), organization: data.get('organization') }) });
        await afterChange('Аккаунт создан', '/profile');
        break;
      }
      case 'profile': {
        await api('/api/me', { method: 'PATCH', body: JSON.stringify({ full_name: data.get('full_name'), city: data.get('city'), organization: data.get('organization'), disciplines: data.getAll('disciplines') }) });
        await afterChange('Профиль обновлён');
        break;
      }
      case 'rank': {
        await api(`/api/athletes/${form.dataset.id}/rank`, { method: 'PATCH', body: JSON.stringify({ rank_code: data.get('rank_code') }) });
        await afterChange('Разряд обновлён');
        break;
      }
      case 'discipline-create': {
        await api('/api/disciplines', { method: 'POST', body: JSON.stringify({ code: data.get('code'), name: data.get('name') }) });
        await afterChange('Дисциплина добавлена');
        break;
      }
      case 'discipline-rename': {
        await api(`/api/disciplines/${form.dataset.code}`, { method: 'PUT', body: JSON.stringify({ name: data.get('name') }) });
        await afterChange('Название дисциплины обновлено');
        break;
      }
      case 'competition': {
        const payload = Object.fromEntries(['title', 'level_code', 'discipline_code', 'format', 'stage', 'location', 'description', 'status'].map(key => [key, data.get(key)]));
        payload.qualifying_competition_id = payload.stage === 'final' ? Number(data.get('qualifying_competition_id')) || null : null;
        if (payload.stage === 'final' && !payload.qualifying_competition_id) throw new Error('Выберите отбор для финала');
        payload.qualifying_place_limit = payload.stage === 'final' ? Number(data.get('qualifying_place_limit')) || null : null;
        if (payload.stage === 'final' && !payload.qualifying_place_limit) throw new Error('Укажите проходное место в финал');
        for (const key of ['starts_at', 'ends_at', 'registration_deadline']) payload[key] = new Date(data.get(key)).toISOString();
        const existing = form.dataset.id;
        const result = await api(existing ? `/api/competitions/${existing}` : '/api/competitions', { method: existing ? 'PUT' : 'POST', body: JSON.stringify(payload) });
        await afterChange(existing ? 'Соревнование обновлено' : 'Соревнование создано', `/competitions/${result.id}`);
        break;
      }
      case 'team': {
        await api(`/api/competitions/${form.dataset.id}/teams`, { method: 'POST', body: JSON.stringify({ name: data.get('name'), member_ids: data.getAll('member_ids').map(Number) }) });
        await afterChange('Команда сформирована');
        break;
      }
      case 'results': {
        const entries = state.detail.competition.format === 'team' ? state.detail.teams.map(t => t.id) : state.detail.registrations.map(r => r.athlete_id);
        const results = entries.filter(id => data.get(`place_${id}`)).map(id => ({
          [state.detail.competition.format === 'team' ? 'team_id' : 'athlete_id']: id,
          place: Number(data.get(`place_${id}`)), score_text: data.get(`score_${id}`) || ''
        }));
        await api(`/api/competitions/${form.dataset.id}/results`, { method: 'PUT', body: JSON.stringify({ results }) });
        await afterChange('Протокол опубликован, рейтинг пересчитан');
        break;
      }
    }
  } catch (error) { notify(error.message, true); }
  finally { button.disabled = false; }
});

window.addEventListener('popstate', render);
refresh().then(render).catch(error => { app.innerHTML = `<div class="boot"><p>Не удалось загрузить платформу: ${h(error.message)}</p><button class="button" data-action="retry">Повторить</button></div>`; });
