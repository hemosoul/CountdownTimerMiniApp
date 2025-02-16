interface IAppOption {
  globalData: {
    userInfo?: WechatMiniprogram.UserInfo,
  }
  userInfoReadyCallback?: WechatMiniprogram.GetUserInfoSuccessCallback,
}

interface ICountdownSettings {
  hours: number;
  minutes: number;
  seconds: number;
  reminderSeconds: number;
  backgroundColor: string;
}

// 引入类型声明
type PageData = {
  title: string
  currentDate: string
  backgroundColor: string
  isRunning: boolean
  remainingTime: number
  timer?: number
  settings: ICountdownSettings
  positionX: number
  positionY: number
  drawerVisible: boolean
  targetHours: number
  targetMinutes: number
  targetSeconds: number
  remindBefore: number
  bgType: string
  backgroundImage: string
  presetColors: string[]
  showTitle: boolean
  showDate: boolean
}

Page<PageData, WechatMiniprogram.Page.CustomOption>({
  data: {
    title: '面试倒计时',
    currentDate: '',
    backgroundColor: '#000000',
    isRunning: false,
    remainingTime: 0,
    timer: null as number | null,
    positionX: 0,
    positionY: 0,
    drawerVisible: false,
    hours: 0,
    minutes: 0,
    seconds: 0,
    targetHours: 0, 
    targetMinutes: 12, 
    targetSeconds: 0, 
    remindBefore: 120,
    bgType: 'color',
    backgroundImage: '',
    presetColors: [
      '#1a1a1a',    // 基础黑
      '#2d3436',    // 深炭灰
      '#3a3a3a',    // 中性灰
      '#2c3e50',    // 午夜蓝
      '#34495e',    // 湿沥青
      '#40407a',    // 深品蓝
      '#222f3e',    // 帝王蓝
      '#6c5ce7'     // 强调色（深紫色）
    ],
    showTitle: true,
    showDate: true,
  },

  onLoad() {
    //先从本地读取设置信息，如果设置默认值，并将默认值保存到本地。
    let savedSettings = wx.getStorageSync('countdownSettings');
    if (!savedSettings) {
      savedSettings = { 
        "targetHours": 0, 
        "targetMinutes": 12, 
        "targetSeconds": 0, 
        "remindBefore": 50, 
        "bgType": "color",
        "backgroundColor": "#222f3e",
        "backgroundImage": "", 
        "title": "面试倒计时", 
        "showTitle": true, 
        "showDate": true,
        'positionX':0,
        'positionY':0
      };
      wx.setStorageSync('countdownSettings',savedSettings);
    };
    this.setData({
      title: savedSettings.title,
      backgroundColor:savedSettings.backgroundColor,
      positionX: savedSettings.positionX,
      positionY: savedSettings.positionY,
      hours: savedSettings.targetHours,
      minutes: savedSettings.targetMinutes,
      seconds: savedSettings.targetSeconds,
      targetHours: savedSettings.targetHours,
      targetMinutes:  savedSettings.targetMinutes,
      targetSeconds:savedSettings.targetSeconds,
      bgType: savedSettings.bgType,
      backgroundImage: savedSettings.backgroundImage,
      remindBefore: savedSettings.remindBefore,
      showTitle:savedSettings.showTitle,
      showDate:savedSettings.showDate,
      remainingTime:this.calculateRemainingTime(savedSettings)
    });
   
    //从本地读取页面
    this.updateCurrentDate();

  
  },

  onUnload() {
    // 清理所有定时器和动画
    if (this.data.timer) clearInterval(this.data.timer)
    wx.offWindowResize() // 移除监听
  },

  // 更新当前日期
  updateCurrentDate(): void {
    const date = new Date();
    const dateStr = date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
    this.setData({ currentDate: dateStr });
  },
  

  // 加载设置
  loadSettings(): void {
    const settings = wx.getStorageSync('countdownSettings');
    if (settings) {
      this.updateDisplay(settings.targetHours * 3600 + settings.targetMinutes * 60 + settings.targetSeconds);
    }
  },


  // 保存设置
  saveSettings() {
    if (!this.data.title.trim()) {
      this.setData({ title: '面试倒计时' });
    }
    try {
      wx.setStorageSync('countdownSettings', {
        targetHours: this.data.targetHours,
        targetMinutes: this.data.targetMinutes,
        targetSeconds: this.data.targetSeconds,
        remindBefore: this.data.remindBefore,
        bgType: this.data.bgType,
        backgroundColor: this.data.backgroundColor,
        backgroundImage: this.data.backgroundImage,
        title: this.data.title,
        showTitle: this.data.showTitle,
        showDate: this.data.showDate
      })

      // 关闭抽屉并提示
      this.setData({ drawerVisible: false })
      wx.showToast({
        title: '保存成功',
        duration: 1000
      })

      // 重新计算倒计时
      this.resetTimer()
    } catch (e) {
      wx.showToast({
        title: '保存失败',
      })
    }
  },

  // 新增切换计时方法
  toggleTimer() {
    if (this.data.remainingTime <= 0) {
      wx.showToast({
        title: '请先设置时间',
        icon: 'none'
      })
      return
    }

    if (this.data.isRunning) {
      this.pauseTimer()
    } else {
      this.startTimer()
    }
  },

  // 修改后的开始计时方法
  startTimer(): void {
    let savedSettings = wx.getStorageSync('countdownSettings');
    if (this.data.isRunning) return

    // 首次启动时初始化剩余时间
    if (this.data.remainingTime <= 0) {
      this.data.remainingTime = this.calculateRemainingTime(savedSettings)
    }

    this.setData({ isRunning: true })
    this.runTimer()
  },

  // 修改后的暂停计时方法
  pauseTimer(): void {
    this.setData({ isRunning: false })
    this.clearTimer()
    wx.showToast({
      title: '已暂停',
      icon: 'none',
      duration: 1000
    })
  },

  // 运行计时器
  runTimer(): void {


    wx.showToast({
      title: '开始计时',
      icon: 'none',
      duration: 1000
    })

    const timer = setInterval(() => {
      if (this.data.remainingTime <= 0) {
        this.handleTimeUp();
        return;
      }

      this.data.remainingTime--;

      this.updateDisplay(this.data.remainingTime);
      this.checkReminder();
    }, 1000);

    this.setData({ timer });
  },

  // 清除计时器
  clearTimer(): void {
    if (this.data.timer) {
      clearInterval(this.data.timer);
      this.setData({ timer: null });
    }
  },

  // 更新显示
  updateDisplay(totalSeconds: number): void {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    this.setData({
      hours: hours.toString().padStart(2, '0'),
      minutes: minutes.toString().padStart(2, '0'),
      seconds: seconds.toString().padStart(2, '0')

    });
    console.log(this.data.targetHours)
  },

  // 检查提醒
  checkReminder(): void {
    if (this.data.remainingTime === this.data.remindBefore) {
      const audio = wx.createInnerAudioContext();
      audio.src = '/resource/sound/tip.mp3';
      audio.play();

      wx.showToast({
        title: `还剩${this.data.remindBefore}秒`,
        icon: 'none',
        duration: 2000
      });
    } else if (this.data.remainingTime === 5) {
      const audio = wx.createInnerAudioContext();
      audio.src = '/resource/sound/timeup.mp3';
      audio.play();


    }
  },

  // 处理时间到
  handleTimeUp(): void {
    this.clearTimer();
    this.setData({ isRunning: false });

    // 从本地存储加载初始设置
    const savedSettings = wx.getStorageSync('countdownSettings');
    if (savedSettings) {
      // 重置到存储的初始值
      this.setData({
        remainingTime: this.calculateRemainingTime(savedSettings)
      });

      // 更新显示
      this.updateDisplay(this.calculateRemainingTime(savedSettings));
    }


    wx.showToast({
      title: '时间到！',
      icon: 'none',
      duration: 2000
    });
  },



  onMove(e: WechatMiniprogram.TouchEvent) {
    const { x, y } = e.detail
    wx.setStorageSync('countdownPosition', { x, y })
  },

  toggleDrawer() {
    this.setData({
      drawerVisible: !this.data.drawerVisible
    })
  },

  onHoursChange(e: any) {
    const value = Math.max(0, parseInt(e.detail.value) || 0)
    this.setData({ targetHours: value })
  },

  onMinutesChange(e: any) {
    const value = Math.min(59, Math.max(0, parseInt(e.detail.value) || 0))
    this.setData({ targetMinutes: value })
  },

  onSecondsChange(e: any) {
    const value = Math.min(59, Math.max(0, parseInt(e.detail.value) || 0))
    this.setData({ targetSeconds: value })
  },

  onRemindChange(e: WechatMiniprogram.InputEvent) {
    const value = parseInt(e.detail.value) || 0;
    this.setData({ remindBefore: Math.max(0, value) });
  },

  // 新增剩余时间计算方法
  calculateRemainingTime(settings: any): number {
    return settings.targetHours * 3600 +
      settings.targetMinutes * 60 +
      settings.targetSeconds;
  },

  // 新增重置计时器方法
  resetTimer() {
    let savedSettings = wx.getStorageSync('countdownSettings');
    this.clearTimer();
    const totalSeconds = this.calculateRemainingTime(savedSettings);
    this.setData({
      remainingTime: totalSeconds,
      isRunning: false
    });
    this.updateDisplay(totalSeconds);
  },

  // 颜色选择处理
  selectColor(e: WechatMiniprogram.TouchEvent) {
    const color = e.currentTarget.dataset.color;
    this.setData({
      backgroundColor: color,
      bgType: 'color' // 强制切换背景类型为颜色
    });

    wx.setStorageSync('countdownSettings', {
      ...wx.getStorageSync('countdownSettings'),
      backgroundColor: color,
      bgType: 'color'
    });
  },

  // 新增图片选择方法
  async chooseImage() {
    try {
      const res = await wx.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sizeType: ['compressed']
      });

      if (res.tempFiles?.[0]?.tempFilePath) {
        this.setData({
          backgroundImage: res.tempFiles[0].tempFilePath,
          bgType: 'image' // 强制切换背景类型为图片
        });

        // 更新存储设置
        wx.setStorageSync('countdownSettings', {
          ...wx.getStorageSync('countdownSettings'),
          backgroundImage: res.tempFiles[0].tempFilePath,
          bgType: 'image'
        });
      }
    } catch (error) {
      console.error('选择图片失败:', error);
      wx.showToast({ title: '选择图片失败', icon: 'none' });
    }
  },

  // 确保已存在setBgType方法
  setBgType(e: WechatMiniprogram.TouchEvent) {
    const type = e.currentTarget.dataset.type;
    this.setData({ bgType: type });
    wx.setStorageSync('bgType', type); // 立即保存类型
  },

  clearImage() {
    this.setData({
      backgroundImage: '',
      bgType: 'color' // 清除后自动切换回颜色背景
    })

    // 更新本地存储
    const settings = wx.getStorageSync('countdownSettings') || {}
    settings.backgroundImage = ''
    settings.bgType = 'color'
    wx.setStorageSync('countdownSettings', settings)

    wx.showToast({
      title: '已清除背景',
      icon: 'success',
      duration: 1500
    })
  },

  // 新增重置到初始值方法
  resetToInitial() {
    const savedSettings = wx.getStorageSync('countdownSettings');
    if (savedSettings) {
      // 从存储中恢复原始设置
      this.setData({
        targetHours: savedSettings.targetHours || 0,
        targetMinutes: savedSettings.targetMinutes || 0,
        targetSeconds: savedSettings.targetSeconds || 0,
        remindBefore: savedSettings.remindBefore || 0
      });

      // 重新计算剩余时间
      const totalSeconds = this.calculateRemainingTime(savedSettings);
      this.setData({
        remainingTime: totalSeconds,
        isRunning: false
      });
      this.updateDisplay(totalSeconds);

      // 停止当前计时
      this.clearTimer();

      wx.showToast({
        title: '已重置到初始值',
        icon: 'success',
        duration: 1000
      });
    } else {
      wx.showToast({
        title: '无保存的初始值',
        icon: 'none'
      });
    }
  },

  // 新增标题变更处理
  onTitleChange(e: any) {
    this.setData({
      title: e.detail.value
    });
  },

  // 新增切换方法
  toggleTitle(e: any) {
    this.setData({ showTitle: e.detail.value });

  },
  toggleDate(e: any) {
    this.setData({ showDate: e.detail.value });

  },

  stopPropagation(e: WechatMiniprogram.BaseEvent) {
    // 空方法实现，仅用于阻止事件冒泡
    // 保留事件对象类型标注以保证类型安全
  },

  // ... existing other methods ...
});
