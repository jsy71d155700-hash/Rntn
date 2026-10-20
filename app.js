const TRIP_START = new Date("2026-11-02T00:00:00+09:00");
const TRIP_END = new Date("2026-11-06T00:00:00+09:00");
const DAYS = [
  {
    date:"11월 2일", weekday:"월요일", english:"MONDAY · DAY 01",
    events:[
      ["06:50","학교 집합","학교 → 청주공항 이동"],
      ["07:40","청주공항 도착 후 수속",""],
      ["09:10–10:10","청주 → 제주 이동","항공편 세부 정보는 학교 안내 확인"],
      ["10:10–10:50","인원점검 및 버스탑승",""],
      ["11:00–12:00","중식","또와요집 등 메뉴 표기는 원본 이미지 재확인 필요",true],
      ["12:40–15:00","애월카페거리 자유시간",""],
      ["15:30–17:00","해수욕장 자유시간","원본 장소명 판독 확인 필요",true],
      ["17:30","숙소 도착",""],
      ["17:50–18:30","숙소 석식 배정 및 체크인","원본의 괄호 안 숙소/장소명 판독 확인 필요",true],
      ["18:30–20:30","올레시장 자유시간","석식: 개별 자유식"],
      ["22:00","숙소 복귀 후 점호 및 취침",""]
    ]
  },
  {
    date:"11월 3일", weekday:"화요일", english:"TUESDAY · DAY 02",
    events:[
      ["08:00","호텔 조식 후 출발","원본 시간 표기 확인 필요",true],
      ["09:20–12:00","마라도","왕복 약 1시간 소요, 체류시간 약 100분"],
      ["12:40–14:00","중식","식당명 원본 이미지 판독 확인 필요",true],
      ["14:30–16:00","휴애리자연생활공원","원본 괄호 안 세부 내용 판독 확인 필요",true],
      ["16:00–16:30","감귤 따기 체험","1인 1봉지 선물"],
      ["17:30–18:00","숙소 석식 배정 및 체크인","원본 표기: 글로스터호텔 함덕으로 보임 — 확인 필요",true],
      ["18:30–19:30","석식","호텔 뷔페식"],
      ["22:00","개인 자유시간 후 점호 및 취침",""]
    ]
  },
  {
    date:"11월 4일", weekday:"수요일", english:"WEDNESDAY · DAY 03",
    events:[
      ["09:00","호텔 조식 후 출발",""],
      ["09:30–11:30","에코랜드 테마파크",""],
      ["11:40–12:50","산굼부리",""],
      ["13:10–14:10","중식","원본 식당명 판독 확인 필요",true],
      ["14:30–15:30","스카이워터쇼",""],
      ["16:00–18:00","제주난타공연","공연 시작 16:30"],
      ["18:30–19:30","숙소 복귀 후 석식","호텔 뷔페식"],
      ["19:30–21:00","레크리에이션","호텔 내 강당"],
      ["22:00","자유시간 후 점호 및 취침",""]
    ]
  },
  {
    date:"11월 5일", weekday:"목요일", english:"THURSDAY · DAY 04",
    events:[
      ["09:00","호텔 조식 후 출발",""],
      ["09:00–10:00","함덕해수욕장","호텔 조식과 시간이 겹쳐 원본 확인 필요",true],
      ["10:20–11:00","국립제주박물관",""],
      ["11:20–12:50","중식","원본 식당명 판독 확인 필요",true],
      ["13:10","청주공항 도착 후 수속","시간 순서가 항공편 출발 시각과 맞는지 학교 확인 필요",true],
      ["14:45–15:50","제주 → 청주 이동",""],
      ["15:50–16:20","인원점검 및 버스탑승",""],
      ["17:20","학교 도착 후 해산",""]
    ]
  }
];

const $ = (s) => document.querySelector(s);
const scheduleList = $("#scheduleList");
let selectedDay = 0;
let installPrompt = null;
let toastTimer;

function koreaNow() {
  return new Date(new Date().toLocaleString("en-US", {timeZone:"Asia/Seoul"}));
}
function renderCountdown() {
  const now = koreaNow();
  const start = new Date(2026, 10, 2, 0, 0, 0);
  const end = new Date(2026, 10, 6, 0, 0, 0);
  const days = Math.ceil((start - now) / 86400000);
  const countdown = $("#countdown");
  if (now >= start && now < end) {
    countdown.textContent = `DAY ${Math.floor((now-start)/86400000)+1}`;
    $("#countdownTitle").textContent = "제주도 수학여행 중!";
  } else if (now >= end) {
    countdown.textContent = "여행 완료";
    $("#countdownTitle").textContent = "함께한 추억을 오래 간직하자";
  } else {
    countdown.textContent = days >= 0 ? `D-${days}` : "D-DAY";
    $("#countdownTitle").textContent = "제주도 수학여행까지";
  }
  const total = start - new Date(2026, 0, 1);
  const elapsed = now - new Date(2026, 0, 1);
  $("#progressBar").style.width = `${Math.max(0,Math.min(100,elapsed/total*100))}%`;
  $("#todayLabel").textContent = `${now.getMonth()+1}월 ${now.getDate()}일 기준`;
}
function renderDay(index) {
  selectedDay = index;
  const day = DAYS[index];
  $("#dayEyebrow").textContent = day.english;
  $("#dayTitle").textContent = `${day.date} ${day.weekday}`;
  $("#eventCount").textContent = `일정 ${day.events.length}개`;
  document.querySelectorAll(".day-tab").forEach((b) => {
    const active = Number(b.dataset.day) === index;
    b.classList.toggle("active", active);
    b.setAttribute("aria-pressed", String(active));
  });
  scheduleList.innerHTML = "";
  day.events.forEach(([time,title,detail,needsCheck]) => {
    const row = document.createElement("article");
    row.className = "event";
    const timeEl = document.createElement("div");
    timeEl.className = "event-time";
    timeEl.textContent = time;
    const marker = document.createElement("div");
    marker.className = "event-marker";
    const content = document.createElement("div");
    content.className = "event-content";
    const h = document.createElement("h4");
    h.textContent = title;
    content.appendChild(h);
    if (detail) {
      const p = document.createElement("p");
      p.textContent = detail;
      content.appendChild(p);
    }
    if (needsCheck) {
      const tag = document.createElement("span");
      tag.className = "event-tag confirm";
      tag.textContent = "학교 확인 필요";
      content.appendChild(tag);
    }
    row.append(timeEl,marker,content);
    scheduleList.appendChild(row);
  });
}
function toast(message) {
  const el = $("#toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 3200);
}
function setPushStatus(message) { $("#pushStatus").textContent = message; }
async function setupOneSignal() {
  const appId = window.APP_CONFIG?.oneSignalAppId;
  if (!appId || appId === "YOUR_ONESIGNAL_APP_ID") {
    setPushStatus("푸시 알림은 OneSignal 설정을 완료한 뒤 사용할 수 있어요.");
    return;
  }
  const sdk = document.createElement("script");
  sdk.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js";
  sdk.defer = true;
  document.head.appendChild(sdk);
  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(async function(OneSignal) {
    try {
      await OneSignal.init({ appId, serviceWorkerPath: "OneSignalSDKWorker.js", serviceWorkerParam: { scope: "/" } });
      const optedIn = OneSignal.User.PushSubscription.optedIn;
      setPushStatus(optedIn ? "이 기기는 푸시 알림을 받을 수 있도록 설정되어 있어요." : "알림을 켜면 일정 안내를 받을 수 있어요.");
      $("#enablePush").textContent = optedIn ? "알림 설정됨" : "알림 켜기";
    } catch (e) {
      setPushStatus("알림 초기화에 실패했어요. OneSignal App ID와 도메인 설정을 확인해 주세요.");
      console.error(e);
    }
  });
}
$("#dayTabs").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-day]");
  if (btn) renderDay(Number(btn.dataset.day));
});
$("#enablePush").addEventListener("click", async () => {
  const appId = window.APP_CONFIG?.oneSignalAppId;
  if (!appId || appId === "YOUR_ONESIGNAL_APP_ID") {
    toast("먼저 README의 OneSignal 설정을 완료해 주세요.");
    return;
  }
  const button = $("#enablePush");
  button.disabled = true;
  try {
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async function(OneSignal) {
      try {
        await OneSignal.Notifications.requestPermission();
        await OneSignal.User.PushSubscription.optIn();
        setPushStatus("알림 설정을 요청했어요. 브라우저의 권한 상태를 확인해 주세요.");
        button.textContent = "알림 설정됨";
        toast("알림 설정을 요청했어요.");
      } catch (err) {
        toast("알림 설정에 실패했어요. 홈 화면 추가와 브라우저 권한을 확인해 주세요.");
      } finally { button.disabled = false; }
    });
  } catch (e) {
    button.disabled = false;
    toast("알림을 설정할 수 없어요. 브라우저 설정을 확인해 주세요.");
  }
});
window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  installPrompt = event;
  $("#installBtn").classList.remove("hidden");
});
$("#installBtn").addEventListener("click", async () => {
  if (!installPrompt) return;
  installPrompt.prompt();
  await installPrompt.userChoice;
  installPrompt = null;
  $("#installBtn").classList.add("hidden");
});
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(console.warn));
}
renderCountdown();
renderDay(0);
setupOneSignal();
setInterval(renderCountdown, 60000);
