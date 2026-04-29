using System.Threading.Channels;
using Bts.Api.Models.Responses;

namespace Bts.Api.Services;

public sealed class DirectMessageNotificationQueue
{
    private readonly Channel<DirectMessageResponse> _channel = Channel.CreateUnbounded<DirectMessageResponse>(
        new UnboundedChannelOptions
        {
            SingleReader = true,
            SingleWriter = false
        });

    public ValueTask QueueAsync(DirectMessageResponse message, CancellationToken cancellationToken = default)
    {
        return _channel.Writer.WriteAsync(message, cancellationToken);
    }

    public IAsyncEnumerable<DirectMessageResponse> ReadAllAsync(CancellationToken cancellationToken)
    {
        return _channel.Reader.ReadAllAsync(cancellationToken);
    }
}
