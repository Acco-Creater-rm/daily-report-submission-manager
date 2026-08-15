(() => {
  "use strict";

  const STORAGE_KEY = "daily-report-submissions";
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
  const today = new Date();
  const todayKey = toDateKey(today);

  const elements = {
    todayDate: document.getElementById("today-date"),
    todayStatus: document.getElementById("today-status"),
    submitButton: document.getElementById("submit-button"),
    weekendMessage: document.getElementById("weekend-message"),
    monthInput: document.getElementById("month-input"),
    businessDays: document.getElementById("business-days"),
    submittedDays: document.getElementById("submitted-days"),
    submissionRate: document.getElementById("submission-rate"),
    tableBody: document.getElementById("monthly-table-body")
  };

  function toDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function toMonthValue(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  }

  function isBusinessDay(date) { return date.getDay() >= 1 && date.getDay() <= 5; }

  function getRecords() {
    try {
      const records = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return records && typeof records === "object" ? records : {};
    } catch (_) {
      return {};
    }
  }

  function saveRecords(records) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }

  function formatTime(timestamp) {
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return "—";
    return new Intl.DateTimeFormat("ja-JP", { hour: "2-digit", minute: "2-digit", hour12: false }).format(date);
  }

  function renderToday() {
    elements.todayDate.textContent = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日（${weekdays[today.getDay()]}）`;
    const businessDay = isBusinessDay(today);
    const record = getRecords()[todayKey];
    elements.submitButton.hidden = Boolean(record);
    elements.submitButton.disabled = !businessDay;
    elements.weekendMessage.hidden = true;

    if (!businessDay) {
      elements.todayStatus.textContent = "本日は営業日ではありません";
      elements.todayStatus.className = "today-status";
    } else if (record) {
      elements.todayStatus.innerHTML = `<span class="status-submitted">提出済 ☑</span><span class="registered-time">${formatTime(record)} に登録</span>`;
    } else {
      elements.todayStatus.innerHTML = '<span class="status-pending">未提出</span>';
    }
  }

  function renderMonthly() {
    const [yearString, monthString] = elements.monthInput.value.split("-");
    const year = Number(yearString);
    const month = Number(monthString) - 1;
    if (!Number.isInteger(year) || !Number.isInteger(month)) return;

    const records = getRecords();
    const lastDay = new Date(year, month + 1, 0).getDate();
    const rows = [];
    let businessDayCount = 0;
    let submittedCount = 0;

    for (let day = 1; day <= lastDay; day += 1) {
      const date = new Date(year, month, day);
      if (!isBusinessDay(date)) continue;
      businessDayCount += 1;
      const key = toDateKey(date);
      const record = records[key];
      const isFuture = key > todayKey;
      let status = "未提出";
      let statusClass = "table-pending";
      let time = "—";
      let timeClass = "time-empty";

      if (record) {
        status = "提出済 ☑";
        statusClass = "table-submitted";
        time = formatTime(record);
        timeClass = "";
        submittedCount += 1;
      } else if (isFuture) {
        status = "—";
        statusClass = "table-future";
      }
      rows.push(`<tr><td>${month + 1}/${day}</td><td>${weekdays[date.getDay()]}</td><td class="${statusClass}">${status}</td><td class="${timeClass}">${time}</td></tr>`);
    }

    const rate = businessDayCount === 0 ? 0 : Math.round((submittedCount / businessDayCount) * 100);
    elements.businessDays.textContent = `${businessDayCount}日`;
    elements.submittedDays.textContent = `${submittedCount}日`;
    elements.submissionRate.textContent = `${rate}%`;
    elements.tableBody.innerHTML = rows.join("");
  }

  elements.submitButton.addEventListener("click", () => {
    if (!isBusinessDay(today)) return;
    const records = getRecords();
    if (records[todayKey]) return;
    records[todayKey] = new Date().toISOString();
    saveRecords(records);
    renderToday();
    renderMonthly();
  });

  elements.monthInput.value = toMonthValue(today);
  elements.monthInput.addEventListener("change", renderMonthly);
  renderToday();
  renderMonthly();
})();
