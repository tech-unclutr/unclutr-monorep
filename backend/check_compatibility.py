import os
import re
import sys

def check_files(directory):
    # Regex to find "Type | None" or "Type | OtherType" patterns in type hints
    # This is a basic approximation for the specific issue we faced
    pattern = re.compile(r":\s*[\w\[\]]+\s*\|")
    
    incompatible_files = []
    
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith(".py"):
                path = os.path.join(root, file)
                try:
                    with open(path, "r", encoding="utf-8") as f:
                        lines = f.readlines()
                        for i, line in enumerate(lines):
                            if pattern.search(line):
                                print(f"Potential issue in {path}:{i+1}: {line.strip()}")
                                incompatible_files.append(path)
                                break # One error per file is enough to flag it
                except Exception as e:
                    print(f"Could not read {path}: {e}")

    return len(incompatible_files) > 0

if __name__ == "__main__":
    print("Checking for Python 3.10+ union type syntax (Incompatible with Python 3.9)...")
    base_dir = os.path.dirname(os.path.abspath(__file__))
    has_issues = check_files(os.path.join(base_dir, "app"))
    
    if has_issues:
        print("\n❌ Found potential Python 3.10+ syntax. Please fix these before starting the server.")
        sys.exit(1)
    else:
        print("\n✅ No obvious 3.10+ union types found.")
        sys.exit(0)
