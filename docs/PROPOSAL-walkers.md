# Proposal: two walking vehicles (owner approved 2026-11-15)

The owner picked these from [docs/ideas/new-vehicles-100.md](ideas/new-vehicles-100.md) after a short list. Both bring a new verb, legs instead of wheels, and each has one strong character, one visible weak spot, a counter car and prey. Read TASTE.md and QUALITY-GATES.md first.

## 1. Anansi the Spider-Walker (`spider`)
- **What:** an eight-legged spider machine built from scrap: pipes for legs and a hubcap-and-oil-drum body. It scuttles fast and low, climbs onto containers, crates and low walls, and can drop onto cars from above.
- **Weapon (special):** web. It fires a steel cable at a car in front, anchoring it to the ground for ~3 s (it can still spin its wheels). The spider gets one web; it recharges on a cooldown.
- **Character:** Kwaku Anansi, the sly, laughing trickster storyteller of West African (Ghanaian, Akan) folk tales. He's the clever hero who outwits bigger animals; he narrates the fight as a story he is winning ("Let me tell you a story… it ends with YOU in pieces!"), with Twi words (e.g. "Ɛyɛ!" (it's good), "Agoo!" (excuse me, coming through), "Ei!"). A warm, funny, respectful portrayal of a beloved folk hero, never a caricature.
- **Weak spot (visible):** legs. A heavy hit snaps a leg, which flies off as debris. With fewer legs it slows, limps and loses climbing (below 6 legs no climbing; below 4 it's a wreck).
- **Counters:** Dozer and Big Bertha (heavy rams snap legs), plus the Fire truck (water knocks it off walls).
- **Prey:** fast light cars (Viper, Sandflea, Outrider), which it webs in place and pounces on.
- **AI:** climbs to high ground and waits, drops on passing light cars, webs whatever runs, and avoids heavies head-on.

## 2. The Brass Steam Elephant (`elephant`)
- **What:** a towering Victorian brass-and-rivets elephant on four stomping legs, inspired by the steam-powered walking elephant in Jules Verne's 1880 novel *The Steam House* (public domain). A howdah on top carries the driver; smoke comes from a funnel on its head.
- **Weapon (special):** trunk. It grabs a light car in front and flings it (a lift-and-toss, like the forklift's but sideways), or, with nothing in reach, fires a cone of scalding steam that puts out fires and pushes cars back.
- **Character:** Mama Wanjiru, a booming, laughing Kenyan safari ranger who has met real elephants and is very proud of this one. Swahili words ("Twende!" (let's go), "Pole pole!" (slowly, slowly), "Hakuna shida" (no problem), "Haraka!" (hurry)). Warm, bossy, hilarious, never mean.
- **Weak spot (visible):** the boiler on its back, with a pressure gauge whose needle you can see. Hits to the boiler (from behind or the side) raise the pressure; at the red line it whistles, then blows its top in a cloud of steam and stalls for ~4 s.
- **Counters:** fire users (the Sandflea's flames and the Hellbender heat the boiler faster) and the Viper's rockets in the back.
- **Prey:** anything light that it can grab and fling, especially the Tow truck and Forklift. It's the heavy that bullies the tricksters.
- **AI:** slow, relentless, lumbers straight at the biggest group, grabs and flings, and turns to keep its boiler away from attackers.

## Shared engineering notes
- **Locomotion:** no RaycastVehicle. Use a physics body with ride-height hover springs and drive forces, plus procedural leg animation (foot planting and IK-ish swing) driven by speed. Footsteps follow the ground. Must pass `tests/drive.js` (straight, turn both ways, reverse, handbrake, fire) with keys and touch, like every car.
- **Multiplayer:** the existing snapshot (position, rotation, velocity) drives a remote walker; legs animate locally from velocity. New special-weapon state goes in the existing flags.
- **Performance:** merged or instanced leg geometry, LOD for distant legs, budget checked with `tests/perfbudget.js`. Explain any baseline update in the commit.
- **Voices:** about 95 lines each (all categories plus roasts of and by every driver), recorded on the Flash model only if ElevenLabs credits allow after voice round 5. Otherwise they show as subtitles until the 14 December reset. Never exceed the credit budget (docs/voices/round5-brief.md).
- **AI and logs:** per-car tactics as above, and the matchup logs should show the counters and prey working.
