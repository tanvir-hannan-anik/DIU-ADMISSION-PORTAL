package com.university.config;

import com.university.model.entity.AdmittedStudent;
import com.university.repository.AdmittedStudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final AdmittedStudentRepository admittedStudentRepository;

    @Override
    public void run(String... args) {
        if (admittedStudentRepository.count() == 0) {
            admittedStudentRepository.saveAll(List.of(
                AdmittedStudent.builder()
                    .name("Tanvir Ahmed")
                    .studentId("221-15-4901")
                    .department("Computer Science & Engineering")
                    .email("tanvir@diu.edu.bd")
                    .semester("Spring 2024")
                    .build(),
                AdmittedStudent.builder()
                    .name("Rina Begum")
                    .studentId("221-15-4902")
                    .department("Business Administration")
                    .email("rina@diu.edu.bd")
                    .semester("Spring 2024")
                    .build(),
                AdmittedStudent.builder()
                    .name("Karim Hassan")
                    .studentId("221-15-4903")
                    .department("Electrical & Electronic Engineering")
                    .email("karim@diu.edu.bd")
                    .semester("Spring 2024")
                    .build(),
                AdmittedStudent.builder()
                    .name("Nasrin Akter")
                    .studentId("221-15-4904")
                    .department("English")
                    .email("nasrin@diu.edu.bd")
                    .semester("Spring 2024")
                    .build(),
                AdmittedStudent.builder()
                    .name("Tanvir Hanna Anik")
                    .studentId("251-16-021")
                    .department("Department of CIS")
                    .email("251-16-021@diu.edu.bd")
                    .semester("Batch 21-A")
                    .build()
            ));
        }
    }
}
