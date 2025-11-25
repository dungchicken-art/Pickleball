const demoUser = {
  email: "user@pickle.com",
  password: "play123",
};

const loginForm = document.getElementById("login-form");
const bookingForm = document.getElementById("booking-form");
const loginCard = document.getElementById("login-card");
const bookingCard = document.getElementById("booking-card");
const statusEl = document.getElementById("status");
const latestSection = document.getElementById("latest-booking");
const latestSchedule = document.getElementById("latest-schedule");
const latestName = document.getElementById("latest-name");
const latestMethod = document.getElementById("latest-method");
const latestRef = document.getElementById("latest-ref");
const latestStatus = document.getElementById("latest-status");
const logoutBtn = document.getElementById("logout");

function readBookings() {
  const raw = localStorage.getItem("pickle-bookings");
  return raw ? JSON.parse(raw) : [];
}

function writeBookings(bookings) {
  localStorage.setItem("pickle-bookings", JSON.stringify(bookings));
}

function showLatest() {
  const bookings = readBookings();
  if (!bookings.length) {
    latestSection.classList.add("hidden");
    return;
  }
  const latest = bookings[0];
  latestSection.classList.remove("hidden");
  latestSchedule.textContent = `${latest.date} • ${latest.time} • ${latest.duration}h`;
  latestName.textContent = `${latest.playerName} (${latest.phone})`;
  latestMethod.textContent = latest.paymentMethod;
  latestRef.textContent = latest.paymentRef;
  latestStatus.textContent = latest.status === "confirmed" ? "Đã xác thực" : "Chờ xác thực";
  latestStatus.className = `badge rounded-pill ${
    latest.status === "confirmed" ? "confirmed" : "pending"
  }`;
}

function toggleAuth(isLoggedIn) {
  loginCard.classList.toggle("hidden", isLoggedIn);
  bookingCard.classList.toggle("hidden", !isLoggedIn);
}

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value.trim();

  if (email === demoUser.email && password === demoUser.password) {
    localStorage.setItem("pickle-user", email);
    toggleAuth(true);
  } else {
    statusEl.innerHTML =
      '<div class="alert alert-danger mb-0">Sai tài khoản thử nghiệm. Vui lòng dùng user@pickle.com / play123</div>';
  }
});

bookingForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const booking = {
    id: crypto.randomUUID(),
    date: document.getElementById("play-date").value,
    time: document.getElementById("start-time").value,
    duration: document.getElementById("duration").value,
    playerName: document.getElementById("player-name").value.trim(),
    phone: document.getElementById("player-phone").value.trim(),
    paymentMethod: document.getElementById("payment-method").value,
    paymentRef: document.getElementById("payment-ref").value.trim(),
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  const bookings = readBookings();
  bookings.unshift(booking);
  writeBookings(bookings);

  statusEl.innerHTML =
    '<div class="alert alert-warning mb-0">Đã gửi thông tin chuyển tiền cho chủ sân. Chờ xác thực.</div>';
  bookingForm.reset();
  showLatest();
});

logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("pickle-user");
  toggleAuth(false);
});

(function init() {
  const user = localStorage.getItem("pickle-user");
  toggleAuth(Boolean(user));
  showLatest();
})();
