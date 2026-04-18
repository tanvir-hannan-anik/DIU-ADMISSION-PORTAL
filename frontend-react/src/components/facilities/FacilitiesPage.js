import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigation } from '../common/Navigation';
import { Footer } from '../common/Footer';

const CLUBS = [
  {
    name: 'Programming Club', icon: 'terminal',
    desc: 'High-performance computing lab with dual-monitor workstations, AI/ML software, and fiber-optic connectivity. Hackathons, competitive programming & open-source sprints every week.',
    members: 426, active: true,
    type: 'large',
    badge: 'ACTIVE NOW', badgeColor: 'text-secondary',
  },
  {
    name: 'Robotics Lab', icon: 'precision_manufacturing',
    desc: 'Equipped with 3D printers, CNC machines, Arduino/Raspberry Pi kits, and modular workbench systems for rapid prototyping.',
    members: 184, active: true,
    type: 'dark',
    progress: 75,
  },
  {
    name: 'Creative Studio', icon: 'palette',
    desc: 'Wacom Cintiq stations, wide-format printers, and digital illustration suites for the visual arts community.',
    members: 92,
    type: 'accent',
    accentBg: 'bg-[#ffdcc3]', accentText: 'text-[#6e3900]',
  },
  {
    name: 'The Hatchery', icon: 'rocket_launch',
    desc: 'Incubation space for student startups with mentorship sessions, seed funding pitches, and industry advisor access.',
    members: 78,
    type: 'image',
    badge: 'Next Pitch: Friday', badgeColor: 'text-secondary',
  },
  {
    name: 'Sound Forge', icon: 'music_note',
    desc: 'Acoustically treated recording studios and practice rooms for solo or ensemble sessions, music production & live performance prep.',
    members: 112,
    type: 'accent',
    accentBg: 'bg-[#82f5c1]/40', accentText: 'text-[#005137]',
  },
  {
    name: 'Sports Club', icon: 'sports_soccer',
    desc: 'Cricket, football, badminton, volleyball & athletics programs. Annual inter-department tournaments and national-level athlete development.',
    members: 620, active: true,
    type: 'large',
    badge: 'ACTIVE NOW', badgeColor: 'text-secondary',
  },
  {
    name: 'Photography Club', icon: 'camera_alt',
    desc: 'DSLR workshops, studio lighting rigs, outdoor field trips, and annual photo exhibition. Adobe Lightroom & Photoshop training included.',
    members: 135,
    type: 'dark',
    progress: 55,
  },
  {
    name: 'Debate & Model UN', icon: 'record_voice_over',
    desc: 'Public speaking, parliamentary debate competitions, mock UN assemblies & national-level inter-university seminars.',
    members: 160,
    type: 'accent',
    accentBg: 'bg-amber-100', accentText: 'text-amber-800',
  },
  {
    name: 'Science & Research', icon: 'science',
    desc: 'Research projects, science olympiads, lab experiments and collaboration with faculty on published papers and grant proposals.',
    members: 190,
    type: 'image',
    badge: 'New Projects Open', badgeColor: 'text-primary',
  },
  {
    name: 'Film & Media Club', icon: 'movie',
    desc: 'Short films, documentary production, scriptwriting workshops & media literacy programs with professional-grade editing suites.',
    members: 108,
    type: 'accent',
    accentBg: 'bg-rose-100', accentText: 'text-rose-800',
  },
  {
    name: 'Volunteer & Social', icon: 'volunteer_activism',
    desc: 'Community service drives, blood donation camps, environmental campaigns, and NGO partnership programs across Bangladesh.',
    members: 310, active: true,
    type: 'large',
    badge: 'ACTIVE NOW', badgeColor: 'text-secondary',
  },
  {
    name: 'Mathematics Society', icon: 'calculate',
    desc: 'Math olympiad preparation, problem-solving workshops, and collaborative research in applied mathematics and statistics.',
    members: 95,
    type: 'dark',
    progress: 40,
  },
  {
    name: 'Language & Literature', icon: 'translate',
    desc: 'English proficiency, creative writing, book reading circles, literary magazine publishing, and inter-varsity elocution contests.',
    members: 145,
    type: 'accent',
    accentBg: 'bg-teal-100', accentText: 'text-teal-800',
  },
  {
    name: 'Environment & Green', icon: 'eco',
    desc: 'Tree plantation drives, sustainability campaigns, solar energy projects, and annual Green Campus Initiative with DIU administration.',
    members: 220,
    type: 'image',
    badge: 'Go Green 2025', badgeColor: 'text-secondary',
  },
  {
    name: 'Cyber Security Club', icon: 'shield',
    desc: 'Ethical hacking workshops, CTF competitions, network security labs, and industry-partnered internship pathways in cybersecurity.',
    members: 175, active: true,
    type: 'accent',
    accentBg: 'bg-[#dfe0ff]', accentText: 'text-[#00117a]',
  },
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
    { title: "Software Testing: A Craftsman's Approach", author: 'Paul Jorgensen', edition: '4th Ed', copies: 6 },
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

const HOSTELS = [
  {
    gender: 'boys',
    halls: [
      { name: 'Younus Khan Scholar Garden 1', blocks: ['Block A', 'Block B'] },
      { name: 'Younus Khan Scholar Garden 2', blocks: ['Block A', 'Block B'] },
      { name: 'Younus Khan Scholar Garden 3', blocks: [] },
    ],
    features: ['AC & Non-AC rooms available', 'Common room & study lounge', 'Dining hall with varied menu', 'High-speed WiFi throughout', '24/7 security & CCTV', 'Indoor games & recreation'],
  },
  {
    gender: 'girls',
    halls: [
      { name: 'Rowshan Ara Scholars Garden 1', blocks: [] },
      { name: 'Rowshan Ara Scholars Garden 2', blocks: [] },
      { name: 'Rowshan Ara Scholars Garden 3', blocks: [] },
    ],
    features: ['Dedicated female-only floors', 'Study & recreation rooms', 'In-house cafeteria', 'CCTV monitoring on all floors', 'Resident female warden', 'Prayer room & garden'],
  },
];

const AVATAR_COLORS = ['bg-blue-500', 'bg-violet-500', 'bg-pink-500', 'bg-amber-500'];

const LargeCard = ({ club }) => (
  <div className="md:col-span-8 group cursor-pointer">
    <div className="h-full bg-surface-container-lowest rounded-xl p-10 flex flex-col justify-between shadow-[0px_12px_32px_rgba(23,28,31,0.06)] transition-all duration-300 hover:-translate-y-2">
      <div>
        <div className="flex justify-between items-start mb-12">
          <div className="w-16 h-16 bg-primary-container flex items-center justify-center rounded-xl">
            <span className="material-symbols-outlined text-4xl text-white" style={{ fontVariationSettings: "'FILL' 1" }}>{club.icon}</span>
          </div>
          {club.badge && (
            <span className="text-sm font-bold text-secondary flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse inline-block" />
              {club.badge}
            </span>
          )}
        </div>
        <h3 className="text-4xl font-bold text-primary mb-4 tracking-tight">{club.name}</h3>
        <p className="text-lg text-on-surface-variant max-w-xl leading-relaxed mb-8">{club.desc}</p>
      </div>
      <div className="flex items-center justify-between border-t border-outline-variant/15 pt-8">
        <div className="flex items-center gap-4">
          <div className="flex -space-x-3">
            {AVATAR_COLORS.slice(0, 3).map((c, i) => (
              <div key={i} className={`w-10 h-10 rounded-full border-2 border-white ${c} flex items-center justify-center text-white text-xs font-bold`}>
                {String.fromCharCode(65 + i)}
              </div>
            ))}
            <div className="w-10 h-10 rounded-full border-2 border-white bg-surface-container-high flex items-center justify-center text-xs font-bold text-on-surface-variant">
              +{club.members - 3}
            </div>
          </div>
          <span className="text-sm font-medium text-on-surface-variant">{club.members} Members</span>
        </div>
        <button className="flex items-center gap-2 text-primary font-bold hover:gap-4 transition-all">
          View Facility <span className="material-symbols-outlined">arrow_forward</span>
        </button>
      </div>
    </div>
  </div>
);

const DarkCard = ({ club }) => (
  <div className="md:col-span-4 group cursor-pointer">
    <div className="h-full bg-primary-container rounded-xl p-10 text-white flex flex-col justify-between shadow-[0px_12px_32px_rgba(0,30,180,0.15)] transition-all duration-300 hover:-translate-y-2">
      <div>
        <div className="w-16 h-16 bg-white/20 backdrop-blur-xl flex items-center justify-center rounded-xl mb-12">
          <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>{club.icon}</span>
        </div>
        <h3 className="text-3xl font-bold mb-4 tracking-tight">{club.name}</h3>
        <p className="text-on-primary-container/80 leading-relaxed mb-8">{club.desc}</p>
      </div>
      <div className="flex flex-col gap-4">
        <div className="text-sm font-medium text-on-primary-container">{club.members} Active Members</div>
        {club.progress !== undefined && (
          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-white rounded-full" style={{ width: `${club.progress}%` }} />
          </div>
        )}
      </div>
    </div>
  </div>
);

const AccentCard = ({ club }) => (
  <div className="md:col-span-4 group cursor-pointer">
    <div className="h-full bg-surface-container-lowest rounded-xl p-10 flex flex-col justify-between shadow-[0px_12px_32px_rgba(23,28,31,0.06)] transition-all duration-300 hover:-translate-y-2">
      <div>
        <div className={`w-14 h-14 ${club.accentBg || 'bg-tertiary-fixed'} flex items-center justify-center rounded-xl mb-10`}>
          <span className={`material-symbols-outlined text-3xl ${club.accentText || 'text-on-tertiary-fixed-variant'}`} style={{ fontVariationSettings: "'FILL' 1" }}>{club.icon}</span>
        </div>
        <h3 className="text-2xl font-bold text-primary mb-3">{club.name}</h3>
        <p className="text-on-surface-variant text-sm leading-relaxed">{club.desc}</p>
      </div>
      <div className="mt-8 flex items-center justify-between">
        <span className="text-sm font-bold text-on-surface-variant">{club.members} Members</span>
        <span className="material-symbols-outlined text-outline">open_in_new</span>
      </div>
    </div>
  </div>
);

const ImageCard = ({ club }) => (
  <div className="md:col-span-4 group cursor-pointer">
    <div className="h-full bg-surface-container-lowest rounded-xl overflow-hidden shadow-[0px_12px_32px_rgba(23,28,31,0.06)] transition-all duration-300 hover:-translate-y-2">
      <div className="h-40 bg-gradient-to-br from-surface-container-high to-surface-container-highest flex items-center justify-center">
        <span className="material-symbols-outlined text-7xl text-outline/30" style={{ fontVariationSettings: "'FILL' 1" }}>{club.icon}</span>
      </div>
      <div className="p-8">
        <h3 className="text-2xl font-bold text-primary mb-2">{club.name}</h3>
        <p className="text-on-surface-variant text-sm mb-6 leading-relaxed line-clamp-2">{club.desc}</p>
        {club.badge && (
          <div className={`flex items-center gap-2 text-xs font-bold ${club.badgeColor} uppercase tracking-widest`}>
            <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>{club.icon}</span>
            {club.badge}
          </div>
        )}
      </div>
    </div>
  </div>
);

const renderCard = (club) => {
  if (!club) return null;
  if (club.type === 'large') return <LargeCard key={club.name} club={club} />;
  if (club.type === 'dark')  return <DarkCard  key={club.name} club={club} />;
  if (club.type === 'image') return <ImageCard key={club.name} club={club} />;
  return <AccentCard key={club.name} club={club} />;
};

export const FacilitiesPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('clubs');
  const [activeDept, setActiveDept] = useState('CIS');
  const [bookSearch, setBookSearch] = useState('');

  const tabs = [
    { id: 'clubs',     label: 'Club Facilities',     icon: 'groups' },
    { id: 'transport', label: 'Transport',            icon: 'directions_bus' },
    { id: 'hostel',    label: 'Hostel',               icon: 'hotel' },
    { id: 'library',   label: 'Library',              icon: 'local_library' },
  ];

  const rowGroups = [[0,1],[2,3,4],[5,6],[7,8,9],[10,11],[12,13,14]];

  return (
    <div className="min-h-screen bg-background text-on-surface font-body">
      <Navigation />

      {/* ── Hero ── */}
      <header className="relative min-h-[620px] flex items-center justify-center overflow-hidden pt-16 md:pt-20"
        style={{ background: 'linear-gradient(135deg, #00117a 0%, #001eb4 40%, #1c31c0 70%, #3b4ed7 100%)' }}
      >
        {/* Mesh aurora blobs */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          {/* Large teal glow — top-right */}
          <div className="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle, #68dba9 0%, transparent 70%)' }} />
          {/* Violet glow — bottom-left */}
          <div className="absolute -bottom-24 -left-24 w-[500px] h-[500px] rounded-full opacity-25"
            style={{ background: 'radial-gradient(circle, #bcc2ff 0%, transparent 65%)' }} />
          {/* Mid indigo glow — center */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full opacity-10"
            style={{ background: 'radial-gradient(ellipse, #909cff 0%, transparent 70%)' }} />

          {/* Grid lines */}
          <div className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px),
                                linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)`,
              backgroundSize: '64px 64px',
            }}
          />
          {/* Diagonal accent stripe */}
          <div className="absolute top-0 right-0 w-1/2 h-full opacity-5"
            style={{ background: 'repeating-linear-gradient(-45deg, #ffffff 0px, #ffffff 1px, transparent 1px, transparent 32px)' }} />

          {/* Bottom fade to background */}
          <div className="absolute bottom-0 left-0 right-0 h-40"
            style={{ background: 'linear-gradient(to bottom, transparent, #f6fafe)' }} />
        </div>

        {/* Floating icon orbs */}
        <div className="absolute top-20 right-16 w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-sm hidden lg:flex">
          <span className="material-symbols-outlined text-2xl text-white/70" style={{ fontVariationSettings: "'FILL' 1" }}>groups</span>
        </div>
        <div className="absolute bottom-28 right-1/4 w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center backdrop-blur-sm hidden lg:flex">
          <span className="material-symbols-outlined text-lg text-white/60" style={{ fontVariationSettings: "'FILL' 1" }}>directions_bus</span>
        </div>
        <div className="absolute top-1/3 left-12 w-12 h-12 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center backdrop-blur-sm hidden lg:flex">
          <span className="material-symbols-outlined text-xl text-white/60" style={{ fontVariationSettings: "'FILL' 1" }}>local_library</span>
        </div>

        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto py-16">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-white/50 hover:text-white text-sm font-semibold mb-8 transition-colors"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Back to Home
          </button>

          {/* Badge pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-7 rounded-full border border-white/20 bg-white/10 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-[#68dba9] animate-pulse" />
            <span className="text-sm font-bold tracking-[0.2em] text-white/90 uppercase">Campus Life</span>
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-[7rem] font-black tracking-tighter mb-6 leading-[0.88]">
            <span className="text-white">University</span><br />
            <span style={{ color: '#909cff' }}>Facilities</span>
          </h1>

          <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto font-light leading-relaxed mb-14">
            Empowering the next generation of innovators, creators, and leaders through world-class collaborative spaces.
          </p>

          {/* Stats row */}
          <div className="flex flex-wrap justify-center gap-8 md:gap-12">
            {[
              { value: '60+',      label: 'Active Clubs',    icon: 'groups' },
              { value: '35+',      label: 'AC Buses',        icon: 'directions_bus' },
              { value: '350+',     label: 'Hostel Rooms',    icon: 'hotel' },
              { value: '100,000+', label: 'Library Books',   icon: 'menu_book' },
            ].map(s => (
              <div key={s.label} className="flex flex-col items-center gap-1.5">
                <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center mb-1">
                  <span className="material-symbols-outlined text-lg" style={{ color: '#909cff', fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
                </div>
                <div className="text-2xl md:text-3xl font-black text-white">{s.value}</div>
                <div className="text-[10px] text-white/45 uppercase tracking-[0.18em] font-semibold">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* ── Tabs (sticky) ── */}
      <div className="sticky top-0 z-30 bg-surface/95 backdrop-blur border-b border-outline-variant/20 shadow-sm">
        <div className="max-w-screen-2xl mx-auto flex gap-1 px-6 md:px-8 py-2">
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

      {/* ── Main Content ── */}
      <main className="relative -mt-0 pb-24 px-6 md:px-8 max-w-screen-2xl mx-auto pt-12">

        {/* ── Club Facilities ── */}
        {activeTab === 'clubs' && (
          <>
            <div className="space-y-8">
              {rowGroups.map((indices, rowIdx) => (
                <div key={rowIdx} className="grid grid-cols-1 md:grid-cols-12 gap-8">
                  {indices.map(i => CLUBS[i] ? renderCard(CLUBS[i]) : null)}
                </div>
              ))}
            </div>

            {/* CTA section */}
            <section className="mt-24 rounded-2xl bg-surface-container-low p-12 md:p-20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />
              <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                <div>
                  <h2 className="text-4xl md:text-5xl font-extrabold text-primary mb-8 tracking-tighter leading-tight">
                    Can't find a club that matches your vision?
                  </h2>
                  <p className="text-lg text-on-surface-variant leading-relaxed mb-10">
                    DIU empowers students to pioneer new communities. Submit a facility requisition proposal and start your own legacy today.
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <button className="px-8 py-4 bg-primary-container text-white font-bold rounded-xl shadow-lg hover:bg-on-primary-fixed-variant transition-colors flex items-center gap-3">
                      <span className="material-symbols-outlined">add_circle</span>
                      Apply for Facility
                    </button>
                    <button className="px-8 py-4 bg-transparent text-primary font-bold rounded-xl border border-outline-variant/30 hover:bg-surface-container-high transition-colors">
                      View Requirements
                    </button>
                  </div>
                </div>
                <div className="bg-surface-container-lowest p-8 rounded-xl shadow-xl">
                  <div className="space-y-6">
                    {[
                      { title: 'Space Allocation', desc: 'Secure dedicated physical footprints' },
                      { title: 'Budget Grants', desc: 'Annual funding for equipment and events' },
                      { title: 'Priority Booking', desc: 'Reservations for main hall venues' },
                    ].map(item => (
                      <div key={item.title} className="flex items-center gap-4 p-4 rounded-lg bg-surface-container">
                        <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                        <div>
                          <div className="font-bold text-primary">{item.title}</div>
                          <div className="text-xs text-on-surface-variant">{item.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        {/* ── Transport ── */}
        {activeTab === 'transport' && (
          <>
            {/* Network Overview Banner */}
            <div className="bg-surface-container rounded-3xl p-10 md:p-12 mb-16 relative overflow-hidden flex flex-col md:flex-row items-center gap-12">
              <div className="absolute top-0 right-0 w-1/2 h-full opacity-5 pointer-events-none select-none flex items-center justify-end pr-8">
                <span className="material-symbols-outlined text-primary" style={{ fontSize: '320px', fontVariationSettings: "'FILL' 1" }}>directions_bus</span>
              </div>
              <div className="relative z-10 flex-1">
                <h2 className="text-4xl md:text-5xl font-bold text-primary mb-5 tracking-tight">DIU Transport Network</h2>
                <p className="text-on-surface-variant text-lg mb-10 max-w-2xl leading-relaxed">
                  Our extensive network ensures every student has reliable access to the campus. With optimized routing and a growing fleet, we provide the most efficient commute across Dhaka and neighbouring districts.
                </p>
                <div className="flex flex-wrap gap-5">
                  {[
                    { icon: 'directions_bus', value: '35+', label: 'Active Fleet' },
                    { icon: 'map',            value: '5',   label: 'Major Corridors' },
                    { icon: 'place',          value: '200+',label: 'Stops' },
                  ].map(stat => (
                    <div key={stat.label} className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm flex items-center gap-4">
                      <span className="material-symbols-outlined text-4xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>{stat.icon}</span>
                      <div>
                        <p className="text-3xl font-black text-primary">{stat.value}</p>
                        <p className="text-xs uppercase tracking-widest text-on-surface-variant font-semibold">{stat.label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Map visual */}
              <div className="w-full md:w-80 aspect-square rounded-2xl overflow-hidden shadow-2xl relative group flex-shrink-0">
                <div className="w-full h-full bg-gradient-to-br from-primary to-on-primary-fixed-variant flex items-center justify-center">
                  <span className="material-symbols-outlined text-white/20" style={{ fontSize: '140px', fontVariationSettings: "'FILL' 1" }}>map</span>
                </div>
                <div className="absolute inset-0 bg-primary/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="bg-white text-primary px-6 py-3 rounded-full font-bold shadow-xl">View Network Map</button>
                </div>
              </div>
            </div>

            {/* Route Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-24">
              {TRANSPORT_ROUTES.map((r, i) => {
                const icons = ['location_city', 'nature_people', 'flight_takeoff', 'train', 'directions_boat'];
                const isExpress = i === 2;
                return (
                  <div key={r.route} className="bg-surface-container-lowest p-8 rounded-[2rem] hover:shadow-xl transition-all duration-300 group border border-transparent hover:border-outline-variant/15">
                    <div className="flex justify-between items-start mb-12">
                      <div className="w-16 h-16 rounded-2xl bg-primary-container/10 flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined text-3xl">{icons[i] || 'route'}</span>
                      </div>
                      {isExpress
                        ? <span className="px-4 py-1 rounded-full bg-tertiary-fixed text-on-tertiary-fixed-variant text-xs font-bold uppercase tracking-widest">Express</span>
                        : <span className="px-4 py-1 rounded-full bg-secondary-container text-on-secondary-container text-xs font-bold uppercase tracking-widest">Active</span>
                      }
                    </div>
                    <h3 className="text-2xl font-bold text-on-surface mb-4">{r.route}</h3>
                    <p className="text-on-surface-variant mb-8 line-clamp-2 text-sm leading-relaxed">{r.areas}</p>
                    <div className="flex items-center justify-between pt-8 border-t border-surface-container">
                      <div>
                        <p className="text-3xl font-black text-primary">{r.buses}</p>
                        <p className="text-xs uppercase tracking-tighter text-on-surface-variant">Daily Bus Count</p>
                      </div>
                      <button className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                        <span className="material-symbols-outlined">arrow_forward</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Smart Commuting Section */}
            <section className="-mx-6 md:-mx-8 px-6 md:px-8 py-20 bg-surface-container-low">
              <div className="max-w-screen-2xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                <div className="space-y-8">
                  <h2 className="text-5xl font-black text-primary leading-tight tracking-tighter">
                    Smart Commuting <br/>Defined
                  </h2>
                  <p className="text-on-surface-variant text-lg leading-relaxed">
                    Our transport facility isn't just about buses — it's a seamless integration of technology and movement. Students can track live locations, check seat availability, and receive instant delay notifications via the DIU mobile app.
                  </p>
                  <ul className="space-y-4">
                    {[
                      'Real-time GPS Tracking on Mobile',
                      'AC and Non-AC Luxury Fleet',
                      'Dedicated Emergency Backup Services',
                    ].map(item => (
                      <li key={item} className="flex items-center gap-4">
                        <span className="material-symbols-outlined text-primary bg-white p-2 rounded-lg shadow-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                        <span className="font-medium text-on-surface">{item}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="pt-4">
                    <button className="bg-primary text-white px-10 py-5 rounded-full font-bold text-lg hover:bg-on-primary-fixed-variant transition-all hover:-translate-y-1 shadow-xl">
                      Download Transport App
                    </button>
                  </div>
                </div>
                <div className="relative">
                  <div className="absolute -top-10 -left-10 w-40 h-40 bg-secondary-container/20 rounded-full blur-3xl pointer-events-none" />
                  <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-primary-container/10 rounded-full blur-3xl pointer-events-none" />
                  <div className="bg-white p-4 rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden">
                    <div className="w-full aspect-video rounded-[2rem] bg-gradient-to-br from-primary/80 to-on-primary-fixed-variant flex items-center justify-center">
                      <span className="material-symbols-outlined text-white/30" style={{ fontSize: '100px', fontVariationSettings: "'FILL' 1" }}>directions_bus</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        {/* ── Hostel ── */}
        {activeTab === 'hostel' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-6 space-y-8">
              <div className="bg-surface-container-lowest rounded-xl p-10 shadow-sm transition-all duration-300 hover:shadow-xl group">
                <div className="flex items-center justify-between mb-12">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-primary/5 flex items-center justify-center">
                      <span className="material-symbols-outlined text-4xl text-primary">apartment</span>
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold tracking-tight text-on-surface">Boys Hostel</h2>
                      <p className="text-on-surface-variant/60 font-medium">Ashulia Campus</p>
                    </div>
                  </div>
                  <span className="text-primary font-bold text-4xl opacity-10 group-hover:opacity-100 transition-opacity">01</span>
                </div>
                <div className="space-y-12">
                  <div>
                    <h3 className="text-xs uppercase tracking-[0.2em] text-primary mb-6 font-bold">Residential Gardens</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {HOSTELS[0].halls.map((hall, i) => (
                        <div key={hall.name} className="p-6 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors">
                          <p className="font-bold text-lg mb-1">{hall.name}</p>
                          <p className="text-sm text-on-surface-variant">
                            {['Undergraduate Residence', 'Post-Graduate Wing', 'International Hub'][i] || 'Residential Wing'}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xs uppercase tracking-[0.2em] text-primary mb-6 font-bold">Exclusive Amenities</h3>
                    <ul className="space-y-4">
                      {HOSTELS[0].features.map((f, i) => {
                        const icons = ['fitness_center','sports_esports','local_dining','laundry','security','wifi'];
                        return (
                          <li key={f} className="flex items-center gap-4 text-on-surface-variant">
                            <span className="material-symbols-outlined text-secondary">{icons[i] || 'check_circle'}</span>
                            <span className="font-medium">{f}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              </div>
              <div className="relative h-64 rounded-xl overflow-hidden shadow-sm">
                <div className="w-full h-full bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-white/20" style={{ fontSize: '120px', fontVariationSettings: "'FILL' 1" }}>apartment</span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent flex items-end p-8">
                  <p className="text-white font-bold text-xl">Integrated Study Spaces</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-6 space-y-8 lg:mt-16">
              <div className="bg-surface-container-lowest rounded-xl p-10 shadow-sm transition-all duration-300 hover:shadow-xl group">
                <div className="flex items-center justify-between mb-12">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-primary/5 flex items-center justify-center">
                      <span className="material-symbols-outlined text-4xl text-primary">domain</span>
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold tracking-tight text-on-surface">Girls Hostel</h2>
                      <p className="text-on-surface-variant/60 font-medium">Ashulia Campus</p>
                    </div>
                  </div>
                  <span className="text-primary font-bold text-4xl opacity-10 group-hover:opacity-100 transition-opacity">02</span>
                </div>
                <div className="space-y-12">
                  <div>
                    <h3 className="text-xs uppercase tracking-[0.2em] text-primary mb-6 font-bold">Residential Gardens</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {HOSTELS[1].halls.map((hall, i) => (
                        <div key={hall.name} className="p-6 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors">
                          <p className="font-bold text-lg mb-1">{hall.name}</p>
                          <p className="text-sm text-on-surface-variant">
                            {['Undergraduate Residence', 'Post-Graduate Wing', 'International Hub'][i] || 'Residential Wing'}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xs uppercase tracking-[0.2em] text-primary mb-6 font-bold">Exclusive Amenities</h3>
                    <ul className="space-y-4">
                      {HOSTELS[1].features.map((f, i) => {
                        const icons = ['female','menu_book','local_dining','security','supervisor_account','self_improvement'];
                        return (
                          <li key={f} className="flex items-center gap-4 text-on-surface-variant">
                            <span className="material-symbols-outlined text-secondary">{icons[i] || 'check_circle'}</span>
                            <span className="font-medium">{f}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              </div>
              <div className="relative h-64 rounded-xl overflow-hidden shadow-sm">
                <div className="w-full h-full bg-gradient-to-br from-pink-700 to-rose-900 flex items-center justify-center">
                  <span className="material-symbols-outlined text-white/20" style={{ fontSize: '120px', fontVariationSettings: "'FILL' 1" }}>domain</span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent flex items-end p-8">
                  <p className="text-white font-bold text-xl">Safe & Comfortable Living</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Library ── */}
        {activeTab === 'library' && (() => {
          const depts = Object.keys(LIBRARY_BOOKS);
          const books = (LIBRARY_BOOKS[activeDept] || []).filter(b =>
            !bookSearch ||
            b.title.toLowerCase().includes(bookSearch.toLowerCase()) ||
            b.author.toLowerCase().includes(bookSearch.toLowerCase())
          );
          const BOOK_SPINE_COLORS = ['bg-blue-500','bg-violet-500','bg-rose-500','bg-amber-500','bg-teal-500','bg-indigo-500','bg-pink-500','bg-green-500','bg-orange-500','bg-cyan-500'];

          return (
            <>
              <div className="grid grid-cols-12 gap-8 mb-8">
                <div className="col-span-12">
                  <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-8">
                    <div className="w-full md:w-1/2">
                      <label className="text-xs font-bold text-outline uppercase tracking-widest mb-3 block">Quick Search</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={bookSearch}
                          onChange={e => setBookSearch(e.target.value)}
                          placeholder="Search by title or author..."
                          className="w-full h-16 px-6 bg-surface-container-high rounded-xl border-none focus:ring-2 focus:ring-primary-container transition-all text-lg font-medium text-on-surface outline-none"
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                          <button className="bg-primary-container text-white px-6 h-10 rounded-lg font-bold hover:bg-on-primary-fixed-variant transition-colors">
                            Search
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-4 flex-wrap">
                      {depts.map(dept => (
                        <button
                          key={dept}
                          onClick={() => { setActiveDept(dept); setBookSearch(''); }}
                          className={`px-6 py-4 rounded-xl shadow-sm flex items-center gap-3 font-bold transition-all ${
                            activeDept === dept ? 'bg-primary-container text-white' : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container-low'
                          }`}
                        >
                          {dept}
                          <span className={`text-xs ${activeDept === dept ? 'text-on-primary-container/80' : 'text-outline'}`}>
                            {LIBRARY_BOOKS[dept].length}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="col-span-12">
                  <div className="bg-surface-container-lowest rounded-[2rem] overflow-hidden shadow-[0px_12px_32px_rgba(23,28,31,0.06)]">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-surface-container-low">
                          <th className="px-10 py-8 text-xs font-black text-outline uppercase tracking-[0.2em]">Book Title</th>
                          <th className="px-10 py-8 text-xs font-black text-outline uppercase tracking-[0.2em] hidden md:table-cell">Author</th>
                          <th className="px-10 py-8 text-xs font-black text-outline uppercase tracking-[0.2em] hidden sm:table-cell">Edition</th>
                          <th className="px-10 py-8 text-xs font-black text-outline uppercase tracking-[0.2em]">Copies</th>
                          <th className="px-10 py-8 text-xs font-black text-outline uppercase tracking-[0.2em]">Status</th>
                          <th className="px-10 py-8" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-container">
                        {books.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-10 py-20 text-center text-outline">
                              <span className="material-symbols-outlined text-5xl mb-3 block">search_off</span>
                              No books found matching "{bookSearch}"
                            </td>
                          </tr>
                        ) : books.map((book, i) => {
                          const inStock = book.copies > 0;
                          return (
                            <tr key={book.title} className="hover:bg-surface-container-low transition-colors duration-300">
                              <td className="px-10 py-8">
                                <div className="flex items-center gap-4">
                                  <div className={`w-12 h-16 ${BOOK_SPINE_COLORS[i % BOOK_SPINE_COLORS.length]} rounded shadow-sm overflow-hidden flex-shrink-0 flex items-center justify-center`}>
                                    <span className="material-symbols-outlined text-white text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>menu_book</span>
                                  </div>
                                  <div>
                                    <div className="font-bold text-on-surface text-base leading-snug">{book.title}</div>
                                    <div className="text-sm text-outline mt-0.5 md:hidden">{book.author}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-10 py-8 text-on-surface-variant font-medium hidden md:table-cell">{book.author}</td>
                              <td className="px-10 py-8 text-on-surface-variant hidden sm:table-cell">{book.edition}</td>
                              <td className="px-10 py-8">
                                <div className="flex items-center gap-2">
                                  <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${inStock ? 'bg-secondary-container/20 text-on-secondary-container' : 'bg-error-container/20 text-on-error-container'}`}>
                                    {book.copies}
                                  </span>
                                  <span className="text-sm text-outline">{inStock ? 'Available' : 'Waitlist'}</span>
                                </div>
                              </td>
                              <td className="px-10 py-8">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${inStock ? 'bg-secondary-container/20 text-on-secondary-container' : 'bg-error-container/20 text-on-error-container'}`}>
                                  {inStock ? 'In Stock' : 'Borrowed'}
                                </span>
                              </td>
                              <td className="px-10 py-8 text-right">
                                <button className="text-primary font-bold hover:underline underline-offset-4 transition-all">
                                  {inStock ? 'Reserve' : 'Waitlist'}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    <div className="p-10 flex items-center justify-between bg-surface-container-low">
                      <span className="text-sm text-outline">Showing {books.length} results in {activeDept}</span>
                      <div className="flex gap-2">
                        <button className="w-10 h-10 flex items-center justify-center rounded-lg bg-surface-container-lowest shadow-sm hover:bg-white text-on-surface transition-all">
                          <span className="material-symbols-outlined">chevron_left</span>
                        </button>
                        <button className="w-10 h-10 flex items-center justify-center rounded-lg bg-primary text-white shadow-md">1</button>
                        <button className="w-10 h-10 flex items-center justify-center rounded-lg bg-surface-container-lowest shadow-sm hover:bg-white text-on-surface transition-all">
                          <span className="material-symbols-outlined">chevron_right</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="col-span-1 md:col-span-2 p-10 bg-primary-container text-white rounded-[2rem] flex flex-col justify-between overflow-hidden relative">
                  <div className="relative z-10">
                    <h3 className="text-3xl font-bold mb-4 tracking-tight">Library at a Glance</h3>
                    <p className="text-blue-200 text-lg max-w-sm leading-relaxed">
                      Over <span className="text-white font-bold">100,000 books</span> across all disciplines. Access digital and physical resources anytime.
                    </p>
                  </div>
                  <div className="relative z-10 mt-12 flex items-baseline gap-2">
                    <span className="text-6xl font-black">100k+</span>
                    <span className="text-blue-200 uppercase tracking-widest text-xs font-bold">Total Books</span>
                  </div>
                  <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
                </div>
                <div className="p-10 bg-secondary-container/10 rounded-[2rem] border border-secondary-container/20 flex flex-col justify-center items-center text-center">
                  <span className="material-symbols-outlined text-secondary text-5xl mb-4" style={{ fontVariationSettings: "'FILL' 1" }}>book</span>
                  <div className="text-4xl font-black text-on-surface mb-1">{depts.length}</div>
                  <div className="text-sm text-outline font-bold uppercase tracking-widest">Departments</div>
                </div>
                <div className="p-10 bg-surface-container rounded-[2rem] flex flex-col justify-center items-center text-center">
                  <span className="material-symbols-outlined text-primary text-5xl mb-4" style={{ fontVariationSettings: "'FILL' 1" }}>event_available</span>
                  <div className="text-4xl font-black text-on-surface mb-1">8–9pm</div>
                  <div className="text-sm text-outline font-bold uppercase tracking-widest">Open Daily</div>
                </div>
              </div>
            </>
          );
        })()}

      </main>

      <Footer />
    </div>
  );
};
