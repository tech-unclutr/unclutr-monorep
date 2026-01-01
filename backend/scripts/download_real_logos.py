#!/usr/bin/env python3
"""
Download real company logos from working sources.
Brandfetch API is returning placeholders, so using alternative sources.
"""

import urllib.request
import ssl
import os

# Disable SSL verification for development
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
}

# Working logo sources - manually curated
LOGO_SOURCES = {
    # E-commerce Platforms - using official sources or Wikipedia
    'wix': 'https://upload.wikimedia.org/wikipedia/commons/f/ff/Wix.com_website_logo.svg',
    'woocommerce': 'https://upload.wikimedia.org/wikipedia/commons/e/e2/WooCommerce_logo.svg',
    'bigcommerce': 'https://upload.wikimedia.org/wikipedia/commons/6/6a/BigCommerce_logo.svg',
    'mydukaan': 'https://www.google.com/s2/favicons?domain=mydukaan.io&sz=256',
    'storehippo': 'https://www.google.com/s2/favicons?domain=www.storehippo.com&sz=256',
    
    # Indian Marketplaces - using official sources
    'ajio': 'https://www.google.com/s2/favicons?domain=www.ajio.com&sz=256',
    'myntra': 'https://upload.wikimedia.org/wikipedia/commons/d/d5/Myntra_logo.png',
    'nykaa': 'https://www.google.com/s2/favicons?domain=www.nykaa.com&sz=256',
    'jiomart': 'https://www.google.com/s2/favicons?domain=www.jiomart.com&sz=256',
    'pepperfry': 'https://www.google.com/s2/favicons?domain=www.pepperfry.com&sz=256',
    'snapdeal': 'https://upload.wikimedia.org/wikipedia/commons/8/80/Snapdeal_Logo.svg',
    'tata_1mg': 'https://www.google.com/s2/favicons?domain=www.1mg.com&sz=256',
    'tata_cliq': 'https://www.google.com/s2/favicons?domain=www.tatacliq.com&sz=256',
    'firstcry': 'https://www.google.com/s2/favicons?domain=www.firstcry.com&sz=256',
    'pharmeasy': 'https://www.google.com/s2/favicons?domain=pharmeasy.in&sz=256',
    
    # Quick Commerce
    'zepto': 'https://www.google.com/s2/favicons?domain=zeptonow.com&sz=256',
    'blinkit': 'https://www.google.com/s2/favicons?domain=blinkit.com&sz=256',
    'swiggy_instamart': 'https://upload.wikimedia.org/wikipedia/en/1/12/Swiggy_logo.svg',
    'bbnow': 'https://www.google.com/s2/favicons?domain=www.bigbasket.com&sz=256',
}

def download_logo(slug, url, output_dir='../frontend/public/logos'):
    """Download a logo and save it."""
    # Determine extension from URL
    ext = '.svg' if url.endswith('.svg') else '.png'
    output_path = os.path.join(output_dir, f'{slug}{ext}')
    
    print(f'{slug:20s} ... ', end='', flush=True)
    
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, context=ctx, timeout=15) as response:
            data = response.read()
            
            # Verify it's not HTML
            if data[:15].lower().startswith(b'<!doctype html') or data[:5].lower().startswith(b'<html'):
                print(f'✗ Got HTML instead of image')
                return False
            
            # Save the file
            with open(output_path, 'wb') as f:
                f.write(data)
            
            print(f'✓ {len(data):,} bytes -> {slug}{ext}')
            return True
            
    except Exception as e:
        print(f'✗ {e}')
        return False

if __name__ == '__main__':
    print('Downloading real company logos from working sources...')
    print('=' * 70)
    
    success_count = 0
    for slug, url in LOGO_SOURCES.items():
        if download_logo(slug, url):
            success_count += 1
    
    print('=' * 70)
    print(f'✓ Successfully downloaded {success_count}/{len(LOGO_SOURCES)} logos')
