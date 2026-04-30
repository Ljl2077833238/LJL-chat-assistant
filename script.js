const chatWindow = document.getElementById('chatWindow');
const apiKeyInput = document.getElementById('apiKey');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const clearBtn = document.getElementById('clearBtn');
const loading = document.getElementById('loading');
const errorDiv = document.getElementById('error');

// 上下文存储变量（底层逻辑：历史记录数组）
let messageHistory = [];

async function callLLM() {
    const key = apiKeyInput.value.trim();
    const content = userInput.value.trim();

    if (!key) { showError("请输入您的 API Key！"); return; }
    if (!content) return;

    // 1. 将用户输入推入历史记录
    messageHistory.push({ role: "user", content: content });
    renderChat();
    
    // 2. 状态更新
    userInput.value = "";
    loading.style.display = "block";
    errorDiv.style.display = "none";
    sendBtn.disabled = true;

    try {
        // 3. 发送 Fetch 请求（符合 OpenAI 兼容接口）
        const response = await fetch("https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${key}`
            },
            body: JSON.stringify({
                model: "qwen3.6-plus", // 必须使用作业指定模型
                messages: messageHistory // 发送完整的对话历史
            })
        });

        if (!response.ok) throw new Error(`请求出错: ${response.status}`);

        const data = await response.json();
        const assistantReply = data.choices[0].message.content;

        // 4. 将 AI 回复推入历史记录
        messageHistory.push({ role: "assistant", content: assistantReply });
        renderChat();

    } catch (err) {
        showError("连接失败: " + err.message);
    } finally {
        loading.style.display = "none";
        sendBtn.disabled = false;
        // 滚动到底部
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }
}

function renderChat() {
    chatWindow.innerHTML = messageHistory.map(msg => `
        <div class="msg ${msg.role === 'user' ? 'user-msg' : 'assistant-msg'}">
            <strong>${msg.role === 'user' ? '你' : 'AI'}:</strong><br>
            <!-- 使用 marked.parse() 把 AI 的文字变成漂亮的 HTML -->
            <div class="content">${msg.role === 'assistant' ? marked.parse(msg.content) : msg.content}</div>
        </div>
    `).join('');
}

function showError(msg) {
    errorDiv.textContent = msg;
    errorDiv.style.display = "block";
}

// 绑定事件
sendBtn.onclick = callLLM;
clearBtn.onclick = () => {
    messageHistory = [];
    chatWindow.innerHTML = '<div class="system-msg">对话已清空，开始新的聊天。</div>';
};