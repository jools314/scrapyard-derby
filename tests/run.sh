#!/bin/bash
# Scrapyard Derby test runner.
#   bash tests/run.sh quick     ~15-25 min: before every check-in to main (or any release/* branch)
#   bash tests/run.sh release   ~2-3 h:     before publishing a release (everything in quick, plus the rest)
#   bash tests/run.sh <name>    one test, e.g. bash tests/run.sh matchups
# GAME=/path/to/index.html overrides which file is tested (default: ../index.html).
# One-time setup: cd tests && npm install && npx playwright install chromium
# Output for each test goes to tests/out/<name>.txt. Exit code 0 = all passed.
cd "$(dirname "$0")" || exit 2
mkdir -p out
export GAME="${GAME:-$(cd .. && pwd)/index.html}"
fail=0; failed=()
# t NAME TIMEOUT_S PASS_PATTERN [ENV=VAL ...] -- runs NAME.js, passes if exit 0 and (if given) PASS_PATTERN appears
t() { local name=$1 secs=$2 pat=$3; shift 3; local start=$(date +%s)
  env "$@" timeout "$secs" node "${JS:-$name}.js" > "out/$name${TAG}.txt" 2>&1; local code=$?
  if [ $code -eq 0 ] && { [ -z "$pat" ] || grep -qE "$pat" "out/$name${TAG}.txt"; }; then echo "PASS $name$TAG ($(( $(date +%s) - start ))s)";
  else echo "FAIL $name$TAG (exit $code) -> tests/out/$name${TAG}.txt"; tail -5 "out/$name${TAG}.txt" | sed 's/^/    /'; fail=1; failed+=("$name$TAG"); fi; }
quick() {
  t syntax 60 "SYNTAX OK"
  TAG=-a t drive 900 "" ONLY=outrider,viper,towtruck,forklift,sandflea
  TAG=-b t drive 900 "" ONLY=camper,mixer,firetruck,hellbender,cruiser
  TAG=-c t drive 900 "" ONLY=tiger,dozer,combine,bertha,tanker
  TAG=-q7 t drive 900 "" ONLY=tiger,dozer,bertha,tanker,mixer,camper Q7=1
  t hudlite 600 "HUDLITE PASS"
  t memleak 600 "MEMLEAK PASS"
  t geoleak 900 "GEOLEAK PASS"
  t heapguard 600 "HEAPGUARD PASS"
  t heapleak 1200 "HEAPLEAK PASS"
  t uiaudit 500 "UIAUDIT PASS"
  t slowhide 600 "SLOWHIDE PASS"
  t govern 900 "GOVERN PASS"
  t phonehud 1200 "PHONEHUD PASS"
  t tiltbtn 1500 "TILTBTN PASS"
  t looks 400 "LOOKS PASS"
  t memguard 900 "MEMGUARD PASS"
  t selfheal 1200 "SELFHEAL PASS"
  TAG=-spider t drive 900 "" ONLY=spider
  TAG=-spider t crusheropen 600 "CRUSHEROPEN PASS" TYPE=spider
  t tracks 900 "TRACKS PASS"
  t blade 600 "BLADE PASS"
  t crusheropen 600 "CRUSHEROPEN PASS"
  t lightcount 600 "LIGHTCOUNT PASS"
  t portalstart 900 "PORTALSTART PASS"
  t fastboot 900 "FASTBOOT PASS"
  t watchdog 600 "WATCHDOG PASS"
  t interact 1200 "^16/16"
  t twothumb 600 "TWO-THUMB PASS"
  t touchcam 600 "TOUCHCAM PASS"
  t gearmenu 600 "GEARMENU PASS"
  t menutrim 1200 "MENUTRIM PASS"
  t hitlog 600 "HITLOG PASS"
  t zoom 600 '"twoFingerBlocked":true,"oneFingerAllowed":true,"gestureBlocked":true'
  t phone2 900 '"overlaps":\[\]'
  TAG=-landscape t phone2 900 '"overlaps":\[\]' W=874 H=402 P=p2l
  t matchups 900 "MATCHUPS PASS"
  t idle 900 "IDLE PASS"
  t stoplog 600 "STOPLOG PASS"
  t perfbudget 900 "PERF PASS"
  t talk 900 "TALK PASS"
  t b70 900 "B70 PASS"
  t hudscore 600 "HUDSCORE PASS"
  t hpbar 900 "HPBAR PASS"
  t duck 600 "DUCK PASS"
  t soggy 600 "SOGGY PASS"
  t groundbeef 600 "GROUNDBEEF PASS"
  t goldcone 600 "GOLDCONE PASS"
  t trombone 600 "TROMBONE PASS"
  t honkback 600 "HONKBACK PASS"
  t confetti 600 "CONFETTI PASS"
  t smash 600 "SMASH PASS"
  t remembers 600 "REMEMBERS PASS"
  t shakeoff 600 "SHAKEOFF PASS"
  t pottycannon 600 "POTTYCANNON PASS"
  t bales 600 "BALES PASS"
  t helisign 600 "HELISIGN PASS"
  t helisignfix 600 "HELISIGNFIX PASS"
  t aim 900 "AIM PASS"
  t heaps 300 "HEAPS PASS"
  t inside 600 "INSIDE PASS"
  t voicelines 300 "VOICELINES PASS"
  t voicepath 600 "VOICEPATH PASS"
  t broadphase 600 "BROADPHASE PASS"
  t updatecheck 300 "UPDATECHECK PASS"
  t spider 1200 "SPIDER PASS"
  t spidertricks 600 "SPIDERTRICKS PASS"
  t cruiserpower 600 "CRUISERPOWER PASS"
  t dumpsterfire 600 "DUMPSTERFIRE PASS"
  t spiderjump 600 "SPIDERJUMP PASS"
  t spiderroof 600 "SPIDERROOF PASS"
  t cranejitter 600 "CRANEJITTER PASS"
  t spider2 900 "SPIDER2 PASS"
  t spider3 900 "SPIDER3 PASS"
  t physfix 600 "PHYSFIX PASS"
}
release() {
  quick
  t mp-respawn 1200 '"errs": \[\]'
  t bugcopy 900 "BUGCOPY PASS"
  t envupdate 1500 "ENVUPDATE PASS"
  for x in rc-playlog-test rc-upload-test rc-autoplay-test rc-voices-exhaust; do t $x 1200 ""; done
  t rc-voices-longsession 2400 ""
  t livedrop 900 "LIVEDROP PASS"
  for x in mp1-respawn mp1-migrate mp1-rejoin mp1-family mp1-twins; do t $x 1500 '"pass": true'; done
  t rc-vr-nonvr 1500 ""
  t rc-vr-test 1500 "" || true
  t voiceclips-test 1500 "ALL .* PASSED"
}
case "${1:-quick}" in
  quick) quick ;;
  release) release ;;
  *) t "$1" 2400 "" ;;
esac
if [ $fail -eq 0 ]; then echo "ALL PASSED ($1)"; else echo "FAILED: ${failed[*]}"; echo "(rc-vr-test is known to be flaky on a busy machine: re-run it alone before treating a failure as real)"; fi
exit $fail
