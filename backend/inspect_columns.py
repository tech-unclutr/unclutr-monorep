from sqlalchemy import inspect
from app.core.db import engine
from app.models.company import Company

def inspect_table_columns():
    inspector = inspect(engine)
    columns = inspector.get_columns('company')
    print("Columns in 'company' table:")
    for column in columns:
        print(f"- {column['name']} ({column['type']})")

if __name__ == "__main__":
    inspect_table_columns()
