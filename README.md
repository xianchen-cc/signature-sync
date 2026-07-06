# 移动端手绘签署页面

## 功能特性

- **横版签署模式**：CSS旋转模拟横屏，手机竖持即可横屏操作
- **竖版/框选签署**：正常竖屏显示，适合框选签名区域
- **画笔自定义**：支持6种颜色、3种粗细
- **撤销/重做**：完整的绘制历史管理
- **微信兼容**：专为微信内置浏览器优化

## URL参数

| 参数 | 值 | 说明 |
|------|-----|------|
| `mode` | `landscape` | 横版签署模式（页面旋转90度） |
| `mode` | `portrait` | 竖版/框选签署模式 |

### 示例URL

```
# 横版签署
https://your-github-io.github.io/repo-name/pages/drawing-handwrite-mobile.html?mode=landscape

# 竖版签署
https://your-github-io.github.io/repo-name/pages/drawing-handwrite-mobile.html?mode=portrait
```

## 部署到 GitHub Pages

1. Fork 或 Clone 此仓库到您的 GitHub 账户
2. 进入仓库 Settings → Pages
3. Source 选择 `main` 分支，目录选择 `/ (root)`
4. 点击 Save
5. 几分钟后即可通过 `https://yourname.github.io/repo-name/` 访问

## PC 端扫码功能

PC端点击"手机绘制"时，会弹出包含上述 URL 的二维码。
用户使用微信扫码后即可在手机上进行签署。

## 技术栈

- 纯 HTML/CSS/JavaScript（无框架依赖）
- HTML5 Canvas 绘制
- CSS Transform 旋转模拟横屏
- 微信 JSSDK 兼容

## 浏览器兼容性

- ✅ 微信内置浏览器（Android/iOS）
- ✅ iOS Safari
- ✅ Android Chrome
- ⚠️ 部分 WebView 可能需要额外适配
