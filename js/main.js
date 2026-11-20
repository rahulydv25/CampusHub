/**
 * CampusHub Main JavaScript
 *
 * Contains utility functions and common UI logic used across the application.
 */

/**
 * Show toast notification
 * @param {string} message - Message to display
 * @param {string} type - Type of toast (success, error, warning, info)
 */
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;

  container.appendChild(toast);

  // Auto-remove after 5 seconds
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 5000);
}

/**
 * Format date for display
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date
 */
function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;

  // Less than a minute
  if (diff < 60000) {
    return 'Just now';
  }

  // Less than an hour
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  }

  // Less than a day
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  }

  // Less than a week
  if (diff < 604800000) {
    const days = Math.floor(diff / 86400000);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }

  // Otherwise show full date
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format file size for display
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Truncate text to specified length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
function truncateText(text, maxLength = 100) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Get URL query parameter
 * @param {string} name - Parameter name
 * @returns {string|null} Parameter value or null
 */
function getUrlParam(name) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}

/**
 * Set URL query parameter
 * @param {string} name - Parameter name
 * @param {string} value - Parameter value
 */
function setUrlParam(name, value) {
  const url = new URL(window.location);
  url.searchParams.set(name, value);
  window.history.pushState({}, '', url);
}

/**
 * Remove URL query parameter
 * @param {string} name - Parameter name
 */
function removeUrlParam(name) {
  const url = new URL(window.location);
  url.searchParams.delete(name);
  window.history.pushState({}, '', url);
}

/**
 * Debounce function to limit execution rate
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} Success status
 */
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy:', err);
    return false;
  }
}

/**
 * Initialize application on page load
 */
document.addEventListener('DOMContentLoaded', function() {
  // Initialize authentication
  if (window.auth && window.auth.initAuth) {
    window.auth.initAuth();
  }

  // Load page-specific content based on current page
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';

  switch (currentPage) {
    case 'resources.html':
      if (window.loadResources) {
        // Load URL params if present
        const filters = {
          semester: getUrlParam('semester'),
          department: getUrlParam('department'),
          category: getUrlParam('category'),
          search: getUrlParam('search'),
        };
        window.loadResources(filters);
      }
      break;

    case 'leaderboard.html':
      if (window.loadLeaderboard) {
        window.loadLeaderboard('all-time');
      }
      break;

    case 'calendar.html':
      if (window.loadCalendarEvents) {
        window.loadCalendarEvents();
      }
      break;

    case 'upload.html':
      if (window.loadMySubmissions && window.auth?.isAuthenticated()) {
        window.loadMySubmissions();
      }
      break;

    case 'admin.html':
      if (window.checkAdminAccess) {
        if (window.checkAdminAccess()) {
          window.loadAdminStats();
          window.loadPendingSubmissions();
          window.loadNotices();
          window.loadEventStats();
        }
      }
      break;
  }
});

// Export utility functions for use in other files
if (typeof window !== 'undefined') {
  window.showToast = showToast;
  window.formatDate = formatDate;
  window.formatFileSize = formatFileSize;
  window.truncateText = truncateText;
  window.escapeHtml = escapeHtml;
  window.getUrlParam = getUrlParam;
  window.setUrlParam = setUrlParam;
  window.removeUrlParam = removeUrlParam;
  window.debounce = debounce;
  window.copyToClipboard = copyToClipboard;
}
