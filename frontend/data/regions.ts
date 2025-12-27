
export interface RegionData {
    country: string;
    code: string;
    currency: string;
    currencySymbol: string;
    timezone: string;
    flag: string; // Emoji flag
}

export const regions: RegionData[] = [
    // Top Priority Countries
    { country: "India", code: "IN", currency: "INR", currencySymbol: "₹", timezone: "Asia/Kolkata", flag: "🇮🇳" },
    { country: "United States", code: "US", currency: "USD", currencySymbol: "$", timezone: "America/New_York", flag: "🇺🇸" },
    { country: "United Kingdom", code: "GB", currency: "GBP", currencySymbol: "£", timezone: "Europe/London", flag: "🇬🇧" },
    { country: "Canada", code: "CA", currency: "CAD", currencySymbol: "$", timezone: "America/Toronto", flag: "🇨🇦" },
    { country: "Australia", code: "AU", currency: "AUD", currencySymbol: "$", timezone: "Australia/Sydney", flag: "🇦🇺" },
    { country: "United Arab Emirates", code: "AE", currency: "AED", currencySymbol: "dh", timezone: "Asia/Dubai", flag: "🇦🇪" },
    { country: "Singapore", code: "SG", currency: "SGD", currencySymbol: "$", timezone: "Asia/Singapore", flag: "🇸🇬" },
    { country: "Germany", code: "DE", currency: "EUR", currencySymbol: "€", timezone: "Europe/Berlin", flag: "🇩🇪" },
    { country: "France", code: "FR", currency: "EUR", currencySymbol: "€", timezone: "Europe/Paris", flag: "🇫🇷" },

    // Other Common Markets
    { country: "Japan", code: "JP", currency: "JPY", currencySymbol: "¥", timezone: "Asia/Tokyo", flag: "🇯🇵" },
    { country: "Brazil", code: "BR", currency: "BRL", currencySymbol: "R$", timezone: "America/Sao_Paulo", flag: "🇧🇷" },
    { country: "Mexico", code: "MX", currency: "MXN", currencySymbol: "$", timezone: "America/Mexico_City", flag: "🇲🇽" },
    { country: "China", code: "CN", currency: "CNY", currencySymbol: "¥", timezone: "Asia/Shanghai", flag: "🇨🇳" },
    { country: "Netherlands", code: "NL", currency: "EUR", currencySymbol: "€", timezone: "Europe/Amsterdam", flag: "🇳🇱" },
    { country: "Sweden", code: "SE", currency: "SEK", currencySymbol: "kr", timezone: "Europe/Stockholm", flag: "🇸🇪" },
    { country: "Saudi Arabia", code: "SA", currency: "SAR", currencySymbol: "﷼", timezone: "Asia/Riyadh", flag: "🇸🇦" },
    { country: "South Africa", code: "ZA", currency: "ZAR", currencySymbol: "R", timezone: "Africa/Johannesburg", flag: "🇿🇦" },
    { country: "Indonesia", code: "ID", currency: "IDR", currencySymbol: "Rp", timezone: "Asia/Jakarta", flag: "🇮🇩" },
    { country: "Vietnam", code: "VN", currency: "VND", currencySymbol: "₫", timezone: "Asia/Ho_Chi_Minh", flag: "🇻🇳" },
    { country: "Thailand", code: "TH", currency: "THB", currencySymbol: "฿", timezone: "Asia/Bangkok", flag: "🇹🇭" },
    { country: "Bangladesh", code: "BD", currency: "BDT", currencySymbol: "৳", timezone: "Asia/Dhaka", flag: "🇧🇩" },
    { country: "Pakistan", code: "PK", currency: "PKR", currencySymbol: "₨", timezone: "Asia/Karachi", flag: "🇵🇰" },
    { country: "Sri Lanka", code: "LK", currency: "LKR", currencySymbol: "Rs", timezone: "Asia/Colombo", flag: "🇱🇰" },
    { country: "Malaysia", code: "MY", currency: "MYR", currencySymbol: "RM", timezone: "Asia/Kuala_Lumpur", flag: "🇲🇾" },
    { country: "Philippines", code: "PH", currency: "PHP", currencySymbol: "₱", timezone: "Asia/Manila", flag: "🇵🇭" },
    { country: "New Zealand", code: "NZ", currency: "NZD", currencySymbol: "$", timezone: "Pacific/Auckland", flag: "🇳🇿" },
    { country: "Italy", code: "IT", currency: "EUR", currencySymbol: "€", timezone: "Europe/Rome", flag: "🇮🇹" },
    { country: "Spain", code: "ES", currency: "EUR", currencySymbol: "€", timezone: "Europe/Madrid", flag: "🇪🇸" },
    { country: "Switzerland", code: "CH", currency: "CHF", currencySymbol: "Fr", timezone: "Europe/Zurich", flag: "🇨🇭" },
    { country: "Ireland", code: "IE", currency: "EUR", currencySymbol: "€", timezone: "Europe/Dublin", flag: "🇮🇪" },
    { country: "Norway", code: "NO", currency: "NOK", currencySymbol: "kr", timezone: "Europe/Oslo", flag: "🇳🇴" },
    { country: "Denmark", code: "DK", currency: "DKK", currencySymbol: "kr", timezone: "Europe/Copenhagen", flag: "🇩🇰" },
    { country: "Finland", code: "FI", currency: "EUR", currencySymbol: "€", timezone: "Europe/Helsinki", flag: "🇫🇮" },
    { country: "Belgium", code: "BE", currency: "EUR", currencySymbol: "€", timezone: "Europe/Brussels", flag: "🇧🇪" },
    { country: "Austria", code: "AT", currency: "EUR", currencySymbol: "€", timezone: "Europe/Vienna", flag: "🇦🇹" },
    { country: "Poland", code: "PL", currency: "PLN", currencySymbol: "zł", timezone: "Europe/Warsaw", flag: "🇵🇱" },
    { country: "Turkey", code: "TR", currency: "TRY", currencySymbol: "₺", timezone: "Europe/Istanbul", flag: "🇹🇷" },
    { country: "Russia", code: "RU", currency: "RUB", currencySymbol: "₽", timezone: "Europe/Moscow", flag: "🇷🇺" },
    { country: "South Korea", code: "KR", currency: "KRW", currencySymbol: "₩", timezone: "Asia/Seoul", flag: "🇰🇷" },
];

export const allCurrencies = [
    { code: "INR", symbol: "₹", name: "Indian Rupee" },
    { code: "USD", symbol: "$", name: "US Dollar" },
    { code: "EUR", symbol: "€", name: "Euro" },
    { code: "GBP", symbol: "£", name: "British Pound" },
    { code: "CAD", symbol: "$", name: "Canadian Dollar" },
    { code: "AUD", symbol: "$", name: "Australian Dollar" },
    { code: "AED", symbol: "dh", name: "UAE Dirham" },
    { code: "SGD", symbol: "$", name: "Singapore Dollar" },
    { code: "JPY", symbol: "¥", name: "Japanese Yen" },
    { code: "CNY", symbol: "¥", name: "Chinese Yuan" },
    { code: "HKD", symbol: "$", name: "Hong Kong Dollar" },
    { code: "CHF", symbol: "Fr", name: "Swiss Franc" },
    { code: "SEK", symbol: "kr", name: "Swedish Krona" },
    { code: "NZD", symbol: "$", name: "New Zealand Dollar" },
    { code: "MXN", symbol: "$", name: "Mexican Peso" },
    { code: "BRL", symbol: "R$", name: "Brazilian Real" },
    { code: "ZAR", symbol: "R", name: "South African Rand" },
    { code: "RUB", symbol: "₽", name: "Russian Ruble" },
    { code: "TRY", symbol: "₺", name: "Turkish Lira" },
    { code: "SAR", symbol: "﷼", name: "Saudi Riyal" },
];

// Ideally we'd fetch this from a library, but for now a static list covers 99% of use cases
export const allTimezones = [
    { value: "Asia/Kolkata", label: "India Standard Time (GMT+5:30)" },
    { value: "America/New_York", label: "Eastern Time (GMT-4)" },
    { value: "America/Los_Angeles", label: "Pacific Time (GMT-7)" },
    { value: "Europe/London", label: "London (GMT+1)" },
    { value: "Europe/Paris", label: "Paris (GMT+2)" },
    { value: "Asia/Dubai", label: "Dubai (GMT+4)" },
    { value: "Asia/Singapore", label: "Singapore (GMT+8)" },
    { value: "Australia/Sydney", label: "Sydney (GMT+10)" },
    { value: "UTC", label: "UTC (GMT+0)" },
    { value: "America/Chicago", label: "Central Time (GMT-5)" },
    { value: "America/Denver", label: "Mountain Time (GMT-6)" },
    { value: "America/Phoenix", label: "Arizona (GMT-7)" },
    { value: "America/Anchorage", label: "Alaska (GMT-8)" },
    { value: "Pacific/Honolulu", label: "Hawaii (GMT-10)" },
    { value: "America/Sao_Paulo", label: "Brasilia (GMT-3)" },
    { value: "Europe/Berlin", label: "Berlin (GMT+2)" },
    { value: "Europe/Moscow", label: "Moscow (GMT+3)" },
    { value: "Asia/Tokyo", label: "Tokyo (GMT+9)" },
    { value: "Asia/Hong_Kong", label: "Hong Kong (GMT+8)" },
    { value: "Asia/Bangkok", label: "Bangkok (GMT+7)" },
];
