const demoAdmin = {
  email: "admin@pickle.com",
  password: "verify123",
};

const adminLoginForm = document.getElementById("admin-login-form");
const adminLoginCard = document.getElementById("admin-login-card");
const dashboard = document.getElementById("dashboard");
const bookingList = document.getElementById("booking-list");
const adminLogout = document.getElementById("admin-logout");

function readBookings() {
  const raw = localStorage.getItem("pickle-bookings");
  return raw ? JSON.parse(raw) : [];
}

function writeBookings(bookings) {
  localStorage.setItem("pickle-bookings", JSON.stringify(bookings));
}

function renderBookings() {
  const bookings = readBookings();
  bookingList.innerHTML = "";

  if (!bookings.length) {
    bookingList.innerHTML = "<div class='alert alert-info mb-0'>Chưa có yêu cầu nào.</div>";
    return;
  }

  bookings.forEach((booking) => {
    const card = document.createElement("article");
    card.className = "booking-card shadow-sm p-3";

    const header = document.createElement("header");
    const title = document.createElement("div");
    title.innerHTML = `<strong>${booking.date}</strong> • ${booking.time} • ${booking.duration}h`;

    const badge = document.createElement("span");
    badge.className = `badge rounded-pill ${booking.status}`;
    badge.textContent =
      booking.status === "confirmed"
        ? "Đã xác thực"
        : booking.status === "rejected"
          ? "Từ chối"
          : "Chờ xác thực";

    header.append(title, badge);

    const payer = document.createElement("p");
    payer.className = "mb-1";
    payer.innerHTML = `<strong>${booking.playerName}</strong> • ${booking.phone}`;

    const payment = document.createElement("p");
    payment.className = "text-muted small mb-3";
    payment.innerHTML = `Phương thức: ${booking.paymentMethod}<br />Mã giao dịch/ghi chú: <strong>${booking.paymentRef || "(trống)"}</strong>`;

    const actions = document.createElement("div");
    actions.className = "d-flex flex-column flex-sm-row gap-2";

    const confirmBtn = document.createElement("button");
    confirmBtn.className = "btn btn-success flex-fill";
    confirmBtn.textContent = "Xác nhận đã nhận tiền";
    confirmBtn.addEventListener("click", () => updateStatus(booking.id, "confirmed"));

    const rejectBtn = document.createElement("button");
    rejectBtn.className = "btn btn-outline-secondary flex-fill";
    rejectBtn.textContent = "Từ chối / cần bổ sung";
    rejectBtn.addEventListener("click", () => updateStatus(booking.id, "rejected"));

    actions.append(confirmBtn, rejectBtn);

    card.append(header, payer, payment, actions);
    bookingList.appendChild(card);
  });
}

function updateStatus(id, status) {
  const bookings = readBookings();
  const index = bookings.findIndex((item) => item.id === id);
  if (index === -1) return;
  bookings[index].status = status;
  writeBookings(bookings);
  renderBookings();
}

function toggleAdmin(isLoggedIn) {
  adminLoginCard.classList.toggle("hidden", isLoggedIn);
  dashboard.classList.toggle("hidden", !isLoggedIn);
}

adminLoginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const email = document.getElementById("admin-email").value.trim();
  const password = document.getElementById("admin-password").value.trim();

  if (email === demoAdmin.email && password === demoAdmin.password) {
    localStorage.setItem("pickle-admin", email);
    toggleAdmin(true);
    renderBookings();
  } else {
    alert("Sai tài khoản thử nghiệm. Vui lòng dùng admin@pickle.com / verify123");
  }
});

adminLogout.addEventListener("click", () => {
  localStorage.removeItem("pickle-admin");
  toggleAdmin(false);
});

(function init() {
  const admin = localStorage.getItem("pickle-admin");
  toggleAdmin(Boolean(admin));
  if (admin) renderBookings();
})();
