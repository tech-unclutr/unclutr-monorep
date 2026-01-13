import shopify
import os
from dotenv import load_dotenv
from cryptography.fernet import Fernet

# Load environment variables
load_dotenv('/Users/param/Documents/Unclutr/backend/.env')

def decrypt_token(encrypted_token, key):
    f = Fernet(key)
    return f.decrypt(encrypted_token.encode()).decode()

API_KEY = os.getenv('SHOPIFY_API_KEY')
API_SECRET = os.getenv('SHOPIFY_API_SECRET')
SHOP_URL = "unclutr-dev.myshopify.com"
ENCRYPTION_KEY = os.getenv('SHOPIFY_ENCRYPTION_KEY')
ENCRYPTED_TOKEN = "gAAAAABpY3OYT6R-_6TRbFJ6BD8uoXN5GmDsq0AWXfv18ijB2lE6xMg22OJ7b8ocM4n7e01lgrYQCySrkaYP7P7wEQF-GQs5KkTzoZIdljJ83dsQ2-F708Gnu9uD04JjfbKy5lV7RrF_"

token = decrypt_token(ENCRYPTED_TOKEN, ENCRYPTION_KEY)

# Initialize Shopify Session
session = shopify.Session(SHOP_URL, "2024-01", token)
shopify.ShopifyResource.activate_session(session)

VARIANT_ID = 48529867604192
INV_ITEM_ID = 50629646647520

# Get inventory levels for this item
levels = shopify.InventoryLevel.find(inventory_item_ids=INV_ITEM_ID)
print(f"Current levels for {INV_ITEM_ID}:")
for level in levels:
    print(f"  Location: {level.location_id}, Available: {level.available}")
    # Set to 0
    shopify.InventoryLevel.set(level.location_id, INV_ITEM_ID, 0)
    print(f"  Updated Location {level.location_id} to 0")

print("Inventory zeroed successfully.")
