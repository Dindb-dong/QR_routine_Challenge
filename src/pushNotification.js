// 푸시 알림 관련 유틸리티 함수들

const VAPID_PUBLIC_KEY = 'BATCUyg4e57xNaJQN1rnwsf-KgLPIbXx_lbE0KjrrcLqk_irvw-8A3x297oCAjaBEqrqdlAO5VWcps8m9tP5q_8';

// VAPID 키를 Uint8Array로 변환
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// 푸시 알림 권한 요청
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.log('이 브라우저는 알림을 지원하지 않습니다');
    return false;
  }

  if (Notification.permission === 'granted') {
    console.log('알림 권한이 이미 허용되어 있습니다');
    return true;
  }

  if (Notification.permission === 'denied') {
    console.log('알림 권한이 거부되었습니다');
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

// Service Worker 등록 및 푸시 구독
export async function subscribeToPushNotifications() {
  try {
    console.log('=== Service Worker 등록 시작 ===');
    
    // 기존 Service Worker 등록 확인
    let registration = await navigator.serviceWorker.getRegistration();
    console.log('기존 Service Worker 등록 상태:', registration ? '있음' : '없음');
    
    if (!registration) {
      // Service Worker 등록
      console.log('새 Service Worker 등록 중...');
      registration = await navigator.serviceWorker.register('/push-sw.js');
      console.log('Service Worker 등록됨:', registration);
    } else {
      console.log('기존 Service Worker 발견:', registration);
      
      // 기존 Service Worker가 활성 상태인지 확인
      if (!registration.active) {
        console.log('기존 Service Worker가 비활성 상태, 새로 등록...');
        await registration.unregister();
        registration = await navigator.serviceWorker.register('/push-sw.js');
        console.log('새 Service Worker 등록됨:', registration);
      }
    }

    // Service Worker가 활성화될 때까지 대기
    console.log('Service Worker 활성화 대기 중...');
    await navigator.serviceWorker.ready;
    console.log('Service Worker 활성화 완료');

    // Service Worker가 실제로 제어하고 있는지 확인
    if (navigator.serviceWorker.controller) {
      console.log('Service Worker가 현재 페이지를 제어 중');
    } else {
      console.log('Service Worker가 현재 페이지를 제어하지 않음');
      console.log('페이지 새로고침이 필요할 수 있습니다.');
    }

    // 기존 구독 확인
    let subscription = await registration.pushManager.getSubscription();
    console.log('기존 푸시 구독 상태:', subscription ? '있음' : '없음');
    
    if (!subscription) {
      // 새 푸시 구독
      console.log('새 푸시 구독 생성 중...');
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });
      console.log('새 푸시 구독 성공:', subscription);
    } else {
      console.log('기존 푸시 구독 발견:', subscription);
    }
    
    // 구독 정보를 로컬 스토리지에 저장
    localStorage.setItem('push_subscription', JSON.stringify(subscription));
    console.log('푸시 구독 정보 저장 완료');
    
    return subscription;
  } catch (error) {
    console.error('푸시 구독 실패:', error);
    console.error('오류 상세:', error.message, error.stack);
    return null;
  }
}

// 푸시 구독 해제
export async function unsubscribeFromPushNotifications() {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      await subscription.unsubscribe();
      localStorage.removeItem('push_subscription');
      console.log('푸시 구독 해제됨');
    }
  } catch (error) {
    console.error('푸시 구독 해제 실패:', error);
  }
}

// 다음 날 알림 스케줄링
export function scheduleNextDayNotification(lastAttendanceDate) {
  if (!lastAttendanceDate) return;

  const lastDate = new Date(lastAttendanceDate);
  const nextDate = new Date(lastDate);
  nextDate.setDate(nextDate.getDate() + 1);
  
  // 다음 날 오후 8시로 설정
  nextDate.setHours(20, 0, 0, 0);
  
  const now = new Date();
  const timeUntilNotification = nextDate.getTime() - now.getTime();
  
  // 이미 지난 시간이면 스케줄링하지 않음
  if (timeUntilNotification <= 0) {
    console.log('알림 시간이 이미 지났습니다');
    return;
  }

  console.log(`다음 알림 예정: ${nextDate.toLocaleString()}`);
  
  // 알림 정보를 로컬 스토리지에 저장
  const notificationInfo = {
    scheduledTime: nextDate.getTime(),
    lastAttendanceDate: lastAttendanceDate,
    message: '오늘의 출석체크를 잊지 마세요! 🐑'
  };
  localStorage.setItem('scheduled_notification', JSON.stringify(notificationInfo));
  
  // 브라우저가 백그라운드일 때도 알림을 받기 위해 setTimeout 사용
  const timerId = setTimeout(() => {
    sendLocalNotification();
    // 알림 전송 후 저장된 정보 삭제
    localStorage.removeItem('scheduled_notification');
  }, timeUntilNotification);
  
  // 타이머 ID를 저장하여 필요시 취소할 수 있도록 함
  window.notificationTimer = timerId;
}

// 로컬 알림 전송 (브라우저가 열려있을 때)
function sendLocalNotification() {
  if (Notification.permission === 'granted') {
    const notification = new Notification('루틴 챌린지 알림', {
      body: '오늘의 출석체크를 잊지 마세요! 🐑',
      icon: '/logo192.png',
      badge: '/logo192.png',
      vibrate: [200, 100, 200],
      requireInteraction: true
    });

    notification.onclick = function() {
      window.focus();
      notification.close();
    };
  }
}

// 출석체크 후 다음 날 알림 설정
export function setupNextDayNotificationAfterCheck(today) {
  // 기존 타이머 클리어
  if (window.notificationTimer) {
    clearTimeout(window.notificationTimer);
  }
  
  // 다음 날 알림 스케줄링
  scheduleNextDayNotification(today);
}

// 간단한 테스트 알림 (Service Worker 없이)
export function sendSimpleNotification() {
  if (Notification.permission !== 'granted') {
    console.log('알림 권한이 없습니다');
    return;
  }

  try {
    const notification = new Notification('간단한 테스트 알림', {
      body: '이것은 가장 기본적인 알림입니다! 🐑',
      icon: '/logo192.png',
      requireInteraction: false
    });

    notification.onclick = function() {
      console.log('간단한 알림 클릭됨');
      window.focus();
      notification.close();
    };

    console.log('간단한 알림 전송 성공!');
  } catch (error) {
    console.error('간단한 알림 실패:', error);
  }
}

// 테스트용: 즉시 알림 전송 (개발용)
export async function sendTestNotification() {
  console.log('=== Service Worker 알림 테스트 시작 ===');
  console.log('알림 권한 상태:', Notification.permission);
  
  if (Notification.permission !== 'granted') {
    console.log('알림 권한이 없습니다');
    return;
  }

  // 브라우저 알림 설정 확인
  console.log('브라우저 알림 설정 확인 중...');
  if ('permissions' in navigator) {
    const permission = await navigator.permissions.query({ name: 'notifications' });
    console.log('알림 권한 세부 상태:', permission.state);
  }

  try {
    // Service Worker 등록 상태 확인
    const registration = await navigator.serviceWorker.getRegistration();
    console.log('Service Worker 등록 상태:', registration ? '등록됨' : '등록되지 않음');
    
    if (!registration) {
      console.log('Service Worker가 등록되지 않았습니다. 새로 등록합니다...');
      await subscribeToPushNotifications();
    }
    
    // Service Worker가 활성화될 때까지 대기
    const activeRegistration = await navigator.serviceWorker.ready;
    console.log('Service Worker 활성화됨:', activeRegistration);
    console.log('Service Worker 상태:', activeRegistration.active ? '활성' : '비활성');
    
    // Service Worker가 실제로 제어하고 있는지 확인
    if (navigator.serviceWorker.controller) {
      console.log('Service Worker가 현재 페이지를 제어 중');
    } else {
      console.log('Service Worker가 현재 페이지를 제어하지 않음 - 페이지 새로고침 필요');
    }
    
    // 알림 옵션 설정 (Service Worker 알림용으로 최적화)
    const notificationOptions = {
      body: '이것은 Service Worker 테스트 알림입니다! 🐑',
      icon: '/logo192.png',
      badge: '/logo192.png',
      vibrate: [200, 100, 200],
      requireInteraction: false, // true로 하면 사용자가 직접 닫아야 함
      tag: 'sw-test-notification',
      data: {
        url: window.location.href,
        timestamp: Date.now(),
        type: 'service-worker-test'
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
      ]
    };
    
    console.log('Service Worker 알림 옵션:', notificationOptions);
    
    // Service Worker를 통해 알림 전송
    console.log('Service Worker 알림 전송 시도...');
    
    // Service Worker가 실제로 활성 상태인지 한 번 더 확인
    if (!activeRegistration.active) {
      throw new Error('Service Worker가 활성 상태가 아닙니다');
    }
    
    await activeRegistration.showNotification('Service Worker 테스트 알림', notificationOptions);
    console.log('Service Worker 알림 전송 성공!');
    
    // 즉시 알림 상태 확인
    const notifications = await activeRegistration.getNotifications();
    console.log('전송 직후 활성 알림 수:', notifications.length);
    notifications.forEach((notif, index) => {
      console.log(`Service Worker 알림 ${index + 1}:`, notif.title, notif.body);
    });
    
    // 3초 후 알림 상태 재확인
    setTimeout(async () => {
      console.log('3초 후 Service Worker 알림 상태 확인...');
      const notifications = await activeRegistration.getNotifications();
      console.log('현재 활성 Service Worker 알림 수:', notifications.length);
      notifications.forEach((notif, index) => {
        console.log(`Service Worker 알림 ${index + 1}:`, notif.title, notif.body);
      });
    }, 3000);
    
  } catch (error) {
    console.error('Service Worker 알림 전송 실패:', error);
    console.error('오류 상세:', error.message, error.stack);
    
    // 대안: 일반 Notification API 사용
    try {
      console.log('Service Worker 실패, 일반 알림으로 시도...');
      const notification = new Notification('테스트 알림 (일반)', {
        body: '이것은 일반 Notification API로 보낸 테스트 알림입니다! 🐑',
        icon: '/logo192.png',
        badge: '/logo192.png',
        vibrate: [200, 100, 200],
        requireInteraction: true,
        tag: 'test-notification-fallback'
      });
      
      // 일반 Notification API는 onclick 이벤트를 지원함
      if (notification && typeof notification.onclick === 'function') {
        notification.onclick = function(event) {
          console.log('일반 알림 클릭됨:', event);
          window.focus();
          notification.close();
        };
      }
      
      console.log('일반 알림 전송 성공!');
    } catch (fallbackError) {
      console.error('일반 알림도 실패:', fallbackError);
      console.error('일반 알림 오류 상세:', fallbackError.message, fallbackError.stack);
    }
  }
}

// 브라우저 알림 설정 확인
export async function checkNotificationSettings() {
  console.log('=== 브라우저 알림 설정 확인 ===');
  
  // 기본 알림 권한
  console.log('Notification.permission:', Notification.permission);
  
  // 상세 권한 정보
  if ('permissions' in navigator) {
    try {
      const permission = await navigator.permissions.query({ name: 'notifications' });
      console.log('상세 알림 권한:', permission.state);
    } catch (e) {
      console.log('상세 권한 확인 실패:', e);
    }
  }
  
  // Service Worker 상태
  const registration = await navigator.serviceWorker.getRegistration();
  console.log('Service Worker 등록:', registration ? '있음' : '없음');
  
  if (registration) {
    console.log('Service Worker 상태:', registration.active ? '활성' : '비활성');
    console.log('Service Worker 스코프:', registration.scope);
  }
  
  // 푸시 구독 상태
  if (registration) {
    const subscription = await registration.pushManager.getSubscription();
    console.log('푸시 구독:', subscription ? '있음' : '없음');
  }
  
  // 운영체제 알림 설정 확인 (macOS)
  if (navigator.platform.includes('Mac')) {
    console.log('macOS 알림 설정 확인 필요:');
    console.log('1. 시스템 환경설정 > 알림 및 포커스');
    console.log('2. 브라우저 알림 허용 확인');
  }
  
  return {
    permission: Notification.permission,
    serviceWorker: !!registration,
    pushSubscription: registration ? !!(await registration.pushManager.getSubscription()) : false
  };
}

// Service Worker 강제 새로고침 (디버깅용)
export async function forceRefreshServiceWorker() {
  try {
    console.log('=== Service Worker 강제 새로고침 시작 ===');
    
    // 모든 Service Worker 등록 해제
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const registration of registrations) {
      await registration.unregister();
      console.log('Service Worker 등록 해제됨:', registration.scope);
    }
    
    // 브라우저 캐시 클리어 (선택사항)
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      for (const cacheName of cacheNames) {
        await caches.delete(cacheName);
        console.log('캐시 삭제됨:', cacheName);
      }
    }
    
    // 새로 등록
    await subscribeToPushNotifications();
    console.log('Service Worker 새로 등록됨');
    
    // Service Worker가 페이지를 제어하는지 확인
    if (navigator.serviceWorker.controller) {
      console.log('Service Worker가 페이지를 제어 중');
    } else {
      console.log('Service Worker가 페이지를 제어하지 않음');
      console.log('페이지를 새로고침하거나 탭을 다시 열어주세요!');
      console.log('또는 브라우저를 완전히 종료하고 다시 열어보세요.');
    }
    
    return true;
  } catch (error) {
    console.error('Service Worker 새로고침 실패:', error);
    console.error('오류 상세:', error.message, error.stack);
    return false;
  }
}

// 앱 시작 시 알림 권한 확인 및 설정
export async function initializeNotifications() {
  const hasPermission = await requestNotificationPermission();
  
  if (hasPermission) {
    await subscribeToPushNotifications();
    
    // 이전에 스케줄된 알림 확인 및 복원
    const scheduledNotification = localStorage.getItem('scheduled_notification');
    if (scheduledNotification) {
      const notificationInfo = JSON.parse(scheduledNotification);
      const now = new Date().getTime();
      const timeUntilNotification = notificationInfo.scheduledTime - now;
      
      if (timeUntilNotification > 0) {
        console.log('이전에 스케줄된 알림을 복원합니다');
        const timerId = setTimeout(() => {
          sendLocalNotification();
          localStorage.removeItem('scheduled_notification');
        }, timeUntilNotification);
        window.notificationTimer = timerId;
      } else {
        // 이미 지난 알림은 삭제
        localStorage.removeItem('scheduled_notification');
      }
    }
    
    // 마지막 출석 날짜 확인하여 알림 재설정
    const stamps = JSON.parse(localStorage.getItem('night_routine_stamps_v6') || '[]');
    if (stamps.length > 0) {
      const lastAttendance = stamps.sort().pop();
      setupNextDayNotificationAfterCheck(lastAttendance);
    }
  }
  
  return hasPermission;
} 