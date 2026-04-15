using System.Data;
using System.Data.Common;
using Bts.Api.Data;
using Bts.Api.Models.Domain;
using Dapper;

namespace Bts.Api.Repositories;

public sealed class WordScrambleScoreLedgerRepository : IWordScrambleScoreLedgerRepository
{
    private readonly DapperContext _context;

    public WordScrambleScoreLedgerRepository(DapperContext context)
    {
        _context = context;
    }

    public async Task CreateAsync(WordScrambleScoreLedgerEntry entry)
    {
        const string sql = """
            INSERT INTO word_scramble_score_ledger (
                id,
                room_id,
                session_id,
                round_id,
                user_id,
                points,
                reason,
                created_at
            )
            VALUES (
                @Id,
                @RoomId,
                @SessionId,
                @RoundId,
                @UserId,
                @Points,
                @Reason,
                @CreatedAt
            );
            """;

        using var connection = _context.CreateConnection();
        await connection.ExecuteAsync(sql, entry);
    }

    public async Task CreateAsync(
        IDbConnection connection,
        WordScrambleScoreLedgerEntry entry,
        DbTransaction? transaction = null)
    {
        const string sql = """
            INSERT INTO word_scramble_score_ledger (
                id,
                room_id,
                session_id,
                round_id,
                user_id,
                points,
                reason,
                created_at
            )
            VALUES (
                @Id,
                @RoomId,
                @SessionId,
                @RoundId,
                @UserId,
                @Points,
                @Reason,
                @CreatedAt
            );
            """;

        await connection.ExecuteAsync(sql, entry, transaction);
    }
}