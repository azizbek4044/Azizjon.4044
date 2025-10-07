const chatBtn = document.getElementById("chat-btn");
const chatBox = document.getElementById("chat-box");
const chatInput = document.getElementById("chat-input");
const chatBody = document.querySelector(".chat-body");

// --- API sozlamasi ---
const OPENAI_API_KEY = "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";

chatBtn.addEventListener("click", () => {
  chatBox.classList.toggle("show");
});

chatInput.addEventListener("keypress", async (e) => {
  if (e.key === "Enter" && chatInput.value.trim() !== "") {
    const userMsg = chatInput.value.trim();
    chatInput.value = "";

    // Foydalanuvchi xabari
    appendMessage("Siz", userMsg);

    // Javobni kutish
    appendMessage("AI", "Yozayapman...");

    // API chaqiruv
    const reply = await getAIResponse(userMsg);

    // Javobni chiqarish
    document.querySelectorAll(".chat-body div:last-child")[0].textContent = `AI: ${reply}`;
  }
});

function appendMessage(sender, text) {
  const msgDiv = document.createElement("div");
  msgDiv.textContent = `${sender}: ${text}`;
  chatBody.appendChild(msgDiv);
  chatBody.scrollTop = chatBody.scrollHeight;
}

async function getAIResponse(prompt) {
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }]
      })
    });

    const data = await res.json();
    return data.choices[0].message.content.trim();
  } catch (err) {
    return "Xatolik yuz berdi, keyinroq urinib ko‘ring.";
  }
}
