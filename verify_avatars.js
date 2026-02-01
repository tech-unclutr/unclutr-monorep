
const getAvatarIndex = (input, max = 50) => {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
        const char = input.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return (Math.abs(hash) % max) + 1;
};

const getUniqueCohortAvatars = (cohorts) => {
    const sortedCohorts = [...cohorts].sort();
    const assigned = {};
    const usedIndices = new Set();
    const MAX_AVATARS = 50;

    sortedCohorts.forEach(cohort => {
        let index = getAvatarIndex(cohort, MAX_AVATARS);
        let attempts = 0;
        while (usedIndices.has(index) && attempts < MAX_AVATARS) {
            index = (index % MAX_AVATARS) + 1;
            attempts++;
        }
        usedIndices.add(index);
        assigned[cohort] = index;
    });

    return assigned;
};

const testCohorts = [
    "Cohort A", "Cohort B", "Cohort C", "Cohort D", "Cohort E",
    "High Spenders", "Churn Risks", "New Signups", "Inactive Users", "VIPs",
    "Test 1", "Test 2", "Test 3", "Test 4", "Test 5"
];

const assigned = getUniqueCohortAvatars(testCohorts);
const indices = Object.values(assigned);
const uniqueIndices = new Set(indices);

console.log("Assigned Avatars:", JSON.stringify(assigned, null, 2));
console.log("Total Cohorts:", testCohorts.length);
console.log("Unique Avatars Count:", uniqueIndices.size);

if (uniqueIndices.size === testCohorts.length) {
    console.log("SUCCESS: All cohorts have unique avatars.");
} else {
    console.error("FAILURE: Some cohorts share the same avatar.");
}

const assigned2 = getUniqueCohortAvatars(testCohorts);
const isDeterministic = JSON.stringify(assigned) === JSON.stringify(assigned2);
console.log("Deterministic:", isDeterministic);
if (!isDeterministic) console.error("FAILURE: Assignment is not deterministic.");
