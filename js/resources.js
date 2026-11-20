/**
 * CampusHub Resources Module
 *
 * Handles resource browsing, searching, and filtering.
 */

// Initialize Supabase client (will be initialized from config.js)
let supabase;
if (typeof window !== 'undefined' && window.supabase) {
  supabase = window.supabase.createClient(
    SUPABASE_CONFIG.url,
    SUPABASE_CONFIG.anonKey
  );
}

/**
 * Load resources with filters
 * @param {Object} filters - Filter options (semester, department, category, search, sortBy)
 */
async function loadResources(filters = {}) {
  try {
    const { semester, department, category, search, sortBy } = filters;

    // Build query
    let query = supabase
      .from('resources')
      .select(`
        *,
        subjects!inner (
          name,
          subject_code,
          department,
          semester
        ),
        profiles!inner (
          full_name
        )
      `)
      .eq('status', 'approved');

    // Apply filters
    if (semester) {
      query = query.eq('subjects.semester', parseInt(semester));
    }
    if (department) {
      query = query.eq('subjects.department', department);
    }
    if (category) {
      query = query.eq('category', category);
    }
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Apply sorting
    if (sortBy === 'newest') {
      query = query.order('created_at', { ascending: false });
    } else if (sortBy === 'oldest') {
      query = query.order('created_at', { ascending: true });
    } else if (sortBy === 'most_downloaded') {
      query = query.order('download_count', { ascending: false });
    }

    const { data, error } = await query.limit(APP_CONFIG.resourcesPerPage);

    if (error) {
      console.error('Error loading resources:', error);
      showToast('Failed to load resources', 'error');
      return;
    }

    renderResources(data || []);
  } catch (error) {
    console.error('Resources load error:', error);
    showToast('Failed to load resources', 'error');
  }
}

/**
 * Search resources by query
 * @param {string} query - Search query
 */
async function searchResources(query) {
  const filters = { search: query };
  await loadResources(filters);
}

/**
 * Render resource cards
 * @param {Array} resources - Array of resource objects
 */
function renderResources(resources) {
  const container = document.getElementById('resourcesContainer');
  if (!container) return;

  if (resources.length === 0) {
    container.innerHTML = `
      <div class="no-resources">
        <p>No resources found matching your criteria.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = resources.map(resource => {
    const subject = resource.subjects || {};
    const uploader = resource.profiles || {};

    return `
      <div class="resource-card">
        <div class="resource-header">
          <span class="badge badge-${getCategoryBadgeClass(resource.category)}">
            ${formatCategory(resource.category)}
          </span>
          <span class="resource-date">${formatDate(resource.created_at)}</span>
        </div>
        <h3 class="resource-title">${escapeHtml(resource.title)}</h3>
        <p class="resource-description">${escapeHtml(truncateText(resource.description || '', 120))}</p>
        <div class="resource-meta">
          <span><strong>Subject:</strong> ${escapeHtml(subject.name || 'N/A')}</span>
          <span><strong>Sem:</strong> ${subject.semester || 'N/A'}</span>
          <span><strong>Dept:</strong> ${escapeHtml(subject.department || 'N/A')}</span>
        </div>
        <div class="resource-footer">
          <span class="uploader">Uploaded by ${escapeHtml(uploader.full_name || 'Anonymous')}</span>
          <div class="resource-actions">
            <button onclick="downloadResource('${resource.id}', '${resource.storage_path}')" class="btn btn-primary btn-sm">
              Download
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Download resource
 * @param {string} resourceId - Resource ID
 * @param {string} storagePath - Storage path
 */
async function downloadResource(resourceId, storagePath) {
  try {
    // Get current download count
    const { data: resource } = await supabase
      .from('resources')
      .select('download_count')
      .eq('id', resourceId)
      .single();

    // Increment download count
    await supabase
      .from('resources')
      .update({ download_count: (resource?.download_count || 0) + 1 })
      .eq('id', resourceId);

    // Get download URL
    const { data, error } = await supabase
      .storage
      .from('resources')
      .createSignedUrl(storagePath, 60); // 60 seconds expiry

    if (error) {
      console.error('Download error:', error);
      showToast('Failed to download resource', 'error');
      return;
    }

    // Open download in new tab
    window.open(data.signedUrl, '_blank');
    showToast('Download started', 'success');
  } catch (error) {
    console.error('Download error:', error);
    showToast('Failed to download resource', 'error');
  }
}

/**
 * Get category badge class
 * @param {string} category - Resource category
 * @returns {string} CSS class
 */
function getCategoryBadgeClass(category) {
  const classes = {
    notes: 'primary',
    pyq: 'success',
    lab_manual: 'warning',
    assignment: 'info',
    other: 'secondary',
  };
  return classes[category] || 'secondary';
}

/**
 * Format category for display
 * @param {string} category - Resource category
 * @returns {string} Formatted category
 */
function formatCategory(category) {
  const names = {
    notes: 'Notes',
    pyq: 'PYQ',
    lab_manual: 'Lab Manual',
    assignment: 'Assignment',
    other: 'Other',
  };
  return names[category] || category;
}

/**
 * Apply filters
 */
function applyFilters() {
  const filters = {
    semester: document.getElementById('semesterFilter')?.value,
    department: document.getElementById('departmentFilter')?.value,
    category: document.getElementById('categoryFilter')?.value,
    search: document.getElementById('resourceSearch')?.value,
    sortBy: document.getElementById('sortBy')?.value,
  };

  loadResources(filters);
}

/**
 * Reset all filters
 */
function resetFilters() {
  document.getElementById('semesterFilter').value = '';
  document.getElementById('departmentFilter').value = '';
  document.getElementById('categoryFilter').value = '';
  document.getElementById('resourceSearch').value = '';
  document.getElementById('sortBy').value = 'newest';

  loadResources();
}

// Export functions for use in other files
if (typeof window !== 'undefined') {
  window.loadResources = loadResources;
  window.searchResources = searchResources;
  window.downloadResource = downloadResource;
  window.applyFilters = applyFilters;
  window.resetFilters = resetFilters;
}
