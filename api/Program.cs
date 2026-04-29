using System.Text;
using Bts.Api.Auth;
using Bts.Api.Data;
using Bts.Api.Repositories;
using Bts.Api.Services;
using FluentValidation;
using FluentValidation.AspNetCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.SignalR;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using StackExchange.Redis;

var builder = WebApplication.CreateBuilder(args);
var redisSection = builder.Configuration.GetSection(RedisOptions.SectionName);
var redisOptions = redisSection.Get<RedisOptions>() ?? new RedisOptions();

builder.Services.AddControllers();
builder.Services.AddHttpClient();

builder.Services.Configure<RedisOptions>(redisSection);

var signalRBuilder = builder.Services.AddSignalR();
if (redisOptions.Enabled &&
    redisOptions.UseSignalRBackplane &&
    !string.IsNullOrWhiteSpace(redisOptions.ConnectionString))
{
    signalRBuilder.AddStackExchangeRedis(redisOptions.ConnectionString, options =>
    {
        options.Configuration.ChannelPrefix = RedisChannel.Literal($"{redisOptions.KeyPrefix}:signalr");
    });
}

builder.Services.AddSingleton<IUserIdProvider, SignalRUserIdProvider>();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "BTS API",
        Version = "v1"
    });

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter your JWT token here"
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssemblyContaining<Program>();

builder.Services.Configure<JwtOptions>(
    builder.Configuration.GetSection(JwtOptions.SectionName));
builder.Services.Configure<WebPushOptions>(
    builder.Configuration.GetSection(WebPushOptions.SectionName));

if (redisOptions.Enabled && !string.IsNullOrWhiteSpace(redisOptions.ConnectionString))
{
    builder.Services.AddSingleton<IConnectionMultiplexer>(_ =>
        ConnectionMultiplexer.Connect(redisOptions.ConnectionString));
}

builder.Services.AddSingleton<DapperContext>();

builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IRoomRepository, RoomRepository>();
builder.Services.AddScoped<IMessageRepository, MessageRepository>();
builder.Services.AddScoped<IMentionNotificationRepository, MentionNotificationRepository>();
builder.Services.AddScoped<ITriviaQuestionRepository, TriviaQuestionRepository>();
builder.Services.AddScoped<ITriviaSessionRepository, TriviaSessionRepository>();
builder.Services.AddScoped<ITriviaRoundRepository, TriviaRoundRepository>();
builder.Services.AddScoped<ITriviaAnswerRepository, TriviaAnswerRepository>();
builder.Services.AddScoped<ITriviaScoreLedgerRepository, TriviaScoreLedgerRepository>();
builder.Services.AddScoped<ITriviaLeaderboardRepository, TriviaLeaderboardRepository>();
builder.Services.AddScoped<ITriviaSessionWindowRepository, TriviaSessionWindowRepository>();
builder.Services.AddScoped<ITriviaSessionResultRepository, TriviaSessionResultRepository>();
builder.Services.AddScoped<IBattleTriviaProfileStatsRepository, BattleTriviaProfileStatsRepository>();
builder.Services.AddScoped<IBattleTriviaSessionSummaryRepository, BattleTriviaSessionSummaryRepository>();
builder.Services.AddScoped<IRoomModerationRepository, RoomModerationRepository>();
builder.Services.AddSingleton<IProfanityFilterService, BasicProfanityFilterService>();
builder.Services.AddScoped<IAchievementRepository, AchievementRepository>();
builder.Services.AddScoped<IProfileProgressionRepository, ProfileProgressionRepository>();
builder.Services.AddScoped<ILeaderboardSponsorRepository, LeaderboardSponsorRepository>();
builder.Services.AddScoped<IGrowthRepository, GrowthRepository>();
builder.Services.AddScoped<ISquadRepository, SquadRepository>();
builder.Services.AddScoped<IChallengeInviteRepository, ChallengeInviteRepository>();
builder.Services.AddScoped<IFriendRepository, FriendRepository>();
builder.Services.AddScoped<IDirectMessageRepository, DirectMessageRepository>();
builder.Services.AddScoped<IUserPresenceRepository, UserPresenceRepository>();
builder.Services.AddScoped<ISupportRepository, SupportRepository>();
builder.Services.AddScoped<IUserPushSubscriptionRepository, UserPushSubscriptionRepository>();

builder.Services.AddScoped<IWordScrambleSessionRepository, WordScrambleSessionRepository>();
builder.Services.AddScoped<IWordScrambleRoundRepository, WordScrambleRoundRepository>();
builder.Services.AddScoped<IWordScrambleAnswerRepository, WordScrambleAnswerRepository>();
builder.Services.AddScoped<IWordScrambleScoreLedgerRepository, WordScrambleScoreLedgerRepository>();
builder.Services.AddScoped<IWordScrambleLeaderboardRepository, WordScrambleLeaderboardRepository>();
builder.Services.AddScoped<IWordScrambleSessionResultRepository, WordScrambleSessionResultRepository>();
builder.Services.AddScoped<IWordScrambleWordRepository, WordScrambleWordRepository>();

builder.Services.AddScoped<WordScrambleMaskService>();
builder.Services.AddScoped<WordScrambleRoundBuilderService>();
builder.Services.AddScoped<WordScrambleAnswerService>();

builder.Services.AddScoped<WordScrambleStateService>();
builder.Services.AddScoped<WordScrambleSessionStatusService>();
builder.Services.AddScoped<WordScrambleSessionFinalizerService>();

builder.Services.AddScoped<ProgressionService>();
builder.Services.AddScoped<MessageModerationService>();
builder.Services.AddSingleton<BasicProfanityFilterService>();
builder.Services.AddScoped<RoomModerationService>();
builder.Services.AddScoped<ChatModerationService>();
builder.Services.AddScoped<BattleTriviaSessionSummaryService>();
builder.Services.AddScoped<BattleTriviaProfileStatsService>();
builder.Services.AddScoped<TriviaSessionFinalizerService>();
builder.Services.AddScoped<JwtTokenGenerator>();
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<RoomService>();
builder.Services.AddScoped<ChatService>();
builder.Services.AddScoped<TriviaAnswerService>();
builder.Services.AddScoped<TriviaLeaderboardService>();
builder.Services.AddScoped<BattleTriviaSessionStatusService>();
builder.Services.AddScoped<AdminTriviaQuestionService>();
builder.Services.AddScoped<AdminWordScrambleWordService>();
builder.Services.AddScoped<AdminUserService>();
builder.Services.AddScoped<AdminBattleTriviaSettingsService>();
builder.Services.AddScoped<AdminLeaderboardSponsorService>();
builder.Services.AddScoped<RoomModerationStateService>();
builder.Services.AddScoped<ProfileService>();
builder.Services.AddScoped<UserSchemaService>();
builder.Services.AddScoped<EmailDeliveryService>();
builder.Services.AddScoped<ProgressionRealtimeService>();
builder.Services.AddScoped<GameLeaderboardService>();
builder.Services.AddScoped<MentionNotificationService>();
builder.Services.AddScoped<LeaderboardSponsorService>();
builder.Services.AddScoped<LeaderboardSponsorSchemaService>();
builder.Services.AddScoped<LeaderboardShareService>();
builder.Services.AddScoped<GrowthSchemaService>();
builder.Services.AddScoped<GrowthAnalyticsService>();
builder.Services.AddScoped<SquadSchemaService>();
builder.Services.AddScoped<SquadService>();
builder.Services.AddScoped<ChallengeInviteSchemaService>();
builder.Services.AddScoped<ChallengeInviteService>();
builder.Services.AddScoped<AchievementSchemaService>();
builder.Services.AddScoped<FriendSchemaService>();
builder.Services.AddScoped<FriendService>();
builder.Services.AddScoped<ProfileMissionService>();
builder.Services.AddScoped<DirectMessageSchemaService>();
builder.Services.AddScoped<DirectMessageService>();
builder.Services.AddScoped<WebPushSchemaService>();
builder.Services.AddScoped<WebPushService>();
builder.Services.AddScoped<SupportSchemaService>();
builder.Services.AddScoped<SupportService>();
if (redisOptions.Enabled &&
    redisOptions.UsePresence &&
    !string.IsNullOrWhiteSpace(redisOptions.ConnectionString))
{
    builder.Services.AddSingleton<IOnlinePresenceTracker, RedisOnlinePresenceTracker>();
}
else
{
    builder.Services.AddSingleton<IOnlinePresenceTracker, InMemoryOnlinePresenceTracker>();
}

if (redisOptions.Enabled &&
    redisOptions.UseChatRateLimiting &&
    !string.IsNullOrWhiteSpace(redisOptions.ConnectionString))
{
    builder.Services.AddSingleton<IChatRateLimitService, RedisChatRateLimitService>();
}
else
{
    builder.Services.AddSingleton<IChatRateLimitService, InMemoryChatRateLimitService>();
}

builder.Services.AddSingleton<UserPresenceService>();

builder.Services.AddHostedService<BattleTriviaHostedService>();
builder.Services.AddHostedService<WordScrambleHostedService>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        policy
            .WithOrigins(
                "http://192.168.0.161:5173",
                "https://brotechnodevs.co.za",
                "https://www.brotechnodevs.co.za",
                "http://localhost:5173",
                "http://localhost:5174")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

var jwtSection = builder.Configuration.GetSection(JwtOptions.SectionName);
var jwtOptions = jwtSection.Get<JwtOptions>()!;

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateIssuerSigningKey = true,
            ValidateLifetime = true,
            ValidIssuer = jwtOptions.Issuer,
            ValidAudience = jwtOptions.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtOptions.Key))
        };

        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];

                var path = context.HttpContext.Request.Path;
                if (!string.IsNullOrEmpty(accessToken) &&
                    path.StartsWithSegments("/hubs/chat"))
                {
                    context.Token = accessToken;
                }

                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("Frontend");

app.UseDefaultFiles();
app.UseStaticFiles();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<Bts.Api.Hubs.ChatHub>("/hubs/chat");

using (var scope = app.Services.CreateScope())
{
    var userSchemaService = scope.ServiceProvider.GetRequiredService<UserSchemaService>();
    await userSchemaService.EnsureAsync();
    var schemaService = scope.ServiceProvider.GetRequiredService<LeaderboardSponsorSchemaService>();
    await schemaService.EnsureAsync();
    var growthSchemaService = scope.ServiceProvider.GetRequiredService<GrowthSchemaService>();
    await growthSchemaService.EnsureAsync();
    var squadSchemaService = scope.ServiceProvider.GetRequiredService<SquadSchemaService>();
    await squadSchemaService.EnsureAsync();
    var challengeInviteSchemaService = scope.ServiceProvider.GetRequiredService<ChallengeInviteSchemaService>();
    await challengeInviteSchemaService.EnsureAsync();
    var achievementSchemaService = scope.ServiceProvider.GetRequiredService<AchievementSchemaService>();
    await achievementSchemaService.EnsureAsync();
    var friendSchemaService = scope.ServiceProvider.GetRequiredService<FriendSchemaService>();
    await friendSchemaService.EnsureAsync();
    var directMessageSchemaService = scope.ServiceProvider.GetRequiredService<DirectMessageSchemaService>();
    await directMessageSchemaService.EnsureAsync();
    var webPushSchemaService = scope.ServiceProvider.GetRequiredService<WebPushSchemaService>();
    await webPushSchemaService.EnsureAsync();
    var supportSchemaService = scope.ServiceProvider.GetRequiredService<SupportSchemaService>();
    await supportSchemaService.EnsureAsync();
}

app.Run();
