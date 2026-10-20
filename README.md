# 제주도 수학여행 일정 웹사이트

2026년 11월 2일~5일 제주도 수학여행용 반응형 일정표입니다. Netlify에 정적 사이트로 배포하고, OneSignal Web Push를 연결할 수 있습니다.

## 포함 기능
- 출발일까지 D-Day 자동 계산 및 여행 중 DAY 표시
- 4일 날짜별 일정표
- PWA manifest 및 서비스 워커(홈 화면 추가/기본 오프라인 캐시)
- OneSignal 웹 푸시 구독 버튼
- Netlify Function으로 OneSignal 예약 알림 요청을 한 번에 등록
- 이미지에서 장소/메뉴명이 불확실한 일정은 확인 필요로 표시

## 1. Netlify에 사이트 배포하기
1. 이 폴더의 파일을 GitHub 저장소에 올립니다.
2. Netlify에서 **Add new site → Import an existing project**를 선택하고 저장소를 연결합니다.
3. Build command는 비워 두고 Publish directory는 `.` 로 둡니다. `netlify.toml`에 같은 설정이 들어 있습니다.
4. 배포 후 `https://사이트이름.netlify.app` 주소가 생성됩니다.

## 2. OneSignal 웹 푸시 설정
1. OneSignal 계정을 만들고 새 앱을 만든 뒤 **Web Push**를 선택합니다.
2. 사이트 URL을 실제 Netlify 도메인으로 설정합니다. 로컬 파일(`file://`)에서는 푸시 테스트가 안 됩니다.
3. OneSignal의 Web SDK 설정에서 App ID를 복사합니다.
4. `config.js`의 `YOUR_ONESIGNAL_APP_ID`를 실제 App ID로 교체하고 다시 배포합니다.
5. OneSignal 대시보드에서 사이트 도메인과 서비스 워커 설정이 맞는지 확인합니다.
6. 배포된 HTTPS 사이트를 열고 **알림 켜기**를 눌러 권한을 허용합니다.

### iPhone에서
- iOS 16.4 이상이 필요합니다.
- Safari에서 사이트를 연 다음 **공유 → 홈 화면에 추가**를 먼저 진행하고, 홈 화면 아이콘으로 사이트를 연 뒤 알림을 켜는 방식이 가장 안전합니다.
- 사용자가 알림 권한을 허용해야 하며, 브라우저/기기 설정에 따라 동작이 다를 수 있습니다.

## 3. 예약 알림 설정 (중요)
`netlify/functions/schedule-push.mjs`에는 여행일정에 맞춘 예시 알림 6개가 있습니다. 일정이 학교 공지와 정확히 맞는지 확인한 뒤 등록하세요.

Netlify 사이트 설정의 **Environment variables**에 아래 변수를 추가합니다.
- `ONESIGNAL_APP_ID`: OneSignal App ID
- `ONESIGNAL_REST_API_KEY`: OneSignal REST API Key (**절대로 config.js 또는 프런트엔드에 넣지 마세요**)
- `SCHEDULE_ADMIN_TOKEN`: 직접 정한 길고 임의적인 비밀 문자열

변수 저장 후 Netlify에서 새 배포를 진행합니다. 예약 함수는 다음 주소에서 POST 요청으로 한 번 호출합니다.

`https://사이트이름.netlify.app/.netlify/functions/schedule-push`

요청 헤더에 `Authorization: Bearer 여기에_SCHEDULE_ADMIN_TOKEN`을 넣어야 합니다. 성공 응답에 각 예약 요청의 OneSignal ID가 있는지 확인하세요. 같은 함수를 다시 호출하면 중복 알림이 예약될 수 있으므로 **한 번만 호출하세요**.

예시 curl:
```bash
curl -X POST "https://사이트이름.netlify.app/.netlify/functions/schedule-push" \
  -H "Authorization: Bearer YOUR_SCHEDULE_ADMIN_TOKEN"
```

또는 Postman에서 POST 요청과 Authorization 헤더를 설정할 수 있습니다. 비밀 토큰을 친구들에게 공유하지 마세요.

### 알림 대상
함수는 OneSignal의 `Subscribed Users` 세그먼트를 대상으로 예약 알림을 요청합니다. OneSignal 앱 설정과 현재 API 버전에서 이 세그먼트가 유효한지 확인하세요. 테스트 구독자 한두 명으로 먼저 검증하세요.

### 시간대와 예약
코드는 한국 표준시(+09:00)를 사용하며 OneSignal에 UTC ISO 시간으로 전달합니다. 알림은 사용자가 해당 시간 이전에 구독한 경우를 기준으로 테스트하세요. 예약 알림이 성공적으로 생성되었는지 OneSignal 대시보드에서도 확인해야 합니다.

## 4. 일정 수정하기
`app.js` 상단의 `DAYS` 배열에서 시간, 제목, 세부 내용을 수정합니다. 학교의 최종 일정표가 우선이며, 표시된 `학교 확인 필요` 항목은 확인 후 수정하세요.
예약 알림의 제목·내용·시간은 `netlify/functions/schedule-push.mjs`의 `schedule` 배열에서 따로 수정합니다.

## 5. 알림을 다시 등록할 때
예약을 취소하거나 수정한 뒤 다시 등록해야 합니다. OneSignal 대시보드에서 이미 예약된 알림을 확인하고 중복 발송이 없도록 관리하세요. 이 기본 버전에는 예약 ID를 저장하거나 자동 취소하는 관리 화면은 포함되어 있지 않습니다.

## 개인정보 및 보안
- 사이트는 방문자 로그인이나 이름 수집을 하지 않습니다.
- REST API Key와 관리자 토큰은 Netlify 환경 변수로만 보관합니다.
- 친구들에게 링크를 공개하기 전, 테스트 알림을 먼저 확인하세요.
