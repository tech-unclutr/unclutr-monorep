from PIL import Image
import os

# Configuration
input_path = "/Users/param/.gemini/antigravity/brain/d19c63d7-6d89-4cce-b627-c10fae6c7f9c/cohort_avatars_grid_1769861202221.png"
output_dir = "/Users/param/Documents/Unclutr/frontend/public/images/avatars"
rows = 3
cols = 4

# Load image
img = Image.open(input_path)
width, height = img.size
cell_width = width // cols
cell_height = height // rows

# Create output dir if not exists
os.makedirs(output_dir, exist_ok=True)

# Split and save
count = 0
for row in range(rows):
    for col in range(cols):
        count += 1
        left = col * cell_width
        top = row * cell_height
        right = left + cell_width
        bottom = top + cell_height
        
        # Crop
        crop = img.crop((left, top, right, bottom))
        
        # Optional: Trim whitespace? 
        # For now, let's keep the grid cell as is, or maybe center crop slightly to remove potential grid lines
        # But DALL-E grids are usually well spaced. Let's crop 5% from edges to be safe against grid lines
        # w_margin = int(cell_width * 0.05)
        # h_margin = int(cell_height * 0.05)
        # crop = crop.crop((w_margin, h_margin, cell_width - w_margin, cell_height - h_margin))
        
        # Save
        output_filename = f"avatar_{count}.png"
        crop.save(os.path.join(output_dir, output_filename))
        print(f"Saved {output_filename}")

print(f"Successfully split into {count} avatars.")
