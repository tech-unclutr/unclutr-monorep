
import re
import sys

def find_mismatches(file_path):
    with open(file_path, 'r') as f:
        content = f.read()

    # Regex for tags
    # <tag ...> or <tag>
    # Note: excluding self-closing tags <tag ... />
    
    # We want to match <tag or </tag but only for div, motion.div, Avatar
    # Use re.DOTALL to match across lines if needed, but we can also just find the start of the tag
    tag_pattern = re.compile(r'<(/?)(div|motion\.div|Avatar)\b')
    
    # We also need to check if it's self-closing
    # This is tricky with simple regex if the tag spans multiple lines
    # Let's find each start/end tag and then check if it's self-closing by looking ahead
    
    pos = 0
    stack = []
    
    while True:
        match = tag_pattern.search(content, pos)
        if not match:
            break
            
        start_idx = match.start()
        is_closing = match.group(1) == '/'
        tag_name = match.group(2)
        
        # Find the end of this tag
        end_idx = content.find('>', start_idx)
        if end_idx == -1:
            break
            
        full_tag_text = content[start_idx:end_idx+1]
        line_no = content.count('\n', 0, start_idx) + 1
        
        # Check if self-closing
        if not is_closing and full_tag_text.endswith('/>'):
            pos = end_idx + 1
            continue
            
        if is_closing:
            if not stack:
                print(f"Error: Found closing tag </{tag_name}> at line {line_no} but stack is empty")
            else:
                last_tag, last_line = stack.pop()
                if last_tag != tag_name:
                    print(f"Error: Mismatched tag. Found </{tag_name}> at line {line_no}, expected </{last_tag}> (opened at line {last_line})")
        else:
            stack.append((tag_name, line_no))
            
        pos = end_idx + 1
                
    if stack:
        print("\nUnclosed tags:")
        for tag_name, line_no in stack:
            print(f"<{tag_name}> opened at line {line_no} is not closed")

if __name__ == "__main__":
    find_mismatches(sys.argv[1])
