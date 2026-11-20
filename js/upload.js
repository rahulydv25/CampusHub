/**
 * CampusHub Upload Module
 *
 * Handles resource file uploads to Supabase Storage.
 */

// Initialize Supabase client
const supabase = window.supabase.createClient(
  SUPABASE_CONFIG.url,
  SUPABASE_CONFIG.anonKey
);

/**
 * Handle file upload
 * @param {Object} formData - Form data containing resource details and file
 */
async function uploadResource(formData) {
  try {
    const { title, description, category, department, semester, subject, file } = formData;

    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      showToast(validation.error, 'error');
      return { success: false, error: validation.error };
    }

    // Check authentication
    if (!window.auth.isAuthenticated()) {
      showToast('Please login to upload resources', 'error');
      return { success: false, error: 'Not authenticated' };
    }

    const userProfile = window.auth.getUserProfile();
    if (!userProfile) {
      showToast('User profile not found', 'error');
      return { success: false, error: 'Profile not found' };
    }

    // Get college ID
    const { data: college } = await supabase
      .from('colleges')
      .select('id')
      .eq('name', userProfile.college_id)
      .single();

    if (!college) {
      showToast('College not found', 'error');
      return { success: false, error: 'College not found' };
    }

    // Get or create subject
    let subjectId;
    const { data: existingSubject } = await supabase
      .from('subjects')
      .select('id')
      .eq('college_id', college.id)
      .eq('department', department)
      .eq('semester', parseInt(semester))
      .eq('name', subject)
      .single();

    if (existingSubject) {
      subjectId = existingSubject.id;
    } else {
      // Create new subject (only admins can, but we'll handle this differently)
      // For now, we'll use a simple approach
      const { data: newSubject, error: subjectError } = await supabase
        .from('subjects')
        .insert({
          college_id: college.id,
          department,
          semester: parseInt(semester),
          name: subject,
          subject_code: subject.substring(0, 10).toUpperCase(),
        })
        .select()
        .single();

      if (subjectError) {
        console.error('Subject creation error:', subjectError);
        showToast('Failed to create subject', 'error');
        return { success: false, error: subjectError.message };
      }

      subjectId = newSubject.id;
    }

    // Generate unique file path
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${file.name}`;
    const storagePath = `${userProfile.college_id}/${department}/${semester}/${fileName}`;

    // Upload file to storage
    const { error: uploadError } = await supabase
      .storage
      .from('resources')
      .upload(storagePath, file);

    if (uploadError) {
      console.error('Upload error:', uploadError);
      showToast('File upload failed', 'error');
      return { success: false, error: uploadError.message };
    }

    // Create resource record
    const { error: dbError } = await supabase
      .from('resources')
      .insert({
        college_id: college.id,
        subject_id: subjectId,
        title,
        description,
        category,
        storage_path: storagePath,
        file_name: file.name,
        file_size: file.size,
        uploaded_by: userProfile.id,
        status: 'pending',
      });

    if (dbError) {
      console.error('Database error:', dbError);
      // Clean up uploaded file
      await supabase.storage.from('resources').remove([storagePath]);
      showToast('Failed to save resource', 'error');
      return { success: false, error: dbError.message };
    }

    showToast('Resource uploaded successfully! Pending approval.', 'success');
    loadMySubmissions(); // Refresh submissions list

    return { success: true };
  } catch (error) {
    console.error('Upload error:', error);
    showToast('Upload failed. Please try again.', 'error');
    return { success: false, error: error.message };
  }
}

/**
 * Validate file before upload
 * @param {File} file - File to validate
 * @returns {Object} Validation result
 */
function validateFile(file) {
  const { maxFileSize, allowedFileTypes } = APP_CONFIG;

  // Check file size
  if (file.size > maxFileSize) {
    return {
      valid: false,
      error: `File size exceeds ${maxFileSize / (1024 * 1024)} MB limit`,
    };
  }

  // Check file type
  if (!allowedFileTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Only PDF files are allowed',
    };
  }

  return { valid: true };
}

/**
 * Load user's submissions
 */
async function loadMySubmissions() {
  try {
    if (!window.auth.isAuthenticated()) {
      return;
    }

    const userProfile = window.auth.getUserProfile();
    if (!userProfile) return;

    const { data, error } = await supabase
      .from('resources')
      .select(`
        *,
        subjects (
          name,
          department,
          semester
        )
      `)
      .eq('uploaded_by', userProfile.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading submissions:', error);
      showToast('Failed to load submissions', 'error');
      return;
    }

    renderMySubmissions(data || []);
  } catch (error) {
    console.error('Submissions load error:', error);
    showToast('Failed to load submissions', 'error');
  }
}

/**
 * Render user's submissions
 * @param {Array} submissions - Array of submission objects
 */
function renderMySubmissions(submissions) {
  const container = document.getElementById('mySubmissionsContainer');
  if (!container) return;

  if (submissions.length === 0) {
    container.innerHTML = `
      <div class="no-submissions">
        <p>You haven't uploaded any resources yet.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = submissions.map(submission => {
    const subject = submission.subjects || {};
    const statusClass = submission.status === 'approved' ? 'success' :
                       submission.status === 'rejected' ? 'danger' : 'warning';

    return `
      <div class="submission-card">
        <div class="submission-header">
          <span class="badge badge-${statusClass}">${submission.status.toUpperCase()}</span>
          <span class="submission-date">${formatDate(submission.created_at)}</span>
        </div>
        <h4 class="submission-title">${escapeHtml(submission.title)}</h4>
        <div class="submission-meta">
          <span><strong>Subject:</strong> ${escapeHtml(subject.name || 'N/A')}</span>
          <span><strong>Sem:</strong> ${subject.semester || 'N/A'}</span>
          <span><strong>Size:</strong> ${formatFileSize(submission.file_size)}</span>
        </div>
        ${submission.rejection_reason ? `
          <div class="rejection-reason">
            <strong>Rejection Reason:</strong> ${escapeHtml(submission.rejection_reason)}
          </div>
        ` : ''}
      </div>
    `;
  }).join('');
}

// Export functions for use in other files
if (typeof window !== 'undefined') {
  window.uploadResource = uploadResource;
  window.validateFile = validateFile;
  window.loadMySubmissions = loadMySubmissions;
}
