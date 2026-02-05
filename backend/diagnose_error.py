
import sys
import os

# Add backend to path
sys.path.append(os.getcwd())

print("Importing bolna_webhook...")
try:
    from app.api.v1.endpoints import bolna_webhook
    print("bolna_webhook imported successfully.")
except Exception as e:
    print(f"Failed to import bolna_webhook: {e}")
    import traceback
    traceback.print_exc()

print("Importing execution...")
try:
    from app.api.v1.endpoints import execution
    print("execution imported successfully.")
except Exception as e:
    print(f"Failed to import execution: {e}")
    import traceback
    traceback.print_exc()

print("Importing queue_warmer...")
try:
    from app.services import queue_warmer
    print("queue_warmer imported successfully.")
except Exception as e:
    print(f"Failed to import queue_warmer: {e}")
    import traceback
    traceback.print_exc()
