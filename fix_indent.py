import sys

path = 'backend/app/api/v1/endpoints/shopify_data.py'
with open(path, 'r') as f:
    lines = f.readlines()

new_lines = []
in_try = False
for i, line in enumerate(lines):
    # Adjust line numbers (1-indexed in view_file)
    ln = i + 1
    
    if ln == 91: # try:
        new_lines.append(line)
        in_try = True
        continue
    
    if ln >= 92 and ln <= 558:
        new_lines.append("    " + line)
        continue
        
    if ln == 559: # except
        in_try = False
    
    new_lines.append(line)

with open(path, 'w') as f:
    f.writelines(new_lines)
print("Indentation fixed.")
