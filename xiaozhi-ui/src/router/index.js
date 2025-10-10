// 10.9 update
import { createRouter, createWebHistory } from 'vue-router'
import ChatWindow from '@/components/ChatWindow.vue'
import DoctorLogin from '@/views/doctor/DoctorLogin.vue'
import DoctorDashboard from '@/views/doctor/DoctorDashboard.vue'
import ScheduleView from '@/views/doctor/Components/ScheduleView.vue'
import AppointmentView from '@/views/doctor/Components/AppointmentView.vue'
import SettingsView from '@/views/doctor/Components/SettingsView.vue'

const routes = [
  { path: '/', component: ChatWindow },
  { path: '/doctor/login', component: DoctorLogin },
  { 
    path: '/doctor/dashboard',
    component: DoctorDashboard,
    children: [
      { path: '', redirect: '/doctor/dashboard/schedule' },
      { path: 'schedule', component: ScheduleView },
      { path: 'appointments', component: AppointmentView },
      { path: 'settings', component: SettingsView }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// 检查登录状态的函数
const checkAuth = () => {
  const doctorStr = localStorage.getItem('doctor')
  if (!doctorStr) return false
  
  try {
    const doctor = JSON.parse(doctorStr)
    return !!(doctor && doctor.token)
  } catch (e) {
    localStorage.removeItem('doctor')
    return false
  }
}

// 路由守卫
router.beforeEach((to, from, next) => {
  const isLoggedIn = checkAuth()
  
  // 访问后台页面需要登录
  if (to.path.startsWith('/doctor/dashboard') && !isLoggedIn) {
    // 添加来源标识，告诉登录页这是从受保护页面跳转过来的
    return next({
      path: '/doctor/login',
      query: { 
        redirect: to.fullPath,
        requireAuth: 'true'  // 添加标识
      }
    })
  }
  
  // 已登录用户访问登录页，跳转到后台
  if (to.path === '/doctor/login' && isLoggedIn) {
    return next('/doctor/dashboard')
  }
  
  next()
})

export default router