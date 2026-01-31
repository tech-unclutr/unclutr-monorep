from PIL import Image
import os
import glob

# Configuration
# Find all the recently generated raw avatar images in the brain directory
# We'll sort them to match the IDs 1-12
raw_files = sorted(glob.glob("/Users/param/.gemini/antigravity/brain/d19c63d7-6d89-4cce-b627-c10fae6c7f9c/avatar_*_raw_*.png"), 
                  key=lambda x: int(os.path.basename(x).split('_')[1]))

output_dir_full = "/Users/param/Documents/Unclutr/frontend/public/images/avatars/full_body"
output_dir_head = "/Users/param/Documents/Unclutr/frontend/public/images/avatars"

os.makedirs(output_dir_full, exist_ok=True)
os.makedirs(output_dir_head, exist_ok=True)

for i, raw_path in enumerate(raw_files, 1):
    img = Image.open(raw_path)
    width, height = img.size
    
    # Save full body version
    filename = f"avatar_{i}.png"
    img.save(os.path.join(output_dir_full, filename))
    
    # Create headshot crop (tight face cut)
    # Since individual images are centered, we can take a square from the upper center.
    # We'll take top 40% area and find the face.
    # Usually the face is roughly in the top 1/3
    
    square_size = int(min(width, height) * 0.35)
    
    # Center horizontally
    h_left = (width - square_size) // 2
    # Vertically, it's usually near the top
    h_top = int(height * 0.05) 
    
    h_right = h_left + square_size
    h_bottom = h_top + square_size
    
    crop_head = img.crop((h_left, h_top, h_right, h_bottom))
    
    # Save headshot
    crop_head.save(os.path.join(output_dir_head, filename))
    print(f"Processed individual avatar {i} from {os.path.basename(raw_path)}")

print(f"Successfully processed {len(raw_files)} individual avatars.")
