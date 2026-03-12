# newsletter-reader Planning Document

> **Summary**: 출퇴근 중 영어 뉴스레터를 TTS로 들으며 읽을 수 있는 개인용 Web PWA
>
> **Project**: 출퇴근 뉴스레터 리더
> **Version**: 0.5
> **Author**: dochung
> **Date**: 2026-03-12
> **Status**: Draft

---

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | 영어 독해력은 있지만 긴 텍스트를 시각적으로 읽는 데 집중이 안 되며, 출퇴근 환경에서 더 악화됨 |
| **Solution** | 뉴스레터를 문단 카드로 분리 + TTS 단어 하이라이트 싱크 + AI 다국어 해설을 제공하는 PWA |
| **Function/UX Effect** | 스와이프 카드 UI + 재생 버튼 하나로 읽기 시작, 한 손 조작으로 출퇴근 중 편하게 사용 |
| **Core Value** | Gmail에 쌓인 영어 뉴스레터를 매일 완독하는 습관 형성 — 비용 $0 |

---

## 1. Overview

### 1.1 Purpose

영어 뉴스레터 구독자가 출퇴근 시간에 **TTS로 들으며** 집중해서 읽을 수 있는 개인용 모바일 웹 앱을 만든다. Gmail에서 뉴스레터를 자동으로 가져오고, 문단별 카드 UI + 단어 하이라이트 TTS + AI 해설로 읽기 경험을 극대화한다.

### 1.2 Background

- 영어 뉴스레터를 구독하지만 Gmail에 쌓아두고 읽지 못하는 문제
- 기존 Gmail 앱은 긴 텍스트 읽기에 최적화되지 않음 (스크롤, 작은 글씨, 집중 방해)
- 출퇴근 시간(20~60분)을 영어 인풋 시간으로 활용하고 싶은 니즈
- 앱스토어 배포 없이 **개인용 PWA**로 비용 $0 달성

### 1.3 Related Documents

- PRD: [CLAUDE.md](../../CLAUDE.md) (v0.5)

---

## 2. Scope

### 2.1 In Scope

- [ ] Gmail 연동 (OAuth + 뉴스레터 자동 감지 + HTML 파싱)
- [ ] 문단 카드 리더 (스와이프 좌우 이동 + 진행률 바)
- [ ] TTS 읽어주기 (Web Speech API + 단어 하이라이트 싱크 + 속도 조절)
- [ ] AI 다국어 해설 (Gemini Flash / Claude Haiku, 사용자 API 키)
- [ ] 모바일 최적화 PWA UI (다크모드, 한 손 조작, 홈 화면 추가)
- [ ] 진행률 저장 (이어서 읽기)
- [ ] 텍스트 붙여넣기 (폴백 입력)
- [ ] Vercel 무료 배포

### 2.2 Out of Scope

- 앱스토어 배포 (Apple/Google)
- 사용자 계정 시스템 / 백엔드 서버
- 읽기 통계 / 단어 저장 (v1.1)
- 오프라인 저장
- 알림 / 푸시

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | Google OAuth로 Gmail 로그인 (테스트 모드) | High | Pending |
| FR-02 | 받은편지함에서 뉴스레터 자동 감지 (발신자 화이트리스트 + 수동 추가) | High | Pending |
| FR-03 | 이메일 HTML 본문을 텍스트로 파싱 (이미지/광고 제거) | High | Pending |
| FR-04 | 텍스트를 문단 단위로 분리하여 카드 UI로 표시 | High | Pending |
| FR-05 | 스와이프 좌우로 이전/다음 카드 이동 | High | Pending |
| FR-06 | 전체 진행률 프로그레스 바 표시 | Medium | Pending |
| FR-07 | Web Speech API로 문단 TTS 재생 (en-US) | High | Pending |
| FR-08 | TTS 재생 중 현재 읽히는 단어 하이라이트 (`onboundary`) | High | Pending |
| FR-09 | TTS 재생 속도 조절 (0.8x ~ 1.5x) | Medium | Pending |
| FR-10 | Wake Lock API로 TTS 재생 중 화면 꺼짐 방지 | Medium | Pending |
| FR-11 | 해설 버튼 클릭 시 AI가 선택 언어로 문단 설명 | High | Pending |
| FR-12 | AI API 키 입력/관리 설정 화면 | High | Pending |
| FR-13 | 다크 모드 지원 (`prefers-color-scheme` + 수동 토글) | Medium | Pending |
| FR-14 | 읽기 진행률 localStorage에 자동 저장 + 이어서 읽기 | High | Pending |
| FR-15 | 텍스트 붙여넣기로 직접 입력 (폴백) | Medium | Pending |
| FR-16 | PWA manifest로 홈 화면 추가 시 앱처럼 실행 | Medium | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| Performance | 카드 전환 < 100ms, TTS 시작 < 500ms | 체감 테스트 |
| 모바일 UX | 터치 영역 최소 44px, 한 손 조작 가능 | 실제 기기 테스트 |
| 접근성 | 다크모드, 큰 글씨, 고대비 | 시각적 확인 |
| 비용 | 모든 서비스 무료 티어 내 운영 | $0/월 |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [ ] Gmail에서 뉴스레터를 가져와 카드로 표시
- [ ] TTS로 읽으면서 단어 하이라이트가 동작
- [ ] AI 해설 버튼이 동작 (Gemini Flash 무료 티어)
- [ ] 진행률 저장 후 이어서 읽기 가능
- [ ] 다크모드 동작
- [ ] Vercel에 배포되어 모바일 브라우저에서 접속 가능
- [ ] 홈 화면 추가 시 앱처럼 실행

### 4.2 Quality Criteria

- [ ] iOS Safari + Android Chrome에서 동작 확인
- [ ] TTS `onboundary` 하이라이트가 양쪽 브라우저에서 동작
- [ ] Zero lint errors
- [ ] Build succeeds

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Web Speech API `onboundary`가 iOS Safari에서 미지원 또는 불안정 | High | Medium | 문장 단위 하이라이트로 폴백. 실제 기기 테스트 필수 |
| Gmail API CORS — 브라우저에서 직접 호출 시 CORS 문제 | High | High | Next.js API Route를 프록시로 사용 (Vercel 서버리스 함수) |
| 뉴스레터 HTML 구조가 발신자마다 다름 → 파싱 실패 | Medium | High | 주요 뉴스레터(Morning Brew, TLDR 등)부터 대응. 파싱 실패 시 원본 HTML 표시 |
| AI API 키 입력 UX 마찰 | Medium | Medium | Gemini Flash 무료 티어를 기본 추천, API 키 발급 가이드 화면 제공 |
| PWA에서 Wake Lock API 미지원 브라우저 | Low | Low | 지원 안 되면 무시 (사용자가 화면 수동 관리) |
| localStorage 용량 한계 (5~10MB) | Low | Low | 개인용이므로 충분. 오래된 데이터 자동 정리 로직 추가 |

---

## 6. Architecture Considerations

### 6.1 Project Level Selection

| Level | Characteristics | Recommended For | Selected |
|-------|-----------------|-----------------|:--------:|
| **Starter** | Simple structure (`components/`, `lib/`, `types/`) | Static sites, portfolios, landing pages | ✅ |
| Dynamic | Feature-based modules, BaaS integration | Web apps with backend, SaaS MVPs | ☐ |
| Enterprise | Strict layer separation, DI, microservices | High-traffic systems | ☐ |

> Starter 선택 이유: 개인용 앱, 백엔드 없음, 단일 기능 중심

### 6.2 Key Architectural Decisions

| Decision | Options | Selected | Rationale |
|----------|---------|----------|-----------|
| Framework | Next.js / Vite+React / Remix | **Next.js (App Router)** | PWA 지원, Vercel 무료 배포, API Route로 Gmail 프록시 |
| State Management | Context / Zustand / Jotai | **Zustand** | 간단한 API, 보일러플레이트 최소, 개인 프로젝트에 적합 |
| Styling | Tailwind / CSS Modules / shadcn/ui | **Tailwind CSS + shadcn/ui** | 빠른 개발, 다크모드 지원 내장 |
| TTS | Web Speech API / Google Cloud TTS | **Web Speech API** | 무료, 브라우저 내장, `onboundary` 지원 |
| Gmail API 호출 | 클라이언트 직접 / API Route 프록시 | **Next.js API Route** | CORS 회피, OAuth 토큰 안전하게 처리 |
| HTML 파싱 | htmlparser2 / cheerio / DOMParser | **htmlparser2** | 경량, 브라우저/서버 모두 동작 |
| AI API 호출 | 클라이언트 직접 / API Route 프록시 | **클라이언트 직접** | 개인용, API 키가 본인 것, 서버 비용 제거 |
| 스와이프 | react-swipeable / 직접 구현 | **react-swipeable** | 검증된 라이브러리, 터치 이벤트 처리 |
| 테스트 | Jest / Vitest / Playwright | **Vitest** | Next.js와 호환, 빠른 실행 |

### 6.3 Clean Architecture Approach

```
Selected Level: Starter

Folder Structure:
┌─────────────────────────────────────────────────────┐
│ src/                                                │
│   app/                                              │
│     layout.tsx          # Root layout + PWA meta     │
│     page.tsx            # 메인 (뉴스레터 목록)        │
│     reader/[id]/                                    │
│       page.tsx          # 카드 리더 + TTS             │
│     settings/                                       │
│       page.tsx          # API 키, 언어, 발신자 설정    │
│     api/                                            │
│       gmail/                                        │
│         route.ts        # Gmail API 프록시            │
│       auth/                                         │
│         route.ts        # Google OAuth 핸들러         │
│   components/                                       │
│     Card.tsx            # 문단 카드 컴포넌트           │
│     TTSPlayer.tsx       # TTS 재생 + 하이라이트        │
│     AIExplainer.tsx     # AI 해설 패널                │
│     ProgressBar.tsx     # 진행률 바                   │
│     SwipeContainer.tsx  # 스와이프 래퍼               │
│   lib/                                              │
│     gmail.ts            # Gmail API 클라이언트         │
│     parser.ts           # HTML → 문단 파싱            │
│     tts.ts              # Web Speech API 래퍼         │
│     ai.ts               # AI API 클라이언트            │
│     storage.ts          # localStorage 유틸           │
│     newsletter-list.ts  # 발신자 화이트리스트           │
│   types/                                            │
│     index.ts            # 타입 정의                   │
│   store/                                            │
│     useReaderStore.ts   # Zustand 상태 관리           │
│ public/                                             │
│   manifest.json         # PWA manifest               │
│   icons/                # PWA 아이콘                  │
└─────────────────────────────────────────────────────┘
```

---

## 7. Convention Prerequisites

### 7.1 Existing Project Conventions

- [ ] `CLAUDE.md` — PRD 문서 (컨벤션 섹션 없음, 추가 필요)
- [ ] ESLint configuration → Next.js 기본 설정 사용
- [ ] Prettier configuration → 생성 필요
- [ ] TypeScript configuration → Next.js 자동 생성

### 7.2 Conventions to Define/Verify

| Category | Current State | To Define | Priority |
|----------|---------------|-----------|:--------:|
| **Naming** | missing | 컴포넌트 PascalCase, 유틸 camelCase, 타입 PascalCase | High |
| **Folder structure** | missing | Starter 레벨 구조 (위 6.3 참조) | High |
| **Import order** | missing | react → next → 외부 라이브러리 → 내부 모듈 → 타입 | Medium |
| **Environment variables** | missing | 아래 7.3 참조 | High |
| **Error handling** | missing | try/catch + 사용자 친화적 에러 메시지 | Medium |

### 7.3 Environment Variables Needed

| Variable | Purpose | Scope | To Be Created |
|----------|---------|-------|:-------------:|
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth Client ID | Client | ✅ |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | Server (API Route) | ✅ |

> AI API 키는 환경변수가 아닌 **사용자가 앱 설정에서 입력** → localStorage 저장

### 7.4 Pipeline Integration

개인 프로젝트이므로 9-phase Pipeline은 적용하지 않음. PDCA 사이클만 사용.

---

## 8. Implementation Order

> Week 단위 일정은 PRD 참조. 아래는 기능 구현 순서.

### Phase 1: 기반 (Week 1)
1. Next.js 프로젝트 초기화 + Tailwind + shadcn/ui
2. PWA 설정 (manifest.json, service worker)
3. Google OAuth 연동 (API Route)
4. Gmail API 연동 (뉴스레터 목록 가져오기)

### Phase 2: 리더 코어 (Week 2)
5. HTML 파싱 → 문단 분리 로직
6. 스와이프 카드 UI (react-swipeable)
7. 진행률 바 + 진행률 localStorage 저장
8. 텍스트 붙여넣기 입력

### Phase 3: TTS (Week 3)
9. Web Speech API TTS 재생/정지/속도 조절
10. `onboundary` 단어 하이라이트 싱크
11. Wake Lock API 화면 꺼짐 방지
12. 자동 다음 카드 전환 (문단 읽기 완료 시)

### Phase 4: AI + 마무리 (Week 4~5)
13. AI 해설 API 연동 (Gemini Flash / Claude Haiku)
14. API 키 설정 화면
15. 다크모드 (Tailwind dark class + 토글)
16. 발신자 화이트리스트 관리 화면
17. Vercel 배포 + 모바일 테스트

---

## 9. Next Steps

1. [ ] Design 문서 작성 (`/pdca design newsletter-reader`)
2. [ ] Next.js 프로젝트 초기화
3. [ ] Google Cloud Console에서 OAuth Client ID 생성

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-03-12 | Initial draft based on PRD v0.5 | dochung |
