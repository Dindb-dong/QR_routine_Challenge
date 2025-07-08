// Push 알림을 처리하는 Service Worker
self.addEventListener('push', function(event) {
  console.log('Push event received:', event);
  
  let notificationData = {
    title: '루틴 챌린지 알림',
    body: '오늘의 출석체크를 잊지 마세요! 🐑',
    icon: '/logo192.png',
    badge: '/logo192.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
      url: '/'
    },
    actions: [
      {
        action: 'check',
        title: '출석체크하기',
        icon: '/logo192.png'
      },
      {
        action: 'close',
        title: '닫기',
        icon: '/logo192.png'
      }
    ],
    requireInteraction: true,
    tag: 'routine-reminder'
  };

  // 이벤트 데이터가 있으면 파싱
  if (event.data) {
    try {
      const data = event.data.json();
      if (data.title) notificationData.title = data.title;
      if (data.body) notificationData.body = data.body;
      if (data.data) notificationData.data = { ...notificationData.data, ...data.data };
    } catch (e) {
      // JSON 파싱 실패 시 텍스트로 처리
      notificationData.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
      .then(() => {
        console.log('Service Worker에서 알림 표시 완료');
        // 알림이 실제로 표시되었는지 확인
        return self.registration.getNotifications();
      })
      .then(notifications => {
        console.log('Service Worker에서 현재 활성 알림 수:', notifications.length);
        notifications.forEach((notif, index) => {
          console.log(`Service Worker 알림 ${index + 1}:`, notif.title, notif.body);
        });
      })
      .catch(error => {
        console.error('Service Worker 알림 표시 실패:', error);
      })
  );
});

// 알림 클릭 이벤트 처리
self.addEventListener('notificationclick', function(event) {
  console.log('=== 알림 클릭 이벤트 발생 ===');
  console.log('알림 제목:', event.notification.title);
  console.log('알림 내용:', event.notification.body);
  console.log('클릭 액션:', event.action);
  console.log('알림 데이터:', event.notification.data);
  
  // 알림 닫기
  event.notification.close();

  // 클라이언트 목록 확인
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(function(clientList) {
      console.log('현재 열린 클라이언트 수:', clientList.length);
      
      // 이미 열린 탭이 있는지 확인
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          console.log('기존 탭에 포커스:', client.url);
          return client.focus();
        }
      }
      
      // 새 탭 열기
      if (clients.openWindow) {
        console.log('새 탭 열기');
        return clients.openWindow('/');
      }
    })
  );
});

// Service Worker 설치
self.addEventListener('install', function(event) {
  console.log('Service Worker installed');
  // 즉시 활성화
  self.skipWaiting();
});

// Service Worker 활성화
self.addEventListener('activate', function(event) {
  console.log('Service Worker activated');
  // 모든 클라이언트에 즉시 제어권 넘기기
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      // 기존 알림 정리
      self.registration.getNotifications().then(notifications => {
        notifications.forEach(notification => notification.close());
      })
    ])
  );
}); 