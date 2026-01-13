import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlmodel import SQLModel
import app.models

print("Tables in metadata:")
for table in SQLModel.metadata.tables:
    print(f" - {table}")
