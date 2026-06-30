package com.ecommerce.modules.mail;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
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

    public void sendSimpleEmail(String to, String subject, String content) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(from);
        message.setTo(to);
        message.setSubject(subject);
        message.setText(content);
        mailSender.send(message);
    }

    /**
     * Gửi email HTML. Dùng cho các email cần giao diện chuyên nghiệp như nhắc gia hạn VIP.
     */
    public void sendHtmlEmail(String to, String subject, String htmlContent) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(from);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);
            mailSender.send(message);
        } catch (MessagingException exception) {
            throw new RuntimeException("Không gửi được email HTML", exception);
        }
    }

}