using System.Security.Claims;
using Bts.Api.Models.Requests;
using Bts.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Bts.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public sealed class FriendsController : ControllerBase
{
    private readonly FriendService _friendService;

    public FriendsController(FriendService friendService)
    {
        _friendService = friendService;
    }

    [HttpGet("search")]
    public async Task<IActionResult> Search([FromQuery] string? query)
    {
        var userId = GetUserId();
        if (!userId.HasValue)
            return Unauthorized();

        var results = await _friendService.SearchAsync(userId.Value, query);
        return Ok(results);
    }

    [HttpGet("network")]
    public async Task<IActionResult> Network()
    {
        var userId = GetUserId();
        if (!userId.HasValue)
            return Unauthorized();

        var network = await _friendService.GetNetworkAsync(userId.Value);
        return Ok(network);
    }

    [HttpPost("requests")]
    public async Task<IActionResult> CreateRequest([FromBody] CreateFriendRequest request)
    {
        var userId = GetUserId();
        if (!userId.HasValue)
            return Unauthorized();

        try
        {
            await _friendService.SendRequestAsync(userId.Value, request.TargetUserId);
            return Ok(new { message = "Friend request sent." });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("requests/{friendshipId:guid}/accept")]
    public async Task<IActionResult> Accept(Guid friendshipId)
    {
        var userId = GetUserId();
        if (!userId.HasValue)
            return Unauthorized();

        try
        {
            await _friendService.AcceptAsync(userId.Value, friendshipId);
            return Ok(new { message = "Friend request accepted." });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("requests/{friendshipId:guid}/decline")]
    public async Task<IActionResult> Decline(Guid friendshipId)
    {
        var userId = GetUserId();
        if (!userId.HasValue)
            return Unauthorized();

        try
        {
            await _friendService.DeclineAsync(userId.Value, friendshipId);
            return Ok(new { message = "Friend request declined." });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("leaderboard")]
    public async Task<IActionResult> FriendsLeaderboard(
        [FromQuery] string mode = "combined",
        [FromQuery] string period = "current")
    {
        var userId = GetUserId();
        if (!userId.HasValue)
            return Unauthorized();

        var leaderboard = await _friendService.GetFriendsLeaderboardAsync(userId.Value, mode, period);
        return Ok(leaderboard);
    }

    [HttpGet("head-to-head/{otherUserId:guid}")]
    public async Task<IActionResult> HeadToHead(Guid otherUserId)
    {
        var userId = GetUserId();
        if (!userId.HasValue)
            return Unauthorized();

        try
        {
            var summary = await _friendService.GetHeadToHeadAsync(userId.Value, otherUserId);
            return Ok(summary);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    private Guid? GetUserId()
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub");

        if (!Guid.TryParse(userIdClaim, out var userId))
            return null;

        return userId;
    }
}
