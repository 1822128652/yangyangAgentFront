<template>
  <div>
    <!-- 操作按钮 -->
    <el-button type="primary" @click="openDialog">新增排班</el-button>

    <!-- 排班表格 -->
    <el-table :data="scheduleList" border style="margin-top:10px;">
      <el-table-column prop="department" label="科室"></el-table-column>
      <el-table-column prop="doctorName" label="医生"></el-table-column>
      <el-table-column prop="date" label="日期"></el-table-column>
      <el-table-column prop="time" label="时间段"></el-table-column>
      <el-table-column prop="total" label="总号源"></el-table-column>
      <el-table-column prop="remaining" label="剩余号源"></el-table-column>
      <el-table-column label="操作" width="180">
        <template #default="scope">
          <el-button type="primary" size="small" @click="editSchedule(scope.row)">编辑</el-button>
          <el-button type="danger" size="small" @click="confirmDelete(scope.row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 弹窗：新增/编辑排班 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑排班' : '新增排班'">
      <el-form :model="form" label-width="80px">
        <el-form-item label="科室">
          <!-- 科室设置为只读，新增时自动填充且不可修改 -->
          <el-input 
            v-model="form.department" 
            placeholder="请输入科室" 
            :disabled="true"
            :readonly="true"
          />
        </el-form-item>
        <el-form-item label="医生">
          <!-- 医生姓名设置为只读，新增时自动填充且不可修改 -->
          <el-input 
            v-model="form.doctorName" 
            placeholder="请输入医生姓名" 
            :disabled="true"
            :readonly="true"
          />
        </el-form-item>
        <el-form-item label="日期">
          <el-date-picker v-model="form.date" type="date" placeholder="请选择日期" />
        </el-form-item>
        <el-form-item label="时间段">
          <el-select v-model="form.time" placeholder="请选择">
            <el-option label="上午" value="上午" />
            <el-option label="下午" value="下午" />
          </el-select>
        </el-form-item>
        <el-form-item label="总号源">
          <el-input-number v-model="form.total" :min="1" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveSchedule">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import request from '@/utils/request'

const scheduleList = ref([])
const dialogVisible = ref(false)
const isEdit = ref(false)
// 存储当前医生信息
const currentDoctor = reactive({
  department: '',
  realName: ''
})

const form = reactive({
  id: null,
  department: '',
  doctorName: '',
  date: '',
  time: '',
  total: 1,
  remaining: 1
})

// 初始化时获取医生信息和排班数据
onMounted(async () => {
  await getDoctorInfo() // 先获取医生信息
  await loadSchedule()  // 再加载排班数据
})

// 获取当前医生信息（用于自动填充科室和姓名）
const getDoctorInfo = async () => {
  try {
    const res = await request.get('/doctor/info')
    if (res.code === 200 && res.data) {
      currentDoctor.department = res.data.department || ''
      currentDoctor.realName = res.data.realName || ''
    } else {
      ElMessage.warning('获取医生信息失败，无法自动填充科室和姓名')
    }
  } catch (error) {
    console.error('获取医生信息失败:', error)
    ElMessage.error('获取医生信息失败')
  }
}

// 加载排班数据
const loadSchedule = async () => {
  try {
    const res = await request.get('/doctor/schedule')
    console.log('排班数据响应:', res)
    if (Array.isArray(res)) {
      scheduleList.value = res
    } else {
      scheduleList.value = []
      ElMessage.error('数据格式错误')
    }
  } catch (error) {
    console.error('加载排班数据失败:', error)
    ElMessage.error('加载数据失败')
  }
}

// 打开新增排班弹窗（自动填充科室和医生姓名）
const openDialog = () => {
  isEdit.value = false
  Object.assign(form, { 
    id: null, 
    // 自动填充科室和医生姓名
    department: currentDoctor.department,
    doctorName: currentDoctor.realName,
    date: '', 
    time: '', 
    total: 1, 
    remaining: 1 
  })
  dialogVisible.value = true
}

// 编辑排班（保持原有科室和医生姓名，仍不可修改）
const editSchedule = (row) => {
  isEdit.value = true
  Object.assign(form, row)
  dialogVisible.value = true
}

// 保存排班
const saveSchedule = async () => {
  try {
    // 格式化日期为 yyyy-MM-dd
    const formattedForm = {
      ...form,
      date: formatDate(form.date)
    }

    let res
    if (isEdit.value) {
      res = await request.put(`/doctor/schedule/${form.id}`, formattedForm)
    } else {
      res = await request.post('/doctor/schedule', formattedForm)
    }

    if (res) {
      dialogVisible.value = false
      await loadSchedule()
      ElMessage.success('保存成功')
    } else {
      ElMessage.error('保存失败')
    }
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error('保存失败')
  }
}

// 日期格式化函数
const formatDate = (date) => {
  if (!date) return ''
  if (typeof date === 'string') return date
  
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// 删除排班
const confirmDelete = (id) => {
  ElMessageBox.confirm(
    '确认删除该排班记录吗？',
    '提示',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  )
    .then(async () => {
      try {
        const res = await request.delete(`/doctor/schedule/${id}`)
        if (res !== undefined) {
          ElMessage.success('删除成功')
          loadSchedule()
        } else {
          ElMessage.error('删除失败')
        }
      } catch (error) {
        console.error('删除失败:', error)
        ElMessage.error('删除失败')
      }
    })
    .catch(() => {
      ElMessage.info('已取消删除')
    })
}
</script>