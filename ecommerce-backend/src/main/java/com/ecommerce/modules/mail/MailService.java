package com.ecommerce.modules.mail;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class MailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.from}")
    private String from;

    public void sendOtpEmail(String to, String subject, String code, int expirationSeconds) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(from);
        message.setTo(to);
        message.setSubject(subject);
        long minutes = expirationSeconds / 60;
        long seconds = expirationSeconds % 60;
        String display = seconds == 0
                ? minutes + " phút"
                : minutes + " phút " + seconds + " giây";
        message.setText("Mã xác thực của bạn là: " + code + "\nMã có hiệu lực trong " + display + ".");
        mailSender.send(message);
    }
}
