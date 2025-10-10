<template>
  <div>
    <h3>⚙️ 个人设置</h3>

    <el-card style="max-width: 500px; margin-top: 20px;">
      <el-descriptions title="医生信息" column="1" border>
        <el-descriptions-item label="用户名">{{ doctor.username }}</el-descriptions-item>
        <el-descriptions-item label="姓名">{{ doctor.realName }}</el-descriptions-item>
        <el-descriptions-item label="科室">{{ doctor.department }}</el-descriptions-item>
      </el-descriptions>

      <div style="margin-top: 20px; display: flex; gap: 10px;">
        <el-button type="primary" @click="openEditUsername">修改用户名</el-button>
        <el-button type="warning" @click="openChangePassword">修改密码</el-button>
      </div>
    </el-card>

    <!-- 修改用户名弹窗 -->
    <el-dialog v-model="usernameDialogVisible" title="修改用户名" width="400px">
      <el-form label-width="100px">
        <el-form-item label="原用户名">
          <el-input v-model="doctor.username" disabled></el-input>
        </el-form-item>
        <el-form-item label="新用户名">
          <el-input v-model="newUsername" placeholder="请输入新用户名"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="usernameDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="updateUsername">保存</el-button>
      </template>
    </el-dialog>

    <!-- 修改密码弹窗 -->
    <el-dialog v-model="passwordDialogVisible" title="修改密码" width="400px">
      <el-form label-width="100px">
        <el-form-item label="原密码">
          <el-input type="password" v-model="oldPassword" placeholder="请输入原密码"></el-input>
        </el-form-item>
        <el-form-item label="新密码">
          <el-input type="password" v-model="newPassword" placeholder="请输入新密码"></el-input>
        </el-form-item>
        <el-form-item label="确认新密码">
          <el-input type="password" v-model="confirmPassword" placeholder="请再次输入新密码"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="passwordDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="changePassword">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'
import router from '@/router'

const doctor = ref({
  username: '',
  realName: '',
  department: ''
})

const usernameDialogVisible = ref(false)
const passwordDialogVisible = ref(false)
const newUsername = ref('')
const oldPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')

// 获取医生信息
const fetchDoctorInfo = async () => {
  try {
    const res = await request.get('/doctor/info')
    if (res.code === 200 && res.data) {
      doctor.value = res.data
    } else {
      ElMessage.error(res.msg || '获取信息失败')
    }
  } catch (err) {
    console.error('获取医生信息失败:', err)
    ElMessage.error('加载失败')
  }
}

// 打开修改用户名弹窗
const openEditUsername = () => {
  newUsername.value = ''
  usernameDialogVisible.value = true
}

// 更新用户名
const updateUsername = async () => {
  if (!newUsername.value.trim()) {
    return ElMessage.warning('请输入新用户名')
  }
  if (newUsername.value === doctor.value.username) {
    return ElMessage.warning('新用户名不能与原用户名相同')
  }

  try {
    const res = await request.put('/doctor/updateUsername', {
      username: newUsername.value
    })
    if (res.code === 200) {
      ElMessage.success('用户名修改成功，请重新登录')
      usernameDialogVisible.value = false
      logout()
    } else {
      ElMessage.error(res.msg || '修改失败')
    }
  } catch (err) {
    console.error('修改用户名失败:', err)
    ElMessage.error('请求失败')
  }
}

// 打开修改密码弹窗
const openChangePassword = () => {
  oldPassword.value = ''
  newPassword.value = ''
  confirmPassword.value = ''
  passwordDialogVisible.value = true
}

// 修改密码
const changePassword = async () => {
  if (!oldPassword.value || !newPassword.value || !confirmPassword.value) {
    return ElMessage.warning('请填写完整信息')
  }
  if (newPassword.value === oldPassword.value) {
    return ElMessage.warning('新密码不能与原密码相同')
  }
  if (newPassword.value !== confirmPassword.value) {
    return ElMessage.warning('两次输入的新密码不一致')
  }

  try {
    const res = await request.put('/doctor/changePassword', {
      oldPassword: oldPassword.value,
      newPassword: newPassword.value
    })
    if (res.code === 200) {
      ElMessage.success('密码修改成功，请重新登录')
      passwordDialogVisible.value = false
      logout()
    } else {
      ElMessage.error(res.msg || '修改失败')
    }
  } catch (err) {
    console.error('修改密码失败:', err)
    ElMessage.error('请求失败')
  }
}

// 退出登录（修改用户名或密码后）
const logout = () => {
  ElMessageBox.alert('请重新登录以继续操作', '提示', {
    confirmButtonText: '确定',
    callback: () => {
      localStorage.removeItem('doctor')
      router.push('/doctor/login')
    }
  })
}

onMounted(() => {
  fetchDoctorInfo()
})
</script>

<style scoped>
.el-descriptions {
  margin-top: 10px;
}
</style>
