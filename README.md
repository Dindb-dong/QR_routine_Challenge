# 루틴 챌린지 캘린더

연속 출석체크를 통해 루틴을 형성하는 웹 애플리케이션입니다. 매일 출석체크를 하여 연속성을 유지하고, 성공 시 경품 응모 기회를 제공합니다.

## 🌟 주요 기능

### 📅 캘린더 뷰

- **월별 캘린더**: 출석 기록을 시각적으로 확인할 수 있는 직관적인 캘린더
- **오늘 날짜 하이라이트**: 현재 날짜를 명확하게 표시
- **출석 스탬프**: 출석한 날짜는 체크마크(✓)로 표시

### ✅ 출석체크 시스템

- **인터넷 시간 동기화**: NTP API를 통한 정확한 날짜 확인
- **연속 출석 관리**: 연속 출석 시 성공, 중단 시 챌린지 실패
- **시각적 피드백**: 출석체크 시 컨페티 애니메이션 효과
- **실패 상태 관리**: 연속성이 끊어지면 더 이상 출석체크 불가

### 🔔 푸시 알림 시스템

- **자동 알림 스케줄링**: 출석체크 후 다음 날 오후 8시에 자동 알림 예약
- **브라우저 백그라운드 지원**: 브라우저가 닫혀있어도 알림 수신 가능
- **알림 액션**: 알림에서 바로 출석체크 페이지로 이동 가능
- **앱 재시작 시 복원**: 브라우저를 다시 열어도 예약된 알림 유지

### 🎯 챌린지 시스템

- **연속 출석 조건**: 연속 출석이 끊어지면 챌린지 실패
- **응모 자격**: 성공 시 경품 응모 기능 제공
- **진행 상황 표시**: 현재 달의 출석 횟수 실시간 표시

## 🚀 사용 방법

### 기본 사용법

1. **웹사이트 접속**: 브라우저에서 앱 접속
2. **알림 설정**: "🔔 알림 받기" 버튼으로 푸시 알림 활성화
3. **출석체크**: "출석체크하기" 버튼으로 매일 출석 기록
4. **진행 확인**: 캘린더에서 출석 기록 시각적 확인
5. **응모 참여**: 성공 시 "응모하러 가기" 버튼으로 경품 응모

### 푸시 알림 활용

1. **알림 권한 허용**: 브라우저 팝업에서 "허용" 선택
2. **자동 알림**: 출석체크 시 자동으로 다음 날 알림 설정
3. **알림 수신**: 지정된 시간에 푸시 알림 전송
4. **빠른 접속**: 알림 클릭 시 바로 출석체크 페이지로 이동

## 🛠 기술 스택

### Frontend

- **React.js**: 사용자 인터페이스 구축
- **CSS3**: 그라디언트, 애니메이션, 반응형 디자인
- **Service Worker**: 푸시 알림 및 백그라운드 처리
- **Push API**: 브라우저 푸시 알림 기능

### 데이터 관리

- **LocalStorage**: 사용자 출석 데이터 로컬 저장
- **NTP API**: 정확한 인터넷 시간 동기화
- **VAPID**: 보안된 푸시 알림 전송

### 배포 및 호스팅

- **Netlify**: 자동 배포 및 HTTPS 제공
- **GitHub**: 버전 관리 및 CI/CD

## 📱 브라우저 지원

- **Chrome**: 42+ (권장)
- **Firefox**: 44+
- **Safari**: 16+
- **Edge**: 17+

## 🔧 개발 환경 설정

### 필수 요구사항

- Node.js 18+
- npm 또는 yarn

### 설치 및 실행

```bash
# 저장소 클론
git clone https://github.com/Dindb-dong/QR_routine_Challenge.git
cd QR_routine_Challenge

# 의존성 설치
npm install

# 개발 서버 실행
npm start

# 프로덕션 빌드
npm run build

# 로컬 테스트 서버
npm run serve-test
```

### 환경변수 설정

```bash
# .env.local 파일 생성
REACT_APP_ENV=development
REACT_APP_SITE_URL=http://localhost:3000
```

## 🧪 테스트

### 로컬 테스트

```bash
# 개발 모드
npm start

# 프로덕션 빌드 테스트
npm run serve-test
```

### 기능 테스트

1. **알림 권한**: "🔔 알림 받기" 버튼 테스트
2. **출석체크**: "출석체크하기" 버튼 테스트
3. **푸시 알림**: "간단테스트" 및 "SW테스트" 버튼
4. **Service Worker**: "SW 새로고침" 및 "설정확인" 버튼

## 📋 프로젝트 구조

```
QR_challenge/
├── public/
│   ├── push-sw.js          # Service Worker
│   ├── manifest.json       # PWA 매니페스트
│   └── sheep.png          # 메인 이미지
├── src/
│   ├── App.js             # 메인 컴포넌트
│   ├── App.css            # 스타일시트
│   ├── pushNotification.js # 푸시 알림 유틸리티
│   └── index.js           # 앱 진입점
├── netlify.toml           # Netlify 배포 설정
└── package.json           # 프로젝트 설정
```

## 🤝 기여하기

### 개발 참여

1. **Fork**: 저장소를 포크
2. **브랜치 생성**: `git checkout -b feature/amazing-feature`
3. **변경사항 커밋**: `git commit -m 'Add amazing feature'`
4. **브랜치 푸시**: `git push origin feature/amazing-feature`
5. **Pull Request**: GitHub에서 PR 생성

### 이슈 리포트

- 버그 리포트: [Issues](https://github.com/your-username/QR_challenge/issues) 탭에서 신규 이슈 생성
- 기능 요청: 이슈에 "Feature Request" 라벨 추가

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 📞 문의 및 지원

- **이메일**: dongwook443@yonsei.ac.kr
- **GitHub Issues**: [이슈 등록](https://github.com/your-username/QR_challenge/issues)
- **문서**: [배포 가이드](DEPLOYMENT_GUIDE.md), [로컬 테스트 가이드](LOCAL_TESTING_GUIDE.md)

---

**루틴 챌린지 캘린더**로 매일의 작은 습관을 큰 성취로 만들어보세요!✨
