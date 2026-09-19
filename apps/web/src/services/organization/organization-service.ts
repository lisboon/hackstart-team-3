export type OrganizationIndicators = {
  totalUsers: number;
  tightPercentage: number;
  moodTrend: number;
  reach: number;
  adherence: number;
  frequency: number;
  evolution: number;
};

/**
 * Mock service for GET /organizations/current/indicators
 * This should be replaced with `requestJson` when the endpoint #35 is ready.
 */
export async function getOrganizationIndicators(
  token: string,
): Promise<OrganizationIndicators> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 800));

  // Change this to test the < 5 users suppression logic
  const MOCK_TOTAL_USERS = 12;

  if (!token) throw new Error("Unauthorized");

  return {
    totalUsers: MOCK_TOTAL_USERS,
    tightPercentage: 0.35, // 35%
    moodTrend: 3.8, // 1 to 5 scale
    reach: 42, // 42 people
    adherence: 28, // 28 people
    frequency: 4.2, // 4.2 days/person
    evolution: 3.5, // previous month reading
  };
}
