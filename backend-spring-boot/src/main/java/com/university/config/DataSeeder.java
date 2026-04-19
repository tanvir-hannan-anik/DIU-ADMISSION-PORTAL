package com.university.config;

import com.university.model.entity.*;
import com.university.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final AdmittedStudentRepository admittedStudentRepository;
    private final NoticeRepository noticeRepository;
    private final JobListingRepository jobListingRepository;

    @Override
    public void run(String... args) {
        seedAdmittedStudents();
        seedNotices();
        seedJobListings();
    }

    private void seedAdmittedStudents() {
        if (admittedStudentRepository.count() > 0) return;
        admittedStudentRepository.saveAll(List.of(
            AdmittedStudent.builder().name("Tanvir Ahmed").studentId("221-15-4901")
                .department("Computer Science & Engineering").email("tanvir@diu.edu.bd").semester("Spring 2024").build(),
            AdmittedStudent.builder().name("Rina Begum").studentId("221-15-4902")
                .department("Business Administration").email("rina@diu.edu.bd").semester("Spring 2024").build(),
            AdmittedStudent.builder().name("Karim Hassan").studentId("221-15-4903")
                .department("Electrical & Electronic Engineering").email("karim@diu.edu.bd").semester("Spring 2024").build(),
            AdmittedStudent.builder().name("Nasrin Akter").studentId("221-15-4904")
                .department("English").email("nasrin@diu.edu.bd").semester("Spring 2024").build(),
            AdmittedStudent.builder().name("Tanvir Hanna Anik").studentId("251-16-021")
                .department("Department of Computing and Information System (CIS)")
                .email("251-16-021@diu.edu.bd").semester("Batch 21-A").build()
        ));
    }

    private void seedNotices() {
        if (noticeRepository.count() > 0) return;
        noticeRepository.saveAll(List.of(
            Notice.builder()
                .title("Spring 2025 Course Registration Open")
                .content("Course registration for Spring 2025 semester is now open. Students must register by January 31, 2025. Late registration fee will apply after the deadline. Contact your academic advisor for course selection guidance.")
                .type("URGENT").targetRole("student").createdBy("admin@diu.edu.bd")
                .expiresAt(LocalDateTime.now().plusDays(30)).isActive(true).build(),

            Notice.builder()
                .title("DIU Annual Tech Fest 2025")
                .content("Daffodil International University is hosting its annual Tech Fest on February 15–17, 2025. Events include hackathon, robotics competition, app development contest, and guest lectures from industry leaders. Registration is free for all DIU students.")
                .type("EVENT").targetRole("all").createdBy("admin@diu.edu.bd")
                .expiresAt(LocalDateTime.now().plusDays(45)).isActive(true).build(),

            Notice.builder()
                .title("Scholarship Applications Open for Spring 2025")
                .content("Merit-based and need-based scholarship applications for the Spring 2025 semester are now open. Eligible students with CGPA 3.5+ may apply for merit scholarships. Apply through the student portal before January 15, 2025.")
                .type("INFO").targetRole("student").createdBy("admin@diu.edu.bd")
                .expiresAt(LocalDateTime.now().plusDays(20)).isActive(true).build(),

            Notice.builder()
                .title("Library Extended Hours During Exam Season")
                .content("The DIU Central Library will remain open 24/7 from January 20 to February 10, 2025 to support students during the final examination period. Online resources and e-journals are accessible via the student portal at all times.")
                .type("INFO").targetRole("all").createdBy("admin@diu.edu.bd")
                .expiresAt(LocalDateTime.now().plusDays(35)).isActive(true).build(),

            Notice.builder()
                .title("Campus Network Maintenance – January 25")
                .content("Scheduled network maintenance will be performed on January 25, 2025 from 2:00 AM to 6:00 AM. Internet and online services (student portal, email) may be temporarily unavailable. Plan accordingly.")
                .type("WARNING").targetRole("all").createdBy("admin@diu.edu.bd")
                .expiresAt(LocalDateTime.now().plusDays(10)).isActive(true).build(),

            Notice.builder()
                .title("New AI & Machine Learning Lab Inaugurated")
                .content("DIU has inaugurated a state-of-the-art AI & Machine Learning Lab equipped with NVIDIA GPU clusters, 50 high-performance workstations, and access to premium cloud computing resources. The lab is open to all CSE, CIS, and SWE students.")
                .type("INFO").targetRole("all").createdBy("admin@diu.edu.bd")
                .isActive(true).build(),

            Notice.builder()
                .title("Industry Internship Fair – February 5, 2025")
                .content("DIU Career Center is organizing an Internship Fair on February 5, 2025 at the main auditorium. Over 30 companies including Brain Station 23, BJIT, Kaz Software, and Grameenphone will be recruiting interns. Bring your updated CV.")
                .type("EVENT").targetRole("student").createdBy("admin@diu.edu.bd")
                .expiresAt(LocalDateTime.now().plusDays(25)).isActive(true).build()
        ));
    }

    private void seedJobListings() {
        if (jobListingRepository.count() > 0) return;
        jobListingRepository.saveAll(List.of(
            JobListing.builder().title("Junior Software Engineer").company("Brain Station 23")
                .location("Dhaka, Bangladesh").type("Full-time").salary("৳30,000–45,000/mo")
                .url("https://brainstation-23.com/career").category("tech")
                .description("Python Django React Node.js SQL Git REST API JavaScript software development agile")
                .logo("https://logo.clearbit.com/brainstation-23.com").isFeatured(true).isActive(true)
                .postedAt(LocalDateTime.now().minusDays(2)).build(),

            JobListing.builder().title("Frontend Developer (React)").company("SELISE Digital Platforms")
                .location("Dhaka, Bangladesh").type("Full-time").salary("৳35,000–55,000/mo")
                .url("https://selisegroup.com/careers").category("tech")
                .description("React JavaScript TypeScript HTML CSS Redux Tailwind REST API Git frontend")
                .logo("https://logo.clearbit.com/selisegroup.com").isFeatured(true).isActive(true)
                .postedAt(LocalDateTime.now().minusDays(3)).build(),

            JobListing.builder().title("Python Developer").company("Kaz Software")
                .location("Dhaka, Bangladesh").type("Full-time").salary("৳40,000–60,000/mo")
                .url("https://kaz.com.bd/careers").category("tech")
                .description("Python Django Flask REST API PostgreSQL Docker Git Machine Learning backend")
                .logo("https://logo.clearbit.com/kaz.com.bd").isActive(true)
                .postedAt(LocalDateTime.now().minusDays(7)).build(),

            JobListing.builder().title("Machine Learning Engineer").company("Intelligent Machines")
                .location("Dhaka, Bangladesh").type("Full-time").salary("৳60,000–90,000/mo")
                .url("https://im.ai/careers").category("tech")
                .description("Python TensorFlow Machine Learning Deep Learning NLP Data Analysis SQL scikit-learn Docker")
                .logo("https://logo.clearbit.com/im.ai").isFeatured(true).isActive(true)
                .postedAt(LocalDateTime.now().minusDays(4)).build(),

            JobListing.builder().title("Mobile App Developer (Flutter)").company("SSL Wireless")
                .location("Dhaka, Bangladesh").type("Full-time").salary("৳35,000–55,000/mo")
                .url("https://sslwireless.com/career").category("tech")
                .description("Flutter Dart Android iOS Firebase REST API Git mobile development")
                .logo("https://logo.clearbit.com/sslwireless.com").isActive(true)
                .postedAt(LocalDateTime.now().minusDays(5)).build(),

            JobListing.builder().title("DevOps Engineer").company("Shohoz")
                .location("Dhaka, Bangladesh").type("Full-time").salary("৳55,000–80,000/mo")
                .url("https://shohoz.com/careers").category("tech")
                .description("Docker Kubernetes AWS DevOps CI/CD Linux Bash Git Jenkins cloud infrastructure")
                .logo("https://logo.clearbit.com/shohoz.com").isActive(true)
                .postedAt(LocalDateTime.now().minusDays(7)).build(),

            JobListing.builder().title("Data Analyst").company("Pathao")
                .location("Dhaka, Bangladesh").type("Full-time").salary("৳40,000–65,000/mo")
                .url("https://pathao.com/careers").category("tech")
                .description("SQL Python Data Analysis Excel Power BI statistics dashboard reporting analytics")
                .logo("https://logo.clearbit.com/pathao.com").isActive(true)
                .postedAt(LocalDateTime.now().minusDays(2)).build(),

            JobListing.builder().title("Backend Developer (Node.js)").company("Chaldal")
                .location("Dhaka, Bangladesh").type("Full-time").salary("৳38,000–58,000/mo")
                .url("https://chaldal.com/careers").category("tech")
                .description("Node.js JavaScript MongoDB REST API Express Git Docker backend microservices")
                .logo("https://logo.clearbit.com/chaldal.com").isActive(true)
                .postedAt(LocalDateTime.now().minusDays(3)).build(),

            JobListing.builder().title("UI/UX Designer").company("Therap Services")
                .location("Sylhet, Bangladesh").type("Full-time").salary("৳30,000–50,000/mo")
                .url("https://therapbd.com/careers").category("tech")
                .description("Figma UI UX design Adobe XD wireframe prototype user research CSS")
                .logo("https://logo.clearbit.com/therapbd.com").isActive(true)
                .postedAt(LocalDateTime.now().minusDays(6)).build(),

            JobListing.builder().title("Software Engineer (Java)").company("BJIT Limited")
                .location("Dhaka, Bangladesh").type("Full-time").salary("৳45,000–70,000/mo")
                .url("https://bjitgroup.com/careers").category("tech")
                .description("Java Spring Boot SQL REST API Microservices Docker Git Maven backend development")
                .logo("https://logo.clearbit.com/bjitgroup.com").isFeatured(true).isActive(true)
                .postedAt(LocalDateTime.now().minusDays(2)).build(),

            JobListing.builder().title("Graduate Trainee – Software").company("Grameenphone")
                .location("Dhaka, Bangladesh").type("Full-time").salary("Competitive")
                .url("https://grameenphone.com/about/career").category("tech")
                .description("Python JavaScript SQL software engineering communication teamwork fresh graduate entry level")
                .logo("https://logo.clearbit.com/grameenphone.com").isFeatured(true).isActive(true)
                .postedAt(LocalDateTime.now().minusDays(3)).build(),

            JobListing.builder().title("Business Development Executive").company("Robi Axiata")
                .location("Dhaka, Bangladesh").type("Full-time").salary("৳35,000–50,000/mo")
                .url("https://robi.com.bd/en/about-us/careers").category("business")
                .description("Business development sales marketing BBA MBA communication negotiation CRM client management")
                .logo("https://logo.clearbit.com/robi.com.bd").isActive(true)
                .postedAt(LocalDateTime.now().minusDays(4)).build(),

            JobListing.builder().title("Cybersecurity Analyst").company("Sheba.xyz")
                .location("Dhaka, Bangladesh").type("Full-time").salary("৳50,000–75,000/mo")
                .url("https://sheba.xyz/careers").category("tech")
                .description("Cybersecurity network security Linux Python penetration testing OWASP firewall SIEM")
                .logo("https://logo.clearbit.com/sheba.xyz").isActive(true)
                .postedAt(LocalDateTime.now().minusDays(7)).build(),

            JobListing.builder().title("Software Engineering Intern").company("Samsung R&D Bangladesh")
                .location("Dhaka, Bangladesh").type("Internship").salary("৳15,000–20,000/mo")
                .url("https://samsung.com/bd").category("tech")
                .description("C++ Java Android software engineering fresh graduate intern teamwork problem solving algorithms")
                .logo("https://logo.clearbit.com/samsung.com").isFeatured(true).isActive(true)
                .postedAt(LocalDateTime.now().minusDays(1)).build(),

            JobListing.builder().title("Cloud Engineer (AWS)").company("DataSoft Systems")
                .location("Dhaka, Bangladesh").type("Full-time").salary("৳60,000–90,000/mo")
                .url("https://datasoft-bd.com/career").category("tech")
                .description("AWS cloud Lambda EC2 S3 Terraform Docker Kubernetes DevOps infrastructure automation")
                .logo("https://logo.clearbit.com/datasoft-bd.com").isActive(true)
                .postedAt(LocalDateTime.now().minusDays(4)).build()
        ));
    }
}
