const API_BASE = '/api';
const adminLoginForm = document.getElementById('admin-login-form');
const adminLoginCard = document.getElementById('admin-login-card');
const dashboard = document.getElementById('dashboard');
const bookingList = document.getElementById('booking-list');
const adminLogout = document.getElementById('admin-logout');
const sessionKey = 'pickle-admin-session';

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

function toggleAdmin(isLoggedIn) {
  adminLoginCard.classList.toggle('hidden', isLoggedIn);
  dashboard.classList.toggle('hidden', !isLoggedIn);
}

function renderBookings(bookings) {
  bookingList.innerHTML = '';

  if (!bookings.length) {
    bookingList.innerHTML = "<div class='alert alert-info mb-0'>Chưa có yêu cầu nào.</div>";
    return;
  }

  bookings.forEach((booking) => {
    const card = document.createElement('article');
    card.className = 'booking-card shadow-sm p-3';

    const header = document.createElement('header');
    const title = document.createElement('div');
    title.innerHTML = `<strong>${booking.date}</strong> • ${booking.time} • ${booking.duration}h`;

    const badge = document.createElement('span');
    badge.className = `badge rounded-pill ${booking.status}`;
    badge.textContent =
      booking.status === 'confirmed'
        ? 'Đã xác thực'
        : booking.status === 'rejected'
          ? 'Từ chối'
          : 'Chờ xác thực';

    header.append(title, badge);

    const payer = document.createElement('p');
    payer.className = 'mb-1';
    payer.innerHTML = `<strong>${booking.playerName}</strong> • ${booking.phone}`;

    const payment = document.createElement('p');
    payment.className = 'text-muted small mb-3';
    payment.innerHTML = `Phương thức: ${booking.paymentMethod}<br />Mã giao dịch/ghi chú: <strong>${booking.paymentRef || '(trống)'}</strong>`;

    const actions = document.createElement('div');
    actions.className = 'd-flex flex-column flex-sm-row gap-2';

    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'btn btn-success flex-fill';
    confirmBtn.textContent = 'Xác nhận đã nhận tiền';
    confirmBtn.addEventListener('click', () => updateStatus(booking.id, 'confirmed'));

    const rejectBtn = document.createElement('button');
    rejectBtn.className = 'btn btn-outline-secondary flex-fill';
    rejectBtn.textContent = 'Từ chối / cần bổ sung';
    rejectBtn.addEventListener('click', () => updateStatus(booking.id, 'rejected'));

    actions.append(confirmBtn, rejectBtn);

    card.append(header, payer, payment, actions);
    bookingList.appendChild(card);
  });
}

async function loadBookings() {
  const response = await fetch(`${API_BASE}/bookings`);
  if (!response.ok) throw new Error('Không tải được danh sách');
  const bookings = await response.json();
  renderBookings(bookings);
}

async function updateStatus(id, status) {
  const response = await fetch(`${API_BASE}/bookings/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) {
    alert('Không cập nhật được trạng thái.');
    return;
  }
  await loadBookings();
}

adminLoginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const email = document.getElementById('admin-email').value.trim();
  const password = document.getElementById('admin-password').value.trim();

  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'admin', email, password }),
    });
    if (!response.ok) throw new Error('Sai tài khoản thử nghiệm. Dùng admin@pickle.com / verify123');

    const payload = await response.json();
    setSession(payload);
    toggleAdmin(true);
    await loadBookings();
  } catch (error) {
    alert(error.message);
  }
});

adminLogout.addEventListener('click', () => {
  clearSession();
  toggleAdmin(false);
});

(async function init() {
  const session = getSession();
  toggleAdmin(Boolean(session));
  if (session) {
    try {
      await loadBookings();
    } catch (error) {
      bookingList.innerHTML = "<div class='alert alert-danger mb-0'>Không tải được đặt sân</div>";
    }
  }
})();
