import sys
import os
import asyncio
from sqlmodel import select
from sqlalchemy.orm import sessionmaker
from sqlmodel.ext.asyncio.session import AsyncSession

# Add backend directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.db import engine, init_db
from app.models.datasource import DataSource, DataSourceCategory

# Define the exhaustive list
DATASOURCES = [
    # 1) Brand-owned storefront platforms
    # Global
    {
        "name": "Shopify",
        "slug": "shopify",
        "category": DataSourceCategory.Storefront,
        "website_url": "https://www.shopify.com",
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/0/0e/Shopify_icon.svg", 
        "description": "Leading e-commerce platform for online stores and retail point-of-sale systems.",
        "is_common": True,
    },
    {
        "name": "WooCommerce",
        "slug": "woocommerce",
        "category": DataSourceCategory.Storefront,
        "website_url": "https://woocommerce.com",
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/2/2a/WooCommerce_logo.svg",
        "description": "Open-source e-commerce plugin for WordPress.",
        "is_common": True,
    },
    {
        "name": "Magento",
        "slug": "magento",
        "category": DataSourceCategory.Storefront,
        "website_url": "https://business.adobe.com/products/magento/magento-commerce.html",
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/5/55/Magento_Logo.svg",
        "description": "Flexible and scalable open-source e-commerce platform.",
    },
    {
        "name": "Wix eCommerce",
        "slug": "wix",
        "category": DataSourceCategory.Storefront,
        "website_url": "https://www.wix.com/ecommerce",
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/7/76/Wix.com_website_logo.svg",
        "description": "Cloud-based web development platform with e-commerce.",
    },
    {
        "name": "BigCommerce",
        "slug": "bigcommerce",
        "category": DataSourceCategory.Storefront,
        "website_url": "https://www.bigcommerce.com",
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/BigCommerce_logo.svg/2560px-BigCommerce_logo.svg.png", 
        "description": "SaaS e-commerce platform.",
    },
    {
        "name": "Squarespace Commerce",
        "slug": "squarespace",
        "category": DataSourceCategory.Storefront,
        "website_url": "https://www.squarespace.com/ecommerce",
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/b/b8/Squarespace_logo.svg",
        "description": "Website builder with e-commerce features.",
    },
    {
        "name": "Webflow eCommerce",
        "slug": "webflow",
        "category": DataSourceCategory.Storefront,
        "website_url": "https://webflow.com/ecommerce",
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/e/e4/Webflow_logo_2023.svg", 
        "description": "Designer-centric e-commerce platform.",
    },
    {
        "name": "Ecwid",
        "slug": "ecwid",
        "category": DataSourceCategory.Storefront,
        "website_url": "https://www.ecwid.com",
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/0/05/Ecwid_logo.svg", # Placeholder/approx
        "description": "E-commerce platform that integrates with existing websites.",
    },
    {
        "name": "Zoho Commerce",
        "slug": "zoho_commerce",
        "category": DataSourceCategory.Storefront,
        "website_url": "https://www.zoho.com/commerce",
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/6/62/Zoho-logo.png",
        "description": "E-commerce platform by Zoho.",
    },
    # India-first / India-heavy SMB
    {
        "name": "Dukaan",
        "slug": "dukaan",
        "category": DataSourceCategory.Storefront,
        "website_url": "https://mydukaan.io",
        "logo_url": "https://mydukaan.io/static/images/dukaan-logo.svg", # Try direct or updated
        "description": "Create your online store in 30 seconds.",
    },
    {
        "name": "Instamojo",
        "slug": "instamojo",
        "category": DataSourceCategory.Storefront,
        "website_url": "https://www.instamojo.com",
        "logo_url": "https://cdn.instamojo.com/static/images/logos/instamojo_logo.svg", # Often valid
        "description": "E-commerce and payment gateway platform for MSMEs.",
    },
    {
        "name": "StoreHippo",
        "slug": "storehippo",
        "category": DataSourceCategory.Storefront,
        "website_url": "https://www.storehippo.com",
        "logo_url": "https://cdn.storehippo.com/s/565dad7233804d062829eebc/ms-icon-310x310.png",
        "description": "SaaS-based e-commerce platform.",
    },
    {
        "name": "Fynd Platform",
        "slug": "fynd",
        "category": DataSourceCategory.Storefront,
        "website_url": "https://platform.fynd.com",
        "logo_url": "https://platform.fynd.com/public/images/fynd-logo.png", # Approx
        "description": "Omnichannel e-commerce platform.",
    },

    # 2) E-commerce marketplaces
    # Horizontal
    {
        "name": "Amazon India",
        "slug": "amazon_in",
        "category": DataSourceCategory.Marketplace,
        "website_url": "https://www.amazon.in",
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/4/4a/Amazon_icon.svg",
        "description": "Largest online marketplace in India.",
        "is_common": True,
    },
    {
        "name": "Flipkart",
        "slug": "flipkart",
        "category": DataSourceCategory.Marketplace,
        "website_url": "https://www.flipkart.com",
        "logo_url": "https://upload.wikimedia.org/wikipedia/en/2/29/Flipkart_logo.svg", # Official wiki link often redirects, but worth try. Or use generic png.
        # Fallback to a solid PNG if SVG fails on client:
        # "https://seeklogo.com/images/F/flipkart-logo-3F33927DAA-seeklogo.com.png"
        "description": "Leading Indian e-commerce company.",
        "is_common": True,
    },
    {
        "name": "Meesho",
        "slug": "meesho",
        "category": DataSourceCategory.Marketplace,
        "website_url": "https://www.meesho.com",
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/8/80/Meesho_Logo_Full.png",
        "description": "Indian social commerce platform.",
        "is_common": True,
    },
    {
        "name": "Snapdeal",
        "slug": "snapdeal",
        "category": DataSourceCategory.Marketplace,
        "website_url": "https://www.snapdeal.com",
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/c/c1/Snapdeal_Logo.svg",
        "description": "Value e-commerce platform.",
    },
    {
        "name": "JioMart",
        "slug": "jiomart",
        "category": DataSourceCategory.Marketplace,
        "website_url": "https://www.jiomart.com",
        "logo_url": "https://upload.wikimedia.org/wikipedia/en/thumb/b/b6/JioMart_logo.svg/1200px-JioMart_logo.svg.png",
        "description": "Online grocery and general merchandise.",
    },
    {
        "name": "Tata CLiQ",
        "slug": "tata_cliq",
        "category": DataSourceCategory.Marketplace,
        "website_url": "https://www.tatacliq.com",
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/b/b3/Tata_Cliq_logo.svg",
        "description": "Luxury & lifestyle e-commerce by Tata.",
    },
    # Vertical
    {
        "name": "Myntra",
        "slug": "myntra",
        "category": DataSourceCategory.Marketplace,
        "website_url": "https://www.myntra.com",
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/b/bc/Myntra_Logo.png",
        "description": "Major Indian fashion e-commerce company.",
        "is_common": True,
    },
    {
        "name": "AJIO",
        "slug": "ajio",
        "category": DataSourceCategory.Marketplace,
        "website_url": "https://www.ajio.com",
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/a/a2/Ajio-Logo.svg", # Often hard to find valid direct SVG. 
        # "https://assets.ajio.com/static/img/Ajio-Logo.svg"
        "description": "Fashion and lifestyle brand under Reliance Retail.",
        "is_common": True,
    },
    {
        "name": "Nykaa",
        "slug": "nykaa",
        "category": DataSourceCategory.Marketplace,
        "website_url": "https://www.nykaa.com",
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/0/00/Nykaa_Logo.svg",
        "description": "Beauty, wellness and fashion products.",
        "is_common": True,
    },
    {
        "name": "FirstCry",
        "slug": "firstcry",
        "category": DataSourceCategory.Marketplace,
        "website_url": "https://www.firstcry.com",
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/4/42/Firstcry-logo.png",
        "description": "Asia's largest online store for baby and kids products.",
    },
    {
        "name": "Pepperfry",
        "slug": "pepperfry",
        "category": DataSourceCategory.Marketplace,
        "website_url": "https://www.pepperfry.com",
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/c/c4/Pepperfry-Logo-New.png",
        "description": "Online furniture and home decor.",
    },
    {
        "name": "Tata 1mg",
        "slug": "tata_1mg",
        "category": DataSourceCategory.Marketplace,
        "website_url": "https://www.1mg.com",
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/a/a7/Tata_1mg_Logo.svg",
        "description": "Online pharmacy and healthcare platform.",
    },
    {
        "name": "PharmEasy",
        "slug": "pharmeasy",
        "category": DataSourceCategory.Marketplace,
        "website_url": "https://pharmeasy.in",
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/f/fc/Pharmeasy_logo.png",
        "description": "Online pharmacy and medical store.",
    },

    # 3) Quick commerce
    {
        "name": "Blinkit",
        "slug": "blinkit",
        "category": DataSourceCategory.QuickCommerce,
        "website_url": "https://blinkit.com",
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/2/2c/Blinkit-yellow-rounded-2022.svg",
        "description": "Instant delivery service.",
        "is_common": True,
    },
    {
        "name": "Zepto",
        "slug": "zepto",
        "category": DataSourceCategory.QuickCommerce,
        "website_url": "https://www.zeptonow.com",
        "logo_url": "https://upload.wikimedia.org/wikipedia/en/7/7d/Zepto_logo.png",
        "description": "10-minute grocery delivery.",
        "is_common": True,
    },
    {
        "name": "Swiggy Instamart",
        "slug": "swiggy_instamart",
        "category": DataSourceCategory.QuickCommerce,
        "website_url": "https://www.swiggy.com/instamart",
        "logo_url": "https://upload.wikimedia.org/wikipedia/en/1/12/Swiggy_logo.svg",
        "description": "Instant grocery delivery by Swiggy.",
        "is_common": True,
    },
    {
        "name": "BigBasket BBNow",
        "slug": "bbnow",
        "category": DataSourceCategory.QuickCommerce,
        "website_url": "https://www.bigbasket.com/bbnow",
        "logo_url": "https://upload.wikimedia.org/wikipedia/commons/5/52/Bigbasket-logo.png",
        "description": "Instant grocery delivery by BigBasket.",
        "is_common": True,
    },
    {
        "name": "Flipkart Minutes",
        "slug": "flipkart_minutes",
        "category": DataSourceCategory.QuickCommerce,
        "website_url": "https://www.flipkart.com",
        "logo_url": "https://upload.wikimedia.org/wikipedia/en/2/29/Flipkart_logo.svg", # Same parent
        "description": "Quick commerce service by Flipkart.",
    },

    # 4) ONDC
    {
        "name": "ONDC",
        "slug": "ondc",
        "category": DataSourceCategory.Network,
        "website_url": "https://ondc.org",
        "logo_url": "https://ondc.org/assets/theme/images/ondc_logo_v1.svg",
        "description": "Open Network for Digital Commerce.",
        "is_common": True,
    },

    # 5) Social / chat commerce
    {
        "name": "WhatsApp Business",
        "slug": "whatsapp_business",
        "category": DataSourceCategory.SocialCommerce,
        "website_url": "https://business.whatsapp.com",
        "logo_url": "https://logo.clearbit.com/whatsapp.com",
        "description": "Chat commerce and catalog.",
    },
    {
        "name": "Instagram Shopping",
        "slug": "instagram_shopping",
        "category": DataSourceCategory.SocialCommerce,
        "website_url": "https://business.instagram.com/shopping",
        "logo_url": "https://logo.clearbit.com/instagram.com",
        "description": "Shopping features on Instagram.",
    },
]

async def seed_datasources():
    print("Beginning datasource seeding...")
    # Create tables if they don't exist
    await init_db()
    
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    
    async with async_session() as session:
        for data in DATASOURCES:
            # Check if exists by slug
            statement = select(DataSource).where(DataSource.slug == data["slug"])
            results = await session.exec(statement)
            existing = results.first()
            
            # Ensure defaults for flags
            data.setdefault("is_common", False)
            data["is_implemented"] = False
            
            if existing:
                print(f"Updating {data['name']}...")
                for k, v in data.items():
                    setattr(existing, k, v)
                session.add(existing)
            else:
                print(f"Creating {data['name']}...")
                datasource = DataSource(**data)
                session.add(datasource)
        
        await session.commit()
    print("Datasource seeding completed successfully!")

if __name__ == "__main__":
    asyncio.run(seed_datasources())
