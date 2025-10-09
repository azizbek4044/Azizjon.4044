const chatBtn = document.getElementById('chat-btn');
const chatBox = document.getElementById('chat-box');
const chatInput = document.getElementById('chat-input');
const chatBody = document.getElementById('chat-body');

chatBtn.addEventListener('click', () => {
  chatBox.classList.toggle('show');
});

chatInput.addEventListener('keypress', async (e) => {
  if (e.key === 'Enter' && chatInput.value.trim() !== '') {
    const userMsg = document.createElement('div');
    userMsg.textContent = chatInput.value;
    userMsg.style.color = "#00ffcc";
    chatBody.appendChild(userMsg);

    const question = chatInput.value;
    chatInput.value = '';

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ message: question })
      });

      const data = await res.json();
      const botMsg = document.createElement('div');
      botMsg.textContent = data.reply || "Xatolik yuz berdi.";
      botMsg.style.color = "#fff";
      chatBody.appendChild(botMsg);
      chatBody.scrollTop = chatBody.scrollHeight;

    } catch {
      const errMsg = document.createElement('div');
      errMsg.textContent = "Xatolik yuz berdi.";
      errMsg.style.color = "red";
      chatBody.appendChild(errMsg);
    }
  }
});
