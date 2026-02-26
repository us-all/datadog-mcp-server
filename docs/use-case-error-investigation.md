# 실전 사용 예시: 프로덕션 에러 조사

> Datadog MCP 서버를 활용하여 프로덕션 에러를 단계별로 분석하는 실전 워크플로우입니다.
> Claude Code에서 자연어로 질문하면 MCP 도구들이 자동으로 호출됩니다.

## 시나리오

"오늘 `us-insight-api-prod`에서 에러가 많이 발생하는 것 같다" — 이 한 문장에서 시작하여 원인까지 파악합니다.

## 1단계: 에러 규모 파악

**Claude에게 질문:**
```
오늘 서비스별 에러 로그 수를 보여줘
```

**사용되는 도구:** `aggregate-logs` (groupBy: service)

**결과:**
```
서비스별 에러 로그:
  us-insight-api-prod  →  13건 (가장 많음)
  us-app-prod          →   8건
  us-partner-api-dev   →   1건
```

`us-insight-api-prod`에서 에러가 집중되고 있음을 확인합니다.

## 2단계: 에러 로그 상세 확인

**Claude에게 질문:**
```
us-insight-api-prod의 에러 로그를 보여줘
```

**사용되는 도구:** `search-logs` (query: `service:us-insight-api-prod status:error`)

**결과 분석:**
```
에러 메시지: TypeError: Cannot read properties of undefined (reading 'type')
위치: product-group-main-content.item.dto.ts:32
엔드포인트: GET /v2/product-groups/111
요청 출처: us-plus-keytlrve7-us-all-2024.vercel.app (웹)
요청자 IP: 221.146.217.10
시간대: 08:09 ~ 08:14 (5분간 집중 발생)
```

모든 에러가 **동일한 엔드포인트(`/v2/product-groups/111`)**에서 발생하고 있음을 파악합니다.

## 3단계: APM 트레이스로 성능 및 상세 분석

**Claude에게 질문:**
```
해당 엔드포인트의 APM 트레이스를 보여줘
```

**사용되는 도구:** `search-spans` (query: `service:us-insight-api-prod resource_name:GET*/v2/product-groups*`)

**APM에서 추가로 알 수 있는 정보:**
```
HTTP Status: 500
Duration: 13~18ms (응답 자체는 빠름, DB 쿼리 후 DTO 변환에서 에러)
Git Commit: 4b4564ae
버전: v2.3.4 (현재) / v2.3.3 (최초 발견)
ECS Task: us-insight-api-prod (3개 컨테이너 모두에서 발생)
Error Fingerprint: v10.04EF48364103F1D1DFF7423A6277749D (동일 이슈)
```

## 4단계: 모니터 상태 확인 (선택)

**Claude에게 질문:**
```
us-insight-api 관련 모니터 상태를 확인해줘
```

**사용되는 도구:** `get-monitors` (name 필터)

## 5단계: RUM에서 사용자 영향도 파악 (선택)

**Claude에게 질문:**
```
오늘 us-app-prod 앱에서 에러 수를 앱별로 보여줘
```

**사용되는 도구:** `aggregate-rum` (groupBy: @application.id)

---

## 최종 분석 결과

| 항목 | 내용 |
|------|------|
| **서비스** | `us-insight-api-prod` (v2.3.4) |
| **엔드포인트** | `GET /v2/product-groups/111` |
| **에러 타입** | `TypeError: Cannot read properties of undefined (reading 'type')` |
| **에러 위치** | `ProductGroupMainContentItemDto` 생성자 (dto.ts:32) |
| **HTTP 상태** | 500 Internal Server Error |
| **발생 시간** | 08:09 ~ 08:14 (5분간 13건) |
| **최초 발견** | v2.3.3 (이전 버전부터 존재하는 버그) |
| **영향 범위** | product-group ID 111 페이지만 해당 |

## 권장 조치

1. `ProductGroupMainContentItemDto` 생성자에서 `type` 필드 null/undefined 체크 추가
2. product-group `111`의 DB 데이터 정합성 확인 (mainContent에 type 누락 항목)
3. v2.3.3부터 존재하므로 데이터 마이그레이션 누락 가능성 검토

---

## 사용된 MCP 도구 요약

| 단계 | 도구 | 목적 |
|------|------|------|
| 1 | `aggregate-logs` | 서비스별 에러 수 집계 |
| 2 | `search-logs` | 에러 로그 상세 내용 확인 |
| 3 | `search-spans` | APM 트레이스로 성능/배포 정보 분석 |
| 4 | `get-monitors` | 관련 모니터 알림 상태 확인 |
| 5 | `aggregate-rum` | 사용자 영향도 파악 |

## 핵심 장점

- **Datadog 웹 UI 없이** Claude와 대화하면서 에러 조사 가능
- **Logs + APM + RUM** 데이터를 하나의 흐름으로 조합
- 분석 결과를 **자연어 보고서**로 바로 정리
- 코드 수정이 필요한 경우 **같은 세션에서 바로 코드 수정**까지 가능
