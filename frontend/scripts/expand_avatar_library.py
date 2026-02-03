from PIL import Image, ImageEnhance
import os
import colorsys

def remove_background(img):
    img = img.convert("RGBA")
    datas = img.getdata()
    new_data = []
    for item in datas:
        # If pixels are white (background), make them transparent
        if item[0] > 240 and item[1] > 240 and item[2] > 240:
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)
    img.putdata(new_data)
    return img

def shift_hue(img, hue_shift):
    """Shifts the hue of an image's non-transparent pixels."""
    img = img.convert("RGBA")
    arr = img.load()
    
    for x in range(img.size[0]):
        for y in range(img.size[1]):
            r, g, b, a = arr[x, y]
            if a == 0: continue  # Skip transparent pixels
            
            # Convert to HSV
            r, g, b = r/255.0, g/255.0, b/255.0
            h, s, v = colorsys.rgb_to_hsv(r, g, b)
            
            # Shift Hue
            h = (h + hue_shift) % 1.0
            
            # Convert back to RGB
            r, g, b = colorsys.hsv_to_rgb(h, s, v)
            arr[x, y] = (int(r*255), int(g*255), int(b*255), a)
            
    return img

# Define paths
source_dir = "/Users/param/.gemini/antigravity/brain/6cf8b688-0934-4723-a8fc-ec9a97ce72f3"
target_dir = "/Users/param/Documents/Unclutr/frontend/public/images/avatars/notionists/full_body"
os.makedirs(target_dir, exist_ok=True)


# Map of raw files to their base output names
raw_files = [
    # Full Body
    ("notionist_full_body_1_png_1769917323922.png", 1),
    ("notionist_full_body_2_png_1769917346048.png", 2),
    ("notionist_full_body_3_png_1769917371540.png", 3),
    # Real Series
    ("notionist_real_1_png_1769917400330.png", 4),
    ("notionist_real_2_png_1769917427113.png", 5),
    ("notionist_real_3_png_1769917451057.png", 6),
    ("notionist_real_9_png_1769919428141.png", 7),
    ("notionist_real_10_png_1769919501625.png", 8),
    ("notionist_real_11_png_1769919523981.png", 9),
    ("notionist_real_12_png_1769919549561.png", 10),
    ("notionist_real_13_png_1769919570967.png", 11),
    ("notionist_real_14_png_1769919606128.png", 12),
]

# We need 50+ avatars. 12 base images.
# 5 variations per image = 60 avatars.
NUM_VARIATIONS = 5 
# Offsets for hue shifts: 0 (original), 0.2, 0.4, 0.6, 0.8
hue_step = 1.0 / NUM_VARIATIONS

processed_count = 0

for src_name, start_idx in raw_files:
    src_path = os.path.join(source_dir, src_name)
    if os.path.exists(src_path):
        print(f"Processing source: {src_name}")
        base_img = Image.open(src_path)
        base_img = remove_background(base_img)
        
        # Base slot index logic:
        # Base images are 1..12
        # Var 1 images are 13..24
        # Var 2 images are 25..36
        # Var 3 images are 37..48
        # Var 4 images are 49..60
        
        for i in range(NUM_VARIATIONS):
            # i=0 is original, i>0 are shifted
            
            # Calculate output index
            # output_idx = start_idx + (i * 12)
            # This would give 1..12, 13..24, etc.
            output_idx = start_idx + (i * 12)
            
            tgt_name = f"avatar_{output_idx}.png"
            
             # Shift hue if not original
            if i == 0:
                final_img = base_img
            else:
                shift = (i * hue_step) + (start_idx * 0.02) # Add slight per-avatar drift
                final_img = shift_hue(base_img.copy(), shift)
            
            final_img.save(os.path.join(target_dir, tgt_name), "PNG")
            print(f"  -> Saved {tgt_name} (Var {i})")
            processed_count += 1

print(f"Total avatars generated: {processed_count}")
