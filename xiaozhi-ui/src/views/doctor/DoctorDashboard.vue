<template>
  <div class="layout-container">
    <!-- 背景图片层 -->
    <div class="background-layer"></div>

    <!-- 原有内容 -->
    <el-container style="height: 100vh; overflow: hidden; position: relative;">
      <!-- 左侧菜单 -->
      <el-aside width="200px" class="aside-container">
        <!-- 系统标题 -->
        <div class="system-title">
          <span>医生后台系统</span>
        </div>

        <!-- 菜单 -->
        <el-menu :default-active="activeMenu" class="el-menu-vertical-demo" router>
          <el-menu-item index="/doctor/dashboard/calendar">
            <span>我的日程</span>
          </el-menu-item>
          <el-menu-item index="/doctor/dashboard/schedule">
            <span>排班管理</span>
          </el-menu-item>
          <el-menu-item index="/doctor/dashboard/appointments">
            <span>预约管理</span>
          </el-menu-item>
          <el-menu-item index="/doctor/dashboard/chat">
            <span>我的消息</span> <!-- 11.4 新增 -->
          </el-menu-item>
          <el-menu-item index="/doctor/dashboard/settings">
            <span>个人设置</span>
          </el-menu-item>
        </el-menu>
      </el-aside>

      <!-- 主体内容 -->
      <el-container style="flex-direction: column; height: 100%;">
        <!-- 顶部导航栏 -->
        <el-header class="custom-header">
          <div class="header-content">
            <!-- 顶部左侧可以留空或添加其他内容 -->
            <div class="header-left"></div>

            <!-- 右侧用户信息 -->
            <div class="user-info">
              <el-button type="danger" @click="logout" class="logout-btn">
                退出登录
              </el-button>
            </div>
          </div>
        </el-header>

        <!-- 主内容区 -->
        <el-main class="main-content">
          <router-view v-slot="{ Component }">
            <keep-alive>
              <component :is="Component" />
            </keep-alive>
          </router-view>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { doctorWebSocket } from '@/utils/websocket'

const router = useRouter()
const route = useRoute()
const activeMenu = ref(route.path)

watch(route, (newRoute) => {
  activeMenu.value = newRoute.path
})

const clearAuthData = () => {
  localStorage.removeItem('doctor')
  localStorage.removeItem('doctor_token')
  localStorage.removeItem('doctor_info')
  sessionStorage.removeItem('doctor')
  sessionStorage.removeItem('doctor_token')
  sessionStorage.removeItem('doctor_info')
}

const logout = () => {
  ElMessageBox.confirm(
    '确定要退出登录吗？',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    // 登出时断开 WebSocket 连接
    console.log('用户登出，断开 WebSocket 连接')
    doctorWebSocket.logout()
    clearAuthData()
    ElMessage.success('已退出登录')
    router.push('/doctor/login')
  }).catch(() => {
    ElMessage.info('已取消退出')
  })
}

// 组件挂载时检查并连接 WebSocket
onMounted(() => {
  const doctorInfo = localStorage.getItem('doctor')
  if (doctorInfo) {
    try {
      const user = JSON.parse(doctorInfo)
      const status = doctorWebSocket.getConnectionStatus()

      // 如果未连接或用户ID不匹配，重新连接
      if (!status.isConnected || status.userId !== String(user.id)) {
        console.log('Dashboard 挂载，检查 WebSocket 连接状态:', status)
        console.log('重新连接 WebSocket，用户ID:', user.id)
        doctorWebSocket.connect(String(user.id))
      } else {
        console.log('WebSocket 已连接，状态正常')
      }
    } catch (err) {
      console.error('解析用户信息失败:', err)
    }
  }
})

</script>

<style scoped>
/* 布局容器 */
.layout-container {
  position: relative;
  height: 100vh;
  width: 100%;
}

/* 背景图片层 */
.background-layer {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url('https://yangyang-1.oss-cn-beijing.aliyuncs.com/chou02.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  filter: blur(8px) brightness(0.7);
  z-index: -1;
  transform: scale(1.05);
  /* 防止模糊边缘露出空白 */
}

/* 左侧菜单容器 */
.aside-container {
  background-color: rgba(15, 23, 42, 0.85);
  /* 添加透明度 */
  height: 100vh;
  display: flex;
  flex-direction: column;
  backdrop-filter: blur(5px);
  /* 添加毛玻璃效果 */
}

/* 系统标题样式 */
.system-title {
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
  font-weight: 600;
  padding: 25px 20px 20px 20px;
  border-bottom: 1px solid rgba(51, 65, 85, 0.5);
  /* 调整透明度 */
  margin-bottom: 10px;
  text-align: center;
}

/* 菜单样式 */
.el-menu-vertical-demo {
  background-color: transparent;
  /* 改为透明背景 */
  border-right: none;
  flex: 1;
  /* 让菜单占据剩余空间 */
  padding: 0 10px;
}

.el-menu-item {
  color: #e2e8f0;
  height: 60px;
  line-height: 60px;
  font-size: 14px;
  margin-bottom: 6px;
  border-radius: 8px;
  padding-left: 20px !important;
  background-color: rgba(15, 23, 42, 0.5);
  /* 添加半透明背景 */
}

.el-menu-item:hover,
.el-menu-item.is-active {
  background-color: rgba(30, 41, 59, 0.8);
  /* 调整透明度 */
  color: #38bdf8;
}

/* 顶部导航栏 */
.custom-header {
  background-color: rgba(15, 23, 42, 0.85);
  /* 添加透明度 */
  color: white;
  padding: 0 30px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  height: 70px;
  min-height: 70px;
  backdrop-filter: blur(5px);
  /* 添加毛玻璃效果 */
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
}

.header-left {
  /* 左侧占位，保持布局平衡 */
  width: 100px;
}

/* 右侧用户信息区 */
.user-info {
  display: flex;
  align-items: center;
  gap: 20px;
}

.doctor-name {
  font-size: 16px;
  padding: 5px 10px;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

/* 退出按钮样式 */
.logout-btn {
  background-color: #ef4444;
  border-color: #ef4444;
  transition: all 0.3s ease;
  padding: 8px 16px;
  font-size: 14px;
}

.logout-btn:hover {
  background-color: #dc2626;
  border-color: #dc2626;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(220, 38, 38, 0.2);
}

/* 主内容区 */
.main-content {
  padding: 25px;
  background-color: rgba(248, 250, 252, 0.85);
  /* 添加透明度 */
  overflow-y: auto;
  height: calc(100vh - 70px);
  flex: 1;
  backdrop-filter: blur(5px);
  /* 添加毛玻璃效果 */
}
</style>