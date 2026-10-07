// 予約フォーム。空き枠の取得と送信は Google Apps Script（apps-script/Code.gs）に任せる。
// bookingEndpoint が未設定のときは、入力内容を載せたメール作成画面に切り替える。
(function () {
  var S = window.SITE, C = S.slots;
  var $ = function (id) { return document.getElementById(id); };
  var picked = { date: "", time: "" };
  var taken = {}; // {"2026-10-10 19:30": true}
  var WD = ["日", "月", "火", "水", "木", "金", "土"];

  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function ymd(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function msg(text, ok, boxId) {
    var box = $(boxId || "msg"); box.innerHTML = text ? '<div class="msg ' + (ok ? "ok" : "ng") + '"></div>' : "";
    if (text) box.firstChild.textContent = text;
  }

  function openDays() {
    var out = [], base = new Date(); base.setHours(0, 0, 0, 0);
    for (var i = C.minLeadDays; i <= C.horizonDays; i++) {
      var d = new Date(base); d.setDate(base.getDate() + i);
      if (C.open.indexOf(d.getDay()) >= 0 && C.closedDates.indexOf(ymd(d)) < 0) out.push(d);
    }
    return out;
  }
  function hoursFor(dateStr) {
    var dow = new Date(dateStr + "T00:00:00").getDay();
    return (dow === 0 || dow === 6) ? C.hours.weekend : C.hours.weekday;
  }

  function renderDays() {
    var box = $("days"); box.innerHTML = "";
    openDays().forEach(function (d) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "chip"; b.setAttribute("aria-pressed", "false");
      b.textContent = (d.getMonth() + 1) + "/" + d.getDate() + "（" + WD[d.getDay()] + "）";
      b.onclick = function () {
        picked.date = ymd(d); picked.time = "";
        [].forEach.call(box.children, function (c) { c.setAttribute("aria-pressed", c === b ? "true" : "false"); });
        renderTimes();
      };
      box.appendChild(b);
    });
  }
  function renderTimes() {
    var box = $("times"); box.innerHTML = "";
    hoursFor(picked.date).forEach(function (t) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "chip"; b.setAttribute("aria-pressed", "false"); b.textContent = t;
      b.disabled = !!taken[picked.date + " " + t];
      b.onclick = function () {
        picked.time = t;
        [].forEach.call(box.children, function (c) { c.setAttribute("aria-pressed", c === b ? "true" : "false"); });
      };
      box.appendChild(b);
    });
  }

  function loadTaken() {
    if (!S.bookingEndpoint) return Promise.resolve();
    return fetch(S.bookingEndpoint + "?action=taken").then(function (r) { return r.json(); })
      .then(function (j) { (j.taken || []).forEach(function (k) { taken[k] = true; }); })
      .catch(function () { /* 取得できなくても予約自体は続行（重複は送信時にサーバー側で判定） */ });
  }

  function payload() {
    return {
      date: picked.date, time: picked.time, mode: $("mode").value, store: $("store").value.trim(),
      name: $("name").value.trim(), contact: $("contact").value.trim(), kind: $("kind").value,
      note: $("note").value.trim(), hp: $("hp").value, page: location.href
    };
  }
  function validate(p) {
    if (!p.date || !p.time) return "ご希望の日付と時間を選んでください。";
    if (!p.store || !p.name || !p.contact) return "お店の名前・お名前・ご連絡先を入力してください。";
    return "";
  }
  function mailFallback(p) {
    var body = ["【無料相談の予約】", "日時：" + p.date + " " + p.time, "方法：" + p.mode, "お店：" + p.store, "お名前：" + p.name,
      "連絡先：" + p.contact, "業種：" + p.kind, "ご要望：" + p.note].join("\n");
    location.href = "mailto:" + S.email + "?subject=" + encodeURIComponent("無料相談の予約（" + p.date + " " + p.time + "）") + "&body=" + encodeURIComponent(body);
    msg("メール作成画面が開きます。そのまま送信してください。開かない場合は " + S.email + " 宛にご連絡ください。", true);
  }

  $("f").addEventListener("submit", function (e) {
    e.preventDefault();
    var p = payload(), err = validate(p);
    if (err) return msg(err, false);
    if (!S.bookingEndpoint) return mailFallback(p);
    var btn = $("submit"); btn.disabled = true; btn.textContent = "送信中…";
    // Content-Type を text/plain にすると事前確認(preflight)が不要になり、Apps Script で受け取れる
    fetch(S.bookingEndpoint, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(p) })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (j.ok) { $("f").style.display = "none"; msg("ご予約を受け付けました（" + p.date + " " + p.time + "）。確認メールをお送りします。届かない場合は " + S.email + " までご連絡ください。", true, "done"); }
        else { msg(j.error || "送信できませんでした。", false); if (j.taken) { taken[p.date + " " + p.time] = true; renderTimes(); } }
      })
      .catch(function () { msg("通信に失敗しました。お手数ですが " + S.tel + " または " + S.email + " までご連絡ください。", false); })
      .then(function () { btn.disabled = false; btn.textContent = "この内容で予約する"; });
  });

  // 名刺・提案書のQRは ?store=店名 付きで開く。店名を入力欄に入れておく
  try {
    var q = new URLSearchParams(location.search).get("store");
    if (q) $("store").value = q.slice(0, 100);
  } catch (e) { /* 古いブラウザでは何もしない */ }

  renderDays();
  loadTaken().then(function () { if (picked.date) renderTimes(); });
})();
