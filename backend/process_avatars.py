from PIL import Image
import os

# Configuration
input_path = "/Users/param/.gemini/antigravity/brain/d19c63d7-6d89-4cce-b627-c10fae6c7f9c/indian_3d_realistic_fun_avatars_v2_1769863217655.png"
output_dir_full = "/Users/param/Documents/Unclutr/frontend/public/images/avatars/full_body"
output_dir_head = "/Users/param/Documents/Unclutr/frontend/public/images/avatars"
rows = 3
cols = 4

# Load image
img = Image.open(input_path)
width, height = img.size
cell_width = width // cols
cell_height = height // rows

# Create output dirs
os.makedirs(output_dir_full, exist_ok=True)
os.makedirs(output_dir_head, exist_ok=True)

# Split and save
count = 0
for row in range(rows):
    for col in range(cols):
        count += 1
        left = col * cell_width
        top = row * cell_height
        right = left + cell_width
        bottom = top + cell_height
        
        # Crop full body cell
        crop_full = img.crop((left, top, right, bottom))
        
        # Save full body
        filename_full = f"avatar_{count}.png"
        crop_full.save(os.path.join(output_dir_full, filename_full))
        
        # Create headshot crop (approx top 35%, centered horizontally)
        # Assuming the face is in the top center
        head_height = int(cell_height * 0.35)
        # Margin from top to avoid cropping weirdly or getting grid lines
        top_margin = int(cell_height * 0.05) 
         
        # Make a square crop for the head
        # Center x
        center_x = cell_width // 2
        crop_size = min(head_height, cell_width) # Usually head height is smaller
        
        # Define crop box for head
        head_left = 0 # Just take the full width for now and let CSS object-cover handle centering if wide? 
        # Actually, let's try to be smart. A simple top crop is safer than a tight square if we don't know exactly where the head is.
        # But for an avatar circle, a square is best.
        # Create headshot crop (tight face cut)
        # Taking a smaller square from the upper-middle area
        square_size = int(cell_width * 0.35) 
        h_left = (cell_width - square_size) // 2
        # Move up slightly from previous to get just the face/hair
        h_top = int(cell_height * 0.02) 
        h_right = h_left + square_size
        h_bottom = h_top + square_size
        
        crop_head = crop_full.crop((h_left, h_top, h_right, h_bottom))
        
        # Save headshot (overwriting old ones to keep consistent IDs)
        filename_head = f"avatar_{count}.png"
        crop_head.save(os.path.join(output_dir_head, filename_head))
        
        print(f"Processed avatar {count}")

print(f"Successfully processed {count} avatars (full body & headshots).")
