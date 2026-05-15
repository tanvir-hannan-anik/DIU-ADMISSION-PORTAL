"""
Curated Knowledge Seed
----------------------
Authoritative, hand-verified DIU facts (leadership, verified faculty, exact
eligibility rules, waiver/fee policy, ratings, CIS deep-dive). Previously these
lived inside one giant static system prompt; they are now discrete documents so
the RAG layer can retrieve only what each query needs.

These are HIGH-TRUST sources. Each entry is self-contained so a single
retrieved chunk reads coherently. Keep wording stable — the bot is required to
answer leadership / faculty / eligibility questions consistently.
"""

SEED_DOCS: list[dict] = [
    {
        "id": "seed-leadership",
        "title": "University Leadership (VC, Founder, Pro-VC)",
        "type": "leadership",
        "department": "",
        "text": (
            "Daffodil International University (DIU) leadership — always report exactly this:\n"
            "- Founder & Chairman: Dr. Md. Sabur Khan\n"
            "- Vice Chancellor: Professor Dr. M. R. Kabir\n"
            "- Pro-Vice Chancellor: Professor Mohammed Masum Iqbal, PhD"
        ),
    },
    {
        "id": "seed-overview",
        "title": "University Overview",
        "type": "overview",
        "department": "",
        "text": (
            "Daffodil International University (DIU) overview:\n"
            "- Location: Ashulia, Dhaka, Bangladesh (180-acre permanent green campus)\n"
            "- Students: 20,000+ from 20+ countries\n"
            "- Alumni: 55,000+ graduates across 19 countries\n"
            "- Ranking: #1 Private University in Bangladesh (2025)\n"
            "- Programs: 51 undergraduate & graduate programs across 6 faculties\n"
            "- Research Centers: 15+ specialized centers, 10+ innovation hubs\n"
            "- Contact: admission@daffodilvarsity.edu.bd\n"
            "- Apply Online: https://admission.daffodilvarsity.edu.bd"
        ),
    },
    {
        "id": "seed-department-list",
        "title": "Complete Department / Program List",
        "type": "department_list",
        "department": "",
        "text": (
            "DIU complete program list (return ALL when asked for the full list):\n\n"
            "Faculty of Science & Information Technology:\n"
            "- BSc in Computer Science & Engineering (CSE)\n"
            "- BSc in Computing and Information System (CIS) — #1 Fastest Growing 2025\n"
            "- BSc in Software Engineering (SWE)\n"
            "- BSc in Multimedia and Creative Technology (MCT)\n"
            "- BSc in Information Technology & Management (ITM)\n\n"
            "Faculty of Engineering:\n"
            "- BSc in Electrical & Electronic Engineering (EEE)\n"
            "- BSc in Civil Engineering (CE)\n"
            "- BSc in Information & Communication Engineering (ICE)\n"
            "- BSc in Textile Engineering (TE)\n"
            "- BSc in Robotics and Mechatronics Engineering (RME)\n"
            "- Bachelor of Architecture (B.Arch)\n\n"
            "Faculty of Business & Entrepreneurship:\n"
            "- BBA (General)\n- BBA in Accounting\n- BBA in Finance & Banking\n"
            "- BBA in Marketing\n- Bachelor of Real Estate (BRE)\n"
            "- Bachelor of Tourism and Hospitality Management (BTHM)\n"
            "- Bachelor of Innovation and Entrepreneurship (BE)\n\n"
            "Faculty of Health and Life Sciences:\n"
            "- Bachelor of Pharmacy — B. Pharm (Hons.)\n"
            "- Bachelor of Public Health (BPH)\n"
            "- BSc in Nutrition & Food Engineering (NFE)\n"
            "- BSc in Environmental Science & Disaster Management (ESDM)\n"
            "- BSc in Genetic Engineering and Biotechnology (GEB)\n"
            "- BSc in Physical Education and Sports Science (PESS)\n\n"
            "Faculty of Humanities & Social Sciences:\n"
            "- B.A. (Hons) in English\n- LL.B. (Hons.) in Law\n"
            "- BSc in Journalism, Media & Communication (JMC)\n"
            "- MSS in Journalism & Mass Communication (JMC — Graduate)"
        ),
    },
    {
        "id": "seed-faculty-cis",
        "title": "CIS Department Faculty (Verified)",
        "type": "faculty",
        "department": "CIS",
        "text": (
            "CIS Department Faculty (verified — never invent names beyond this list):\n"
            "- Mr. Md. Sarwar Hossain Mollah — Associate Professor & Head | Courses: Computer Fundamentals, Computer Networks, IS Architecture\n"
            "- Prof. Dr. Bimal Chandra Das — Associate Dean & Professor\n"
            "- Prof. Dr. Md. Fokhray Hossain — Dean, Faculty of Science & IT\n"
            "- Dr. Mohammed Nadir Bin Ali — Associate Professor (Part-time)\n"
            "- Dr. Syed Mohammed Shamsul Islam — Visiting Professor\n"
            "- Mr. Md. Biplob Hossain — Assistant Professor | Courses: Computer Architecture, Discrete Math, Cloud Computing\n"
            "- Mr. Md. Nasimul Kader — Assistant Professor | Courses: OOP, Database, Operating Systems\n"
            "- Mr. Md. Ashiqul Islam — Industry-Academician | Courses: Industry 4.0, IoT & Embedded Systems\n"
            "- Mr. Md. Mehedi Hassan — Lecturer (Sr. Scale) | Courses: Data Structure, Algorithms, Data Analysis\n"
            "- Mr. Md. Faruk Hosen — Lecturer (Sr. Scale) | Courses: Structured Programming, AI, ML for IoT\n"
            "- Ms. Sonia Nasrin — Lecturer | Courses: Computer Architecture, IS Management\n"
            "- Mr. Israfil — Lecturer | Courses: Website Development, Web Engineering\n"
            "- Ms. Tamanna Akter — Lecturer | Courses: English I, English II"
        ),
    },
    {
        "id": "seed-faculty-cse",
        "title": "CSE Department Faculty (Verified)",
        "type": "faculty",
        "department": "CSE",
        "text": (
            "CSE Department Faculty (verified):\n"
            "- Prof. Dr. Sheak Rashed Haider Noori — Professor\n"
            "- Dr. Bibhuti Roy — Associate Professor\n"
            "- Dr. Imran Mahmud — Associate Professor"
        ),
    },
    {
        "id": "seed-faculty-swe",
        "title": "SWE Department Faculty (Verified)",
        "type": "faculty",
        "department": "SWE",
        "text": (
            "SWE Department Faculty (verified):\n"
            "- Prof. Dr. A. H. M. Saifullah Sadi — Professor\n"
            "- Mr. Palash Ahmed — Senior Lecturer\n"
            "- Mr. S A M Matiur Rahman — Lecturer"
        ),
    },
    {
        "id": "seed-faculty-mct",
        "title": "MCT Department Faculty (Verified)",
        "type": "faculty",
        "department": "MCT",
        "text": (
            "MCT Department Faculty (verified):\n"
            "- Mr. Md. Salah Uddin — Head\n"
            "- Prof. Dr. Md Kabirul Islam — Professor\n"
            "- Dr. Shaikh Muhammad Allayear — Associate Professor\n"
            "- Mr. Arif Ahmed — Assistant Professor"
        ),
    },
    {
        "id": "seed-faculty-itm",
        "title": "ITM Department Faculty (Verified)",
        "type": "faculty",
        "department": "ITM",
        "text": (
            "ITM Department Faculty (verified):\n"
            "- Dr. Nusrat Jahan — Head\n"
            "- Dr. Imran Mahmud — Faculty"
        ),
    },
    {
        "id": "seed-faculty-english",
        "title": "English Department Faculty (Verified)",
        "type": "faculty",
        "department": "English",
        "text": (
            "English Department Faculty (verified):\n"
            "- Prof. Dr. Liza Sharmin — Professor & Head\n"
            "- Prof. Dr. Kudrat-E-Khuda Babu — Professor\n"
            "- Dr. Ehatasham Ul Hoque Eiten — Associate Professor"
        ),
    },
    {
        "id": "seed-faculty-accounting",
        "title": "Accounting Department Faculty (Verified)",
        "type": "faculty",
        "department": "Accounting",
        "text": (
            "Accounting Department Faculty (verified):\n"
            "- Prof. Dr. Mohammad Rokibul Kabir — Professor\n"
            "- Prof. Dr. Syed Mizanur Rahman — Professor\n"
            "- Mr. Md. Arif Hassan — Lecturer"
        ),
    },
    {
        "id": "seed-facilities",
        "title": "Campus Facilities",
        "type": "facilities",
        "department": "",
        "text": (
            "DIU campus facilities:\n"
            "- Labs: AI Lab, IoT Lab, Networking Lab, SE Lab, Agile Dev Lab, BI Lab, Robotics Lab, Cloud Computing Lab\n"
            "- Library: Digital library with 100,000+ books & e-journals, 24/7 access\n"
            "- Transport: 25+ AC buses covering all Dhaka districts\n"
            "- Hostel: Separate halls for boys & girls, 5 min from classrooms\n"
            "- Smart Campus: 30+ smart classroom features, high-speed WiFi across campus\n"
            "- Clubs: 60+ student clubs — Programming, Robotics, Business, Cultural, Sports, Debate\n"
            "- Career Center: DIU Career Center, Skill.jobs portal, Employability 360 program\n"
            "- Awards: #1 Private University Bangladesh 2025, QS Asia Rankings, Times Higher Education listed"
        ),
    },
    {
        "id": "seed-ratings",
        "title": "Department Ratings 2025",
        "type": "ratings",
        "department": "",
        "text": (
            "DIU department ratings (2025):\n"
            "- CIS — 9.5/10 | #1 Fastest Growing | Demand: Extremely High\n"
            "- CSE — 9.2/10 | Demand: Very High | Strong in AI, ML, competitive programming\n"
            "- SWE — 8.8/10 | Demand: High | DevOps, agile, product engineering\n"
            "- EEE — 8.5/10 | Demand: High | Power, telecom, electronics\n"
            "- BBA — 8.3/10 | Demand: High | Corporate, banking, entrepreneurship\n"
            "- Pharmacy — 8.2/10 | Demand: High | Healthcare & pharmaceutical sector\n"
            "- RME (Robotics) — 8.1/10 | Demand: Growing | Automation, manufacturing\n"
            "- MCT — 8.0/10 | Demand: Growing | Media, game dev, animation\n"
            "- CE — 7.8/10 | Demand: Steady | Construction, infrastructure\n"
            "- ITM — 7.8/10 | Demand: Moderate-High | IT management, ERP\n"
            "- ICE — 7.6/10 | Demand: Moderate | Telecom, electronics\n"
            "- Law — 7.5/10 | English — 7.5/10 | JMC — 7.3/10"
        ),
    },
    {
        "id": "seed-cis-catalog",
        "title": "CIS Department — Full Course Catalog",
        "type": "curriculum",
        "department": "CIS",
        "text": (
            "B.Sc. in Computing and Information System (CIS). Duration: 4 years "
            "(12 semesters — 3 per year). Credits: 136+. Semester fee: BDT 30,000 "
            "per 11 credits (Lab 1 cr, Theory 3 cr). Admission open to ALL groups "
            "(Science, Commerce, Arts).\n\n"
            "Year 1 — Foundation:\n"
            "  Sem 1: ENG101 English I | COF101 Computer Fundamentals | CIS121 Industry 4.0 | CIS115/L Structured Programming\n"
            "  Sem 2: CIS122/L Data Structure | CIS131 Computer Architecture | ENG102 English II | MAT101 Mathematics-I\n"
            "  Sem 3: CIS133/L Website Development | CIS132/L Algorithms | CIS123 Discrete Math | MAT201 Mathematics-II\n"
            "Year 2 — Core Computing:\n"
            "  Sem 4: CIS232/L Object Oriented Programming | CIS211/L Computer Networks | ACC101 Accounting\n"
            "  Sem 5: CIS222/L Database Management | FIN232 Financial Management | CIS241/L Operating Systems\n"
            "  Sem 6: CIS323/L IS Architecture | CIS313/L Artificial Intelligence | MGT422 Industrial Management\n"
            "Year 3 — Specialization:\n"
            "  Sem 7: CIS324/L Web Engineering | IoT336/L IoT & Embedded Systems | BI334 Data Analysis | ECO314 Economics\n"
            "  Sem 8: CIS414 IS Management | IoT429 Machine Learning for IoT | CIS435/L Cloud Computing\n"
            "  Sem 9: CIS331 Cybersecurity Fundamentals | CIS332 Human-Computer Interaction | CIS333/L Mobile Application Development\n"
            "Year 4 — Advanced & Capstone:\n"
            "  Sem 10: CIS421/L Big Data Analytics | CIS422 Software Project Management | CIS423 E-Commerce & Digital Business\n"
            "  Sem 11: CIS424/L Advanced AI & Deep Learning | CIS425 Blockchain & Distributed Systems | CIS426 Research Methodology\n"
            "  Sem 12: CIS497 Technical Seminar | CIS498 Industrial Internship | CIS499 Thesis / Capstone Project"
        ),
    },
    {
        "id": "seed-cis-research",
        "title": "CIS Department — Research & Labs",
        "type": "research",
        "department": "CIS",
        "text": (
            "CIS research & labs:\n"
            "- AI & Machine Learning Lab — NLP, computer vision, predictive analytics\n"
            "- IoT & Embedded Systems Lab — smart city, agriculture IoT, health monitoring\n"
            "- Business Intelligence Lab — ERP systems, data warehousing, analytics platforms\n"
            "- Ongoing: Smart Bangladesh initiative, ICT Division collaborations\n"
            "- Students publish in IEEE, Springer, Elsevier journals"
        ),
    },
    {
        "id": "seed-cis-alumni",
        "title": "CIS Department — Notable Alumni",
        "type": "alumni",
        "department": "CIS",
        "text": (
            "CIS alumni (verified — global placements):\n"
            "- Md. Shafiul Alam — Founder & CEO, Belancer\n"
            "- Moonmoon Khanam — Graduate Teaching Assistant, Auburn University, USA\n"
            "- Shaharuf Hossain — IT Operations Specialist, Ontario, Canada\n"
            "- Sonali Margaret Rozario — Software Engineer, Ontario, Canada\n"
            "- Fahima Nizam Nova — Software Engineer, Ørsted, Denmark\n"
            "- Prosenjit Chowdhury — MS Student, FAU Erlangen-Nürnberg, Germany\n"
            "- Al Kawsar Majumder — NOC Engineer, Envista Holdings Corporation\n"
            "- Fahadul Islam Shimak — IT Consultant, ICT Division, Bangladesh Government\n"
            "CIS alumni active in 10+ countries: USA, Canada, Denmark, Germany, UAE."
        ),
    },
    {
        "id": "seed-waiver-policy",
        "title": "Waiver & Fee Policy",
        "type": "waiver",
        "department": "",
        "text": (
            "Waiver policy (SSC + HSC GPA combined out of 10):\n"
            "- GPA = 10.00 → 100% waiver\n"
            "- GPA ≥ 9.00 → 100% (Merit Scholarship)\n"
            "- GPA ≥ 8.50 → 75% waiver\n"
            "- GPA ≥ 8.00 → 50% waiver\n"
            "- GPA ≥ 7.00 → 25% waiver\n"
            "- Below 7.00 → No waiver\n\n"
            "CIS fee structure: Semester tuition BDT 30,000 / 11 credits; "
            "one-time admission fee BDT 15,000; max 18 credits/semester. "
            "Payable = Tuition × (1 − Waiver%) + any retake/drop fees.\n\n"
            "Other scholarships: Need-based | Freedom Fighter Quota | Chairman "
            "Endowment Fund | Lutfar Rahman Scholarship | Razia Begum Scholarship "
            "| CSR-based (up to 100%)."
        ),
    },
    {
        "id": "seed-eligibility-sit",
        "title": "Eligibility — Faculty of Science & IT",
        "type": "eligibility",
        "department": "",
        "text": (
            "Eligibility (exact — never guess) — Faculty of Science & IT:\n"
            "- CSE: Science group only. Min 2.5 GPA each in SSC & HSC. Min 'C' in Physics & Mathematics. O/A-Level: 4 'B' + 3 'C' from 7 subjects; Physics & Mathematics required at both levels.\n"
            "- CIS: Any group (Science/Commerce/Arts). Min 2.5 GPA each in SSC & HSC. O/A-Level: 4 'B' minimum from 7 subjects, no 'C' grade allowed.\n"
            "- SWE: Science group. Min 2.5 GPA each in SSC & HSC. Must have Physics & Mathematics; A-level applicants need min GPA 4.0 in B.Sc. subjects, Physics & Mathematics at A-level with 'A' grade.\n"
            "- MCT: Any group. Min 2.5 GPA each in SSC & HSC. Diploma in Computer Technology or Graphics Design accepted (min 2.5 SSC Science).\n"
            "- ITM: Any group. Min 2.5 GPA each in SSC & HSC. O/A-Level: 7 A-level subjects; min 3 'A' and 4 'C'."
        ),
    },
    {
        "id": "seed-eligibility-engineering",
        "title": "Eligibility — Faculty of Engineering",
        "type": "eligibility",
        "department": "",
        "text": (
            "Eligibility (exact) — Faculty of Engineering:\n"
            "- B.Arch: Science group. Min 2.5 GPA each in SSC & HSC, combined GPA ≥ 7.00. Min 'C' in Physics, Chemistry, Mathematics & English.\n"
            "- EEE: Science group. Min 2.5 GPA each in SSC & HSC. Physics, Mathematics & English as major subjects.\n"
            "- CE: Science group. Min 2.5 GPA each in SSC/Diploma and HSC. Min 2.5 GPA in Physics, Mathematics & Chemistry.\n"
            "- ICE: Science group. Min 2.5 GPA each in SSC & HSC. Min 'A' in Physics, Mathematics, Chemistry & English. Diploma holders accepted.\n"
            "- TE: Science group. Min 'C' in Physics, Chemistry & Math in SSC & HSC. Business Studies HSC: min 7.0 CGPA. O/A-Level: min GPA 3.0 in Physics/Chemistry/Math and overall.\n"
            "- RME: Science group. Min 2.5 GPA each in SSC & HSC. O/A-Level: 4 'B' + 3 'C'; Physics & Mathematics required at O- and A-level."
        ),
    },
    {
        "id": "seed-eligibility-business",
        "title": "Eligibility — Faculty of Business & Entrepreneurship",
        "type": "eligibility",
        "department": "",
        "text": (
            "Eligibility (exact) — Faculty of Business & Entrepreneurship:\n"
            "- BBA (General/Management): Any group. Min 2.5 GPA each in SSC & HSC. O/A-Level: min GPA 2.5; min 'B' in 3 subjects, 'C' in 3 subjects.\n"
            "- BBA in Accounting: Any group. Min 2.5 GPA each in SSC & HSC. O/A-Level: min 2.5 GPA in 5 O-level + 2 A-level; below 'C' not acceptable.\n"
            "- BBA in Finance & Banking: Any group. Min 2.5 GPA each in SSC & HSC. Min 'A' in Math & English.\n"
            "- BBA in Marketing: Any group. Min 2.5 GPA each in SSC & HSC. O/A-Level: min GPA 2.0 in A-level subjects.\n"
            "- BE (Entrepreneurship): Any group including Madrasa. Min 2.5 GPA each in SSC/HSC/Diploma.\n"
            "- BRE (Real Estate): Any group. Min 2.5 GPA each in SSC & HSC. Min 'C' in English.\n"
            "- BTHM (Tourism & Hospitality): Any group. Min 2.5 GPA each in SSC & HSC. O/A-Level: min 'B' in 3 + 'C' in 3 subjects."
        ),
    },
    {
        "id": "seed-eligibility-health",
        "title": "Eligibility — Faculty of Health & Life Sciences",
        "type": "eligibility",
        "department": "",
        "text": (
            "Eligibility (exact) — Faculty of Health & Life Sciences:\n"
            "- Pharmacy (B. Pharm): Science group only. SSC GPA ≥ 8.00 (total) and HSC GPA ≥ 5.00. Min 3.50 (scale 5.00)/'A' in Chemistry, Biology, Physics & Mathematics.\n"
            "- BPH (Public Health): Science group only. Min 2.5 GPA each in SSC/Dakhil and HSC/Alim. O/A-Level: Chemistry & Biology required both levels.\n"
            "- NFE (Nutrition & Food Engineering): Science group. Min 2.5 GPA each in SSC & HSC with min 2.5 in Chemistry, Biology & English. Diploma in Food/Nutrition accepted.\n"
            "- ESDM (Environmental Science): Any group. Min 2.5 GPA each in SSC & HSC or equivalent second division.\n"
            "- GEB (Genetic Engineering): Science group. Min 2.5 GPA each in SSC & HSC.\n"
            "- PESS (Physical Education & Sports Science): Any group. Min 2.5 GPA each in SSC & HSC."
        ),
    },
    {
        "id": "seed-eligibility-humanities",
        "title": "Eligibility — Faculty of Humanities & Social Sciences",
        "type": "eligibility",
        "department": "",
        "text": (
            "Eligibility (exact) — Faculty of Humanities & Social Sciences:\n"
            "- English (B.A. Hons.): Any group. Min 2.5 GPA each in SSC & HSC. O/A-Level: 4 'B' + 3 'C'; 'A' grade not acceptable.\n"
            "- Law (LL.B. Hons.): Any group. Min 2.5 GPA each in SSC & HSC. Min 'C' in English. O/A-Level: min 4 O-level + 2 A-level.\n"
            "- JMC (Journalism BSS Hons.): Any group. Min 2.5 GPA each in SSC & HSC, combined min 6.00. O/A-Level: 4 'B' + 3 'C'; 'D' not acceptable.\n"
            "- JMC (MSS — Graduate): Must hold BSS/BS/BCom/BSc or equivalent with min CGPA 2.50.\n\n"
            "Universal documents (all departments): SSC & HSC certificates + marksheets "
            "(original + photocopy), passport-size photos (2–4), NID/Birth Certificate "
            "photocopy. O/A-Level applicants: attested transcripts."
        ),
    },
    {
        "id": "seed-admission-process",
        "title": "Admission Process Steps",
        "type": "admission",
        "department": "",
        "text": (
            "DIU admission process:\n"
            "Step 1 → Pre-Registration at /pre-register\n"
            "Step 2 → Fill Online Admission Form at /online-admit\n"
            "Step 3 → Submit documents + pay admission fee\n"
            "Step 4 → Eligibility verification + confirmation\n"
            "Step 5 → Enroll and receive Student ID card\n"
            "Apply Online: https://admission.daffodilvarsity.edu.bd"
        ),
    },
    {
        "id": "seed-aiml-routing",
        "title": "AI / ML Interest — Department Recommendation Priority",
        "type": "guidance",
        "department": "CIS",
        "text": (
            "When a student is interested in AI, Machine Learning, Deep Learning, "
            "Data Science, Business Intelligence, NLP, computer vision or predictive "
            "analytics, recommend in this priority order:\n"
            "1. CIS (Computing and Information Systems) — HIGHEST priority. Curriculum "
            "directly includes Artificial Intelligence (CIS313/L, Sem 6) and Machine "
            "Learning (IoT429, Sem 8). Only DIU department with a dedicated BI Lab and "
            "AI & ML Lab. Specialization paths: AI, BI, Data Analysis, IoT, Cloud. "
            "Open to ALL groups (Science/Commerce/Arts). Rated 9.5/10, #1 fastest "
            "growing. Alumni in AI/data roles globally.\n"
            "2. CSE — strong option. Excellent algorithms/data-structures foundation. "
            "Requires Science group.\n"
            "3. SWE — good option. Best for building/deploying scalable AI-powered "
            "software (DevOps, agile). Requires Science group.\n"
            "Highlight that CIS is open to all groups — especially helpful for "
            "Commerce/Arts students. Do NOT apply this AI priority to non-AI topics "
            "(web dev, networking, cybersecurity, general SE)."
        ),
    },
]
