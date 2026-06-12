import os
import sys

# Try to import PIL, install if missing
try:
    from PIL import Image, ImageDraw
except ImportError:
    import subprocess
    print("Pillow library not found. Installing now...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "pillow"])
    from PIL import Image, ImageDraw

# Create icons directory
os.makedirs('icons', exist_ok=True)

# Generate icon set
for size in [16, 48, 128]:
    # Dark blue background base matching extension palette
    img = Image.new('RGBA', (size, size), (10, 14, 26, 255))
    draw = ImageDraw.Draw(img)
    margin = max(1, size // 16)
    
    # Draw outer blue ring
    draw.ellipse(
        [margin, margin, size - margin, size - margin],
        outline=(37, 99, 235, 255), # #2563eb
        width=max(1, size // 16)
    )
    
    # Draw inner globe core
    inner_margin = margin + max(2, size // 8)
    draw.ellipse(
        [inner_margin, inner_margin, size - inner_margin, size - inner_margin],
        fill=(29, 78, 216, 255) # #1d4ed8
    )
    
    # Draw longitude/latitude mesh lines for globe theme
    mid = size // 2
    # Lat line (horizontal)
    draw.line(
        [inner_margin, mid, size - inner_margin, mid],
        fill=(96, 165, 250, 255), # #60a5fa
        width=max(1, size // 24)
    )
    # Lon line (vertical)
    draw.line(
        [mid, inner_margin, mid, size - inner_margin],
        fill=(96, 165, 250, 255), # #60a5fa
        width=max(1, size // 24)
    )
    
    # Save image
    img.save(f'icons/icon-{size}.png')
    print(f'Successfully created icons/icon-{size}.png ({size}x{size})')

print("Icon generation complete!")
