// 로컬 테스트용 서버 스크립트
const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

// 정적 파일 제공
app.use(express.static('build'));

// Service Worker 파일에 대한 특별한 헤더 설정
app.get('/push-sw.js', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.sendFile(path.join(__dirname, 'build', 'push-sw.js'));
});

// SPA 라우팅 지원 - 더 간단한 방식
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 로컬 테스트 서버가 http://localhost:${PORT} 에서 실행 중입니다`);
  console.log('📝 Service Worker 테스트를 위해 다음을 확인하세요:');
  console.log('1. 브라우저에서 http://localhost:3000 접속');
  console.log('2. 개발자 도구 > Application > Service Workers 확인');
  console.log('3. "SW 새로고침" 버튼 클릭');
  console.log('4. "SW테스트" 버튼으로 알림 테스트');
}); 