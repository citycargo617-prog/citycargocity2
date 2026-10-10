import os
from PIL import Image
import numpy as np

input_path = r"C:\Users\LENOVO\.gemini\antigravity-ide\brain\6f0de49a-b2fe-4f5b-96b8-f2f14dd3cff0\.user_uploaded\media_1791618043532.jpg"
out_dir = r"public\assets"
os.makedirs(out_dir, exist_ok=True)

img = Image.open(input_path).convert("RGBA")
arr = np.array(img).astype(float)

# Bounding box of logo: x=87 to 612, y=86 to 308
# Crop out the entire card border and shadow
cropped = arr[84:310, 85:615].copy()

# Sample the background color within the cropped area (top-left near x=90, y=90)
# Background is off-white ~ 248, 248, 248
# Let's create an alpha channel where background is 0 and dark text/orange/blue is 255
r, g, b = cropped[:, :, 0], cropped[:, :, 1], cropped[:, :, 2]

# Compute darkness from white (255, 255, 255)
# Pure white = 0 distance, blue/orange = large distance
dist_from_white = np.maximum(250 - r, np.maximum(250 - g, 250 - b))
alpha = np.clip((dist_from_white - 8) * 12.0, 0, 255).astype(np.uint8)

# Enhance color vibrancy of blue and orange
cropped[:, :, 3] = alpha

result = Image.fromarray(cropped.astype(np.uint8), "RGBA")
full_clean_path = os.path.join(out_dir, "citycargo_logo_clean.png")
result.save(full_clean_path, "PNG")
print(f"Saved clean logo: {full_clean_path} size {result.size}")

# Now crop the circular emblem (x: 0 to 225 inside cropped)
emblem_arr = cropped[:, :225].copy()
# Make it square
h, w = emblem_arr.shape[:2]
side = max(h, w)
square_emblem = np.zeros((side, side, 4), dtype=np.uint8)
ox = (side - w) // 2
oy = (side - h) // 2
square_emblem[oy:oy+h, ox:ox+w] = emblem_arr.astype(np.uint8)

emblem_img = Image.fromarray(square_emblem, "RGBA")
emblem_clean_path = os.path.join(out_dir, "citycargo_emblem_clean.png")
emblem_img.save(emblem_clean_path, "PNG")
print(f"Saved clean circular emblem: {emblem_clean_path} size {emblem_img.size}")
