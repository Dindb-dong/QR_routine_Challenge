# 로컬 테스트 가이드 🔧

## Service Worker 오류 해결 방법

### 문제: "No active registration available on the ServiceWorkerRegistration"

이 오류는 Service Worker가 제대로 등록되지 않았거나 활성화되지 않았을 때 발생합니다.

## 해결 방법

### 1. 개선된 로컬 서버 사용

```bash
# Express 서버로 테스트 (권장)
npm run serve-test

# 또는 기본 serve 사용
npm run serve
```

### 2. 브라우저 캐시 클리어

1. **개발자 도구** 열기 (F12)
2. **Application** 탭 선택
3. **Storage** > **Clear storage** 클릭
4. **Clear site data** 클릭

### 3. Service Worker 강제 새로고침

1. **SW 새로고침** 버튼 클릭
2. 콘솔에서 "Service Worker가 페이지를 제어 중" 메시지 확인
3. 만약 "페이지 새로고침 필요" 메시지가 나오면:
   - 페이지 새로고침 (Ctrl+R / Cmd+R)
   - 또는 브라우저 탭을 닫고 다시 열기

### 4. 브라우저별 확인사항

#### Chrome

1. **chrome://serviceworker-internals/** 접속
2. 해당 사이트의 Service Worker 상태 확인
3. 필요시 "Unregister" 클릭 후 재등록

#### Firefox

1. **about:debugging#/runtime/this-firefox** 접속
2. Service Workers 탭에서 상태 확인

#### Safari

1. **개발자 도구** > **Application** > **Service Workers**
2. Service Worker 상태 확인

### 5. 단계별 테스트 순서

1. **빌드 생성**:

   ```bash
   npm run build
   ```

2. **로컬 서버 실행**:

   ```bash
   npm run serve-test
   ```

3. **브라우저에서 접속**:

   ```
   http://localhost:3000
   ```

4. **개발자 도구 확인**:

   - Console 탭에서 오류 메시지 확인
   - Application > Service Workers에서 등록 상태 확인

5. **알림 테스트**:

   - **설정확인** 버튼 클릭
   - **SW 새로고침** 버튼 클릭
   - **간단테스트** 버튼 클릭
   - **SW테스트** 버튼 클릭

### 6. 문제 해결 체크리스트

- [ ] 브라우저가 HTTPS 또는 localhost에서 실행 중
- [ ] 알림 권한이 허용됨
- [ ] Service Worker가 등록되고 활성화됨
- [ ] Service Worker가 페이지를 제어 중
- [ ] 브라우저 캐시가 클리어됨
- [ ] 페이지가 새로고침됨

### 7. 디버깅 팁

#### 콘솔 로그 확인

```
=== Service Worker 등록 시작 ===
기존 Service Worker 등록 상태: 없음
새 Service Worker 등록 중...
Service Worker 등록됨: ServiceWorkerRegistration
Service Worker 활성화 대기 중...
Service Worker 활성화 완료
Service Worker가 현재 페이지를 제어 중
```

#### 오류 메시지 해석

- **"No active registration"**: Service Worker가 활성화되지 않음
- **"Failed to register"**: Service Worker 파일을 찾을 수 없음
- **"Permission denied"**: 알림 권한이 거부됨

### 8. 대안 테스트 방법

만약 Service Worker가 계속 문제가 있다면:

1. **간단테스트**만 사용 (Service Worker 없이)
2. **브라우저를 완전히 종료하고 재시작**
3. **시크릿/프라이빗 모드에서 테스트**
4. **다른 브라우저로 테스트**

### 9. 프로덕션 환경 확인

로컬에서 문제가 있다면 Netlify 배포 후 테스트:

1. **GitHub에 푸시**
2. **Netlify에서 배포**
3. **HTTPS 환경에서 테스트** (Service Worker는 HTTPS에서만 작동)

## 성공적인 테스트 결과

✅ Service Worker 등록 성공
✅ 알림 권한 허용됨
✅ 간단테스트 알림 수신
✅ SW테스트 알림 수신
✅ Service Worker가 페이지 제어 중

🎉 모든 테스트가 성공하면 Netlify 배포 준비 완료!
