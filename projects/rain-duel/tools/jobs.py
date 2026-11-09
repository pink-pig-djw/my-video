"""All Codex image jobs for 《雨烬》, written out as tools/jobs_<round>.json for tools/gen_images.py.
  python tools/jobs.py
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

JIN = ("Jin: a tall young woman around 20 with an athletic build. Long straight black hair tied in a high ponytail that reaches her waist; "
       "the last third of the ponytail and the tips of her bangs fade to vivid crimson. Sharp amber-gold eyes, confident sharp-featured face, "
       "a small beauty mark under her left eye. Outfit: black high-collar sleeveless fitted combat top, black fitted trousers tucked into black "
       "knee-high combat boots, both forearms wrapped in off-white bandages, and a long black coat worn open with a vivid crimson lining and a "
       "ragged torn hem reaching her calves. Weapon: one long single-edged slightly curved sword (blade about 110 cm) with a black wrapped hilt "
       "and a round black guard; a small brass bell hangs from the end of the hilt on a short crimson cord.")
LING = ("Ling: a slim young woman around 19, a little shorter than Jin. Silver-white hair in a chin-length bob with straight bangs, plus one long "
        "thin braid on her left side reaching her waist, with a small brass bell tied at the braid's end on a pale blue cord. Calm ice-cyan eyes, "
        "gentle but cool face. Outfit: a white high-collar long coat reaching below the knees, fitted at the waist by a dark navy belt, navy inner "
        "lining, silver clasps down the front, the coat split at the sides; navy fitted shorts over black tights, white short boots, black "
        "fingerless gloves. Weapons: twin short straight single-edged silver blades (about 45 cm) with white wrapped hilts, held in reverse grip.")
RJ, RL = 'assets/ref/ref_jin.png', 'assets/ref/ref_ling.png'
NIGHT = "Night, heavy rain with visible rain streaks, wet reflective surfaces, mist."
VIADUCT = ("an old elevated railway viaduct with two pairs of wet steel rails, concrete parapets and catenary poles with overhead wires, "
           "above a flooded old city district")


def J(id, prompt, refs=(), aspect='landscape', style='scene', out=None):
    return {"id": id, "out": out or f"assets/gen/{id}.png", "aspect": aspect, "style": style, "prompt": prompt, "refs": list(refs)}


R1A = [
    J('ref_jin', "Character design sheet of " + JIN + " Show three views side by side at the same scale: full-body front view, full-body "
      "three-quarter back view showing the coat lining and ponytail, and a large head-and-shoulders close-up of her face. Also draw the sword "
      "alone, unsheathed, lying horizontally along the bottom, with its black sheath next to it.", out=RJ, style='sheet'),
    J('ref_ling', "Character design sheet of " + LING + " Show three views side by side at the same scale: full-body front view, full-body "
      "three-quarter back view showing the braid and the coat, and a large head-and-shoulders close-up of her face. Also draw the two short "
      "blades alone, lying horizontally along the bottom.", out=RL, style='sheet'),
]

R1B = [
    J('bg_wide', f"Extreme wide establishing shot of {VIADUCT}, seen from a distance and slightly above. {NIGHT} The viaduct with concrete "
      "arches crosses the whole frame. The streets below are flooded with dark water reflecting a few flickering neon signs (abstract glowing "
      "shapes only, no characters), old low-rise buildings with tiled roofs, tangled power lines, a single red railway signal light glowing in "
      "the middle of the bridge. A distant city skyline in mist, low heavy clouds lit faintly by distant lightning. No people.", aspect='wide'),
    J('bg_deck', f"Eye-level view standing on the deck of {VIADUCT}, looking straight along the rails stretching far into the distance in strong "
      f"one-point perspective. {NIGHT} Puddles between the sleepers reflect light, catenary poles and wires repeat into the distance, low "
      "parapets on both sides, the flooded city glows faintly below, a red signal light far away. No people.", aspect='wide'),
    J('bg_sky', "Looking straight up into a violent storm sky at night: massive swirling dark clouds, a web of branching lightning inside the "
      "clouds lighting them violet-blue from within, heavy rain falling toward the viewer. No ground, no people.", aspect='wide'),
    J('s_standoff', f"Symmetrical extreme wide side view of {VIADUCT}; the viaduct crosses the frame horizontally. {NIGHT} Jin stands at the "
      "far left end, small in the frame, Ling stands at the far right end, facing each other across about fifty metres of wet rails. A red "
      "railway signal light glows exactly in the centre between them. Mist, the flooded city glowing below. Very cinematic. "
      f"Characters: {JIN} {LING}", refs=[RJ, RL], aspect='wide'),
    J('k_jin_walk', f"Medium-wide shot from a low angle in front of Jin as she walks steadily toward the camera along the rails of {VIADUCT}. "
      f"{NIGHT} Her open long black coat with crimson lining billows behind her in the wind, her ponytail swings, the sheathed long sword is "
      "held loosely in her left hand at her side with the brass bell hanging from the hilt. Calm, menacing expression. Splashes at her boots; "
      f"the red signal light behind her gives her a red rim light. She is in the centre of the frame, full body visible. {JIN}", refs=[RJ]),
    J('k_ling_stand', f"Medium shot of Ling standing still in heavy rain at the far end of {VIADUCT}, facing the camera, head slightly lowered, "
      "eyes looking up through her silver bangs. Her twin short blades in reverse grip hang at her sides; her white long coat and the long "
      "thin braid with the bell move in the wind. Cold cyan light from a flickering sign below lights her from one side, deep blue night "
      f"behind, rain streaks. Framed from the knees up, centred. {LING}", refs=[RL]),
    J('s_clash', "Dramatic close-up of a sword clash between Jin (left) and Ling (right), their faces a few inches apart over the crossed blades. "
      "Jin's long sword presses down from the left, its edge glowing ember orange; Ling blocks with both short blades crossed in reverse grip. "
      "Bright sparks burst where the blades meet, rain droplets around them, Jin grinning fiercely, Ling's eyes cold and focused. Warm crimson "
      f"light on Jin's side, cold cyan light on Ling's side. Night rain. Shallow depth of field. {JIN} {LING}", refs=[RJ, RL]),
    J('s_jin_eye', "Extreme close-up of Jin's face from the bridge of the nose up to her forehead, filling the frame horizontally: her sharp "
      "amber-gold eyes wide open and intense, rain running down her face and dripping from her black bangs with crimson tips, the small beauty "
      f"mark under her left eye, warm red rim light, dark blue background. Very detailed eyes with light reflections. {JIN}", refs=[RJ]),
    J('s_ling_eye', "Extreme close-up of Ling's face from the bridge of the nose up to her forehead, filling the frame horizontally: her calm "
      "ice-cyan eyes wide open, rain running down her face and dripping from her silver-white bangs, cold cyan rim light, dark blue background. "
      f"Very detailed eyes with light reflections. {LING}", refs=[RL]),
    J('k_exchange_a', f"Medium-wide side view on the rain-soaked deck of {VIADUCT}. {NIGHT} Jin (left) swings her long sword in a huge downward "
      "diagonal arc toward Ling (right), who twists sideways and leans back to dodge, one short blade raised to deflect. Water splashes from "
      "their feet, an ember-orange glow on Jin's blade edge, cold cyan light on Ling. Both full body in frame, dynamic action, motion in "
      f"their hair and coats. {JIN} {LING}", refs=[RJ, RL]),
    J('sp_jin', "Character action pose sheet on a plain flat solid pure green background (#00FF00). Four full-body action poses of Jin in a 2 by 2 "
      "grid, all at the same scale, each figure well separated: (top left) a low forward dash to the right, body leaning far forward, sword "
      "held back low in her right hand, coat streaming behind; (top right) braced and sliding backward toward the left with knees bent, the "
      "sword's tip dragging on the ground in front of her; (bottom left) the follow-through of a huge horizontal slash to the right, sword swept "
      "far across, coat flaring; (bottom right) a high leap, knees tucked, sword raised overhead in both hands. Night-time lighting with a red "
      f"rim light. {JIN}", refs=[RJ], style='sprite'),
    J('sp_ling', "Character action pose sheet on a plain flat solid pure magenta background (#FF00FF). Four full-body action poses of Ling in a "
      "2 by 2 grid, all at the same scale, each figure well separated: (top left) a low forward dash to the left, twin blades held back in "
      "reverse grip, coat streaming behind; (top right) an acrobatic backflip leap, upside down, braid flying; (bottom left) falling backward "
      "helplessly, arms spread, coat and hair floating upward; (bottom right) kneeling on one knee while sliding, one hand on the ground, the "
      f"other blade held out. Night-time lighting with a cyan rim light. {LING}", refs=[RL], style='sprite'),
]

G = 'assets/gen/'
BOTH = f"{JIN} {LING}"
R2 = [
    J('s_bell', "Extreme close-up of the end of Jin's black wrapped sword hilt with the small brass bell hanging from it on a short crimson cord, "
      "rain drops beading on the hilt wrap, a single water droplet falling just above the bell. Background: deep bokeh of a red signal light "
      "and rain streaks at night. Macro lens feeling, very detailed metal and cord.", refs=[RJ]),
    J('s_jin_eye_c', "The same extreme close-up, but her eyes are calmly closed; rain still runs down her face and drips from her bangs. "
      "Same framing, same lighting.", refs=[G + 's_jin_eye.png'], style='edit'),
    J('s_ling_eye_c', "The same extreme close-up, but her eyes are calmly closed; rain still runs down her face and drips from her bangs. "
      "Same framing, same lighting.", refs=[G + 's_ling_eye.png'], style='edit'),
    J('s_jin_thumb', "Close-up of Jin's bandaged left hand gripping the black sheath just below the round guard, her thumb pushing the guard so "
      "about an inch of the blade slides out of the sheath; the exposed steel glows ember orange and rain hitting it turns into little puffs "
      f"of steam. Her black coat with crimson lining behind, night rain, warm light from the blade on her knuckles. {JIN}", refs=[RJ]),
    J('s_ling_hand', "Medium close-up of Ling at night in the rain raising her left gloved hand with fingers spread toward the falling rain; "
      "the raindrops around her hand hang motionless in the air like glass beads, glinting cyan, while she watches them calmly. Her right hand "
      f"holds a short blade in reverse grip. Cold cyan rim light, dark blue night, the braid with the bell over her shoulder. {LING}", refs=[RL]),
    J('s_jin_name', "Dramatic portrait of Jin, framed from the waist up on the left half of the frame, turning her head over her shoulder toward "
      "the viewer with a fierce half-smile, her ponytail swinging, the long unsheathed sword resting on her shoulder; strong crimson backlight "
      f"and rain. The right half of the frame is dark, empty rainy night (space for a title). {JIN}", refs=[RJ]),
    J('s_ling_name', "Dramatic portrait of Ling, framed from the waist up on the right half of the frame, in three-quarter profile facing left, "
      "holding one short blade up in reverse grip in front of her face so the blade reflects a cyan line of light across her eyes; rain. "
      f"The left half of the frame is dark, empty rainy night (space for a title). {LING}", refs=[RL]),
    J('k_jin_dash', f"Jin bursting into a low explosive dash straight toward the camera along the wet rails of {VIADUCT}, body leaning far "
      "forward, right hand gripping the sword hilt at her left hip ready to draw, coat flaring behind her, water exploding from under her "
      f"boots, ponytail streaming. {NIGHT} Low camera close to the rails, full body visible, red signal light behind her. {JIN}", refs=[RJ]),
    J('k_ling_dash', f"Ling bursting into a low fast dash straight toward the camera along the wet rails of {VIADUCT}, body leaning forward, "
      "twin short blades held back in reverse grip, white coat streaming behind her, braid flying, water splashing from her boots. "
      f"{NIGHT} Low camera close to the rails, full body visible, cold cyan light. {LING}", refs=[RL]),
    J('k_exchange_b', "The same scene a fraction of a second later: Jin's heavy downward slash has hit the wet rails between them, sending up "
      "a burst of sparks and water, and Ling has spun to the right around the strike, now crouched low and slashing back at Jin's side with "
      "a short blade. Same characters, outfits, place, lighting and camera.", refs=[G + 'k_exchange_a.png'], style='edit'),
    J('k_jin_swing', f"Medium-wide shot of Jin on the rails of {VIADUCT}, twisting her whole body as she winds up a huge horizontal slash: "
      "the long sword drawn far back behind her in both hands, its edge glowing ember orange, her coat swinging out wide, rain streaks, "
      f"puddles. {NIGHT} Low three-quarter angle, full body. {JIN}", refs=[RJ]),
    J('k_ling_dive', f"Low angle looking up at a steel railway signal gantry above the tracks of {VIADUCT}: Ling crouches on top of the gantry "
      "beam against the stormy sky, twin blades in reverse grip, about to leap down toward the camera, her white coat and braid blowing. "
      f"{NIGHT} Lightning glow in the clouds behind her. {LING}", refs=[RL]),
    J('s_im_a', "Extreme close-up of two blades grinding edge to edge: Jin's long ember-glowing blade against Ling's silver short blade, a "
      "fountain of bright sparks spraying out from the contact point, rain drops around, warm orange light on one side and cold cyan light on "
      "the other, gloved and bandaged hands at the edges of the frame. Dark night background.", refs=[RJ, RL]),
    J('s_ling_cheek', "Close-up of Ling kneeling in the rain on the tracks, looking up, wiping a thin fresh cut on her cheek with her gloved "
      f"thumb, a faint, almost pleased smile, cyan light, wet silver hair stuck to her face, the bell on her braid. {LING}", refs=[RL]),
    J('s_ling_field', f"Wide shot from behind and slightly above Ling on {VIADUCT}, as she raises one short blade toward the sky. All the rain "
      "in front of her hangs motionless in the air as countless glinting droplets filling the whole space between her and Jin, who stands far "
      "away down the tracks, small, her sword glowing orange. Cold cyan light shimmering through the suspended droplets. Night. "
      f"{BOTH}", refs=[RL, RJ]),
    J('s_jin_glare', "Close-up of Jin with her head lowered, glaring up through her wet black-and-crimson bangs with a fierce grin, the hilt "
      f"and guard of her sword rising in front of her face, rain on her skin, ember orange light from below. {JIN}", refs=[RJ]),
    J('k_jin_deflect', f"Medium shot of Jin on the rails of {VIADUCT} spinning her long sword in a fast circle in front of her body to deflect "
      "a barrage of glinting ice needles flying at her from the right; the blade glows ember orange and bursts of white steam explode "
      f"where needles hit it. Her coat flaring, ponytail whipping, determined grin. {NIGHT} {JIN}", refs=[RJ]),
    J('train_front', f"A night train rushing straight toward the camera along the rails of {VIADUCT} in heavy rain: one blinding round "
      "headlight, an old rounded steel train front with rain streaming over it, the overhead wires sparking blue above it, spray thrown off "
      "the rails, mist lit by the headlight. Low camera, dramatic. No people, no lettering.", aspect='wide'),
    J('k_ling_fall', "Ling plunging down from the storm sky head-first straight toward the camera, twin blades held out in reverse grip, "
      "her white coat and braid streaming upward behind her, rain drops spiralling around her body, lightning-lit clouds far above. Dramatic "
      f"top-down perspective, the viaduct tracks visible far below at the bottom of the frame. Night. {LING}", refs=[RL]),
    J('s_overhead', f"Low-angle medium shot on {VIADUCT}: Jin holds her long sword horizontally overhead in both hands, blocking Ling's twin "
      "blades that slam down from above as Ling lands on her from the air; the concrete deck cracks under Jin's boots and water erupts "
      "outward in a ring, sparks burst at the blades. Jin's teeth clenched, Ling's eyes cold. Night rain, warm and cold light. "
      f"{BOTH}", refs=[RJ, RL]),
    J('k_train_a', "Night, heavy rain: Jin and Ling fight on the roof of a fast-moving old train crossing an elevated viaduct; wind tears at "
      "their coats and hair. Jin (left) braces with her long sword raised, Ling (right) lunges in low with a short blade. The train roof runs "
      "into the distance, overhead catenary wires above, motion-blurred city lights below. Side three-quarter view, both full body. "
      f"{BOTH}", refs=[RJ, RL]),
    J('k_train_b', "The same scene a moment later: Ling has leapt over Jin's horizontal slash and spins in the air above her, and Jin is "
      "turning to follow her with the blade. Same characters, outfits, train roof, lighting and camera.",
      refs=[G + 'k_train_a.png'], style='edit'),
    J('s_jin_slash', f"Medium shot of Jin on {VIADUCT} finishing a huge rising diagonal slash; her blade glows white-hot and leaves an enormous "
      "blazing ember-orange arc of fire across the frame, rain flashing into steam along the arc, her coat and ponytail flung by the swing, "
      f"eyes blazing. Night. {JIN}", refs=[RJ]),
    J('bg_below', f"Looking straight up from the flooded street at night at the underside of {VIADUCT} high above: concrete arches, dripping "
      "water, power lines, rain falling toward the camera, a dim red glow from the signal light on the bridge, dark storm clouds beyond. "
      "Water surface ripples at the bottom edge. No people.", aspect='landscape'),
    J('k_ling_under', "Underwater in a flooded city street at night: Ling sinks slowly on her back, eyes closed, her silver hair, braid and "
      "white coat floating upward, small bubbles rising from her lips, one short blade slipping from her hand; flickering neon and red light "
      f"wavering through the water surface above her, dark submerged street and signs below. Calm, dreamlike. {LING}", refs=[RL]),
    J('s_flash', "A warm, faded childhood memory: two little girls about eight years old share one red umbrella in a gentle summer rain on a "
      "country railway platform at sunset; one has black hair in a short ponytail, the other has silver-white hair with a little braid. Each "
      "holds up a small brass bell on a cord, laughing at each other. Soft golden light, gentle and nostalgic, slightly hazy.", refs=[RJ, RL]),
    J('s_ling_eye_under', "Extreme close-up of Ling's face underwater, her ice-cyan eyes snapping wide open and glowing, silver hair and bangs "
      f"floating around her face, small bubbles, wavering light from above, deep blue-green water. {LING}", refs=[RL]),
    J('k_ling_rise', f"Ling landing back on the rails of {VIADUCT} in a crouch, one knee and one hand on the ground, twin blades out, water "
      "cascading off her coat and hair, her eyes glowing cyan; the rain around her begins to curve and spiral around her body. Night, cold "
      f"cyan light, dramatic low angle. {LING}", refs=[RL]),
    J('s_jin_whitehot', f"Medium close-up of Jin on {VIADUCT} holding her long sword upright in front of her face in both hands, grinning; the "
      "whole blade glows white-hot, the falling rain evaporates into a sphere of steam around her and the water at her feet boils, embers "
      f"swirl upward, her face lit white-orange from the blade. Night. {JIN}", refs=[RJ]),
    J('s_combo_a', "Dynamic low-angle close shot in the rain: Ling's spinning kick meets Jin's raised bandaged forearm block, a burst of water "
      "spray frozen in the air around the impact, both faces fierce, Jin's sword held back in her other hand, Ling's coat flaring. Night, "
      f"warm and cold light. {BOTH}", refs=[RJ, RL]),
    J('k_jin_vortex', f"Jin standing in the eye of a gigantic spiralling vortex of rain droplets on {VIADUCT}; the droplets circle around her "
      "in huge glinting cyan rings, her coat and ponytail whipped by the wind, she raises her glowing ember sword in both hands, calm and "
      f"fierce. Night, low angle, full body in frame. {JIN}", refs=[RJ]),
    J('s_leap', f"Both women leaping toward each other high above {VIADUCT} against a sky split by a huge lightning bolt, nearly silhouetted: "
      "Jin from the left with her long sword raised in both hands trailing ember sparks, Ling from the right with twin blades trailing "
      f"cyan droplets. Very wide, epic, symmetrical. Night storm. {BOTH}", refs=[RJ, RL], aspect='wide'),
    J('s_final', f"After the final exchange on {VIADUCT}: Jin and Ling stand back to back a few metres apart on the rails, both frozen in "
      "follow-through poses after passing each other, heads lowered, weapons extended; Jin's blade glowing faintly, a lock of silver hair "
      f"floating in the air. The rain hangs motionless around them. Side view, medium-wide, both full body. Night. {BOTH}",
      refs=[RJ, RL], aspect='wide'),
    J('s_blade', "Close-up of Jin's long sword blade held low and angled across the frame, a thin crack running across the steel near the "
      "tip, faint steam rising from the cooling metal, rain beading on the blade, her bandaged hand on the hilt at the edge of the frame. "
      "Night, dim ember glow fading.", refs=[RJ]),
    J('sp_braid', "A single object on a plain flat solid pure magenta background (#FF00FF): Ling's long thin silver-white braid, cleanly cut "
      "off at the top, with the small brass bell tied at its end on a pale blue cord, lying straight diagonally across the frame. Detailed hair "
      "strands, wet.", refs=[RL], style='sprite'),
    J('s_dawn', f"Wide side view of {VIADUCT} at dawn just after the storm: the rain has stopped, clouds breaking apart, the first golden light "
      "on the horizon reflecting in the flooded city below. Jin and Ling stand in the middle of the bridge a few metres apart, both turned "
      "slightly toward each other, small in the frame; wet rails shining. Calm, beautiful, hopeful. "
      f"{BOTH}", refs=[RJ, RL], aspect='wide'),
]

for name, jobs in [('r1a', R1A), ('r1b', R1B), ('r2', R2)]:
    (ROOT / 'tools' / f'jobs_{name}.json').write_text(json.dumps(jobs, ensure_ascii=False, indent=1), encoding='utf-8')
    print(name, len(jobs))
