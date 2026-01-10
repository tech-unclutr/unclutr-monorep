import asyncio
import os
import sys
import urllib.request
import ssl
import shutil

# Add backend directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy.orm import sessionmaker
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from app.core.db import engine, init_db
from app.models.datasource import DataSource, DataSourceCategory

# Local session factory
async_session_maker = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

# Frontend public directory
FRONTEND_LOGOS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../frontend/public/logos'))

# Brandfetch API Client ID for high-quality logo fetching
BRANDFETCH_CLIENT_ID = "1id0mlmgxmrC1sPyh2v"

def download_and_get_local_path(slug: str, url: str, website_url: str = None) -> str:
    """
    Download high-quality logos with improved fallback hierarchy.
    Prefers SVG format, uses better APIs, and has manual curated sources.
    """
    # Ensure directory exists
    if not os.path.exists(FRONTEND_LOGOS_DIR):
        os.makedirs(FRONTEND_LOGOS_DIR)

    # Try SVG first, then PNG
    svg_filename = f"{slug}.svg"
    png_filename = f"{slug}.png"
    svg_filepath = os.path.join(FRONTEND_LOGOS_DIR, svg_filename)
    png_filepath = os.path.join(FRONTEND_LOGOS_DIR, png_filename)
    
    # Check if we already have a good quality logo (SVG or PNG > 5KB)
    if os.path.exists(svg_filepath) and os.path.getsize(svg_filepath) > 100:
        return f"/logos/{svg_filename}"
    if os.path.exists(png_filepath) and os.path.getsize(png_filepath) > 5000:  # 5KB minimum for quality
        return f"/logos/{png_filename}"
    
    print(f"Attempting download for {slug}...")
    
    # SSL context
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }

    # --- HELPER TO DOWNLOAD FALLBACKS LOCALLY ---
    def ensure_local_fallback(fallback_slug, fallback_url):
        fb_filename = f"{fallback_slug}.png"
        fb_path = os.path.join(FRONTEND_LOGOS_DIR, fb_filename)
        if not os.path.exists(fb_path) or os.path.getsize(fb_path) < 100:
            print(f"    -> Downloading fallback: {fallback_slug}...")
            try:
                req = urllib.request.Request(fallback_url, headers=headers)
                with urllib.request.urlopen(req, context=ctx, timeout=10) as response:
                    with open(fb_path, 'wb') as f:
                        f.write(response.read())
            except Exception as ex:
                print(f"    -> Failed to download fallback {fallback_slug}: {ex}")
                return None
        return f"/logos/{fb_filename}"

    # --- MANUAL CURATED SQUARE/ICON LOGOS (TRANSPARENT) ---
    # Prioritizing square icons over horizontal wordmarks for better UI fit
    manual_sources = {
        # Indian Marketplaces & Platforms (HD symbol-only icons - Brandfetch SVG)
        'amazon': 'https://upload.wikimedia.org/wikipedia/commons/4/4a/Amazon_icon.svg',
        'flipkart': 'https://cdn.simpleicons.org/flipkart/2874F0',
        'myntra': 'https://cdn.brandfetch.io/myntra.com/symbol.svg?c=1id0mlmgxmrC1sPyh2v',
        'meesho': 'https://www.google.com/s2/favicons?domain=supplier.meesho.com&sz=256',
        'nykaa': 'https://cdn.brandfetch.io/nykaa.com/symbol.svg?c=1id0mlmgxmrC1sPyh2v',
        'ajio': 'https://cdn.brandfetch.io/ajio.com/symbol.svg?c=1id0mlmgxmrC1sPyh2v',
        'jiomart': 'https://cdn.brandfetch.io/jiomart.com/symbol.svg?c=1id0mlmgxmrC1sPyh2v',
        'snapdeal': 'https://cdn.brandfetch.io/snapdeal.com/symbol.svg?c=1id0mlmgxmrC1sPyh2v',
        'pepperfry': 'https://cdn.brandfetch.io/pepperfry.com/symbol.svg?c=1id0mlmgxmrC1sPyh2v',
        'tata_1mg': 'https://cdn.brandfetch.io/1mg.com/symbol.svg?c=1id0mlmgxmrC1sPyh2v',
        'tata_cliq': 'https://cdn.brandfetch.io/tatacliq.com/symbol.svg?c=1id0mlmgxmrC1sPyh2v',
        'firstcry': 'https://cdn.brandfetch.io/firstcry.com/symbol.svg?c=1id0mlmgxmrC1sPyh2v',
        'pharmeasy': 'https://cdn.brandfetch.io/pharmeasy.in/symbol.svg?c=1id0mlmgxmrC1sPyh2v',
        
        # Payments (square icons)
        'razorpay': 'https://cdn.simpleicons.org/razorpay/0C2451',
        'phonepe_pg': 'https://cdn.simpleicons.org/phonepe/5F259F',
        'paytm_pg': 'https://cdn.simpleicons.org/paytm/00BAF2',
        'stripe': 'https://cdn.simpleicons.org/stripe/008CDD',
        'paypal': 'https://cdn.simpleicons.org/paypal/00457C',
        'cashfree': 'https://cdn.simpleicons.org/cashfree/0066FF',
        'payu': 'https://cdn.simpleicons.org/payu/00A82D',
        
        # Logistics (square icons where available)
        'shiprocket': 'https://cdn.simpleicons.org/shiprocket/FF6B00',
        'delhivery': 'https://cdn.simpleicons.org/delhivery/E31837',
        'blue_dart': 'https://www.google.com/s2/favicons?domain=bluedart.com&sz=256',
        
        # E-commerce Platforms (HD symbol-only icons - Brandfetch SVG)
        'shopify': 'https://cdn.simpleicons.org/shopify/7AB55C',
        'woocommerce': 'https://cdn.brandfetch.io/woocommerce.com/symbol.svg?c=1id0mlmgxmrC1sPyh2v',
        'wix': 'https://cdn.brandfetch.io/wix.com/symbol.svg?c=1id0mlmgxmrC1sPyh2v',
        'magento': 'https://cdn.simpleicons.org/magento/EE672F',
        'bigcommerce': 'https://cdn.brandfetch.io/bigcommerce.com/symbol.svg?c=1id0mlmgxmrC1sPyh2v',
        'webflow': 'https://cdn.simpleicons.org/webflow/4353FF',
        'squarespace': 'https://cdn.simpleicons.org/squarespace/000000',
        'mydukaan': 'https://cdn.brandfetch.io/mydukaan.io/symbol.svg?c=1id0mlmgxmrC1sPyh2v',
        'storehippo': 'https://cdn.brandfetch.io/storehippo.com/symbol.svg?c=1id0mlmgxmrC1sPyh2v',
        
        # Marketing & Ads (square icons)
        'meta_ads': 'https://cdn.simpleicons.org/meta/0668E1',
        'meta_pixel': 'https://cdn.simpleicons.org/meta/0668E1',
        'google_ads': 'https://cdn.simpleicons.org/googleads/4285F4',
        'google_analytics': 'https://cdn.simpleicons.org/googleanalytics/E37400',
        'amazon_ads': 'https://upload.wikimedia.org/wikipedia/commons/4/4a/Amazon_icon.svg',
        'x_ads': 'https://cdn.simpleicons.org/x/000000',
        'snap_ads': 'https://cdn.simpleicons.org/snapchat/FFFC00',
        'linkedin_ads': 'https://cdn.simpleicons.org/linkedin/0A66C2',
        'flipkart_ads': 'https://cdn.simpleicons.org/flipkart/2874F0',
        'myntra_ads': 'https://cdn.simpleicons.org/myntra/EE3E85',
        
        # Quick Commerce (HD symbol-only icons - Brandfetch SVG)
        'blinkit': 'https://cdn.brandfetch.io/blinkit.com/symbol.svg?c=1id0mlmgxmrC1sPyh2v',
        'zepto': 'https://cdn.brandfetch.io/zepto.in/symbol.svg?c=1id0mlmgxmrC1sPyh2v',
        'swiggy_instamart': 'https://cdn.brandfetch.io/swiggy.com/symbol.svg?c=1id0mlmgxmrC1sPyh2v',
        'bbnow': 'https://cdn.brandfetch.io/bigbasket.com/symbol.svg?c=1id0mlmgxmrC1sPyh2v',
        
        # WhatsApp & Communication (square icons)
        'whatsapp_business': 'https://cdn.simpleicons.org/whatsapp/25D366',
        'instagram_shopping': 'https://cdn.simpleicons.org/instagram/E4405F',
        'interakt': 'https://www.google.com/s2/favicons?domain=interakt.shop&sz=256',
        'wati': 'https://cdn.simpleicons.org/wati/25D366',
        'gupshup': 'https://www.google.com/s2/favicons?domain=gupshup.io&sz=256',
        
        # Analytics & Tools (square icons)
        'mixpanel': 'https://cdn.simpleicons.org/mixpanel/7856FF',
        'hotjar': 'https://cdn.simpleicons.org/hotjar/FD3A5C',
        'clevertap': 'https://cdn.simpleicons.org/clevertap/FF4F44',
        'moengage': 'https://cdn.simpleicons.org/moengage/FF5C5C',
        'hubspot': 'https://cdn.simpleicons.org/hubspot/FF7A59',
        'klaviyo': 'https://cdn.simpleicons.org/klaviyo/000000',
        'mailchimp': 'https://cdn.simpleicons.org/mailchimp/FFE01B',
        'sendgrid': 'https://cdn.simpleicons.org/sendgrid/1A82E2',
        'zendesk': 'https://cdn.simpleicons.org/zendesk/03363D',
        'freshdesk': 'https://cdn.simpleicons.org/freshdesk/00C9A7',
        'intercom': 'https://cdn.simpleicons.org/intercom/1F8DED',
        'webengage': 'https://www.google.com/s2/favicons?domain=webengage.com&sz=256',
        'netcore': 'https://www.google.com/s2/favicons?domain=netcorecloud.com&sz=256',
        'braze': 'https://cdn.simpleicons.org/braze/FF6F61',
    }
    
    # Build URL priority list
    urls_to_try = []
    
    # 1. Manual curated source (highest priority)
    if slug in manual_sources:
        urls_to_try.append(manual_sources[slug])
    
    # 2. Provided URL
    if url and url.startswith('http'):
        urls_to_try.append(url)
    
    # 3. Extract domain and try multiple APIs
    domain = None
    if website_url:
        try:
            domain = website_url.replace('https://', '').replace('http://', '').split('/')[0]
            
            # Brandfetch (prioritize square icon/symbol variants only - no wordmarks)
            # Icon variant (square logo, best for UI)
            urls_to_try.append(f"https://cdn.brandfetch.io/{domain}/icon?c={BRANDFETCH_CLIENT_ID}")
            # Symbol variant (alternative square symbolic logo)
            urls_to_try.append(f"https://cdn.brandfetch.io/{domain}/symbol?c={BRANDFETCH_CLIENT_ID}")
            # Note: Removed default variant to avoid horizontal wordmark logos
            
            # Clearbit (fallback after Brandfetch)
            urls_to_try.append(f"https://logo.clearbit.com/{domain}")
            
            # Google Favicon (256px - last resort)
            urls_to_try.append(f"https://www.google.com/s2/favicons?domain={domain}&sz=256")
            
        except:
            pass
    
    # Try downloading from each URL
    for target_url in urls_to_try:
        try:
            is_svg = target_url.endswith('.svg')
            target_filepath = svg_filepath if is_svg else png_filepath
            target_filename = svg_filename if is_svg else png_filename
            
            req = urllib.request.Request(target_url, headers=headers)
            with urllib.request.urlopen(req, context=ctx, timeout=10) as response:
                if response.status == 200:
                    data = response.read()
                    # For SVG, accept any size > 100 bytes
                    # For PNG, require at least 5KB for quality
                    min_size = 100 if is_svg else 5000
                    if len(data) > min_size:
                        with open(target_filepath, 'wb') as f:
                            f.write(data)
                        print(f"  -> Success from {target_url} ({len(data)} bytes)")
                        return f"/logos/{target_filename}"
                    else:
                        print(f"  -> File too small from {target_url}: {len(data)} bytes")
        except Exception as e:
            print(f"  -> Failed from {target_url}: {e}")
            continue

    print(f"  -> Could not download high-quality logo for {slug}, using fallback.")
    
    # --- CATEGORY-SPECIFIC FALLBACKS ---
    
    # Not Applicable options - use subtle, minimal icon
    if 'not_applicable' in slug:
        # Subtle dash/minus icon instead of loud X icon
        return ensure_local_fallback("not_applicable", "https://cdn-icons-png.flaticon.com/512/1828/1828906.png")
    
    # Bank Statements / CSV
    if slug == 'bank_statements':
        return ensure_local_fallback("file_icon", "https://cdn-icons-png.flaticon.com/512/2991/2991108.png")
    
    # COD Remittance / Reports
    if slug == 'cod_remittance':
        return ensure_local_fallback("report_icon", "https://cdn-icons-png.flaticon.com/512/2830/2830305.png")

    # Marketplace Settlements
    if slug == 'marketplace_settlements':
        return ensure_local_fallback("settlement_icon", "https://cdn-icons-png.flaticon.com/512/1584/1584808.png")

    # Return original URL if valid, otherwise generic
    return url if url and url.startswith('http') else "/logos/default.png"
 

async def seed_datasources():
    await init_db()
    datasources = [
        # --- 1. LOGISTICS & RETURNS ---
        {
            "name": "Shiprocket",
            "slug": "shiprocket",
            "category": DataSourceCategory.Logistics,
            "website_url": "https://www.shiprocket.in",
            "logo_url": "https://logo.clearbit.com/shiprocket.in",
            "is_common": True,
        },
        {
            "name": "NimbusPost",
            "slug": "nimbuspost",
            "category": DataSourceCategory.Logistics,
            "website_url": "https://nimbuspost.com",
            "is_common": False,
        },
        {
            "name": "Delhivery",
            "slug": "delhivery",
            "category": DataSourceCategory.Logistics,
            "website_url": "https://www.delhivery.com",
            "is_common": True,
        },
        {
            "name": "Return Prime",
            "slug": "return_prime",
            "category": DataSourceCategory.Logistics,
            "website_url": "https://returnprime.com",
            "is_common": False,
        },
        # Drawer
        {
            "name": "Pickrr",
            "slug": "pickrr",
            "category": DataSourceCategory.Logistics,
            "website_url": "https://www.pickrr.com",
            "is_common": False,
        },
        {
            "name": "iThink Logistics",
            "slug": "ithink_logistics",
            "category": DataSourceCategory.Logistics,
            "website_url": "https://ithinklogistics.com",
            "is_common": False,
        },
        {
            "name": "Shipyaari",
            "slug": "shipyaari",
            "category": DataSourceCategory.Logistics,
            "website_url": "https://shipyaari.com",
            "is_common": False,
        },
        {
            "name": "Shyplite",
            "slug": "shyplite",
            "category": DataSourceCategory.Logistics,
            "website_url": "https://shyplite.com",
            "logo_url": "https://shyplite.com/wp-content/themes/shyplite/assets/img/logo.png",
            "is_common": False,
        },
        {
            "name": "Vamaship",
            "slug": "vamaship",
            "category": DataSourceCategory.Logistics,
            "website_url": "https://www.vamaship.com",
            "is_common": False,
        },
        {
            "name": "Ecom Express",
            "slug": "ecom_express",
            "category": DataSourceCategory.Logistics,
            "website_url": "https://ecomexpress.in",
            "logo_url": "https://logo.clearbit.com/ecomexpress.in",
            "is_common": False,
        },
        {
            "name": "Xpressbees",
            "slug": "xpressbees",
            "category": DataSourceCategory.Logistics,
            "website_url": "https://www.xpressbees.com",
            "logo_url": "https://logo.clearbit.com/xpressbees.com",
            "is_common": False,
        },
        # ... (other updates) ...

        # --- 2. PAYMENTS ---
        # ...
        {
            "name": "Bank Statements",
            "slug": "bank_statements",
            "category": DataSourceCategory.Accounting,
            "website_url": None, 
            "logo_url": "https://ssl.gstatic.com/images/branding/product/1x/sheets_2020q4_48dp.png",
            "is_common": True,
        },
        # ...
        {
            "name": "Easebuzz",
            "slug": "easebuzz",
            "category": DataSourceCategory.Payment,
            "website_url": "https://easebuzz.in",
            "logo_url": "https://upload.wikimedia.org/wikipedia/commons/e/e5/Easebuzz_Logo.png", # Placeholder/Generic if unavailable, try this
            "is_common": False,
        },
        # ...
        {
            "name": "Flipkart Ads",
            "slug": "flipkart_ads",
            "category": DataSourceCategory.Marketing,
            "website_url": "https://advertising.flipkart.com",
            "logo_url": "https://upload.wikimedia.org/wikipedia/en/thumb/2/25/Flipkart_logo.svg/512px-Flipkart_logo.svg.png", # Using Flipkart logo
            "is_common": False,
        },
        {
            "name": "Myntra Ads",
            "slug": "myntra_ads",
            "category": DataSourceCategory.Marketing,
            "website_url": "https://partners.myntra.com",
            "logo_url": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/Myntra_Logo.png/512px-Myntra_Logo.png", # Using Myntra
            "is_common": False,
        },
         # ...
        {
            "name": "Chartered Accountant (CA)",
            "slug": "chartered_accountant",
            "category": DataSourceCategory.Accounting,
            "website_url": None,
            "logo_url": "https://upload.wikimedia.org/wikipedia/en/thumb/5/55/ICAI_Logo.svg/512px-ICAI_Logo.svg.png", # Official ICAI Logo
            "is_common": True,
        },
        {
            "name": "Marg ERP",
            "slug": "marg_erp",
            "category": DataSourceCategory.Accounting,
            "website_url": "https://margcompusoft.com",
            "logo_url": "https://margcompusoft.com/img/Marg-logo.png",
            "is_common": False,
        },
        {
            "name": "myBillBook",
            "slug": "mybillbook",
            "category": DataSourceCategory.Accounting,
            "website_url": "https://mybillbook.in",
            "logo_url": "https://play-lh.googleusercontent.com/yK5WnuPj-o1iM-uJ6XFq0G6xX8k_B5X6z5z5gX6v8v8v8v8v8v8v8v8v8v8v8v8v", # Google Play icon often reliable
            "is_common": False,
        },
        {
            "name": "DTDC",
            "slug": "dtdc",
            "category": DataSourceCategory.Logistics,
            "website_url": "https://www.dtdc.com",
            "logo_url": "https://www.dtdc.in/img/logo.png",
            "is_common": False,
        },
        {
            "name": "Blue Dart",
            "slug": "blue_dart",
            "category": DataSourceCategory.Logistics,
            "website_url": "https://www.bluedart.com",
            "logo_url": "https://upload.wikimedia.org/wikipedia/commons/1/1a/Blue_Dart_logo.svg",
            "is_common": True,
        },
        {
            "name": "Shadowfax",
            "slug": "shadowfax",
            "category": DataSourceCategory.Logistics,
            "website_url": "https://www.shadowfax.in",
            "is_common": False,
        },
        {
            "name": "India Post",
            "slug": "india_post",
            "category": DataSourceCategory.Logistics,
            "website_url": "https://www.indiapost.gov.in",
            "is_common": False,
        },
        {
            "name": "Gati",
            "slug": "gati",
            "category": DataSourceCategory.Logistics,
            "website_url": "https://www.gati.com",
            "logo_url": "https://upload.wikimedia.org/wikipedia/commons/4/4e/Gati_Limited_Logo.png",
            "is_common": False,
        },
        {
            "name": "ClickPost",
            "slug": "clickpost",
            "category": DataSourceCategory.Logistics,
            "website_url": "https://www.clickpost.ai",
            "is_common": False,
        },
        {
            "name": "AfterShip",
            "slug": "aftership",
            "category": DataSourceCategory.Logistics,
            "website_url": "https://www.aftership.com",
            "is_common": False,
        },
        {
            "name": "Eshopbox",
            "slug": "eshopbox",
            "category": DataSourceCategory.Logistics,
            "website_url": "https://www.eshopbox.com",
            "is_common": False,
        },
        {
            "name": "WareIQ",
            "slug": "wareiq",
            "category": DataSourceCategory.Logistics,
            "website_url": "https://wareiq.com",
            "is_common": False,
        },

        {
            "name": "AfterShip Returns",
            "slug": "aftership_returns",
            "category": DataSourceCategory.Logistics,
            "website_url": "https://www.aftership.com/returns",
            "is_common": False,
        },
        {
            "name": "Loop Returns",
            "slug": "loop_returns",
            "category": DataSourceCategory.Logistics,
            "website_url": "https://loopreturns.com",
            "is_common": False,
        },
        {
            "name": "Narvar",
            "slug": "narvar",
            "category": DataSourceCategory.Logistics,
            "website_url": "https://corp.narvar.com",
            "is_common": False,
        },
        {
            "name": "NDR Panels",
            "slug": "ndr_panels",
            "category": DataSourceCategory.Logistics,
            "is_common": False,
             # Using a generic data icon
            "logo_url": "https://cdn-icons-png.flaticon.com/512/2830/2830305.png" 
        },
        {
            "name": "Carrier NDR",
            "slug": "carrier_ndr",
            "category": DataSourceCategory.Logistics,
            "is_common": False,
            # Using a generic data icon
            "logo_url": "https://cdn-icons-png.flaticon.com/512/2830/2830305.png"
        },
        {
            "name": "Logistics - Not Applicable",
            "slug": "logistics_not_applicable",
            "category": DataSourceCategory.Logistics,
            "is_common": True,
        },

        # --- 2. PAYMENTS ---
        {
            "name": "Razorpay",
            "slug": "razorpay",
            "category": DataSourceCategory.Payment,
            "website_url": "https://razorpay.com",
            "is_common": True,
        },
        {
            "name": "Cashfree",
            "slug": "cashfree",
            "category": DataSourceCategory.Payment,
            "website_url": "https://www.cashfree.com",
            "is_common": True,
        },
        {
            "name": "Bank Statements",
            "slug": "bank_statements",
            "category": DataSourceCategory.Payment,
            "website_url": None, 
            "logo_url": "https://cdn-icons-png.flaticon.com/512/2991/2991108.png", # CSV/File icon
            "is_common": False,
        },
        {
            "name": "COD Reports",
            "slug": "cod_remittance",
            "category": DataSourceCategory.Payment,
            "website_url": None,
            "logo_url": "https://cdn-icons-png.flaticon.com/512/2830/2830305.png", # Report icon
            "is_common": False,
        },
        # Drawer
        {
            "name": "PayU",
            "slug": "payu",
            "category": DataSourceCategory.Payment,
            "website_url": "https://payu.in",
            "is_common": True,
        },
        {
            "name": "CCAvenue",
            "slug": "ccavenue",
            "category": DataSourceCategory.Payment,
            "website_url": "https://www.ccavenue.com",
            "is_common": True,
        },
        {
            "name": "PhonePe PG",
            "slug": "phonepe_pg",
            "category": DataSourceCategory.Payment,
            "website_url": "https://www.phonepe.com",
            "is_common": True,
        },
        {
            "name": "BillDesk",
            "slug": "billdesk",
            "category": DataSourceCategory.Payment,
            "website_url": "https://www.billdesk.com",
            "is_common": True,
        },
        {
            "name": "Paytm",
            "slug": "paytm_pg",
            "category": DataSourceCategory.Payment,
            "website_url": "https://paytm.com",
            "is_common": False,
        },
        {
            "name": "Easebuzz",
            "slug": "easebuzz",
            "category": DataSourceCategory.Payment,
            "website_url": "https://easebuzz.in",
            "logo_url": "https://logo.clearbit.com/easebuzz.in", 
            "is_common": False,
        },
        {
            "name": "Instamojo",
            "slug": "instamojo",
            "category": DataSourceCategory.Payment,
            "website_url": "https://www.instamojo.com",
            "is_common": False,
        },
        {
            "name": "Worldline",
            "slug": "worldline",
            "category": DataSourceCategory.Payment,
            "website_url": "https://worldline.com",
            "is_common": False,
        },
        {
            "name": "RazorpayX",
            "slug": "razorpayx",
            "category": DataSourceCategory.Payment,
            "website_url": "https://razorpay.com/x",
            "is_common": False,
        },
        {
            "name": "Cashfree Payouts",
            "slug": "cashfree_payouts",
            "category": DataSourceCategory.Payment,
            "website_url": "https://www.cashfree.com/payouts",
            "is_common": False,
        },
        {
            "name": "Marketplace Settlements",
            "slug": "marketplace_settlements",
            "category": DataSourceCategory.Payment,
            "logo_url": "https://cdn-icons-png.flaticon.com/512/1584/1584808.png",
            "is_common": False,
        },
        {
            "name": "Juspay",
            "slug": "juspay",
            "category": DataSourceCategory.Payment,
            "website_url": "https://juspay.in",
            "is_common": False,
        },
        {
            "name": "Stripe",
            "slug": "stripe",
            "category": DataSourceCategory.Payment,
            "website_url": "https://stripe.com",
            "is_common": False,
        },
        {
            "name": "PayPal",
            "slug": "paypal",
            "category": DataSourceCategory.Payment,
            "website_url": "https://www.paypal.com",
            "is_common": False,
        },
        {
            "name": "Simpl",
            "slug": "simpl",
            "category": DataSourceCategory.Payment,
            "website_url": "https://getsimpl.com",
            "is_common": False,
        },
        {
            "name": "LazyPay",
            "slug": "lazypay",
            "category": DataSourceCategory.Payment,
            "website_url": "https://lazypay.in",
            "is_common": False,
        },
        {
            "name": "Paytm Postpaid",
            "slug": "paytm_postpaid",
            "category": DataSourceCategory.Payment,
            "website_url": "https://paytm.com",
            "is_common": False,
        },
        {
            "name": "Payments - Not Applicable",
            "slug": "payment_not_applicable",
            "category": DataSourceCategory.Payment,
            "is_common": True,
        },

        # --- 3. MARKETING ---
        {
            "name": "Meta Ads",
            "slug": "meta_ads",
            "category": DataSourceCategory.Marketing,
            "website_url": "https://www.facebook.com/business/ads",
            "is_common": True,
        },
        {
            "name": "Google Ads",
            "slug": "google_ads",
            "category": DataSourceCategory.Marketing,
            "website_url": "https://ads.google.com",
            "is_common": True,
        },
        {
            "name": "Amazon Ads",
            "slug": "amazon_ads",
            "category": DataSourceCategory.Marketing,
            "website_url": "https://advertising.amazon.com",
            "is_common": True,
        },
        {
            "name": "Flipkart Ads",
            "slug": "flipkart_ads",
            "category": DataSourceCategory.Marketing,
            "website_url": "https://advertising.flipkart.com",
            "logo_url": "https://logo.clearbit.com/flipkart.com",
            "is_common": False,
        },
        # Drawer
        {
            "name": "Myntra Ads",
            "slug": "myntra_ads",
            "category": DataSourceCategory.Marketing,
            "website_url": "https://partners.myntra.com",
            "logo_url": "https://logo.clearbit.com/myntra.com",
            "is_common": False,
        },
        {
            "name": "Nykaa Ads",
            "slug": "nykaa_ads",
            "category": DataSourceCategory.Marketing,
             "website_url": "https://www.nykaa.com",
            "is_common": False,
        },
        {
            "name": "LinkedIn Ads",
            "slug": "linkedin_ads",
            "category": DataSourceCategory.Marketing,
            "website_url": "https://business.linkedin.com/marketing-solutions/ads",
            "is_common": False,
        },
        {
            "name": "X Ads",
            "slug": "x_ads",
            "category": DataSourceCategory.Marketing,
            "website_url": "https://ads.twitter.com",
            "is_common": False,
        },
        {
            "name": "Snap Ads",
            "slug": "snap_ads",
            "category": DataSourceCategory.Marketing,
             "website_url": "https://forbusiness.snapchat.com",
            "is_common": False,
        },
        {
            "name": "Marketing - Not Applicable",
            "slug": "marketing_not_applicable",
            "category": DataSourceCategory.Marketing,
            "is_common": True,
        },

        # --- 4. ANALYTICS ---
        {
            "name": "Google Analytics",
            "slug": "google_analytics",
            "category": DataSourceCategory.Analytics,
            "website_url": "https://analytics.google.com",
            "is_common": True,
        },
        {
            "name": "WebEngage",
            "slug": "webengage",
            "category": DataSourceCategory.Retention,
            "website_url": "https://webengage.com",
            "is_common": False,
        },
        {
            "name": "Interakt",
            "slug": "interakt",
            "category": DataSourceCategory.Communication,
            "website_url": "https://interakt.shop",
            "is_common": False,
        },
        {
            "name": "Freshdesk",
            "slug": "freshdesk",
            "category": DataSourceCategory.Communication,
            "website_url": "https://freshdesk.com",
            "is_common": False,
        },
        # Drawer - Analytics
        {
            "name": "GTM",
            "slug": "gtm",
            "category": DataSourceCategory.Analytics,
            "website_url": "https://tagmanager.google.com",
            "is_common": False,
        },
        {
            "name": "Google Search Console",
            "slug": "gsc",
            "category": DataSourceCategory.Analytics,
            "website_url": "https://search.google.com/search-console",
            "is_common": False,
        },
        {
            "name": "Meta Pixel",
            "slug": "meta_pixel",
            "category": DataSourceCategory.Analytics,
             "website_url": "https://www.facebook.com/business/help/742478679120153",
            "is_common": False,
        },
        {
            "name": "Microsoft Clarity",
            "slug": "clarity",
            "category": DataSourceCategory.Analytics,
            "website_url": "https://clarity.microsoft.com",
            "is_common": False,
        },
        {
            "name": "Hotjar",
            "slug": "hotjar",
            "category": DataSourceCategory.Analytics,
            "website_url": "https://hotjar.com",
            "is_common": False,
        },
        {
            "name": "Mixpanel",
            "slug": "mixpanel",
            "category": DataSourceCategory.Analytics,
            "website_url": "https://mixpanel.com",
            "is_common": True,
        },
        {
            "name": "VWO",
            "slug": "vwo",
            "category": DataSourceCategory.Analytics,
            "website_url": "https://vwo.com",
            "is_common": False,
        },
        {
            "name": "AppsFlyer",
            "slug": "appsflyer",
            "category": DataSourceCategory.Analytics,
            "website_url": "https://www.appsflyer.com",
            "is_common": False,
        },
        {
            "name": "Adjust",
            "slug": "adjust",
            "category": DataSourceCategory.Analytics,
            "website_url": "https://www.adjust.com",
            "is_common": False,
        },
        {
            "name": "Branch",
            "slug": "branch",
            "category": DataSourceCategory.Analytics,
            "website_url": "https://branch.io",
            "is_common": False,
        },

        # Drawer - Retention
        {
            "name": "MoEngage",
            "slug": "moengage",
            "category": DataSourceCategory.Retention,
            "website_url": "https://www.moengage.com",
            "is_common": True,
        },
        {
            "name": "CleverTap",
            "slug": "clevertap",
            "category": DataSourceCategory.Retention,
            "website_url": "https://clevertap.com",
            "is_common": True,
        },
        {
            "name": "Netcore",
            "slug": "netcore",
            "category": DataSourceCategory.Retention,
            "website_url": "https://netcorecloud.com",
            "is_common": False,
        },
        {
            "name": "Braze",
            "slug": "braze",
            "category": DataSourceCategory.Retention,
            "website_url": "https://www.braze.com",
            "is_common": False,
        },
        {
            "name": "HubSpot",
            "slug": "hubspot",
            "category": DataSourceCategory.Retention,
            "website_url": "https://www.hubspot.com",
            "is_common": False,
        },
        {
            "name": "Klaviyo",
            "slug": "klaviyo",
            "category": DataSourceCategory.Retention,
            "website_url": "https://www.klaviyo.com",
            "is_common": False,
        },
        {
            "name": "Mailchimp",
            "slug": "mailchimp",
            "category": DataSourceCategory.Retention,
            "website_url": "https://mailchimp.com",
            "is_common": False,
        },
        {
            "name": "SES",
            "slug": "ses",
            "category": DataSourceCategory.Retention,
            "website_url": "https://aws.amazon.com/ses",
            "is_common": False,
        },
        {
            "name": "SendGrid",
            "slug": "sendgrid",
            "category": DataSourceCategory.Retention,
            "website_url": "https://sendgrid.com",
            "is_common": False,
        },
        {
            "name": "Route Mobile",
            "slug": "route_mobile",
            "category": DataSourceCategory.Retention,
            "website_url": "https://routemobile.com",
            "is_common": False,
        },

        # Drawer - Communication
        {
            "name": "WATI",
            "slug": "wati",
            "category": DataSourceCategory.Communication,
            "website_url": "https://www.wati.io",
            "is_common": True,
        },
        {
            "name": "Gupshup",
            "slug": "gupshup",
            "category": DataSourceCategory.Communication,
            "website_url": "https://www.gupshup.io",
            "is_common": False,
        },
        {
            "name": "LimeChat",
            "slug": "limechat",
            "category": DataSourceCategory.Communication,
             "website_url": "https://www.limechat.ai",
            "is_common": False,
        },
        {
            "name": "Yellow.ai",
            "slug": "yellow_ai",
            "category": DataSourceCategory.Communication,
            "website_url": "https://yellow.ai",
            "is_common": False,
        },
        {
            "name": "Haptik",
            "slug": "haptik",
            "category": DataSourceCategory.Communication,
            "website_url": "https://haptik.ai",
            "is_common": False,
        },
        {
            "name": "Zendesk",
            "slug": "zendesk",
            "category": DataSourceCategory.Communication,
            "website_url": "https://www.zendesk.com",
            "is_common": False,
        },
        {
            "name": "Zoho Desk",
            "slug": "zoho_desk",
            "category": DataSourceCategory.Communication,
            "website_url": "https://www.zoho.com/desk",
            "is_common": False,
        },
        {
            "name": "Intercom",
            "slug": "intercom",
            "category": DataSourceCategory.Communication,
            "website_url": "https://www.intercom.com",
            "is_common": True,
        },
        {
            "name": "Gorgias",
            "slug": "gorgias",
            "category": DataSourceCategory.Communication,
            "website_url": "https://www.gorgias.com",
            "is_common": False,
        },
        {
            "name": "Not Applicable",
            "slug": "analytics_crm_not_applicable",
            "category": DataSourceCategory.Analytics,
            "is_common": True,
        },

        # --- 5. ACCOUNTING ---
        {
            "name": "TallyPrime",
            "slug": "tally",
            "category": DataSourceCategory.Accounting,
            "website_url": "https://tallysolutions.com",
            "is_common": True,
        },
        {
            "name": "Zoho Books",
            "slug": "zoho_books",
            "category": DataSourceCategory.Accounting,
            "website_url": "https://www.zoho.com/books",
            "is_common": True,
        },
        {
            "name": "ClearTax",
            "slug": "cleartax",
            "category": DataSourceCategory.Accounting,
            "website_url": "https://cleartax.in",
            "is_common": False,
        },
        {
            "name": "Chartered Accountant (CA)",
            "slug": "chartered_accountant",
            "category": DataSourceCategory.Accounting,
            "website_url": None,
            "logo_url": "https://upload.wikimedia.org/wikipedia/en/thumb/5/55/ICAI_Logo.svg/512px-ICAI_Logo.svg.png", # Official ICAI Logo
            "is_common": True,
        },
        # Drawer
        {
            "name": "Busy",
            "slug": "busy",
            "category": DataSourceCategory.Accounting,
            "website_url": "https://busy.in",
            "is_common": False,
        },
        {
            "name": "Marg ERP",
            "slug": "marg_erp",
            "category": DataSourceCategory.Accounting,
            "website_url": "https://margcompusoft.com",
            "logo_url": "https://logo.clearbit.com/margcompusoft.com",
            "is_common": False,
        },
        {
            "name": "Vyapar",
            "slug": "vyapar",
            "category": DataSourceCategory.Accounting,
            "website_url": "https://vyaparapp.in",
            "is_common": False,
        },
        {
            "name": "myBillBook",
            "slug": "mybillbook",
            "category": DataSourceCategory.Accounting,
            "website_url": "https://mybillbook.in",
            "logo_url": "https://logo.clearbit.com/mybillbook.in", 
            "is_common": False,
        },
        {
            "name": "Giddh",
            "slug": "giddh",
            "category": DataSourceCategory.Accounting,
            "website_url": "https://giddh.com",
            "is_common": False,
        },
        {
            "name": "Refrens",
            "slug": "refrens",
            "category": DataSourceCategory.Accounting,
            "website_url": "https://refrens.com",
            "is_common": False,
        },
        {
            "name": "RealBooks",
            "slug": "realbooks",
            "category": DataSourceCategory.Accounting,
            "website_url": "https://realbooks.in",
            "is_common": False,
        },
        {
            "name": "ProfitBooks",
            "slug": "profitbooks",
            "category": DataSourceCategory.Accounting,
            "website_url": "https://profitbooks.net",
            "is_common": False,
        },
        {
            "name": "SAP B1",
            "slug": "sap_b1",
            "category": DataSourceCategory.Accounting,
            "website_url": "https://www.sap.com",
            "is_common": False,
        },
        {
            "name": "Dynamics 365 BC",
            "slug": "dynamics_365",
            "category": DataSourceCategory.Accounting,
            "website_url": "https://dynamics.microsoft.com",
            "is_common": False,
        },
        {
            "name": "NetSuite",
            "slug": "netsuite",
            "category": DataSourceCategory.Accounting,
            "website_url": "https://www.netsuite.com",
            "is_common": False,
        },
        {
            "name": "Odoo",
            "slug": "odoo",
            "category": DataSourceCategory.Accounting,
            "website_url": "https://www.odoo.com",
            "is_common": False,
        },
        {
            "name": "Keka",
            "slug": "keka",
            "category": DataSourceCategory.Accounting,
             "website_url": "https://www.keka.com",
            "is_common": False,
        },
        {
            "name": "greytHR",
            "slug": "greythr",
            "category": DataSourceCategory.Accounting,
            "website_url": "https://www.greythr.com",
            "is_common": False,
        },
        {
            "name": "Zoho Payroll",
            "slug": "zoho_payroll",
            "category": DataSourceCategory.Accounting,
            "website_url": "https://www.zoho.com/payroll",
            "is_common": False,
        },
        {
            "name": "Accounting - Not Applicable",
            "slug": "accounting_not_applicable",
            "category": DataSourceCategory.Accounting,
            "is_common": True,
        },
        
        # --- PREVIOUS STEP 2 RE-SEED ---
        # Storefronts
        {
            "name": "Shopify",
            "slug": "shopify",
            "category": DataSourceCategory.Storefront,
            "website_url": "https://shopify.com",
            "is_common": True,
        },
        {
            "name": "WooCommerce",
            "slug": "woocommerce",
            "category": DataSourceCategory.Storefront,
            "website_url": "https://woocommerce.com",
            "is_common": True,
        },
        {
            "name": "Magento",
            "slug": "magento",
            "category": DataSourceCategory.Storefront,
             "website_url": "https://business.adobe.com/products/magento/magento-commerce.html",
             "logo_url": "https://upload.wikimedia.org/wikipedia/en/thumb/9/9e/Magento.svg/512px-Magento.svg.png",
            "is_common": False,
        },
        {
            "name": "Wix",
            "slug": "wix",
            "category": DataSourceCategory.Storefront,
             "website_url": "https://wix.com",
            "is_common": True,
        },
        # Marketplaces
         {
            "name": "Flipkart",
            "slug": "flipkart",
            "category": DataSourceCategory.Marketplace,
            "website_url": "https://www.flipkart.com",
            "logo_url": "https://logo.clearbit.com/flipkart.com",
            "is_common": True,
        },
        {
            "name": "Amazon",
            "slug": "amazon",
            "category": DataSourceCategory.Marketplace,
            "website_url": "https://sellercentral.amazon.in",
            "is_common": True,
        },
        {
            "name": "Meesho",
            "slug": "meesho",
            "category": DataSourceCategory.Marketplace,
             "website_url": "https://supplier.meesho.com",
            "is_common": True,
        },
        {
            "name": "Myntra",
            "slug": "myntra",
            "category": DataSourceCategory.Marketplace,
             "website_url": "https://partners.myntra.com",
            "is_common": True,
        },
        {
            "name": "AJIO",
            "slug": "ajio",
            "category": DataSourceCategory.Marketplace,
             "website_url": "https://supplier.ajio.com",
            "is_common": True,
        },
        {
            "name": "Nykaa",
            "slug": "nykaa",
            "category": DataSourceCategory.Marketplace,
             "website_url": "https://www.nykaa.com/sell-on-nykaa",
            "is_common": True,
        },
        {
            "name": "BigCommerce",
            "slug": "bigcommerce",
            "category": DataSourceCategory.Storefront,
            "website_url": "https://www.bigcommerce.com",
            "logo_url": "https://logo.clearbit.com/bigcommerce.com",
            "is_common": False,
        },
        {
            "name": "Dukaan",
            "slug": "mydukaan",
            "category": DataSourceCategory.Storefront,
            "website_url": "https://mydukaan.io",
            "logo_url": "https://logo.clearbit.com/mydukaan.io",
            "is_common": False,
        },
         {
            "name": "Ecwid",
            "slug": "ecwid",
            "category": DataSourceCategory.Storefront,
            "website_url": "https://www.ecwid.com",
            "logo_url": "https://logo.clearbit.com/ecwid.com",
            "is_common": False,
        },
        {
            "name": "Fynd Platform",
            "slug": "fynd",
            "category": DataSourceCategory.Storefront,
            "website_url": "https://platform.fynd.com",
            "logo_url": "https://logo.clearbit.com/fynd.com",
            "is_common": False,
        },
        {
            "name": "Squarespace Commerce",
            "slug": "squarespace",
            "category": DataSourceCategory.Storefront,
            "website_url": "https://www.squarespace.com",
            "logo_url": "https://logo.clearbit.com/squarespace.com",
            "is_common": False,
        },
        {
            "name": "StoreHippo",
            "slug": "storehippo",
            "category": DataSourceCategory.Storefront,
            "website_url": "https://www.storehippo.com",
            "logo_url": "https://logo.clearbit.com/storehippo.com",
            "is_common": False,
        },
        {
            "name": "Webflow eCommerce",
            "slug": "webflow",
            "category": DataSourceCategory.Storefront,
            "website_url": "https://webflow.com",
            "logo_url": "https://logo.clearbit.com/webflow.com",
            "is_common": False,
        },
        {
            "name": "Zoho Commerce",
            "slug": "zoho_commerce",
            "category": DataSourceCategory.Storefront,
            "website_url": "https://www.zoho.com/commerce",
            "logo_url": "https://logo.clearbit.com/zoho.com",
            "is_common": False,
        },
        {
            "name": "FirstCry",
            "slug": "firstcry",
            "category": DataSourceCategory.Marketplace,
            "website_url": "https://www.firstcry.com",
            "logo_url": "https://logo.clearbit.com/firstcry.com",
            "is_common": False,
        },
        {
            "name": "JioMart",
            "slug": "jiomart",
            "category": DataSourceCategory.Marketplace,
            "website_url": "https://www.jiomart.com",
            "logo_url": "https://logo.clearbit.com/jiomart.com",
            "is_common": False,
        },
        {
            "name": "Pepperfry",
            "slug": "pepperfry",
            "category": DataSourceCategory.Marketplace,
            "website_url": "https://www.pepperfry.com",
            "logo_url": "https://logo.clearbit.com/pepperfry.com",
            "is_common": False,
        },
        {
            "name": "PharmEasy",
            "slug": "pharmeasy",
            "category": DataSourceCategory.Marketplace,
            "website_url": "https://pharmeasy.in",
            "logo_url": "https://logo.clearbit.com/pharmeasy.in",
            "is_common": False,
        },
        {
            "name": "Snapdeal",
            "slug": "snapdeal",
            "category": DataSourceCategory.Marketplace,
            "website_url": "https://www.snapdeal.com",
            "logo_url": "https://logo.clearbit.com/snapdeal.com",
            "is_common": False,
        },
        {
            "name": "Tata 1mg",
            "slug": "tata_1mg",
            "category": DataSourceCategory.Marketplace,
            "website_url": "https://www.1mg.com",
            "logo_url": "https://logo.clearbit.com/1mg.com",
            "is_common": False,
        },
        {
            "name": "Tata CLiQ",
            "slug": "tata_cliq",
            "category": DataSourceCategory.Marketplace,
            "website_url": "https://www.tatacliq.com",
            "logo_url": "https://logo.clearbit.com/tatacliq.com",
            "is_common": False,
        },
        # Quick Commerce
        {
            "name": "Blinkit",
            "slug": "blinkit",
            "category": DataSourceCategory.QuickCommerce,
             "website_url": "https://blinkit.com/partner",
            "is_common": True,
        },
        {
            "name": "Zepto",
            "slug": "zepto",
            "category": DataSourceCategory.QuickCommerce,
             "website_url": "https://zeptonow.com",
            "is_common": True,
        },
        {
            "name": "Swiggy Instamart",
            "slug": "swiggy_instamart",
            "category": DataSourceCategory.QuickCommerce,
             "website_url": "https://partner.swiggy.com",
            "is_common": True,
        },
        {
            "name": "Big Basket BBNow",
            "slug": "bbnow",
            "category": DataSourceCategory.QuickCommerce,
            "website_url": "https://www.bigbasket.com/bbnow",
            "logo_url": "https://logo.clearbit.com/bigbasket.com",
            "is_common": True,
        },
        {
            "name": "Flipkart Minutes",
            "slug": "flipkart_minutes",
            "category": DataSourceCategory.QuickCommerce,
            "website_url": "https://www.flipkart.com",
            "logo_url": "https://logo.clearbit.com/flipkart.com",
            "is_common": True,
        },
        # Other Channels (Social, Network)
        {
            "name": "ONDC",
            "slug": "ondc",
            "category": DataSourceCategory.Network,
            "website_url": "https://ondc.org",
            "logo_url": "https://ondc.org/assets/theme/images/ondc_logo_v2.svg",
            "is_common": False,
        },
        {
            "name": "Instagram Shopping",
            "slug": "instagram_shopping",
            "category": DataSourceCategory.SocialCommerce,
            "website_url": "https://business.instagram.com/shopping",
            "logo_url": "https://logo.clearbit.com/instagram.com",
            "is_common": False,
        },
        {
            "name": "WhatsApp Business",
            "slug": "whatsapp_business",
            "category": DataSourceCategory.SocialCommerce,
            "website_url": "https://business.whatsapp.com",
            "logo_url": "https://logo.clearbit.com/whatsapp.com",
            "is_common": False,
        },
    ]

    async with async_session_maker() as session:
        print("Seeding datasources with refined logos and N/A...")
        for ds_data in datasources:
            slug = ds_data["slug"]
            logo_url = ds_data.get("logo_url")
            website_url = ds_data.get("website_url")
            
            # Download if possible
            local_path = download_and_get_local_path(slug, logo_url, website_url)
            if local_path:
                ds_data["logo_url"] = local_path
            
            # Check existing
            statement = select(DataSource).where(DataSource.slug == slug)
            result = await session.exec(statement)
            existing = result.first()
            
            if not existing:
                # Check by name to avoid unique constraint error
                statement_name = select(DataSource).where(DataSource.name == ds_data["name"])
                result_name = await session.exec(statement_name)
                existing = result_name.first()

            if existing:
                print(f"Updating {ds_data['name']}...")
                for key, value in ds_data.items():
                    setattr(existing, key, value)
                session.add(existing)
            else:
                print(f"Creating {ds_data['name']}...")
                new_ds = DataSource(**ds_data)
                session.add(new_ds)
        
        await session.commit()
        print("Datasource seeding (with logos) completed successfully!")

if __name__ == "__main__":
    asyncio.run(seed_datasources())
