using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace taskagıtmaks.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "GameResults",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PlayerName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PlayerScore = table.Column<int>(type: "int", nullable: false),
                    CpuScore = table.Column<int>(type: "int", nullable: false),
                    Draws = table.Column<int>(type: "int", nullable: false),
                    Target = table.Column<int>(type: "int", nullable: false),
                    Winner = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PlayedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GameResults", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "GameResults");
        }
    }
}
