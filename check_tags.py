
import re

def find_mismatched_tags(file_path):
    with open(file_path, 'r') as f:
        content = f.read()

    # Simple regex to find tags. This won't handle complex JSX perfectly but might catch obvious ones.
    # We'll look for <Tag and </Tag
    tags = re.findall(r'<(/?(?:div|motion\.div|AnimatePresence|AlertDialog|AlertDialogContent|AlertDialogHeader|AlertDialogFooter|AlertDialogAction|AlertDialogCancel|AlertDialogTitle|AlertDialogDescription|Button|Badge|Sparkles|Target|Loader2|Clock|X|Plus|AlertTriangle|Bot|Play|Pause|ArrowRight|CallLogTable|AgentActivityBar|AgentIntelligenceDashboard|AgentQueue|HumanQueue|ExecutionFeed|AgentLiveUpdateModal|AgentQueueModal|WindowList|TimeWindowSelector|AnimatePresence))(?:\s|>|/)', content)

    stack = []
    for tag in tags:
        if tag.startswith('/'):
            closing_tag = tag[1:]
            if not stack:
                print(f"Extra closing tag: </{closing_tag}>")
            else:
                opening_tag = stack.pop()
                if opening_tag != closing_tag:
                    print(f"Mismatched tag: expected </{opening_tag}>, found </{closing_tag}>")
                    # Push it back to try to recover
                    # stack.append(opening_tag) 
        else:
            if tag.endswith('/'): # Self-closing
                pass
            else:
                stack.append(tag)

    if stack:
        print(f"Unclosed tags: {stack}")

if __name__ == "__main__":
    find_mismatched_tags('/Users/param/Documents/Unclutr/frontend/components/customer-intelligence/ExecutionPanel.tsx')
