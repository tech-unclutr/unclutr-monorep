
import pandas as pd
import os

# Create a sample dataset
data = {
    'Customer Name': ['John Doe', 'Jane Smith', 'Bob Johnson'],
    'Phone Number': ['1234567890', '9876543210', '5551234567'],
    'Segment': ['Premium', 'Regular', 'New']
}

df = pd.DataFrame(data)

# Create directory for test files if it doesn't exist
test_dir = '/Users/param/Documents/Unclutr/test_files'
os.makedirs(test_dir, exist_ok=True)

# Generate CSV
df.to_csv(os.path.join(test_dir, 'leads_test.csv'), index=False)

# Generate XLSX
df.to_excel(os.path.join(test_dir, 'leads_test.xlsx'), index=False)

# Generate XLS (requires xlwt or similar, but xlsxwriter can do it sometimes or just use openpyxl for xlsx)
# Note: to_excel with .xls might need 'xlwt'
try:
    df.to_excel(os.path.join(test_dir, 'leads_test.xls'), index=False, engine='xlwt')
except ImportError:
    print("xlwt not installed, skipping .xls generation")

print(f"Test files generated in {test_dir}")
