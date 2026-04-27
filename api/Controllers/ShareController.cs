using System.Net;
using System.Text;
using Bts.Api.Models.Dtos;
using Bts.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Bts.Api.Controllers;

[ApiController]
[AllowAnonymous]
[Route("share")]
public sealed class ShareController : ControllerBase
{
    private readonly LeaderboardShareService _leaderboardShareService;
    private readonly GrowthAnalyticsService _growthAnalyticsService;
    private readonly SquadService _squadService;

    public ShareController(
        LeaderboardShareService leaderboardShareService,
        GrowthAnalyticsService growthAnalyticsService,
        SquadService squadService)
    {
        _leaderboardShareService = leaderboardShareService;
        _growthAnalyticsService = growthAnalyticsService;
        _squadService = squadService;
    }

    [HttpGet("leaderboard")]
    public async Task<IActionResult> Leaderboard(
        [FromQuery] string mode = "combined",
        [FromQuery] string period = "current",
        [FromQuery] Guid? userId = null)
    {
        if (userId is null || userId == Guid.Empty)
            return BadRequest("Missing userId.");

        try
        {
            var card = await _leaderboardShareService.GetAsync(mode, period, userId.Value);
            return Content(BuildHtml(card), "text/html; charset=utf-8");
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpGet("leaderboard/image.svg")]
    public async Task<IActionResult> LeaderboardImage(
        [FromQuery] string mode = "combined",
        [FromQuery] string period = "current",
        [FromQuery] Guid? userId = null)
    {
        if (userId is null || userId == Guid.Empty)
            return BadRequest("Missing userId.");

        try
        {
            var card = await _leaderboardShareService.GetAsync(mode, period, userId.Value);
            return Content(BuildSvg(card), "image/svg+xml; charset=utf-8");
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPost("leaderboard/view")]
    public async Task<IActionResult> TrackLeaderboardView(
        [FromQuery] string mode = "combined",
        [FromQuery] string period = "current",
        [FromQuery] Guid? userId = null,
        [FromQuery] string source = "leaderboard-share")
    {
        if (userId is null || userId == Guid.Empty)
            return BadRequest();

        if (string.Equals(source, "friend-challenge", StringComparison.OrdinalIgnoreCase))
        {
            await _growthAnalyticsService.TrackShareViewAsync(
                userId.Value,
                mode,
                period,
                Request.Headers.UserAgent.ToString());
        }
        else
        {
            await _growthAnalyticsService.TrackShareViewAsync(
                userId.Value,
                mode,
                period,
                Request.Headers.UserAgent.ToString());
        }

        return Ok(new { ok = true });
    }

    [HttpGet("leaderboard/join")]
    public async Task<IActionResult> JoinLeaderboardShare(
        [FromQuery] string mode = "combined",
        [FromQuery] string period = "current",
        [FromQuery] Guid? userId = null,
        [FromQuery] string source = "leaderboard-share",
        [FromQuery] string target = "register")
    {
        if (userId is null || userId == Guid.Empty)
            return BadRequest("Missing userId.");

        await _growthAnalyticsService.TrackShareJoinClickAsync(
            userId.Value,
            mode,
            period,
            Request.Headers.UserAgent.ToString());

        var destination = string.Equals(target, "login", StringComparison.OrdinalIgnoreCase)
            ? "login"
            : "register";
        var webBaseUrl = ResolveWebBaseUrl();
        var redirectUrl =
            $"{webBaseUrl}/{destination}?ref={userId.Value}&source={WebUtility.UrlEncode(source)}&mode={WebUtility.UrlEncode(mode)}&period={WebUtility.UrlEncode(period)}";

        return Redirect(redirectUrl);
    }

    [HttpGet("challenge")]
    public async Task<IActionResult> Challenge(
        [FromQuery] string mode = "combined",
        [FromQuery] string period = "current",
        [FromQuery] Guid? challengerUserId = null,
        [FromQuery] Guid? rivalUserId = null)
    {
        if (challengerUserId is null || challengerUserId == Guid.Empty)
            return BadRequest("Missing challengerUserId.");
        if (rivalUserId is null || rivalUserId == Guid.Empty)
            return BadRequest("Missing rivalUserId.");

        try
        {
            var card = await _leaderboardShareService.GetChallengeAsync(
                mode,
                period,
                challengerUserId.Value,
                rivalUserId.Value);
            return Content(BuildChallengeHtml(card), "text/html; charset=utf-8");
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpGet("challenge/image.svg")]
    public async Task<IActionResult> ChallengeImage(
        [FromQuery] string mode = "combined",
        [FromQuery] string period = "current",
        [FromQuery] Guid? challengerUserId = null,
        [FromQuery] Guid? rivalUserId = null)
    {
        if (challengerUserId is null || challengerUserId == Guid.Empty)
            return BadRequest("Missing challengerUserId.");
        if (rivalUserId is null || rivalUserId == Guid.Empty)
            return BadRequest("Missing rivalUserId.");

        try
        {
            var card = await _leaderboardShareService.GetChallengeAsync(
                mode,
                period,
                challengerUserId.Value,
                rivalUserId.Value);
            return Content(BuildChallengeSvg(card), "image/svg+xml; charset=utf-8");
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpGet("squad")]
    public async Task<IActionResult> Squad(
        [FromQuery] string inviteCode = "",
        [FromQuery] string mode = "combined",
        [FromQuery] string period = "current")
    {
        try
        {
            var card = await _squadService.GetShareCardAsync(inviteCode, mode, period);
            return Content(BuildSquadHtml(card), "text/html; charset=utf-8");
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpGet("squad/image.svg")]
    public async Task<IActionResult> SquadImage(
        [FromQuery] string inviteCode = "",
        [FromQuery] string mode = "combined",
        [FromQuery] string period = "current")
    {
        try
        {
            var card = await _squadService.GetShareCardAsync(inviteCode, mode, period);
            return Content(BuildSquadSvg(card), "image/svg+xml; charset=utf-8");
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpGet("squad-challenge")]
    public async Task<IActionResult> SquadChallenge(
        [FromQuery] string challengerInviteCode = "",
        [FromQuery] string rivalInviteCode = "",
        [FromQuery] string mode = "combined",
        [FromQuery] string period = "current")
    {
        try
        {
            var card = await _squadService.GetChallengeCardAsync(
                challengerInviteCode,
                rivalInviteCode,
                mode,
                period);
            return Content(BuildSquadChallengeHtml(card), "text/html; charset=utf-8");
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpGet("squad-challenge/image.svg")]
    public async Task<IActionResult> SquadChallengeImage(
        [FromQuery] string challengerInviteCode = "",
        [FromQuery] string rivalInviteCode = "",
        [FromQuery] string mode = "combined",
        [FromQuery] string period = "current")
    {
        try
        {
            var card = await _squadService.GetChallengeCardAsync(
                challengerInviteCode,
                rivalInviteCode,
                mode,
                period);
            return Content(BuildSquadChallengeSvg(card), "image/svg+xml; charset=utf-8");
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpGet("recap/player")]
    public async Task<IActionResult> PlayerRecap(
        [FromQuery] Guid? userId = null,
        [FromQuery] string mode = "combined",
        [FromQuery] string period = "previous")
    {
        if (userId is null || userId == Guid.Empty)
            return BadRequest("Missing userId.");

        try
        {
            var card = await _leaderboardShareService.GetAsync(mode, period, userId.Value);
            return Content(BuildPlayerRecapHtml(card), "text/html; charset=utf-8");
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpGet("recap/player/image.svg")]
    public async Task<IActionResult> PlayerRecapImage(
        [FromQuery] Guid? userId = null,
        [FromQuery] string mode = "combined",
        [FromQuery] string period = "previous")
    {
        if (userId is null || userId == Guid.Empty)
            return BadRequest("Missing userId.");

        try
        {
            var card = await _leaderboardShareService.GetAsync(mode, period, userId.Value);
            return Content(BuildPlayerRecapSvg(card), "image/svg+xml; charset=utf-8");
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpGet("recap/squad")]
    public async Task<IActionResult> SquadRecap(
        [FromQuery] string inviteCode = "",
        [FromQuery] string mode = "combined",
        [FromQuery] string period = "previous")
    {
        try
        {
            var card = await _squadService.GetShareCardAsync(inviteCode, mode, period);
            return Content(BuildSquadRecapHtml(card), "text/html; charset=utf-8");
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpGet("recap/squad/image.svg")]
    public async Task<IActionResult> SquadRecapImage(
        [FromQuery] string inviteCode = "",
        [FromQuery] string mode = "combined",
        [FromQuery] string period = "previous")
    {
        try
        {
            var card = await _squadService.GetShareCardAsync(inviteCode, mode, period);
            return Content(BuildSquadRecapSvg(card), "image/svg+xml; charset=utf-8");
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    private string BuildHtml(LeaderboardShareCardDto card)
    {
        var title = BuildTitle(card);
        var description = BuildDescription(card);
        var apiBase = $"{Request.Scheme}://{Request.Host}";
        var imageUrl =
            $"{apiBase}/share/leaderboard/image.svg?mode={WebUtility.UrlEncode(card.Mode)}&period={WebUtility.UrlEncode(card.Period)}&userId={card.SharerUserId}";
        var canonicalUrl =
            $"{apiBase}/share/leaderboard?mode={WebUtility.UrlEncode(card.Mode)}&period={WebUtility.UrlEncode(card.Period)}&userId={card.SharerUserId}";
        var webBaseUrl = ResolveWebBaseUrl();
        var signupUrl =
            $"{apiBase}/share/leaderboard/join?mode={WebUtility.UrlEncode(card.Mode)}&period={WebUtility.UrlEncode(card.Period)}&userId={card.SharerUserId}&target=register";
        var loginUrl =
            $"{apiBase}/share/leaderboard/join?mode={WebUtility.UrlEncode(card.Mode)}&period={WebUtility.UrlEncode(card.Period)}&userId={card.SharerUserId}&target=login";
        var rowsHtml = BuildRowsHtml(card.Rows);
        var sponsorHtml = BuildSponsorHtml(card.Sponsor);
        var currentOrPrevious = card.IsCurrentWeek ? "Current week" : "Previous week";
        var rankText = card.Rank.HasValue ? $"#{card.Rank}" : "Chasing the board";
        var scoreText = card.Score.HasValue ? $"{card.Score} pts" : "Join the race";
        var boardLink = $"{webBaseUrl}/leaderboards?mode={WebUtility.UrlEncode(card.Mode)}&period={WebUtility.UrlEncode(card.Period)}";

        var html = $$"""
        <!doctype html>
        <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>{{Encode(title)}}</title>
          <meta name="description" content="{{Encode(description)}}" />
          <meta property="og:type" content="website" />
          <meta property="og:title" content="{{Encode(title)}}" />
          <meta property="og:description" content="{{Encode(description)}}" />
          <meta property="og:url" content="{{Encode(canonicalUrl)}}" />
          <meta property="og:image" content="{{Encode(imageUrl)}}" />
          <meta property="og:image:alt" content="{{Encode(title)}}" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="{{Encode(title)}}" />
          <meta name="twitter:description" content="{{Encode(description)}}" />
          <meta name="twitter:image" content="{{Encode(imageUrl)}}" />
          <style>
            :root { color-scheme: dark; }
            * { box-sizing: border-box; }
            body {
              margin: 0;
              font-family: Inter, Segoe UI, sans-serif;
              background:
                radial-gradient(circle at top left, rgba(59,130,246,.18), transparent 28%),
                radial-gradient(circle at bottom right, rgba(245,158,11,.12), transparent 24%),
                #09090b;
              color: #fff;
            }
            .shell { max-width: 1180px; margin: 0 auto; padding: 28px 18px 60px; }
            .topbar { display:flex; justify-content:space-between; align-items:center; gap:12px; flex-wrap:wrap; margin-bottom:16px; }
            .brand { display:inline-flex; gap:10px; align-items:center; border:1px solid rgba(255,255,255,.08); background:rgba(255,255,255,.04); border-radius:999px; padding:10px 14px; font-size:12px; text-transform:uppercase; letter-spacing:.16em; color:#d4d4d8; }
            .cta-group { display:flex; gap:10px; flex-wrap:wrap; }
            .cta, .cta-alt { border-radius:999px; padding:12px 18px; text-decoration:none; font-weight:700; font-size:14px; }
            .cta { background:#fff; color:#0a0a0a; }
            .cta-alt { border:1px solid rgba(255,255,255,.1); color:#fff; background:rgba(255,255,255,.04); }
            .hero {
              display:grid; gap:28px; grid-template-columns:1.08fr .92fr;
              border:1px solid rgba(255,255,255,.08); border-radius:32px;
              padding:28px; background:linear-gradient(135deg, rgba(10,10,11,1), rgba(17,24,39,.96));
              box-shadow: 0 24px 60px rgba(0,0,0,.24);
            }
            .badge { display:inline-flex; border-radius:999px; padding:8px 12px; font-size:11px; text-transform:uppercase; letter-spacing:.16em; background:rgba(59,130,246,.14); color:#dbeafe; border:1px solid rgba(96,165,250,.2); }
            h1 { margin:16px 0 0; font-size:clamp(2.3rem,5vw,4.2rem); line-height:.95; letter-spacing:-.05em; max-width:11ch; }
            .lead { margin-top:16px; max-width:42rem; color:#cbd5e1; font-size:17px; line-height:1.75; }
            .stats { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:12px; margin-top:22px; }
            .stat, .board, .why, .sponsor { border-radius:22px; border:1px solid rgba(255,255,255,.08); background:rgba(255,255,255,.04); }
            .stat { padding:16px; }
            .label { font-size:10px; text-transform:uppercase; letter-spacing:.16em; color:#71717a; }
            .value { margin-top:8px; font-size:1.1rem; font-weight:700; }
            .panel-title { font-size:28px; letter-spacing:-.04em; margin:8px 0 0; }
            .spotlight { border-radius:28px; border:1px solid rgba(255,255,255,.08); background:rgba(255,255,255,.04); padding:18px; }
            .grid { display:grid; gap:20px; grid-template-columns:.95fr 1.05fr; margin-top:22px; }
            .why, .board { padding:22px; }
            .why-card { border-radius:20px; border:1px solid rgba(255,255,255,.06); background:rgba(0,0,0,.22); padding:16px; margin-top:12px; }
            .row { display:grid; grid-template-columns:70px minmax(0,1fr) 88px; gap:12px; align-items:center; border-radius:18px; border:1px solid rgba(255,255,255,.08); background:rgba(0,0,0,.22); padding:14px 12px; margin-top:10px; }
            .rank { color:#bfdbfe; font-weight:700; }
            .name { font-size:14px; font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
            .username { margin-top:4px; font-size:11px; color:#71717a; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
            .score { text-align:right; font-weight:700; }
            .sponsor { margin-top:18px; padding:18px; }
            .sponsor h3 { margin:8px 0 0; font-size:22px; }
            .sponsor p { color:#d4d4d8; line-height:1.7; }
            .sponsor a { color:#fde68a; text-decoration:none; font-weight:700; }
            @media (max-width: 980px) {
              .hero, .grid { grid-template-columns:1fr; }
              .stats { grid-template-columns:1fr; }
              .shell { padding:20px 14px 42px; }
              .hero, .why, .board { padding:18px; }
            }
          </style>
        </head>
        <body>
          <div class="shell">
            <div class="topbar">
              <div class="brand">BTS <span style="color:#71717a">Weekly competition</span></div>
              <div class="cta-group">
                <a class="cta-alt" href="{{Encode(loginUrl)}}">Log in</a>
                <a class="cta" href="{{Encode(signupUrl)}}">Create account</a>
              </div>
            </div>

            <section class="hero">
              <div>
                <div class="badge">{{Encode(card.Label)}} - {{currentOrPrevious}}</div>
                <h1>{{Encode(BuildHeroTitle(card))}}</h1>
                <p class="lead">{{Encode(BuildHeroCopy(card))}}</p>

                <div class="stats">
                  <div class="stat">
                    <div class="label">Sharer</div>
                    <div class="value">{{Encode(card.SharerName)}}</div>
                  </div>
                  <div class="stat">
                    <div class="label">Rank</div>
                    <div class="value">{{Encode(rankText)}}</div>
                  </div>
                  <div class="stat">
                    <div class="label">Score</div>
                    <div class="value">{{Encode(scoreText)}}</div>
                  </div>
                </div>

                <div class="cta-group" style="margin-top:22px">
                  <a class="cta" href="{{Encode(signupUrl)}}">Create account and beat this rank</a>
                  <a class="cta-alt" href="{{Encode(loginUrl)}}">I already have an account</a>
                </div>
              </div>

              <div class="spotlight">
                <div class="label">Shared leaderboard</div>
                <div class="panel-title">The board people see before they sign up</div>
                {{rowsHtml}}
              </div>
            </section>

            {{sponsorHtml}}

            <div class="grid">
              <section class="why">
                <div class="label">Why people join</div>
                <div class="panel-title">Real weekly pressure. Real bragging rights.</div>
                <div class="why-card"><strong>Live leaderboard energy</strong><br/><span style="color:#a1a1aa">You are not joining a dead page. You are stepping into an active weekly climb.</span></div>
                <div class="why-card"><strong>Fast to start</strong><br/><span style="color:#a1a1aa">Create your account, jump into the room, and start stacking points immediately.</span></div>
                <div class="why-card"><strong>Different ways to win</strong><br/><span style="color:#a1a1aa">Battle Trivia rewards sharp answers. Word Scramble rewards speed and consistency.</span></div>
              </section>

              <section class="board">
                <div class="label">Callout</div>
                <div class="panel-title">{{Encode(card.SharerName)}} shared this for a reason</div>
                <p style="color:#d4d4d8; line-height:1.8; margin-top:14px">
                  {{Encode(BuildConversionCopy(card))}}
                </p>
                <div class="cta-group" style="margin-top:18px">
                  <a class="cta" href="{{Encode(signupUrl)}}">Create your BTS account</a>
                  <a class="cta-alt" href="{{Encode(boardLink)}}">See the full board</a>
                </div>
              </section>
            </div>
          </div>
          <script>
            window.addEventListener("load", function () {
              fetch("/share/leaderboard/view?mode={{Encode(card.Mode)}}&period={{Encode(card.Period)}}&userId={{card.SharerUserId}}", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                keepalive: true
              }).catch(function () { return null; });
            });
          </script>
        </body>
        </html>
        """;

        return html;
    }

    private string BuildChallengeHtml(LeaderboardChallengeCardDto card)
    {
        var title = BuildChallengeTitle(card);
        var description = BuildChallengeDescription(card);
        var apiBase = $"{Request.Scheme}://{Request.Host}";
        var imageUrl =
            $"{apiBase}/share/challenge/image.svg?mode={WebUtility.UrlEncode(card.Mode)}&period={WebUtility.UrlEncode(card.Period)}&challengerUserId={card.ChallengerUserId}&rivalUserId={card.RivalUserId}";
        var canonicalUrl =
            $"{apiBase}/share/challenge?mode={WebUtility.UrlEncode(card.Mode)}&period={WebUtility.UrlEncode(card.Period)}&challengerUserId={card.ChallengerUserId}&rivalUserId={card.RivalUserId}";
        var signupUrl =
            $"{apiBase}/share/leaderboard/join?mode={WebUtility.UrlEncode(card.Mode)}&period={WebUtility.UrlEncode(card.Period)}&userId={card.ChallengerUserId}&source=friend-challenge&target=register";
        var loginUrl =
            $"{apiBase}/share/leaderboard/join?mode={WebUtility.UrlEncode(card.Mode)}&period={WebUtility.UrlEncode(card.Period)}&userId={card.ChallengerUserId}&source=friend-challenge&target=login";
        var rowsHtml = BuildChallengeRowsHtml(card.Rows, card.ChallengerUserId, card.RivalUserId);
        var sponsorHtml = BuildSponsorHtml(card.Sponsor);
        var currentOrPrevious = card.IsCurrentWeek ? "Current week" : "Previous week";
        var challengerRank = card.ChallengerRow?.Rank is int challengerRankValue ? $"#{challengerRankValue}" : "Unranked";
        var rivalRank = card.RivalRow?.Rank is int rivalRankValue ? $"#{rivalRankValue}" : "Unranked";

        var html = $$"""
        <!doctype html>
        <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>{{Encode(title)}}</title>
          <meta name="description" content="{{Encode(description)}}" />
          <meta property="og:type" content="website" />
          <meta property="og:title" content="{{Encode(title)}}" />
          <meta property="og:description" content="{{Encode(description)}}" />
          <meta property="og:url" content="{{Encode(canonicalUrl)}}" />
          <meta property="og:image" content="{{Encode(imageUrl)}}" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="{{Encode(title)}}" />
          <meta name="twitter:description" content="{{Encode(description)}}" />
          <meta name="twitter:image" content="{{Encode(imageUrl)}}" />
          <style>
            :root { color-scheme: dark; }
            * { box-sizing: border-box; }
            body { margin: 0; font-family: Inter, Segoe UI, sans-serif; background: radial-gradient(circle at top left, rgba(249,115,22,.15), transparent 26%), radial-gradient(circle at bottom right, rgba(59,130,246,.16), transparent 28%), #09090b; color:#fff; }
            .shell { max-width: 1180px; margin:0 auto; padding:28px 18px 60px; }
            .hero { border:1px solid rgba(255,255,255,.08); border-radius:32px; padding:28px; background:linear-gradient(135deg, rgba(10,10,11,1), rgba(17,24,39,.96)); box-shadow: 0 24px 60px rgba(0,0,0,.24); }
            .top { display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; }
            .badge { display:inline-flex; border-radius:999px; padding:8px 12px; font-size:11px; text-transform:uppercase; letter-spacing:.16em; background:rgba(249,115,22,.14); color:#fed7aa; border:1px solid rgba(251,146,60,.24); }
            .cta-group { display:flex; gap:10px; flex-wrap:wrap; }
            .cta, .cta-alt { border-radius:999px; padding:12px 18px; text-decoration:none; font-weight:700; font-size:14px; }
            .cta { background:#fff; color:#0a0a0a; }
            .cta-alt { border:1px solid rgba(255,255,255,.1); color:#fff; background:rgba(255,255,255,.04); }
            h1 { margin:18px 0 0; font-size:clamp(2.2rem,5vw,4.4rem); line-height:.95; letter-spacing:-.05em; max-width:13ch; }
            .lead { margin-top:16px; max-width:44rem; color:#cbd5e1; font-size:17px; line-height:1.75; }
            .duel { display:grid; gap:16px; grid-template-columns:1fr 110px 1fr; margin-top:24px; align-items:stretch; }
            .player { border-radius:24px; border:1px solid rgba(255,255,255,.08); background:rgba(255,255,255,.04); padding:18px; }
            .eyebrow { font-size:10px; text-transform:uppercase; letter-spacing:.16em; color:#71717a; }
            .name { margin-top:10px; font-size:28px; font-weight:700; letter-spacing:-.04em; }
            .rank { margin-top:12px; font-size:42px; font-weight:700; color:#dbeafe; }
            .score { margin-top:6px; font-size:18px; color:#e5e7eb; }
            .vs { display:flex; align-items:center; justify-content:center; font-size:30px; font-weight:800; color:#f9a8d4; letter-spacing:.14em; }
            .board { margin-top:24px; border-radius:26px; border:1px solid rgba(255,255,255,.08); background:rgba(255,255,255,.04); padding:20px; }
            .row { display:grid; grid-template-columns:76px minmax(0,1fr) 90px; gap:12px; align-items:center; border-radius:18px; border:1px solid rgba(255,255,255,.08); background:rgba(0,0,0,.22); padding:14px 12px; margin-top:10px; }
            .row-hot { border-color: rgba(96,165,250,.22); background: rgba(59,130,246,.10); }
            .row-rival { border-color: rgba(251,146,60,.22); background: rgba(249,115,22,.10); }
            .row-both { border-color: rgba(244,114,182,.26); background: rgba(244,114,182,.10); }
            .row-rank { color:#bfdbfe; font-weight:700; }
            .row-name { font-size:14px; font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
            .row-user { margin-top:4px; font-size:11px; color:#71717a; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
            .row-score { text-align:right; font-weight:700; }
            @media (max-width: 980px) {
              .shell { padding:20px 14px 42px; }
              .hero, .board { padding:18px; }
              .duel { grid-template-columns:1fr; }
              .vs { min-height:56px; }
            }
          </style>
        </head>
        <body>
          <div class="shell">
            <section class="hero">
              <div class="top">
                <div class="badge">{{Encode(card.Label)}} - {{currentOrPrevious}}</div>
                <div class="cta-group">
                  <a class="cta-alt" href="{{Encode(loginUrl)}}">Log in</a>
                  <a class="cta" href="{{Encode(signupUrl)}}">Accept challenge</a>
                </div>
              </div>
              <h1>{{Encode(card.ChallengerName)}} just called out {{card.RivalName}}</h1>
              <p class="lead">{{Encode(BuildChallengeHeroCopy(card))}}</p>

              <div class="duel">
                <div class="player">
                  <div class="eyebrow">Challenger</div>
                  <div class="name">{{Encode(card.ChallengerName)}}</div>
                  <div class="eyebrow" style="margin-top:6px">@{{Encode(card.ChallengerUsername)}}</div>
                  <div class="rank">{{Encode(challengerRank)}}</div>
                  <div class="score">{{card.ChallengerRow?.Score ?? 0}} pts</div>
                </div>
                <div class="vs">VS</div>
                <div class="player">
                  <div class="eyebrow">Target</div>
                  <div class="name">{{Encode(card.RivalName)}}</div>
                  <div class="eyebrow" style="margin-top:6px">@{{Encode(card.RivalUsername)}}</div>
                  <div class="rank">{{Encode(rivalRank)}}</div>
                  <div class="score">{{card.RivalRow?.Score ?? 0}} pts</div>
                </div>
              </div>

              <div class="cta-group" style="margin-top:22px">
                <a class="cta" href="{{Encode(signupUrl)}}">Create account and join the race</a>
                <a class="cta-alt" href="{{Encode(loginUrl)}}">I already have an account</a>
              </div>
            </section>

            {{sponsorHtml}}

            <section class="board">
              <div class="eyebrow">Leaderboard heat</div>
              <div style="margin-top:10px; font-size:26px; font-weight:700; letter-spacing:-.04em">This rivalry is happening on the board already</div>
              {{rowsHtml}}
            </section>
          </div>
          <script>
            window.addEventListener("load", function () {
              fetch("/share/leaderboard/view?mode={{Encode(card.Mode)}}&period={{Encode(card.Period)}}&userId={{card.ChallengerUserId}}&source=friend-challenge", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                keepalive: true
              }).catch(function () { return null; });
            });
          </script>
        </body>
        </html>
        """;

        return html;
    }

    private static string BuildSvg(LeaderboardShareCardDto card)
    {
        var title = Encode(BuildTitle(card));
        var description = Encode(BuildDescription(card));
        var sharer = Encode(TruncateForSvg(card.SharerName, 18));
        var sponsor = card.Sponsor is null ? string.Empty : Encode(TruncateForSvg(card.Sponsor.Name, 32));
        var rank = card.Rank.HasValue ? $"#{card.Rank}" : "NEW";
        var score = card.Score.HasValue ? $"{card.Score} pts" : "Join now";
        var leaderboardLabel = Encode(card.Label);
        var rowsSvg = BuildRowsSvg(card.Rows);
        var sponsorSvg = string.IsNullOrWhiteSpace(sponsor)
            ? string.Empty
            : $$"""
               <rect x="44" y="530" width="620" height="56" rx="18" fill="rgba(245,158,11,0.10)" stroke="rgba(245,158,11,0.20)" />
               <text x="72" y="555" fill="#fbbf24" font-size="14" font-family="Segoe UI, Arial, sans-serif" letter-spacing="2">SPONSORED THIS WEEK</text>
               <text x="72" y="576" fill="#ffffff" font-size="22" font-family="Segoe UI, Arial, sans-serif" font-weight="700">{{sponsor}}</text>
               """;

        return $$"""
        <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
          <defs>
            <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#0f172a" />
              <stop offset="52%" stop-color="#111827" />
              <stop offset="100%" stop-color="#09090b" />
            </linearGradient>
            <radialGradient id="glowA" cx="18%" cy="10%" r="48%">
              <stop offset="0%" stop-color="rgba(59,130,246,0.32)" />
              <stop offset="100%" stop-color="rgba(59,130,246,0)" />
            </radialGradient>
            <radialGradient id="glowB" cx="88%" cy="84%" r="34%">
              <stop offset="0%" stop-color="rgba(245,158,11,0.22)" />
              <stop offset="100%" stop-color="rgba(245,158,11,0)" />
            </radialGradient>
          </defs>

          <rect width="1200" height="630" fill="url(#bg)" />
          <rect width="1200" height="630" fill="url(#glowA)" />
          <rect width="1200" height="630" fill="url(#glowB)" />
          <rect x="34" y="34" width="1132" height="562" rx="34" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.08)" />

          <text x="64" y="92" fill="#93c5fd" font-size="18" font-family="Segoe UI, Arial, sans-serif" letter-spacing="3">BTS WEEKLY COMPETITION</text>
          <text x="64" y="158" fill="#ffffff" font-size="50" font-family="Segoe UI, Arial, sans-serif" font-weight="700">{{title}}</text>
          <text x="64" y="198" fill="#cbd5e1" font-size="22" font-family="Segoe UI, Arial, sans-serif">{{description}}</text>

          <rect x="64" y="236" width="340" height="280" rx="28" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.08)" />
          <text x="92" y="280" fill="#71717a" font-size="16" font-family="Segoe UI, Arial, sans-serif" letter-spacing="2">SHARED BY</text>
          <text x="92" y="334" fill="#ffffff" font-size="40" font-family="Segoe UI, Arial, sans-serif" font-weight="700">{{sharer}}</text>
          <text x="92" y="384" fill="#bfdbfe" font-size="58" font-family="Segoe UI, Arial, sans-serif" font-weight="700">{{rank}}</text>
          <text x="92" y="426" fill="#ffffff" font-size="28" font-family="Segoe UI, Arial, sans-serif">{{score}}</text>
          <text x="92" y="474" fill="#a1a1aa" font-size="18" font-family="Segoe UI, Arial, sans-serif">{{leaderboardLabel}}</text>
          <text x="92" y="506" fill="#f8fafc" font-size="20" font-family="Segoe UI, Arial, sans-serif">Create an account and start climbing.</text>

          <g transform="translate(676,236)">
            <text x="0" y="0" fill="#71717a" font-size="16" font-family="Segoe UI, Arial, sans-serif" letter-spacing="2">TOP PLAYERS</text>
            <g transform="translate(0,26)">
              {{rowsSvg}}
            </g>
          </g>

          {{sponsorSvg}}
        </svg>
        """;
    }

    private static string BuildChallengeSvg(LeaderboardChallengeCardDto card)
    {
        var title = Encode(BuildChallengeTitle(card));
        var description = Encode(BuildChallengeDescription(card));
        var challenger = Encode(TruncateForSvg(card.ChallengerName, 18));
        var rival = Encode(TruncateForSvg(card.RivalName, 18));
        var challengerRank = card.ChallengerRow?.Rank is int challengerRankValue ? $"#{challengerRankValue}" : "NEW";
        var rivalRank = card.RivalRow?.Rank is int rivalRankValue ? $"#{rivalRankValue}" : "NEW";
        var challengerScore = $"{card.ChallengerRow?.Score ?? 0} pts";
        var rivalScore = $"{card.RivalRow?.Score ?? 0} pts";

        return $$"""
        <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
          <defs>
            <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#111827" />
              <stop offset="100%" stop-color="#09090b" />
            </linearGradient>
          </defs>
          <rect width="1200" height="630" fill="url(#bg)" />
          <circle cx="180" cy="110" r="180" fill="rgba(249,115,22,0.16)" />
          <circle cx="1040" cy="520" r="220" fill="rgba(59,130,246,0.18)" />
          <rect x="34" y="34" width="1132" height="562" rx="34" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.08)" />
          <text x="64" y="92" fill="#fdba74" font-size="18" font-family="Segoe UI, Arial, sans-serif" letter-spacing="3">BTS FRIEND CHALLENGE</text>
          <text x="64" y="150" fill="#ffffff" font-size="46" font-family="Segoe UI, Arial, sans-serif" font-weight="700">{{title}}</text>
          <text x="64" y="190" fill="#cbd5e1" font-size="22" font-family="Segoe UI, Arial, sans-serif">{{description}}</text>

          <rect x="64" y="244" width="430" height="232" rx="28" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.08)" />
          <text x="92" y="286" fill="#71717a" font-size="16" font-family="Segoe UI, Arial, sans-serif" letter-spacing="2">CHALLENGER</text>
          <text x="92" y="338" fill="#ffffff" font-size="38" font-family="Segoe UI, Arial, sans-serif" font-weight="700">{{challenger}}</text>
          <text x="92" y="390" fill="#bfdbfe" font-size="54" font-family="Segoe UI, Arial, sans-serif" font-weight="700">{{challengerRank}}</text>
          <text x="92" y="428" fill="#ffffff" font-size="24" font-family="Segoe UI, Arial, sans-serif">{{challengerScore}}</text>

          <text x="538" y="360" fill="#f9a8d4" font-size="48" font-family="Segoe UI, Arial, sans-serif" font-weight="800">VS</text>

          <rect x="646" y="244" width="430" height="232" rx="28" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.08)" />
          <text x="674" y="286" fill="#71717a" font-size="16" font-family="Segoe UI, Arial, sans-serif" letter-spacing="2">TARGET</text>
          <text x="674" y="338" fill="#ffffff" font-size="38" font-family="Segoe UI, Arial, sans-serif" font-weight="700">{{rival}}</text>
          <text x="674" y="390" fill="#fed7aa" font-size="54" font-family="Segoe UI, Arial, sans-serif" font-weight="700">{{rivalRank}}</text>
          <text x="674" y="428" fill="#ffffff" font-size="24" font-family="Segoe UI, Arial, sans-serif">{{rivalScore}}</text>

          <text x="64" y="548" fill="#f8fafc" font-size="26" font-family="Segoe UI, Arial, sans-serif" font-weight="700">Create your BTS account and get into the rivalry.</text>
        </svg>
        """;
    }

    private static string BuildRowsHtml(IEnumerable<GameLeaderboardRowDto> rows)
    {
        return string.Join(
            "",
            rows.Select(row =>
                $"""
                <div class="row">
                  <div class="rank">#{row.Rank}</div>
                  <div class="player">
                    <div class="name">{Encode(string.IsNullOrWhiteSpace(row.DisplayName) ? row.Username : row.DisplayName)}</div>
                    <div class="username">@{Encode(row.Username)}</div>
                  </div>
                  <div class="score">{row.Score}</div>
                </div>
                """));
    }

    private static string BuildChallengeRowsHtml(
        IEnumerable<GameLeaderboardRowDto> rows,
        Guid challengerUserId,
        Guid rivalUserId)
    {
        return string.Join(
            "",
            rows.Select(row =>
            {
                var className = row.UserId == challengerUserId && row.UserId == rivalUserId
                    ? "row row-both"
                    : row.UserId == challengerUserId
                    ? "row row-hot"
                    : row.UserId == rivalUserId
                    ? "row row-rival"
                    : "row";

                return $"""
                <div class="{className}">
                  <div class="row-rank">#{row.Rank}</div>
                  <div>
                    <div class="row-name">{Encode(string.IsNullOrWhiteSpace(row.DisplayName) ? row.Username : row.DisplayName)}</div>
                    <div class="row-user">@{Encode(row.Username)}</div>
                  </div>
                  <div class="row-score">{row.Score}</div>
                </div>
                """;
            }));
    }

    private static string BuildRowsSvg(IEnumerable<GameLeaderboardRowDto> rows)
    {
        return string.Join(
            "",
            rows.Take(3).Select((row, index) =>
                $"""
                <g transform="translate(0,{index * 92})">
                  <rect x="0" y="0" width="470" height="76" rx="18" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.08)" />
                  <text x="24" y="46" fill="#bfdbfe" font-size="28" font-family="Segoe UI, Arial, sans-serif" font-weight="700">#{row.Rank}</text>
                  <text x="102" y="34" fill="#ffffff" font-size="24" font-family="Segoe UI, Arial, sans-serif" font-weight="700">{Encode(TruncateForSvg(string.IsNullOrWhiteSpace(row.DisplayName) ? row.Username : row.DisplayName, 22))}</text>
                  <text x="102" y="58" fill="#a1a1aa" font-size="16" font-family="Segoe UI, Arial, sans-serif">@{Encode(TruncateForSvg(row.Username, 24))}</text>
                  <text x="430" y="46" text-anchor="end" fill="#ffffff" font-size="24" font-family="Segoe UI, Arial, sans-serif" font-weight="700">{row.Score}</text>
                </g>
                """));
    }

    private static string BuildSponsorHtml(LeaderboardSponsorDto? sponsor)
    {
        if (sponsor is null)
            return string.Empty;

        var sponsorLinkHtml =
            !string.IsNullOrWhiteSpace(sponsor.WebsiteUrl)
                ? $"<a href=\"{Encode(sponsor.WebsiteUrl!)}\" target=\"_blank\" rel=\"noreferrer\">{Encode(sponsor.CallToActionLabel ?? "Visit sponsor")}</a>"
                : string.Empty;

        return $"""
               <section class="sponsor">
                 <div class="eyebrow">Sponsored this week</div>
                 <h3>{Encode(sponsor.Name)}</h3>
                 <p>{Encode(sponsor.SponsorText)}</p>
                 {sponsorLinkHtml}
               </section>
               """;
    }

    private string ResolveWebBaseUrl()
    {
        if (Request.Host.Host.Contains("localhost", StringComparison.OrdinalIgnoreCase))
            return "http://localhost:5173";

        if (Request.Host.Host.StartsWith("api.", StringComparison.OrdinalIgnoreCase))
            return $"{Request.Scheme}://{Request.Host.Host[4..]}";

        return $"{Request.Scheme}://{Request.Host}";
    }

    private static string BuildTitle(LeaderboardShareCardDto card)
    {
        return card.Rank.HasValue
            ? $"{card.SharerName} is #{card.Rank} on {card.Label}"
            : $"{card.SharerName} shared the {card.Label} on BTS";
    }

    private static string BuildDescription(LeaderboardShareCardDto card)
    {
        return card.Rank.HasValue && card.Score.HasValue
            ? $"{card.SharerName} has {card.Score} points on the {card.Label}. Create your account and join the weekly competition."
            : $"{card.SharerName} shared the weekly BTS leaderboard. Sign up and start playing.";
    }

    private static string BuildHeroTitle(LeaderboardShareCardDto card)
    {
        return card.Rank.HasValue
            ? $"{card.SharerName} is sitting at #{card.Rank} this week"
            : $"{card.SharerName} wants you in the weekly race";
    }

    private static string BuildHeroCopy(LeaderboardShareCardDto card)
    {
        return card.Rank.HasValue && card.Score.HasValue
            ? $"{card.SharerName} is already on the {card.Label} with {card.Score} points. Create your account, jump in, and see how high you can climb before the week ends."
            : $"{card.SharerName} shared the {card.Label}. Create your BTS account, play your first rounds, and get your own name onto the board.";
    }

    private static string BuildConversionCopy(LeaderboardShareCardDto card)
    {
        return card.Rank.HasValue
            ? $"{card.SharerName} is already in the mix. If you have been watching from the outside, this is the moment to create your account and push for your own place on the weekly board."
            : $"{card.SharerName} shared BTS because the weekly board is worth jumping into. Create your account and make your first result count.";
    }

    private static string BuildChallengeTitle(LeaderboardChallengeCardDto card)
    {
        return $"{card.ChallengerName} challenged {card.RivalName} on {card.Label}";
    }

    private static string BuildChallengeDescription(LeaderboardChallengeCardDto card)
    {
        var challengerRank = card.ChallengerRow?.Rank is int challengerRankValue ? $"#{challengerRankValue}" : "unranked";
        var rivalRank = card.RivalRow?.Rank is int rivalRankValue ? $"#{rivalRankValue}" : "unranked";
        return $"{card.ChallengerName} is {challengerRank} and called out {card.RivalName}, who is {rivalRank}. Create your account and join the BTS leaderboard race.";
    }

    private static string BuildChallengeHeroCopy(LeaderboardChallengeCardDto card)
    {
        return $"{card.ChallengerName} just turned the {card.Label} into a direct rivalry with {card.RivalName}. Jump into BTS, claim your own rank, and start challenging people back.";
    }

    private string BuildSquadHtml(SquadShareCardDto card)
    {
        var apiBase = $"{Request.Scheme}://{Request.Host}";
        var title = $"{card.SquadName} is recruiting on BTS";
        var description = $"Join {card.SquadName}, a {card.MemberCount}-member squad competing on {card.Label}.";
        var imageUrl =
            $"{apiBase}/share/squad/image.svg?inviteCode={WebUtility.UrlEncode(card.InviteCode)}&mode={WebUtility.UrlEncode(card.Mode)}&period={WebUtility.UrlEncode(card.Period)}";
        var canonicalUrl =
            $"{apiBase}/share/squad?inviteCode={WebUtility.UrlEncode(card.InviteCode)}&mode={WebUtility.UrlEncode(card.Mode)}&period={WebUtility.UrlEncode(card.Period)}";
        var webBaseUrl = ResolveWebBaseUrl();
        var registerUrl =
            $"{webBaseUrl}/register?source=squad-share&mode={WebUtility.UrlEncode(card.Mode)}&period={WebUtility.UrlEncode(card.Period)}";
        var loginRedirect =
            $"{webBaseUrl}/login?source=squad-share&mode={WebUtility.UrlEncode(card.Mode)}&period={WebUtility.UrlEncode(card.Period)}";
        var rowsHtml = BuildRowsHtml(card.LeaderboardRows);
        var membersHtml = string.Join(
            "",
            card.Members.Take(6).Select(member =>
                $"""<div class="chip">{Encode(member.DisplayName)} <span>@{Encode(member.Username)}</span></div>"""));

        return $$"""
        <!doctype html>
        <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>{{Encode(title)}}</title>
          <meta name="description" content="{{Encode(description)}}" />
          <meta property="og:type" content="website" />
          <meta property="og:title" content="{{Encode(title)}}" />
          <meta property="og:description" content="{{Encode(description)}}" />
          <meta property="og:url" content="{{Encode(canonicalUrl)}}" />
          <meta property="og:image" content="{{Encode(imageUrl)}}" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="{{Encode(title)}}" />
          <meta name="twitter:description" content="{{Encode(description)}}" />
          <meta name="twitter:image" content="{{Encode(imageUrl)}}" />
          <style>
            :root { color-scheme: dark; }
            * { box-sizing: border-box; }
            body { margin:0; font-family: Inter, Segoe UI, sans-serif; background: radial-gradient(circle at top left, rgba(16,185,129,.16), transparent 24%), radial-gradient(circle at bottom right, rgba(59,130,246,.16), transparent 28%), #09090b; color:#fff; }
            .shell { max-width: 1120px; margin:0 auto; padding: 28px 18px 60px; }
            .hero, .board { border:1px solid rgba(255,255,255,.08); border-radius:30px; background:rgba(255,255,255,.04); }
            .hero { padding:28px; }
            .top { display:flex; justify-content:space-between; gap:12px; align-items:center; flex-wrap:wrap; }
            .badge { display:inline-flex; border-radius:999px; padding:8px 12px; font-size:11px; text-transform:uppercase; letter-spacing:.16em; background:rgba(16,185,129,.14); color:#d1fae5; border:1px solid rgba(52,211,153,.22); }
            .cta-group { display:flex; gap:10px; flex-wrap:wrap; }
            .cta, .cta-alt { border-radius:999px; padding:12px 18px; text-decoration:none; font-weight:700; font-size:14px; }
            .cta { background:#fff; color:#0a0a0a; }
            .cta-alt { border:1px solid rgba(255,255,255,.1); color:#fff; background:rgba(255,255,255,.04); }
            h1 { margin:18px 0 0; font-size:clamp(2.2rem,5vw,4.4rem); line-height:.95; letter-spacing:-.05em; max-width:11ch; }
            .lead { margin-top:16px; max-width:42rem; color:#cbd5e1; font-size:17px; line-height:1.75; }
            .stats { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:12px; margin-top:22px; }
            .stat { border-radius:20px; border:1px solid rgba(255,255,255,.08); background:rgba(0,0,0,.22); padding:16px; }
            .label { font-size:10px; text-transform:uppercase; letter-spacing:.16em; color:#71717a; }
            .value { margin-top:8px; font-size:1.1rem; font-weight:700; }
            .chips { display:flex; flex-wrap:wrap; gap:10px; margin-top:22px; }
            .chip { border-radius:999px; border:1px solid rgba(255,255,255,.08); background:rgba(255,255,255,.04); padding:10px 14px; font-size:13px; }
            .chip span { color:#71717a; margin-left:4px; }
            .board { padding:22px; margin-top:22px; }
            @media (max-width: 980px) { .shell { padding:20px 14px 42px; } .hero,.board { padding:18px; } .stats { grid-template-columns:1fr; } }
          </style>
        </head>
        <body>
          <div class="shell">
            <section class="hero">
              <div class="top">
                <div class="badge">BTS Squad Invite</div>
                <div class="cta-group">
                  <a class="cta-alt" href="{{Encode(loginRedirect)}}">Log in</a>
                  <a class="cta" href="{{Encode(registerUrl)}}">Create account</a>
                </div>
              </div>
              <h1>{{Encode(card.SquadName)}} wants new competitors</h1>
              <p class="lead">This squad already has {{card.MemberCount}} member{{(card.MemberCount == 1 ? "" : "s")}} pushing each other on {{Encode(card.Label)}}. Join BTS, use invite code <strong>{{Encode(card.InviteCode)}}</strong>, and get on their board.</p>
              <div class="stats">
                <div class="stat"><div class="label">Invite code</div><div class="value">{{Encode(card.InviteCode)}}</div></div>
                <div class="stat"><div class="label">Members</div><div class="value">{{card.MemberCount}}</div></div>
                <div class="stat"><div class="label">Board</div><div class="value">{{Encode(card.Label)}}</div></div>
              </div>
              <div class="chips">{{membersHtml}}</div>
              <div class="cta-group" style="margin-top:22px">
                <a class="cta" href="{{Encode(registerUrl)}}">Join this squad</a>
                <a class="cta-alt" href="{{Encode(loginRedirect)}}">Already on BTS</a>
              </div>
            </section>
            <section class="board">
              <div class="label">Squad standings</div>
              <div style="margin-top:10px; font-size:26px; font-weight:700; letter-spacing:-.04em">Weekly squad leaderboard</div>
              {{rowsHtml}}
            </section>
          </div>
        </body>
        </html>
        """;
    }

    private static string BuildSquadSvg(SquadShareCardDto card)
    {
        var title = Encode($"{TruncateForSvg(card.SquadName, 22)} is recruiting");
        var subtitle = Encode(card.Label);
        var inviteCode = Encode(card.InviteCode);
        var topName = Encode(TruncateForSvg(card.LeaderboardRows.FirstOrDefault()?.DisplayName ?? card.LeaderboardRows.FirstOrDefault()?.Username ?? "Your crew", 22));
        var topScore = card.LeaderboardRows.FirstOrDefault()?.Score ?? 0;

        return $$"""
        <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
          <rect width="1200" height="630" fill="#09090b" />
          <circle cx="160" cy="120" r="180" fill="rgba(16,185,129,0.16)" />
          <circle cx="1000" cy="500" r="220" fill="rgba(59,130,246,0.18)" />
          <rect x="34" y="34" width="1132" height="562" rx="34" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.08)" />
          <text x="64" y="92" fill="#86efac" font-size="18" font-family="Segoe UI, Arial, sans-serif" letter-spacing="3">BTS SQUAD INVITE</text>
          <text x="64" y="154" fill="#ffffff" font-size="52" font-family="Segoe UI, Arial, sans-serif" font-weight="700">{{title}}</text>
          <text x="64" y="196" fill="#cbd5e1" font-size="24" font-family="Segoe UI, Arial, sans-serif">{{subtitle}}</text>
          <rect x="64" y="246" width="380" height="220" rx="28" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.08)" />
          <text x="92" y="286" fill="#71717a" font-size="16" font-family="Segoe UI, Arial, sans-serif" letter-spacing="2">INVITE CODE</text>
          <text x="92" y="352" fill="#ffffff" font-size="54" font-family="Segoe UI, Arial, sans-serif" font-weight="700">{{inviteCode}}</text>
          <text x="92" y="402" fill="#d1fae5" font-size="22" font-family="Segoe UI, Arial, sans-serif">{{card.MemberCount}} squad members</text>
          <text x="92" y="440" fill="#f8fafc" font-size="20" font-family="Segoe UI, Arial, sans-serif">Join BTS and enter their weekly board.</text>
          <rect x="506" y="246" width="600" height="220" rx="28" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.08)" />
          <text x="536" y="286" fill="#71717a" font-size="16" font-family="Segoe UI, Arial, sans-serif" letter-spacing="2">CURRENT TOP MEMBER</text>
          <text x="536" y="350" fill="#ffffff" font-size="42" font-family="Segoe UI, Arial, sans-serif" font-weight="700">{{topName}}</text>
          <text x="536" y="404" fill="#bfdbfe" font-size="30" font-family="Segoe UI, Arial, sans-serif">{{topScore}} pts</text>
        </svg>
        """;
    }

    private string BuildSquadChallengeHtml(SquadChallengeCardDto card)
    {
        var apiBase = $"{Request.Scheme}://{Request.Host}";
        var title = $"{card.ChallengerSquad.SquadName} challenged {card.RivalSquad.SquadName}";
        var description = $"{card.ChallengerSquad.SquadName} called out {card.RivalSquad.SquadName} on {card.Label}.";
        var imageUrl =
            $"{apiBase}/share/squad-challenge/image.svg?challengerInviteCode={WebUtility.UrlEncode(card.ChallengerSquad.InviteCode)}&rivalInviteCode={WebUtility.UrlEncode(card.RivalSquad.InviteCode)}&mode={WebUtility.UrlEncode(card.Mode)}&period={WebUtility.UrlEncode(card.Period)}";
        var canonicalUrl =
            $"{apiBase}/share/squad-challenge?challengerInviteCode={WebUtility.UrlEncode(card.ChallengerSquad.InviteCode)}&rivalInviteCode={WebUtility.UrlEncode(card.RivalSquad.InviteCode)}&mode={WebUtility.UrlEncode(card.Mode)}&period={WebUtility.UrlEncode(card.Period)}";
        var webBaseUrl = ResolveWebBaseUrl();
        var registerUrl =
            $"{webBaseUrl}/register?source=squad-challenge&mode={WebUtility.UrlEncode(card.Mode)}&period={WebUtility.UrlEncode(card.Period)}";
        var loginUrl =
            $"{webBaseUrl}/login?source=squad-challenge&mode={WebUtility.UrlEncode(card.Mode)}&period={WebUtility.UrlEncode(card.Period)}";
        var challengerTop = card.ChallengerSquad.LeaderboardRows.FirstOrDefault();
        var rivalTop = card.RivalSquad.LeaderboardRows.FirstOrDefault();

        return $$"""
        <!doctype html>
        <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>{{Encode(title)}}</title>
          <meta name="description" content="{{Encode(description)}}" />
          <meta property="og:type" content="website" />
          <meta property="og:title" content="{{Encode(title)}}" />
          <meta property="og:description" content="{{Encode(description)}}" />
          <meta property="og:url" content="{{Encode(canonicalUrl)}}" />
          <meta property="og:image" content="{{Encode(imageUrl)}}" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="{{Encode(title)}}" />
          <meta name="twitter:description" content="{{Encode(description)}}" />
          <meta name="twitter:image" content="{{Encode(imageUrl)}}" />
          <style>
            :root { color-scheme: dark; }
            * { box-sizing: border-box; }
            body { margin:0; font-family: Inter, Segoe UI, sans-serif; background: radial-gradient(circle at top left, rgba(249,115,22,.14), transparent 24%), radial-gradient(circle at bottom right, rgba(59,130,246,.16), transparent 28%), #09090b; color:#fff; }
            .shell { max-width: 1120px; margin:0 auto; padding: 28px 18px 60px; }
            .hero, .board { border:1px solid rgba(255,255,255,.08); border-radius:30px; background:rgba(255,255,255,.04); }
            .hero { padding:28px; }
            .top { display:flex; justify-content:space-between; gap:12px; align-items:center; flex-wrap:wrap; }
            .badge { display:inline-flex; border-radius:999px; padding:8px 12px; font-size:11px; text-transform:uppercase; letter-spacing:.16em; background:rgba(249,115,22,.14); color:#ffedd5; border:1px solid rgba(251,146,60,.22); }
            .cta-group { display:flex; gap:10px; flex-wrap:wrap; }
            .cta, .cta-alt { border-radius:999px; padding:12px 18px; text-decoration:none; font-weight:700; font-size:14px; }
            .cta { background:#fff; color:#0a0a0a; }
            .cta-alt { border:1px solid rgba(255,255,255,.1); color:#fff; background:rgba(255,255,255,.04); }
            h1 { margin:18px 0 0; font-size:clamp(2.1rem,5vw,4.2rem); line-height:.95; letter-spacing:-.05em; max-width:12ch; }
            .lead { margin-top:16px; max-width:42rem; color:#cbd5e1; font-size:17px; line-height:1.75; }
            .duel { display:grid; gap:16px; grid-template-columns:1fr 96px 1fr; margin-top:24px; align-items:stretch; }
            .squad { border-radius:24px; border:1px solid rgba(255,255,255,.08); background:rgba(0,0,0,.22); padding:18px; }
            .eyebrow { font-size:10px; text-transform:uppercase; letter-spacing:.16em; color:#71717a; }
            .name { margin-top:10px; font-size:28px; font-weight:700; letter-spacing:-.04em; }
            .meta { margin-top:10px; color:#d4d4d8; }
            .top-player { margin-top:14px; font-size:15px; color:#bfdbfe; }
            .vs { display:flex; align-items:center; justify-content:center; font-size:30px; font-weight:800; color:#f9a8d4; letter-spacing:.14em; }
            .board { padding:22px; margin-top:22px; }
            .mini-grid { display:grid; gap:14px; grid-template-columns:1fr 1fr; }
            @media (max-width: 980px) { .shell { padding:20px 14px 42px; } .hero,.board { padding:18px; } .duel,.mini-grid { grid-template-columns:1fr; } .vs { min-height:56px; } }
          </style>
        </head>
        <body>
          <div class="shell">
            <section class="hero">
              <div class="top">
                <div class="badge">BTS Squad Challenge</div>
                <div class="cta-group">
                  <a class="cta-alt" href="{{Encode(loginUrl)}}">Log in</a>
                  <a class="cta" href="{{Encode(registerUrl)}}">Create account</a>
                </div>
              </div>
              <h1>{{Encode(card.ChallengerSquad.SquadName)}} just called out {{Encode(card.RivalSquad.SquadName)}}</h1>
              <p class="lead">Two BTS squads are turning {{Encode(card.Label)}} into a group rivalry. Join the app, find your people, and build a squad that can answer back.</p>
              <div class="duel">
                <div class="squad">
                  <div class="eyebrow">Challenger squad</div>
                  <div class="name">{{Encode(card.ChallengerSquad.SquadName)}}</div>
                  <div class="meta">{{card.ChallengerSquad.MemberCount}} members · code {{Encode(card.ChallengerSquad.InviteCode)}}</div>
                  <div class="top-player">Top player: {{Encode(challengerTop?.DisplayName ?? challengerTop?.Username ?? "Waiting")}} {{(challengerTop is null ? "" : $"· {challengerTop.Score} pts")}}</div>
                </div>
                <div class="vs">VS</div>
                <div class="squad">
                  <div class="eyebrow">Rival squad</div>
                  <div class="name">{{Encode(card.RivalSquad.SquadName)}}</div>
                  <div class="meta">{{card.RivalSquad.MemberCount}} members · code {{Encode(card.RivalSquad.InviteCode)}}</div>
                  <div class="top-player">Top player: {{Encode(rivalTop?.DisplayName ?? rivalTop?.Username ?? "Waiting")}} {{(rivalTop is null ? "" : $"· {rivalTop.Score} pts")}}</div>
                </div>
              </div>
              <div class="cta-group" style="margin-top:22px">
                <a class="cta" href="{{Encode(registerUrl)}}">Join BTS and build a squad</a>
                <a class="cta-alt" href="{{Encode(loginUrl)}}">I already have an account</a>
              </div>
            </section>
            <section class="board">
              <div class="eyebrow">Squad heat</div>
              <div style="margin-top:10px; font-size:26px; font-weight:700; letter-spacing:-.04em">Top players from both squads</div>
              <div class="mini-grid">
                <div>{{BuildRowsHtml(card.ChallengerSquad.LeaderboardRows.Take(5))}}</div>
                <div>{{BuildRowsHtml(card.RivalSquad.LeaderboardRows.Take(5))}}</div>
              </div>
            </section>
          </div>
        </body>
        </html>
        """;
    }

    private static string BuildSquadChallengeSvg(SquadChallengeCardDto card)
    {
        var challenger = Encode(TruncateForSvg(card.ChallengerSquad.SquadName, 18));
        var rival = Encode(TruncateForSvg(card.RivalSquad.SquadName, 18));
        var challengerTop = card.ChallengerSquad.LeaderboardRows.FirstOrDefault();
        var rivalTop = card.RivalSquad.LeaderboardRows.FirstOrDefault();
        var title = Encode($"{TruncateForSvg(card.ChallengerSquad.SquadName, 14)} vs {TruncateForSvg(card.RivalSquad.SquadName, 14)}");
        var label = Encode(card.Label);

        return $$"""
        <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
          <rect width="1200" height="630" fill="#09090b" />
          <circle cx="170" cy="110" r="180" fill="rgba(249,115,22,0.16)" />
          <circle cx="1030" cy="500" r="220" fill="rgba(59,130,246,0.18)" />
          <rect x="34" y="34" width="1132" height="562" rx="34" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.08)" />
          <text x="64" y="92" fill="#fdba74" font-size="18" font-family="Segoe UI, Arial, sans-serif" letter-spacing="3">BTS SQUAD CHALLENGE</text>
          <text x="64" y="154" fill="#ffffff" font-size="52" font-family="Segoe UI, Arial, sans-serif" font-weight="700">{{title}}</text>
          <text x="64" y="196" fill="#cbd5e1" font-size="24" font-family="Segoe UI, Arial, sans-serif">{{label}}</text>
          <rect x="64" y="246" width="420" height="220" rx="28" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.08)" />
          <text x="92" y="286" fill="#71717a" font-size="16" font-family="Segoe UI, Arial, sans-serif" letter-spacing="2">CHALLENGER SQUAD</text>
          <text x="92" y="346" fill="#ffffff" font-size="40" font-family="Segoe UI, Arial, sans-serif" font-weight="700">{{challenger}}</text>
          <text x="92" y="392" fill="#d4d4d8" font-size="22" font-family="Segoe UI, Arial, sans-serif">{{card.ChallengerSquad.MemberCount}} members</text>
          <text x="92" y="430" fill="#bfdbfe" font-size="22" font-family="Segoe UI, Arial, sans-serif">Top: {{Encode(TruncateForSvg(challengerTop?.DisplayName ?? challengerTop?.Username ?? "Waiting", 22))}}</text>
          <text x="530" y="368" fill="#f9a8d4" font-size="50" font-family="Segoe UI, Arial, sans-serif" font-weight="800">VS</text>
          <rect x="676" y="246" width="420" height="220" rx="28" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.08)" />
          <text x="704" y="286" fill="#71717a" font-size="16" font-family="Segoe UI, Arial, sans-serif" letter-spacing="2">RIVAL SQUAD</text>
          <text x="704" y="346" fill="#ffffff" font-size="40" font-family="Segoe UI, Arial, sans-serif" font-weight="700">{{rival}}</text>
          <text x="704" y="392" fill="#d4d4d8" font-size="22" font-family="Segoe UI, Arial, sans-serif">{{card.RivalSquad.MemberCount}} members</text>
          <text x="704" y="430" fill="#fed7aa" font-size="22" font-family="Segoe UI, Arial, sans-serif">Top: {{Encode(TruncateForSvg(rivalTop?.DisplayName ?? rivalTop?.Username ?? "Waiting", 22))}}</text>
          <text x="64" y="548" fill="#f8fafc" font-size="26" font-family="Segoe UI, Arial, sans-serif" font-weight="700">Build your squad and turn the weekly board into a crew rivalry.</text>
        </svg>
        """;
    }

    private string BuildPlayerRecapHtml(LeaderboardShareCardDto card)
    {
        var apiBase = $"{Request.Scheme}://{Request.Host}";
        var title = $"{card.SharerName}'s BTS weekly recap";
        var description = card.Rank.HasValue
            ? $"{card.SharerName} finished {card.Label} at #{card.Rank} with {card.Score ?? 0} points."
            : $"{card.SharerName} shared a BTS weekly recap.";
        var imageUrl =
            $"{apiBase}/share/recap/player/image.svg?userId={card.SharerUserId}&mode={WebUtility.UrlEncode(card.Mode)}&period={WebUtility.UrlEncode(card.Period)}";
        var canonicalUrl =
            $"{apiBase}/share/recap/player?userId={card.SharerUserId}&mode={WebUtility.UrlEncode(card.Mode)}&period={WebUtility.UrlEncode(card.Period)}";
        var webBaseUrl = ResolveWebBaseUrl();
        var registerUrl = $"{webBaseUrl}/register";
        var loginUrl = $"{webBaseUrl}/login";
        var rankText = card.Rank.HasValue ? $"#{card.Rank}" : "Played this week";
        var scoreText = $"{card.Score ?? 0} pts";

        return $$"""
        <!doctype html>
        <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>{{Encode(title)}}</title>
          <meta name="description" content="{{Encode(description)}}" />
          <meta property="og:type" content="website" />
          <meta property="og:title" content="{{Encode(title)}}" />
          <meta property="og:description" content="{{Encode(description)}}" />
          <meta property="og:url" content="{{Encode(canonicalUrl)}}" />
          <meta property="og:image" content="{{Encode(imageUrl)}}" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="{{Encode(title)}}" />
          <meta name="twitter:description" content="{{Encode(description)}}" />
          <meta name="twitter:image" content="{{Encode(imageUrl)}}" />
          <style>
            body { margin:0; font-family: Inter, Segoe UI, sans-serif; background:#09090b; color:#fff; }
            .shell { max-width:1040px; margin:0 auto; padding:28px 18px 54px; }
            .hero { border:1px solid rgba(255,255,255,.08); border-radius:30px; padding:28px; background:radial-gradient(circle at top left, rgba(59,130,246,.14), transparent 28%), linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,.015)); }
            .badge { display:inline-flex; padding:8px 12px; border-radius:999px; border:1px solid rgba(96,165,250,.2); background:rgba(59,130,246,.14); color:#dbeafe; font-size:11px; text-transform:uppercase; letter-spacing:.16em; }
            h1 { margin:18px 0 0; font-size:clamp(2.2rem,5vw,4rem); line-height:.95; letter-spacing:-.05em; }
            .lead { margin-top:16px; color:#cbd5e1; max-width:40rem; line-height:1.75; }
            .stats { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:12px; margin-top:22px; }
            .stat { border-radius:20px; border:1px solid rgba(255,255,255,.08); background:rgba(0,0,0,.22); padding:16px; }
            .label { font-size:10px; text-transform:uppercase; letter-spacing:.16em; color:#71717a; }
            .value { margin-top:8px; font-size:1.1rem; font-weight:700; }
            .cta-group { display:flex; gap:10px; flex-wrap:wrap; margin-top:22px; }
            .cta,.cta-alt { border-radius:999px; padding:12px 18px; text-decoration:none; font-weight:700; font-size:14px; }
            .cta { background:#fff; color:#0a0a0a; }
            .cta-alt { border:1px solid rgba(255,255,255,.1); color:#fff; background:rgba(255,255,255,.04); }
            @media (max-width: 980px) { .stats { grid-template-columns:1fr; } .shell { padding:20px 14px 42px; } .hero { padding:18px; } }
          </style>
        </head>
        <body>
          <div class="shell">
            <section class="hero">
              <div class="badge">BTS Weekly Recap</div>
              <h1>{{Encode(card.SharerName)}} closed out the week on BTS</h1>
              <p class="lead">{{Encode(card.SharerName)}} wrapped up {{card.Label}} with a finish of {{rankText}} and {{scoreText}}. Create your account and get your own weekly recap card next cycle.</p>
              <div class="stats">
                <div class="stat"><div class="label">Board</div><div class="value">{{Encode(card.Label)}}</div></div>
                <div class="stat"><div class="label">Final rank</div><div class="value">{{Encode(rankText)}}</div></div>
                <div class="stat"><div class="label">Score</div><div class="value">{{Encode(scoreText)}}</div></div>
              </div>
              <div class="cta-group">
                <a class="cta" href="{{Encode(registerUrl)}}">Create account</a>
                <a class="cta-alt" href="{{Encode(loginUrl)}}">Log in</a>
              </div>
            </section>
          </div>
        </body>
        </html>
        """;
    }

    private static string BuildPlayerRecapSvg(LeaderboardShareCardDto card)
    {
        var title = Encode($"{TruncateForSvg(card.SharerName, 18)}'s weekly recap");
        var rankText = card.Rank.HasValue ? $"#{card.Rank}" : "Played";
        var scoreText = $"{card.Score ?? 0} pts";
        var label = Encode(card.Label);
        var player = Encode(TruncateForSvg(card.SharerName, 20));

        return $$"""
        <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
          <rect width="1080" height="1920" fill="#09090b" />
          <circle cx="180" cy="180" r="240" fill="rgba(59,130,246,0.18)" />
          <circle cx="900" cy="1570" r="300" fill="rgba(16,185,129,0.16)" />
          <rect x="44" y="44" width="992" height="1832" rx="42" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.08)" />
          <text x="94" y="130" fill="#93c5fd" font-size="30" font-family="Segoe UI, Arial, sans-serif" letter-spacing="4">BTS WEEKLY RECAP</text>
          <text x="94" y="252" fill="#ffffff" font-size="74" font-family="Segoe UI, Arial, sans-serif" font-weight="700">{{title}}</text>
          <text x="94" y="310" fill="#cbd5e1" font-size="34" font-family="Segoe UI, Arial, sans-serif">{{label}}</text>
          <rect x="94" y="402" width="892" height="540" rx="36" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.08)" />
          <text x="138" y="482" fill="#71717a" font-size="24" font-family="Segoe UI, Arial, sans-serif" letter-spacing="3">PLAYER</text>
          <text x="138" y="596" fill="#ffffff" font-size="66" font-family="Segoe UI, Arial, sans-serif" font-weight="700">{{player}}</text>
          <text x="138" y="734" fill="#bfdbfe" font-size="124" font-family="Segoe UI, Arial, sans-serif" font-weight="700">{{rankText}}</text>
          <text x="138" y="826" fill="#ffffff" font-size="44" font-family="Segoe UI, Arial, sans-serif">{{scoreText}}</text>
          <text x="94" y="1128" fill="#f8fafc" font-size="52" font-family="Segoe UI, Arial, sans-serif" font-weight="700">Finished the week and posted the receipts.</text>
          <text x="94" y="1212" fill="#a1a1aa" font-size="36" font-family="Segoe UI, Arial, sans-serif">Create your BTS account and earn your own recap card next cycle.</text>
        </svg>
        """;
    }

    private string BuildSquadRecapHtml(SquadShareCardDto card)
    {
        var apiBase = $"{Request.Scheme}://{Request.Host}";
        var title = $"{card.SquadName}'s BTS weekly squad recap";
        var description = $"{card.SquadName} finished the week on {card.Label} with {card.MemberCount} active members.";
        var imageUrl =
            $"{apiBase}/share/recap/squad/image.svg?inviteCode={WebUtility.UrlEncode(card.InviteCode)}&mode={WebUtility.UrlEncode(card.Mode)}&period={WebUtility.UrlEncode(card.Period)}";
        var canonicalUrl =
            $"{apiBase}/share/recap/squad?inviteCode={WebUtility.UrlEncode(card.InviteCode)}&mode={WebUtility.UrlEncode(card.Mode)}&period={WebUtility.UrlEncode(card.Period)}";
        var webBaseUrl = ResolveWebBaseUrl();
        var registerUrl = $"{webBaseUrl}/register";
        var loginUrl = $"{webBaseUrl}/login";
        var topRow = card.LeaderboardRows.FirstOrDefault();

        return $$"""
        <!doctype html>
        <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>{{Encode(title)}}</title>
          <meta name="description" content="{{Encode(description)}}" />
          <meta property="og:type" content="website" />
          <meta property="og:title" content="{{Encode(title)}}" />
          <meta property="og:description" content="{{Encode(description)}}" />
          <meta property="og:url" content="{{Encode(canonicalUrl)}}" />
          <meta property="og:image" content="{{Encode(imageUrl)}}" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="{{Encode(title)}}" />
          <meta name="twitter:description" content="{{Encode(description)}}" />
          <meta name="twitter:image" content="{{Encode(imageUrl)}}" />
          <style>
            body { margin:0; font-family: Inter, Segoe UI, sans-serif; background:#09090b; color:#fff; }
            .shell { max-width:1040px; margin:0 auto; padding:28px 18px 54px; }
            .hero { border:1px solid rgba(255,255,255,.08); border-radius:30px; padding:28px; background:radial-gradient(circle at top left, rgba(16,185,129,.16), transparent 28%), linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,.015)); }
            .badge { display:inline-flex; padding:8px 12px; border-radius:999px; border:1px solid rgba(52,211,153,.2); background:rgba(16,185,129,.14); color:#d1fae5; font-size:11px; text-transform:uppercase; letter-spacing:.16em; }
            h1 { margin:18px 0 0; font-size:clamp(2.2rem,5vw,4rem); line-height:.95; letter-spacing:-.05em; }
            .lead { margin-top:16px; color:#cbd5e1; max-width:40rem; line-height:1.75; }
            .stats { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:12px; margin-top:22px; }
            .stat { border-radius:20px; border:1px solid rgba(255,255,255,.08); background:rgba(0,0,0,.22); padding:16px; }
            .label { font-size:10px; text-transform:uppercase; letter-spacing:.16em; color:#71717a; }
            .value { margin-top:8px; font-size:1.1rem; font-weight:700; }
            .cta-group { display:flex; gap:10px; flex-wrap:wrap; margin-top:22px; }
            .cta,.cta-alt { border-radius:999px; padding:12px 18px; text-decoration:none; font-weight:700; font-size:14px; }
            .cta { background:#fff; color:#0a0a0a; }
            .cta-alt { border:1px solid rgba(255,255,255,.1); color:#fff; background:rgba(255,255,255,.04); }
            @media (max-width: 980px) { .stats { grid-template-columns:1fr; } .shell { padding:20px 14px 42px; } .hero { padding:18px; } }
          </style>
        </head>
        <body>
          <div class="shell">
            <section class="hero">
              <div class="badge">BTS Squad Recap</div>
              <h1>{{Encode(card.SquadName)}} closed the week as a squad</h1>
              <p class="lead">{{Encode(card.SquadName)}} finished {{Encode(card.Label)}} with {{card.MemberCount}} members in the mix. {{Encode(topRow?.DisplayName ?? topRow?.Username ?? "Your crew")}} led the board{{(topRow is null ? "" : $" with {topRow.Score} pts")}}.</p>
              <div class="stats">
                <div class="stat"><div class="label">Squad</div><div class="value">{{Encode(card.SquadName)}}</div></div>
                <div class="stat"><div class="label">Members</div><div class="value">{{card.MemberCount}}</div></div>
                <div class="stat"><div class="label">Board</div><div class="value">{{Encode(card.Label)}}</div></div>
              </div>
              <div class="cta-group">
                <a class="cta" href="{{Encode(registerUrl)}}">Create account</a>
                <a class="cta-alt" href="{{Encode(loginUrl)}}">Log in</a>
              </div>
            </section>
          </div>
        </body>
        </html>
        """;
    }

    private static string BuildSquadRecapSvg(SquadShareCardDto card)
    {
        var title = Encode($"{TruncateForSvg(card.SquadName, 18)} weekly squad recap");
        var label = Encode(card.Label);
        var topRow = card.LeaderboardRows.FirstOrDefault();
        var topName = Encode(TruncateForSvg(topRow?.DisplayName ?? topRow?.Username ?? "Waiting", 20));
        var topScore = $"{topRow?.Score ?? 0} pts";

        return $$"""
        <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
          <rect width="1080" height="1920" fill="#09090b" />
          <circle cx="180" cy="180" r="240" fill="rgba(16,185,129,0.18)" />
          <circle cx="900" cy="1570" r="300" fill="rgba(59,130,246,0.16)" />
          <rect x="44" y="44" width="992" height="1832" rx="42" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.08)" />
          <text x="94" y="130" fill="#86efac" font-size="30" font-family="Segoe UI, Arial, sans-serif" letter-spacing="4">BTS SQUAD RECAP</text>
          <text x="94" y="252" fill="#ffffff" font-size="74" font-family="Segoe UI, Arial, sans-serif" font-weight="700">{{title}}</text>
          <text x="94" y="310" fill="#cbd5e1" font-size="34" font-family="Segoe UI, Arial, sans-serif">{{label}}</text>
          <rect x="94" y="402" width="892" height="540" rx="36" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.08)" />
          <text x="138" y="482" fill="#71717a" font-size="24" font-family="Segoe UI, Arial, sans-serif" letter-spacing="3">SQUAD</text>
          <text x="138" y="596" fill="#ffffff" font-size="66" font-family="Segoe UI, Arial, sans-serif" font-weight="700">{{Encode(TruncateForSvg(card.SquadName, 20))}}</text>
          <text x="138" y="698" fill="#d1fae5" font-size="44" font-family="Segoe UI, Arial, sans-serif">{{card.MemberCount}} members</text>
          <text x="138" y="782" fill="#ffffff" font-size="34" font-family="Segoe UI, Arial, sans-serif">Top finisher: {{topName}}</text>
          <text x="94" y="1128" fill="#f8fafc" font-size="52" font-family="Segoe UI, Arial, sans-serif" font-weight="700">Wrapped the week and posted the squad receipts.</text>
          <text x="94" y="1212" fill="#a1a1aa" font-size="36" font-family="Segoe UI, Arial, sans-serif">Lead score: {{topScore}}</text>
        </svg>
        """;
    }

    private static string Encode(string? value)
    {
        return WebUtility.HtmlEncode(value ?? string.Empty);
    }

    private static string TruncateForSvg(string? value, int maxLength)
    {
        var text = (value ?? string.Empty).Trim();
        if (text.Length <= maxLength)
            return text;

        return $"{text[..Math.Max(0, maxLength - 1)].TrimEnd()}…";
    }
}
