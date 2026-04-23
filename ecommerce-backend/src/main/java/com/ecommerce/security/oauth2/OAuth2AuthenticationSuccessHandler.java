package com.ecommerce.security.oauth2;

import com.ecommerce.entity.User;
import com.ecommerce.modules.role.entity.RoleName;
import com.ecommerce.modules.user.repository.UserRepository;
import com.ecommerce.security.jwt.JwtTokenProvider;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final UserRepository userRepository;
    private final JwtTokenProvider jwtTokenProvider;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {
        OAuth2User oauth2User = (OAuth2User) authentication.getPrincipal();
        String email = oauth2User.getAttribute("email");
        String name = oauth2User.getAttribute("name");
        String picture = oauth2User.getAttribute("picture");
        String mode = readMode(request);

        String redirectUrl;
        if ("register".equalsIgnoreCase(mode)) {
            if (email != null && userRepository.existsByEmailIgnoreCase(email)) {
                redirectUrl = UriComponentsBuilder.fromUriString(frontendUrl + "/auth/oauth2/callback")
                        .queryParam("error", "email_already_exists")
                        .build().toUriString();
            } else {
                User user = User.builder()
                        .fullName(name == null || name.isBlank() ? email : name)
                        .email(email)
                        .avatar(picture)
                        .passwordHash(null)
                        .role(RoleName.USER)
                        .active(true)
                        .authProvider("GOOGLE")
                        .providerId(oauth2User.getName())
                        .build();
                User saved = userRepository.save(user);
                String token = jwtTokenProvider.generateToken(saved.getEmail(), saved.getRole().name());
                redirectUrl = UriComponentsBuilder.fromUriString(frontendUrl + "/auth/oauth2/callback")
                        .queryParam("token", token)
                        .build().toUriString();
            }
        } else {
            User user = email == null ? null : userRepository.findByEmailIgnoreCase(email).orElse(null);
            if (user == null) {
                redirectUrl = UriComponentsBuilder.fromUriString(frontendUrl + "/auth/oauth2/callback")
                        .queryParam("error", "account_not_found")
                        .build().toUriString();
            } else {
                String token = jwtTokenProvider.generateToken(user.getEmail(), user.getRole().name());
                redirectUrl = UriComponentsBuilder.fromUriString(frontendUrl + "/auth/oauth2/callback")
                        .queryParam("token", token)
                        .build().toUriString();
            }
        }
        clearCookie(response);
        getRedirectStrategy().sendRedirect(request, response, redirectUrl);
    }

    private String readMode(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) return "login";
        for (Cookie cookie : cookies) {
            if ("oauth2_mode".equals(cookie.getName())) return cookie.getValue();
        }
        return "login";
    }

    private void clearCookie(HttpServletResponse response) {
        Cookie cookie = new Cookie("oauth2_mode", "");
        cookie.setHttpOnly(true);
        cookie.setPath("/");
        cookie.setMaxAge(0);
        response.addCookie(cookie);
    }
}
