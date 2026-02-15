# 액세서리 챗봇 - 관리자 대시보드

React 기반 관리자 대시보드 + LINE Messaging API + Supabase CRM

## 기능

- **고객 CRM**: LINE User ID, 대화 내역 저장
- **AI / CS 모드**: AI 자동 응답 또는 관리자 직접 응답
- **메모**: 고객별 메모 작성·저장
- **메시지 발송**: 관리자가 LINE 사용자에게 직접 메시지 전송

## 기술 스택

- **Frontend**: React (Vite)
- **Backend**: Vercel Serverless Functions
- **DB**: Supabase (PostgreSQL)
- **LINE**: Messaging API

## 배포 (GitHub + Vercel)

### 1. Supabase 설정

1. [Supabase](https://supabase.com)에서 프로젝트 생성
2. SQL Editor에서 `supabase/schema.sql` 실행
3. Settings → API에서 **Project URL**, **service_role key** 복사

### 2. LINE Developers 설정

1. [LINE Developers Console](https://developers.line.biz/console/)에서 Messaging API 채널 생성
2. **Channel secret**, **Channel access token** 복사
3. Webhook URL: `https://your-app.vercel.app/api/webhook`
4. Auto-reply / Greeting 메시지 **사용 안 함**

### 3. GitHub → Vercel 배포

1. GitHub 저장소에 푸시
2. [Vercel](https://vercel.com)에서 프로젝트 Import
3. **Environment Variables** 설정:

| 변수명 | 값 |
|--------|-----|
| `ADMIN_PASSWORD` | 관리자 로그인 비밀번호 |
| `LINE_CHANNEL_SECRET` | LINE 채널 시크릿 |
| `LINE_CHANNEL_ACCESS_TOKEN` | LINE 채널 액세스 토큰 |
| `SUPABASE_URL` | Supabase Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service_role key |

4. Deploy

## 로컬 개발

```bash
# 1. 의존성 설치
npm install
cd dashboard && npm install

# 2. .env.local 생성 (프로젝트 루트)
# ADMIN_PASSWORD=yourpassword
# LINE_CHANNEL_SECRET=...
# LINE_CHANNEL_ACCESS_TOKEN=...
# SUPABASE_URL=...
# SUPABASE_SERVICE_ROLE_KEY=...

# 3. Vercel CLI로 로컬 실행 (API + 프론트 함께)
npx vercel dev
```

또는 API와 프론트를 따로 실행:

```bash
# 터미널 1: API (vercel dev)
npx vercel dev

# 터미널 2: React 개발 서버
cd dashboard && VITE_API_URL=http://localhost:3000 npm run dev
```

## 프로젝트 구조

```
├── dashboard/          # React 관리자 대시보드
│   ├── src/
│   │   ├── pages/      # Customers, CustomerDetail, Settings, Login
│   │   └── components/
│   └── ...
├── api/                # Vercel Serverless
│   ├── webhook.js      # LINE Webhook (DB 저장, AI/CS 분기)
│   ├── users.js        # 고객 목록
│   ├── user-detail.js  # 고객 상세 + 메모
│   ├── send-message.js # 관리자 → LINE 발송
│   ├── settings.js     # AI/CS 모드
│   └── lib/
├── supabase/
│   └── schema.sql
└── vercel.json
```

## API 엔드포인트

| Method | Path | 설명 |
|--------|------|------|
| GET | /api/users | 고객 목록 (Authorization: Bearer ADMIN_PASSWORD) |
| GET | /api/user-detail?userId= | 고객 상세 + 메시지 |
| PATCH | /api/user-detail | 메모 수정 |
| POST | /api/send-message | LINE 메시지 발송 |
| GET/PATCH | /api/settings | AI/CS 모드 |
| POST | /api/webhook | LINE Webhook |

## GitHub Pages (대시보드만)

대시보드는 정적 빌드로 GitHub Pages에 올릴 수 있습니다.  
단, **API는 Vercel 등 별도 서버 필요**합니다.

1. Settings → Pages → Source: **GitHub Actions**
2. 배포 후, 대시보드에서 API를 사용하려면  
   `dashboard/.env.production` 또는 빌드 시 `VITE_API_URL=https://your-api.vercel.app` 설정


배포 순서
Supabase: 프로젝트 생성 후 supabase/schema.sql 실행
LINE Developers: Messaging API 채널 생성, Webhook URL 설정
GitHub: 저장소 푸시
Vercel: Import 후 환경 변수 설정