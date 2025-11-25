const API_BASE = '/api';
const loginForm = document.getElementById('login-form');
const bookingForm = document.getElementById('booking-form');
const loginCard = document.getElementById('login-card');
const bookingCard = document.getElementById('booking-card');
const statusEl = document.getElementById('status');
const latestSection = document.getElementById('latest-booking');
const latestSchedule = document.getElementById('latest-schedule');
const latestName = document.getElementById('latest-name');
const latestMethod = document.getElementById('latest-method');
const latestRef = document.getElementById('latest-ref');
const latestStatus = document.getElementById('latest-status');
const logoutBtn = document.getElementById('logout');

const sessionKey = 'pickle-user-session';

function setSession(data) {
  sessionStorage.setItem(sessionKey, JSON.stringify(data));
}

function clearSession() {
  sessionStorage.removeItem(sessionKey);
}

function getSession() {
  const raw = sessionStorage.getItem(sessionKey);
  return raw ? JSON.parse(raw) : null;
}

function toggleAuth(isLoggedIn) {
  loginCard.classList.toggle('hidden', isLoggedIn);
  bookingCard.classList.toggle('hidden', !isLoggedIn);
}

function renderLatest(booking) {
  if (!booking) {
    latestSection.classList.add('hidden');
    return;
  }

  latestSection.classList.remove('hidden');
  latestSchedule.textContent = `${booking.date} • ${booking.time} • ${booking.duration}h`;
  latestName.textContent = `${booking.playerName} (${booking.phone})`;
  latestMethod.textContent = booking.paymentMethod;
  latestRef.textContent = booking.paymentRef || '(chưa cung cấp)';
  latestStatus.textContent =
    booking.status === 'confirmed'
      ? 'Đã xác thực'
      : booking.status === 'rejected'
        ? 'Từ chối / cần bổ sung'
        : 'Chờ xác thực';
  latestStatus.className = `badge rounded-pill ${booking.status === 'confirmed' ? 'confirmed' : booking.status === 'rejected' ? 'rejected' : 'pending'}`;
}

async function fetchLatest() {
  try {
    const response = await fetch(`${API_BASE}/bookings`);
    if (!response.ok) throw new Error('Không tải được danh sách');
    const bookings = await response.json();
    renderLatest(bookings[0]);
  } catch (error) {
    latestSection.classList.add('hidden');
  }
}

function showStatus(message, type = 'warning') {
  statusEl.innerHTML = `<div class="alert alert-${type} mb-0">${message}</div>`;
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value.trim();

  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'user', email, password }),
    });
    if (!response.ok) throw new Error('Sai tài khoản thử nghiệm. Dùng user@pickle.com / play123');

    const payload = await response.json();
    setSession(payload);
    toggleAuth(true);
    showStatus('Đăng nhập thành công. Bạn có thể đặt sân ngay!', 'success');
  } catch (error) {
    showStatus(error.message, 'danger');
  }
});

bookingForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const booking = {
    date: document.getElementById('play-date').value,
    time: document.getElementById('start-time').value,
    duration: document.getElementById('duration').value,
    playerName: document.getElementById('player-name').value.trim(),
    phone: document.getElementById('player-phone').value.trim(),
    paymentMethod: document.getElementById('payment-method').value,
    paymentRef: document.getElementById('payment-ref').value.trim(),
  };

  try {
    const response = await fetch(`${API_BASE}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(booking),
    });

    if (!response.ok) throw new Error('Không gửi được đặt sân');

    const created = await response.json();
    showStatus('Đã gửi thông tin chuyển tiền cho chủ sân. Chờ xác thực.', 'warning');
    bookingForm.reset();
    renderLatest(created);
  } catch (error) {
    showStatus(error.message, 'danger');
  }
});

logoutBtn.addEventListener('click', () => {
  clearSession();
  toggleAuth(false);
  showStatus('Đã đăng xuất khỏi phiên đặt sân.', 'info');
});

(function init() {
  const session = getSession();
  toggleAuth(Boolean(session));
  fetchLatest();
})();
