using System.Security.Claims;
using Bts.Api.Models.Requests;
using Bts.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Bts.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/admin/word-scramble/words")]
public sealed class AdminWordScrambleWordsController : ControllerBase
{
    private readonly AdminWordScrambleWordService _wordService;

    public AdminWordScrambleWordsController(AdminWordScrambleWordService wordService)
    {
        _wordService = wordService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? category,
        [FromQuery] bool? isActive,
        [FromQuery] int take = 200)
    {
        if (!IsAdmin()) return Forbid();

        var rows = await _wordService.GetAllAsync(category, isActive, take);
        return Ok(rows);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        if (!IsAdmin()) return Forbid();

        var row = await _wordService.GetByIdAsync(id);
        if (row is null) return NotFound();

        return Ok(row);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateWordScrambleWordRequest request)
    {
        if (!IsAdmin()) return Forbid();

        try
        {
            var row = await _wordService.CreateAsync(request);
            return CreatedAtAction(nameof(GetById), new { id = row.Id }, row);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateWordScrambleWordRequest request)
    {
        if (!IsAdmin()) return Forbid();

        try
        {
            var row = await _wordService.UpdateAsync(id, request);
            if (row is null) return NotFound();

            return Ok(row);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPatch("{id:guid}/active")]
    public async Task<IActionResult> SetActive(Guid id, [FromQuery] bool isActive)
    {
        if (!IsAdmin()) return Forbid();

        var updated = await _wordService.SetActiveAsync(id, isActive);
        if (!updated) return NotFound();

        return NoContent();
    }

    private bool IsAdmin()
    {
        var claim = User.FindFirstValue("isAdmin");
        return string.Equals(claim, "true", StringComparison.OrdinalIgnoreCase);
    }
}
