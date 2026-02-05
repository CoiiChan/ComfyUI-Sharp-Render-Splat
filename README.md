## 在线演示

- [SingleFrame](https://coiichan.github.io/Sharp-2-Html-Demo/)
- [Titanic Demo](https://coiichan.github.io/Sharp-2-Html-Demo/titanic/) 全部95帧，请注意流量消耗

# ComfyUI-Sharp-Render-Splat

ComfyUI自定义节点插件，用于将Apple ml sharp PLY Gaussian Splat文件渲染为图像序列或HTML查看器。基于[PlayCanvas SplatTransform](https://github.com/playcanvas/splat-transform)项目开发，专门针对Apple的[ml-sharp](https://github.com/apple/ml-sharp)模型生成的PLY文件进行了坐标系适配。

## 功能特性

- 🎬 **PLY转图像序列**：将PLY文件渲染为环绕相机动画的图像序列
- 🌐 **PLY转HTML查看器**：生成独立的HTML查看器，可在浏览器中交互式查看3D点云
- 📐 **自定义渲染参数**：支持分辨率、FOV、相机位置、环绕角度等参数控制
- 🎯 **动态摇摆角度**：可控制相机环绕时的摇摆角度范围
- 🚀 **高质量渲染**：基于WebGL的硬件加速渲染

## 安装

### 1. 克隆或下载插件

将此插件放置到ComfyUI的`custom_nodes`目录中：

```bash
cd ComfyUI/custom_nodes
git clone https://github.com/CoiiChan/ComfyUI-Sharp-Render-Splat.git
```

### 2. 安装Python依赖

```bash
cd ComfyUI-Sharp-Render-Splat
pip install -r requirements.txt
```

### 3. 安装Node.js依赖

```bash
cd sharp-render-splat-transform
npm install

cd tools/orbit-render
npm install
```

### 4. 重启ComfyUI

重启ComfyUI以加载新节点。

## 节点说明

### SharpPLYToImages - PLY转图像序列

将PLY文件渲染为环绕相机动画的图像序列，输出为ComfyUI IMAGE格式。

#### 输入参数

| 参数名 | 类型 | 默认值 | 范围 | 说明 |
|--------|------|--------|------|------|
| `ply_path` | STRING | - | - | SharpPredict生成的PLY文件路径（强制输入） |
| `width` | INT | 1536 | 64-4096 | 渲染图像宽度（像素） |
| `height` | INT | 1536 | 64-4096 | 渲染图像高度（像素） |
| `fov` | FLOAT | 40.0 | 1.0-179.0 | 相机视场角（度） |
| `frames` | INT | 1 | 1-360 | 渲染帧数（环绕动画） |
| `radius` | FLOAT | 2.0 | 0.1-100.0 | 相机环绕半径 |
| `target_x` | FLOAT | 0.0 | - | 相机目标点X坐标 |
| `target_y` | FLOAT | 0.0 | - | 相机目标点Y坐标 |
| `target_z` | FLOAT | 1.0 | - | 相机目标点Z坐标 |
| `swing_angle` | FLOAT | 14.0 | 1.0-180.0 | 摇摆角度范围（度），例如14表示从-7到7度摇摆 |

#### 输出

- `image` (IMAGE): ComfyUI图像张量，格式为(B, H, W, C)，值域0-1

#### 使用示例

**基本用法**：渲染单帧图像
```
ply_path: /path/to/model.ply
width: 1920
height: 1080
fov: 50
frames: 1
radius: 2.0
```

**环绕动画**：渲染36帧环绕动画
```
ply_path: /path/to/model.ply
width: 1920
height: 1080
fov: 50
frames: 36
radius: 2.0
swing_angle: 14.0
```

**高质量渲染**：4K分辨率，72帧动画
```
ply_path: /path/to/model.ply
width: 3840
height: 2160
fov: 45
frames: 72
radius: 3.0
swing_angle: 10.0
```

#### 技术说明

- **环绕中心**：默认在(0, 0, radius)位置
- **摇摆角度**：`swing_angle`参数控制相机在Y轴上的摇摆范围，例如14表示从-7度到7度
- **相机高度**：固定为0，保持水平视角
- **输出格式**：ComfyUI标准IMAGE张量，可直接用于后续处理

---

### SharpPLYToHTML - PLY转HTML查看器

将PLY文件渲染为独立的HTML查看器，可在浏览器中交互式查看3D点云。

#### 输入参数

| 参数名 | 类型 | 默认值 | 范围 | 说明 |
|--------|------|--------|------|------|
| `ply_path` | STRING | - | - | SharpPredict生成的PLY文件路径（强制输入） |
| `output_prefix` | STRING | "splat_html" | - | 输出HTML文件名前缀 |
| `width` | INT | 1920 | 100-8192 | HTML查看器宽度（像素） |
| `height` | INT | 1080 | 100-8192 | HTML查看器高度（像素） |
| `custom_output_dir` | STRING | "" | - | 自定义输出目录（空则使用ComfyUI输出目录） |

#### 输出

- `html_path` (STRING): 生成的HTML文件路径

#### 使用示例

**基本用法**：生成默认尺寸的HTML查看器
```
ply_path: /path/to/model.ply
output_prefix: my_model
width: 1920
height: 1080
```

**高清查看器**：4K分辨率
```
ply_path: /path/to/model.ply
output_prefix: my_model_4k
width: 3840
height: 2160
```

**自定义输出目录**：
```
ply_path: /path/to/model.ply
output_prefix: my_model
width: 1920
height: 1080
custom_output_dir: /custom/output/path
```

#### 技术说明

- **默认相机轨迹**：HTML查看器使用环绕相机轨迹，自动播放动画
- **环绕参数**：
  - 环绕中心：(0, 0, 2)
  - 环绕半径：2
  - 旋转角度范围：173° 到 187°（rotation y）
  - FOV：50
  - 动画时长：10秒
- **交互功能**：支持鼠标拖拽旋转、滚轮缩放、右键平移
- **独立性**：生成的HTML文件是独立的，无需服务器即可直接在浏览器中打开

---

## 常见使用场景

### 场景1：快速预览点云模型

使用`SharpPLYToImages`节点，设置低分辨率和少量帧数：

```
width: 1280
height: 720
frames: 18
radius: 3.0
```

### 场景2：生成高质量展示视频

使用`SharpPLYToImages`节点，设置高分辨率和多帧数：

```
width: 3840
height: 2160
frames: 120
radius: 4.0
swing_angle: 8.0
```

然后使用ComfyUI的视频节点将图像序列合成为视频。

### 场景3：创建交互式3D查看器

使用`SharpPLYToHTML`节点，生成可在浏览器中交互查看的HTML文件：

```
width: 1920
height: 1080
```

生成的HTML文件可以直接分享给他人，无需安装任何软件。

### 场景4：微调相机视角

通过调整`target_x`、`target_y`、`target_z`参数，可以精确控制相机看向的位置：

```
target_x: 0.0
target_y: 0.5
target_z: 0.0
```

## 参数调优建议

### 分辨率选择

| 用途 | 宽度 | 高度 | 说明 |
|------|------|------|------|
| 快速预览 | 1280 | 720 | 渲染速度快，适合调试 |
| 标准质量 | 1920 | 1080 | 平衡质量和速度 |
| 高质量 | 2560 | 1440 | 2K分辨率，适合展示 |
| 超高质量 | 3840 | 2160 | 4K分辨率，渲染时间较长 |

### FOV（视场角）选择

| FOV值 | 效果 | 适用场景 |
|-------|------|----------|
| 30-40 | 窄视角，透视感弱 | 适合建筑、室内场景 |
| 45-50 | 标准视角 | 适合大多数场景 |
| 60-70 | 宽视角，透视感强 | 适合展示大场景 |
| 80+ | 超广角，畸变明显 | 特殊效果使用 |

### 环绕半径选择

- **小模型**（<2米）：radius = 2-3
- **中型模型**（2-5米）：radius = 4-6
- **大型模型**（>5米）：radius = 8-12

### 摇摆角度选择

- **稳定展示**：swing_angle = 5-10
- **动态展示**：swing_angle = 14-20
- **大幅摇摆**：swing_angle = 30-45

## 故障排除

### 问题1：节点未出现在ComfyUI中

**解决方案**：
1. 确认插件已正确放置在`custom_nodes`目录
2. 检查Python依赖是否已安装：`pip install -r requirements.txt`
3. 重启ComfyUI

### 问题2：渲染失败，提示"splat-transform not found"

**解决方案**：
```bash
cd sharp-render-splat-transform
npm install
```

### 问题3：HTML查看器无法打开

**解决方案**：
1. 检查PLY文件路径是否正确
2. 确认PLY文件格式有效
3. 查看ComfyUI控制台错误信息

### 问题4：渲染速度慢

**解决方案**：
1. 降低分辨率（width/height）
2. 减少帧数（frames）
3. 增大环绕半径（radius），减少相机移动距离

### 问题5：图像输出为黑色或空白

**解决方案**：
1. 检查PLY文件是否包含有效数据
2. 调整相机位置（target_x/y/z）
3. 增大环绕半径（radius）
4. 调整FOV值

## 技术架构

```
ComfyUI节点层
    ↓
Python封装层
    ↓
Node.js CLI工具层
    ↓
WebGL渲染层
```

### 核心组件

- **ComfyUI节点**：`plytoimages.py`、`plytohtml.py`
- **Python封装**：`pythonRun.py`
- **Node.js工具**：`dist/index.mjs`、`tools/orbit-render/index.mjs`
- **渲染引擎**：基于WebGL的3D渲染

## 依赖项

### Python依赖

- `torch`：PyTorch深度学习框架
- `numpy`：数值计算库
- `Pillow`：图像处理库

### Node.js依赖

- `@playcanvas/splat-transform`：PLY文件转换工具
- `puppeteer`：无头浏览器，用于WebGL渲染

## 系统要求

- **操作系统**：Windows、macOS、Linux
- **Python**：>= 3.8
- **Node.js**：>= 18.0.0
- **ComfyUI**：最新版本
- **显卡**：支持WebGL的显卡（推荐）

## 许可证

MIT License

## 致谢

本项目基于以下开源项目开发：

- [PlayCanvas SplatTransform](https://github.com/playcanvas/splat-transform)
- [Apple ml-sharp](https://github.com/apple/ml-sharp)

## 更新日志

### v1.0.0 (2024-01-01)

- 初始版本发布
- 支持PLY转图像序列
- 支持PLY转HTML查看器
- 添加摇摆角度控制参数
- 优化坐标系适配ml-sharp模型

## 联系方式

如有问题或建议，请提交Issue或Pull Request。

---
[![CoiiChan](https://avatars.githubusercontent.com/u/49615294?v=4)](https://github.com/CoiiChan)
