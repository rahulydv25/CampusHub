/**
 * CampusHub Configuration
 *
 * This file contains all configuration settings for the application.
 * Update these values when setting up your Supabase project.
 */

// Supabase Configuration
const SUPABASE_CONFIG = {
  url: 'https://abqjoivpncdopqcaxaxn.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFicWpvaXZwbmNkb3BxY2F4YXhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMyODM0MjcsImV4cCI6MjEwODg1OTQyN30.SUU6mH-ZRDC7xqbgv4k8U3vvzOObI91ecFPwGAVAJxI',
};

// Application Configuration
const APP_CONFIG = {
  appName: 'CampusHub',
  version: '1.0.0',

  // File upload settings
  maxFileSize: 50 * 1024 * 1024, // 50 MB in bytes
  allowedFileTypes: ['application/pdf'],

  // Pagination settings
  resourcesPerPage: 12,
  leaderboardLimit: 50,

  // Point system
  points: {
    notes: 10,
    pyq: 15,
    lab_manual: 10,
    assignment: 5,
    other: 5,
  },

  // Badge thresholds
  badges: {
    helpfulContributor: 5,    // 5+ approved resources
    studyChampion: 15,         // 15+ approved resources
    topContributor: 'top10',   // Top 10 all-time ranking
  },
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SUPABASE_CONFIG, APP_CONFIG };
}
