(() => {
    const $ = (id) => document.getElementById(id);

    const setupCard = $("setupCard");
    const gameCard = $("gameCard");
    const nameInput = $("nameInput");
    const startBtn = $("startBtn");

    const playerNameEl = $("playerName");
    const pScoreEl = $("pScore");
    const cScoreEl = $("cScore");
    const roundText = $("roundText");
    const resultText = $("resultText");
    const logEl = $("log");

    const pIcon = $("pIcon");
    const cIcon = $("cIcon");
    const pLabel = $("pLabel");

    const resetBtn = $("resetBtn");
    const quitBtn = $("quitBtn");

    const modal = $("modal");
    const modalTitle = $("modalTitle");
    const modalDesc = $("modalDesc");

    const pickButtons = Array.from(document.querySelectorAll(".pick"));

    const ICON = { rock: "🪨", paper: "📄", scissors: "✂️" };
    const TR = { win: "Kazandın! ✅", lose: "Kaybettin 😅", draw: "Berabere 🤝" };

    // ✅ MINI SFX
    const sfx = {
        click: new Audio("/sfx/click.mp3"),
        win: new Audio("/sfx/win.mp3"),
        lose: new Audio("/sfx/lose.mp3"),
        draw: new Audio("/sfx/draw.mp3"),
    };

    function playSfx(key) {
        const a = sfx[key];
        if (!a) return;
        a.currentTime = 0;
        a.volume = 0.35;
        a.play().catch(() => {});
    }

    // ✅ Leaderboard elements (index.html’de olmalı)
    const lbBtn = $("lbBtn");
    const lbModal = $("lbModal");
    const lbContent = $("lbContent");
    const lbCloseBtn = $("lbCloseBtn");

    function openLb() {
        if (!lbModal) return;
        lbModal.classList.remove("hidden");
        lbModal.setAttribute("aria-hidden", "false");
    }
    function closeLb() {
        if (!lbModal) return;
        lbModal.classList.add("hidden");
        lbModal.setAttribute("aria-hidden", "true");
    }

    async function loadLeaderboard() {
        if (!lbContent) return;

        lbContent.textContent = "Yükleniyor...";
        try {
            const res = await fetch("/api/leaderboard");
            if (!res.ok) throw new Error("leaderboard error");
            const list = await res.json();

            if (!Array.isArray(list) || list.length === 0) {
                lbContent.textContent = "Henüz kayıt yok. Bir oyunu bitir ve tekrar bak 🙂";
                return;
            }

            lbContent.innerHTML = `
        <table class="table">
          <thead>
            <tr>
              <th>#</th><th>Oyuncu</th><th>Galibiyet</th><th>WinRate</th><th>Oyun</th>
            </tr>
          </thead>
          <tbody>
            ${list
                .map(
                    (x, i) => `
              <tr>
                <td>${i + 1}</td>
                <td><b>${x.name}</b></td>
                <td>${x.gamesWon}</td>
                <td>%${x.winRate}</td>
                <td>${x.gamesPlayed}</td>
              </tr>
            `
                )
                .join("")}
          </tbody>
        </table>
      `;
        } catch {
            lbContent.textContent = "Leaderboard yüklenemedi. (API çalışıyor mu?)";
        }
    }

    async function submitScoreToDb() {
        // oyun bitince DB’ye kaydet
        try {
            await fetch("/api/score/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: state.name,
                    playerScore: state.pScore,
                    cpuScore: state.cScore,
                    draws: state.draws,
                    target: state.target,
                }),
            });
        } catch {
            // DB kaydı başarısız olsa bile oyunu bozmayalım
        }
    }

    let state = {
        started: false,
        name: "Oyuncu",
        pScore: 0,
        cScore: 0,
        draws: 0, // ✅ draw sayısı
        round: 1,
        target: 5,
        ended: false,
    };

    function closeModal() {
        modal.classList.add("hidden");
        modal.setAttribute("aria-hidden", "true");
    }

    function openModal(title, desc) {
        modalTitle.textContent = title;
        modalDesc.textContent = desc;
        modal.classList.remove("hidden");
        modal.setAttribute("aria-hidden", "false");
    }

    function setScores() {
        pScoreEl.textContent = state.pScore;
        cScoreEl.textContent = state.cScore;
        roundText.textContent = `Round: ${state.round}`;
    }

    function addLog(line) {
        const time = new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
        logEl.innerHTML = `<div>• <b>${time}</b> ${line}</div>` + logEl.innerHTML;
    }

    function lockPicks(lock) {
        pickButtons.forEach((b) => (b.disabled = lock));
    }

    function resetGame() {
        state.pScore = 0;
        state.cScore = 0;
        state.draws = 0; // ✅ reset
        state.round = 1;
        state.ended = false;

        pIcon.textContent = "❔";
        cIcon.textContent = "❔";
        resultText.textContent = "Hamleni seç 👇";
        logEl.innerHTML = "";

        setScores();
        lockPicks(false);
        closeModal();
    }

    async function play(choice) {
        if (!state.started || state.ended) return;

        lockPicks(true);
        resultText.textContent = "Oynanıyor...";

        let data;
        try {
            const res = await fetch("/api/play", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ choice }),
            });

            if (!res.ok) throw new Error("API error");
            data = await res.json();
        } catch {
            resultText.textContent = "Hata oluştu (API).";
            lockPicks(false);
            return;
        }

        pIcon.textContent = ICON[data.player] ?? "❔";
        cIcon.textContent = ICON[data.cpu] ?? "❔";

        const outcome = data.result; // win|lose|draw
        resultText.textContent = TR[outcome] ?? outcome;

        playSfx(outcome);

        if (outcome === "win") state.pScore++;
        else if (outcome === "lose") state.cScore++;
        else state.draws++; // ✅ draw say

        addLog(`Sen <b>${data.player}</b>, CPU <b>${data.cpu}</b> → <b>${TR[outcome]}</b>`);
        state.round++;

        setScores();

        // ✅ 5’e ulaşan kazanır
        if (state.pScore >= state.target || state.cScore >= state.target) {
            state.ended = true;
            lockPicks(true);

            // ✅ DB’ye kaydet (oyun bitince)
            await submitScoreToDb();

            if (state.pScore > state.cScore) {
                openModal("Kazandın! 🎉", `${state.name} skoru ${state.pScore} yaptı. (CPU: ${state.cScore})`);
            } else {
                openModal("CPU kazandı 😅", `CPU skoru ${state.cScore} yaptı. (Sen: ${state.pScore})`);
            }
        } else {
            lockPicks(false);
        }
    }

    // Başlangıç
    closeModal();
    lockPicks(true);

    startBtn.addEventListener("click", () => {
        playSfx("click");

        const n = (nameInput.value || "").trim();
        state.name = n.length ? n : "Oyuncu";

        playerNameEl.textContent = state.name;
        pLabel.textContent = state.name;

        state.started = true;

        resetGame();
        setupCard.classList.add("hidden");
        gameCard.classList.remove("hidden");
        lockPicks(false);
    });

    pickButtons.forEach((btn) =>
        btn.addEventListener("click", () => {
            playSfx("click");
            play(btn.dataset.choice);
        })
    );

    resetBtn.addEventListener("click", () => {
        playSfx("click");
        resetGame();
    });

    quitBtn.addEventListener("click", async () => {
        playSfx("click");
        state.ended = true;
        lockPicks(true);

        // quit’te de kaydetmek istersen aç:
        // await submitScoreToDb();

        openModal("Oyun bitti 👋", `Final skor: ${state.name} ${state.pScore} — CPU ${state.cScore}`);
    });

    // Modal butonları
    document.addEventListener("click", (e) => {
        const t = e.target;
        if (!t) return;

        if (t.id === "playAgainBtn") {
            playSfx("click");
            resetGame();
            state.ended = false;
            lockPicks(false);
        }

        if (t.id === "closeModalBtn") {
            playSfx("click");
            closeModal();
        }
    });

    // ✅ Leaderboard button
    lbBtn?.addEventListener("click", async () => {
        playSfx("click");
        openLb();
        await loadLeaderboard();
    });

    lbCloseBtn?.addEventListener("click", () => {
        playSfx("click");
        closeLb();
    });
})();