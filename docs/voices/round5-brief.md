# Voice round 5 brief (owner requests, 2026-11-15)

Work in the repo now: branch `claude/voices-round5` off `main` of /home/user/derby-site (read AGENTS.md, TASTE.md, QUALITY-GATES.md first). Land on main via the normal process (quick suite + voiceclips-test + talk.js, bump BUILD, RELEASES line).

1. **Emeka "Danfo" Okafor** replaces Rocket Raju (character 12, Sandflea buggy). The owner picked sample 12A. Save the voice, write ~95 lines (all categories plus roasts of every other driver), and update every other character's roasts that mention Raju or Bollywood. Warm, booming, fast Nigerian English with pidgin; a fun showman, not a caricature.
2. **Render the missing recorded clips** for Uncle Bogdan (08), Ragnar Rustbeard (11) and Maxine MacTavish (13); the owner OK'd them. Render Emeka too.
3. **More fun commentary** for Crash Cam Kev and Shazza, plus more roasts for every driver. The owner asked for "rude, quirky, old school". Write at least 60 new commentary lines each for Kev and Shazza, and 15 new lines per driver.
   - **Old-school flavour:** 1950s radio announcer, music-hall, carnival barker, granddad sayings ("Great Scott!", "Well, I'll be a monkey's uncle", "What in tarnation", "Stone the crows", "Holy mackerel", "Jumping jehoshaphat", "Bob's your uncle", "flat as a flapjack", "like a bull in a china shop").
   - **Rude:** cheeky roasts, "your mother…" jokes, old-fashioned cusses (damn, blast, bloody, Scheiße, merde). No F-bombs, slurs or sexual content, and nothing mean about real groups.
   - **Quirky:** absurd similes, mock nature-documentary asides, fake sponsor reads ("This wreck brought to you by Dented Dan's Discount Bumpers").
4. **Fight repetition.** The play log now counts how often each line is heard (`heard` in match records, and the "Voice variety" section of the play-log report). The owner hears repeats in long respawn rounds. Check the report on the play-logs branch for the most-repeated lines and categories, and add the most lines to those categories. Consider never repeating a line within N minutes across matches, using session memory (`barks.sessHeard` exists).
5. Pacing rules (TALK governor, Build 69): don't make lines longer than ~6 seconds. Short and punchy wins.

## Credit budget (owner decision, 2026-11-15)
ElevenLabs Starter plan: 40,000 credits a month, reset on the 14th. On 2026-11-15, 13,617 were left. Going over is impossible: requests just fail.
- **Before every render**, check `GET /v1/user/subscription` (`character_limit - character_count`) and never start a batch that doesn't fit. `render.mjs` prints the estimate first.
- **Model: `eleven_flash_v2_5` (half the credits per character) for all renders from now on (owner decision 2026-11-15)**, OK'd by the owner after hearing Kev on both models (2026-11-15). The default in voices/cast.json is now Flash. Keep `mp3_44100_64`, like the existing clips. Whole new characters (Emeka, Bogdan, Ragnar, Maxine) are on Flash only, so each sounds consistent.
- **Order:**
  1. Emeka, all lines (~2,200 credits on Flash).
  2. Bogdan, Ragnar and Maxine, all lines (~6,500).
  3. About 40 new lines each for Kev and Shazza on Flash (~1,800), if the owner hears no clash next to their existing v2 lines.
  4. The 15 new lines per driver: write them now and render after the 14 December reset. Until then they show as subtitles.
- **Voice slots are 10/10:** delete Raju's voice before saving Emeka's.
- Stop with ~500 credits to spare, and report what's left.
