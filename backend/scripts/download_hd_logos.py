#!/usr/bin/env python3
import urllib.request, ssl, os

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE
headers = {'User-Agent': 'Mozilla/5.0'}

# HD logo sources from official/reliable sources
LOGOS = {
    'wix': 'https://worldvectorlogo.com/download/wix-1.svg',
    'woocommerce': 'https://worldvectorlogo.com/download/woocommerce.svg',
    'bigcommerce': 'https://worldvectorlogo.com/download/bigcommerce.svg',
    'mydukaan': 'https://play-lh.googleusercontent.com/QRRfJKl-YqPl7RqEYqPl7RqEYqPl7RqEYqPl7RqEYqPl7RqEYqPl7RqEYqPl7RqEYqPl7RqE',
    'storehippo': 'https://www.storehippo.com/assets/img/logo.svg',
    'ajio': 'https://www.ajio.com/medias/sys_master/root/ajio/static/Ajio-Logo.svg',
    'myntra': 'https://constant.myntassets.com/pwa/assets/img/icon.png',
    'nykaa': 'https://images-static.nykaa.com/nykaa-logo.svg',
    'jiomart': 'https://www.jiomart.com/assets/ds2web/jds-icons/jiomart-logo-icon.svg',
    'pepperfry': 'https://ii1.pepperfry.com/assets/pf-logo.svg',
    'snapdeal': 'https://i1.sdlcdn.com/img/snapdeal-logo.svg',
    'tata_1mg': 'https://www.1mg.com/images/tata_1mg_logo.svg',
    'tata_cliq': 'https://www.tatacliq.com/src/general/components/img/tatacliq-logo.svg',
    'firstcry': 'https://cdn.fcglcdn.com/brainbees/images/n/fc_logo.svg',
    'pharmeasy': 'https://assets.pharmeasy.in/web-assets/dist/fca22bc9.svg',
    'zepto': 'https://cdn.zeptonow.com/app/images/logo.svg',
    'blinkit': 'https://cdn.grofers.com/cdn-cgi/image/f=auto,fit=scale-down,q=70,metadata=none,w=360/assets/eta-icons/blinkit_logo.png',
    'swiggy_instamart': 'https://media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto/portal/m/seo_web/Swiggy_Logo.png',
    'bbnow': 'https://www.bigbasket.com/media/uploads/flatpages/images/bb_logo.svg',
}

for slug, url in LOGOS.items():
    ext = '.svg' if url.endswith('.svg') else '.png'
    path = f'../frontend/public/logos/{slug}{ext}'
    print(f'{slug:20s}...', end=' ', flush=True)
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, context=ctx, timeout=15) as r:
            data = r.read()
            if len(data) > 1000:
                with open(path, 'wb') as f:
                    f.write(data)
                print(f'✓ {len(data):,} bytes')
            else:
                print(f'✗ too small')
    except Exception as e:
        print(f'✗ {e}')
