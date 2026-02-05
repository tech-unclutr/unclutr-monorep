import re
import sys

def check_tags(filepath):
    content = open(filepath).read()
    stack = []
    lines = content.split('\n')
    for i, line in enumerate(lines):
        # Rough check for <div> vs </div>
        # Find all <div ...> or <div ... />
        div_starts = list(re.finditer(r'<div[ >]', line))
        div_closes = list(re.finditer(r'</div>', line))
        
        # Sort tokens by position in line
        tokens = []
        for m in div_starts:
            # Check if it is self-closing
            # Peek at the rest of the line from this match
            rest = line[m.start():]
            end_tag = re.search(r'>', rest)
            if end_tag:
                tag_content = rest[:end_tag.start()+1]
                if tag_content.endswith('/>'):
                    tokens.append(('self', i+1, m.start()))
                else:
                    tokens.append(('open', i+1, m.start()))
        
        for m in div_closes:
            tokens.append(('close', i+1, m.start()))
            
        tokens.sort(key=lambda x: x[2])
        
        for type, line_num, pos in tokens:
            if type == 'open':
                stack.append(line_num)
            elif type == 'close':
                if not stack:
                    print(f"EXTRA </div> at line {line_num}")
                else:
                    stack.pop()
    
    if stack:
        print(f"UNCLOSED <div> opened at lines: {stack}")

if __name__ == '__main__':
    check_tags(sys.argv[1])
