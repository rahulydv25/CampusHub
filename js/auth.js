/**
 * CampusHub Authentication Module
 *
 * Handles user authentication using Supabase Auth.
 */

// Initialize Supabase client
const supabase = window.supabase.createClient(
  SUPABASE_CONFIG.url,
  SUPABASE_CONFIG.anonKey
);

// Current user session
let currentUser = null;
let userProfile = null;

/**
 * Initialize authentication
 * Check if user is logged in on page load
 */
async function initAuth() {
  try {
    // Get current session
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error('Error getting session:', error);
      return;
    }

    if (session) {
      currentUser = session.user;
      // Fetch user profile
      await fetchUserProfile(currentUser.id);
    }

    // Listen for auth changes
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN') {
        currentUser = session.user;
        await fetchUserProfile(currentUser.id);
      } else if (event === 'SIGNED_OUT') {
        currentUser = null;
        userProfile = null;
      }
      updateAuthUI();
    });

    updateAuthUI();
  } catch (error) {
    console.error('Auth initialization error:', error);
  }
}

/**
 * Fetch user profile from database
 * @param {string} userId - User ID
 */
async function fetchUserProfile(userId) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return;
    }

    userProfile = data;
  } catch (error) {
    console.error('Profile fetch error:', error);
  }
}

/**
 * Login user with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {boolean} remember - Remember me option
 */
async function login(email, password, remember = false) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      showToast(error.message, 'error');
      return { success: false, error: error.message };
    }

    currentUser = data.user;
    await fetchUserProfile(currentUser.id);
    showToast('Login successful!', 'success');
    updateAuthUI();

    // Redirect to home page
    setTimeout(() => {
      window.location.href = 'home.html';
    }, 1000);

    return { success: true };
  } catch (error) {
    console.error('Login error:', error);
    showToast('Login failed. Please try again.', 'error');
    return { success: false, error: error.message };
  }
}

/**
 * Register new user
 * @param {Object} userData - User registration data
 */
async function register(userData) {
  try {
    const { email, password, fullName, collegeId, department, semester } = userData;

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      showToast(authError.message, 'error');
      return { success: false, error: authError.message };
    }

    if (authData.user) {
      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          full_name: fullName,
          college_id: collegeId,
          department,
          semester,
          role: 'student',
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        showToast('Registration failed. Please try again.', 'error');
        return { success: false, error: profileError.message };
      }

      showToast('Registration successful! Please login.', 'success');
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 1500);

      return { success: true };
    }
  } catch (error) {
    console.error('Registration error:', error);
    showToast('Registration failed. Please try again.', 'error');
    return { success: false, error: error.message };
  }
}

/**
 * Logout current user
 */
async function logout() {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Logout error:', error);
      showToast('Logout failed. Please try again.', 'error');
      return;
    }

    currentUser = null;
    userProfile = null;
    showToast('Logged out successfully', 'success');
    updateAuthUI();

    // Redirect to index page
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 1000);
  } catch (error) {
    console.error('Logout error:', error);
    showToast('Logout failed. Please try again.', 'error');
  }
}

/**
 * Get current user
 * @returns {Object|null} Current user or null
 */
function getCurrentUser() {
  return currentUser;
}

/**
 * Get current user profile
 * @returns {Object|null} Current user profile or null
 */
function getUserProfile() {
  return userProfile;
}

/**
 * Check if user is authenticated
 * @returns {boolean} True if user is logged in
 */
function isAuthenticated() {
  return currentUser !== null;
}

/**
 * Check if user is admin
 * @returns {boolean} True if user has admin role
 */
function isAdmin() {
  return userProfile && userProfile.role === 'admin';
}

/**
 * Update UI based on authentication state
 */
function updateAuthUI() {
  // Update navigation links
  const loginLink = document.getElementById('loginLink');
  const registerLink = document.getElementById('registerLink');
  const logoutLink = document.getElementById('logoutLink');
  const adminLink = document.getElementById('adminLink');
  const userName = document.getElementById('userName');

  if (isAuthenticated()) {
    if (loginLink) loginLink.classList.add('hidden');
    if (registerLink) registerLink.classList.add('hidden');
    if (logoutLink) logoutLink.classList.remove('hidden');
    if (userName) {
      userName.textContent = userProfile?.full_name || 'User';
      userName.classList.remove('hidden');
    }
    // Show admin link only for admin users
    if (adminLink) {
      if (isAdmin()) {
        adminLink.classList.remove('hidden');
      } else {
        adminLink.classList.add('hidden');
      }
    }
  } else {
    if (loginLink) loginLink.classList.remove('hidden');
    if (registerLink) registerLink.classList.remove('hidden');
    if (logoutLink) logoutLink.classList.add('hidden');
    if (adminLink) adminLink.classList.add('hidden');
    if (userName) userName.classList.add('hidden');
  }
}

// Add event listener for logout link
document.addEventListener('DOMContentLoaded', () => {
  const logoutLink = document.getElementById('logoutLink');
  if (logoutLink) {
    logoutLink.addEventListener('click', (e) => {
      e.preventDefault();
      logout();
    });
  }
});

// Export functions for use in other files
if (typeof window !== 'undefined') {
  window.auth = {
    initAuth,
    login,
    register,
    logout,
    getCurrentUser,
    getUserProfile,
    isAuthenticated,
    isAdmin,
    updateAuthUI,
  };
}
