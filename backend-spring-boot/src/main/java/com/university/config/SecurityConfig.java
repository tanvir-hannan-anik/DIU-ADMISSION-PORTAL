package com.university.config;

import com.university.security.JwtAuthFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/v1/auth/**").permitAll()
                .requestMatchers("/v1/admission/**").permitAll()
                .requestMatchers("/v1/ai/**").permitAll()
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/v1/notices").permitAll()
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/v1/notices/**").permitAll()
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/v1/jobs").permitAll()
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/v1/jobs/**").permitAll()
                .requestMatchers("/v1/student/**").authenticated()
                .requestMatchers("/v1/payments/**").authenticated()
                .requestMatchers("/v1/scholarships/**").authenticated()
                .requestMatchers("/v1/notifications/**").authenticated()
                .requestMatchers(org.springframework.http.HttpMethod.POST, "/v1/notices/**").authenticated()
                .requestMatchers(org.springframework.http.HttpMethod.PUT, "/v1/notices/**").authenticated()
                .requestMatchers(org.springframework.http.HttpMethod.DELETE, "/v1/notices/**").authenticated()
                .requestMatchers(org.springframework.http.HttpMethod.POST, "/v1/jobs/**").authenticated()
                .requestMatchers(org.springframework.http.HttpMethod.PUT, "/v1/jobs/**").authenticated()
                .requestMatchers(org.springframework.http.HttpMethod.DELETE, "/v1/jobs/**").authenticated()
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
