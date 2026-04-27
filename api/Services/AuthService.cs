using Bts.Api.Auth;
using Bts.Api.Models.Domain;
using Bts.Api.Models.Requests;
using Bts.Api.Models.Responses;
using Bts.Api.Repositories;
using Google.Apis.Auth;
using System.Net.Http.Json;
using System.Net.Mail;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json.Serialization;

namespace Bts.Api.Services;

public sealed class AuthService
{
    private readonly IUserRepository _userRepository;
    private readonly JwtTokenGenerator _jwtTokenGenerator;
    private readonly IConfiguration _configuration;
    private readonly GrowthAnalyticsService _growthAnalyticsService;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly EmailDeliveryService _emailDeliveryService;

    public AuthService(
        IUserRepository userRepository,
        JwtTokenGenerator jwtTokenGenerator,
        IConfiguration configuration,
        GrowthAnalyticsService growthAnalyticsService,
        IHttpClientFactory httpClientFactory,
        EmailDeliveryService emailDeliveryService)
    {
        _userRepository = userRepository;
        _jwtTokenGenerator = jwtTokenGenerator;
        _configuration = configuration;
        _growthAnalyticsService = growthAnalyticsService;
        _httpClientFactory = httpClientFactory;
        _emailDeliveryService = emailDeliveryService;
    }

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
    {
        if (!IsValidEmail(request.Email))
            throw new InvalidOperationException("Enter a valid email address.");

        var existingByEmail = await _userRepository.GetByEmailAsync(request.Email);
        if (existingByEmail is not null)
        {
            throw new InvalidOperationException(
                existingByEmail.EmailVerified
                    ? "Email already exists."
                    : "This email already has a pending account. Verify it or resend the code from login.");
        }

        var existingByUsername = await _userRepository.GetByUsernameAsync(request.Username);
        if (existingByUsername is not null)
        {
            throw new InvalidOperationException(
                existingByUsername.EmailVerified
                    ? "Username already exists."
                    : "That username is already reserved by a pending account.");
        }

        var nowUtc = DateTime.UtcNow;

        var user = new User
        {
            Id = Guid.NewGuid(),
            Username = request.Username.Trim(),
            DisplayName = request.DisplayName.Trim(),
            Email = request.Email.Trim(),
            PhoneNumber = string.IsNullOrWhiteSpace(request.PhoneNumber)
                ? null
                : request.PhoneNumber.Trim(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            GoogleSub = null,
            FacebookUserId = null,
            AuthProvider = "local",
            AvatarUrl = null,
            StatusMessage = null,
            IsSupporter = false,
            SupporterTier = null,
            SupporterExpiresAt = null,
            EmailVerified = false,
            IsActive = true,
            IsAdmin = false,
            CreatedAt = nowUtc,
            UpdatedAt = nowUtc
        };

        await _userRepository.CreateAsync(user);
        await _growthAnalyticsService.RecordReferralSignupAsync(
            request.ReferredByUserId ?? Guid.Empty,
            user.Id,
            request.ReferralSource,
            request.ReferralMode,
            request.ReferralPeriod);
        await IssueEmailVerificationAsync(user);

        return new AuthResponse
        {
            RequiresEmailVerification = true,
            PendingEmail = user.Email,
            Message = "We sent a verification code to your email. Enter it to finish your BTS account setup."
        };
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request)
    {
        var user = await _userRepository.GetByEmailOrUsernameAsync(request.EmailOrUsername.Trim());
        if (user is null || !user.IsActive)
            throw new UnauthorizedAccessException("Invalid credentials.");

        if (string.IsNullOrWhiteSpace(user.PasswordHash))
            throw new UnauthorizedAccessException($"This account uses {GetAuthProviderLabel(user.AuthProvider)} sign-in.");

        var validPassword = BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash);
        if (!validPassword)
            throw new UnauthorizedAccessException("Invalid credentials.");

        if (!user.EmailVerified)
            throw new EmailVerificationRequiredException(user.Email);

        var token = _jwtTokenGenerator.Generate(user);

        return new AuthResponse
        {
            Token = token,
            User = MapUser(user)
        };
    }

    public async Task<AuthResponse> LoginWithGoogleAsync(
        string idToken,
        Guid? referredByUserId = null,
        string? referralSource = null,
        string? referralMode = null,
        string? referralPeriod = null)
    {
        if (string.IsNullOrWhiteSpace(idToken))
            throw new UnauthorizedAccessException("Google token is missing.");

        var clientId = _configuration["GoogleAuth:ClientId"];
        if (string.IsNullOrWhiteSpace(clientId))
            throw new InvalidOperationException("GoogleAuth:ClientId is not configured.");

        GoogleJsonWebSignature.Payload payload;

        try
        {
            payload = await GoogleJsonWebSignature.ValidateAsync(
                idToken,
                new GoogleJsonWebSignature.ValidationSettings
                {
                    Audience = new[] { clientId }
                });
        }
        catch
        {
            throw new UnauthorizedAccessException("Google sign-in could not verify this credential.");
        }

        if (string.IsNullOrWhiteSpace(payload.Email))
            throw new UnauthorizedAccessException("Google account email is missing.");

        var user = await _userRepository.GetByGoogleSubAsync(payload.Subject);

        if (user is null)
        {
            user = await _userRepository.GetByEmailAsync(payload.Email);

            var createdNewUser = false;

            if (user is null)
            {
                var nowUtc = DateTime.UtcNow;

                user = new User
                {
                    Id = Guid.NewGuid(),
                    Username = await BuildUniqueUsernameAsync(payload.Email, payload.Name),
                    DisplayName = string.IsNullOrWhiteSpace(payload.Name)
                        ? payload.Email
                        : payload.Name.Trim(),
                    Email = payload.Email.Trim(),
                    PhoneNumber = null,
                    PasswordHash = null,
                    GoogleSub = payload.Subject,
                    FacebookUserId = null,
                    AuthProvider = "google",
                    AvatarUrl = payload.Picture,
                    StatusMessage = null,
                    IsSupporter = false,
                    SupporterTier = null,
                    SupporterExpiresAt = null,
                    EmailVerified = payload.EmailVerified,
                    IsActive = true,
                    IsAdmin = false,
                    CreatedAt = nowUtc,
                    UpdatedAt = nowUtc
                };

                await _userRepository.CreateAsync(user);
                createdNewUser = true;
            }
            else
            {
                user.GoogleSub = payload.Subject;
                user.AuthProvider = "google";
                user.AvatarUrl = payload.Picture;
                user.EmailVerified = payload.EmailVerified;

                await _userRepository.LinkGoogleAsync(user);
            }

            if (createdNewUser)
            {
                await _growthAnalyticsService.RecordReferralSignupAsync(
                    referredByUserId ?? Guid.Empty,
                    user.Id,
                    referralSource,
                    referralMode,
                    referralPeriod);
            }
        }

        var token = _jwtTokenGenerator.Generate(user);

        return new AuthResponse
        {
            Token = token,
            User = MapUser(user)
        };
    }

    public async Task<AuthResponse> VerifyEmailAsync(string email, string otp)
    {
        if (string.IsNullOrWhiteSpace(email))
            throw new InvalidOperationException("Email is required.");

        if (string.IsNullOrWhiteSpace(otp))
            throw new InvalidOperationException("Enter the verification code.");

        var user = await _userRepository.GetByEmailAsync(email.Trim());
        if (user is null || !user.IsActive || !string.Equals(user.AuthProvider, "local", StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("Account not found.");

        if (user.EmailVerified)
        {
            var existingToken = _jwtTokenGenerator.Generate(user);
            return new AuthResponse
            {
                Token = existingToken,
                User = MapUser(user),
                Message = "Email already verified."
            };
        }

        if (user.EmailVerificationExpiresAt is null || user.EmailVerificationExpiresAt <= DateTime.UtcNow)
            throw new InvalidOperationException("That code expired. Request a new one.");

        var submittedHash = HashVerificationCode(otp.Trim());
        if (!string.Equals(submittedHash, user.EmailVerificationCodeHash, StringComparison.Ordinal))
            throw new InvalidOperationException("That code is not correct.");

        await _userRepository.UpdateEmailVerificationAsync(user.Id, null, null, user.EmailVerificationSentAt, true);
        user.EmailVerified = true;
        user.EmailVerificationCodeHash = null;
        user.EmailVerificationExpiresAt = null;

        var token = _jwtTokenGenerator.Generate(user);
        return new AuthResponse
        {
            Token = token,
            User = MapUser(user),
            Message = "Email verified."
        };
    }

    public async Task<AuthResponse> ResendVerificationAsync(string email)
    {
        if (string.IsNullOrWhiteSpace(email))
            throw new InvalidOperationException("Email is required.");

        var user = await _userRepository.GetByEmailAsync(email.Trim());
        if (user is null || !user.IsActive || !string.Equals(user.AuthProvider, "local", StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("Account not found.");

        if (user.EmailVerified)
            throw new InvalidOperationException("This email is already verified.");

        await IssueEmailVerificationAsync(user);

        return new AuthResponse
        {
            RequiresEmailVerification = true,
            PendingEmail = user.Email,
            Message = "A new verification code has been sent."
        };
    }

    public async Task<AuthResponse> LoginWithFacebookAsync(
        string accessToken,
        Guid? referredByUserId = null,
        string? referralSource = null,
        string? referralMode = null,
        string? referralPeriod = null)
    {
        if (string.IsNullOrWhiteSpace(accessToken))
            throw new UnauthorizedAccessException("Facebook token is missing.");

        var appId = _configuration["FacebookAuth:AppId"];
        var appSecret = _configuration["FacebookAuth:AppSecret"];

        if (string.IsNullOrWhiteSpace(appId) || string.IsNullOrWhiteSpace(appSecret))
            throw new InvalidOperationException("Facebook login is not configured yet.");

        var debugInfo = await ValidateFacebookAccessTokenAsync(accessToken, appId, appSecret);
        var facebookProfile = await GetFacebookProfileAsync(accessToken, appSecret);

        if (string.IsNullOrWhiteSpace(debugInfo.UserId) || string.IsNullOrWhiteSpace(facebookProfile.Id))
            throw new UnauthorizedAccessException("Facebook account details are missing.");

        if (!string.Equals(debugInfo.UserId, facebookProfile.Id, StringComparison.Ordinal))
            throw new UnauthorizedAccessException("Facebook sign-in could not verify this account.");

        var user = await _userRepository.GetByFacebookUserIdAsync(facebookProfile.Id);
        if (user is null)
        {
            var resolvedEmail = ResolveFacebookEmail(facebookProfile.Id, facebookProfile.Email);
            user = await _userRepository.GetByEmailAsync(resolvedEmail);
            var createdNewUser = false;

            if (user is null)
            {
                var nowUtc = DateTime.UtcNow;
                user = new User
                {
                    Id = Guid.NewGuid(),
                    Username = await BuildUniqueUsernameAsync(resolvedEmail, facebookProfile.Name),
                    DisplayName = string.IsNullOrWhiteSpace(facebookProfile.Name)
                        ? resolvedEmail
                        : facebookProfile.Name.Trim(),
                    Email = resolvedEmail,
                    PhoneNumber = null,
                    PasswordHash = null,
                    GoogleSub = null,
                    FacebookUserId = facebookProfile.Id,
                    AuthProvider = "facebook",
                    AvatarUrl = facebookProfile.Picture?.Data?.Url,
                    StatusMessage = null,
                    IsSupporter = false,
                    SupporterTier = null,
                    SupporterExpiresAt = null,
                    EmailVerified = !string.IsNullOrWhiteSpace(facebookProfile.Email),
                    IsActive = true,
                    IsAdmin = false,
                    CreatedAt = nowUtc,
                    UpdatedAt = nowUtc
                };

                await _userRepository.CreateAsync(user);
                createdNewUser = true;
            }
            else
            {
                user.FacebookUserId = facebookProfile.Id;
                user.AuthProvider = "facebook";
                user.AvatarUrl = facebookProfile.Picture?.Data?.Url ?? user.AvatarUrl;
                user.EmailVerified = user.EmailVerified || !string.IsNullOrWhiteSpace(facebookProfile.Email);

                await _userRepository.LinkFacebookAsync(user);
            }

            if (createdNewUser)
            {
                await _growthAnalyticsService.RecordReferralSignupAsync(
                    referredByUserId ?? Guid.Empty,
                    user.Id,
                    referralSource,
                    referralMode,
                    referralPeriod);
            }
        }

        var token = _jwtTokenGenerator.Generate(user);
        return new AuthResponse
        {
            Token = token,
            User = MapUser(user)
        };
    }

    public async Task<UserResponse?> GetMeAsync(Guid userId)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        if (user is null || !user.IsActive)
            return null;

        return MapUser(user);
    }

    private async Task<string> BuildUniqueUsernameAsync(string email, string? name)
    {
        static string Slugify(string value)
        {
            var chars = value
                .Trim()
                .ToLowerInvariant()
                .Select(ch => char.IsLetterOrDigit(ch) ? ch : '-')
                .ToArray();

            var result = new string(chars);
            while (result.Contains("--"))
                result = result.Replace("--", "-");

            return result.Trim('-');
        }

        var seed =
            !string.IsNullOrWhiteSpace(name)
                ? Slugify(name)
                : Slugify(email.Split('@')[0]);

        if (string.IsNullOrWhiteSpace(seed))
            seed = "player";

        var candidate = seed;
        var suffix = 1;

        while (await _userRepository.GetByUsernameAsync(candidate) is not null)
        {
            candidate = $"{seed}{suffix}";
            suffix++;
        }

        return candidate;
    }

    private static UserResponse MapUser(User user) => new()
    {
        Id = user.Id,
        Username = user.Username,
        DisplayName = user.DisplayName,
        Email = user.Email,
        PhoneNumber = user.PhoneNumber,
        AvatarUrl = user.AvatarUrl,
        StatusMessage = user.StatusMessage,
        IsSupporter = user.IsSupporter,
        SupporterTier = user.SupporterTier,
        SupporterBadgeLabel = GetSupporterBadgeLabel(user.SupporterTier),
        SupporterExpiresAt = user.SupporterExpiresAt,
        AuthProvider = string.IsNullOrWhiteSpace(user.AuthProvider) ? "local" : user.AuthProvider,
        HasPassword = !string.IsNullOrWhiteSpace(user.PasswordHash),
        IsAdmin = user.IsAdmin,
        EmailVerified = user.EmailVerified
    };

    private async Task IssueEmailVerificationAsync(User user)
    {
        if (user.EmailVerified)
            return;

        var otp = RandomNumberGenerator.GetInt32(0, 1_000_000).ToString("D6");
        var expiresAt = DateTime.UtcNow.AddMinutes(10);
        var codeHash = HashVerificationCode(otp);

        await _userRepository.UpdateEmailVerificationAsync(
            user.Id,
            codeHash,
            expiresAt,
            DateTime.UtcNow,
            false);

        user.EmailVerificationCodeHash = codeHash;
        user.EmailVerificationExpiresAt = expiresAt;
        user.EmailVerificationSentAt = DateTime.UtcNow;
        user.EmailVerified = false;

        await _emailDeliveryService.SendVerificationOtpAsync(
            user.Email,
            string.IsNullOrWhiteSpace(user.DisplayName) ? user.Username : user.DisplayName,
            otp);
    }

    private static string HashVerificationCode(string otp)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(otp));
        return Convert.ToHexString(bytes);
    }

    private static string GetAuthProviderLabel(string? provider)
    {
        return string.Equals(provider, "google", StringComparison.OrdinalIgnoreCase)
            ? "Google"
            : string.Equals(provider, "facebook", StringComparison.OrdinalIgnoreCase)
                ? "Facebook"
                : "social";
    }

    private static string ResolveFacebookEmail(string facebookUserId, string? email)
    {
        if (!string.IsNullOrWhiteSpace(email))
            return email.Trim();

        return $"facebook-{facebookUserId}@users.bts.local";
    }

    private static string? GetSupporterBadgeLabel(string? tier)
    {
        if (string.IsNullOrWhiteSpace(tier))
            return null;

        return string.Equals(tier, "supporter", StringComparison.OrdinalIgnoreCase)
            ? "Supporter"
            : "Member";
    }

    private async Task<FacebookDebugTokenData> ValidateFacebookAccessTokenAsync(
        string accessToken,
        string appId,
        string appSecret)
    {
        var client = _httpClientFactory.CreateClient();
        var url =
            $"https://graph.facebook.com/debug_token?input_token={Uri.EscapeDataString(accessToken)}&access_token={Uri.EscapeDataString($"{appId}|{appSecret}")}";

        FacebookDebugTokenEnvelope? response;

        try
        {
            response = await client.GetFromJsonAsync<FacebookDebugTokenEnvelope>(url);
        }
        catch
        {
            throw new UnauthorizedAccessException("Facebook sign-in could not verify this credential.");
        }

        if (response?.Data is null || !response.Data.IsValid)
            throw new UnauthorizedAccessException("Facebook sign-in could not verify this credential.");

        if (!string.IsNullOrWhiteSpace(response.Data.AppId)
            && !string.Equals(response.Data.AppId, appId, StringComparison.Ordinal))
        {
            throw new UnauthorizedAccessException("Facebook sign-in is linked to the wrong app.");
        }

        return response.Data;
    }

    private async Task<FacebookProfileResponse> GetFacebookProfileAsync(string accessToken, string appSecret)
    {
        var client = _httpClientFactory.CreateClient();
        var proof = ComputeAppSecretProof(accessToken, appSecret);
        var url =
            $"https://graph.facebook.com/me?fields=id,name,email,picture.type(large)&access_token={Uri.EscapeDataString(accessToken)}&appsecret_proof={proof}";

        FacebookProfileResponse? profile;

        try
        {
            profile = await client.GetFromJsonAsync<FacebookProfileResponse>(url);
        }
        catch
        {
            throw new UnauthorizedAccessException("Facebook sign-in could not read this profile.");
        }

        if (profile is null)
            throw new UnauthorizedAccessException("Facebook sign-in could not read this profile.");

        return profile;
    }

    private static string ComputeAppSecretProof(string accessToken, string appSecret)
    {
        var keyBytes = Encoding.UTF8.GetBytes(appSecret);
        var tokenBytes = Encoding.UTF8.GetBytes(accessToken);
        using var hmac = new HMACSHA256(keyBytes);
        var hash = hmac.ComputeHash(tokenBytes);
        return Convert.ToHexString(hash).ToLowerInvariant();
    }

    private static bool IsValidEmail(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return false;

        try
        {
            var trimmed = value.Trim();
            var address = new MailAddress(trimmed);
            return address.Address.Equals(trimmed, StringComparison.OrdinalIgnoreCase)
                && address.Host.Contains('.', StringComparison.Ordinal)
                && !address.Host.StartsWith('.')
                && !address.Host.EndsWith('.');
        }
        catch
        {
            return false;
        }
    }

    private sealed class FacebookDebugTokenEnvelope
    {
        public FacebookDebugTokenData? Data { get; set; }
    }

    private sealed class FacebookDebugTokenData
    {
        [JsonPropertyName("app_id")]
        public string? AppId { get; set; }

        [JsonPropertyName("is_valid")]
        public bool IsValid { get; set; }

        [JsonPropertyName("user_id")]
        public string? UserId { get; set; }
    }

    private sealed class FacebookProfileResponse
    {
        public string? Id { get; set; }
        public string? Name { get; set; }
        public string? Email { get; set; }
        public FacebookPictureResponse? Picture { get; set; }
    }

    private sealed class FacebookPictureResponse
    {
        public FacebookPictureDataResponse? Data { get; set; }
    }

    private sealed class FacebookPictureDataResponse
    {
        public string? Url { get; set; }
    }
}
