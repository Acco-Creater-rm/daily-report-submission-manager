(() => {
  'use strict';

  const STORAGE_KEY = 'daily-report-submissions';
  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
  const $ = (id) => document.getElementById(id);
  const today = atStartOfDay(new Date());

  function atStartOfDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  function dateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function monthValue(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  function isBusinessDay(date) {
    const day = date.getDay();
    return day >= 1 && day <= 5;
  }

  function loadSubmissions() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return saved && typeof saved === 'object' ? saved : {};
    } catch {
      return {};
    }
  }

  function saveSubmissions(submissions) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(submissions));
  }

  function formatTime(isoDate) {
    const date = new Date(isoDate);
    return Number.isNaN(date.getTime())
      ? '—'
      : new Intl.DateTimeFormat('ja-JP', { hour: '2-digit', minute: '2-digit', hour12: false }).format(date);
  }

  function formatLongDate(date) {
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日（${weekdays[date.getDay()]}）`;
  }

  function selectedMonthDate() {
    const [year, month] = $('month-picker').value.split('-').map(Number);
    return new Date(year, month - 1, 1);
  }

  function businessDaysInMonth(date) {
    const days = [];
    const cursor = new Date(date.getFullYear(), date.getMonth(), 1);
    while (cursor.getMonth() === date.getMonth()) {
      if (isBusinessDay(cursor)) days.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    return days;
  }

  function addSubmission(key) {
    const submissions = loadSubmissions();
    if (submissions[key]) return;
    submissions[key] = new Date().toISOString();
    saveSubmissions(submissions);
    render();
  }

  function renderToday() {
    $('today-date').textContent = formatLongDate(today);
    const badge = $('today-badge');
    const content = $('today-content');
    const key = dateKey(today);
    const submittedAt = loadSubmissions()[key];

    if (!isBusinessDay(today)) {
      badge.className = 'status-badge is-closed';
      badge.textContent = '休日';
      content.innerHTML = '<p class="status-text">本日は営業日ではありません</p><p class="submitted-time">過去の営業日は月間一覧から登録できます。</p>';
      return;
    }

    if (submittedAt) {
      badge.className = 'status-badge is-submitted';
      badge.textContent = '提出済み';
      content.innerHTML = `<p class="status-text">提出済 ☑</p><p class="submitted-time">${formatTime(submittedAt)} に登録</p>`;
      return;
    }

    badge.className = 'status-badge is-pending';
    badge.textContent = '未提出';
    content.innerHTML = '<p class="status-text pending">未提出</p><button id="submit-today" class="submit-button" type="button">日報を提出済みにする</button>';
    $('submit-today').addEventListener('click', () => addSubmission(key));
  }

  function renderMonth() {
    const month = selectedMonthDate();
    const submissions = loadSubmissions();
    const days = businessDaysInMonth(month);
    const eligibleDays = days.filter((day) => day <= today);
    const submittedEligible = eligibleDays.filter((day) => Boolean(submissions[dateKey(day)])).length;
    const rate = eligibleDays.length ? Math.round((submittedEligible / eligibleDays.length) * 100) : null;
    $('business-days-count').textContent = `${eligibleDays.length}日`;
    $('submitted-days-count').textContent = `${submittedEligible}日`;
    $('submission-rate').textContent = rate === null ? '—' : `${rate}%`;

    $('monthly-table-body').innerHTML = days.map((day) => {
      const key = dateKey(day);
      const submittedAt = submissions[key];
      const isFuture = day > today;
      let status;
      let time = '<span class="dash">—</span>';
      if (submittedAt) {
        status = '<span class="row-status submitted">提出済 ☑</span>';
        time = formatTime(submittedAt);
      } else if (isFuture) {
        status = '<span class="row-status future">—</span>';
      } else {
        status = `<button class="register-button" type="button" data-date="${key}" aria-label="${day.getMonth() + 1}月${day.getDate()}日を提出済みにする"><span>未提出</span>提出済みにする</button>`;
      }
      return `<tr><td>${day.getMonth() + 1}/${day.getDate()}</td><td>${weekdays[day.getDay()]}</td><td>${status}</td><td>${time}</td></tr>`;
    }).join('');

    document.querySelectorAll('.register-button').forEach((button) => {
      button.addEventListener('click', () => addSubmission(button.dataset.date));
    });
  }

  function render() {
    renderToday();
    renderMonth();
  }

  $('month-picker').value = monthValue(today);
  $('month-picker').addEventListener('change', renderMonth);
  render();
})();
