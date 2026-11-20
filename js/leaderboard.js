/**
 * CampusHub Leaderboard Module
 *
 * Handles contributor rankings and point calculations.
 */

// Initialize Supabase client
const supabase = window.supabase.createClient(
  SUPABASE_CONFIG.url,
  SUPABASE_CONFIG.anonKey
);

/**
 * Load leaderboard
 * @param {string} period - 'all-time' or 'weekly'
 */
async function loadLeaderboard(period = 'all-time') {
  try {
    let query = supabase
      .from('contribution_points')
      .select(`
        user_id,
        points,
        profiles!inner (
          full_name,
          department,
          semester
        )
      `);

    // Filter by period if needed
    if (period === 'weekly') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      query = query.gte('created_at', oneWeekAgo.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error loading leaderboard:', error);
      showToast('Failed to load leaderboard', 'error');
      return;
    }

    // Aggregate points by user
    const contributorMap = new Map();
    (data || []).forEach(entry => {
      const userId = entry.user_id;
      const currentPoints = contributorMap.get(userId) || { totalPoints: 0, profile: entry.profiles };
      currentPoints.totalPoints += entry.points;
      contributorMap.set(userId, currentPoints);
    });

    // Convert to array and sort by points
    const contributors = Array.from(contributorMap.entries())
      .map(([userId, data]) => ({
        userId,
        totalPoints: data.totalPoints,
        ...data.profile,
      }))
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .slice(0, APP_CONFIG.leaderboardLimit);

    // Render leaderboard
    const topThree = contributors.slice(0, 3);
    const remaining = contributors.slice(3);

    renderTopThree(topThree);
    renderLeaderboardTable(remaining, topThree.length);

    // Get user's rank if authenticated
    if (window.auth.isAuthenticated()) {
      await getUserRank();
    }
  } catch (error) {
    console.error('Leaderboard load error:', error);
    showToast('Failed to load leaderboard', 'error');
  }
}

/**
 * Render top 3 contributors
 * @param {Array} topContributors - Array of top 3 contributor objects
 */
function renderTopThree(topContributors) {
  const container = document.getElementById('topThreeContainer');
  if (!container) return;

  if (topContributors.length === 0) {
    container.innerHTML = '<p class="no-data">No contributors yet</p>';
    return;
  }

  // Reorder for podium: 2nd, 1st, 3rd
  const podiumOrder = [1, 0, 2];
  const podium = podiumOrder.map(i => topContributors[i]).filter(c => c);

  container.innerHTML = `
    <div class="podium">
      ${podium.map((contributor, index) => {
        const rank = podiumOrder[index] + 1;
        const height = rank === 1 ? '100%' : rank === 2 ? '75%' : '60%';
        return `
          <div class="podium-place place-${rank}">
            <div class="podium-avatar">
              <span class="avatar-initials">${getInitials(contributor.full_name)}</span>
            </div>
            <div class="podium-name">${escapeHtml(contributor.full_name)}</div>
            <div class="podium-points">${contributor.totalPoints} pts</div>
            <div class="podium-bar" style="height: ${height}"></div>
            <div class="podium-rank">#${rank}</div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

/**
 * Render full leaderboard table
 * @param {Array} contributors - Array of contributor objects
 * @param {number} startRank - Starting rank number
 */
function renderLeaderboardTable(contributors, startRank = 4) {
  const container = document.getElementById('leaderboardTableContainer');
  if (!container) return;

  if (contributors.length === 0) {
    container.innerHTML = '<p class="no-data">No more contributors</p>';
    return;
  }

  container.innerHTML = `
    <table class="leaderboard-table">
      <thead>
        <tr>
          <th>Rank</th>
          <th>Contributor</th>
          <th>Department</th>
          <th>Semester</th>
          <th>Points</th>
        </tr>
      </thead>
      <tbody>
        ${contributors.map((contributor, index) => `
          <tr>
            <td class="rank-cell">#${startRank + index}</td>
            <td class="name-cell">
              <span class="avatar-small">${getInitials(contributor.full_name)}</span>
              ${escapeHtml(contributor.full_name)}
            </td>
            <td>${escapeHtml(contributor.department)}</td>
            <td>${contributor.semester}</td>
            <td class="points-cell">${contributor.totalPoints}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

/**
 * Get user's current rank
 * @returns {Object|null} User's rank data or null
 */
async function getUserRank() {
  try {
    const userProfile = window.auth.getUserProfile();
    if (!userProfile) return null;

    // Get user's total points
    const { data: pointsData } = await supabase
      .from('contribution_points')
      .select('points')
      .eq('user_id', userProfile.id);

    const totalPoints = (pointsData || []).reduce((sum, entry) => sum + entry.points, 0);

    // Get all users' total points to calculate rank
    const { data: allPoints } = await supabase
      .from('contribution_points')
      .select('user_id, points');

    const userPointsMap = new Map();
    (allPoints || []).forEach(entry => {
      const current = userPointsMap.get(entry.user_id) || 0;
      userPointsMap.set(entry.user_id, current + entry.points);
    });

    const sortedUsers = Array.from(userPointsMap.entries())
      .sort((a, b) => b[1] - a[1]);

    const rank = sortedUsers.findIndex(([userId]) => userId === userProfile.id) + 1;

    // Display user's rank
    const userRankContainer = document.getElementById('userRankContainer');
    if (userRankContainer) {
      userRankContainer.innerHTML = `
        <div class="user-rank-card">
          <h4>Your Rank</h4>
          <div class="rank-number">#${rank}</div>
          <div class="rank-points">${totalPoints} points</div>
        </div>
      `;
    }

    return { rank, totalPoints };
  } catch (error) {
    console.error('Error getting user rank:', error);
    return null;
  }
}

/**
 * Calculate contribution points for a resource
 * @param {string} category - Resource category
 * @returns {number} Points for the category
 */
function calculatePoints(category) {
  const { points } = APP_CONFIG;
  return points[category] || points.other;
}

/**
 * Award points to user
 * @param {string} userId - User ID
 * @param {string} resourceId - Resource ID
 * @param {number} points - Points to award
 * @param {string} reason - Reason for points
 */
async function awardPoints(userId, resourceId, points, reason) {
  try {
    const { error } = await supabase
      .from('contribution_points')
      .insert({
        user_id: userId,
        resource_id: resourceId,
        points,
        reason,
      });

    if (error) {
      console.error('Error awarding points:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Points award error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get user badges
 * @param {string} userId - User ID
 * @returns {Array} Array of badge names
 */
async function getUserBadges(userId) {
  try {
    // Get user's approved resource count
    const { data: resources } = await supabase
      .from('resources')
      .select('id')
      .eq('uploaded_by', userId)
      .eq('status', 'approved');

    const approvedCount = (resources || []).length;
    const badges = [];

    const { badges: badgeThresholds } = APP_CONFIG;

    if (approvedCount >= badgeThresholds.helpfulContributor) {
      badges.push('Helpful Contributor');
    }
    if (approvedCount >= badgeThresholds.studyChampion) {
      badges.push('Study Champion');
    }

    // Check if top 10
    const rankData = await getUserRank();
    if (rankData && rankData.rank <= 10) {
      badges.push('Top Contributor');
    }

    return badges;
  } catch (error) {
    console.error('Error getting user badges:', error);
    return [];
  }
}

/**
 * Get initials from name
 * @param {string} name - Full name
 * @returns {string} Initials
 */
function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// Export functions for use in other files
if (typeof window !== 'undefined') {
  window.loadLeaderboard = loadLeaderboard;
  window.calculatePoints = calculatePoints;
  window.awardPoints = awardPoints;
  window.getUserBadges = getUserBadges;
}
