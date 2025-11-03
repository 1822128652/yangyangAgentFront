<template>
  <div class="calendar-container">    
    <!-- 日期选择和控制区 -->
    <div class="calendar-controls">
      <el-date-picker 
        v-model="selectedDate" 
        type="date" 
        placeholder="选择日期" 
        @change="handleDateChange"
        value-format="YYYY-MM-DD"
      />
      <div class="week-navigation">
        <el-button 
          size="small" 
          @click="navigateWeek(-1)"
          :loading="loading"
        >
          <el-icon><ArrowLeft /></el-icon>
        </el-button>
        <span class="week-range">
          {{ weekStart }} 至 {{ weekEnd }}
        </span>
        <el-button 
          size="small" 
          @click="navigateWeek(1)"
          :loading="loading"
        >
          <el-icon><ArrowRight /></el-icon>
        </el-button>
        <el-button 
          size="small" 
          type="primary" 
          @click="backToCurrentWeek"
          :loading="loading"
          style="margin-left: 10px;"
        >
          回到本周
        </el-button>
      </div>
    </div>
    
    <!-- 日历头部（固定高度+过渡动画） -->
    <div class="calendar-header-wrapper">
      <transition name="calendar-fade">
        <div class="calendar-header" :key="weekStart">
          <div class="calendar-day-header" v-for="(day, index) in weekDays" :key="index">
            <div class="day-name">{{ day.weekday }}</div>
            <div class="day-date">{{ day.date }}</div>
            <div class="day-status" v-if="day.isToday">今天</div>
          </div>
        </div>
      </transition>
    </div>
    
    <!-- 日历内容（固定高度容器+过渡动画） -->
    <div class="calendar-content-wrapper">
      <transition :name="slideTransitionName">
        <div class="calendar-content" :key="weekStart">
          <div class="calendar-day" v-for="(day, index) in weekDays" :key="index">
            <div v-if="loading" class="loading-state">
              <el-icon><Loading /></el-icon>
              <span>加载中...</span>
            </div>
            <div v-else-if="day.appointments.length === 0" class="no-schedule">
              无预约记录
            </div>
            <div 
              class="appointment-item" 
              v-for="appointment in day.appointments" 
              :key="appointment.id"
            >
              <div class="appointment-time">时段: {{ appointment.time }}</div>
              <div class="appointment-user">患者: {{ appointment.username }}</div>
              <div class="appointment-idcard">身份证: {{ maskIdCard(appointment.idCard) }}</div>
              <div class="appointment-contact">联系方式: {{ appointment.contact || '未填写' }}</div>
              <div class="appointment-department">科室: {{ appointment.department }}</div>
            </div>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { ArrowLeft, ArrowRight, Loading } from '@element-plus/icons-vue'
import request from '@/utils/request'

// 响应式数据
const selectedDate = ref('')
const weekStart = ref('')
const weekEnd = ref('')
const weekDays = ref([])
const loading = ref(false)
const slideTransitionName = ref('calendar-slide') // 控制滑动方向的过渡名称

// 初始化 - 显示当前周
onMounted(() => {
  const today = new Date()
  selectedDate.value = formatDate(today)
  generateWeekDays(today)
  fetchWeekAppointments()
})

// 生成一周日期数据
const generateWeekDays = (date) => {
  const days = []
  const dayOfWeek = date.getDay() || 7 // 转换为1-7 (1是星期一)
  
  // 计算本周一的日期
  const monday = new Date(date)
  monday.setDate(date.getDate() - (dayOfWeek - 1))
  
  // 生成本周的所有日期
  for (let i = 0; i < 7; i++) {
    const current = new Date(monday)
    current.setDate(monday.getDate() + i)
    
    const isToday = current.toDateString() === new Date().toDateString()
    const weekday = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'][i]
    
    days.push({
      date: formatDate(current),
      weekday,
      isToday,
      appointments: []
    })
  }
  
  weekDays.value = days
  weekStart.value = days[0].date
  weekEnd.value = days[6].date
}

// 处理日期选择变化
const handleDateChange = (date) => {
  if (!date) return
  // 判断是向前还是向后切换，控制动画方向
  const newWeekStart = new Date(date)
  const oldWeekStart = new Date(selectedDate.value)
  slideTransitionName.value = newWeekStart > oldWeekStart ? 'calendar-slide' : 'calendar-slide-reverse'
  
  generateWeekDays(new Date(date))
  fetchWeekAppointments()
}

// 切换周（向前/向后）
const navigateWeek = (direction) => {
  // 设置动画方向（向前/向后）
  slideTransitionName.value = direction > 0 ? 'calendar-slide' : 'calendar-slide-reverse'
  
  const current = new Date(selectedDate.value)
  current.setDate(current.getDate() + direction * 7)
  selectedDate.value = formatDate(current)
  generateWeekDays(current)
  fetchWeekAppointments()
}

// 回到本周
const backToCurrentWeek = () => {
  const today = new Date()
  // 判断是向前还是向后切换，控制动画方向
  const newWeekStart = new Date(today)
  const oldWeekStart = new Date(selectedDate.value)
  slideTransitionName.value = newWeekStart > oldWeekStart ? 'calendar-slide' : 'calendar-slide-reverse'
  
  selectedDate.value = formatDate(today)
  generateWeekDays(today)
  fetchWeekAppointments()
  ElMessage.success('已切换到当前周')
}

// 获取本周预约数据
const fetchWeekAppointments = async () => {
  try {
    loading.value = true
    const res = await request.get('/doctor/calendar/week', {
      params: {
        weekStart: weekStart.value,
        weekEnd: weekEnd.value
      }
    })

    // 清空之前的预约数据
    weekDays.value.forEach(day => day.appointments = [])

    // 按日期分组
    if (res.code === 200 && Array.isArray(res.data)) {
      res.data.forEach(appointment => {
        const day = weekDays.value.find(d => d.date === appointment.date)
        if (day) {
          day.appointments.push(appointment)
        }
      })
    } else {
      ElMessage.warning('未获取到有效预约数据')
    }
  } catch (error) {
    console.error('获取预约失败:', error)
    ElMessage.error('获取预约失败，请重试')
  } finally {
    loading.value = false
  }
}

// 日期格式化工具函数
const formatDate = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 身份证号脱敏工具函数
const maskIdCard = (idCard) => {
  if (!idCard) return ''
  return idCard.replace(/(\d{6})(\d{8})(\d{4})/, '$1********$3')
}
</script>

<style scoped>
/* 基础样式保持不变 */
.calendar-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.calendar-controls {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  gap: 20px;
  flex-wrap: wrap;
}

.week-navigation {
  display: flex;
  align-items: center;
  gap: 10px;
}

.week-range {
  font-weight: 500;
  min-width: 160px;
}

/* 头部容器：固定高度，防止动画时高度变化 */
.calendar-header-wrapper {
  height: 100px; /* 根据实际内容高度调整 */
  overflow: hidden;
  margin-bottom: 10px;
}

.calendar-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 10px;
  height: 100%; /* 继承容器高度 */
}

.calendar-day-header {
  background-color: #f5f7fa;
  padding: 10px;
  border-radius: 6px;
  text-align: center;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  height: 100%; /* 固定每个头部单元格高度 */
  box-sizing: border-box; /* 确保padding不影响总高度 */
}

.day-name {
  font-weight: 500;
  color: #303133;
}

.day-date {
  color: #606266;
  font-size: 14px;
}

.day-status {
  color: #409eff;
  font-size: 12px;
  margin-top: 4px;
  background-color: rgba(64, 158, 255, 0.1);
  border-radius: 3px;
  padding: 1px 0;
}

/* 内容容器：固定高度，防止动画时高度变化 */
.calendar-content-wrapper {
  height: 400px; /* 固定内容区域高度 */
  overflow: hidden;
}

.calendar-content {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  grid-template-rows: 100%; /* 填充容器高度 */
  gap: 10px;
  height: 100%; /* 继承容器高度 */
}

.calendar-day {
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  padding: 10px;
  overflow-y: auto;
  position: relative;
  height: 100%; /* 固定每个日期单元格高度 */
  box-sizing: border-box; /* 确保padding不影响总高度 */
}

.calendar-day::-webkit-scrollbar {
  width: 6px;
}

.calendar-day::-webkit-scrollbar-thumb {
  background-color: #ddd;
  border-radius: 3px;
}

.loading-state {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: #606266;
}

.no-schedule {
  color: #909399;
  text-align: center;
  margin-top: 50%;
  font-size: 14px;
}

.appointment-item {
  background-color: #f0f9eb;
  border-radius: 4px;
  padding: 8px;
  margin-bottom: 10px;
  border-left: 3px solid #67c23a;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s;
}

.appointment-item:hover {
  transform: translateY(-2px);
}

.appointment-time {
  font-weight: 500;
  margin-bottom: 4px;
  color: #2c3e50;
}

.appointment-user {
  color: #606266;
  font-size: 14px;
  margin-bottom: 4px;
}

.appointment-idcard, .appointment-contact, .appointment-department {
  font-size: 12px;
  color: #909399;
  margin-bottom: 2px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .calendar-controls {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .calendar-content-wrapper {
    height: 300px; /* 移动端调整高度 */
  }
  
  .calendar-header-wrapper {
    height: 80px; /* 移动端调整头部高度 */
  }
}

/* 动画效果样式（优化版） */
/* 头部淡入淡出动画 */
.calendar-fade-enter-from,
.calendar-fade-leave-to {
  opacity: 0;
}

.calendar-fade-enter-active,
.calendar-fade-leave-active {
  transition: opacity 0.3s ease;
}

/* 内容区域滑动动画（正向：下一周） */
.calendar-slide-enter-from {
  transform: translateX(20px);
  opacity: 0;
}

.calendar-slide-leave-to {
  transform: translateX(-20px);
  opacity: 0;
}

/* 内容区域滑动动画（反向：上一周） */
.calendar-slide-reverse-enter-from {
  transform: translateX(-20px);
  opacity: 0;
}

.calendar-slide-reverse-leave-to {
  transform: translateX(20px);
  opacity: 0;
}

/* 统一动画过渡属性 */
.calendar-slide-enter-active,
.calendar-slide-leave-active,
.calendar-slide-reverse-enter-active,
.calendar-slide-reverse-leave-active {
  transition: all 0.3s ease-out; /* 缓出效果更自然 */
  position: absolute; /* 关键：让新旧元素在同一位置过渡，避免布局偏移 */
  width: 100%; /* 确保宽度一致 */
}

/* 修复过渡容器定位 */
.calendar-content-wrapper {
  position: relative; /* 让内部绝对定位元素相对此容器定位 */
}
</style>