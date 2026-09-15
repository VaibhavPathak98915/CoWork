package com.CoWork.App.config;

import java.util.Base64;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SpringSecurity {

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    http
        .csrf(csrf -> csrf.disable())
        .authorizeHttpRequests(auth -> auth
            .anyRequest().authenticated()
        )
        .httpBasic(Customizer.withDefaults()); 

    return http.build();
}

    // @Bean
    // SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    //     http
    //         .authorizeHttpRequests(auth -> auth
    //             .requestMatchers("/public/**").permitAll() // Use requestMatchers instead of antMatchers
    //             .anyRequest().authenticated()
    //         )
    //         .formLogin(Customizer.withDefaults()); // Modern Lambda syntax

    //     return http.build();
    // }

    @Bean
    public UserDetailsService userDetailsService() {
        // Example: If your raw password is "secret", 
        // and you want to store it in its Base64 form: "c2VjcmV0"
        String rawPassword = "hello";
        String base64Password = Base64.getEncoder().encodeToString(rawPassword.getBytes());

        UserDetails user = User.builder()
                .username("admin")
                .password(base64Password)
                .roles("USER")
                .build();

        return new InMemoryUserDetailsManager(user);
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        /**
         * Custom PasswordEncoder to handle Base64.
         * Note: Spring Security 7.0 (Boot 4.0.5) is very strict.
         * Using custom encoders is fine, but avoid 'NoOp' in production.
         */
        return new PasswordEncoder() {
            @Override
            public String encode(CharSequence rawPassword) {
                return Base64.getEncoder().encodeToString(rawPassword.toString().getBytes());
            }

            @Override
            public boolean matches(CharSequence rawPassword, String encodedPassword) {
                // Encodes the login attempt password to Base64 and compares it to the DB
                return encode(rawPassword).equals(encodedPassword);
            }
        };
    }

}
