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
  reminderMinutes: number;
  backgroundColor: string;
}

// 引入类型声明
type PageData = {
  title: string
  currentDate: string
  hours: string
  minutes: string
  seconds: string
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
}

Page<PageData, WechatMiniprogram.Page.CustomOption>({
  data: {
    title: '面试倒计时',
    currentDate: '',
    hours: '00',
    minutes: '00',
    seconds: '00',
    backgroundColor: '#000000',
    isRunning: false,
    remainingTime: 0,
    timer: undefined as number | undefined,
    settings: {
      hours: 0,
      minutes: 0,
      seconds: 0,
      reminderMinutes: 5,
      backgroundColor: '#000000'
    } as ICountdownSettings,
    positionX: 0,
    positionY: 0,
    drawerVisible: true,
    targetHours: 0,
    targetMinutes: 0,
    targetSeconds: 0
  },

  onLoad() {
    this.updateCurrentDate();
    this.loadSettings();
    // 添加类型断言确保数据结构
    const position = wx.getStorageSync<{x: number, y: number}>('countdownPosition') || {x: 0, y: 0}
    this.setData({
      positionX: position.x,
      positionY: position.y
    })
  },

  onUnload() {
    this.clearTimer();
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
      this.setData({ settings });
      this.updateDisplay(settings.hours * 3600 + settings.minutes * 60 + settings.seconds);
    }
  },

  // 保存设置
  saveSettings(settings: ICountdownSettings): void {
    const totalSeconds = this.data.targetHours * 3600 
      + this.data.targetMinutes * 60 
      + this.data.targetSeconds
    wx.setStorageSync('countdownSettings', settings);
    this.setData({ settings });
  },

  // 开始计时器
  startTimer(): void {
    if (this.data.isRunning) return;

    if (this.data.remainingTime <= 0) {
      this.data.remainingTime = 
        this.data.settings.hours * 3600 + 
        this.data.settings.minutes * 60 + 
        this.data.settings.seconds;
    }

    this.setData({ isRunning: true });
    this.runTimer();
  },

  // 暂停计时器
  pauseTimer(): void {
    this.setData({ isRunning: false });
    this.clearTimer();
  },

  // 运行计时器
  runTimer(): void {
    this.clearTimer();
    
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
      this.setData({ timer: undefined });
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
  },

  // 检查提醒
  checkReminder(): void {
    const reminderSeconds = this.data.settings.reminderMinutes * 60;
    if (this.data.remainingTime === reminderSeconds) {
      wx.vibrateLong();
      wx.showToast({
        title: `还剩${this.data.settings.reminderMinutes}分钟`,
        icon: 'none',
        duration: 2000
      });
    }
  },

  // 处理时间到
  handleTimeUp(): void {
    this.clearTimer();
    this.setData({ isRunning: false });
    wx.vibrateLong();
    wx.showModal({
      title: '时间到',
      content: '倒计时结束',
      showCancel: false
    });
  },

  // 打开设置
  openSettings(): void {
    wx.navigateTo({
      url: '../settings/settings'
    });
  },

  onMove(e: WechatMiniprogram.TouchEvent) {
    const {x, y} = e.detail
    wx.setStorageSync('countdownPosition', {x, y})
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
  }
});
