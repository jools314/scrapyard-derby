# TASTE.md: what makes a good Scrapyard Derby improvement

DESIGN-PRINCIPLES.md has the rules. This is the *taste* behind them: what the game should feel like, and how to tell a great idea from a merely reasonable one. It comes from the owner's reactions to real changes. When in doubt, re-read it.

## What the game is
A loud, silly, physics-heavy **demolition derby for kids and their family**, played in a browser on iPhones, iPads and laptops. It's a cartoon scrapyard full of absurd vehicles driven by over-the-top characters who trash-talk each other while everything crashes, burns, floats, gets towed into a crusher or turned into a hamburger.

**You pick a car and you're smashing things within seconds.** All the depth is *inside* the fight, never in menus.

## The feel we want
- **Kooky and crazy.** A wooden hut on chicken legs, a fire truck that rolls light cars with its water cannon, bulls that charge cars and, flamed, become hamburgers. If it makes a kid shout "did you SEE that?!", it's right.
- **Big, readable cause and effect.** Every hit should look and sound like a hit: dust, debris, sparks, crumpled panels, crash cam, slow-mo on the big ones. You should *see* what happened and why.
- **Characters with real personality.** Every driver is an extreme, original character, with a strong accent, words from their own language, catchphrases and a temper. They roast each other by name and by car, with a bit of spice (old-fashioned cussing, "your mother drives like a shopping trolley", Scheiße, sacré bleu), never mean about real people or groups. A commentator calls the action like a wildlife documentary about dangerous animals.
- **Every car is itself, to the extreme.** One clear strength, one *visible* weak spot and a style of play. The Viper darts in, fires rockets and runs. The tank is slow and terrifying, but bend its barrel and its next shot blows it up. The tow truck drags you into the crusher. A good change makes a car **more itself**.
- **Rivalries and counters.** Every car has prey it bullies and a counter that bullies it (water vs fire, fast flankers vs slow heavies). Kids learn this by playing, not by reading.
- **Fair surprises.** Hazards are wild (crusher, wrecking ball, crane, geysers, fire pit), but they warn before they strike. Chaos is fun; random unfair death isn't.
- **Smooth on a phone, always.** 60 fps on an iPhone matters more than one more effect. A beautiful game that stutters is worse than a simple one that flows. Every addition has a cost: measure it (tests/perfbudget.js, the play-log regression check), keep it small, and pay for new detail by making something else cheaper.

- **Breathing room.** Crazy doesn't mean crowded. Leave open space in the arena to drive and fight in. Voices take turns, with real silences between lines, so each line lands; nonstop chatter is noise. One popup at a time. A moment of quiet before a big crash makes the crash bigger.

## Good improvements (keep doing more of these)
- **Visible weak spots:** the Tiger's bent barrel blows up the next shot; the tanker leaks fuel once hit.
- **Physical comedy:** flamethrower plus bull equals hamburger, with commentary. A fork-lift toss. A tow-truck whip.
- **Smarter per-car AI:** each car fights the way that car should, so every opponent feels like a character.
- **Targeted roasts:** a character insults the specific car and driver they just hit.
- **Better crashes:** crash cam on the hit that wrecks you, debris, crumple, glass.
- **Removing friction:** a one-tap "Play together", rejoin that just works, no zoom on phones, full screen.
- **Fixes found in the play logs:** stuck spots, physics glitches, slow frames, voice failures.
- **Things that just work without being explained:** a gamepad just works, Tab to pick a target, autoplay when nobody's playing.
- **New vehicles that bring a new *verb*:** walk, stomp, grab, web, lift with a beam, freeze the floor. Not just another car with different numbers.

## Not our taste (please don't)
- **New modes, menus, settings or sliders:** free-drive mode, a field-size picker, a camera-shake slider, tilt-sensitivity sliders, alternative control layouts, PIN codes. Every choice is a moment a kid isn't playing. Pick a good default instead.
- **Offering options instead of one great choice.** Don't give three voice options; give one great, extreme pick.
- **Generic or timid characters:** polite, neutral, "radio announcer" voices; accents faked by mispronouncing English. A real character from somewhere, speaking like it, is the bar.
- **Balance by guesswork:** nerfing the heavies because they "feel strong". Heavies are *supposed* to be strong; light cars should get smarter tactics and a fair shot. Use the numbers.
- **Copies:** recreations of existing games, films or real people. Inspired-by archetypes are fine; imitations aren't.
- **Polish that costs frames on phones,** or detail that isn't LOD-gated.
- **Features that need a tutorial.** If it needs explaining, make it obvious in play instead, or cut it.
- **Busywork that doesn't change the play:** reorganising code, renaming, meta-systems, achievements screens.

## Quick test for an idea
Score it honestly. A great idea gets mostly yes.
1. Would a kid laugh, shout or want to try it again?
2. Does it happen in the fight, on screen, rather than in a menu?
3. Can you see what happened and why, without reading anything?
4. Does it make a car or character *more itself*, or give it a new verb?
5. Does it add zero choices for the player?
6. Does it keep 60 fps on a phone?
7. Can you prove it works with a test, and see it in the play-log numbers?

## Tone of voice lines
Fast, punchy, one breath. Name the victim. Exaggerate. Mix in words from the character's own language. A little rude, never cruel, and never mean about who someone is. Example (Tow truck → Viper): "Hold still, little pepper, the crusher's hungry and you're the snack!"
