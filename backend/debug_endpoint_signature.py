import inspect
from app.main import app
from fastapi.routing import APIRoute

print("Searching for intelligence deck endpoint...")

target_path = "/api/v1/intelligence/deck/{brand_id}"

for route in app.routes:
    if isinstance(route, APIRoute):
        if route.path == target_path:
            print(f"FOUND ROUTE: {route.path}")
            print(f"Methods: {route.methods}")
            handler = route.endpoint
            print(f"Handler: {handler}")
            print(f"Handler Name: {handler.__name__}")
            print(f"File: {inspect.getfile(handler)}")
            print(f"Signature: {inspect.signature(handler)}")
            
            # Print source code of the handler
            try:
                print("Source Code:")
                print(inspect.getsource(handler))
            except Exception as e:
                print(f"Could not get source: {e}")
            break
else:
    print(f"Route {target_path} not found!")
