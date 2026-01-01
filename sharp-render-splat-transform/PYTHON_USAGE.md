# Python 使用指南

本文档说明如何在 Python 3.12 中使用 `pythonRun.py` 调用 splat-transform 项目完成 PLY 转图像的功能。

## 环境要求

- Python 3.12 或更高版本
- Node.js (用于运行 splat-transform)
- Pillow 库 (用于图像处理，可选)

## 安装依赖

```bash
# 安装 Pillow (用于灰度转换)
pip install Pillow
```

## 基本用法

### 1. 基本渲染

```bash
python pythonRun.py input.ply ./output
```

这将使用默认参数渲染 36 帧环绕图像到 `./output` 目录。

### 2. 自定义参数

```bash
python pythonRun.py input.ply ./output --frames 72 --radius 3 --fov 45 --width 1920 --height 1080
```

### 3. 转换为灰度图

```bash
python pythonRun.py input.ply ./output --grayscale
```

这将在 `./output/grayscale` 目录中生成灰度图像。

### 4. 准备 ComfyUI 输入

```bash
python pythonRun.py input.ply ./output --comfyui ./comfyui_input
```

这将生成适合 ComfyUI 处理的图像到 `./comfyui_input` 目录。

### 5. 完整示例

```bash
python pythonRun.py input.ply ./output \
  --frames 72 \
  --radius 3 \
  --fov 45 \
  --width 1920 \
  --height 1080 \
  --target 0,0,1 \
  --grayscale \
  --comfyui ./comfyui_input
```

## 命令行参数

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `input.ply` | 输入的 PLY 文件路径 | - |
| `output_dir` | 输出目录 | - |
| `--frames N` | 生成帧数 | 36 |
| `--radius R` | 环绕半径 | 2.0 |
| `--fov F` | 视场角度（度） | 45 |
| `--width W` | 图像宽度（像素） | 1920 |
| `--height H` | 图像高度（像素） | 1080 |
| `--target X,Y,Z` | 目标点坐标 | 0,0,1 |
| `--grayscale` | 转换为灰度图 | False |
| `--comfyui DIR` | 准备 ComfyUI 输入目录 | - |
| `--cleanup` | 清理临时文件 | False |
| `--quiet` | 静默模式 | False |

## Python API 使用

### 基本示例

```python
from pythonRun import SplatTransform

# 创建实例
splat = SplatTransform()

# 渲染环绕图像
frame_files = splat.render_orbit(
    input_ply="input.ply",
    output_dir="./output",
    frames=36,
    radius=2.0,
    fov=45,
    width=1920,
    height=1080,
    target=(0, 0, 1)
)

print(f"Generated {len(frame_files)} frames")
```

### 生成 HTML 查看器

```python
from pythonRun import SplatTransform

splat = SplatTransform()

# 生成 HTML 查看器
html_file = splat.generate_html_viewer(
    input_ply="input.ply",
    output_html="viewer.html"
)

print(f"Generated HTML viewer: {html_file}")
```

### 图像处理

```python
from pythonRun import (
    convert_to_grayscale,
    batch_convert_to_grayscale,
    prepare_for_comfyui
)

# 转换单张图像为灰度
convert_to_grayscale("input.png", "output_grayscale.png")

# 批量转换目录中的所有图像
batch_convert_to_grayscale("./frames", "./grayscale_frames")

# 准备 ComfyUI 输入
prepare_for_comfyui("./frames", "./comfyui_input", grayscale=True)
```

## ComfyUI 集成

### 工作流程

1. **生成环绕图像**
   ```bash
   python pythonRun.py input.ply ./output --frames 72 --radius 3
   ```

2. **准备 ComfyUI 输入**
   ```bash
   python pythonRun.py input.ply ./output --comfyui ./comfyui_input --grayscale
   ```

3. **在 ComfyUI 中处理**
   - 将 `./comfyui_input` 目录中的图像加载到 ComfyUI
   - 使用 ComfyUI 的图像处理节点进行处理
   - 输出处理后的图像

### ComfyUI 工作流示例

1. **Load Image** - 加载图像序列
2. **Image Resize** - 调整图像大小
3. **Image Filter** - 应用滤镜效果
4. **Save Image** - 保存处理后的图像

## 高级用法

### 批量处理多个 PLY 文件

```python
from pathlib import Path
from pythonRun import SplatTransform

splat = SplatTransform()
ply_files = Path("./ply_files").glob("*.ply")

for ply_file in ply_files:
    output_dir = f"./output/{ply_file.stem}"
    
    print(f"Processing {ply_file}...")
    frame_files = splat.render_orbit(
        input_ply=str(ply_file),
        output_dir=output_dir,
        frames=36,
        radius=2.0,
        fov=45
    )
    
    print(f"Generated {len(frame_files)} frames in {output_dir}")
```

### 自定义图像处理

```python
from pythonRun import SplatTransform
from PIL import Image, ImageEnhance

splat = SplatTransform()

# 渲染图像
frame_files = splat.render_orbit(
    input_ply="input.ply",
    output_dir="./output",
    frames=36
)

# 自定义图像处理
for frame_file in frame_files:
    img = Image.open(frame_file)
    
    # 增强对比度
    enhancer = ImageEnhance.Contrast(img)
    img = enhancer.enhance(1.5)
    
    # 调整亮度
    enhancer = ImageEnhance.Brightness(img)
    img = enhancer.enhance(1.2)
    
    # 保存处理后的图像
    output_path = frame_file.replace(".png", "_processed.png")
    img.save(output_path)
```

## 故障排除

### 问题 1: Node.js 未找到

**错误信息**: `'node' is not recognized as an internal or external command`

**解决方案**: 确保已安装 Node.js 并将其添加到系统 PATH 环境变量中。

### 问题 2: Pillow 未安装

**错误信息**: `PIL not installed. Install with: pip install Pillow`

**解决方案**: 运行 `pip install Pillow` 安装 Pillow 库。

### 问题 3: PLY 文件未找到

**错误信息**: `Orbit render failed: ...`

**解决方案**: 检查 PLY 文件路径是否正确，确保文件存在。

### 问题 4: 输出目录权限问题

**错误信息**: `PermissionError: [Errno 13] Permission denied`

**解决方案**: 确保对输出目录有写入权限，或使用管理员权限运行。

## 性能优化

### 并行处理

```python
from concurrent.futures import ThreadPoolExecutor
from pythonRun import SplatTransform

def render_ply(ply_file):
    splat = SplatTransform()
    output_dir = f"./output/{ply_file.stem}"
    
    return splat.render_orbit(
        input_ply=str(ply_file),
        output_dir=output_dir,
        frames=36
    )

ply_files = list(Path("./ply_files").glob("*.ply"))

# 使用线程池并行处理
with ThreadPoolExecutor(max_workers=4) as executor:
    results = list(executor.map(render_ply, ply_files))
```

### 内存优化

对于大型 PLY 文件，建议：
- 减少帧数 (`--frames`)
- 降低分辨率 (`--width` 和 `--height`)
- 使用 `--cleanup` 清理临时文件

## 示例项目

完整示例项目请参考 `examples/` 目录。

## 支持

如有问题，请提交 Issue 或联系项目维护者。
