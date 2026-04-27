using System.Net;
using System.Net.Mail;

namespace Bts.Api.Services;

public sealed class EmailDeliveryService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<EmailDeliveryService> _logger;

    public EmailDeliveryService(IConfiguration configuration, ILogger<EmailDeliveryService> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public async Task SendVerificationOtpAsync(string recipientEmail, string displayName, string otp)
    {
        var host = _configuration["Smtp:Host"];
        var fromEmail = _configuration["Smtp:FromEmail"];

        if (string.IsNullOrWhiteSpace(host) || string.IsNullOrWhiteSpace(fromEmail))
            throw new InvalidOperationException("Email verification is not configured yet.");

        var fromName = _configuration["Smtp:FromName"] ?? "BTS";
        var port = int.TryParse(_configuration["Smtp:Port"], out var parsedPort) ? parsedPort : 587;
        var enableSsl = !bool.TryParse(_configuration["Smtp:EnableSsl"], out var parsedSsl) || parsedSsl;
        var username = _configuration["Smtp:Username"];
        var password = _configuration["Smtp:Password"];

        using var message = new MailMessage();
        message.From = new MailAddress(fromEmail, fromName);
        message.To.Add(new MailAddress(recipientEmail, displayName));
        message.Subject = "BTS account verification code";
        message.Body =
$"""
BTS account verification

Hello {displayName},

Use the verification code below to finish creating your BTS account:

{otp}

This code expires in 10 minutes.

This inbox does not accept replies.
If you did not request this code, you can safely ignore this email.

Regards,
BTS No Reply
""";

        using var client = new SmtpClient(host, port)
        {
            EnableSsl = enableSsl
        };

        if (!string.IsNullOrWhiteSpace(username))
        {
            client.Credentials = new NetworkCredential(username, password ?? string.Empty);
        }

        await client.SendMailAsync(message);
        _logger.LogInformation("Sent BTS verification OTP to {RecipientEmail}", recipientEmail);
    }
}
