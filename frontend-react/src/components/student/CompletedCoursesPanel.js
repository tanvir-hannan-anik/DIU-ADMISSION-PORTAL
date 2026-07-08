import { useState } from 'react';

/**
 * Read-only "Completed Courses" panel.
 * Shows every course from the semesters BEFORE the student's current semester,
 * grouped by semester. These are display-only — no checkboxes, no remove, no
 * type change — because they've already been completed and cannot be edited.
 *
 * Shared by Course Registration and Late Registration so both behave identically.
 */

// Order semester keys numerically ("Semester 1" … "Semester 12"), tolerant of
// any extra keys a dynamic catalog might add.
function orderKeys(semesterKeys) {
  return [...semesterKeys].sort((a, b) => {
    const na = parseInt(String(a).replace(/\D/g, ''), 10);
    const nb = parseInt(String(b).replace(/\D/g, ''), 10);
    if (isNaN(na) || isNaN(nb)) return String(a).localeCompare(String(b));
    return na - nb;
  });
}

// Semester keys strictly before the current one.
export function completedSemesters(semesterKeys, currentSemester) {
  const ordered = orderKeys(semesterKeys);
  const idx = ordered.indexOf(currentSemester);
  return idx > 0 ? ordered.slice(0, idx) : [];
}

// Set of course codes completed in all prior semesters (used for retake picker).
export function completedCourseCodes(semesterData, semesterKeys, currentSemester) {
  const set = new Set();
  completedSemesters(semesterKeys, currentSemester).forEach(sem => {
    (semesterData[sem] || []).forEach(c => set.add(c.course_code));
  });
  return set;
}

export function CompletedCoursesPanel({ semesterData, semesterKeys, currentSemester }) {
  const [open, setOpen] = useState(true);
  const completed = completedSemesters(semesterKeys, currentSemester);

  // First semester → nothing completed yet.
  if (completed.length === 0) {
    return (
      <div className="flex items-start gap-2 text-sm px-1 py-2" style={{ color: '#464652' }}>
        <span className="material-symbols-outlined text-base" style={{ color: '#16a34a' }}>info</span>
        <span>You are in your first semester — no completed courses yet.</span>
      </div>
    );
  }

  const totalCompleted = completed.reduce((n, s) => n + (semesterData[s] || []).length, 0);

  return (
    <div className="rounded-xl overflow-hidden shadow-sm" style={{ background: 'white', border: '1px solid #e6e8ea' }}>
      {/* Header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between p-5 text-left transition-colors"
        style={{ borderBottom: open ? '1px solid #e6e8ea' : 'none' }}
        onMouseEnter={e => (e.currentTarget.style.background = '#f7f9fb')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#dcfce7' }}>
            <span className="material-symbols-outlined text-lg" style={{ color: '#16a34a', fontVariationSettings: "'FILL' 1" }}>task_alt</span>
          </div>
          <div>
            <h3 className="font-bold" style={{ color: '#000155' }}>
              Completed Courses
              <span className="ml-2 text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: '#dcfce7', color: '#15803d' }}>
                {totalCompleted}
              </span>
            </h3>
            <p className="text-xs mt-0.5" style={{ color: '#767684' }}>
              Semesters {completed.map(s => s.replace('Semester ', '')).join(', ')} · read-only
            </p>
          </div>
        </div>
        <span className="material-symbols-outlined transition-transform" style={{ color: '#767684', transform: open ? 'rotate(180deg)' : 'none' }}>
          expand_more
        </span>
      </button>

      {/* Body — grouped by semester */}
      {open && (
        <div className="p-4 space-y-4" style={{ background: '#fbfcfd' }}>
          {completed.map(sem => {
            const courses = semesterData[sem] || [];
            if (courses.length === 0) return null;
            return (
              <div key={sem}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                        style={{ background: '#eff6ff', color: '#0c1282' }}>{sem}</span>
                  <span className="text-[11px]" style={{ color: '#94a3b8' }}>{courses.length} courses</span>
                  <div className="flex-1 h-px" style={{ background: '#e6e8ea' }} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {courses.map(course => (
                    <div key={course.course_code}
                         className="flex items-center gap-2.5 px-3 py-2 rounded-lg"
                         style={{ background: 'white', border: '1px solid #e6e8ea' }}
                         title="Completed — cannot be edited">
                      <span className="material-symbols-outlined text-base flex-shrink-0"
                            style={{ color: '#16a34a', fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold" style={{ color: '#0c1282' }}>{course.course_code}</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: '#f2f4f6', color: '#464652' }}>
                            {course.credits} cr
                          </span>
                        </div>
                        <p className="text-xs truncate" style={{ color: '#191c1e' }}>{course.subject}</p>
                      </div>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full flex-shrink-0"
                            style={{ background: '#dcfce7', color: '#15803d' }}>Completed</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          <p className="text-[11px] flex items-center gap-1" style={{ color: '#94a3b8' }}>
            <span className="material-symbols-outlined text-sm">lock</span>
            Completed courses are locked. To repeat one, use <strong className="mx-1" style={{ color: '#b45309' }}>Retake Request</strong> below.
          </p>
        </div>
      )}
    </div>
  );
}

export default CompletedCoursesPanel;
