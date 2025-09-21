# 游园活动排行榜

一个现代化的游园活动排行榜系统，支持四个游戏的积分统计和排名显示。

## 功能特性

- 🏆 **实时排行榜** - 显示所有参与者的总分排名
- 🎮 **游戏分类** - 支持四个不同游戏的独立排行榜
- 📱 **响应式设计** - 完美适配手机和电脑端
- ⚡ **实时更新** - 自动刷新数据，保持信息最新
- 🎯 **详细统计** - 显示参与人数、总提交次数、总积分等
- 👤 **玩家详情** - 点击玩家查看详细的游戏记录

## 游戏类型

1. **⚡ 拼速达人** - 守擂挑战
2. **🚗 碰碰乐** - 遥控对战  
3. **🎯 沙包投掷** - 精准投掷
4. **🥢 巧手取棒** - 精准抓取

## 技术栈

- **前端**: HTML5, CSS3, JavaScript (ES6+)
- **部署**: Cloudflare Pages
- **API**: RESTful API 接口

## 项目结构

```
├── public/
│   ├── index.html      # 主页面
│   ├── style.css       # 样式文件
│   └── script.js       # JavaScript 逻辑
├── wrangler.toml       # Cloudflare Pages 配置
├── package.json        # 项目配置
└── README.md          # 项目说明
```

## 部署

使用 Cloudflare Pages 进行部署：

```bash
# 安装 Wrangler CLI
npm install -g wrangler

# 部署到 Cloudflare Pages
wrangler pages deploy public --project-name=leaderboard
```

## 移动端优化

- 游戏选择器按钮支持水平滚动
- 排行榜条目在移动端保持水平布局
- 响应式设计适配不同屏幕尺寸
- 触摸友好的交互体验

## 开发

本地开发：

```bash
# 启动开发服务器
wrangler pages dev public
```

## 许可证

MIT License
