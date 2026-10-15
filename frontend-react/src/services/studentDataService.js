// Saves and loads student data (course registrations, late registrations, profile)
// from the PostgreSQL backend when the user has a real JWT, otherwise localStorage only.

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

// ── Current semester resolution ─────────────────────────────────────────────────
// Used by Course Registration & Late Registration to auto-load the courses that
// belong to the student's current semester. Priority:
//   1. The semester saved on the student's profile (manually set / synced from DB)
//   2. An estimate derived from the student ID (mirrors ProfilePage's logic)
//   3. A sensible fallback

const SEMESTER_KEYS = Array.from({ length: 12 }, (_, i) => `Semester ${i + 1}`);

// Estimate the current semester number from a DIU student ID (e.g. "221-15-4906").
// batchPart "221" → year "22", intake "1"; ~6 months per semester. Capped like ProfilePage.
function estimateSemesterFromId(studentId) {
  if (!studentId) return null;
  const parts = String(studentId).split('-');
  if (parts.length < 2 || parts[0].length < 3) return null;
  const year      = parseInt('20' + parts[0].slice(0, 2), 10);
  const intakeNum = parts[0].slice(2);
  if (isNaN(year)) return null;
  const enrolledMonth = intakeNum === '2' ? 4 : intakeNum === '3' ? 8 : 0;
  const now    = new Date();
  const months = Math.max(0, (now.getFullYear() - year) * 12 + (now.getMonth() - enrolledMonth));
  const semNumber = Math.min(8, Math.floor(months / 6) + 1);
  return `Semester ${semNumber}`;
}

export const getCurrentSemesterKey = (email, fallback = 'Semester 5') => {
  try {
    const profile = JSON.parse(localStorage.getItem(`diu_profile_${email}`) || '{}');
    if (SEMESTER_KEYS.includes(profile.currentSemester)) return profile.currentSemester;
    const est = estimateSemesterFromId(profile.studentId);
    if (est && SEMESTER_KEYS.includes(est)) return est;
  } catch {}
  return fallback;
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function parseJson(str, fallback) {
  try { return JSON.parse(str); } catch { return fallback; }
}
