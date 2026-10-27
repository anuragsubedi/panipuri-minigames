# panipuri minigames

Small, quick games you play in your web browser. Each one takes about a minute.

**▶ Play online: [anuragsubedi.github.io/panipuri-minigames](https://anuragsubedi.github.io/panipuri-minigames/)**, no setup needed. The instructions below are only for running it on your own computer.

| Game           | What you do                                        |
|----------------|----------------------------------------------------|
| **Hue Recall** | See a color for a few seconds, then rebuild it from memory. |
| **Glimpse**    | A cloud of dots flashes for a moment. Guess how many there were. |
| **Beatween**   | Not a game: a calm tone generator. Each ear gets its own tone, and you hear a slow "beat" between them. Use headphones. |
| **Orbit**      | Not a game: a toy solar system. Start from our real Solar system or a made-up one, fling planets, speed up time and watch orbits wobble, crash or fly away. Pinch to zoom. You can save a system and come back to it. |

---

## How to play (Mac)

**The easy way: double-click `start.command`.**

1. Open the `panipuri-minigames` folder in Finder.
2. Double-click **`start.command`**.
3. A Terminal window opens, and a moment later your browser opens with the games.
4. Click a game and play.

**When you're done,** close the Terminal window. That turns the games off.

> **"start.command can't be opened" warning?** Right-click (or Control-click) the file, choose **Open**, then click **Open** again. You only need to do this once.

---

## How to play (any computer, step by step)

Use this if the double-click doesn't work, or you're on Windows or Linux.

1. **Open a terminal.**
   - Mac: press `Cmd + Space`, type **Terminal**, press Enter.
   - Windows: press the Windows key, type **PowerShell**, press Enter.
2. **Go to the project folder.** Type `cd ` (with a space after it), drag the `panipuri-minigames` folder into the terminal window, and press Enter.
3. **Start the games.** Copy this line, paste it in, and press Enter:
   ```
   python3 -m http.server 5173
   ```
   On Windows, if that says Python isn't found, try `py -m http.server 5173` instead.
4. **Open your browser** and go to **http://localhost:5173**
5. **To stop,** click the terminal window and press `Ctrl + C`, or just close it.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| "python3: command not found" | Install Python from [python.org/downloads](https://www.python.org/downloads/), then try again. On a Mac you may instead get a pop-up offering to install developer tools. Accept it. |
| "Address already in use" | The games are probably already running. Just open http://localhost:5173 in your browser. |
| The page is blank, or a game won't start | Make sure you opened the **http://localhost:5173** address, not the `index.html` file directly (see below). |
| The browser page says it can't connect | The terminal window was closed. Start it again (step 3, or double-click `start.command`). |

**Why not just double-click `index.html`?** Browsers block games like these from loading their pieces straight off your disk, for security. The command above starts a small private web server that only your own computer can see, and that fixes it. Nothing is installed and nothing goes on the internet.

**Want the same game as a friend?** Add `?seed=` and any number to a game's address, for example `http://localhost:5173/games/hue-recall/?seed=42`. Everyone using that number gets the same game, which is handy for challenging a friend.

---

*Working on the code? Start with [`CLAUDE.md`](CLAUDE.md) and the [`docs/`](docs/) folder.*
