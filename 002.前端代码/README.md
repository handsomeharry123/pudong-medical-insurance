# 浦东新区医保数据治理与一体化应用平台 · 前端

## 本地开发

在项目根目录执行：

```sh
cd 002.前端代码
npm ci
npm run dev
```

访问 http://localhost:3001 。测试账号：`admin`，密码：`admin`。

当前目录已安装依赖时可直接执行 `npm run dev`。也可执行 `bash start.sh` 在后台启动，执行 `bash stop.sh` 停止由该脚本记录的服务。

## 构建与预览

```sh
npm run build
npm run preview
```

开发服务与预览均使用 3001 端口，启动预览前应停止开发服务。构建产物位于 `dist/`。

## 文件说明

- `src/`：React、TypeScript 源码。
- `public/`：静态资源。
- `scripts/`：沿用的辅助脚本。
- `tools/legacy/`：旧平台验证脚本、截图和中间产物，部分依赖已移除页面，不属于当前有效测试集。
- `start.sh`、`stop.sh`：本项目后台服务管理脚本。

当前认证、短信、业务问答及大屏均包含模拟逻辑，未接入正式医保后端服务。产品范围见 `../001.产品文档/产品范围与交互说明.md`，调整记录见 `../000.文档纪要/`。

## 监管场景验收

启动开发服务后，在本目录执行：

```sh
node tests/regulator.e2e.mjs
node tests/regulator-render.mjs
```

场景实现位于`src/pages/home/regulator/`。`catalog.json`逐条保留需求中的55条示例问句、处理步骤、结论与组件描述；`engine.ts`负责意图及上下文，`data.ts`维护统一模拟数据，`ResultView.tsx`与`report.ts`负责可视化、来源、预览和导出。需求歧义处理见产品文档目录的实现与验收映射。

## 监管履历大屏验收

```sh
node tests/dashboard.e2e.mjs
```

大屏聚合与地图投影位于`src/pages/home/dashboard/`；共享检查数据以最新四阶段口径为准。

## 大屏一屏布局验收

```sh
node tests/dashboard-layout.e2e.mjs
```

检查7种桌面尺寸（1920×1080至1280×600）的整页无滚动、全部8视图、阶段字段、行为图例、总结及PRD图表形式。手机使用可读的纵向布局。

## 立体地图与环形图验收

```sh
node tests/dashboard-map.e2e.mjs
```

立体地图为真实行政边界的SVG几何挤出与斜视投影，无额外地图密钥或在线地图运行依赖。地图点位仍为演示数据。
