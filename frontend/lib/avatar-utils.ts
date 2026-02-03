
export const getAvatarIndex = (input: string, max: number = 50): number => {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
        const char = input.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return (Math.abs(hash) % max) + 1; // 1-based index
};

export const getUniqueCohortAvatars = (cohorts: string[]): Record<string, number> => {
    const sortedCohorts = [...cohorts].sort();
    const assigned: Record<string, number> = {};
    const usedIndices = new Set<number>();
    const MAX_AVATARS = 50;

    sortedCohorts.forEach(cohort => {
        let index = getAvatarIndex(cohort, MAX_AVATARS);

        // Linear probing for collision resolution
        // We try up to MAX_AVATARS times to find a slot
        let attempts = 0;
        while (usedIndices.has(index) && attempts < MAX_AVATARS) {
            index = (index % MAX_AVATARS) + 1;
            attempts++;
        }

        // If we still have a collision (all 50 taken?), we honestly just take the hit or overlap.
        // But with 50 avatars and typical cohort counts < 20, this is rare.
        usedIndices.add(index);
        assigned[cohort] = index;
    });

    return assigned;
};
