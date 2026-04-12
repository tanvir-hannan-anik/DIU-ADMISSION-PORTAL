import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigation } from '../common/Navigation';
import { Footer } from '../common/Footer';

const CLUBS = [
  { name: 'Programming Club', icon: 'code', desc: 'Competitive programming, hackathons & coding workshops', members: '500+', color: 'bg-blue-50 text-blue-600 border-blue-100' },
  { name: 'Robotics Club', icon: 'precision_manufacturing', desc: 'Robotics projects, automation research & competitions', members: '200+', color: 'bg-violet-50 text-violet-600 border-violet-100' },
  { name: 'Business Club', icon: 'business_center', desc: 'Entrepreneurship, case studies & business competitions', members: '350+', color: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
  { name: 'Cultural Club', icon: 'music_note', desc: 'Drama, music, art exhibitions & cultural festivals', members: '400+', color: 'bg-pink-50 text-pink-600 border-pink-100' },
  { name: 'Sports Club', icon: 'sports_soccer', desc: 'Cricket, football, badminton & athletics programs', members: '600+', color: 'bg-green-50 text-green-600 border-green-100' },
  { name: 'Debate Club', icon: 'record_voice_over', desc: 'Public speaking, debate competitions & seminars', members: '150+', color: 'bg-amber-50 text-amber-600 border-amber-100' },
  { name: 'Photography Club', icon: 'camera_alt', desc: 'Photography workshops, exhibitions & field trips', members: '120+', color: 'bg-cyan-50 text-cyan-600 border-cyan-100' },
  { name: 'Science Club', icon: 'science', desc: 'Research projects, science fairs & lab experiments', members: '180+', color: 'bg-teal-50 text-teal-600 border-teal-100' },
  { name: 'Film & Media Club', icon: 'movie', desc: 'Short films, documentary production & media literacy', members: '100+', color: 'bg-rose-50 text-rose-600 border-rose-100' },
  { name: 'Volunteer Club', icon: 'volunteer_activism', desc: 'Community service, blood donation & social campaigns', members: '300+', color: 'bg-lime-50 text-lime-600 border-lime-100' },
];

const TRANSPORT_ROUTES = [
  { route: 'Dhaka City Routes', buses: '15+', areas: 'Gulshan, Banani, Mirpur, Dhanmondi, Uttara, Motijheel' },
  { route: 'Savar & Ashulia', buses: '8+', areas: 'Savar, Ashulia, Hemayetpur, Nayarhat, Bhaluka' },
  { route: 'Gazipur Corridor', buses: '5+', areas: 'Gazipur, Tongi, Joydebpur, Konabari, Chandra' },
  { route: 'Narayanganj Routes', buses: '4+', areas: 'Narayanganj, Fatullah, Siddhirganj, Rupganj' },
  { route: 'Manikganj & Aricha', buses: '3+', areas: 'Manikganj, Singair, Aricha Ghat, Paturia' },
];

const LIBRARY_BOOKS = {
  CIS: [
    { title: 'Introduction to Computing & Information Systems', author: 'Ralph Stair & George Reynolds', edition: '13th Ed', copies: 12 },
    { title: 'Database System Concepts', author: 'Abraham Silberschatz', edition: '7th Ed', copies: 8 },
    { title: 'Computer Networks', author: 'Andrew S. Tanenbaum', edition: '5th Ed', copies: 10 },
    { title: 'Operating System Concepts', author: 'Abraham Silberschatz', edition: '10th Ed', copies: 9 },
    { title: 'Artificial Intelligence: A Modern Approach', author: 'Russell & Norvig', edition: '4th Ed', copies: 7 },
    { title: 'Data Structures and Algorithms', author: 'Thomas H. Cormen', edition: '3rd Ed', copies: 11 },
    { title: 'Object-Oriented Programming in C++', author: 'Robert Lafore', edition: '4th Ed', copies: 8 },
    { title: 'Web Engineering', author: 'San Murugesan', edition: '2nd Ed', copies: 6 },
    { title: 'Cloud Computing: Concepts & Technology', author: 'Thomas Erl', edition: '1st Ed', copies: 5 },
    { title: 'Machine Learning with Python', author: 'Sebastian Raschka', edition: '3rd Ed', copies: 6 },
  ],
  CSE: [
    { title: 'Introduction to Algorithms', author: 'Thomas H. Cormen', edition: '4th Ed', copies: 14 },
    { title: 'Computer Organization and Design', author: 'Patterson & Hennessy', edition: '6th Ed', copies: 9 },
    { title: 'Discrete Mathematics and Its Applications', author: 'Kenneth H. Rosen', edition: '8th Ed', copies: 10 },
    { title: 'Programming Language Pragmatics', author: 'Michael L. Scott', edition: '4th Ed', copies: 7 },
    { title: 'Compilers: Principles, Techniques & Tools', author: 'Alfred V. Aho', edition: '2nd Ed', copies: 6 },
    { title: 'Computer Security: Art and Science', author: 'Matt Bishop', edition: '2nd Ed', copies: 8 },
    { title: 'Artificial Intelligence', author: 'Elaine Rich & Kevin Knight', edition: '3rd Ed', copies: 9 },
    { title: 'Digital Image Processing', author: 'Gonzalez & Woods', edition: '4th Ed', copies: 5 },
  ],
  SWE: [
    { title: 'Software Engineering', author: 'Ian Sommerville', edition: '10th Ed', copies: 13 },
    { title: 'Clean Code', author: 'Robert C. Martin', edition: '1st Ed', copies: 10 },
    { title: 'The Pragmatic Programmer', author: 'Hunt & Thomas', edition: '20th Anniversary', copies: 8 },
    { title: 'Agile Software Development', author: 'Robert C. Martin', edition: '1st Ed', copies: 7 },
    { title: 'Design Patterns: Elements of Reusable OO Software', author: 'Gang of Four', edition: '1st Ed', copies: 9 },
    { title: 'Software Testing: A Craftsman\'s Approach', author: 'Paul Jorgensen', edition: '4th Ed', copies: 6 },
    { title: 'DevOps Handbook', author: 'Kim, Humble, Debois', edition: '2nd Ed', copies: 5 },
  ],
  EEE: [
    { title: 'Fundamentals of Electric Circuits', author: 'Alexander & Sadiku', edition: '6th Ed', copies: 11 },
    { title: 'Electronic Devices and Circuit Theory', author: 'Robert Boylestad', edition: '11th Ed', copies: 10 },
    { title: 'Microelectronics Circuit', author: 'Sedra & Smith', edition: '7th Ed', copies: 8 },
    { title: 'Signals and Systems', author: 'Oppenheim & Willsky', edition: '2nd Ed', copies: 7 },
    { title: 'Power Systems Analysis', author: 'Hadi Saadat', edition: '3rd Ed', copies: 6 },
    { title: 'Digital Signal Processing', author: 'Proakis & Manolakis', edition: '4th Ed', copies: 5 },
  ],
  BBA: [
    { title: 'Principles of Management', author: 'Robbins & Coulter', edition: '14th Ed', copies: 15 },
    { title: 'Financial Accounting', author: 'Warren, Reeve & Duchac', edition: '14th Ed', copies: 12 },
    { title: 'Marketing Management', author: 'Philip Kotler', edition: '16th Ed', copies: 11 },
    { title: 'Organizational Behavior', author: 'Stephen P. Robbins', edition: '18th Ed', copies: 10 },
    { title: 'Business Communication Today', author: 'Bovee & Thill', edition: '14th Ed', copies: 9 },
    { title: 'Fundamentals of Corporate Finance', author: 'Ross, Westerfield & Jordan', edition: '12th Ed', copies: 8 },
    { title: 'Human Resource Management', author: 'Gary Dessler', edition: '16th Ed', copies: 7 },
  ],
  English: [
    { title: 'An Introduction to Language', author: 'Fromkin, Rodman & Hyams', edition: '11th Ed', copies: 10 },
    { title: 'A Course in English Language Teaching', author: 'Penny Ur', edition: '2nd Ed', copies: 8 },
    { title: 'English Grammar in Use', author: 'Raymond Murphy', edition: '5th Ed', copies: 14 },
    { title: 'The Oxford Handbook of Applied Linguistics', author: 'Robert Kaplan', edition: '2nd Ed', copies: 6 },
    { title: 'Academic Writing for Graduate Students', author: 'Swales & Feak', edition: '3rd Ed', copies: 7 },
    { title: 'Discourse Analysis', author: 'Gillian Brown & George Yule', edition: '1st Ed', copies: 5 },
  ],
  MCT: [
    { title: 'Multimedia: Making It Work', author: 'Tay Vaughan', edition: '9th Ed', copies: 9 },
    { title: 'The Art of Game Design', author: 'Jesse Schell', edition: '3rd Ed', copies: 7 },
    { title: 'Digital Filmmaking', author: 'Mike Figgis', edition: '1st Ed', copies: 5 },
    { title: 'Fundamentals of Animation', author: 'Paul Wells', edition: '1st Ed', copies: 6 },
    { title: 'Adobe Photoshop Classroom in a Book', author: 'Adobe Creative Team', edition: '2024 Ed', copies: 8 },
    { title: 'Motion Graphics Design & Fine Art Animation', author: 'Jon Krasner', edition: '1st Ed', copies: 4 },
  ],
};

const DEPT_BOOK_COLORS = {
  CIS:     { bg: 'bg-cyan-500',   light: 'bg-cyan-50',   text: 'text-cyan-700',   border: 'border-cyan-200'   },
  CSE:     { bg: 'bg-blue-500',   light: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200'   },
  SWE:     { bg: 'bg-violet-500', light: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' },
  EEE:     { bg: 'bg-amber-500',  light: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200'  },
  BBA:     { bg: 'bg-indigo-500', light: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  English: { bg: 'bg-teal-500',   light: 'bg-teal-50',   text: 'text-teal-700',   border: 'border-teal-200'   },
  MCT:     { bg: 'bg-pink-500',   light: 'bg-pink-50',   text: 'text-pink-700',   border: 'border-pink-200'   },
};

const HOSTELS = [
  {
    gender: 'boys',
    color: 'from-blue-600 to-blue-800',
    icon: 'boy',
    halls: [
      { name: 'Younus Khan Scholar Garden 1', blocks: ['Block A', 'Block B'] },
      { name: 'Younus Khan Scholar Garden 2', blocks: ['Block A', 'Block B'] },
      { name: 'Younus Khan Scholar Garden 3', blocks: [] },
    ],
    features: ['AC & Non-AC rooms available', 'Common room & study lounge', 'Dining hall with varied menu', 'High-speed WiFi throughout', '24/7 security & CCTV', 'Indoor games & recreation'],
  },
  {
    gender: 'girls',
    color: 'from-pink-500 to-rose-700',
    icon: 'girl',
    halls: [
      { name: 'Rowshan Ara Scholars Garden 1', blocks: [] },
      { name: 'Rowshan Ara Scholars Garden 2', blocks: [] },
      { name: 'Rowshan Ara Scholars Garden 3', blocks: [] },
    ],
    features: ['Dedicated female-only floors', 'Study & recreation rooms', 'In-house cafeteria', 'CCTV monitoring on all floors', 'Resident female warden', 'Prayer room & garden'],
  },
];

export const FacilitiesPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('clubs');
  const [activeDept, setActiveDept] = useState('CIS');
  const [bookSearch, setBookSearch] = useState('');

  const tabs = [
    { id: 'clubs',     label: 'Club Facilities',     icon: 'groups' },
    { id: 'transport', label: 'Transport Facilities', icon: 'directions_bus' },
    { id: 'hostel',    label: 'Hostel Facilities',    icon: 'hotel' },
    { id: 'library',   label: 'Library',              icon: 'local_library' },
  ];

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
              Campus Life
            </span>
            <h1 className="font-headline text-4xl md:text-5xl font-extrabold mb-3 tracking-tight">
              University Facilities
            </h1>
            <p className="text-white/70 max-w-xl text-base">
              World-class campus amenities designed to support your academic journey, social life, and daily comfort at DIU.
            </p>
            {/* Stats bar */}
            <div className="flex flex-wrap gap-8 mt-8">
              {[
                { value: '60+', label: 'Active Clubs' },
                { value: '35+', label: 'AC Buses' },
                { value: '350+', label: 'Hostel Rooms' },
                { value: '100,000+', label: 'Library Books' },
              ].map(s => (
                <div key={s.label}>
                  <div className="text-2xl font-black font-headline text-primary-fixed">{s.value}</div>
                  <div className="text-xs text-white/60 uppercase tracking-wider font-semibold mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="sticky top-16 md:top-20 z-30 bg-surface border-b border-outline-variant/20 px-4 md:px-8 shadow-sm">
          <div className="max-w-screen-2xl mx-auto flex gap-1 py-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  activeTab === tab.id
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-outline hover:text-on-surface hover:bg-surface-container-low'
                }`}
              >
                <span
                  className="material-symbols-outlined text-base"
                  style={{ fontVariationSettings: activeTab === tab.id ? "'FILL' 1" : "'FILL' 0" }}
                >
                  {tab.icon}
                </span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="py-12 md:py-16 px-4 md:px-8">
          <div className="max-w-screen-2xl mx-auto">

            {/* ── Club Facilities ── */}
            {activeTab === 'clubs' && (
              <>
                <div className="mb-8">
                  <h2 className="font-headline text-2xl font-bold text-on-surface mb-1">Club Facilities</h2>
                  <p className="text-outline text-sm">DIU has 60+ student clubs covering academics, arts, sports, and social causes.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                  {CLUBS.map(club => {
                    const [bg, text, border] = club.color.split(' ');
                    return (
                      <div key={club.name} className={`group p-5 rounded-2xl border bg-white hover:shadow-lg transition-all duration-300 ${border}`}>
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${bg} ${border}`}>
                          <span className={`material-symbols-outlined ${text}`} style={{ fontVariationSettings: "'FILL' 1" }}>{club.icon}</span>
                        </div>
                        <h4 className="font-bold text-on-surface font-headline mb-1">{club.name}</h4>
                        <p className="text-xs text-outline leading-relaxed mb-3">{club.desc}</p>
                        <div className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${bg} ${text}`}>
                          <span className="material-symbols-outlined text-xs" style={{ fontSize: '14px' }}>group</span>
                          {club.members} members
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {/* ── Transport Facilities ── */}
            {activeTab === 'transport' && (
              <>
                <div className="mb-8">
                  <h2 className="font-headline text-2xl font-bold text-on-surface mb-1">Transport Facilities</h2>
                  <p className="text-outline text-sm">Air-conditioned buses covering all major areas of Dhaka and surrounding regions.</p>
                </div>
                <div className="bg-primary rounded-2xl p-6 md:p-8 text-white flex flex-col md:flex-row items-start md:items-center gap-6 mb-8">
                  <div className="w-16 h-16 rounded-2xl bg-white/15 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-4xl text-primary-fixed" style={{ fontVariationSettings: "'FILL' 1" }}>directions_bus</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-xl font-headline">DIU Transport Network</h3>
                    <p className="text-white/70 text-sm mt-1">Safe, punctual, and affordable transport connecting the campus to every corner of Dhaka and neighbouring districts.</p>
                  </div>
                  <div className="flex gap-8 flex-shrink-0">
                    <div className="text-center"><div className="text-3xl font-black">35+</div><div className="text-xs text-white/60 uppercase tracking-wider mt-0.5">AC Buses</div></div>
                    <div className="text-center"><div className="text-3xl font-black">5</div><div className="text-xs text-white/60 uppercase tracking-wider mt-0.5">Corridors</div></div>
                    <div className="text-center"><div className="text-3xl font-black">200+</div><div className="text-xs text-white/60 uppercase tracking-wider mt-0.5">Stops</div></div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {TRANSPORT_ROUTES.map(r => (
                    <div key={r.route} className="bg-white rounded-2xl p-6 border border-outline-variant/20 hover:shadow-md transition-all">
                      <div className="flex items-start gap-4">
                        <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>route</span>
                        </div>
                        <div>
                          <h4 className="font-bold text-on-surface font-headline">{r.route}</h4>
                          <p className="text-xs text-outline mt-1 leading-relaxed">{r.areas}</p>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-outline-variant/20 flex items-center gap-2 text-sm font-bold text-primary">
                        <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>directions_bus</span>
                        {r.buses} buses daily
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* ── Hostel Facilities ── */}
            {activeTab === 'hostel' && (
              <>
                <div className="mb-8">
                  <h2 className="font-headline text-2xl font-bold text-on-surface mb-1">Hostel Facilities</h2>
                  <p className="text-outline text-sm">Comfortable, safe, and affordable on-campus accommodation for boys and girls.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {HOSTELS.map(h => (
                    <div key={h.gender} className="bg-white rounded-2xl overflow-hidden border border-outline-variant/20 hover:shadow-xl transition-all duration-300">
                      {/* Header */}
                      <div className={`bg-gradient-to-br ${h.color} p-7 text-white relative overflow-hidden`}>
                        <div className="absolute top-0 right-0 opacity-10">
                          <span className="material-symbols-outlined" style={{ fontSize: '160px', fontVariationSettings: "'FILL' 1" }}>hotel</span>
                        </div>
                        <div className="flex items-center gap-4 mb-5">
                          <div className="w-13 h-13 rounded-2xl bg-white/20 flex items-center justify-center p-2.5">
                            <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>{h.icon}</span>
                          </div>
                          <div>
                            <div className="text-xs font-bold uppercase tracking-widest text-white/70 mb-0.5">
                              {h.gender === 'boys' ? "Boys' Hostel" : "Girls' Hostel"}
                            </div>
                            <div className="text-lg font-extrabold font-headline leading-tight">
                              {h.halls.length} Residential Gardens
                            </div>
                          </div>
                        </div>
                        {/* Hall list */}
                        <div className="space-y-2">
                          {h.halls.map(hall => (
                            <div key={hall.name} className="flex items-center gap-3 bg-white/15 rounded-xl px-4 py-2.5">
                              <span className="material-symbols-outlined text-white/80 text-base flex-shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>apartment</span>
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-sm text-white leading-tight">{hall.name}</div>
                                {hall.blocks.length > 0 && (
                                  <div className="flex gap-1.5 mt-1 flex-wrap">
                                    {hall.blocks.map(block => (
                                      <span key={block} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white/90">
                                        {block}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      {/* Amenities */}
                      <div className="p-6">
                        <div className="text-xs font-bold text-outline uppercase tracking-wider mb-4">Amenities & Features</div>
                        <div className="grid grid-cols-2 gap-3">
                          {h.features.map(f => (
                            <div key={f} className="flex items-start gap-2.5 text-sm text-on-surface">
                              <span className="material-symbols-outlined text-green-500 flex-shrink-0 mt-0.5" style={{ fontSize: '18px', fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                              {f}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* ── Library ── */}
            {activeTab === 'library' && (() => {
              const depts = Object.keys(LIBRARY_BOOKS);
              const c = DEPT_BOOK_COLORS[activeDept] || DEPT_BOOK_COLORS.CIS;
              const books = (LIBRARY_BOOKS[activeDept] || []).filter(b =>
                !bookSearch ||
                b.title.toLowerCase().includes(bookSearch.toLowerCase()) ||
                b.author.toLowerCase().includes(bookSearch.toLowerCase())
              );
              const totalBooks = Object.values(LIBRARY_BOOKS).reduce((s, arr) => s + arr.length, 0);

              return (
                <>
                  {/* Library notice banner */}
                  <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 mb-8">
                    <span className="material-symbols-outlined text-amber-500 flex-shrink-0 mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
                    <div>
                      <div className="font-bold text-amber-800 text-sm">View Only — Physical Access Required</div>
                      <div className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                        This is a catalogue of books available in the DIU Central Library. Students can browse the list here, but books must be borrowed in person at the library counter with a valid student ID.
                      </div>
                    </div>
                  </div>

                  {/* Library header */}
                  <div className="mb-6">
                    <h2 className="font-headline text-2xl font-bold text-on-surface mb-1">Library Book Catalogue</h2>
                    <p className="text-outline text-sm">Browse available books by department. Visit the DIU Central Library to borrow a copy.</p>
                  </div>

                  {/* Summary stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {[
                      { icon: 'menu_book',      value: '100,000+', label: 'Total Books'      },
                      { icon: 'category',       value: depts.length,    label: 'Departments'     },
                      { icon: 'access_time',    value: '8am – 9pm', label: 'Open Hours'      },
                      { icon: 'wifi',           value: 'Free',     label: 'Digital Access'  },
                    ].map(s => (
                      <div key={s.label} className="bg-white rounded-2xl p-5 border border-outline-variant/20 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
                        </div>
                        <div>
                          <div className="text-lg font-black text-on-surface font-headline">{s.value}</div>
                          <div className="text-xs text-outline">{s.label}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Department tabs + search */}
                  <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="flex flex-wrap gap-2 flex-1">
                      {depts.map(dept => {
                        const dc = DEPT_BOOK_COLORS[dept] || DEPT_BOOK_COLORS.CIS;
                        const isActive = activeDept === dept;
                        return (
                          <button
                            key={dept}
                            onClick={() => { setActiveDept(dept); setBookSearch(''); }}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold border transition-all ${
                              isActive ? `${dc.bg} text-white border-transparent shadow-sm` : `bg-white ${dc.text} ${dc.border} hover:${dc.light}`
                            }`}
                          >
                            {dept}
                            <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${isActive ? 'bg-white/25 text-white' : `${dc.light} ${dc.text}`}`}>
                              {LIBRARY_BOOKS[dept].length}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    <div className="relative w-full sm:w-60 flex-shrink-0">
                      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-base">search</span>
                      <input
                        type="text"
                        value={bookSearch}
                        onChange={e => setBookSearch(e.target.value)}
                        placeholder="Search title or author..."
                        className="w-full pl-9 pr-4 py-2.5 bg-white border border-outline-variant/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                      />
                    </div>
                  </div>

                  {/* Book list */}
                  {books.length === 0 ? (
                    <div className="text-center py-16 text-outline">
                      <span className="material-symbols-outlined text-5xl mb-3 block">search_off</span>
                      No books found matching "{bookSearch}"
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl border border-outline-variant/20 overflow-hidden">
                      {/* Table header */}
                      <div className={`grid grid-cols-12 px-5 py-3 ${c.light} border-b ${c.border}`}>
                        <div className={`col-span-1 text-xs font-bold uppercase tracking-wider ${c.text}`}>#</div>
                        <div className={`col-span-6 text-xs font-bold uppercase tracking-wider ${c.text}`}>Book Title</div>
                        <div className={`col-span-3 text-xs font-bold uppercase tracking-wider ${c.text} hidden md:block`}>Author</div>
                        <div className={`col-span-1 text-xs font-bold uppercase tracking-wider ${c.text} hidden sm:block`}>Edition</div>
                        <div className={`col-span-2 md:col-span-1 text-xs font-bold uppercase tracking-wider ${c.text} text-right`}>Copies</div>
                      </div>
                      {books.map((book, i) => (
                        <div
                          key={book.title}
                          className={`grid grid-cols-12 px-5 py-4 items-center border-b border-outline-variant/10 last:border-0 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-surface-container-low/40'} hover:bg-primary/5`}
                        >
                          <div className="col-span-1">
                            <span className={`text-xs font-black ${c.text}`}>{i + 1}</span>
                          </div>
                          <div className="col-span-6 pr-4">
                            <div className="font-semibold text-sm text-on-surface leading-snug">{book.title}</div>
                            <div className="text-xs text-outline mt-0.5 md:hidden">{book.author}</div>
                          </div>
                          <div className="col-span-3 text-sm text-outline hidden md:block pr-4">{book.author}</div>
                          <div className="col-span-1 hidden sm:block">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${c.light} ${c.text}`}>{book.edition}</span>
                          </div>
                          <div className="col-span-2 md:col-span-1 text-right">
                            <div className="inline-flex items-center gap-1 text-xs font-bold text-green-600">
                              <span className="material-symbols-outlined text-xs" style={{ fontSize: '14px', fontVariationSettings: "'FILL' 1" }}>inventory_2</span>
                              {book.copies}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Footer note */}
                  <div className="mt-6 flex items-center gap-2 text-xs text-outline">
                    <span className="material-symbols-outlined text-sm flex-shrink-0">lock</span>
                    Books can only be borrowed in person at the DIU Central Library. Online reservation is not available. Bring your student ID card.
                  </div>
                </>
              );
            })()}

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
