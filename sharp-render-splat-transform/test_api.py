#!/usr/bin/env python3
"""Test script for Python API"""

import sys
from pathlib import Path

# Add parent directory to path to import pythonRun
sys.path.insert(0, str(Path(__file__).parent))

from pythonRun import SplatTransform

def test_basic_render():
    """Test basic orbit rendering"""
    print("Testing basic orbit rendering...")
    splat = SplatTransform()
    
    frame_files = splat.render_orbit(
        input_ply="input/sharp.ply",
        output_dir="test_api_output",
        frames=5,
        radius=2.0,
        fov=45
    )
    
    print(f"✓ Generated {len(frame_files)} frames")
    for frame in frame_files:
        print(f"  - {frame}")
    print()

def test_grayscale():
    """Test grayscale conversion"""
    print("Testing grayscale conversion...")
    splat = SplatTransform()
    
    frame_files = splat.render_orbit(
        input_ply="input/sharp.ply",
        output_dir="test_api_grayscale",
        frames=3,
        radius=2.0,
        fov=45
    )
    
    grayscale_files = splat.convert_to_grayscale(frame_files)
    print(f"✓ Converted {len(grayscale_files)} images to grayscale")
    for img in grayscale_files:
        print(f"  - {img}")
    print()

def test_comfyui():
    """Test ComfyUI preparation"""
    print("Testing ComfyUI preparation...")
    splat = SplatTransform()
    
    frame_files = splat.render_orbit(
        input_ply="input/sharp.ply",
        output_dir="test_api_comfyui",
        frames=3,
        radius=2.0,
        fov=45
    )
    
    comfyui_files = splat.prepare_for_comfyui(frame_files, "test_api_comfyui_input")
    print(f"✓ Prepared {len(comfyui_files)} images for ComfyUI")
    for img in comfyui_files:
        print(f"  - {img}")
    print()

def test_html_viewer():
    """Test HTML viewer generation"""
    print("Testing HTML viewer generation...")
    splat = SplatTransform()
    
    html_file = splat.generate_html_viewer(
        input_ply="input/sharp.ply",
        output_html="test_api_viewer.html"
    )
    
    print(f"✓ Generated HTML viewer: {html_file}")
    print()

if __name__ == "__main__":
    print("=" * 60)
    print("Python API Test Suite")
    print("=" * 60)
    print()
    
    test_basic_render()
    test_grayscale()
    test_comfyui()
    test_html_viewer()
    
    print("=" * 60)
    print("All tests completed successfully!")
    print("=" * 60)
