import React, { useEffect, useState } from 'react';
import './App.css';
import { 
  initializeNotifications, 
  setupNextDayNotificationAfterCheck,
  requestNotificationPermission,
  sendTestNotification,
  sendSimpleNotification,
  forceRefreshServiceWorker,
  checkNotificationSettings
} from './pushNotification';

// 인터넷 시간(NTP API) 가져오기
async function fetchInternetDate() {
  try {
    // 1순위: timeapi.io
    const res = await fetch('https://timeapi.io/api/Time/current/zone?timeZone=Asia/Seoul');
    if (res.ok) {
      const data = await res.json();
      console.log('timeapi.io', data);
      // year, month, day 필드를 조합해 YYYY-MM-DD로 반환
      if (data.year && data.month && data.day) {
        const yyyy = String(data.year);
        const mm = String(data.month).padStart(2, '0');
        const dd = String(data.day).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
      }
    }
    throw new Error('timeapi.io failed');
  } catch {
    try {
      // 2순위: worldtimeapi.org
      const res2 = await fetch('https://worldtimeapi.org/api/timezone/Asia/Seoul');
      if (res2.ok) {
        const data2 = await res2.json();
        console.log('worldtimeapi.org', data2);
        return data2.datetime.slice(0, 10); // 'YYYY-MM-DD'
      }
      throw new Error('worldtimeapi failed');
    } catch {
      // 3순위: 로컬 시간 fallback
      return new Date().toISOString().slice(0, 10);
    }
  }
}

const STAMP_KEY = 'night_routine_stamps_v6';
const CHALLENGE_FAILED_KEY = 'night_routine_challenge_failed_v6';

function getMonthMatrix(year, month) {
  // month: 0-indexed
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDay = firstDay.getDay(); // 0:일~6:토
  const daysInMonth = lastDay.getDate();
  const matrix = [];
  let week = Array(startDay).fill(null);
  for (let d = 1; d <= daysInMonth; d++) {
    week.push(d);
    if (week.length === 7) {
      matrix.push(week);
      week = [];
    }
  }
  if (week.length) matrix.push([...week, ...Array(7 - week.length).fill(null)]);
  return matrix;
}

// 날짜 비교 함수 (YYYY-MM-DD 형식)
function isConsecutive(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2 - d1);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays === 1;
}

// 가장 최근 출석 날짜 찾기
function getLastAttendanceDate(stamps) {
  if (stamps.length === 0) return null;
  return stamps.sort().pop(); // 가장 최근 날짜 반환
}

// 기기/브라우저 감지 함수
function getDeviceAlertMessage() {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua) && /Safari/.test(ua) && !/CriOS|FxiOS/.test(ua)) {
    // iOS 사파리
    return "iOS 사파리에서는 웹사이트를 '홈 화면에 추가'한 후 알림을 허용해야 푸시 알림을 받을 수 있습니다.";
  } else if (/SamsungBrowser/.test(ua)) {
    // 삼성 인터넷 브라우저
    return "삼성 인터넷 브라우저에서는 브라우저 설정 > 사이트 및 다운로드 > 알림에서 알림을 허용해주세요.";
  } else if (/Android/.test(ua) && /Chrome/.test(ua)) {
    // 안드로이드 크롬
    return "안드로이드 크롬에서는 브라우저 설정 > 사이트 설정 > 알림에서 알림을 허용해주세요.";
  } else {
    // 기타
    return "사용하시는 브라우저의 알림 설정을 확인해주세요.";
  }
}

function App() {
  const [stamps, setStamps] = useState([]); // ['YYYY-MM-DD', ...]
  const [today, setToday] = useState('');
  const [viewYear, setViewYear] = useState(0);
  const [viewMonth, setViewMonth] = useState(0); // 0-indexed
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [confetti, setConfetti] = useState([]);
  const [buttonClicked, setButtonClicked] = useState(false);
  const [challengeFailed, setChallengeFailed] = useState(false);
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [entryPhone, setEntryPhone] = useState('');
  const [showEntrySuccess, setShowEntrySuccess] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState('default');

  // 날짜 불러오기 및 초기 월 설정
  useEffect(() => {
    fetchInternetDate().then(date => {
      setToday(date);
      const [y, m] = date.split('-');
      setViewYear(Number(y));
      setViewMonth(Number(m) - 1);
      setLoading(false);
    });
    const saved = JSON.parse(localStorage.getItem(STAMP_KEY) || '[]');
    const failed = localStorage.getItem(CHALLENGE_FAILED_KEY) === 'true';
    setStamps(saved);
    setChallengeFailed(failed);
    
    // 알림 권한 확인 및 초기화
    initializeNotifications().then(hasPermission => {
      setNotificationPermission(hasPermission ? 'granted' : 'denied');
    });
  }, []);

  // 컨페티 생성 함수
  const createConfetti = () => {
    const confettiTypes = ['circle', 'square', 'triangle', 'star'];
    const colors = ['#ff6b9d', '#ff8fab', '#ffb3c7', '#ffd1dc', '#ffd700'];
    const newConfetti = [];
    
    for (let i = 0; i < 30; i++) {
      const type = confettiTypes[Math.floor(Math.random() * confettiTypes.length)];
      const color = colors[Math.floor(Math.random() * colors.length)];
      const left = Math.random() * 100;
      const delay = Math.random() * 0.5;
      const duration = 2 + Math.random() * 2;
      
      newConfetti.push({
        id: Date.now() + i,
        type,
        color,
        left: `${left}%`,
        delay: `${delay}s`,
        duration: `${duration}s`
      });
    }
    
    setConfetti(newConfetti);
    
    // 3초 후 컨페티 제거
    setTimeout(() => {
      setConfetti([]);
    }, 3000);
  };

  // 출석체크
  const handleCheck = () => {
    if (!today) return;
    
    // 이미 실패한 경우
    if (challengeFailed) {
      setMessage('실패한 루틴 챌린지입니다 ㅠㅠ');
      return;
    }
    
    // 이미 오늘 출석한 경우
    if (stamps.includes(today)) {
      setMessage('오늘은 이미 출석체크를 하셨습니다!');
      return;
    }
    
    const lastAttendance = getLastAttendanceDate(stamps);
    
    // 첫 출석이거나 연속 출석인 경우
    if (!lastAttendance || isConsecutive(lastAttendance, today)) {
      // 버튼 팡 효과
      setButtonClicked(true);
      setTimeout(() => setButtonClicked(false), 600);
      
      // 컨페티 애니메이션
      createConfetti();
      
      const updated = [...stamps, today];
      setStamps(updated);
      console.log('updated', updated);
      localStorage.setItem(STAMP_KEY, JSON.stringify(updated));
      setMessage('출석체크 완료! 🎉');
      
      // 다음 날 알림 설정
      setupNextDayNotificationAfterCheck(today);
    } else {
      // 연속 출석이 끊어진 경우 - 챌린지 실패
      setChallengeFailed(true);
      localStorage.setItem(CHALLENGE_FAILED_KEY, 'true');
      setMessage('루틴 챌린지에 실패했습니다... 다음 기회에 봐요! 😢');
    }
  };

  // 월 이동
  const moveMonth = (diff) => {
    let y = viewYear;
    let m = viewMonth + diff;
    if (m < 0) { y -= 1; m = 11; }
    if (m > 11) { y += 1; m = 0; }
    setViewYear(y);
    setViewMonth(m);
    setMessage('');
  };

  // 달력 데이터
  const matrix = getMonthMatrix(viewYear, viewMonth);
  const monthStr = `${viewYear}년 ${viewMonth + 1}월`;
  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

  // 오늘 날짜(YYYY-MM-DD)와 달력의 날짜(숫자)를 비교해 오늘 표시
  const isToday = (d) => {
    if (!d) return false;
    const [y, m, day] = today.split('-');
    return Number(y) === viewYear && Number(m) === viewMonth + 1 && Number(day) === d;
  };

  // 해당 날짜에 스탬프가 있는지
  const hasStamp = (d) => {
    if (!d) return false;
    const mm = String(viewMonth + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    const dateStr = `${viewYear}-${mm}-${dd}`;
    return stamps.includes(dateStr);
  };

  // 오늘 출석 여부
  const checkedToday = stamps.includes(today);

  // 14개 이상 스탬프 조건
  const canShowEntry = !challengeFailed && stamps.length >= 1;

  // 응모 완료 핸들러
  const handleEntrySubmit = (e) => {
    e.preventDefault();
    if (!entryPhone || entryPhone.length !== 11) return;
    setShowEntryModal(false);
    setEntryPhone('');
    setShowEntrySuccess(true);
    // 실제로는 서버로 전화번호를 전송하는 로직이 들어갈 수 있음
  };

  // 알림 권한 요청 핸들러
  const handleRequestNotificationPermission = async () => {
    // 기기별 안내 메시지 alert
    alert(getDeviceAlertMessage());
    const hasPermission = await requestNotificationPermission();
    setNotificationPermission(hasPermission ? 'granted' : 'denied');
  };

  // 테스트 알림 전송 핸들러
  const handleTestNotification = async () => {
    await sendTestNotification();
  };

  // 간단한 테스트 알림 핸들러
  const handleSimpleNotification = () => {
    sendSimpleNotification();
  };

  // Service Worker 새로고침 핸들러
  const handleRefreshServiceWorker = async () => {
    const success = await forceRefreshServiceWorker();
    if (success) {
      setMessage('Service Worker가 새로고침되었습니다!');
    } else {
      setMessage('Service Worker 새로고침에 실패했습니다.');
    }
  };

  // 알림 설정 확인 핸들러
  const handleCheckNotificationSettings = async () => {
    const settings = await checkNotificationSettings();
    console.log('알림 설정 상태:', settings);
    setMessage(`알림 설정 확인 완료! 권한: ${settings.permission}, SW: ${settings.serviceWorker ? '활성' : '비활성'}`);
  };

  // 날짜 정보가 준비되지 않았으면 달력 렌더링 X
  if (
    loading ||
    !today ||
    isNaN(viewYear) || viewYear < 1900 ||
    isNaN(viewMonth) || viewMonth < 0 || viewMonth > 11
  ) {
    return (
      <div className="App">
        <header className="App-header">
          <div className="loading">로딩 중...</div>
        </header>
      </div>
    );
  }

  return (
    <div className={`App ${challengeFailed ? 'challenge-failed' : ''}`}>
      {/* 컨페티 애니메이션 */}
      {confetti.map((piece) => (
        <div
          key={piece.id}
          className={`confetti ${piece.type}`}
          style={{
            left: piece.left,
            animationDelay: piece.delay,
            animationDuration: piece.duration,
            background: piece.color
          }}
        />
      ))}
      
      <header className="App-header">
        <div className="month-title-wrapper">
          <h3 className="month-title">{monthStr} 루틴 캘린더</h3>
          <img src="/sheep.png" alt="sheep" className="month-title-sheep" />
        </div>
        
        {/* 실패 상태 배너 */}
        {challengeFailed && (
          <div className="failed-banner">
            🚫 루틴 챌린지 실패
          </div>
        )}
        
        <div className="attendance-count">
          {loading ? '로딩 중...' : `이 달의 출석 횟수 ${stamps.filter(s => s.startsWith(`${viewYear}-${String(viewMonth+1).padStart(2,'0')}`)).length}회`}
        </div>
        <div className="month-navigation">
          <button onClick={() => moveMonth(-1)} className="month-btn">◀</button>
          <span className="current-month">{monthStr}</span>
          <button onClick={() => moveMonth(1)} className="month-btn">▶</button>
        </div>
        <table className="calendar-table">
          <thead>
            <tr>
              {weekDays.map((w) => (
                <th key={w}>{w}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map((week, i) => (
              <tr key={i}>
                {week.map((d, j) => (
                  <td key={j}>
                    {d ? (
                      <div className={`date-circle ${hasStamp(d) ? 'stamped' : 'default'} ${isToday(d) ? 'today' : ''}`}>
                        {hasStamp(d) ? '✓' : d}
                        {isToday(d) && (
                          <span className="today-label">오늘</span>
                        )}
                      </div>
                    ) : null}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <button
          onClick={handleCheck}
          disabled={checkedToday || loading || challengeFailed}
          className={`check-button ${buttonClicked ? 'clicked' : ''}`}
        >
          출석체크하기
        </button>
        {canShowEntry && (
          <button className="entry-button" onClick={() => setShowEntryModal(true)}>
            응모하러 가기
          </button>
        )}
        
        {/* 알림 권한 요청 버튼 */}
        {notificationPermission !== 'granted' && (
          <button 
            className="notification-permission-button" 
            onClick={handleRequestNotificationPermission}
          >
            🔔 알림 받기
          </button>
        )}
        {notificationPermission === 'granted' && (
          <div className="notification-status">
            ✅ 알림이 설정되었습니다
            <div style={{ marginTop: '10px', display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button 
                className="test-notification-button" 
                onClick={handleSimpleNotification}
                style={{ padding: '5px 10px', fontSize: '12px' }}
              >
                간단테스트
              </button>
              <button 
                className="test-notification-button" 
                onClick={handleTestNotification}
                style={{ padding: '5px 10px', fontSize: '12px' }}
              >
                SW테스트
              </button>
              <button 
                className="test-notification-button" 
                onClick={handleRefreshServiceWorker}
                style={{ padding: '5px 10px', fontSize: '12px' }}
              >
                SW 새로고침
              </button>
              <button 
                className="test-notification-button" 
                onClick={handleCheckNotificationSettings}
                style={{ padding: '5px 10px', fontSize: '12px' }}
              >
                설정확인
              </button>
            </div>
          </div>
        )}
        {message && (
          <div className={`message ${message.includes('실패') ? 'failed' : ''}`}>
            {message}
          </div>
        )}
      </header>
      {/* 응모 모달 */}
      {showEntryModal && (
        <div className="modal-overlay" onClick={() => setShowEntryModal(false)}>
          <div className="entry-modal" onClick={e => e.stopPropagation()}>
            <h2>응모하기</h2>
            <form onSubmit={handleEntrySubmit}>
              <input
                type="tel"
                className="entry-phone-input"
                placeholder="(예: 01012345678)"
                value={entryPhone}
                onChange={e => setEntryPhone(e.target.value)}
                required
                maxLength={15}
                pattern="[0-9\-]+"
                autoFocus
              />
              <button
                type="submit"
                className="entry-submit-btn"
                disabled={!entryPhone.trim() || entryPhone.length !== 11}
              >
                응모하기
              </button>
            </form>
            <button className="close-modal" onClick={() => setShowEntryModal(false)}>닫기</button>
          </div>
        </div>
      )}
      {/* 응모 성공 안내 모달 */}
      {showEntrySuccess && (
        <div className="modal-overlay" onClick={() => setShowEntrySuccess(false)}>
          <div className="entry-modal" onClick={e => e.stopPropagation()}>
            <h3>응모가 성공적으로 완료되었습니다!</h3>
            <p>응모 결과는 문자 메세지로 전송됩니다.<br/>루틴 챌린지를 시작하신 달의 마지막 날에 <br/>확인해주세요!</p>
            <button className="close-modal" onClick={() => setShowEntrySuccess(false)}>확인</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
