import os
import sys
import asyncio
import aiohttp
from urllib.parse import urlparse
from sqlmodel import select
from sqlalchemy.orm import sessionmaker
from sqlmodel.ext.asyncio.session import AsyncSession

# Path setup
BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROJECT_ROOT = os.path.dirname(BACKEND_DIR)
FRONTEND_PUBLIC_LOGOS = os.path.join(PROJECT_ROOT, "frontend", "public", "logos")

sys.path.append(BACKEND_DIR)

from app.core.db import engine
from app.models.datasource import DataSource

# Validated Primary Source Map (Only include ones that work or are high confidence)
LOGO_MAP = {
    # Storefronts
    "shopify": "https://www.vectorlogo.zone/logos/shopify/shopify-icon.svg",
    "wix": "https://www.vectorlogo.zone/logos/wix/wix-icon.svg",
    "bigcommerce": "https://www.vectorlogo.zone/logos/bigcommerce/bigcommerce-icon.svg",
    "webflow": "https://www.vectorlogo.zone/logos/webflow/webflow-icon.svg",
    
    # Marketplaces
    "amazon_in": "https://upload.wikimedia.org/wikipedia/commons/4/4a/Amazon_icon.svg",
    
    # Social
    "whatsapp_business": "https://www.vectorlogo.zone/logos/whatsapp/whatsapp-icon.svg",
    "instagram_shopping": "https://www.vectorlogo.zone/logos/instagram/instagram-icon.svg",
}

# Headers to avoid 403s
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

async def download_file(session, url, filepath):
    try:
        async with session.get(url, headers=HEADERS, timeout=10) as response:
            if response.status == 200:
                content = await response.read()
                if len(content) == 0: return False
                with open(filepath, 'wb') as f:
                    f.write(content)
                return True
            else:
                print(f"Failed to download {url}: Status {response.status}")
                return False
    except Exception as e:
        print(f"Error downloading {url}: {e}")
        return False

async def fix_icons():
    # Ensure dir exists
    if not os.path.exists(FRONTEND_PUBLIC_LOGOS):
        os.makedirs(FRONTEND_PUBLIC_LOGOS)
        print(f"Created directory: {FRONTEND_PUBLIC_LOGOS}")

    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    
    async with aiohttp.ClientSession() as http_session:
        async with async_session() as session:
            # Iterate all datasources
            statement = select(DataSource)
            results = await session.execute(statement)
            datasources = results.scalars().all()
            
            for ds in datasources:
                # 1. Try Primary Map
                primary_url = LOGO_MAP.get(ds.slug)
                success = False
                filename = f"{ds.slug}.svg"
                
                if primary_url:
                    ext = "svg" if ".svg" in primary_url.lower() else "png"
                    filename = f"{ds.slug}.{ext}"
                    filepath = os.path.join(FRONTEND_PUBLIC_LOGOS, filename)
                    print(f"Downloading primary icon for {ds.name} ({primary_url})...")
                    success = await download_file(http_session, primary_url, filepath)
                
                # 2. Fallback to Google Favicon
                if not success and ds.website_url:
                    print(f"Trying Google Favicon fallback for {ds.name}...")
                    
                    # Parse domain
                    url_to_parse = ds.website_url
                    if "://" not in url_to_parse:
                        url_to_parse = "http://" + url_to_parse
                    
                    domain = urlparse(url_to_parse).netloc
                    
                    if domain:
                        # Use Google S2 converter
                        google_url = f"https://www.google.com/s2/favicons?domain={domain}&sz=128"
                        filename = f"{ds.slug}.png" # Google serves PNG
                        filepath = os.path.join(FRONTEND_PUBLIC_LOGOS, filename)
                        success = await download_file(http_session, google_url, filepath)
                    else:
                        print(f"Could not extract domain from {ds.website_url}")

                if success:
                    # Update DB
                    local_url = f"/logos/{filename}"
                    ds.logo_url = local_url
                    session.add(ds)
                    print(f"Updated {ds.name} -> {local_url}")
                else:
                    print(f"Failed to find icon for {ds.name}")
            
            await session.commit()
            print("Icon fix completed.")

if __name__ == "__main__":
    asyncio.run(fix_icons())
