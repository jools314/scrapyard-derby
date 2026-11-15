# Scrapyard Derby: recorded voices

The game normally speaks its lines with the browser's Web Speech voices. This folder lets you swap in recorded voices made once with ElevenLabs. The game plays them through Web Audio, so they get the same left/right position, distance volume and music ducking as the rest of the sound. They also get in-game effects: a PA echo for Crash Cam Kev, a CB-radio filter for Big Hank, a megaphone filter for the deputy, and a muffled sound for the tourist in the back of the RV. Any line without a clip still uses Web Speech. If `voices/manifest.json` is missing (the single-file claude.ai build, opening the file from disk, an old deploy), the game behaves exactly as before.

| File | What it is |
|---|---|
| `extract.mjs` | Reads every spoken line out of `../index.html` and writes `lines.json`. Run it again whenever lines change. |
| `lines.json` | `[{id, character, speaker, text, say, ev, style, tier, tpl?}]`, one entry per character line. `id` = hash(character + text), so ids stay the same across runs. |
| `cast.json` | One voice per character: an accent and a description, Voice Library search terms, `voice_id` (you fill it in), voice settings, and the in-game `fx`. |
| `render.mjs` | Calls ElevenLabs for every line that isn't rendered yet. Writes `clips/<character>/<id>.mp3` and `manifest.json`. You can stop it and run it again. |
| `manifest.json` | `{version, model, format, fx, clips: {id: [path, seconds]}}`. The game loads this file. |

## Steps

1. **Get a key.** Sign in at elevenlabs.io, open your profile, choose *API Keys*, then *Create*. Allow *Text to Speech* and *Voices (read + write)*. Also allow *Voice Generation* if you want to use `--design`. Keep the key out of the repo:
   `export ELEVENLABS_API_KEY=sk_...`
2. **Refresh the line list** (only needed if `index.html` changed): `node voices/extract.mjs`
3. **Pick a voice for each character.** For each character you can:
   - run `node voices/render.mjs --suggest tony-cement`, listen to the preview links, then `node voices/render.mjs --add tony-cement <public_owner_id> <voice_id>`; or
   - run `node voices/render.mjs --design oberst-klaus`, listen to the three files in `voices/design/oberst-klaus/`, then `--design-keep oberst-klaus <generated_voice_id>`; or
   - paste a `voice_id` from *My Voices* into `cast.json`.

   Use stock, Voice Library or designed voices only. Never clone a real person.
4. **Check the cost:** `node voices/render.mjs --dry-run`. Tier 1 (the 15 car characters + Kev) is the default; add `--tier 2` to include the cab cameos and the extra drivers.
5. **Render a test batch and listen to it:** `node voices/render.mjs --only crash-cam-kev --limit 10`. The files land in `voices/clips/crash-cam-kev/`. If a voice is wrong, change it in `cast.json` and run `--force --only <id>`.
6. **Render.** Run `node voices/render.mjs` (and optionally `--tier 2` afterwards). If it stops (Ctrl-C, quota, network), run the same command again. It skips clips that are already done. On a low plan, use `--concurrency 1`.
7. **Try it locally.** Run `python3 -m http.server` in the site folder and open http://localhost:8000/. Clips do not load from `file://`. Start a match. In the browser console, `__derby.VCLIP.stats` counts the clips played, the generic-version swaps, the Web Speech lines and the failures. `__derby.VCLIP.log` lists the last lines played. Add `?clips=off` to the URL to hear the old voices.
8. **Publish.** Commit `voices/`: lines.json, cast.json, manifest.json, clips/, extract.mjs, render.mjs and README.md. Leave out `voices/design/`. Push, and GitHub Pages serves the clips next to the game.

**Mama Wanjiru (the Steam Elephant, added after voice round 5)** is in `cast.json` with no `voice_id` yet, and her ~99 lines plus everyone's roast of her and the new Kev/Lulu calls are in `lines.json`; until they are rendered they play as Web Speech with subtitles. Rendering her is: `node voices/render.mjs --design mama-wanjiru`, then `--design-keep mama-wanjiru <generated_voice_id>`, then `node voices/render.mjs --only mama-wanjiru` (Flash model, about 5k characters, so roughly 2.5k credits: check the budget in docs/voices/round5-brief.md first).

After you add or change lines in the game: run `extract.mjs`, then `render.mjs` (it renders only the new ids), then optionally `render.mjs --prune` to delete clips for lines that no longer exist.

## Status (Build 70, voice round 5)
- Recorded: all 18 main voices. Kev and Lulu are fully recorded (Kev's new `KEV_LINES` and Lulu's `SHAZZA_R5` are on `eleven_flash_v2_5`; their older calls are on `eleven_multilingual_v2`). Emeka Danfo, Uncle Bogdan, Ragnar Rustbeard and Maxine MacTavish are entirely on Flash.
- Not yet recorded: the 15 round-5 lines per driver (`CAST_R5` in index.html, 225 lines, ~10k characters). Render them after the credit reset: `node voices/render.mjs --tier 1` renders only what is missing. `tests/voicelines.js` allows at most 15 unrecorded lines per car character, so render them before adding more.
- Credits: check `GET /v1/user/subscription` (`character_limit - character_count`) before every batch.

## Size and cost (current lines)

| Batch | Clips | Characters billed | Rough cost* |
|---|---|---|---|
| tier 1 (default): the 15 car characters (35-62 lines each) + Crash Cam Kev (171 calls) | 958 | 33.9k | Creator $22 (100k credits) |
| `--tier 2` adds: cab cameos (Jesse, Black Knight, French Taunter, German tourist) + the 18 extra drivers | 235 | 7.4k | |

\*Plan prices as published in 2025. Check elevenlabs.io/pricing. About 40 minutes of audio, ~20 MB at `mp3_44100_64`.

## How lines map to clips

Each character gets only their own lines, each recorded once: their handwritten lines, horn shouts and (for the Sheriff) the megaphone calls. Kev gets one recording per commentary line. A line with blanks is recorded in a name-free form made by `VCLIP.generic` in index.html. extract.mjs runs that same function, so the texts always match. For example, `Pull over, {v}!` becomes "Pull over, pal!", and `{a} just PANCAKED {v}!` becomes "Somebody just PANCAKED that poor fella!".

In game, when clips are loaded:
- A line with a clip for its exact text plays that clip.
- For a template line, the recorded generic version is said instead, and the caption shows what is actually said.
- Otherwise the line uses Web Speech: the shared filler templates, events a character has no lines for, online nicknames, and the speech unlock.

When choosing a line, the game prefers ones that have a clip.

## Unverified (could not be tested against the real API from the build machine)

These were tested only against a local mock of the API (429 back-off, resume, mp3 duration parsing):
- The endpoint `POST /v1/text-to-speech/{voice_id}?output_format=mp3_44100_64` with `xi-api-key` and a body of `{text, model_id, voice_settings{stability, similarity_boost, style, use_speaker_boost, speed}, seed}`. `speed` is a newer field. If the API rejects it, remove it in `requestFor()`.
- `eleven_v3`: the script adds an `[audio tag]` from the style hint. v3 output varies more from take to take, so listen before rendering everything.
- The Voice Library search parameters (`/v1/shared-voices?search&gender&age&accent&language`), `POST /v1/voices/add/{public_owner_id}/{voice_id}`, and Voice Design (`/v1/text-to-voice/create-previews` and `create-voice-from-preview`). Newer accounts may have `/v1/text-to-voice/design` instead.
- The `fallback_voice_id` values in `cast.json` are legacy premade voices taken from public lists. Their IDs are not verified and some may be retired. They are used only with `--use-fallbacks`.
- ALL-CAPS words ("PANCAKED", "ON FIRE") are sent as written so they get stressed. Short ones may be spelled out letter by letter. Spot-check Kev.
- The swear marks `#@%!` are spoken as the word "bleep", as the Web Speech path does.
