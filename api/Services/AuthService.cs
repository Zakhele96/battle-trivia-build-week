using Bts.Api.Auth;
using Bts.Api.Models.Domain;
using Bts.Api.Models.Requests;
using Bts.Api.Models.Responses;
using Bts.Api.Repositories;
using Google.Apis.Auth;

namespace Bts.Api.Services;

public sealed class AuthService
{
    private readonly IUserRepository _userRepository;
    private readonly JwtTokenGenerator _jwtTokenGenerator;
    private readonly IConfiguration _configuration;
    private readonly GrowthAnalyticsService _growthAnalyticsService;

    public AuthService(
        IUserRepository userRepository,
        JwtTokenGenerator jwtTokenGenerator,
        IConfiguration configuration,
        GrowthAnalyticsService growthAnalyticsService)
    {
        _userRepository = userRepository;
        _jwtTokenGenerator = jwtTokenGenerator;
        _configuration = configuration;
        _growthAnalyticsService = growthAnalyticsService;
    }

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
    {
        var existingByEmail = await _userRepository.GetByEmailAsync(request.Email);
        if (existingByEmail is not null)
            throw new InvalidOperationException("Email already exists.");

        var existingByUsername = await _userRepository.GetByUsernameAsync(request.Username);
        if (existingByUsername is not null)
            throw new InvalidOperationException("Username already exists.");

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
            AuthProvider = "local",
            AvatarUrl = null,
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

        var token = _jwtTokenGenerator.Generate(user);

        return new AuthResponse
        {
            Token = token,
            User = MapUser(user)
        };
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request)
    {
        var user = await _userRepository.GetByEmailOrUsernameAsync(request.EmailOrUsername.Trim());
        if (user is null || !user.IsActive)
            throw new UnauthorizedAccessException("Invalid credentials.");

        if (string.IsNullOrWhiteSpace(user.PasswordHash))
            throw new UnauthorizedAccessException("This account uses Google sign-in.");

        var validPassword = BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash);
        if (!validPassword)
            throw new UnauthorizedAccessException("Invalid credentials.");

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
                    AuthProvider = "google",
                    AvatarUrl = payload.Picture,
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
        AuthProvider = string.IsNullOrWhiteSpace(user.AuthProvider) ? "local" : user.AuthProvider,
        HasPassword = !string.IsNullOrWhiteSpace(user.PasswordHash),
        IsAdmin = user.IsAdmin
    };
}
