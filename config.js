// LP・予約ページの設定。ここを書き換えるだけで文面・窓口・予約枠が変わります。
window.SITE = {
  owner: "嶋田 悠人",
  tel: "070-2250-0331",
  email: "yutoshimada0301@gmail.com",
  // 予約の送信先（Google Apps Script のウェブアプリURL）。空の間はメール送信画面に切り替わる。
  // 設定手順は README.md の「予約ページの有効化」を参照。
  bookingEndpoint: "https://script.google.com/macros/s/AKfycbw3LQB5exZI2Nl5sLZdB8jyZewd4uTX2Fd18XzYSGshZ2GJkQrWV0WFZSHAkc7vNJhS/exec",
  lineUrl: "",
  // 試作例（公開済みのダミー店舗のデモのみ載せる。実在の店舗は許可なく載せない）
  demoUrl: "https://yuto31777.github.io/yuto31-demos/yohaku-coffee/",
  // 予約枠：open は営業日（0=日〜6=土）、hours は開始時刻、horizonDays は何日先まで受けるか
  slots: {
    open: [1, 2, 3, 4, 5, 6, 0],
    hours: { weekday: ["19:30", "20:00", "20:30"], weekend: ["10:00", "11:00", "13:00", "14:00", "15:00", "16:00"] },
    minLeadDays: 1,
    horizonDays: 21,
    closedDates: []
  }
};
