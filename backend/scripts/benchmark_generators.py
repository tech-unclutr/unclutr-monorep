
import time
import sys
import os

# Add backend to path
sys.path.append(os.getcwd())

print("Starting Generator Benchmark...")
start_time = time.time()

try:
    from app.services.intelligence.insight_engine import InsightEngine
    print(f"Imported InsightEngine in {time.time() - start_time:.4f}s")
    
    engine_start = time.time()
    engine = InsightEngine()
    print(f"Instantiated InsightEngine in {time.time() - engine_start:.4f}s")
    
    # Check generators
    print(f"Loaded {len(engine.generators)} generators.")
    
except Exception as e:
    print(f"FAILED: {e}")
    sys.exit(1)

print(f"Total Time: {time.time() - start_time:.4f}s")
