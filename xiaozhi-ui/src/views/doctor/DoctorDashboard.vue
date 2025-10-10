<template>
  <el-container style="height: 100vh">
    <!-- 左侧菜单 -->
    <el-aside width="200px">
      <el-menu
        :default-active="activeMenu"
        class="el-menu-vertical-demo"
        router
      >
        <el-menu-item index="/doctor/dashboard/schedule">📅 排班管理</el-menu-item>
        <el-menu-item index="/doctor/dashboard/appointments">📋 预约管理</el-menu-item>
        <el-menu-item index="/doctor/dashboard/settings">⚙️ 个人设置</el-menu-item>
      </el-menu>
    </el-aside>

    <!-- 主体内容 -->
    <el-container>
      <el-header>
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div>医生后台系统</div>
          <el-button type="danger" @click="logout">退出登录</el-button>
        </div>
      </el-header>
      <el-main>
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<!-- DoctorDashboard.vue -->
<script setup>
import { ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()
const route = useRoute()
const activeMenu = ref(route.path)

watch(route, (newRoute) => {
  activeMenu.value = newRoute.path
})

// 清理认证数据的函数
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
    // 彻底清理所有登录相关数据
    clearAuthData()
    ElMessage.success('已退出登录')
    // 强制跳转到登录页
    router.push('/doctor/login')
  }).catch(() => {
    // 用户取消退出
    ElMessage.info('已取消退出')
  })
}
</script>