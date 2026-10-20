// Schedule the trip reminders in OneSignal. Call this once after deployment.
const schedule = [
  // Reminder sent 30 minutes before the school assembly.
  { at: "2026-11-02T06:20:00+09:00", title: "제주 수학여행 · 학교 집합", body: "30분 뒤 학교 집합이에요. 준비물을 확인해 주세요!" },
  { at: "2026-11-02T09:00:00+09:00", title: "제주 수학여행 · 제주 이동", body: "청주에서 제주로 이동하는 일정이에요. 인솔 선생님 안내를 따라주세요." },
  { at: "2026-11-02T15:00:00+09:00", title: "제주 수학여행 · 다음 일정", body: "해수욕장 일정이 다가와요. 집합 시간과 장소를 확인해 주세요." },
  { at: "2026-11-03T08:50:00+09:00", title: "제주 수학여행 · 오늘의 일정", body: "오늘은 마라도와 휴애리 일정이 있어요. 출발 준비를 해주세요." },
  { at: "2026-11-04T09:00:00+09:00", title: "제주 수학여행 · 오늘의 일정", body: "오늘은 에코랜드, 산굼부리, 스카이워터쇼 일정이에요." },
  { at: "2026-11-05T08:30:00+09:00", title: "제주 수학여행 · 마지막 날", body: "오늘은 귀가하는 날이에요. 일정과 짐을 확인해 주세요." }
];

export default async (request) => {
  if (request.method !== "POST") return new Response("Method Not Allowed", { status: 405 });
  const adminToken = Netlify.env.get("SCHEDULE_ADMIN_TOKEN");
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!adminToken || supplied !== adminToken) return new Response("Unauthorized", { status: 401 });

  const appId = Netlify.env.get("ONESIGNAL_APP_ID");
  const apiKey = Netlify.env.get("ONESIGNAL_REST_API_KEY");
  if (!appId || !apiKey) return new Response("Missing OneSignal environment variables", { status: 500 });

  const results = [];
  for (const item of schedule) {
    const sendAfter = new Date(item.at);
    if (sendAfter <= new Date()) {
      results.push({ title: item.title, skipped: "scheduled time has passed" });
      continue;
    }
    const response = await fetch("https://api.onesignal.com/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Key ${apiKey}` },
      body: JSON.stringify({
        app_id: appId,
        included_segments: ["Subscribed Users"],
        headings: { en: item.title, ko: item.title },
        contents: { en: item.body, ko: item.body },
        send_after: sendAfter.toISOString(),
        target_channel: "push"
      })
    });
    const data = await response.json().catch(() => ({}));
    results.push({ title: item.title, status: response.status, id: data.id || null, errors: data.errors || null });
    if (!response.ok) {
      return new Response(JSON.stringify({ error: "OneSignal scheduling failed", results }, null, 2), {
        status: 502, headers: { "Content-Type": "application/json" }
      });
    }
  }
  return new Response(JSON.stringify({ message: "Scheduling requests processed", results }, null, 2), {
    status: 200, headers: { "Content-Type": "application/json" }
  });
};
