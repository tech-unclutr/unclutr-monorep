from PIL import Image
import os

def remove_background(input_path, output_path):
    img = Image.open(input_path)
    img = img.convert("RGBA")
    datas = img.getdata()

    new_data = []
    for item in datas:
        # If the pixel is very close to white (thresholding for soft edges)
        if item[0] > 240 and item[1] > 240 and item[2] > 240:
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)

    img.putdata(new_data)
    img.save(output_path, "PNG")

# Define paths
source_dir = "/Users/param/.gemini/antigravity/brain/6cf8b688-0934-4723-a8fc-ec9a97ce72f3"
target_dir = "/Users/param/Documents/Unclutr/frontend/public/images/avatars/notionists/full_body"

# Create target directory if it doesn't exist
os.makedirs(target_dir, exist_ok=True)

# List of files to process
files = [
    ("notionist_full_body_1_png_1769917323922.png", "avatar_1.png"),
    ("notionist_full_body_2_png_1769917346048.png", "avatar_2.png"),
    ("notionist_full_body_3_png_1769917371540.png", "avatar_3.png"),
    ("notionist_real_2_png_1769917427113.png", "avatar_4.png"),
    ("notionist_real_3_png_1769917451057.png", "avatar_5.png"),
]

for src_name, target_name in files:
    src_path = os.path.join(source_dir, src_name)
    tgt_path = os.path.join(target_dir, target_name)
    if os.path.exists(src_path):
        print(f"Processing {src_name} -> {target_name}")
        remove_background(src_path, tgt_path)
    else:
        print(f"Source not found: {src_path}")
