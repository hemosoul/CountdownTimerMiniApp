Page({
  data: {
    positionX: 0,
    positionY: 0,
    // ... other data
  },

  onLoad() {
    // 读取保存的位置信息
    const position = wx.getStorageSync('countdownPosition') || {x: 0, y: 0};
    this.setData({
      positionX: position.x,
      positionY: position.y
    });
  },

  onMove(e) {
    const {x, y} = e.detail;
    // 保存位置信息
    wx.setStorageSync('countdownPosition', {x, y});
  }
  // ... other methods
}); 