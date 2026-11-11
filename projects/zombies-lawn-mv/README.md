# Zombies on Your Lawn · MV

成片：`out/zombies_on_your_lawn_mv.mp4`（1920×1080，30 fps，2:41，含原曲音轨），文件夹里的 `Zombies on Your Lawn MV.mp4` 是同一个文件。

- 参考：`ref/ref.mp4`（PopCap 官方 MV），音频：`audio/song.mp3`（与参考视频音轨只差 40 ms，所以镜头时间可以直接对照参考）。
- 歌词：`audio/lyrics.txt`（按你给的歌词表；`Z:` 是僵尸唱的句子，`~` 是向日葵的和声回应，`~?` 是太轻、对不上字的 "yeah"）。

## 手法（照参考视频）

| 时间 | 段落 | 画面 |
|---|---|---|
| 0:00 | 片头 | 黑场；阳光掉下来当厂牌标志 "SUNFLOWER RECORDS presents"；手写字 "a music video starring one sunflower and a lawn full of zombies" |
| 0:13 | 前奏 | 黑色舞台，一盏追光打亮向日葵，她唱出自己的名字；第二盏追光照到走进来的僵尸，他数 "one, two, three"；她一声 "ooh"，舞台灯全部炸亮 |
| 0:25 | 副歌 1 | 后院演唱会：草坪上的舞台（桁架、音箱、四色灯），向日葵在麦克风前唱，几十个僵尸踩着拍子齐跳；镜头推到她的近景，再摇到泳池，套鸭子泳圈的僵尸跟着跳 |
| 0:42 | 主歌 1 | 黑舞台追光：僵尸 "tall, dark, and dead"（伸高、灯暗、绿光）；僵尸的大嘴把她头上的花瓣一片一片咬掉；推近她的脸；后门：僵尸走进屋，"THE ZOMBIES ATE YOUR BRAINS!" 砸下来；阳光迸出、豌豆射手方阵冒出来；大脑；"禁止僵尸" 标志 |
| 1:02 | 僵尸自我介绍 1 | 漫画分格：橄榄球僵尸、路障僵尸、铁门僵尸各唱自己那句（对嘴型），向日葵在圆窗里唱和声；四周僵尸走进来；"WE ARE THE UNDEAD!" 砸下 |
| 1:19 | 副歌 2 | 僵尸人脸特写切入夜晚后院：探照灯扫射、灯光随拍闪、泳池上浓雾滚进来盖满画面 |
| 1:36 | 主歌 2 | 追光 "reevaluate"；盘子里的大脑越堆越高；"fig. 1" 解剖图（大脑→食道→冒汗的心脏）；僵尸头掉了还在走；阳光雨；草坪防线由白天切到夜晚（蘑菇） |
| 1:56 | 僵尸自我介绍 2 | 三轮车僵尸、头顶黄油的僵尸、海豚骑士僵尸；"no, no, no, no" 时她摇头；"WE ARE THE UNDEAD!" |
| 2:14 | 副歌 3 | 屋顶演唱会：蹦极僵尸吊下来、巨型机器人的脚踩下来；最后一句回到发光的草坪，彩带、灯光随拍闪，圆形遮罩收到向日葵身上 |
| 2:35 | 片尾 | 手绘标题 "ZOMBIES ON YOUR LAWN" 和歌曲署名 |

字幕和参考一样：底部一行歌词，一个粉色小脑子按演唱节奏在字上跳；僵尸的句子用对白气泡。

## 口型

- 向日葵 12 张 Codex 口型帧（闭口、M/B/P 抿嘴、F/V 咬唇、小开口、啊、大啊、诶、咿、哦、呜、舌尖、R）加一张闭眼，按帧硬切，像手绘动画。
- 时间来自分离出的人声（Demucs）上的强制对齐：两个 wav2vec2 字母模型 + 一个音素模型（espeak 音素），三者一致的地方取中间值；每个音素映射到口型。唱歌时元音拖长、辅音很短，所以词首辅音压在词头、词尾辅音压在声音结束前、词中的辅音紧挨着下一个元音；只有声音真的停了才闭嘴。
- 谁在唱靠音高区分：僵尸那几句是低沉男声（约 80–150 Hz），括号里的和声是向日葵（约 250–400 Hz）。僵尸的嘴是另外画的整套精灵变体（闭嘴 / 张大），按男声音节开合。
- 检查（`tools/lipcheck.py`，对照分离出的人声，2026-10-27）：
  - 停顿后人声起音 23 处，张嘴时刻中位数比声音早 12 ms，全部在 ±70 ms 以内；
  - 她在唱的时候嘴闭着：约 4%（基本是句首句尾的一两帧）；
  - 停顿里嘴还张着：0.19 s（全片合计）。

## 素材

- Codex（`gpt-6-sol`，推理 medium）：参考 `pvz-remake` 里已有的 PvZ 风格图生成；任务文件在 `tools/jobs_*.json`。
- 走路的僵尸动画（32 帧）、阳光、豌豆射手、坚果墙、小向日葵、僵尸头和手臂、路障直接沿用 `pvz-remake` 的素材。
- 背景用 Real-ESRGAN anime 放大到 3072×2048，镜头推近也清楚。
- 所有动态都是代码画的（Canvas，每帧是歌曲时间的纯函数）。

## 重新生成

```bash
# 素材切图、动画图集
uv run --no-project --with pillow --with numpy --with scipy python tools/build.py
# 口型帧：裁脸 -> Codex 重画嘴 -> 贴片
uv run --no-project --with pillow --with numpy python tools/mouths.py crops sf sfe
uv run --no-project --with pillow --with numpy python tools/mouths.py jobs sf sfe > tools/jobs_mouths_sf.json
python tools/gen_images.py tools/jobs_mouths_sf.json -j 4
uv run --no-project --with pillow --with numpy --with scipy python tools/mouths.py patches sf sfe
# 对齐 -> 口型关键帧 -> 检查
uv run --no-project python tools/align.py audio/lyrics.txt audio/words.json audio/analysis.json src/data/timing.js
uv run --no-project --with torch --with transformers --with soundfile --with scipy python tools/forcealign.py audio/vocals.wav src/data/timing.js render/lipcheck/fa.json
uv run --no-project --with torch --with transformers --with soundfile --with scipy python tools/forcealign.py audio/vocals.wav src/data/timing.js render/lipcheck/fa_large.json facebook/wav2vec2-large-960h-lv60-self
uv run --no-project --with torch --with transformers --with soundfile --with scipy --with cmudict python tools/phonealign.py audio/vocals.wav src/data/timing.js render/lipcheck/pa.json
uv run --no-project --with numpy --with soundfile python tools/lipkeys.py audio/vocals.wav src/data/timing.js render/lipcheck/fa.json render/lipcheck/fa_large.json render/lipcheck/pa.json src/data/lipkeys.js
uv run --no-project --with numpy --with soundfile python tools/lipcheck.py audio/vocals.wav src/data/lipkeys.js src/data/timing.js
# 静帧检查 / 完整渲染（4 路并行）
uv run --no-project --with playwright python tools/render.py --stills 30.5,64.2 --out render/stills
uv run --no-project --with playwright python tools/render.py --from 0 --to 160.9 --jobs 4 --chunk 10 --fps 30 --crf 18 --out out/zombies_on_your_lawn_mv.mp4
```

## 第二版修改（2026-10-27）

按你的意见：

- **僵尸舞步换成原视频那种**：原视频里所有僵尸是同一套慢悠悠的摇摆（脚不离地、手垂在身前、头左右歪、膝盖随拍子轻轻一沉），全体同步。原来那两套举手、踢腿、蹦跳的舞太闹了，已经去掉，换成 Codex 新画的一套 8 帧动作（`zdance_c`）。每拍两帧，膝盖下沉落在拍点上，头每两拍换一边。泳池里套鸭子泳圈的僵尸也换成同样节奏、手搭在泳圈上的慢摇（`zduck2`）。
- **补上原视频里的效果**（逐秒对照原视频找出来的）：
  - 舞台两侧音箱跟着拍子左右交替闪红光；
  - 夜晚副歌和最后的草坪：几束白色追光在僵尸群里来回扫，每小节一次白色频闪；
  - 夜晚的雾改成从下往上漫起来的一层白雾，盖住人群；
  - 僵尸人脸特写直接溶进下一段副歌，不再硬切加白闪；
  - "THE ZOMBIES ATE YOUR BRAINS!" 改成从画面中间由小变大，和原视频一样；
  - "see me power an entire infantry"：阳光一个个从她身上飞出去，落到位置上变成豌豆射手，一排一排组成方阵；
  - "You're dead, so it doesn't matter"：一个西瓜从左边抛过来砸在僵尸头上，西瓜碎块和汁水飞溅，他的头掉了还接着走；
  - 僵尸自我介绍的分格画面从左往右展开出现，不再是弹出。

## 第三版修改（2026-10-27）

- 走路的僵尸脚不再打滑：按游戏数据，一个 32 帧的走路循环对应地面 49.8 像素，走路帧按这个比例推进，速度也放慢了（开场、自我介绍分格、"You're dead"、门口那几段）。
- 草坪防线：每列一种植物（向日葵、豌豆射手、双发射手、寒冰射手、玉米投手、坚果墙），每种按游戏里的高度缩放；夜晚的小喷菇和阳光菇按原作做得很小。
- 开场按原视频重排：向日葵在舞台正中的追光里，"one, two, three" 由她唱（对口型），僵尸在左下方的第二盏追光里走进来；字幕改成 "a music video starring some plants and some zombies"。
- 结尾按原视频：圆形遮罩收到她脸周围停住，她眨一只眼（Codex 画的眨眼帧，带一点闪光），画面定格约两秒，然后遮罩合上，接片尾标题。
- 跳舞的僵尸不再完全同步：每个僵尸在 4 拍循环里位置不同（仍然踩在拍子上），约四分之一做游戏里的原地摇摆，少数朝另一边，大小也略有差别。

## 第四版修改（2026-10-27）

- 后门那段：僵尸穿过木平台走到敞开的后门，进门时只在门洞里可见、逐渐没入屋内的黑暗，标题出现前已经进去；镜头先靠近门口，标题放大时再拉远。
- 走路重做：旧的 32 帧走路（4 张图拼的）后脚几乎不动，配上匀速移动就像在地上滑。Codex 新画了一套 12 帧走路（`zwalk12`，接触—下沉—交叉—抬起，左右各一遍），身体移动量按画面里着地那只鞋的位移逐帧计算（`tools/footlock.py`，每个循环 108.6 单位），着地的脚不会滑。试过让 Codex 补中间帧，但补出来的步幅只有关键帧的一半、对不上，没有采用。无头僵尸用同一套的去头版。
- 自我介绍分格：约 20 个僵尸快步从画面两侧和分格后面走出来，填满分格之间的空地，在 "We are the undead" 前站定、原地摇摆，和原视频一样。
- 口型复查：音画同步核对为 0 ms 偏差。主歌里个别音节比实际演唱早或晚 0.1–0.2 秒，现在每个元音都对齐到人声起音的位置（辅音紧贴在前后）；k/g/ng 改为牙齿闭合的口型；60 毫秒以上的换气就闭嘴。
