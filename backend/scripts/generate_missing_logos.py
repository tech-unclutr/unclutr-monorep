"""
Script to generate simple placeholder logos for missing datasources.
Creates colored square icons with the first letter of each datasource.
"""
import os
from PIL import Image, ImageDraw, ImageFont
import colorsys

# Frontend logos directory
FRONTEND_LOGOS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../frontend/public/logos'))

# Ensure directory exists
if not os.path.exists(FRONTEND_LOGOS_DIR):
    os.makedirs(FRONTEND_LOGOS_DIR)

def generate_color_from_name(name):
    """Generate a consistent color based on the name."""
    # Use hash to get consistent color
    hash_val = hash(name) % 360
    # Use HSL to get pleasant colors
    h = hash_val / 360.0
    s = 0.65  # Saturation
    l = 0.55  # Lightness
    
    r, g, b = colorsys.hls_to_rgb(h, l, s)
    return (int(r * 255), int(g * 255), int(b * 255))

def create_logo(name, slug, size=512):
    """Create a simple logo with the first letter on a colored background."""
    # Create image
    img = Image.new('RGB', (size, size), 'white')
    draw = ImageDraw.Draw(img)
    
    # Get color
    color = generate_color_from_name(name)
    
    # Draw rounded rectangle background
    draw.rounded_rectangle([(0, 0), (size, size)], radius=size//8, fill=color)
    
    # Get first letter
    letter = name[0].upper()
    
    # Try to use a nice font, fallback to default
    try:
        font_size = size // 2
        font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", font_size)
    except:
        font = ImageFont.load_default()
    
    # Draw text
    bbox = draw.textbbox((0, 0), letter, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    
    x = (size - text_width) // 2
    y = (size - text_height) // 2 - bbox[1]
    
    draw.text((x, y), letter, fill='white', font=font)
    
    # Save
    filepath = os.path.join(FRONTEND_LOGOS_DIR, f'{slug}.png')
    img.save(filepath, 'PNG')
    print(f'Created logo for {name} -> {slug}.png')
    return filepath

# List of datasources that need logos
missing_logos = [
    ('Wix', 'wix'),
    ('Myntra', 'myntra'),
    ('AJIO', 'ajio'),
    ('Blinkit', 'blinkit'),
    ('Zepto', 'zepto'),
    ('Pickrr', 'pickrr'),
    ('Delhivery', 'delhivery'),
    ('Shadowfax', 'shadowfax'),
    ('ClickPost', 'clickpost'),
    ('AfterShip', 'aftership'),
    ('PayU', 'payu'),
    ('CCAvenue', 'ccavenue'),
    ('BillDesk', 'billdesk'),
    ('RazorpayX', 'razorpayx'),
    ('GTM', 'gtm'),
    ('WATI', 'wati'),
    ('Zoho Books', 'zoho_books'),
    ('Vamaship', 'vamaship'),
    ('India Post', 'india_post'),
    ('Eshopbox', 'eshopbox'),
    ('Shiprocket Fulfillment', 'shiprocket_fulfillment'),
    ('Delhivery Fulfillment', 'delhivery_fulfillment'),
    ('AfterShip Returns', 'aftership_returns'),
    ('Loop Returns', 'loop_returns'),
    ('Juspay', 'juspay'),
    ('LazyPay', 'lazypay'),
    ('Paytm Postpaid', 'paytm_postpaid'),
    ('Hotjar', 'hotjar'),
    ('Adjust', 'adjust'),
    ('Branch', 'branch'),
    ('Netcore', 'netcore'),
    ('Mailchimp', 'mailchimp'),
    ('SES', 'ses'),
    ('SendGrid', 'sendgrid'),
    ('Route Mobile', 'route_mobile'),
    ('Yellow.ai', 'yellow_ai'),
    ('Haptik', 'haptik'),
    ('Zoho Desk', 'zoho_desk'),
    ('Intercom', 'intercom'),
    ('Gorgias', 'gorgias'),
    ('Busy', 'busy'),
    ('Giddh', 'giddh'),
    ('Refrens', 'refrens'),
    ('RealBooks', 'realbooks'),
    ('ProfitBooks', 'profitbooks'),
    ('SAP B1', 'sap_b1'),
    ('Dynamics 365 BC', 'dynamics_365'),
    ('NetSuite', 'netsuite'),
    ('Odoo', 'odoo'),
    ('Keka', 'keka'),
    ('greytHR', 'greythr'),
    ('Zoho Payroll', 'zoho_payroll'),
    ('Mixpanel', 'mixpanel'),
    ('Default', 'default'),  # Generic fallback
]

if __name__ == '__main__':
    print(f'Generating {len(missing_logos)} logos...')
    for name, slug in missing_logos:
        create_logo(name, slug)
    print(f'\n✅ All logos generated in {FRONTEND_LOGOS_DIR}')
