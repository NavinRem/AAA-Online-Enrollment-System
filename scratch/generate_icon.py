import os
import sys

try:
    from PIL import Image, ImageOps
except ImportError:
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "pillow"])
    from PIL import Image, ImageOps

def main():
    os.makedirs('mobile/assets/icon', exist_ok=True)
    logo_path = 'frontend/public/logo.png'
    dest_path = 'mobile/assets/icon/app_icon.png'
    
    if not os.path.exists(logo_path):
        print(f"Error: logo.png not found at {logo_path}")
        sys.exit(1)
        
    logo = Image.open(logo_path)
    
    # Create a 512x512 white background
    bg_size = (512, 512)
    bg = Image.new('RGBA', bg_size, (255, 255, 255, 255))
    
    # Calculate scale factor to make it fit nicely (with 15% padding)
    max_dimension = int(512 * 0.70)
    logo.thumbnail((max_dimension, max_dimension), Image.Resampling.LANCZOS)
    
    # Position logo in center
    x = (512 - logo.width) // 2
    y = (512 - logo.height) // 2
    
    # Paste logo onto white background (use logo as alpha mask if RGBA)
    mask = logo if logo.mode == 'RGBA' else None
    bg.paste(logo, (x, y), mask)
    
    # Save as RGB PNG
    bg.convert('RGB').save(dest_path)
    print(f"Successfully generated app icon at {dest_path}")

if __name__ == '__main__':
    main()
