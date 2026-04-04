package com.university.service;

import com.university.model.entity.AdmissionApplication;
import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @Value("${diu.mail.from:DIU Admissions <admission@daffodilvarsity.edu.bd>}")
    private String mailFrom;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    private boolean isMailConfigured() {
        return mailUsername != null && !mailUsername.isBlank();
    }

    @Async
    public void sendAdmissionConfirmation(AdmissionApplication app) {
        if (!isMailConfigured()) {
            log.warn("Mail not configured — skipping email to {}. Set MAIL_USERNAME and MAIL_PASSWORD env vars.", app.getEmail());
            return;
        }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(mailFrom);
            helper.setTo(app.getEmail());
            helper.setSubject("Congratulations! You have been admitted to DIU — " + app.getProgram());
            helper.setText(buildAdmissionHtml(app), true);
            mailSender.send(message);
            log.info("Admission email sent to {}", app.getEmail());
        } catch (Exception e) {
            log.error("Failed to send admission email to {}: {}", app.getEmail(), e.getMessage());
        }
    }

    @Async
    public void sendApplicationReceived(AdmissionApplication app) {
        if (!isMailConfigured()) {
            log.warn("Mail not configured — skipping receipt email to {}.", app.getEmail());
            return;
        }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(mailFrom);
            helper.setTo(app.getEmail());
            helper.setSubject("Application Received — DIU Pre-Registration (" + app.getAppId() + ")");
            helper.setText(buildReceiptHtml(app), true);
            mailSender.send(message);
            log.info("Receipt email sent to {}", app.getEmail());
        } catch (Exception e) {
            log.error("Failed to send receipt email to {}: {}", app.getEmail(), e.getMessage());
        }
    }

    private String buildAdmissionHtml(AdmissionApplication app) {
        return """
            <!DOCTYPE html>
            <html>
            <head><meta charset="UTF-8"></head>
            <body style="margin:0;padding:0;background:#f8fafc;font-family:Inter,Arial,sans-serif;">
              <table width="100%%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 0;">
                <tr><td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

                    <!-- Header -->
                    <tr><td style="background:#0c1282;padding:36px 40px;text-align:center;">
                      <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:800;letter-spacing:-0.5px;">Daffodil International University</h1>
                      <p style="color:#a5b4fc;margin:6px 0 0;font-size:13px;">Office of Admissions</p>
                    </td></tr>

                    <!-- Congrats Banner -->
                    <tr><td style="background:#eef2ff;padding:28px 40px;text-align:center;border-bottom:2px solid #c7d2fe;">
                      <p style="color:#0c1282;font-size:28px;margin:0;font-weight:800;">🎓 Congratulations!</p>
                      <p style="color:#4f46e5;margin:8px 0 0;font-size:15px;">You have been selected for admission at DIU</p>
                    </td></tr>

                    <!-- Body -->
                    <tr><td style="padding:36px 40px;">
                      <p style="color:#1e293b;font-size:15px;margin:0 0 20px;">Dear <strong>%s</strong>,</p>
                      <p style="color:#475569;font-size:14px;line-height:1.7;margin:0 0 24px;">
                        We are delighted to inform you that your application for <strong>%s</strong> at Daffodil International University has been reviewed and you have been <strong style="color:#16a34a;">ADMITTED</strong> to our program.
                      </p>

                      <!-- App ID -->
                      <div style="background:#f1f5f9;border-radius:10px;padding:16px 20px;margin-bottom:24px;">
                        <p style="margin:0;font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Application ID</p>
                        <p style="margin:6px 0 0;font-size:18px;font-weight:800;color:#0c1282;font-family:monospace;">%s</p>
                      </div>

                      <!-- Schedule -->
                      <h3 style="color:#0c1282;font-size:15px;font-weight:700;margin:0 0 14px;">📅 Your Admission Schedule</h3>
                      <table width="100%%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                        <tr>
                          <td style="background:#eef2ff;border-radius:10px 0 0 10px;padding:16px 20px;width:50%%;">
                            <p style="margin:0;font-size:11px;color:#6366f1;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Admission Interview</p>
                            <p style="margin:6px 0 0;font-size:14px;font-weight:700;color:#1e293b;">%s</p>
                          </td>
                          <td style="background:#f0fdf4;border-radius:0 10px 10px 0;padding:16px 20px;width:50%%;">
                            <p style="margin:0;font-size:11px;color:#16a34a;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Viva / Interview</p>
                            <p style="margin:6px 0 0;font-size:14px;font-weight:700;color:#1e293b;">%s</p>
                          </td>
                        </tr>
                      </table>

                      <!-- Venue -->
                      <div style="background:#fff7ed;border-left:4px solid #f97316;border-radius:0 10px 10px 0;padding:14px 18px;margin-bottom:24px;">
                        <p style="margin:0;font-size:13px;color:#c2410c;font-weight:700;">📍 Venue: DIU Permanent Campus, Birulia, Savar, Dhaka-1216</p>
                      </div>

                      <!-- Documents -->
                      <h3 style="color:#0c1282;font-size:15px;font-weight:700;margin:0 0 12px;">📋 Required Documents</h3>
                      <ul style="color:#475569;font-size:14px;line-height:2;margin:0 0 24px;padding-left:20px;">
                        <li>Original SSC Certificate &amp; Mark Sheet</li>
                        <li>Original HSC Certificate &amp; Mark Sheet</li>
                        <li>4 copies Passport-size Photo</li>
                        <li>NID Card / Birth Certificate (original + photocopy)</li>
                        <li>Admission Fee Payment Receipt</li>
                      </ul>

                      <p style="color:#475569;font-size:13px;line-height:1.7;margin:0 0 8px;">
                        For any queries, contact us at <a href="mailto:admission@daffodilvarsity.edu.bd" style="color:#0c1282;">admission@daffodilvarsity.edu.bd</a> or call <strong>+880 1844 536 000</strong>.
                      </p>
                      <p style="color:#475569;font-size:13px;">We look forward to welcoming you to the DIU family!</p>
                    </td></tr>

                    <!-- Footer -->
                    <tr><td style="background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e2e8f0;">
                      <p style="margin:0;color:#94a3b8;font-size:12px;">© 2024 Daffodil International University · Ashulia, Dhaka, Bangladesh</p>
                    </td></tr>

                  </table>
                </td></tr>
              </table>
            </body>
            </html>
            """.formatted(
                app.getFullName(),
                app.getProgram() != null ? app.getProgram() : "your selected program",
                app.getAppId(),
                app.getAdmissionDate() != null ? app.getAdmissionDate() : "To be announced",
                app.getVivaDate() != null ? app.getVivaDate() : "To be announced"
        );
    }

    private String buildReceiptHtml(AdmissionApplication app) {
        return """
            <!DOCTYPE html>
            <html>
            <head><meta charset="UTF-8"></head>
            <body style="margin:0;padding:0;background:#f8fafc;font-family:Inter,Arial,sans-serif;">
              <table width="100%%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 0;">
                <tr><td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

                    <tr><td style="background:#0c1282;padding:36px 40px;text-align:center;">
                      <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:800;">Daffodil International University</h1>
                      <p style="color:#a5b4fc;margin:6px 0 0;font-size:13px;">Pre-Registration Confirmation</p>
                    </td></tr>

                    <tr><td style="padding:36px 40px;">
                      <p style="color:#1e293b;font-size:15px;margin:0 0 16px;">Dear <strong>%s</strong>,</p>
                      <p style="color:#475569;font-size:14px;line-height:1.7;margin:0 0 24px;">
                        Thank you for submitting your pre-registration application to DIU. We have received your application and it is currently under review.
                      </p>

                      <div style="background:#f1f5f9;border-radius:10px;padding:20px;margin-bottom:24px;">
                        <table width="100%%">
                          <tr><td style="font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;font-weight:700;padding-bottom:8px;">Application Details</td></tr>
                          <tr><td style="font-size:13px;color:#475569;padding:4px 0;"><strong>App ID:</strong> <span style="font-family:monospace;color:#0c1282;font-weight:700;">%s</span></td></tr>
                          <tr><td style="font-size:13px;color:#475569;padding:4px 0;"><strong>Program:</strong> %s</td></tr>
                          <tr><td style="font-size:13px;color:#475569;padding:4px 0;"><strong>Status:</strong> <span style="color:#d97706;font-weight:700;">PENDING REVIEW</span></td></tr>
                        </table>
                      </div>

                      <div style="background:#eef2ff;border-radius:10px;padding:16px 20px;margin-bottom:24px;">
                        <p style="margin:0;font-size:13px;color:#4f46e5;font-weight:600;">📌 What happens next?</p>
                        <ul style="color:#475569;font-size:13px;line-height:2;margin:8px 0 0;padding-left:20px;">
                          <li>Our admission team will review your application</li>
                          <li>If selected, you will receive an admission confirmation email</li>
                          <li>The email will include your interview date, viva time, and required documents</li>
                        </ul>
                      </div>

                      <p style="color:#475569;font-size:13px;">Questions? Contact us at <a href="mailto:admission@daffodilvarsity.edu.bd" style="color:#0c1282;">admission@daffodilvarsity.edu.bd</a></p>
                    </td></tr>

                    <tr><td style="background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e2e8f0;">
                      <p style="margin:0;color:#94a3b8;font-size:12px;">© 2024 Daffodil International University</p>
                    </td></tr>
                  </table>
                </td></tr>
              </table>
            </body>
            </html>
            """.formatted(
                app.getFullName(),
                app.getAppId(),
                app.getProgram() != null ? app.getProgram() : "—"
        );
    }
}
