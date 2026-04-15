using System.Data;
using Bts.Api.Models.Domain;
using Dapper;

namespace Bts.Api.Repositories;

public sealed class TriviaScoreLedgerRepository : ITriviaScoreLedgerRepository
{
    public async Task CreateAsync(
        IDbConnection connection,
        TriviaScoreLedgerEntry entry,
        IDbTransaction? transaction = null)
    {
        const string sql = """
            INSERT INTO trivia_score_ledger (
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