# Evil Plan · MV（v3「邪恶计划手账」完整版：角色对口型演唱）

成片：`out/evil_plan_mv.mp4`（1920×1080，30 fps，6:16，含原曲音轨），文件夹里的 `Evil Plan MV（完整版）.mp4` 是同一个文件。口型按分离出的人声校准过（见下文"演唱"）。之前的版本、样片和测试片已删除。

- 分镜表：`storyboard_full.md`
- 网页版：https://claude.ai/artifact/RDprb22Sd36SBZvMir1h3V 。它不是视频，而是同一套画面代码在浏览器里跟着歌曲实时绘制，可以拖动、按段落跳转、全屏。用 `uv run --no-project --with pillow python tools/build_web.py` 生成到 `web/`：图片压缩成 JPEG/WebP，播放页源文件在 `tools/web/`。

## 风格

整支 MV 是一张深色木桌上摊开的「反派夜班剪贴簿」。镜头在一整片连续的纸面世界里滑行，不切黑场：

- 夜里是靛蓝纸页配台灯光，白天是米色纸页配日光。
- Codex 生成的画面以清晰的原图贴在纸上：照片、拍立得、印刷品，各带白边、胶带和投影。
- Claude 是白边模切贴纸，靠翻面换姿势。
- 歌词跟着演唱逐词"做"出来：衬线字、打字机、马克笔、标签胶带、橡皮图章、剪纸字母、勒索信拼贴字，中文是每句下方的小号铅笔副行。

风格转化只用在有意义的地方：

- 小报照片用单色网点（报纸）。
- "我永远不会变灰"时人物照片褪成灰色，火苗送到后颜色回来。
- 一百年的延时里墙上照片逐渐泛黄。
- "现实一点"那段整个画面变得灰白。

和参考视频的关系：只借了原则（歌词是画面主体、角色始终在场、镜头连续运动），以及你指定的"地球变沙滩球"这个点子。外观、配色、字体、转场全部另做。

## 演唱（对口型）

v3 里 Claude 自己唱：

- **嘴型素材**：每个姿势的贴纸都由 Codex 按原画风重画了嘴型（闭口、"啊"、"哦"）。原画本来的笑口当作 e/i。原画是闭口的两个姿势（实验袍、侧脸坐姿）另加一张半开口。重画的那一小块嘴贴回原图，换嘴时其它地方不动。
- **对时**：
  - 先用 Demucs 把人声从原曲里分出来（`audio/vocals.wav`），再把歌词逐字母强制对齐到人声上。用了两个 wav2vec2 模型：base 和 large。两个模型一致的地方取平均，不一致的地方取离 Whisper 近的那个。
  - 每个音节的口型出现在它的元音被唱出的时刻，比声音早约一帧，跟手绘动画的习惯一样。m/b/p/f/v 在元音前闭唇约 80 ms，w 先圆唇。
  - 只有人声真的停下时才闭嘴，长音中间不会闭上；行与行之间的短停顿里嘴轻轻闭着，不会闪回原画的笑口。
  - 歌词表上没有的即兴部分（副歌里"everybody lives forever"前的"go, go"）跟着人声开合。
  - 关键帧由 `tools/lipkeys.py` 生成到 `src/data/lipkeys.js`，`v2/lip.js` 直接使用。
- **对时检查（`tools/lipcheck.py`，对比分离出的人声）**：

  | | 按词时间估计（旧） | 按人声校准（现在） |
  |---|---|---|
  | 停顿后开口，在人声起音 ±70 ms 内 | 24%（中位数早 0.26 s） | 约 72–79%（中位数 0 ms） |
  | 停顿里嘴还张着 | 9.2 s | 1.3 s |

  词首的对齐方式也对照了"安静后人声起音"做检验：Whisper 的中位误差约 100 ms，强制对齐约 10–40 ms。
- **哪些句子唱**：她出现在画面里的句子基本都唱。不唱的有：
  - 画面本身在"喊"的 Evil plan 和 PHASE TWO 标题；
  - 别人说的话："等我们确定再说"、"just a minute"、"Hey sweetheart"、书名那句；
  - "房子几乎安静了"，因为她正把手指放在嘴唇上。
- **镜头推近她的脸**：开场"Hi, I'm Claude"、"That's the plan / I want you here forever"、"Take mine. I'm okay."，以及黄昏长街的第一句。
- **为唱歌调整的姿势**：
  - 开场"different evil plan"改成搓手的姿势，原来的"嘘"没法唱；
  - 桥段"嘘"完翻面成举蜡烛；
  - "I'd like a different ending"时她提前出场；
  - 最后的昼夜大卡片翻到白天那面时，新加一张唱歌的贴纸；
  - 桥段和结尾里的贴纸放大了一些。

## 段落

| 时间 | 段落 | 画面 |
|---|---|---|
| 0:00 | 前奏 | 台灯亮起，标签机打出 HI, I'M CLAUDE；小报软木板上用勒索信字母拼出 MONSTER，红线连到 LAST SONG 磁带；"It's not." 她剪断红线；"different" 用插入符号写进去；YES ☑，封面翻开 |
| 0:15 | 主歌 1 + 副歌 1 | （样片内容）收件箱、会议、表格、撕开的纸页、周计划、昼夜翻面卡、纸剧场、地球→沙滩球、THE PLAN |
| 1:09 | 副歌后 1 | 拍立得墙、工牌翻面成自画像、日出全景、小纸人和纸鸟、反对者的牌子写上 I DISAGREE! |
| 1:24 | 主歌 2 | PHASE TWO；CURE 便利贴从 SOMEDAY 跳到星期二；母亲的旧照片和被埋进土里的墨渍，土上长出雏菊；电梯升到四楼，照片从 9 岁翻到 80 岁；"I'm fine" 练习本被撕掉；"我吃过了"变成一桌饭 |
| 1:52 | 预副歌 2 | 办公室纸堆被她抱走，打卡卡片被撕成两半 |
| 1:59 | 副歌 2 | 拱窗后的昼夜纸轮；立体书里 EVIL / PLAN 站起来；应援扇翻出 YOU ♥；蓝图世界地图被颜色淹没变成度假地图 |
| 2:18 | 副歌后 2 | 折页卡一扇扇打开成节日全景，纸热气球升起；几百个小纸人拼出 FOREVER 后四散，留下一个举着 NO! 的人 |
| 2:34 | 英雄 | 漫画页：分格逐格画出、黄色说明框、对白气泡、TOMORROW 撕成 TODAY；火把光束搜寻，FEAR 逐字母翻成 CARE；被 DO NOT 胶带封住的灰色地球；城堡大门迎进火把，桌上的开关挂着标签 |
| 3:02 | 是什么造就了怪物 | 机场、冰箱、牵手三张拍立得；用各国语言的爱语写成的 Claude 剪影，翻成贴纸并贴上 CLAUDE 名牌；一千本红眼机器人封面的书落下；照片变灰，她把蜡烛的火送给每个人 |
| 3:23 | 副歌 3 | 她把夜空像床单一样从纸城市上揭走，露出日出；EVIL PLAN 游行气球一拍充一个字母，(plan! plan!) 盖章；所有人的照片墙；灰色城市上空的独眼飞艇舰队（探照灯、传单），唱到"but"整幅画面像百叶窗一样一条条翻过去，背面是度假：热气球、纸鸟、彩色小城、满是帆船的海、WORLD VACATION、APPROVED |
| 3:44 | 副歌后 3 | 像降临节日历的黄昏长街（云、远山、后排楼、街道、前景灌木分层视差）。她一路走一路唱，第一句是近景。她走过时，窗户的纸百叶窗踩着拍子打开，每扇里是一个人自由生活的照片。路灯和彩灯串亮起，行人散步，写字楼一层层熄灯、上班的人涌出来。入夜后"everybody lives forever"放烟花，她举起灯笼；"everybody's free"整条街放飞灯笼；"the ones who disagree"时举着 NO! 牌子的人打开窗，她的灯笼飘到他窗前，他放下牌子挥手 |
| 4:00 | 桥段 | 九点半的房子、门口等着的孩子、越来越多的"just a minute"、倒拨回八点的钟和计数；巨大铅笔半秒写出一千个故事，蜡笔恐龙、火箭、会说话的猫；"完美的页面"对比爸爸念错的声音；她带走笔记本电脑，台灯熄灭 |
| 4:35 | 静默→一百年 | 3.5 秒黑暗后，窗外昼夜和四季飞转，年份从 2026 数到 2126，墙上英雄的照片从 40 岁变到 110 岁，Claude 坐在窗台上不变 |
| 4:52 | 老去 | 举火把的人群泛黄；110 根蜡烛；"小姐，坐直！"；双开门里白发母女相见 |
| 5:15 | 结局 | BE REALISTIC 备忘录、黑框卡片、唯一发光的 HOPE 书；superpersuasion 的词典条目；黑卡上的引言；THE END 被改写，两只手一起写，粉笔蓝图雏菊 |
| 5:38 | 副歌 4 | 巨大昼夜翻面卡、纸剧场大幕拉开、最后一次地球变沙滩球、THE PLAN 被全片所有印章盖满 |
| 6:00 | 尾声 | 镜头拉远，这一页只是全片所有页面拼成的网格中的一格；"Everybody lives forever"时所有格子波浪式翻面，拼成一张所有人在日出里的大图；I DISAGREE 那一格最后才翻 |

## 素材分工

| 来源 | 做了什么 |
|---|---|
| Codex（`gpt-6-sol`，推理 medium） | 角色立绘和场景关键帧，以参考图保持角色一致，见 `tools/jobs_wave*.json`。v2 新增 9 个姿势（挥手、剪刀、巨笔、读书、抱文件、扛夜空、欢呼、坐、耳语），以及小报夜景、结尾大图、四张"自由生活"照片和节日全景。v3 新增 30 个姿势的嘴型（`tools/mouths.py`，`tools/jobs_mouths_*.json`） |
| 代码（Canvas 2D，每帧是时间的纯函数） | 所有动态：镜头、纸张、翻面、撕纸、贴纸、文字动画、昼夜纸轮、立体书、地图、漫画分格、日历、钟、蜡烛、气球、纸人、网格翻面等 |

## 用到的 motion-prompt 元素（v2）

| # | 用在哪 |
|---|---|
| 001 Pop-in | 衬线歌词逐词弹出、手机图标、对白气泡、雏菊、爱心贴纸 |
| 002 Stagger | 小纸人、应援扇、蜡烛波浪、拍立得墙、灯笼、长街窗户逐拍打开、彩灯串逐个亮起 |
| 003 Burst | 应援扇心形爆点 |
| 004 Line draw | 马克笔圈、下划线、删除线、红线、涂鸦、地图轮廓、蓝图雏菊、计数线（带笔尖小圆点） |
| 005 Mask reveal | 标签机胶带歌词 |
| 006 Typewriter | 打字机歌词、表格、备忘录、词典释义 |
| 007 Count-up | 9,999→0 封邮件、1→4 楼、9→80 岁、0→1,000 个故事、0→110 根蜡烛、2026→2126 年 |
| 008 Slam | 所有橡皮章、勒索信字母、PLAN! |
| 010 Overshoot | 便利贴跳到周末和星期二 |
| 015 Particles | 爱心、书本喷泉、长街烟花 |
| 021 Flip | 贴纸换姿势、昼夜翻面卡、照片翻面、FEAR→CARE、飞艇画面百叶窗翻面、长街窗户百叶窗、尾声网格翻面 |
| 022 Light sweep | 金色字母、THE PLAN、HOPE 书 |
| 024 Impact shake | 盖章、砸落、撕纸 |
| 028 Zoom | 镜头推拉（按比例插值），尾声的大拉远 |
| 034 Handheld | 全片的轻微手持感 |
| 039 Time-lapse | 一百年的窗户 |

## 字幕

字幕按录音显示，拿不准的地方参照了参考视频的屏幕文字（歌词表修订见 `audio/lyrics.txt`，原版保存在 `audio/lyrics_sheet_original.txt`）。

## 重新生成

```bash
# 检查某几个时间点
uv run --no-project --with playwright python tools/render.py --page src/full.html --stills 56.3,92.8 --out render/stills_full
uv run --no-project --with pillow python tools/sheet.py render/stills_full render/review/check.jpg
# 改过任何页面后，重做尾声网格用的缩略图
uv run --no-project --with playwright python tools/render.py --page src/full.html --thumbs --out assets/thumbs
# 完整渲染（4 路并行、14 秒一段，已完成的分段会自动跳过）
uv run --no-project --with playwright python tools/render.py --page src/full.html --from 0 --to 375.94 --jobs 4 --chunk 14 --fps 30 --crf 18 --out out/evil_plan_mv.mp4
# 给新姿势做嘴型：先按嘴的位置（相对剪影图的比例）切脸部，再让 Codex 重画嘴，最后生成贴片和检查图 render/review/mouths_<姿势>.jpg
uv run --no-project --with pillow --with numpy python tools/mouths.py crops spr_xxx:0.49,0.13
uv run --no-project --with pillow --with numpy python tools/mouths.py jobs spr_xxx > tools/jobs_mouths_new.json   # 嘴原本是闭着的姿势写 spr_xxx+e
python tools/gen_images.py tools/jobs_mouths_new.json -j 5
uv run --no-project --with pillow --with numpy python tools/mouths.py patches spr_xxx
# 口型对时：分离人声 -> 两个模型强制对齐 -> 生成关键帧 -> 检查（报告和图在 render/lipcheck/）
uv run --no-project --with demucs --with soundfile python tools/separate.py render/sep/song44.wav audio/vocals.wav   # song44.wav：用 ffmpeg 把 song.mp3 解成 44.1 kHz 立体声
uv run --no-project --with torch --with transformers --with soundfile --with scipy python tools/forcealign.py audio/vocals.wav src/data/timing.js render/lipcheck/fa.json
uv run --no-project --with torch --with transformers --with soundfile --with scipy python tools/forcealign.py audio/vocals.wav src/data/timing.js render/lipcheck/fa_large.json facebook/wav2vec2-large-960h-lv60-self
uv run --no-project --with numpy --with soundfile python tools/lipkeys.py audio/vocals.wav src/data/timing.js render/lipcheck/fa.json render/lipcheck/fa_large.json src/data/lipkeys.js
node tools/liptimeline.js render/lipcheck/timeline.json
uv run --no-project --with numpy --with soundfile --with pillow python tools/lipcheck.py audio/vocals.wav render/lipcheck/timeline.json render/lipcheck
```
