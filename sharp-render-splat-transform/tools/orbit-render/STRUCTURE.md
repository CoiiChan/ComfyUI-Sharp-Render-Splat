# Splat Orbit Render - Project Structure

```
tools/orbit-render/
├── index.mjs              # Main entry point and rendering logic
├── package.json           # Project dependencies
├── README.md              # Detailed documentation
├── .gitignore            # Git ignore rules
├── setup.mjs             # Setup checker (Node.js)
├── setup.bat             # Setup script (Windows)
├── setup.sh              # Setup script (Linux/Mac)
├── use-preset.mjs        # Preset manager
├── presets.json          # Rendering presets
└── test.mjs              # Test script
```

## File Descriptions

### index.mjs
Main application file that:
- Parses command-line arguments
- Generates HTML viewer using splat-transform
- Launches Puppeteer browser
- Controls camera orbit
- Captures screenshots

### package.json
Defines project dependencies:
- `puppeteer`: Headless browser control

### README.md
Complete documentation including:
- Installation instructions
- Usage examples
- Command-line options
- Troubleshooting guide
- Post-processing tips

### setup.mjs / setup.bat / setup.sh
Quick setup scripts that:
- Check Node.js installation
- Install dependencies
- Verify splat-transform CLI
- Show usage examples

### use-preset.mjs
Preset manager that:
- Loads presets from presets.json
- Generates commands for common scenarios
- Supports custom options

### presets.json
Predefined rendering configurations:
- quick_preview: Fast preview (18 frames, 720p)
- standard: Standard video (36 frames, 1080p)
- high_quality: High quality (72 frames, 1080p)
- 4k_video: 4K video (120 frames, 4K)
- top_down: Top-down orbit
- close_up: Close-up view

### test.mjs
Test script that:
- Validates test file exists
- Runs predefined test cases
- Provides interactive test selection

## Usage Flow

1. **Setup**: Run `setup.bat` (Windows) or `setup.sh` (Linux/Mac)
2. **Basic Usage**: `node index.mjs input.ply`
3. **Preset Usage**: `node use-preset.mjs input.ply standard ./frames`
4. **Custom Usage**: `node index.mjs input.ply -f 72 -r 10 -o ./output`
5. **Testing**: `node test.mjs`

## Dependencies

- Node.js >= 18.0.0
- puppeteer (installed via npm)
- @playcanvas/splat-transform (global CLI tool)

## Output

- Frames are saved to specified output directory
- Temporary files are created in `.temp_splat_render/`
- Use `--cleanup` flag to remove temporary files
