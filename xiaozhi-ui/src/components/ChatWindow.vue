<template>
  <div class="app-layout">
    <!-- 左侧侧边栏 -->
    <div class="sidebar">
      <div class="logo-section">
        <img src="@/assets/logo.png" alt="秧秧小助手" width="160" height="160" />
        <span class="logo-text">秧秧小助手(医疗版)</span>
      </div>

      <br></br>

      <div>
        <!-- 上传按钮 -->
        <el-button class="upload-kb-button" @click="uploadKnowledge">
          <i class="fa-solid fa-upload"></i>
          &nbsp;上传知识库
        </el-button>

        <!-- 上传进度条 -->
        <el-progress v-if="uploadProgress > 0" :percentage="uploadProgress" :text-inside="true" :stroke-width="20"
          style="margin-top: 10px"></el-progress>

        <!-- 上传状态提示 -->
        <div v-if="uploadStatus" style="margin-top: 6px; font-size: 14px; color: #555;">
          {{ uploadStatus }}
        </div>
      </div>

      <br></br>


      <!-- 新建会话按钮 -->
      <el-button class="new-chat-button" @click="newChat">
        <i class="fa-solid fa-plus"></i>
        &nbsp;新会话
      </el-button>

      <!-- 历史会话列表 -->
      <div class="chat-list">
        <div v-for="chat in chatList" :key="chat.id" :class="['chat-item', chat.id === uuid ? 'active' : '']"
          @click="switchChat(chat.id)">
          <span v-if="!chat.editing">{{ chat.name }}</span>
          <el-input v-else v-model="chat.name" size="small" @blur="saveChatName(chat)"
            @keyup.enter="saveChatName(chat)" />
          <i class="fa-solid fa-pen edit-icon" @click.stop="editChatName(chat)"></i>
        </div>
      </div>
    </div>

    <!-- 主内容区 -->
    <div class="main-content">
      <div class="chat-container">
        <div class="message-list" ref="messageListRef">
          <div v-for="(message, index) in messages" :key="index"
            :class="message.isUser ? 'message user-message' : 'message bot-message'">
            <img :src="message.isUser ? userAvatar : botAvatar" class="avatar" />
            <span>
              <span v-html="message.content"></span>
              <span class="loading-dots" v-if="message.isThinking || message.isTyping">
                <span class="dot"></span>
                <span class="dot"></span>
                <span class="dot"></span>
              </span>
            </span>
          </div>
        </div>

        <div class="input-container">
          <el-input v-model="inputMessage" placeholder="请输入消息" @keyup.enter="sendMessage" clearable>
            <template #suffix>
              <el-button type="primary" size="default" @click="sendMessage" :disabled="isSending" class="send-btn">
                发送
              </el-button>
            </template>
          </el-input>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import userAvatar from '@/assets/user-avatar.png'
import botAvatar from '@/assets/bot-avatar.png'
import { onMounted, ref, watch, nextTick } from 'vue'
import axios from 'axios'
import { v4 as uuidv4 } from 'uuid'

const messageListRef = ref()
const isSending = ref(false)
const uuid = ref()
const inputMessage = ref('')
const messages = ref([])

// 历史会话列表 [{id, name, editing}]
const chatList = ref([])

onMounted(() => {
  initUUID()
  loadChatList()
  watch(messages, () => scrollToBottom(), { deep: true })
  sendGreeting()
})

// 滚动到底部
const scrollToBottom = () => {
  nextTick(() => {
    if (messageListRef.value) {
      messageListRef.value.scrollTop = messageListRef.value.scrollHeight
    }
  })
}

// 初始化 UUID
const initUUID = () => {
  let storedUUID = localStorage.getItem('user_uuid')
  if (!storedUUID) {
    storedUUID = uuidToNumber(uuidv4())
    localStorage.setItem('user_uuid', storedUUID)
  }
  uuid.value = storedUUID
}

// UUID 转数字
const uuidToNumber = (uuid) => {
  let number = 0
  for (let i = 0; i < uuid.length && i < 6; i++) {
    const hexValue = uuid[i]
    number = number * 16 + (parseInt(hexValue, 16) || 0)
  }
  return number % 1000000
}

// 发送问候语
const sendGreeting = () => {
  const greetingMsg = {
    isUser: false,
    content: '你好呀！👋 我是秧秧，北京协和医院的智能客服。我既可以作为你的医疗顾问，提供健康问题的建议，也可以作为你的医疗伴诊助手，帮你解决就诊过程中的问题哦～' +
      '你可以问我关于健康咨询、疾病诊断、治疗方案、用药建议、就医流程、科室推荐、预约挂号、取消挂号等各类医疗相关问题！有啥需要帮助的，尽管说哈～🩺😊',
    isTyping: false,
    isThinking: false
  }
  messages.value.push(greetingMsg)
}

// 发送消息
const sendMessage = () => {
  if (!inputMessage.value.trim() || isSending.value) return

  const userMsg = {
    isUser: true,
    content: inputMessage.value.trim(),
    isTyping: false,
    isThinking: false
  }
  messages.value.push(userMsg)

  const botMsg = {
    isUser: false,
    content: '',
    isTyping: true,
    isThinking: true
  }
  messages.value.push(botMsg)

  const messageToSend = inputMessage.value.trim()
  inputMessage.value = ''
  isSending.value = true

  // 强制响应式更新
  const tempMessages = [...messages.value]
  messages.value = tempMessages

  axios.post(
    '/api/xiaozhi/chat',
    { memoryId: uuid.value, message: messageToSend },
    {
      responseType: 'stream',
      onDownloadProgress: (e) => {
        try {
          const fullText = e.event.target.responseText
          if (fullText) {
            const lastMsg = messages.value[messages.value.length - 1]
            lastMsg.content = fullText
            lastMsg.isThinking = false
            messages.value = [...messages.value]
          }
        } catch (error) {
          console.error('处理流数据错误:', error)
        }
      }
    }
  )
    .then(() => {
      const lastMsg = messages.value[messages.value.length - 1]
      lastMsg.isTyping = false
    })
    .catch((error) => {
      console.error('请求错误:', error)
      const lastMsg = messages.value[messages.value.length - 1]
      lastMsg.content = '请求失败，请重试'
      lastMsg.isTyping = false
      lastMsg.isThinking = false
    })
    .finally(() => {
      isSending.value = false
    })
}


// ---------------------------------
// 上传知识库逻辑
// ---------------------------------

const uploadProgress = ref(0)
const uploadStatus = ref('')
const isUploading = ref(false)


const uploadKnowledge = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json,.txt,.csv,.md,.docx,.xlsx,.pptx,.pdf'

  input.onchange = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    // 1. 文件名安全化
    const safeFileName = file.name.replace(/[^\w.-]/g, "_")

    // 2. 生成唯一的临时目录名
    const tempDirName = `${safeFileName.replace(/\.[^/.]+$/, "")}_${Date.now()}`

    const chunkSize = 1024 * 1024 * 5 // 5MB
    const totalChunks = Math.ceil(file.size / chunkSize)

    uploadProgress.value = 0
    uploadStatus.value = '上传中...'
    isUploading.value = true

    try {
      // 3. 上传分片
      for (let i = 0; i < totalChunks; i++) {
        const chunk = file.slice(i * chunkSize, (i + 1) * chunkSize)
        const formData = new FormData()
        formData.append('file', chunk)
        formData.append('chunkIndex', i.toString())
        formData.append('totalChunks', totalChunks.toString())
        formData.append('fileName', safeFileName)       // 使用安全文件名
        formData.append('tempDirName', tempDirName)

        await axios.post('/api/xiaozhi/knowledge/upload-chunk', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            const chunkPercent = progressEvent.loaded / progressEvent.total
            uploadProgress.value = ((i + chunkPercent) / totalChunks) * 100
          }
        })
      }

      // 4. 合并分片
      await axios.post('/api/xiaozhi/knowledge/merge', {
        fileName: safeFileName,   // 使用安全文件名
        tempDirName: tempDirName
      }, {
        headers: { 'Content-Type': 'application/json' }
      })

      uploadStatus.value = '上传成功！'
      uploadProgress.value = 100
    } catch (error) {
      console.error('上传失败:', error)
      uploadStatus.value = error.response?.data || '上传失败，请重试'
    } finally {
      isUploading.value = false
    }
  }

  input.click()
}



// ---------------------------------
// 历史会话相关逻辑
// ---------------------------------

// 加载历史会话
const loadChatList = () => {
  const saved = JSON.parse(localStorage.getItem('chat_list') || '[]')
  chatList.value = saved
  if (!chatList.value.find(c => c.id === uuid.value)) {
    chatList.value.push({ id: uuid.value, name: `会话 ${chatList.value.length + 1}`, editing: false })
    saveChatList()
  }
}

// 保存历史会话
const saveChatList = () => {
  localStorage.setItem('chat_list', JSON.stringify(chatList.value))
}

// 切换会话
const switchChat = (chatId) => {
  uuid.value = chatId
  localStorage.setItem('user_uuid', chatId)
  messages.value = []
  sendGreeting()
}

// 新建会话
const newChat = () => {
  const newId = uuidToNumber(uuidv4())
  uuid.value = newId
  localStorage.setItem('user_uuid', newId)
  chatList.value.push({ id: newId, name: `会话 ${chatList.value.length + 1}`, editing: false })
  saveChatList()
  messages.value = []
  sendGreeting()
}

// 编辑会话名
const editChatName = (chat) => {
  chat.editing = true
}

// 保存会话名
const saveChatName = (chat) => {
  chat.editing = false
  saveChatList()
}
</script>

<style scoped>
/* -------上传知识库------- */

.upload-status {
  margin-top: 6px;
  font-size: 14px;
  font-weight: 500;
}

.upload-status.success {
  color: #67c23a;
}

.upload-status.error {
  color: #f56c6c;
}


/* ---------------- 左侧历史会话 ---------------- */
.chat-list {
  width: 100%;
  margin-top: 20px;
  flex: 1;
  overflow-y: auto;
}

.chat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  margin-bottom: 6px;
  border-radius: 6px;
  background: #f7f7f7;
  cursor: pointer;
  transition: background 0.2s;
}

.chat-item.active {
  background: #e6f0ff;
  font-weight: bold;
  color: #409eff;
}

.chat-item:hover {
  background: #f0f2f5;
}

.edit-icon {
  font-size: 14px;
  color: #888;
  margin-left: 8px;
  cursor: pointer;
}

.edit-icon:hover {
  color: #409eff;
}

/* ---------------- 原有消息区样式 ---------------- */
.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  margin: 0 10px;
  object-fit: cover;
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.1);
}

.app-layout {
  display: flex;
  height: 100vh;
  font-family: 'Inter', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background: #f0f2f5;
  color: #333;
}

.sidebar {
  width: 220px;
  background-color: #ffffff;
  padding: 30px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 2px 0 6px rgba(0, 0, 0, 0.05);
  border-right: 1px solid #e6e6e6;
}

.logo-section {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.logo-text {
  font-size: 18px;
  font-weight: 600;
  margin-top: 10px;
  text-align: center;
  color: #333;
}

.logo-section img {
  border-radius: 12px;
}

.new-chat-button {
  width: 100%;
  margin-top: 30px;
  background-color: #409eff;
  color: white;
  border-radius: 8px;
  padding: 10px;
  font-weight: bold;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.new-chat-button:hover {
  background-color: #66b1ff;
}

.main-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  padding: 20px;
}

.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
  display: flex;
  flex-direction: column;
}

.message {
  max-width: 80%;
  margin: 10px 0;
  padding: 12px 16px;
  border-radius: 12px;
  line-height: 1.6;
  word-wrap: break-word;
  white-space: pre-line;
  position: relative;
  display: flex;
}

.user-message {
  align-self: flex-end;
  background-color: #d0ebff;
  border-top-right-radius: 0;
  flex-direction: row-reverse;
}

.bot-message {
  align-self: flex-start;
  background-color: #e9fbe5;
  border-top-left-radius: 0;
}

.input-container {
  display: flex;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  padding: 16px;
  margin-top: 10px;
  align-items: center;
  position: sticky;
  bottom: 0;
  z-index: 10;
}

.input-container :deep(.el-input__wrapper) {
  height: 52px;
  border-radius: 12px;
  padding: 0 16px;
  font-size: 16px;
  box-shadow: none;
  border: 1px solid #dcdfe6;
  transition: border-color 0.3s;
}

.input-container :deep(.el-input__wrapper.is-focus) {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

.input-container :deep(.el-button) {
  height: 52px;
  font-size: 16px;
  padding: 0 28px;
  border-radius: 12px;
  font-weight: 600;
}

.input-container :deep(.el-button--primary) {
  background-color: #409eff;
  border-color: #409eff;
}

.input-container :deep(.el-button--primary:hover) {
  background-color: #66b1ff;
  border-color: #66b1ff;
}

.input-container :deep(.send-btn) {
  height: 40px;
  margin-left: 6px;
  border-radius: 6px;
  font-size: 14px;
  padding: 0 14px;
  line-height: 32px;
}

.loading-dots {
  padding-left: 5px;
}

.dot {
  display: inline-block;
  margin-left: 5px;
  width: 8px;
  height: 8px;
  background-color: #999;
  border-radius: 50%;
  animation: pulse 1.2s infinite ease-in-out both;
}

.dot:nth-child(2) {
  animation-delay: -0.6s;
}

@keyframes pulse {

  0%,
  100% {
    transform: scale(0.6);
    opacity: 0.4;
  }

  50% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
