
import { getUniqueCohortAvatars } from './frontend/lib/avatar-utils.ts';

const testCohorts = [
    "Cohort A",
    "Cohort B",
    "Cohort C",
    "Cohort D",
    "Cohort E",
    "High Spenders",
    "Churn Risks",
    "New Signups",
    "Inactive Users",
    "VIPs"
];

const assigned = getUniqueCohortAvatars(testCohorts);
const indices = Object.values(assigned);
const uniqueIndices = new Set(indices);

console.log("Assigned Avatars:", assigned);
console.log("Total Cohorts:", testCohorts.length);
console.log("Unique Avatars Count:", uniqueIndices.size);

if (uniqueIndices.size === testCohorts.size) {
    console.log("SUCCESS: All cohorts have unique avatars.");
} else {
    // Note: If testCohorts.length > 50, some duplicates are expected. 
    // But since 10 < 50, they should be unique.
    if (testCohorts.length <= 50 && uniqueIndices.size < testCohorts.length) {
        console.error("FAILURE: Some cohorts share the same avatar.");
    } else {
        console.log("Verification finished.");
    }
}

// Test Determinism
const assigned2 = getUniqueCohortAvatars(testCohorts);
const isDeterministic = JSON.stringify(assigned) === JSON.stringify(assigned2);
console.log("Deterministic:", isDeterministic);
