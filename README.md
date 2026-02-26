# Datadog MCP Server

Datadog API 전체 기능을 지원하는 커스텀 MCP(Model Context Protocol) 서버입니다.
Claude Code에서 Datadog 모니터링 데이터를 직접 조회하고 관리할 수 있습니다.

## 왜 만들었나?

기존 커뮤니티 MCP 서버(`datadog-mcp-server` by GeLi2001)의 한계를 해결합니다:

| 기능 | 커뮤니티 MCP | 이 프로젝트 |
|------|:---:|:---:|
| 시계열 메트릭 쿼리 (CPU, 메모리, IOPS 등) | - | O |
| APM/Traces 검색 | - | O |
| RUM 이벤트 검색 및 집계 | - | O |
| 모니터/대시보드 생성·수정·삭제 | - | O |
| Synthetics 테스트 관리 | - | O |
| 다운타임 관리 | - | O |
| 보안 시그널 검색 | - | O |
| 사용량/계정 관리 | - | O |
| **총 도구 수** | **6개** | **43개** |

## 제공 도구 (43개)

### 메트릭
- `query-metrics` — 시계열 메트릭 데이터 쿼리 (Datadog 쿼리 문법 지원)
- `get-metrics` — 메트릭 이름 패턴으로 검색
- `get-metric-metadata` — 특정 메트릭의 메타데이터 조회 (타입, 단위, 설명)
- `list-active-metrics` — 활성 메트릭 목록 조회

### 모니터
- `get-monitors` — 모니터 목록 조회 (이름, 태그, 상태 필터링)
- `get-monitor` — 특정 모니터 상세 조회
- `create-monitor` — 새 모니터 생성
- `update-monitor` — 모니터 설정 수정
- `delete-monitor` — 모니터 삭제
- `mute-monitor` — 모니터 음소거

### 대시보드
- `get-dashboards` — 대시보드 목록 조회
- `get-dashboard` — 특정 대시보드 상세 조회
- `create-dashboard` — 새 대시보드 생성
- `update-dashboard` — 대시보드 수정
- `delete-dashboard` — 대시보드 삭제

### 로그
- `search-logs` — 로그 검색 (쿼리 + 시간 범위)
- `aggregate-logs` — 로그 집계 (count, avg, sum, percentiles)
- `send-logs` — Datadog으로 로그 전송

### 이벤트
- `get-events` — 이벤트 조회 (우선순위, 소스, 태그 필터링)
- `post-event` — 커스텀 이벤트 생성

### 인시던트
- `get-incidents` — 인시던트 목록 조회

### APM
- `search-spans` — APM 스팬/트레이스 검색 (서비스, 리소스, 상태, 지속시간 필터링)

### RUM (Real User Monitoring)
- `search-rum-events` — RUM 이벤트 검색 (세션, 뷰, 에러, 액션)
- `aggregate-rum` — RUM 데이터 집계

### 인프라 호스트
- `list-hosts` — 인프라 호스트 목록 조회
- `get-host-totals` — 활성/가동 호스트 총 수 조회

### SLO
- `list-slos` — SLO 목록 조회
- `get-slo` — 특정 SLO 상세 조회
- `get-slo-history` — SLO 이행 이력 조회 (상태, 에러 예산, 준수율)

### Synthetics
- `list-synthetics` — Synthetics 테스트 목록 조회
- `get-synthetics-result` — 테스트 최신 결과 조회
- `trigger-synthetics` — 테스트 즉시 실행
- `create-synthetics-test` — 새 Synthetics 테스트 생성
- `update-synthetics-test` — 테스트 수정
- `delete-synthetics-test` — 테스트 삭제

### 다운타임
- `list-downtimes` — 예정된 다운타임 목록 조회
- `create-downtime` — 다운타임 생성 (모니터 음소거 스케줄)
- `cancel-downtime` — 다운타임 취소

### 보안
- `search-security-signals` — 보안 모니터링 시그널 검색

### 계정 및 사용량
- `get-usage-summary` — 사용량 요약 조회 (호스트, 로그, APM, RUM 등)
- `list-users` — 조직 사용자 목록 조회

### 노트북
- `list-notebooks` — 노트북 목록 조회
- `get-notebook` — 특정 노트북 상세 조회

## 설치

### 사전 요구사항

- Node.js 18+
- pnpm
- Datadog API Key 및 Application Key

### 빌드

```bash
git clone https://github.com/us-all/datadog-mcp-server.git
cd datadog-mcp-server
pnpm install
pnpm run build
```

### 환경변수 설정

프로젝트 루트에 `.env` 파일을 생성합니다:

```bash
DD_API_KEY=<your-datadog-api-key>
DD_APP_KEY=<your-datadog-application-key>
DD_SITE=us5.datadoghq.com    # 기본값: us5.datadoghq.com
```

> `DD_SITE`는 Datadog 사이트에 맞게 변경하세요 (`datadoghq.com`, `us3.datadoghq.com`, `us5.datadoghq.com`, `datadoghq.eu`, `ap1.datadoghq.com` 등).

## Claude Code에서 사용하기

### 방법 1: CLI로 등록 (권장)

```bash
claude mcp add datadog -s user \
  -e DD_API_KEY=<your-api-key> \
  -e DD_APP_KEY=<your-app-key> \
  -e DD_SITE=us5.datadoghq.com \
  -- node /path/to/datadog-mcp-server/dist/index.js
```

- `-s user`: 모든 프로젝트에서 사용 가능 (글로벌 등록)
- `-s project`: 현재 프로젝트에서만 사용

### 방법 2: 설정 파일 직접 수정

`~/.claude.json`의 `mcpServers` 섹션에 추가:

```json
{
  "mcpServers": {
    "datadog": {
      "type": "stdio",
      "command": "node",
      "args": ["/path/to/datadog-mcp-server/dist/index.js"],
      "env": {
        "DD_API_KEY": "<your-api-key>",
        "DD_APP_KEY": "<your-app-key>",
        "DD_SITE": "us5.datadoghq.com"
      }
    }
  }
}
```

### 방법 3: 프로젝트별 `.mcp.json`

프로젝트 루트에 `.mcp.json` 파일을 생성:

```json
{
  "mcpServers": {
    "datadog": {
      "type": "stdio",
      "command": "node",
      "args": ["/path/to/datadog-mcp-server/dist/index.js"],
      "env": {
        "DD_API_KEY": "<your-api-key>",
        "DD_APP_KEY": "<your-app-key>",
        "DD_SITE": "us5.datadoghq.com"
      }
    }
  }
}
```

### 등록 확인

```bash
claude mcp list
```

## 사용 예시

Claude Code에서 자연어로 질문하면 됩니다:

```
# 메트릭 조회
"지난 1시간 동안 us-app-prod 서비스의 CPU 사용량을 보여줘"
"MongoDB cluster0 shard들의 디스크 IOPS를 조회해줘"

# 모니터 관리
"현재 Alert 상태인 모니터를 보여줘"
"CPU 사용률 90% 이상 시 알림하는 모니터를 만들어줘"

# 로그 검색
"지난 30분간 us-insight-api-prod 서비스의 에러 로그를 검색해줘"

# APM 트레이스
"us-campus 서비스에서 응답시간이 5초 이상인 트레이스를 찾아줘"

# RUM 분석
"오늘 us-app-prod 앱의 에러 이벤트를 보여줘"

# SLO/Synthetics
"현재 SLO 목록과 달성률을 보여줘"
"API 상태 확인용 Synthetics 테스트를 실행해줘"

# 인프라
"현재 활성 호스트 목록을 보여줘"
```

### 실전 활용 가이드

실제 프로덕션 환경에서 MCP 도구들을 조합하여 문제를 분석하는 상세 워크플로우:

- **[프로덕션 에러 조사](docs/use-case-error-investigation.md)** — Logs + APM + RUM을 조합하여 에러 원인을 단계별로 추적하는 실전 예시

## 아키텍처

```
Claude AI → MCP Protocol (stdio) → index.ts → tools/*.ts → Datadog SDK → Datadog API
```

### 프로젝트 구조

```
src/
├── index.ts          # MCP 서버 진입점, 43개 도구 등록
├── config.ts         # 환경변수 로딩 (DD_API_KEY, DD_APP_KEY, DD_SITE)
├── client.ts         # Datadog API 클라이언트 초기화
└── tools/
    ├── metrics.ts    # 시계열 메트릭 쿼리 + 메트릭 카탈로그
    ├── monitors.ts   # 모니터 CRUD + 음소거
    ├── dashboards.ts # 대시보드 CRUD
    ├── logs.ts       # 로그 검색, 집계, 전송
    ├── events.ts     # 이벤트 조회 및 생성
    ├── incidents.ts  # 인시던트 조회
    ├── apm.ts        # APM 스팬/트레이스 검색
    ├── rum.ts        # RUM 이벤트 검색 및 집계
    ├── hosts.ts      # 인프라 호스트 관리
    ├── slos.ts       # SLO 조회 및 이력
    ├── synthetics.ts # Synthetics 테스트 CRUD + 실행
    ├── downtimes.ts  # 다운타임 관리
    ├── security.ts   # 보안 시그널 검색
    ├── account.ts    # 사용량 요약 및 사용자 관리
    └── notebooks.ts  # 노트북 조회
```

## 기술 스택

- **Runtime**: Node.js 18+ (TypeScript strict mode, ESM)
- **Package Manager**: pnpm
- **MCP SDK**: `@modelcontextprotocol/sdk` ^1.27.1
- **Datadog Client**: `@datadog/datadog-api-client` ^1.52.0
- **Validation**: zod ^4.3.6
- **Config**: dotenv

## 라이선스

ISC
