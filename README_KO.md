# Datadog MCP Server

Datadog API 전체 기능을 지원하는 [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) 서버입니다.
Claude 같은 AI 어시스턴트에서 Datadog 모니터링 데이터(메트릭, 로그, APM, RUM, 모니터, 대시보드 등)를 직접 조회하고 관리할 수 있습니다.

[English README](./README.md)

## 왜 만들었나?

기존 커뮤니티 MCP 서버의 한계를 해결합니다:

| 기능 | 커뮤니티 MCP | 이 프로젝트 |
|------|:---:|:---:|
| 시계열 메트릭 쿼리 (CPU, 메모리, IOPS 등) | - | ✓ |
| APM / Trace 검색 | - | ✓ |
| RUM 이벤트 검색 및 집계 | - | ✓ |
| 모니터 / 대시보드 CRUD | - | ✓ |
| Synthetics 테스트 관리 | - | ✓ |
| 다운타임 관리 | - | ✓ |
| 보안 시그널 검색 | - | ✓ |
| On-Call 스케줄 | - | ✓ |
| 사용량 / 계정 관리 | - | ✓ |
| CI/CD 가시성 | - | ✓ |
| 에러 추적 | - | ✓ |
| 케이스 관리 | - | ✓ |
| 네트워크 디바이스 모니터링 | - | ✓ |
| DORA 메트릭 | - | ✓ |
| 소프트웨어 카탈로그 | - | ✓ |
| 컨테이너 및 프로세스 | - | ✓ |
| 감사 로그 | - | ✓ |
| RUM 애플리케이션 / 메트릭 / 보존 필터 관리 | - | ✓ |
| **총 도구 수** | **6** | **81** |

## 빠른 시작

### 방법 1: npx (권장)

```bash
npx @us-all/datadog-mcp \
  --env DD_API_KEY=<your-key> \
  --env DD_APP_KEY=<your-key> \
  --env DD_SITE=datadoghq.com
```

### 방법 2: Docker

```bash
docker run -e DD_API_KEY=<key> -e DD_APP_KEY=<key> -e DD_SITE=datadoghq.com \
  ghcr.io/us-all/datadog-mcp-server:latest
```

### 방법 3: 소스에서 빌드

```bash
git clone https://github.com/us-all/datadog-mcp-server.git
cd datadog-mcp-server
pnpm install
pnpm run build
node dist/index.js
```

## 설정

### 환경변수

| 변수 | 필수 | 기본값 | 설명 |
|------|------|--------|------|
| `DD_API_KEY` | Yes | — | Datadog API 키 |
| `DD_APP_KEY` | Yes | — | Datadog Application 키 |
| `DD_SITE` | No | `us5.datadoghq.com` | Datadog 사이트 (아래 참조) |
| `DD_ALLOW_WRITE` | No | `false` | `true`로 설정 시 쓰기 작업(생성, 수정, 삭제) 허용 |

### DD_SITE 값

| 사이트 | 값 | 리전 |
|--------|-----|------|
| US1 | `datadoghq.com` | US (Virginia) |
| US3 | `us3.datadoghq.com` | US (Virginia) |
| US5 | `us5.datadoghq.com` | US (Oregon) |
| EU1 | `datadoghq.eu` | EU (Frankfurt) |
| AP1 | `ap1.datadoghq.com` | Asia-Pacific (Tokyo) |

`DD_SITE`를 설정하지 않으면 `us5.datadoghq.com`이 기본값입니다. Datadog 조직의 사이트에 맞게 변경하세요.

### 읽기 전용 모드

기본적으로 AI 에이전트의 실수를 방지하기 위해 모든 쓰기 작업이 차단됩니다. 다음 도구를 사용하려면 `DD_ALLOW_WRITE=true` 설정이 필요합니다:

`create-monitor`, `update-monitor`, `delete-monitor`, `mute-monitor`, `create-dashboard`, `update-dashboard`, `delete-dashboard`, `send-logs`, `post-event`, `trigger-synthetics`, `create-synthetics-test`, `update-synthetics-test`, `delete-synthetics-test`, `create-downtime`, `cancel-downtime`, `create-case`, `update-case-status`, `send-dora-deployment`, `send-dora-incident`

### Claude Desktop

Claude Desktop 설정 파일(`~/Library/Application Support/Claude/claude_desktop_config.json`)에 추가:

```json
{
  "mcpServers": {
    "datadog": {
      "command": "npx",
      "args": ["-y", "@us-all/datadog-mcp"],
      "env": {
        "DD_API_KEY": "<your-api-key>",
        "DD_APP_KEY": "<your-app-key>",
        "DD_SITE": "datadoghq.com"
      }
    }
  }
}
```

### Claude Code

```bash
# 글로벌 등록 (모든 프로젝트에서 사용)
claude mcp add datadog -s user \
  -e DD_API_KEY=<key> -e DD_APP_KEY=<key> -e DD_SITE=datadoghq.com \
  -- npx -y @us-all/datadog-mcp

# 프로젝트별 등록
claude mcp add datadog -s project \
  -e DD_API_KEY=<key> -e DD_APP_KEY=<key> -e DD_SITE=datadoghq.com \
  -- npx -y @us-all/datadog-mcp
```

## 도구 (81개)

### 메트릭 (5)
| 도구 | 설명 |
|------|------|
| `query-metrics` | 시계열 메트릭 데이터 쿼리 (Datadog 쿼리 문법 지원) |
| `get-metrics` | 메트릭 이름 패턴으로 검색 |
| `get-metric-metadata` | 메트릭 메타데이터 조회 (타입, 단위, 설명) |
| `list-active-metrics` | 활성 메트릭 목록 조회 (호스트, 태그 필터링) |
| `list-metric-tags` | 특정 메트릭의 태그 목록 조회 |

### 모니터 (7)
| 도구 | 설명 |
|------|------|
| `get-monitors` | 모니터 목록 조회 (이름, 태그, 상태 필터링) |
| `get-monitor` | 특정 모니터 상세 조회 |
| `create-monitor` | 새 모니터 생성 |
| `update-monitor` | 모니터 설정 수정 |
| `delete-monitor` | 모니터 삭제 |
| `mute-monitor` | 모니터 음소거 (범위 및 기간 설정) |
| `validate-monitor` | 모니터 정의 검증 (생성하지 않고 쿼리 문법, 임계값 등 확인) |

### 대시보드 (5)
| 도구 | 설명 |
|------|------|
| `get-dashboards` | 대시보드 목록 조회 |
| `get-dashboard` | 대시보드 상세 조회 (위젯, 설정 포함) |
| `create-dashboard` | 새 대시보드 생성 |
| `update-dashboard` | 대시보드 수정 |
| `delete-dashboard` | 대시보드 삭제 |

### 로그 (3)
| 도구 | 설명 |
|------|------|
| `search-logs` | 로그 검색 (쿼리 + 시간 범위) |
| `aggregate-logs` | 로그 집계 (count, avg, sum, percentiles + 그룹핑) |
| `send-logs` | Datadog으로 로그 전송 |

### 이벤트 (2)
| 도구 | 설명 |
|------|------|
| `get-events` | 이벤트 조회 (우선순위, 소스, 태그 필터링) |
| `post-event` | 커스텀 이벤트 생성 (마크다운, @멘션 지원) |

### 인시던트 (1)
| 도구 | 설명 |
|------|------|
| `get-incidents` | 인시던트 목록 조회 (페이지네이션) |

### APM (1)
| 도구 | 설명 |
|------|------|
| `search-spans` | APM 스팬/트레이스 검색 (서비스, 리소스, 상태, 지속시간) |

### RUM (17)
| 도구 | 설명 |
|------|------|
| `search-rum-events` | RUM 이벤트 검색 (세션, 뷰, 에러, 액션) |
| `aggregate-rum` | RUM 데이터 집계 (연산 + 그룹핑) |
| `list-rum-applications` | RUM 애플리케이션 목록 조회 |
| `get-rum-application` | RUM 애플리케이션 상세 조회 |
| `create-rum-application` | RUM 애플리케이션 생성 (browser, ios, android 등) |
| `update-rum-application` | RUM 애플리케이션 수정 |
| `delete-rum-application` | RUM 애플리케이션 삭제 |
| `list-rum-metrics` | RUM 기반 메트릭 목록 조회 |
| `get-rum-metric` | RUM 기반 메트릭 정의 조회 |
| `create-rum-metric` | RUM 데이터 기반 메트릭 생성 |
| `update-rum-metric` | RUM 기반 메트릭 수정 |
| `delete-rum-metric` | RUM 기반 메트릭 삭제 |
| `list-rum-retention-filters` | RUM 보존 필터 목록 조회 |
| `get-rum-retention-filter` | RUM 보존 필터 상세 조회 |
| `create-rum-retention-filter` | RUM 보존 필터 생성 |
| `update-rum-retention-filter` | RUM 보존 필터 수정 |
| `delete-rum-retention-filter` | RUM 보존 필터 삭제 |

### 인프라 호스트 (2)
| 도구 | 설명 |
|------|------|
| `list-hosts` | 인프라 호스트 목록 조회 (필터링, 메타데이터) |
| `get-host-totals` | 활성/가동 호스트 총 수 조회 |

### SLO (3)
| 도구 | 설명 |
|------|------|
| `list-slos` | SLO 목록 조회 (쿼리, 태그, ID 필터링) |
| `get-slo` | 특정 SLO 상세 조회 |
| `get-slo-history` | SLO 이행 이력 조회 (상태, 에러 예산, 준수율) |

### Synthetics (6)
| 도구 | 설명 |
|------|------|
| `list-synthetics` | Synthetics 테스트 목록 조회 (API, Browser, Mobile) |
| `get-synthetics-result` | 테스트 최신 결과 조회 |
| `trigger-synthetics` | 테스트 즉시 실행 |
| `create-synthetics-test` | 새 Synthetics 테스트 생성 |
| `update-synthetics-test` | Synthetics 테스트 수정 |
| `delete-synthetics-test` | Synthetics 테스트 삭제 |

### 다운타임 (3)
| 도구 | 설명 |
|------|------|
| `list-downtimes` | 예정된 다운타임 목록 조회 |
| `create-downtime` | 다운타임 생성 (모니터 음소거 스케줄) |
| `cancel-downtime` | 다운타임 취소 |

### 보안 (1)
| 도구 | 설명 |
|------|------|
| `search-security-signals` | 보안 모니터링 시그널 검색 |

### 계정 및 사용량 (2)
| 도구 | 설명 |
|------|------|
| `get-usage-summary` | 사용량 요약 조회 (호스트, 로그, APM, RUM 등) |
| `list-users` | 조직 사용자 목록 조회 |

### 노트북 (2)
| 도구 | 설명 |
|------|------|
| `list-notebooks` | 노트북 목록 조회 (검색, 필터링) |
| `get-notebook` | 특정 노트북 상세 조회 (셀, 콘텐츠 포함) |

### On-Call (2)
| 도구 | 설명 |
|------|------|
| `get-team-oncall` | 팀의 현재 온콜 담당자 조회 |
| `get-oncall-schedule` | 온콜 스케줄 조회 (레이어, 팀 정보 포함) |

### 서비스 카탈로그 (2)
| 도구 | 설명 |
|------|------|
| `list-services` | 소프트웨어 카탈로그 서비스 목록 조회 (필터링) |
| `get-service-definition` | 서비스 정의 상세 조회 |

### 컨테이너 (1)
| 도구 | 설명 |
|------|------|
| `list-containers` | 인프라 컨테이너 목록 조회 (필터링, 페이지네이션) |

### 프로세스 (1)
| 도구 | 설명 |
|------|------|
| `list-processes` | 실행 중인 프로세스 목록 조회 (검색, 태그 필터링) |

### 감사 로그 (1)
| 도구 | 설명 |
|------|------|
| `search-audit-logs` | 감사 로그 검색 (조직 활동 추적) |

### 케이스 관리 (4)
| 도구 | 설명 |
|------|------|
| `list-cases` | 케이스 목록 조회 (검색, 필터링) |
| `get-case` | 케이스 상세 조회 |
| `create-case` | 새 케이스 생성 |
| `update-case-status` | 케이스 상태 변경 (OPEN, IN_PROGRESS, CLOSED) |

### 에러 추적 (2)
| 도구 | 설명 |
|------|------|
| `list-error-tracking-issues` | 에러 추적 이슈 목록 조회 |
| `get-error-tracking-issue` | 에러 추적 이슈 상세 조회 |

### CI/CD 가시성 (4)
| 도구 | 설명 |
|------|------|
| `search-ci-pipelines` | CI/CD 파이프라인 이벤트 검색 |
| `aggregate-ci-pipelines` | CI/CD 파이프라인 데이터 집계 |
| `search-ci-tests` | CI 테스트 이벤트 검색 |
| `aggregate-ci-tests` | CI 테스트 데이터 집계 |

### 네트워크 디바이스 (2)
| 도구 | 설명 |
|------|------|
| `list-network-devices` | 네트워크 디바이스 목록 조회 (NDM) |
| `get-network-device` | 네트워크 디바이스 상세 조회 |

### DORA 메트릭 (2)
| 도구 | 설명 |
|------|------|
| `send-dora-deployment` | DORA 배포 이벤트 전송 |
| `send-dora-incident` | DORA 인시던트 이벤트 전송 |

## 사용 예시

Claude Code에서 자연어로 질문하면 됩니다:

```
# 메트릭 조회
"지난 1시간 동안 payment-api 서비스의 CPU 사용량을 보여줘"
"Redis 클러스터의 메모리 사용량을 조회해줘"

# 모니터 관리
"현재 Alert 상태인 모니터를 보여줘"
"CPU 사용률 90% 이상 시 알림하는 모니터를 만들어줘"

# 로그 검색
"지난 30분간 order-service의 에러 로그를 검색해줘"

# APM 트레이스
"checkout-service에서 응답시간이 5초 이상인 트레이스를 찾아줘"

# RUM 분석
"오늘 웹 앱의 에러 이벤트를 보여줘"

# SLO / Synthetics
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
├── index.ts          # MCP 서버 진입점, 81개 도구 등록
├── config.ts         # 환경변수 로딩 (DD_API_KEY, DD_APP_KEY, DD_SITE)
├── client.ts         # Datadog API 클라이언트 초기화
└── tools/
    ├── utils.ts      # 에러 핸들링 래퍼
    ├── metrics.ts    # 시계열 메트릭 쿼리 + 메트릭 카탈로그
    ├── monitors.ts   # 모니터 CRUD + 음소거
    ├── dashboards.ts # 대시보드 CRUD
    ├── logs.ts       # 로그 검색, 집계, 전송
    ├── events.ts     # 이벤트 조회 및 생성
    ├── incidents.ts  # 인시던트 조회
    ├── apm.ts        # APM 스팬/트레이스 검색
    ├── rum.ts        # RUM 이벤트 검색, 집계, 애플리케이션 CRUD
    ├── rum-metrics.ts # RUM 기반 메트릭 CRUD
    ├── rum-retention-filters.ts # RUM 보존 필터 관리
    ├── hosts.ts      # 인프라 호스트 관리
    ├── slos.ts       # SLO 조회 및 이력
    ├── synthetics.ts # Synthetics 테스트 CRUD + 실행
    ├── downtimes.ts  # 다운타임 관리
    ├── security.ts   # 보안 시그널 검색
    ├── account.ts    # 사용량 요약 및 사용자 관리
    ├── notebooks.ts  # 노트북 조회
    ├── oncall.ts     # 온콜 스케줄 및 담당자
    ├── services.ts   # 소프트웨어 카탈로그
    ├── containers.ts # 컨테이너 모니터링
    ├── processes.ts  # 프로세스 모니터링
    ├── audit.ts      # 감사 로그 검색
    ├── cases.ts      # 케이스 관리 CRUD
    ├── errors.ts     # 에러 추적
    ├── ci.ts         # CI/CD 가시성 (파이프라인 + 테스트)
    ├── networks.ts   # 네트워크 디바이스 모니터링
    └── dora.ts       # DORA 메트릭 (배포 + 인시던트)
```

## 기술 스택

- **Runtime**: Node.js 18+ (TypeScript strict mode, ESM)
- **Package Manager**: pnpm
- **MCP SDK**: `@modelcontextprotocol/sdk`
- **Datadog Client**: `@datadog/datadog-api-client` (공식 SDK)
- **Validation**: zod
- **Config**: dotenv
- **Testing**: vitest + dd-trace (Test Visibility)

## Contributing

개발 환경 설정 및 가이드라인은 [CONTRIBUTING.md](./CONTRIBUTING.md)를 참조하세요.

## 라이선스

[MIT](./LICENSE)
