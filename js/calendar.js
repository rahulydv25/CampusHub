/**
 * CampusHub Calendar Module
 *
 * Handles academic calendar events and dates.
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
 * Load calendar events with filters
 * @param {Object} filters - Filter options (eventType, department, semester)
 */
async function loadCalendarEvents(filters = {}) {
  try {
    const { eventType, department, semester } = filters;

    let query = supabase
      .from('academic_events')
      .select('*')
      .gte('event_date', new Date().toISOString().split('T')[0]) // Only future events
      .order('event_date', { ascending: true });

    // Apply filters
    if (eventType) {
      query = query.eq('event_type', eventType);
    }
    if (department) {
      query = query.eq('department', department);
    }
    if (semester) {
      query = query.eq('semester', parseInt(semester));
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error loading calendar events:', error);
      showToast('Failed to load calendar events', 'error');
      return;
    }

    renderCalendarEvents(data || []);
  } catch (error) {
    console.error('Calendar events load error:', error);
    showToast('Failed to load calendar events', 'error');
  }
}

/**
 * Render calendar events
 * @param {Array} events - Array of event objects
 */
function renderCalendarEvents(events) {
  const container = document.getElementById('calendarEventsContainer');
  if (!container) return;

  if (events.length === 0) {
    container.innerHTML = `
      <div class="no-events">
        <p>No upcoming events found.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = events.map(event => `
    <div class="event-card">
      <div class="event-header">
        <span class="badge ${getEventTypeBadgeClass(event.event_type)}">
          ${formatEventType(event.event_type)}
        </span>
        <span class="event-date">${formatEventDate(event.event_date)}</span>
      </div>
      <h3 class="event-title">${escapeHtml(event.title)}</h3>
      ${event.description ? `<p class="event-description">${escapeHtml(event.description)}</p>` : ''}
      <div class="event-meta">
        ${event.department ? `<span><strong>Department:</strong> ${escapeHtml(event.department)}</span>` : ''}
        ${event.semester ? `<span><strong>Semester:</strong> ${event.semester}</span>` : ''}
      </div>
    </div>
  `).join('');
}

/**
 * Add new calendar event
 * @param {Object} eventData - Event data
 */
async function addEvent(eventData) {
  try {
    // Check if user is admin
    if (!window.auth.isAdmin()) {
      showToast('Only admins can add events', 'error');
      return { success: false, error: 'Not authorized' };
    }

    const userProfile = window.auth.getUserProfile();
    if (!userProfile) return { success: false, error: 'Profile not found' };

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

    const { error } = await supabase
      .from('academic_events')
      .insert({
        college_id: college.id,
        title: eventData.title,
        event_date: eventData.eventDate,
        event_type: eventData.eventType,
        description: eventData.description,
        department: eventData.department || null,
        semester: eventData.semester ? parseInt(eventData.semester) : null,
        created_by: userProfile.id,
      });

    if (error) {
      console.error('Error adding event:', error);
      showToast('Failed to add event', 'error');
      return { success: false, error: error.message };
    }

    showToast('Event added successfully', 'success');
    loadCalendarEvents(); // Refresh events

    return { success: true };
  } catch (error) {
    console.error('Add event error:', error);
    showToast('Failed to add event', 'error');
    return { success: false, error: error.message };
  }
}

/**
 * Update existing event
 * @param {string} eventId - Event ID
 * @param {Object} eventData - Updated event data
 */
async function updateEvent(eventId, eventData) {
  try {
    if (!window.auth.isAdmin()) {
      showToast('Only admins can update events', 'error');
      return { success: false, error: 'Not authorized' };
    }

    const { error } = await supabase
      .from('academic_events')
      .update({
        title: eventData.title,
        event_date: eventData.eventDate,
        event_type: eventData.eventType,
        description: eventData.description,
        department: eventData.department || null,
        semester: eventData.semester ? parseInt(eventData.semester) : null,
      })
      .eq('id', eventId);

    if (error) {
      console.error('Error updating event:', error);
      showToast('Failed to update event', 'error');
      return { success: false, error: error.message };
    }

    showToast('Event updated successfully', 'success');
    loadCalendarEvents();

    return { success: true };
  } catch (error) {
    console.error('Update event error:', error);
    showToast('Failed to update event', 'error');
    return { success: false, error: error.message };
  }
}

/**
 * Delete event
 * @param {string} eventId - Event ID
 */
async function deleteEvent(eventId) {
  try {
    if (!window.auth.isAdmin()) {
      showToast('Only admins can delete events', 'error');
      return { success: false, error: 'Not authorized' };
    }

    const { error } = await supabase
      .from('academic_events')
      .delete()
      .eq('id', eventId);

    if (error) {
      console.error('Error deleting event:', error);
      showToast('Failed to delete event', 'error');
      return { success: false, error: error.message };
    }

    showToast('Event deleted successfully', 'success');
    loadCalendarEvents();

    return { success: true };
  } catch (error) {
    console.error('Delete event error:', error);
    showToast('Failed to delete event', 'error');
    return { success: false, error: error.message };
  }
}

/**
 * Get event type badge class
 * @param {string} eventType - Event type
 * @returns {string} CSS class for badge
 */
function getEventTypeBadgeClass(eventType) {
  const badgeClasses = {
    exam: 'badge-danger',
    practical: 'badge-warning',
    assignment: 'badge-info',
    holiday: 'badge-success',
    event: 'badge-primary',
  };
  return badgeClasses[eventType] || 'badge-secondary';
}

/**
 * Format event type for display
 * @param {string} eventType - Event type
 * @returns {string} Formatted event type
 */
function formatEventType(eventType) {
  const names = {
    exam: 'Exam',
    practical: 'Practical',
    assignment: 'Assignment',
    holiday: 'Holiday',
    event: 'Event',
  };
  return names[eventType] || eventType;
}

/**
 * Format event date for display
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date
 */
function formatEventDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// Export functions for use in other files
if (typeof window !== 'undefined') {
  window.loadCalendarEvents = loadCalendarEvents;
  window.addEvent = addEvent;
  window.updateEvent = updateEvent;
  window.deleteEvent = deleteEvent;
  window.getEventTypeBadgeClass = getEventTypeBadgeClass;
  window.formatEventDate = formatEventDate;
}
