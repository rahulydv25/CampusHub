-- CampusHub Row Level Security (RLS) Policies
-- Run this in Supabase SQL Editor AFTER running schema.sql
-- These policies control who can access and modify data

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE contribution_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_events ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PROFILES TABLE POLICIES
-- ============================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile (except role)
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id AND
    role = (SELECT role FROM profiles WHERE id = auth.uid())
  );

-- Only admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- SUBJECTS TABLE POLICIES
-- ============================================

-- Everyone can view subjects
CREATE POLICY "Everyone can view subjects"
  ON subjects FOR SELECT
  USING (true);

-- Only admins can insert subjects
CREATE POLICY "Admins can insert subjects"
  ON subjects FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Only admins can update subjects
CREATE POLICY "Admins can update subjects"
  ON subjects FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- RESOURCES TABLE POLICIES
-- ============================================

-- Everyone can view approved resources
CREATE POLICY "Everyone can view approved resources"
  ON resources FOR SELECT
  USING (status = 'approved');

-- Users can view their own resources (any status)
CREATE POLICY "Users can view own resources"
  ON resources FOR SELECT
  USING (uploaded_by = auth.uid());

-- Admins can view all resources
CREATE POLICY "Admins can view all resources"
  ON resources FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Authenticated users can insert resources
CREATE POLICY "Authenticated users can insert resources"
  ON resources FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Users can update their own resources (only if pending)
CREATE POLICY "Users can update own pending resources"
  ON resources FOR UPDATE
  USING (
    uploaded_by = auth.uid() AND status = 'pending'
  )
  WITH CHECK (
    uploaded_by = auth.uid() AND status = 'pending'
  );

-- Only admins can approve/reject resources
CREATE POLICY "Admins can approve/reject resources"
  ON resources FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Only admins can delete resources
CREATE POLICY "Admins can delete resources"
  ON resources FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- CONTRIBUTION POINTS TABLE POLICIES
-- ============================================

-- Everyone can view contribution points
CREATE POLICY "Everyone can view contribution points"
  ON contribution_points FOR SELECT
  USING (true);

-- Only admins can insert points (prevents users from awarding themselves)
CREATE POLICY "Only admins can insert points"
  ON contribution_points FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- No one can update points (prevents modification)
CREATE POLICY "No updates to points"
  ON contribution_points FOR UPDATE
  USING (false);

-- Only admins can delete points
CREATE POLICY "Admins can delete points"
  ON contribution_points FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- NOTICES TABLE POLICIES
-- ============================================

-- Everyone can view notices
CREATE POLICY "Everyone can view notices"
  ON notices FOR SELECT
  USING (true);

-- Only admins can insert notices
CREATE POLICY "Admins can insert notices"
  ON notices FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Only admins can update notices
CREATE POLICY "Admins can update notices"
  ON notices FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Only admins can delete notices
CREATE POLICY "Admins can delete notices"
  ON notices FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- ACADEMIC EVENTS TABLE POLICIES
-- ============================================

-- Everyone can view events
CREATE POLICY "Everyone can view events"
  ON academic_events FOR SELECT
  USING (true);

-- Only admins can insert events
CREATE POLICY "Admins can insert events"
  ON academic_events FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Only admins can update events
CREATE POLICY "Admins can update events"
  ON academic_events FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Only admins can delete events
CREATE POLICY "Admins can delete events"
  ON academic_events FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
