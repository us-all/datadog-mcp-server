# Datadog MCP Server 개발 계획

## 배경

기존 커뮤니티 MCP 서버(`datadog-mcp-server` by GeLi2001, v1.0.9)를 사용 중이나 다음 한계가 있음:

- **시계열 메트릭 쿼리 불가** - 특정 호스트의 CPU, 메모리, 디스크 I/O 등 실시간 수치 조회 불가
- APM/Traces 조회 불가
- RUM 데이터 조회 불가
- 제한된 도구 세트 (monitors, dashboards, logs, events, incidents, metrics 목록만 지원)
- 쓰기 작업(생성/수정/삭제) 미지원

## 목표

Datadog 공식 API를 사용하여 운영 모니터링에 필요한 전체 기능을 갖춘 커스텀 MCP 서버 구축.

## 환경

- **Datadog Site**: `us5.datadoghq.com`
- **인증**: DD_API_KEY + DD_APP_KEY (환경변수)
- **주요 서비스**: 웹/모바일 앱 (Flutter RUM), API 서버, 백엔드 서비스, MongoDB Atlas

## 기술 스택

- **Runtime**: Node.js (TypeScript, strict mode)
- **Package Manager**: pnpm
- **MCP SDK**: `@modelcontextprotocol/sdk` (^1.8.0)
- **Datadog Client**: `@datadog/datadog-api-client` (^1.33.1)
- **Validation**: zod
- **Config**: dotenv

## Phase 1 - 핵심 읽기 기능 (MVP)

기존 도구 유지 + 가장 중요한 메트릭 쿼리 기능 추가.

### 1.1 메트릭 시계열 쿼리 (최우선)

현재 가장 큰 Gap. 특정 호스트/서비스의 메트릭 값을 시간 범위로 조회.

- **Tool**: `query-metrics`
- **API**: `POST /api/v1/query` (Metrics Query)
- **파라미터**:
  - `query`: Datadog 메트릭 쿼리 문자열 (예: `avg:system.cpu.user{host:web-server-01}`)
  - `from`: 시작 시간 (epoch seconds 또는 `now-1h` 같은 상대 시간)
  - `to`: 종료 시간
- **사용 예시**:
  - 호스트별 디스크 I/O, 메모리, CPU 조회
  - 서비스별 latency p50/p90/p99 조회
  - 시간대별 트래픽 패턴 분석

### 1.2 기존 도구 이관 + 메트릭 카탈로그

| Tool | API | 비고 |
|------|-----|------|
| `get-monitors` | `GET /api/v1/monitor` | 필터링 지원 |
| `get-monitor` | `GET /api/v1/monitor/{id}` | 단일 모니터 상세 |
| `get-dashboards` | `GET /api/v1/dashboard/lists` | 대시보드 목록 |
| `get-dashboard` | `GET /api/v1/dashboard/{id}` | 대시보드 상세 |
| `get-metrics` | `GET /api/v1/metrics` | 메트릭 목록 |
| `get-metric-metadata` | `GET /api/v1/metrics/{name}` | 메트릭 메타데이터 |
| `list-metric-tags` | `GET /api/v2/metrics/{name}/all-tags` | 메트릭 태그 조회 |
| `search-logs` | `POST /api/v2/logs/events/search` | 로그 검색 |
| `aggregate-logs` | `POST /api/v2/logs/analytics/aggregate` | 로그 집계 |
| `get-events` | `GET /api/v2/events` | 이벤트 검색 |
| `get-incidents` | `GET /api/v2/incidents` | 인시던트 목록 |

**Phase 1 도구 합계: 12개**

## Phase 2 - APM, RUM, 호스트

### 2.1 APM Spans 검색

서비스 트레이스/스팬 조회로 성능 병목 분석.

| Tool | API | 비고 |
|------|-----|------|
| `search-spans` | `POST /api/v2/spans/events/search` | 스팬 검색 (Rate: 300 req/hr) |

### 2.2 RUM

모바일/웹 앱 사용자 세션, 에러, 성능 데이터 조회.

| Tool | API | 비고 |
|------|-----|------|
| `search-rum-events` | `POST /api/v2/rum/events/search` | RUM 이벤트 검색 |
| `aggregate-rum` | `POST /api/v2/rum/analytics/aggregate` | RUM 데이터 집계 |

### 2.3 호스트/인프라

| Tool | API | 비고 |
|------|-----|------|
| `list-hosts` | `GET /api/v1/hosts` | 호스트 목록 |
| `get-host-totals` | `GET /api/v1/hosts/totals` | 호스트 총계 |

**Phase 2 도구 합계: 5개**

## Phase 3 - SLO, Synthetics, 다운타임

### 3.1 SLO 관리

| Tool | API | 비고 |
|------|-----|------|
| `list-slos` | `GET /api/v1/slo` | SLO 목록 |
| `get-slo` | `GET /api/v1/slo/{id}` | SLO 상세 |
| `get-slo-history` | `GET /api/v1/slo/{id}/history` | SLO 이력 |

### 3.2 Synthetics 테스트

| Tool | API | 비고 |
|------|-----|------|
| `list-synthetics` | `GET /api/v1/synthetics/tests` | 테스트 목록 |
| `get-synthetics-result` | `GET /api/v1/synthetics/tests/{id}/results` | 테스트 결과 |
| `trigger-synthetics` | `POST /api/v1/synthetics/tests/trigger` | 테스트 실행 |

### 3.3 다운타임 관리

| Tool | API | 비고 |
|------|-----|------|
| `list-downtimes` | `GET /api/v2/downtime` | 다운타임 목록 |
| `create-downtime` | `POST /api/v2/downtime` | 다운타임 생성 |
| `cancel-downtime` | `DELETE /api/v2/downtime/{id}` | 다운타임 취소 |

**Phase 3 도구 합계: 9개**

## Phase 4 - 쓰기 작업 (CRUD 완성)

### 4.1 모니터 CRUD

| Tool | API | 비고 |
|------|-----|------|
| `create-monitor` | `POST /api/v1/monitor` | 모니터 생성 |
| `update-monitor` | `PUT /api/v1/monitor/{id}` | 모니터 수정 |
| `delete-monitor` | `DELETE /api/v1/monitor/{id}` | 모니터 삭제 |
| `mute-monitor` | `POST /api/v1/monitor/{id}/mute` | 모니터 음소거 |

### 4.2 대시보드 CRUD

| Tool | API | 비고 |
|------|-----|------|
| `create-dashboard` | `POST /api/v1/dashboard` | 대시보드 생성 |
| `update-dashboard` | `PUT /api/v1/dashboard/{id}` | 대시보드 수정 |
| `delete-dashboard` | `DELETE /api/v1/dashboard/{id}` | 대시보드 삭제 |

### 4.3 이벤트/로그 전송

| Tool | API | 비고 |
|------|-----|------|
| `post-event` | `POST /api/v1/events` | 이벤트 생성 |
| `send-logs` | `POST /api/v2/logs` | 로그 전송 |

### 4.4 Synthetics CRUD

| Tool | API | 비고 |
|------|-----|------|
| `create-synthetics-test` | `POST /api/v1/synthetics/tests` | 테스트 생성 |
| `update-synthetics-test` | `PUT /api/v1/synthetics/tests/{id}` | 테스트 수정 |
| `delete-synthetics-test` | `DELETE /api/v1/synthetics/tests/{id}` | 테스트 삭제 |

**Phase 4 도구 합계: 12개**

## Phase 5 - 고급 기능

### 5.1 Security Monitoring

| Tool | API | 비고 |
|------|-----|------|
| `search-security-signals` | `POST /api/v2/security_monitoring/signals/search` | 보안 시그널 검색 |

### 5.2 Account & Usage

| Tool | API | 비고 |
|------|-----|------|
| `get-usage-summary` | `GET /api/v1/usage/summary` | 사용량 요약 |
| `list-users` | `GET /api/v2/users` | 사용자 목록 |

### 5.3 On-Call

| Tool | API | 비고 |
|------|-----|------|
| `get-oncall-schedules` | `GET /api/v2/on-call/schedules` | 온콜 스케줄 |

### 5.4 Notebooks

| Tool | API | 비고 |
|------|-----|------|
| `list-notebooks` | `GET /api/v1/notebooks` | 노트북 목록 |
| `get-notebook` | `GET /api/v1/notebooks/{id}` | 노트북 상세 |

**Phase 5 도구 합계: 5개**

## 전체 도구 요약

| Phase | 카테고리 | 도구 수 | 성격 |
|-------|---------|--------|------|
| **Phase 1 (MVP)** | Metrics, Monitors, Dashboards, Logs, Events, Incidents | 12 | 핵심 읽기 |
| **Phase 2** | APM, RUM, Hosts | 5 | 관측 확장 |
| **Phase 3** | SLOs, Synthetics, Downtimes | 9 | 운영 도구 |
| **Phase 4** | Monitor/Dashboard/Synthetics CRUD, Event/Log 전송 | 12 | 쓰기 작업 |
| **Phase 5** | Security, Account, On-Call, Notebooks | 5 | 고급 기능 |
| **합계** | | **43** | |

## 프로젝트 구조

```
datadog-mcp-server/
├── PLAN.md
├── CLAUDE.md
├── package.json
├── tsconfig.json
├── .env.example
├── .gitignore
├── src/
│   ├── index.ts              # MCP 서버 엔트리포인트, 도구 등록
│   ├── config.ts             # DD_API_KEY, DD_APP_KEY, DD_SITE 설정
│   ├── client.ts             # Datadog API 클라이언트 초기화
│   └── tools/
│       ├── metrics.ts        # query-metrics, get-metrics, get-metric-metadata, list-metric-tags
│       ├── monitors.ts       # get-monitors, get-monitor (+ Phase 4: CRUD)
│       ├── dashboards.ts     # get-dashboards, get-dashboard (+ Phase 4: CRUD)
│       ├── logs.ts           # search-logs, aggregate-logs (+ Phase 4: send-logs)
│       ├── events.ts         # get-events (+ Phase 4: post-event)
│       ├── incidents.ts      # get-incidents
│       ├── apm.ts            # search-spans (Phase 2)
│       ├── rum.ts            # search-rum-events, aggregate-rum (Phase 2)
│       ├── hosts.ts          # list-hosts, get-host-totals (Phase 2)
│       ├── slos.ts           # list-slos, get-slo, get-slo-history (Phase 3)
│       ├── synthetics.ts     # list/get/trigger-synthetics (Phase 3, + Phase 4: CRUD)
│       ├── downtimes.ts      # list/create/cancel-downtime (Phase 3)
│       ├── security.ts       # search-security-signals (Phase 5)
│       ├── account.ts        # get-usage-summary, list-users (Phase 5)
│       ├── oncall.ts         # get-oncall-schedules (Phase 5)
│       └── notebooks.ts      # list-notebooks, get-notebook (Phase 5)
└── dist/                     # 빌드 결과물
```

## 설정 방식

### 환경변수

```bash
DD_API_KEY=<api-key>
DD_APP_KEY=<app-key>
DD_SITE=us5.datadoghq.com
```

### Claude Code MCP 설정 (`.mcp.json`)

```json
{
  "mcpServers": {
    "datadog": {
      "command": "node",
      "args": ["dist/index.js"],
      "cwd": "/path/to/datadog-mcp-server",
      "env": {
        "DD_API_KEY": "<api-key>",
        "DD_APP_KEY": "<app-key>",
        "DD_SITE": "us5.datadoghq.com"
      }
    }
  }
}
```

## 참고 자료

- Datadog API Reference: https://docs.datadoghq.com/api/latest/
- Datadog API Client (JS): https://github.com/DataDog/datadog-api-client-typescript
- MCP SDK: https://github.com/modelcontextprotocol/typescript-sdk
- 기존 커뮤니티 MCP (참고용): https://github.com/GeLi2001/datadog-mcp-server
