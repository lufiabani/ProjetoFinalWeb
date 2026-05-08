using DesenvWebApi.Api.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DesenvWebApi.Api.Controllers;

// Health público para verificar arranque da API + ligação ao PostgreSQL (monitorização, Compose, relatório).
[ApiController]
[Route("api/[controller]")]
public class HealthController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> Get(CancellationToken cancellationToken)
    {
        var timestamp = DateTimeOffset.UtcNow;
        try
        {
            var databaseOk = await db.Database.CanConnectAsync(cancellationToken);
            var payload = new
            {
                status = databaseOk ? "healthy" : "degraded",
                timestamp,
                checks = new { database = databaseOk }
            };

            return databaseOk
                ? Ok(payload)
                : StatusCode(StatusCodes.Status503ServiceUnavailable, payload);
        }
        catch (Exception ex)
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new
            {
                status = "unhealthy",
                timestamp,
                checks = new { database = false },
                detail = ex.Message
            });
        }
    }
}
