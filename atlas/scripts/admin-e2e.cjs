// Сквозной сценарий админки. Требует запущенного сервера, БД и пользователей
// editor@example.org / res@example.org с паролем test-password-123 (npm run admin:create).
// ВНИМАНИЕ: создаёт тестовое событие и меняет статус Sisyphos — запускать только на тестовой БД.
const { chromium } = require('playwright');
const B = process.env.BASE_URL ?? "http://localhost:3000";
(async () => {
  const b = await chromium.launch();
  const login = async (email) => {
    const ctx = await b.newContext(); const p = await ctx.newPage();
    await p.goto(B + '/ru/admin'); await p.fill('input[name=email]', email); await p.fill('input[name=password]', 'test-password-123');
    await Promise.all([p.waitForURL(/\/ru\/admin$/), p.click('button:has-text("Войти")')]); return p;
  };
  // неверный пароль
  const bad = await (await b.newContext()).newPage();
  await bad.goto(B + '/ru/admin'); await bad.fill('input[name=email]', 'res@example.org'); await bad.fill('input[name=password]', 'wrong-password');
  await bad.click('button:has-text("Войти")'); await bad.waitForURL(/error=auth/); console.log('bad login rejected:', bad.url().includes('error=auth'));
  // исследователь создаёт событие
  const r = await login('res@example.org');
  console.log('researcher on verify ->', (await r.goto(B + '/ru/admin/verify'), r.url().endsWith('/ru/admin')));
  await r.goto(B + '/ru/admin/events/new');
  await r.fill('input[name=title]', 'E2E Test Night'); await r.fill('input[name=startAt]', '2027-03-06T23:00');
  await r.selectOption('select[name=city]', 'berlin'); await r.selectOption('select[name=venue]', 'tresor');
  await r.fill('input[name=venueName]', 'Tresor'); await r.fill('textarea[name=lineup]', 'Jeff Mills, Test DJ');
  await r.selectOption('select[name=genres]', ['techno']); await r.fill('input[name=officialUrl]', 'https://example.org/e2e');
  await Promise.all([r.waitForURL(/ok=event-review/), r.click('button:has-text("Сохранить событие")')]);
  console.log('researcher -> review:', r.url().includes('event-review'));
  let pub = await (await fetch(B + '/api/events?city=berlin')).json(); console.log('public before publish:', pub.count);
  // редактор публикует
  const e = await login('editor@example.org');
  await Promise.all([e.waitForURL(/ok=publish/), e.locator('li:has-text("E2E Test Night") button:has-text("Опубликовать")').first().click()]);
  pub = await (await fetch(B + '/api/events?city=berlin')).json(); console.log('public after publish:', pub.count, pub.events[0]?.title, pub.events[0]?.lineup);
  // выпуск фестиваля без источника не принимается браузером, с источником — сохраняется
  await e.goto(B + '/ru/admin/editions/new'); await e.selectOption('select[name=festival]', 'time-warp'); await e.fill('input[name=year]', '2027');
  await e.fill('input[name=startDate]', '2026-04-04');
  await e.fill('input[name=sourceUrl]', 'https://example.org/tw'); await e.fill('input[name=sourceTitle]', 'Test source');
  await Promise.all([e.waitForURL(/error=/), e.click('button:has-text("Сохранить выпуск")')]); console.log('year mismatch rejected:', e.url().includes('error=year'));
  // проверка данных
  await e.goto(B + '/ru/admin/verify?kind=venue');
  const row = e.locator('li:has-text("Sisyphos")'); await row.locator('select').selectOption('verified');
  await Promise.all([e.waitForURL(/ok=venue/), row.locator('button').click()]);
  const html = await (await fetch(B + '/ru/clubs/sisyphos')).text(); console.log('sisyphos verified on site:', html.includes('Проверено'));
  await b.close();
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });
