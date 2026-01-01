import subprocess
import os
import sys
from pathlib import Path
from typing import Optional, List, Tuple
import shutil


class SplatTransform:
    def __init__(self, project_path: str = None):
        self.project_path = Path(project_path) if project_path else Path(__file__).parent
        self.orbit_render_dir = self.project_path / "tools" / "orbit-render"
        self.dist_dir = self.project_path / "dist"
        self._check_nodejs()
        self._install_dependencies()
        self._build_project()
    
    def _check_nodejs(self):
        """Check if Node.js is available in the system"""
        try:
            result = subprocess.run(
                ["node", "--version"],
                capture_output=True,
                text=True,
                timeout=10
            )
            if result.returncode == 0:
                print(f"Node.js version: {result.stdout.strip()}")
            else:
                raise RuntimeError("Node.js command failed")
        except FileNotFoundError:
            raise RuntimeError("Node.js is not installed or not found in PATH")
        except subprocess.TimeoutExpired:
            raise RuntimeError("Node.js command timed out")
        except Exception as e:
            raise RuntimeError(f"Failed to check Node.js: {e}")
    
    def _install_dependencies(self):
        """Check and install Node.js dependencies if needed"""
        node_modules_path = self.project_path / "node_modules"
        package_json_path = self.project_path / "package.json"
        
        # Check if package.json exists
        if not package_json_path.exists():
            print("Warning: package.json not found, skipping dependency installation")
            return
        
        # Check if node_modules exists and is not empty
        if node_modules_path.exists() and any(node_modules_path.iterdir()):
            print("Node.js dependencies already installed")
        else:
            print("Installing Node.js dependencies...")
            try:
                result = subprocess.run(
                    ["npm", "install"],
                    cwd=str(self.project_path.resolve()),
                    capture_output=True,
                    text=True,
                    timeout=300  # 5 minutes timeout
                )
                
                if result.returncode != 0:
                    print(f"npm install failed with return code: {result.returncode}")
                    print(f"STDOUT: {result.stdout}")
                    print(f"STDERR: {result.stderr}")
                    raise RuntimeError(f"Failed to install Node.js dependencies: {result.stderr}")
                
                print("Node.js dependencies installed successfully")
                if result.stdout:
                    print(f"Installation output: {result.stdout}")
                    
            except subprocess.TimeoutExpired:
                raise RuntimeError("npm install timed out after 300 seconds")
            except FileNotFoundError:
                raise RuntimeError("npm is not installed or not found in PATH")
            except Exception as e:
                print(f"Warning: Failed to install dependencies: {e}")
                print("Continuing anyway, but errors may occur if dependencies are missing")
        
        # Install orbit-render tool dependencies
        orbit_render_node_modules = self.orbit_render_dir / "node_modules"
        orbit_render_package_json = self.orbit_render_dir / "package.json"
        
        if orbit_render_package_json.exists():
            if orbit_render_node_modules.exists() and any(orbit_render_node_modules.iterdir()):
                print("Orbit-render dependencies already installed")
            else:
                print("Installing orbit-render dependencies...")
                try:
                    result = subprocess.run(
                        ["npm", "install"],
                        cwd=str(self.orbit_render_dir.resolve()),
                        capture_output=True,
                        text=True,
                        timeout=300  # 5 minutes timeout
                    )
                    
                    if result.returncode != 0:
                        print(f"npm install failed for orbit-render with return code: {result.returncode}")
                        print(f"STDOUT: {result.stdout}")
                        print(f"STDERR: {result.stderr}")
                        raise RuntimeError(f"Failed to install orbit-render dependencies: {result.stderr}")
                    
                    print("Orbit-render dependencies installed successfully")
                    if result.stdout:
                        print(f"Installation output: {result.stdout}")
                        
                except subprocess.TimeoutExpired:
                    raise RuntimeError("npm install for orbit-render timed out after 300 seconds")
                except FileNotFoundError:
                    raise RuntimeError("npm is not installed or not found in PATH")
                except Exception as e:
                    print(f"Warning: Failed to install orbit-render dependencies: {e}")
                    print("Continuing anyway, but errors may occur if dependencies are missing")
        else:
            print("Warning: orbit-render package.json not found")
    
    def _build_project(self):
        """Build the project if dist directory doesn't exist"""
        dist_dir = self.project_path / "dist"
        
        # Check if dist directory exists and has the required files
        if dist_dir.exists() and (dist_dir / "index.mjs").exists():
            print("Project already built (dist/index.mjs exists)")
            return
        
        print("Building project (npm run build)...")
        try:
            result = subprocess.run(
                ["npm", "run", "build"],
                cwd=str(self.project_path.resolve()),
                capture_output=True,
                text=True,
                timeout=300  # 5 minutes timeout
            )
            
            if result.returncode != 0:
                print(f"npm run build failed with return code: {result.returncode}")
                print(f"STDOUT: {result.stdout}")
                print(f"STDERR: {result.stderr}")
                raise RuntimeError(f"Failed to build project: {result.stderr}")
            
            print("Project built successfully")
            if result.stdout:
                print(f"Build output: {result.stdout}")
                
        except subprocess.TimeoutExpired:
            raise RuntimeError("npm run build timed out after 300 seconds")
        except FileNotFoundError:
            raise RuntimeError("npm is not installed or not found in PATH")
        except Exception as e:
            print(f"Warning: Failed to build project: {e}")
            print("Continuing anyway, but errors may occur if build files are missing")
        
    def render_orbit(
        self,
        input_ply: str,
        output_dir: str,
        frames: int = 36,
        radius: float = 2.0,
        fov: int = 45,
        width: int = 1920,
        height: int = 1080,
        target: Tuple[float, float, float] = (0, 0, 1),
        swing_angle: float = 30.0,
        cleanup: bool = False,
        quiet: bool = False
    ) -> List[str]:
        """
        Render orbit sequence from PLY file
        
        Args:
            input_ply: Path to input PLY file
            output_dir: Output directory for frames
            frames: Number of frames to render
            radius: Camera orbit radius
            fov: Camera field of view in degrees
            width: Image width in pixels
            height: Image height in pixels
            target: Camera target point (x, y, z)
            swing_angle: Swing angle range in degrees (e.g., 30 means -15 to 15)
            cleanup: Clean up temporary files after rendering
            quiet: Suppress non-error output
            
        Returns:
            List of generated frame file paths
        """
        input_ply_abs = str(Path(input_ply).resolve())
        output_dir_abs = str(Path(output_dir).resolve())
        
        cmd = [
            "node",
            str(self.orbit_render_dir.resolve() / "index.mjs"),
            input_ply_abs,
            "-o", output_dir_abs,
            "--frames", str(frames),
            "--radius", str(radius),
            "--fov", str(fov),
            "--width", str(width),
            "--img-height", str(height),
            "--target", f"{target[0]},{target[1]},{target[2]}",
            "--swing-angle", str(swing_angle)
        ]
        
        if cleanup:
            cmd.append("--cleanup")
        if quiet:
            cmd.append("--quiet")
        
        print(f"Running command: {' '.join(cmd)}")
        print(f"Working directory: {str(self.orbit_render_dir.resolve())}")
        
        # Get current environment and ensure PATH is preserved
        env = os.environ.copy()
        
        try:
            result = subprocess.run(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                cwd=str(self.orbit_render_dir.resolve()),
                env=env,
                timeout=300  # 5 minutes timeout for rendering
            )
            
            if result.returncode != 0:
                print(f"Command failed with return code: {result.returncode}")
                print(f"STDOUT: {result.stdout}")
                print(f"STDERR: {result.stderr}")
                raise RuntimeError(f"Orbit render failed (exit code {result.returncode}): {result.stderr}")
            
            if not quiet:
                print(f"STDOUT: {result.stdout}")
            
            output_path = Path(output_dir_abs)
            frame_files = sorted(output_path.glob("frame_*.png"))
            
            print(f"Generated {len(frame_files)} frames in {output_dir_abs}")
            return [str(f) for f in frame_files]
            
        except subprocess.TimeoutExpired:
            raise RuntimeError(f"Orbit render timed out after 300 seconds")
        except FileNotFoundError as e:
            raise RuntimeError(f"Node.js not found or command not executable: {e}")
        except Exception as e:
            print(f"Unexpected error during orbit render: {e}")
            raise
    
    def generate_html_viewer(
        self,
        input_ply: str,
        output_html: str,
        width: int = 1920,
        height: int = 1080,
        quiet: bool = False
    ) -> str:
        """
        Generate HTML viewer from PLY file
        
        Args:
            input_ply: Path to input PLY file
            output_html: Output HTML file path
            width: Viewer width in pixels
            height: Viewer height in pixels
            quiet: Suppress non-error output
            
        Returns:
            Path to generated HTML file
        """
        input_ply_abs = str(Path(input_ply).resolve())
        output_html_abs = str(Path(output_html).resolve())
        
        cmd = [
            "node",
            str(self.project_path.resolve() / "bin" / "cli.mjs"),
            "-w",  # Overwrite if file exists
            input_ply_abs,
            output_html_abs,
            "--width", str(width),
            "--height", str(height)
        ]
        
        print(f"Running command: {' '.join(cmd)}")
        print(f"Working directory: {str(self.project_path.resolve())}")
        
        # Get current environment and ensure PATH is preserved
        env = os.environ.copy()
        
        try:
            result = subprocess.run(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                cwd=str(self.project_path.resolve()),
                env=env,
                timeout=120  # Add timeout to prevent hanging
            )
            
            if result.returncode != 0:
                print(f"Command failed with return code: {result.returncode}")
                print(f"STDOUT: {result.stdout}")
                print(f"STDERR: {result.stderr}")
                raise RuntimeError(f"HTML viewer generation failed (exit code {result.returncode}): {result.stderr}")
            
            if not quiet:
                print(f"STDOUT: {result.stdout}")
            
            # Verify output file was created
            if not os.path.exists(output_html_abs):
                print(f"ERROR: HTML file was not generated: {output_html_abs}")
                print(f"Checking if output directory exists: {os.path.dirname(output_html_abs)}")
                print(f"Directory exists: {os.path.exists(os.path.dirname(output_html_abs))}")
                print(f"Directory contents: {os.listdir(os.path.dirname(output_html_abs)) if os.path.exists(os.path.dirname(output_html_abs)) else 'N/A'}")
                raise RuntimeError(f"HTML file was not generated: {output_html_abs}")
            
            print(f"Generated HTML viewer: {output_html_abs}")
            return output_html_abs
            
        except subprocess.TimeoutExpired:
            raise RuntimeError(f"HTML viewer generation timed out after 120 seconds")
        except FileNotFoundError as e:
            raise RuntimeError(f"Node.js not found or command not executable: {e}")
        except Exception as e:
            print(f"Unexpected error during HTML generation: {e}")
            raise


def convert_to_grayscale(input_path: str, output_path: str):
    """
    Convert image to grayscale using PIL
    
    Args:
        input_path: Input image path
        output_path: Output image path
    """
    try:
        from PIL import Image
        img = Image.open(input_path)
        grayscale_img = img.convert('L')
        grayscale_img.save(output_path)
        print(f"Converted to grayscale: {output_path}")
    except ImportError:
        print("PIL not installed. Install with: pip install Pillow")
        raise


def batch_convert_to_grayscale(input_dir: str, output_dir: str):
    """
    Batch convert all PNG images in directory to grayscale
    
    Args:
        input_dir: Input directory containing PNG images
        output_dir: Output directory for grayscale images
    """
    input_path = Path(input_dir)
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    
    png_files = sorted(input_path.glob("*.png"))
    
    for png_file in png_files:
        output_file = output_path / png_file.name
        convert_to_grayscale(str(png_file), str(output_file))
    
    print(f"Converted {len(png_files)} images to grayscale")


def prepare_for_comfyui(input_dir: str, output_dir: str, grayscale: bool = True):
    """
    Prepare images for ComfyUI processing
    
    Args:
        input_dir: Input directory containing images
        output_dir: Output directory for processed images
        grayscale: Convert to grayscale
    """
    input_path = Path(input_dir)
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    
    png_files = sorted(input_path.glob("*.png"))
    
    for png_file in png_files:
        output_file = output_path / png_file.name
        
        if grayscale:
            convert_to_grayscale(str(png_file), str(output_file))
        else:
            shutil.copy(str(png_file), str(output_file))
    
    print(f"Prepared {len(png_files)} images for ComfyUI")


def main():
    if len(sys.argv) < 3:
        print("Usage:")
        print("  python pythonRun.py <input.ply> <output_dir> [options]")
        print()
        print("Options:")
        print("  --frames N          Number of frames (default: 36)")
        print("  --radius R          Orbit radius (default: 2.0)")
        print("  --fov F             Field of view (default: 45)")
        print("  --width W           Image width (default: 1920)")
        print("  --height H          Image height (default: 1080)")
        print("  --target X,Y,Z      Target point (default: 0,0,1)")
        print("  --grayscale         Convert to grayscale")
        print("  --comfyui DIR       Prepare for ComfyUI (output directory)")
        print("  --cleanup           Clean up temporary files")
        print("  --quiet             Suppress non-error output")
        print()
        print("Examples:")
        print("  python pythonRun.py input.ply ./output")
        print("  python pythonRun.py input.ply ./output --frames 72 --radius 3")
        print("  python pythonRun.py input.ply ./output --grayscale")
        print("  python pythonRun.py input.ply ./output --comfyui ./comfyui_input")
        sys.exit(1)
    
    input_ply = sys.argv[1]
    output_dir = sys.argv[2]
    
    frames = 36
    radius = 2.0
    fov = 45
    width = 1920
    height = 1080
    target = (0, 0, 1)
    grayscale = False
    comfyui_dir = None
    cleanup = False
    quiet = False
    
    i = 3
    while i < len(sys.argv):
        arg = sys.argv[i]
        
        if arg == "--frames" and i + 1 < len(sys.argv):
            frames = int(sys.argv[i + 1])
            i += 2
        elif arg == "--radius" and i + 1 < len(sys.argv):
            radius = float(sys.argv[i + 1])
            i += 2
        elif arg == "--fov" and i + 1 < len(sys.argv):
            fov = int(sys.argv[i + 1])
            i += 2
        elif arg == "--width" and i + 1 < len(sys.argv):
            width = int(sys.argv[i + 1])
            i += 2
        elif arg == "--height" and i + 1 < len(sys.argv):
            height = int(sys.argv[i + 1])
            i += 2
        elif arg == "--target" and i + 1 < len(sys.argv):
            target = tuple(map(float, sys.argv[i + 1].split(',')))
            i += 2
        elif arg == "--grayscale":
            grayscale = True
            i += 1
        elif arg == "--comfyui" and i + 1 < len(sys.argv):
            comfyui_dir = sys.argv[i + 1]
            i += 2
        elif arg == "--cleanup":
            cleanup = True
            i += 1
        elif arg == "--quiet":
            quiet = True
            i += 1
        else:
            print(f"Unknown option: {arg}")
            sys.exit(1)
    
    try:
        splat = SplatTransform()
        
        print(f"Rendering orbit sequence from {input_ply}...")
        frame_files = splat.render_orbit(
            input_ply=input_ply,
            output_dir=output_dir,
            frames=frames,
            radius=radius,
            fov=fov,
            width=width,
            height=height,
            target=target,
            cleanup=cleanup,
            quiet=quiet
        )
        
        if grayscale:
            print(f"\nConverting frames to grayscale...")
            grayscale_dir = Path(output_dir) / "grayscale"
            batch_convert_to_grayscale(output_dir, str(grayscale_dir))
        
        if comfyui_dir:
            print(f"\nPreparing images for ComfyUI...")
            prepare_for_comfyui(output_dir, comfyui_dir, grayscale=grayscale)
        
        print(f"\n✓ Complete! Generated {len(frame_files)} frames in {output_dir}")
        
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
