  <link rel="stylesheet" href="style.css" />
document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("contact-form");
  const status = document.getElementById("status");

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const message = document.getElementById("message").value.trim();

    // ✅ O'ZINGNING BOT TOKENING VA CHAT ID'ingni bu yerga qo'y
    const telegramToken = "8191756269:AAGBVLa5bd4XOW_3RLA-kfE92aIUF4CcqGQ"; // masalan: "123456789:ABCDEF..."
    const chatID = "487663378"; // masalan: "-1001234567890"

    const text = `🆕 Yangi xabar\n👤 Ismi: ${name}\n📧 Email: ${email}\n💬 Xabar: ${message}`;

    fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        chat_id: chatID,
        text: text
      })
    })
      .then(res => {
        if (res.ok) {
          status.innerText = "✅ Xabaringiz yuborildi!";
          form.reset();
        } else {
          status.innerText = "❌ Xabar yuborilmadi. Iltimos, qayta urinib ko‘ring.";
        }
      })
      .catch(err => {
        console.error("Tarmoq xatosi:", err);
        status.innerText = "⚠️ Tarmoq xatosi. Internetni tekshirib ko‘ring.";
      });
  });
});
// Scroll bo‘lsa tugma ko‘rinadi
window.addEventListener("scroll", () => {
  const btn = document.getElementById("backToTop");
  if (window.scrollY > 300) {
    btn.style.display = "block";
  } else {
    btn.style.display = "none";
  }
});

// Yuqoriga qaytish
document.getElementById("backToTop").addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});
const typed = new Typed("#typed", {
  strings: ["Azizbek", "Dasturchi", "Talaba", "Blogger"],
  typeSpeed: 80,
  backSpeed: 50,
  loop: true,
});

