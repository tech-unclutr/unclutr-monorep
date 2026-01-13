import shopify
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/Users/param/Documents/Unclutr/backend/.env')

API_KEY = os.getenv('SHOPIFY_API_KEY')
API_SECRET = os.getenv('SHOPIFY_API_SECRET')
SHOP_URL = "unclutr-dev.myshopify.com"
ACCESS_TOKEN = os.getenv("SHOPIFY_ACCESS_TOKEN") # Replaced hardcoded token

# Note: The access token in DB was encrypted or obscured in the previous script output.
# Credentials: {'access_token': 'gAAAAABpY3OYT6R-_6TRbFJ6BD8uoXN5GmDsq0AWXfv18ijB2lE6xMg22OJ7b8ocM4n7e01lgrYQCySrkaYP7P7wEQF-GQs5KkTzoZIdljJ83dsQ2-F708Gnu9uD04JjfbKy5lV7RrF_', 'shop': 'unclutr-dev.myshopify.com'}
# This looks like Fernet encryption. SHOPIFY_ENCRYPTION_KEY is in .env.

from cryptography.fernet import Fernet

def decrypt_token(encrypted_token, key):
    f = Fernet(key)
    return f.decrypt(encrypted_token.encode()).decode()

ENCRYPTION_KEY = os.getenv('SHOPIFY_ENCRYPTION_KEY')
ENCRYPTED_TOKEN = "gAAAAABpY3OYT6R-_6TRbFJ6BD8uoXN5GmDsq0AWXfv18ijB2lE6xMg22OJ7b8ocM4n7e01lgrYQCySrkaYP7P7wEQF-GQs5KkTzoZIdljJ83dsQ2-F708Gnu9uD04JjfbKy5lV7RrF_"

try:
    token = decrypt_token(ENCRYPTED_TOKEN, ENCRYPTION_KEY)
    print(f"Decrypted Token: {token}")
except Exception as e:
    print(f"Error decrypting: {e}")

# Initialize Shopify Session
session = shopify.Session(SHOP_URL, "2024-01", token)
shopify.ShopifyResource.activate_session(session)

# List Products
products = shopify.Product.find(limit=5)
for p in products:
    print(f"Product: {p.title} (ID: {p.id})")
    for v in p.variants:
        print(f"  Variant: {v.title} (ID: {v.id}, SKU: {v.sku}, Inventory Item ID: {v.inventory_item_id})")
