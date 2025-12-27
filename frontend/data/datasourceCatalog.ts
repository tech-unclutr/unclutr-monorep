export type DataSourceCategory =
    | 'selling_channel_d2c'
    | 'selling_channel_marketplace'
    | 'selling_channel_qcom'
    | 'stack_orders'
    | 'stack_payments'
    | 'stack_shipping'
    | 'stack_payouts'
    | 'accounting_tools';

export interface DataSource {
    id: string;
    displayName: string;
    type: 'integration' | 'pseudo';
    categories: DataSourceCategory[];
    popularityRankIndia: number;
    aliases: string[];
    logoUrl: string;
    isActive: boolean;
}

export const datasourceCatalog: DataSource[] = [
    // Selling Channels - D2C
    {
        id: 'shopify',
        displayName: 'Shopify',
        type: 'integration',
        categories: ['selling_channel_d2c', 'stack_orders'],
        popularityRankIndia: 1,
        aliases: ['shopify store', 'ecommerce'],
        logoUrl: 'https://cdn.worldvectorlogo.com/logos/shopify.svg',
        isActive: true,
    },
    {
        id: 'woocommerce',
        displayName: 'WooCommerce',
        type: 'integration',
        categories: ['selling_channel_d2c', 'stack_orders'],
        popularityRankIndia: 3,
        aliases: ['woo', 'wp'],
        logoUrl: 'https://cdn.worldvectorlogo.com/logos/woocommerce.svg',
        isActive: true,
    },
    {
        id: 'magento',
        displayName: 'Magento',
        type: 'integration',
        categories: ['selling_channel_d2c', 'stack_orders'],
        popularityRankIndia: 10,
        aliases: ['adobe commerce'],
        logoUrl: 'https://cdn.worldvectorlogo.com/logos/magento-2.svg',
        isActive: true,
    },

    // Marketplaces
    {
        id: 'amazon',
        displayName: 'Amazon',
        type: 'integration',
        categories: ['selling_channel_marketplace', 'stack_orders'],
        popularityRankIndia: 1,
        aliases: ['amazon india', 'seller central'],
        logoUrl: 'https://cdn.worldvectorlogo.com/logos/amazon-icon-1.svg',
        isActive: true,
    },
    {
        id: 'flipkart',
        displayName: 'Flipkart',
        type: 'integration',
        categories: ['selling_channel_marketplace', 'stack_orders'],
        popularityRankIndia: 2,
        aliases: ['flipkart seller'],
        logoUrl: 'https://seeklogo.com/images/F/flipkart-logo-3F33927DAA-seeklogo.com.png',
        isActive: true,
    },
    {
        id: 'myntra',
        displayName: 'Myntra',
        type: 'integration',
        categories: ['selling_channel_marketplace'],
        popularityRankIndia: 5,
        aliases: [],
        logoUrl: 'https://www.vectorlogo.zone/logos/myntra/myntra-icon.svg',
        isActive: true,
    },

    // Q-Commerce
    {
        id: 'blinkit',
        displayName: 'Blinkit',
        type: 'integration',
        categories: ['selling_channel_qcom'],
        popularityRankIndia: 1,
        aliases: ['grofers'],
        logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Blinkit-yellow-app-icon.svg',
        isActive: true,
    },
    {
        id: 'zepto',
        displayName: 'Zepto',
        type: 'integration',
        categories: ['selling_channel_qcom'],
        popularityRankIndia: 2,
        aliases: [],
        logoUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/7/7d/Zepto_Logo.png/220px-Zepto_Logo.png',
        isActive: true,
    },
    {
        id: 'swiggy_instamart',
        displayName: 'Swiggy Instamart',
        type: 'integration',
        categories: ['selling_channel_qcom'],
        popularityRankIndia: 3,
        aliases: ['swiggy'],
        logoUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/1/12/Swiggy_logo.svg/1200px-Swiggy_logo.svg.png',
        isActive: true,
    },

    // Payments
    {
        id: 'razorpay',
        displayName: 'Razorpay',
        type: 'integration',
        categories: ['stack_payments'],
        popularityRankIndia: 1,
        aliases: ['rzp'],
        logoUrl: 'https://cdn.worldvectorlogo.com/logos/razorpay.svg',
        isActive: true,
    },
    {
        id: 'cashfree',
        displayName: 'Cashfree',
        type: 'integration',
        categories: ['stack_payments'],
        popularityRankIndia: 2,
        aliases: [],
        logoUrl: 'https://www.cashfree.com/wp-content/uploads/2021/08/Cashfree-Logo.png',
        isActive: true,
    },
    {
        id: 'stripe',
        displayName: 'Stripe',
        type: 'integration',
        categories: ['stack_payments'],
        popularityRankIndia: 5,
        aliases: [],
        logoUrl: 'https://cdn.worldvectorlogo.com/logos/stripe-4.svg',
        isActive: true,
    },

    // Shipping
    {
        id: 'shiprocket',
        displayName: 'Shiprocket',
        type: 'integration',
        categories: ['stack_shipping'],
        popularityRankIndia: 1,
        aliases: [],
        logoUrl: 'https://www.shiprocket.in/wp-content/uploads/2019/07/sr-logo-new.png',
        isActive: true,
    },
    {
        id: 'delhivery',
        displayName: 'Delhivery',
        type: 'integration',
        categories: ['stack_shipping'],
        popularityRankIndia: 2,
        aliases: [],
        logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/b/b5/Delhivery_Logo.png',
        isActive: true,
    },

    // Accounting
    {
        id: 'tally',
        displayName: 'Tally',
        type: 'integration',
        categories: ['accounting_tools'],
        popularityRankIndia: 1,
        aliases: ['tally prime', 'tally erp'],
        logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/e9/Tally_Logo.png',
        isActive: true,
    },
    {
        id: 'zoho_books',
        displayName: 'Zoho Books',
        type: 'integration',
        categories: ['accounting_tools'],
        popularityRankIndia: 2,
        aliases: ['zoho'],
        logoUrl: 'https://www.vectorlogo.zone/logos/zoho/zoho-icon.svg',
        isActive: true,
    },

    // Payouts
    {
        id: 'bank_transfer',
        displayName: 'Bank Transfer',
        type: 'integration',
        categories: ['stack_payouts'],
        popularityRankIndia: 1,
        aliases: ['neft', 'rtgs', 'imps'],
        logoUrl: 'https://cdn.worldvectorlogo.com/logos/bank-transfer.svg',
        isActive: true,
    },

    // Pseudo Options
    {
        id: 'excel_csv',
        displayName: 'Excel/CSV',
        type: 'pseudo',
        categories: [
            'selling_channel_d2c', 'selling_channel_marketplace', 'selling_channel_qcom',
            'stack_orders', 'stack_payments', 'stack_shipping', 'stack_payouts', 'accounting_tools'
        ],
        popularityRankIndia: 0,
        aliases: ['csv', 'excel', 'spreadsheet'],
        logoUrl: 'https://cdn.worldvectorlogo.com/logos/excel-4.svg',
        isActive: true,
    },
    {
        id: 'not_sure',
        displayName: 'Not sure',
        type: 'pseudo',
        categories: [
            'selling_channel_d2c', 'selling_channel_marketplace', 'selling_channel_qcom',
            'stack_orders', 'stack_payments', 'stack_shipping', 'stack_payouts', 'accounting_tools'
        ],
        popularityRankIndia: 100,
        aliases: ['idk', 'help'],
        logoUrl: '',
        isActive: true,
    },
];
