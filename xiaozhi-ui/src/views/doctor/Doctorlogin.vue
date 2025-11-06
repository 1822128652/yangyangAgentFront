<template>
  <div class="login-container">
    <el-card class="login-card">
      <h2>医生后台登录</h2>
      <!-- 添加提示区域 -->
      <el-alert
        v-if="showLoginPrompt"
        title="请先登录"
        type="warning"
        :closable="false"
        style="margin-bottom: 20px;"
      />
      <el-form :model="form" @submit.prevent="handleLogin">
        <el-form-item label="账号">
          <el-input v-model="form.account" placeholder="请输入账号" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="form.password" type="password" placeholder="请输入密码" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleLogin">登录</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter, useRoute } from 'vue-router'
import request from '@/utils/request'
import { doctorWebSocket } from '@/utils/websocket'

const router = useRouter()
const route = useRoute()
const showLoginPrompt = ref(false)

const form = reactive({
  account: '',
  password: ''
})

// 检查是否是从路由守卫跳转过来的
onMounted(() => {
  // 可以根据路由参数或其他标识来判断是否需要显示提示
  if (route.query.redirect) {
    showLoginPrompt.value = true
  }
})

const handleLogin = async () => {
  try {
    const res = await request.post('/doctor/login', form)
    console.log('登录响应:', res)
    if (res.code === 200) {
      ElMessage.success('登录成功')
      // 存储 token + 医生信息
      const doctorInfo = {
        ...res.data.doctor,
        token: res.data.token
      }
      localStorage.setItem('doctor', JSON.stringify(doctorInfo))
      
      // 登录成功后立即连接 WebSocket
      console.log('登录成功，连接 WebSocket，用户ID:', doctorInfo.id)
      doctorWebSocket.connect(String(doctorInfo.id))
      
      router.push('/doctor/dashboard')
    } else {
      ElMessage.error(res.msg || '登录失败')
    }
  } catch (err) {
    console.error('登录请求失败:', err)
    ElMessage.error('请求失败')
  }
}
</script>

<style scoped>
.login-container {
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}
.login-card {
  width: 400px;
  padding: 20px;
}
</style>