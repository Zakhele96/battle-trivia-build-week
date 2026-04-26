using Bts.Api.Data;
using Bts.Api.Models.Domain;
using Bts.Api.Models.Dtos;
using Dapper;

namespace Bts.Api.Repositories;

public sealed class SquadRepository : ISquadRepository
{
    private readonly DapperContext _context;

    public SquadRepository(DapperContext context)
    {
        _context = context;
    }

    public async Task CreateAsync(Squad squad)
    {
        const string squadSql = """
            INSERT INTO squads (
                id,
                name,
                invite_code,
                created_by_user_id,
                is_active,
                created_at,
                updated_at
            )
            VALUES (
                @Id,
                @Name,
                @InviteCode,
                @CreatedByUserId,
                @IsActive,
                @CreatedAt,
                @UpdatedAt
            );
            """;

        using var connection = _context.CreateConnection();
        await connection.ExecuteAsync(squadSql, squad);
    }

    public async Task<Squad?> GetByIdAsync(Guid squadId)
    {
        const string sql = """
            SELECT
                id,
                name,
                invite_code AS InviteCode,
                created_by_user_id AS CreatedByUserId,
                is_active AS IsActive,
                created_at AS CreatedAt,
                updated_at AS UpdatedAt
            FROM squads
            WHERE id = @SquadId
              AND is_active = TRUE;
            """;

        using var connection = _context.CreateConnection();
        return await connection.QuerySingleOrDefaultAsync<Squad>(sql, new { SquadId = squadId });
    }

    public async Task<Squad?> GetByInviteCodeAsync(string inviteCode)
    {
        const string sql = """
            SELECT
                id,
                name,
                invite_code AS InviteCode,
                created_by_user_id AS CreatedByUserId,
                is_active AS IsActive,
                created_at AS CreatedAt,
                updated_at AS UpdatedAt
            FROM squads
            WHERE UPPER(invite_code) = UPPER(@InviteCode)
              AND is_active = TRUE;
            """;

        using var connection = _context.CreateConnection();
        return await connection.QuerySingleOrDefaultAsync<Squad>(sql, new { InviteCode = inviteCode });
    }

    public async Task<IReadOnlyList<Squad>> GetAllActiveAsync()
    {
        const string sql = """
            SELECT
                id,
                name,
                invite_code AS InviteCode,
                created_by_user_id AS CreatedByUserId,
                is_active AS IsActive,
                created_at AS CreatedAt,
                updated_at AS UpdatedAt
            FROM squads
            WHERE is_active = TRUE
            ORDER BY created_at DESC;
            """;

        using var connection = _context.CreateConnection();
        var rows = await connection.QueryAsync<Squad>(sql);
        return rows.ToList();
    }

    public async Task<IReadOnlyList<SquadSummaryDto>> GetForUserAsync(Guid userId)
    {
        const string sql = """
            SELECT
                s.id AS Id,
                s.name AS Name,
                s.invite_code AS InviteCode,
                s.created_by_user_id AS CreatedByUserId,
                COUNT(sm.user_id)::int AS MemberCount,
                s.created_at AS CreatedAt
            FROM squads s
            INNER JOIN squad_memberships self
                ON self.squad_id = s.id
               AND self.user_id = @UserId
            INNER JOIN squad_memberships sm
                ON sm.squad_id = s.id
            WHERE s.is_active = TRUE
            GROUP BY s.id, s.name, s.invite_code, s.created_by_user_id, s.created_at
            ORDER BY s.created_at DESC;
            """;

        using var connection = _context.CreateConnection();
        var rows = await connection.QueryAsync<SquadSummaryDto>(sql, new { UserId = userId });
        return rows.ToList();
    }

    public async Task<IReadOnlyList<SquadMemberDto>> GetMembersAsync(Guid squadId)
    {
        const string sql = """
            SELECT
                u.id AS UserId,
                u.username AS Username,
                COALESCE(NULLIF(u.display_name, ''), u.username) AS DisplayName,
                sm.joined_at AS JoinedAt,
                sm.is_owner AS IsOwner
            FROM squad_memberships sm
            INNER JOIN users u
                ON u.id = sm.user_id
            WHERE sm.squad_id = @SquadId
            ORDER BY sm.is_owner DESC, sm.joined_at ASC;
            """;

        using var connection = _context.CreateConnection();
        var rows = await connection.QueryAsync<SquadMemberDto>(sql, new { SquadId = squadId });
        return rows.ToList();
    }

    public async Task<bool> IsMemberAsync(Guid squadId, Guid userId)
    {
        const string sql = """
            SELECT EXISTS(
                SELECT 1
                FROM squad_memberships
                WHERE squad_id = @SquadId
                  AND user_id = @UserId
            );
            """;

        using var connection = _context.CreateConnection();
        return await connection.ExecuteScalarAsync<bool>(sql, new { SquadId = squadId, UserId = userId });
    }

    public async Task AddMemberAsync(Guid squadId, Guid userId, bool isOwner)
    {
        const string sql = """
            INSERT INTO squad_memberships (
                squad_id,
                user_id,
                is_owner,
                joined_at
            )
            VALUES (
                @SquadId,
                @UserId,
                @IsOwner,
                NOW()
            )
            ON CONFLICT (squad_id, user_id) DO NOTHING;
            """;

        using var connection = _context.CreateConnection();
        await connection.ExecuteAsync(sql, new { SquadId = squadId, UserId = userId, IsOwner = isOwner });
    }
}
