// Saves and loads student data (course registrations, late registrations, profile)
// from the MySQL backend when the user has a real JWT, otherwise localStorage only.

import api from './api';

const isRealJwt = (token) => {
  if (!token) return false;
  const parts = token.split('.');
  return parts.length === 3 && token.startsWith('eyJ');
};

const getToken = () => localStorage.getItem('authToken');

// ── Profile ────────────────────────────────────────────────────────────────────

export const getProfile = async (email) => {
  if (isRealJwt(getToken())) {
    try {
      const res = await api.get('/v1/student/profile');
      if (res.data?.success) return res.data.data;
    } catch {}
  }
  // localStorage fallback
  try { return JSON.parse(localStorage.getItem(`diu_profile_${email}`)) || {}; } catch { return {}; }
};

export const saveProfile = async (email, profileData) => {
  // Always save to localStorage
  localStorage.setItem(`diu_profile_${email}`, JSON.stringify(profileData));

  if (isRealJwt(getToken())) {
    try {
      await api.put('/v1/student/profile', profileData);
    } catch {}
  }
};

// ── Course Registrations ────────────────────────────────────────────────────────

export const getCourseRegistrations = async (email) => {
  if (isRealJwt(getToken())) {
    try {
      const res = await api.get('/v1/student/registrations');
      if (res.data?.success) {
        return res.data.data.map(r => ({
          ...r,
          courses: parseJson(r.coursesJson, []),
        }));
      }
    } catch {}
  }
  // localStorage fallback
  try {
    const all = JSON.parse(localStorage.getItem('diu_course_registrations') || '[]');
    return all.filter(r => r.email === email);
  } catch { return []; }
};

export const saveCourseRegistration = async (email, { semester, courses, totalCredits, totalFee, status = 'APPROVED' }) => {
  const record = { email, semester, courses, totalCredits, totalFee, status, registeredAt: new Date().toISOString() };

  // Save to localStorage
  const all = JSON.parse(localStorage.getItem('diu_course_registrations') || '[]');
  localStorage.setItem('diu_course_registrations', JSON.stringify([record, ...all]));

  if (isRealJwt(getToken())) {
    try {
      await api.post('/v1/student/registrations', {
        semester,
        coursesJson: JSON.stringify(courses),
        totalCredits,
        totalFee,
        status,
      });
    } catch {}
  }
};

// ── Late Registrations ─────────────────────────────────────────────────────────

export const getLateRegistrations = async (email) => {
  if (isRealJwt(getToken())) {
    try {
      const res = await api.get('/v1/student/late-registrations');
      if (res.data?.success) {
        return res.data.data.map(r => ({
          ...r,
          courses: parseJson(r.coursesJson, []),
        }));
      }
    } catch {}
  }
  try {
    const all = JSON.parse(localStorage.getItem('diu_late_requests') || '[]');
    return all.filter(r => r.studentEmail === email);
  } catch { return []; }
};

export const saveLateRegistration = async (email, { semester, courses, reason, evidenceCount, status = 'SUBMITTED' }) => {
  if (isRealJwt(getToken())) {
    try {
      await api.post('/v1/student/late-registrations', {
        semester,
        coursesJson: JSON.stringify(courses),
        reason,
        evidenceCount,
        status,
      });
    } catch {}
  }
};

// ── Active Enrollment (current semester, fixed once approved) ──────────────────

export const saveActiveEnrollment = (email, { semester, courses, totalCredits, totalFee, registeredAt }) => {
  const record = { email, semester, courses, totalCredits, totalFee, registeredAt, status: 'ENROLLED' };
  localStorage.setItem(`diu_active_enrollment_${email}`, JSON.stringify(record));
  // Also keep a per-semester snapshot so history is preserved
  localStorage.setItem(`diu_enrollment_${email}_${semester}`, JSON.stringify(record));
};

export const getActiveEnrollment = (email) => {
  try {
    const record = localStorage.getItem(`diu_active_enrollment_${email}`);
    return record ? JSON.parse(record) : null;
  } catch { return null; }
};

export const getEnrollmentBySemester = (email, semester) => {
  try {
    const record = localStorage.getItem(`diu_enrollment_${email}_${semester}`);
    return record ? JSON.parse(record) : null;
  } catch { return null; }
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function parseJson(str, fallback) {
  try { return JSON.parse(str); } catch { return fallback; }
}
