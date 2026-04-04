package com.university.model.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdmissionApplicationRequest {

    @NotBlank(message = "Full name is required")
    private String fullName;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    private String dateOfBirth;
    private String contactNumber;
    private String program;
    private String major;

    // SSC
    private String sscResult;
    private String sscGroup;
    private String sscBoard;
    private String sscYear;
    private String sscMarksheet;

    // HSC
    private String hscResult;
    private String hscGroup;
    private String hscBoard;
    private String hscYear;
    private String hscMarksheet;

    private String essayOne;
    private String essayTwo;
}
