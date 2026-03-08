import { AnalyticsAdminServiceClient } from '@google-analytics/admin';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

// Initialize client
const client = new AnalyticsAdminServiceClient();

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
    const propertyId = process.env.GA4_PROPERTY_ID;
    if (!propertyId) {
        console.error("❌ ERROR: Missing GA4_PROPERTY_ID environment variable!");
        console.error("Please set it in your website/.env.local file or pass it directly.");
        console.error("Example: GA4_PROPERTY_ID=123456789 node scripts/setup-ga4.mjs");
        process.exit(1);
    }
    const parent = `properties/${propertyId}`;
    console.log(`🚀 Starting GA4 API Setup for Property: ${parent}`);

    const eventDimensions = [
        "section_id", "section_index", "carousel_id", "method", "item_name", "study_name",
        "filter_role", "cta_text", "cta_position", "source_section", "video_name",
        "error_message", "error_source", "rating", "nav_item", "action", "scroll_direction", "pause_reason"
    ];

    const userDimensions = ["device_type"];

    const eventMetrics = [
        { name: "dwell_seconds", unit: "SECONDS", title: "Dwell Seconds" },
        { name: "score", unit: "STANDARD", title: "Engagement Score" },
        { name: "depth_percent", unit: "STANDARD", title: "Scroll Depth Percent" },
        { name: "percent", unit: "STANDARD", title: "Video Percent" },
        { name: "value_ms", unit: "MILLISECONDS", title: "Web Vital Value" },
        { name: "sections_viewed", unit: "STANDARD", title: "Sections Viewed" },
        { name: "interactions", unit: "STANDARD", title: "Interactions" },
        { name: "time_seconds", unit: "SECONDS", title: "Time Seconds" },
        { name: "max_scroll_depth", unit: "STANDARD", title: "Max Scroll Depth" },
        { name: "click_count", unit: "STANDARD", title: "Click Count" }
    ];

    const keyEvents = ["booking_complete", "cta_click", "study_modal_open"];

    console.log("\n--- 1/5 Creating Event Scoped Dimensions ---");
    for (const d of eventDimensions) {
        try {
            const title = d.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            await client.createCustomDimension({
                parent,
                customDimension: {
                    parameterName: d,
                    displayName: title,
                    scope: "EVENT"
                }
            });
            console.log(`✅ Created event dimension: ${d}`);
        } catch (e) {
            if (e.message?.includes("already exists")) console.log(`⏭️  Skipped ${d} (already exists)`);
            else { console.error(`❌ Failed ${d}:`, e.message); await delay(500); }
        }
        await delay(200); // Rate limit breathing room
    }

    console.log("\n--- 2/5 Creating User Scoped Dimensions ---");
    for (const d of userDimensions) {
        try {
            const title = d.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            await client.createCustomDimension({
                parent,
                customDimension: {
                    parameterName: d,
                    displayName: title,
                    scope: "USER"
                }
            });
            console.log(`✅ Created user dimension: ${d}`);
        } catch (e) {
            if (e.message?.includes("already exists")) console.log(`⏭️  Skipped ${d} (already exists)`);
            else { console.error(`❌ Failed ${d}:`, e.message); await delay(500); }
        }
        await delay(200);
    }

    console.log("\n--- 3/5 Creating Custom Metrics ---");
    for (const m of eventMetrics) {
        try {
            await client.createCustomMetric({
                parent,
                customMetric: {
                    parameterName: m.name,
                    displayName: m.title,
                    measurementUnit: m.unit,
                    scope: "EVENT"
                }
            });
            console.log(`✅ Created metric: ${m.name}`);
        } catch (e) {
            if (e.message?.includes("already exists")) console.log(`⏭️  Skipped ${m.name} (already exists)`);
            else { console.error(`❌ Failed ${m.name}:`, e.message); await delay(500); }
        }
        await delay(200);
    }

    console.log("\n--- 4/5 Defining Key Events (Conversions) ---");
    for (const ce of keyEvents) {
        try {
            await client.createConversionEvent({
                parent,
                conversionEvent: { eventName: ce }
            });
            console.log(`✅ Marked conversion event: ${ce}`);
        } catch (e) {
            if (e.message?.includes("already exists") || e.message?.includes("Multiple Resources matching")) {
                console.log(`⏭️  Skipped conversion ${ce} (already exists)`);
            } else {
                console.error(`❌ Failed conversion ${ce}:`, e.message); await delay(500);
            }
        }
        await delay(200);
    }

    console.log("\n--- 5/5 Updating Data Retention ---");
    try {
        await client.updateDataRetentionSettings({
            dataRetentionSettings: {
                name: `${parent}/dataRetentionSettings`,
                eventDataRetention: "FOURTEEN_MONTHS"
            },
            updateMask: { paths: ["event_data_retention"] }
        });
        console.log(`✅ Updated Data Retention to 14 months`);
    } catch (e) {
        console.error(`❌ Failed updating Data Retention:`, e.message);
    }

    console.log("\n🎉 API SETUP COMPLETE!");
    console.log("\n⚠️ IMPORTANT MANUAL STEPS REMAINING:");
    console.log("- Enhanced Measurement: Ensure it's active in Admin > Data Streams");
    console.log("- Audiences: Must be created manually via Admin > Audiences");
    console.log("- Explorations (Reports): Must be created manually via the Explore tab");
}

main().catch(console.error);
