using Microsoft.AspNetCore.Http;
using PokemonApi.Http;

namespace PokemonApi.Tests;

public class SecurityHeadersMiddlewareTests
{
    [Fact]
    public async Task Invoke_SetsBaselineSecurityHeaders()
    {
        var context = new DefaultHttpContext();
        var called = false;
        var middleware = new SecurityHeadersMiddleware(_ =>
        {
            called = true;
            return Task.CompletedTask;
        });

        await middleware.InvokeAsync(context);

        Assert.True(called);
        Assert.Equal("nosniff", context.Response.Headers["X-Content-Type-Options"]);
        Assert.Equal("DENY", context.Response.Headers["X-Frame-Options"]);
        Assert.Equal("no-referrer", context.Response.Headers["Referrer-Policy"]);
        Assert.Equal("camera=(), microphone=(), geolocation=()", context.Response.Headers["Permissions-Policy"]);
    }
}
