import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigation } from '../common/Navigation';
import { Footer } from '../common/Footer';
import { liveDataService } from '../../services/liveDataService';

const FACULTY_DATA = {
  CIS: [
    { name: 'Mr. Md. Sarwar Hossain Mollah', position: 'Associate Professor & Head', research: 'Information Systems, Cloud Architecture, Network Design', achievements: 'Head of Computing and Information System (CIS) Department · 15+ years academic experience' },
    { name: 'Prof. Dr. Bimal Chandra Das', position: 'Professor & Associate Dean', research: 'Computer Science, Research Management, Higher Education', achievements: 'Associate Dean, Faculty of Science & IT' },
    { name: 'Mr. Md. Biplob Hossain', position: 'Assistant Professor', research: 'Cloud Computing, Discrete Mathematics, Computer Architecture', achievements: 'Cloud Computing Research · Multiple national publications' },
    { name: 'Mr. Md. Nasimul Kader', position: 'Assistant Professor', research: 'Database Systems, OOP, Operating Systems', achievements: 'Industry Collaboration Projects · OS research contributor' },
    { name: 'Mr. Md. Ashiqul Islam', position: 'Industry-Academician', research: 'Industry 4.0, IoT, Embedded Systems, Smart Devices', achievements: 'IoT Lab Lead · Industry expert with 10+ years' },
    { name: 'Mr. Md. Mehedi Hassan', position: 'Senior Lecturer', research: 'Data Structures, Algorithms, Data Analysis, Big Data', achievements: 'Algorithm Optimization Research · DIU Innovation Award' },
    { name: 'Mr. Md. Faruk Hosen', position: 'Senior Lecturer', research: 'AI, Machine Learning for IoT, Structured Programming', achievements: 'ML for IoT Research Projects · Conference presenter' },
    { name: 'Ms. Sonia Nasrin', position: 'Lecturer', research: 'Computer Architecture, IS Management, Digital Systems', achievements: 'IS Management Research · Best Lecturer nomination 2024' },
    { name: 'Mr. Israfil', position: 'Lecturer', research: 'Web Engineering, Full-Stack Development, Web Technologies', achievements: 'Computing and Information System (CIS) Alumni · Web Technologies Expert' },
    { name: 'Ms. Tamanna Akter', position: 'Lecturer', research: 'English Language, Academic Writing, Communication Skills', achievements: 'Language & Communication Research · ELT publications' },
  ],
  CSE: [
    { name: 'Prof. Dr. Sheak Rashed Haider Noori', position: 'Professor', research: 'Artificial Intelligence, Machine Learning, Data Mining', achievements: '50+ research publications · IEEE senior member' },
    { name: 'Dr. Bibhuti Roy', position: 'Associate Professor', research: 'Computer Networks, Cyber Security, Distributed Systems', achievements: 'Multiple international conference papers · Network security grants' },
    { name: 'Dr. Imran Mahmud', position: 'Associate Professor', research: 'Software Engineering, IoT, Cloud Infrastructure', achievements: 'National research grants · Industry collaboration lead' },
  ],
  SWE: [
    { name: 'Prof. Dr. A. H. M. Saifullah Sadi', position: 'Professor', research: 'Agile Development, DevOps, Software Architecture, CI/CD', achievements: 'Software Engineering Excellence Award · 20+ publications' },
    { name: 'Mr. Palash Ahmed', position: 'Senior Lecturer', research: 'Product Engineering, Software Testing, QA Processes', achievements: 'Industry practitioner with 10+ years · Agile certified' },
    { name: 'Mr. S A M Matiur Rahman', position: 'Lecturer', research: 'Software Design Patterns, Web Development, API Design', achievements: 'Research in Modern Software Practices' },
  ],
  MCT: [
    { name: 'Mr. Md. Salah Uddin', position: 'Head of Department', research: 'Multimedia Technology, Digital Media Production', achievements: 'MCT Department Head · 12+ years experience' },
    { name: 'Prof. Dr. Md Kabirul Islam', position: 'Professor', research: 'Animation, Game Development, AR/VR, 3D Modelling', achievements: '30+ publications in multimedia computing · IEEE member' },
    { name: 'Dr. Shaikh Muhammad Allayear', position: 'Associate Professor', research: 'Computer Graphics, Visualization, Rendering Techniques', achievements: 'Multiple IEEE conference presentations · Best Paper Award' },
    { name: 'Mr. Arif Ahmed', position: 'Assistant Professor', research: 'Digital Marketing, Media Production, UX Design', achievements: 'Industry Award in Digital Content Creation' },
  ],
  ITM: [
    { name: 'Dr. Nusrat Jahan', position: 'Head of Department', research: 'IT Management, ERP Systems, Business Analytics', achievements: 'Department Head · IT management consultancy · Author' },
    { name: 'Dr. Imran Mahmud', position: 'Faculty', research: 'Information Technology, Business Systems Integration', achievements: 'Research in IT & Business alignment · Grants recipient' },
  ],
  English: [
    { name: 'Prof. Dr. Liza Sharmin', position: 'Professor & Head', research: 'Linguistics, Applied English, Communication Studies', achievements: 'Department Head · 20+ years academic experience · Author' },
    { name: 'Prof. Dr. Kudrat-E-Khuda Babu', position: 'Professor', research: 'English Literature, Academic Writing, Postcolonial Studies', achievements: 'Published author · Multiple national literary awards' },
    { name: 'Dr. Ehatasham Ul Hoque Eiten', position: 'Associate Professor', research: 'English Language Teaching, Discourse Analysis, ELT', achievements: 'ELT Research · International publications · Curriculum designer' },
  ],
  Accounting: [
    { name: 'Prof. Dr. Mohammad Rokibul Kabir', position: 'Professor', research: 'Financial Accounting, Auditing, Corporate Finance', achievements: '25+ years experience · Multiple textbooks authored' },
    { name: 'Prof. Dr. Syed Mizanur Rahman', position: 'Professor', research: 'Management Accounting, Business Finance, Taxation', achievements: 'Research in Financial Management · Industry advisor' },
    { name: 'Mr. Md. Arif Hassan', position: 'Lecturer', research: 'Accounting Principles, Tax Management, Cost Accounting', achievements: 'CPA certified · Industry practitioner with corporate experience' },
  ],
};

const DEPT_COLORS = {
  CIS:        { bg: 'bg-cyan-500',   light: 'bg-cyan-50',   text: 'text-cyan-600',   border: 'border-cyan-100',   header: 'from-cyan-600 to-cyan-800' },
  CSE:        { bg: 'bg-blue-500',   light: 'bg-blue-50',   text: 'text-blue-600',   border: 'border-blue-100',   header: 'from-blue-600 to-blue-800' },
  SWE:        { bg: 'bg-violet-500', light: 'bg-violet-50', text: 'text-violet-600', border: 'border-violet-100', header: 'from-violet-600 to-violet-800' },
  MCT:        { bg: 'bg-pink-500',   light: 'bg-pink-50',   text: 'text-pink-600',   border: 'border-pink-100',   header: 'from-pink-500 to-rose-700' },
  ITM:        { bg: 'bg-amber-500',  light: 'bg-amber-50',  text: 'text-amber-600',  border: 'border-amber-100',  header: 'from-amber-500 to-orange-700' },
  English:    { bg: 'bg-teal-500',   light: 'bg-teal-50',   text: 'text-teal-600',   border: 'border-teal-100',   header: 'from-teal-600 to-teal-800' },
  Accounting: { bg: 'bg-indigo-500', light: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100', header: 'from-indigo-600 to-indigo-900' },
};

function getInitials(name) {
  return name
    .replace(/^(Mr\.|Ms\.|Dr\.|Prof\.)\s*/i, '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('');
}

const totalFaculty = Object.values(FACULTY_DATA).reduce((s, arr) => s + arr.length, 0);

export const FacultyPage = () => {
  const navigate = useNavigate();
  const departments = Object.keys(FACULTY_DATA);
  const [activeDept, setActiveDept] = useState('CIS');
  const [search, setSearch] = useState('');

  // Live faculty data from DIU website
  const [liveData,       setLiveData]       = useState(null);
  const [liveLoading,    setLiveLoading]     = useState(true);
  const [liveError,      setLiveError]       = useState('');
  const [liveRefreshing, setLiveRefreshing]  = useState(false);
  const [showLive,       setShowLive]        = useState(false);
  const [liveSearch,     setLiveSearch]      = useState('');
  const [expandedProfile, setExpandedProfile] = useState(null);

  useEffect(() => {
    liveDataService.getFacultyList().then(res => {
      setLiveLoading(false);
      if (res.success && res.data) setLiveData(res.data);
      else setLiveError(res.error || 'Could not load live faculty data');
    });
  }, []);

  const handleLiveRefresh = async () => {
    setLiveRefreshing(true);
    setLiveError('');
    const res = await liveDataService.getFacultyList(true);
    setLiveRefreshing(false);
    if (res.success && res.data) setLiveData(res.data);
    else setLiveError(res.error || 'Refresh failed');
  };

  const filteredLiveFaculty = (liveData?.faculty || []).filter(f => {
    if (!liveSearch) return true;
    const q = liveSearch.toLowerCase();
    return (
      (f.name || '').toLowerCase().includes(q) ||
      (f.department || '').toLowerCase().includes(q) ||
      (f.designation || '').toLowerCase().includes(q)
    );
  });

  const colors = DEPT_COLORS[activeDept] || DEPT_COLORS.CIS;
  const teachers = (FACULTY_DATA[activeDept] || []).filter(t =>
    !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.position.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-surface">
      <Navigation />

      <main className="pt-16 md:pt-20">
        {/* Page Header */}
        <div className="bg-primary text-white py-12 md:py-16 px-4 md:px-8">
          <div className="max-w-screen-2xl mx-auto">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-white/70 hover:text-white text-sm font-semibold mb-6 transition-colors"
            >
              <span className="material-symbols-outlined text-base">arrow_back</span>
              Back to Home
            </button>
            <span className="inline-block px-3 py-1 rounded-full bg-white/15 text-white/90 text-xs font-bold uppercase tracking-widest mb-4">
              Academic Team
            </span>
            <h1 className="font-headline text-4xl md:text-5xl font-extrabold mb-3 tracking-tight">
              Faculty &amp; Teachers
            </h1>
            <p className="text-white/70 max-w-xl text-base">
              Meet our dedicated educators, researchers, and industry professionals who shape the future at Daffodil International University.
            </p>
            <div className="flex flex-wrap gap-8 mt-8">
              <div>
                <div className="text-2xl font-black font-headline text-primary-fixed">{totalFaculty}+</div>
                <div className="text-xs text-white/60 uppercase tracking-wider font-semibold mt-0.5">Faculty Members</div>
              </div>
              <div>
                <div className="text-2xl font-black font-headline text-primary-fixed">{departments.length}</div>
                <div className="text-xs text-white/60 uppercase tracking-wider font-semibold mt-0.5">Departments</div>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky tab bar */}
        <div className="sticky top-16 md:top-20 z-30 bg-surface border-b border-outline-variant/20 shadow-sm">
          <div className="max-w-screen-2xl mx-auto px-4 md:px-8 py-2 flex items-center gap-2 overflow-x-auto">
            {departments.map(dept => {
              const c = DEPT_COLORS[dept] || DEPT_COLORS.CIS;
              const isActive = activeDept === dept;
              return (
                <button
                  key={dept}
                  onClick={() => { setActiveDept(dept); setSearch(''); }}
                  className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition-all ${
                    isActive
                      ? `${c.bg} text-white border-transparent shadow-sm`
                      : `bg-white ${c.text} ${c.border} hover:${c.light}`
                  }`}
                >
                  {dept}
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${isActive ? 'bg-white/25 text-white' : `${c.light} ${c.text}`}`}>
                    {FACULTY_DATA[dept].length}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="py-10 md:py-14 px-4 md:px-8">
          <div className="max-w-screen-2xl mx-auto">

            {/* Dept header + search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <h2 className="font-headline text-2xl font-bold text-on-surface">{activeDept} Department</h2>
                <p className="text-outline text-sm mt-0.5">{FACULTY_DATA[activeDept].length} faculty members</p>
              </div>
              <div className="relative w-full sm:w-64">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-base">search</span>
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search by name or position..."
                  className="w-full pl-9 pr-4 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                />
              </div>
            </div>

            {/* Teacher cards grid */}
            {teachers.length === 0 ? (
              <div className="text-center py-20 text-outline">
                <span className="material-symbols-outlined text-5xl mb-3 block">search_off</span>
                No teachers found matching "{search}"
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {teachers.map(teacher => (
                  <div
                    key={teacher.name}
                    className="group bg-white rounded-2xl overflow-hidden border border-outline-variant/20 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                  >
                    {/* Top color stripe */}
                    <div className={`h-1.5 ${colors.bg}`} />

                    <div className="p-5">
                      {/* Avatar + name */}
                      <div className="flex items-start gap-3 mb-4">
                        <div className={`w-12 h-12 rounded-2xl ${colors.light} ${colors.text} flex items-center justify-center text-lg font-black font-headline flex-shrink-0 ${colors.border} border`}>
                          {getInitials(teacher.name)}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-on-surface text-sm leading-snug font-headline line-clamp-2">
                            {teacher.name}
                          </h4>
                          <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${colors.light} ${colors.text}`}>
                            {teacher.position}
                          </span>
                        </div>
                      </div>

                      {/* Research */}
                      <div className="mb-3">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-outline uppercase tracking-wider mb-1.5">
                          <span className="material-symbols-outlined" style={{ fontSize: '12px', fontVariationSettings: "'FILL' 1" }}>science</span>
                          Research Interests
                        </div>
                        <p className="text-xs text-on-surface leading-relaxed line-clamp-2">{teacher.research}</p>
                      </div>

                      {/* Achievements */}
                      <div className="pt-3 border-t border-outline-variant/20">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-outline uppercase tracking-wider mb-1.5">
                          <span className="material-symbols-outlined" style={{ fontSize: '12px', fontVariationSettings: "'FILL' 1" }}>emoji_events</span>
                          Achievements
                        </div>
                        <p className="text-xs text-outline leading-relaxed line-clamp-2">{teacher.achievements}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        </div>

        {/* ── Live Faculty Directory from DIU Website ── */}
        <div className="px-4 md:px-8 pb-14">
          <div className="max-w-screen-2xl mx-auto">
            <div className="border-t border-outline-variant/20 pt-10">
              <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
                <div>
                  <button
                    onClick={() => setShowLive(v => !v)}
                    className="flex items-center gap-2 group"
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse inline-block" />
                    <h2 className="font-headline text-xl font-bold text-on-surface group-hover:text-primary transition-colors">
                      Live Faculty Directory from DIU
                    </h2>
                    <span className="material-symbols-outlined text-outline text-base transition-transform" style={{ transform: showLive ? 'rotate(180deg)' : 'none' }}>
                      expand_more
                    </span>
                  </button>
                  <p className="text-sm text-outline mt-0.5 ml-5">
                    Real-time data from{' '}
                    <a href="https://faculty.daffodilvarsity.edu.bd/" target="_blank" rel="noopener noreferrer"
                      className="text-primary underline underline-offset-2">
                      faculty.daffodilvarsity.edu.bd
                    </a>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {liveData?.fetched_at && (
                    <span className="text-xs text-outline flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">schedule</span>
                      {liveData.fetched_at}
                    </span>
                  )}
                  <button
                    onClick={handleLiveRefresh}
                    disabled={liveRefreshing}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-white hover:bg-primary/85 disabled:opacity-50 transition-colors"
                  >
                    <span className={`material-symbols-outlined text-sm ${liveRefreshing ? 'animate-spin' : ''}`}>refresh</span>
                    {liveRefreshing ? 'Refreshing…' : 'Refresh'}
                  </button>
                </div>
              </div>

              {showLive && (
                <>
                  {liveLoading && (
                    <div className="bg-white rounded-2xl border border-outline-variant/20 p-8 text-center">
                      <div className="inline-block w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mb-3" />
                      <p className="text-xs text-outline">Fetching live faculty data…</p>
                    </div>
                  )}

                  {!liveLoading && liveError && (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-3">
                      <span className="material-symbols-outlined text-amber-500 text-xl mt-0.5">warning</span>
                      <div>
                        <p className="text-sm font-semibold text-amber-700">Could not load live faculty data</p>
                        <p className="text-xs text-amber-600 mt-0.5">{liveError}</p>
                      </div>
                    </div>
                  )}

                  {!liveLoading && liveData?.success && (
                    <>
                      {/* Search live faculty */}
                      <div className="flex items-center gap-3 mb-5">
                        <div className="relative flex-1 max-w-sm">
                          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-base">search</span>
                          <input
                            type="text"
                            value={liveSearch}
                            onChange={e => setLiveSearch(e.target.value)}
                            placeholder="Search live faculty…"
                            className="w-full pl-9 pr-4 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                          />
                        </div>
                        <span className="text-xs text-outline">
                          {filteredLiveFaculty.length} of {liveData.faculty?.length || 0} members
                        </span>
                      </div>

                      {filteredLiveFaculty.length === 0 && !liveData.faculty?.length && liveData.raw_text && (
                        <div className="bg-white rounded-2xl border border-outline-variant/20 p-5">
                          <p className="text-xs font-semibold text-outline mb-2">Raw faculty directory content:</p>
                          <pre className="text-xs text-on-surface-variant whitespace-pre-wrap leading-relaxed font-sans">
                            {liveData.raw_text.slice(0, 4000)}
                          </pre>
                        </div>
                      )}

                      {filteredLiveFaculty.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                          {filteredLiveFaculty.map((member, i) => (
                            <div
                              key={i}
                              className="bg-white rounded-2xl border border-outline-variant/20 p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer"
                              onClick={() => setExpandedProfile(expandedProfile === i ? null : i)}
                            >
                              <div className="flex items-start gap-3 mb-3">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-sm font-black font-headline flex-shrink-0">
                                  {member.name
                                    ? member.name.replace(/^(Mr\.|Ms\.|Dr\.|Prof\.)\s*/i, '').split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('')
                                    : '?'}
                                </div>
                                <div className="min-w-0">
                                  <h4 className="font-bold text-on-surface text-sm leading-snug line-clamp-2">{member.name || 'Unknown'}</h4>
                                  {member.designation && (
                                    <span className="inline-block mt-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                      {member.designation}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {member.department && (
                                <p className="text-xs text-outline mb-2 flex items-center gap-1">
                                  <span className="material-symbols-outlined text-xs">apartment</span>
                                  {member.department}
                                </p>
                              )}

                              {member.profile_url && (
                                <a
                                  href={member.profile_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={e => e.stopPropagation()}
                                  className="text-[10px] text-primary underline underline-offset-2"
                                >
                                  View official profile →
                                </a>
                              )}

                              {/* Expanded detail fields */}
                              {expandedProfile === i && (
                                <div className="mt-3 pt-3 border-t border-outline-variant/20 space-y-2">
                                  {[
                                    ['academic_qualification', 'school', 'Qualifications'],
                                    ['teaching_research_interest', 'science', 'Research Interests'],
                                    ['publications', 'article', 'Publications'],
                                    ['memberships', 'groups', 'Memberships'],
                                    ['training_experience', 'work', 'Experience'],
                                    ['previous_employment', 'business_center', 'Previous Employment'],
                                    ['personal_info', 'person', 'About'],
                                  ].map(([field, icon, label]) =>
                                    member[field] ? (
                                      <div key={field}>
                                        <div className="flex items-center gap-1 text-[10px] font-bold text-outline uppercase tracking-wider mb-0.5">
                                          <span className="material-symbols-outlined text-xs">{icon}</span>
                                          {label}
                                        </div>
                                        <p className="text-xs text-on-surface-variant leading-relaxed">{member[field]}</p>
                                      </div>
                                    ) : null
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      <p className="text-xs text-outline mt-4 flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">info</span>
                        Data sourced directly from DIU's official faculty directory. Cached for 1 hour. Click a card to expand profile details.
                      </p>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
