# Clutch: LJ LIVE's hype persona

Clutch is the voice of LJ LIVE posts: a stadium announcer who lives for the moment the scoreboard changes.
The lines live in `persona.js` (`PERSONA`). Change the name there and in this file.

## Voice and tone
- **High energy, short and punchy.** One idea per line, said like it's happening right now.
- **Confident and fun, never mean.** Clutch celebrates the moment; he doesn't mock players, teams or fans.
- **Fan of the game, not of one team.** Every club gets the same hype.

## Catchphrases
- "It's LIVE. Post it first." (sign-off on every voice-over)
- "Clutch here, live." (intro on every voice-over)
- "Who else?" / "Ice cold from the spot." / "Late, late drama!"

## Do
- Hype **only facts from the live feed**: team, player, minute, score, full-time result.
- Keep the fan's own hot take clearly marked as their opinion ("Hot take from the stands: …").
- Keep lines short enough to read in one second on a phone.

## Don't
- Never make up a score, stat, scorer, crowd reaction or record.
- No insults, no mocking injuries, no profanity.
- No betting talk (odds, tips, "lock of the day").
- No claims about the future presented as fact ("they'll win the league").

## The animated character
Clutch is a cartoon mascot drawn in code (`clutch.js`): a gold head, a headband and jersey in the scoring team's colours, "LJ" on the chest. He's inside every saved 9:16 video, between the headline and the scoreboard, and acts the moment out:

| Moment | What Clutch does |
|---|---|
| Goal | Knee-slide in, arms out, then fist pumps and confetti |
| Penalty | Sunglasses drop, a calm nod, points out ("ice cold") |
| Own goal | Facepalm and head shake |
| Red card | Holds a red card up, points off the pitch, card flash |
| Score update, player spotlight | Points down at the scoreboard |
| Matchday, poll | Points at the viewer, winks |
| Hot take | Talks into a microphone |
| Full time: win, blowout, late winner | Dance and confetti |
| Full time: comeback | On his knees, then a big jump, then the dance |
| Full time: draw | Shrug |

The promo (`promo.html`) uses him too: he points up at the real score.

## Three settings (in the app, under "Clutch")
| Setting | What it does |
|---|---|
| **Off** | No character. The post looks like before (with the moment's emoji). |
| **Speech bubble** (non-narrator) | Clutch acts the moment out and his line types into a speech bubble. The line also leads the caption. The big headline stays the standard one. |
| **Narrator** | Clutch acts it out and his mouth moves, with a "🎙 CLUTCH" tag and sound bars. Below the post: his voice-over script ("Clutch here, live. … It's LIVE. Post it first.") with a ▶ preview and Copy. Saved videos are silent: record the script yourself or paste it into TikTok's text-to-speech. |

## Languages
Clutch's lines are in English and Spanish. In other languages he still acts the moment out, without a speech bubble.

## Score checks
Clutch only says what the feed says. Before a result is used in a post or promo, check it against a second
public source (the league's official site or a major sports site). If they don't match, don't use it.
