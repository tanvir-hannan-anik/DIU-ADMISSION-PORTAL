package com.university;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import java.util.TimeZone;

@SpringBootApplication
@EnableAsync
public class UniversityAutomationApplication {
    public static void main(String[] args) {
        // All LocalDateTime.now() calls use Bangladesh Standard Time (UTC+6)
        TimeZone.setDefault(TimeZone.getTimeZone("Asia/Dhaka"));
        SpringApplication.run(UniversityAutomationApplication.class, args);
    }
}
