export const MOCK_USER_PROFILE = {
    id: "user_123",
    email: "founder@acmebeauty.com",
    full_name: "Sarah Chen",
    // Using a cool, high-quality professional avatar from Unsplash
    picture_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop",
    role: "Owner" as const,
    joined_at: "2024-01-15T10:00:00Z"
};

export const MOCK_COMPANY_SETTINGS = {
    id: "comp_456",
    name: "Acme Beauty Co.",
    legal_name: "Acme Beauty Private Limited", // New field
    tagline: "Clean beauty for modern living", // New field
    founded_year: "2019", // New field
    website: "https://acmebeauty.com",
    industry: "Skincare", // Changed from generic Fashion
    currency: "INR",
    timezone: "Asia/Kolkata",
    // Using a clean, modern brand logo placeholder
    logo_url: "https://ui-avatars.com/api/?name=Acme+Beauty&background=FFD1BA&color=E85D04&size=200&font-size=0.33&length=1&rounded=true&bold=true",
    support_email: "support@acmebeauty.com",
    phone: "+91 98765 43210", // New field
    support_hours: "Mon-Fri, 10am-6pm IST", // New field
    hq_city: "Mumbai", // New field
    tax_id: "27ABCDE1234F1Z5",
    tags: ["Clean Beauty", "Vegan", "Sustainable"], // New field
    presence_links: [ // New field
        { id: "1", label: "Website", url: "https://acmebeauty.com", type: "website" },
        { id: "2", label: "Instagram", url: "https://instagram.com/acmebeauty", type: "instagram" },
        { id: "3", label: "Amazon", url: "https://amazon.in/acmebeauty", type: "amazon" },
        { id: "4", label: "Nykaa", url: "https://nykaa.com/brands/acmebeauty", type: "nykaa" }
    ],
    onboarding_data: {
        companyName: "Acme Beauty Private Limited",
        brandName: "Acme Beauty Co.",
        category: "Beauty & Personal Care",
        region: {
            country: "India",
            currency: "INR",
            timezone: "Asia/Kolkata"
        },
        channels: {
            d2c: ["Shopify"],
            marketplaces: ["Amazon", "Flipkart"],
            qcom: ["Blinkit", "Zepto"],
            others: ["Offline Retail"]
        },
        stack: {
            orders: ["Unicommerce"],
            payments: ["Razorpay"],
            shipping: ["Shiprocket"],
            payouts: [],
            marketing: ["Klaviyo", "Meta Ads"],
            analytics: ["Google Analytics 4"],
            finance: ["Tally Prime"]
        }
    }
};

export const MOCK_MEMBERS = [
    {
        id: "mem_1",
        full_name: "Sarah Chen",
        email: "founder@acmebeauty.com",
        role: "Admin", // Owner is an Admin effectively
        status: "Active",
        picture_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=100&auto=format&fit=crop"
    },
    {
        id: "mem_2",
        full_name: "Priya Sharma",
        email: "priya@acmebeauty.com",
        role: "Analyst",
        status: "Active",
        picture_url: "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?q=80&w=100&auto=format&fit=crop"
    },
    {
        id: "mem_3",
        full_name: "Rohan Gupta",
        email: "rohan@acmebeauty.com",
        role: "Viewer",
        status: "Invited",
        picture_url: null // Should test fallback to initials
    }
];
