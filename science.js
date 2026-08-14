/**
 * science.js — 科学的根拠・計算方法ページ（24〜26章）
 * 「科学的知見」「アプリ内定義」「ゲームバランス」の3層を明示する。
 */
const ScienceView = {
  render() {
    return el(`
      <div>
        <h2 style="font-family:var(--font-display); font-size:19px; margin:8px 0 16px;">科学的根拠・計算方法</h2>

        <div class="disclaimer-box" style="margin-bottom:18px;">
          <b>ご注意：</b> BPT（Body Point）は本アプリ独自の身体資産指数です。実際の筋肉量・VO₂max・消費カロリー等を直接測定した値ではありません。運動生理学に関する一般的な知見を参考に、運動による身体への刺激・適応・デトレーニングをアプリ内で可視化するために設計されています。病気の診断・治療・予後予測などの医学的判断には使用しないでください。
        </div>

        ${this.block("BPTとは何か", `
          <span class="tag appdef">アプリ内定義</span>
          <p>BPT（Body Point）は、あなたの運動記録をもとにアプリが独自に算出する「身体資産」の単位です。実際のお金や、特定の医学的測定値を表すものではありません。</p>
          <p>「運動 ＝ 身体への投資」というコンセプトのもと、運動によって得られる刺激と、身体が起こす適応を、積立残高のような形で可視化することを目的としています。</p>
        `)}

        ${this.block("3層構造の考え方", `
          <p>本アプリの数値は、次の3つの階層に分けて設計されています。</p>
          <p><span class="tag science">科学的知見</span><br>運動生理学・公衆衛生分野で広く参照される知見（例：運動強度・時間・頻度が身体適応に影響する、FITT原則、METsという運動強度の指標など）</p>
          <p><span class="tag appdef">アプリ内定義</span><br>その知見を用いて、アプリ内で「運動刺激量」をどう算出するかというアプリ独自の定式化</p>
          <p><span class="tag balance">ゲームバランス</span><br>刺激量をBPTに変換する係数や、逓減・減価のカーブなど、体験としてのバランスを取るための調整値</p>
          <p>BPTそのものが医学的に確立された指標であるかのような表現は行いません。</p>
        `)}

        ${this.block("なぜ運動でBPTが増えるのか", `
          <p><span class="tag science">科学的知見</span><br>運動を継続すると、心肺機能・筋力・筋持久力などの体力要素が刺激に応じて適応していくことは、運動処方の分野で広く共有されている考え方です。</p>
          <p><span class="tag appdef">アプリ内定義</span><br>本アプリでは、この「刺激→適応」の関係を、運動記録から算出した刺激量をBPTへ変換するという形でモデル化しています。</p>
        `)}

        ${this.block("なぜ運動しないとBPTが減るのか（減価）", `
          <p><span class="tag science">科学的知見</span><br>運動を中止すると、獲得した体力の一部が時間経過とともに失われていく「デトレーニング」という現象が知られています。一般に、心肺機能は比較的早い段階から低下し始め、筋力は心肺機能よりも緩やかに保たれやすい傾向があると報告されています。</p>
          <p><span class="tag appdef">アプリ内定義</span><br>無活動の日数に応じて資産を減少させ、資産の種類ごとに減少速度を変えるモデルを採用しています。</p>
          <p><span class="tag balance">ゲームバランス</span><br>減価が始まるまでの日数、日々の減価率、資産ごとの速度係数は、いずれもアプリ独自の設定値であり、「休養＝悪」という誤ったメッセージを避けるため、短期間の休養では大きく減少しないよう調整しています。今後の知見更新やバランス調整により変更されることがあります。</p>
        `)}

        ${this.block("心肺資産の算出方法", `
          <p><span class="tag science">科学的知見</span><br>運動強度の指標として、METs（代謝当量）が広く使われています。運動処方はFrequency（頻度）・Intensity（強度）・Time（時間）・Type（種類）の頭文字を取ったFITT原則を基本とします。</p>
          <p><span class="tag appdef">アプリ内定義</span><br>心肺刺激量 ＝ 運動時間 × 強度係数（METs近似値）× 頻度補正 × 個人能力補正、として算出します。</p>
          <div class="formula-box">
            <div class="fx-line">心肺刺激量 = 時間(分) × 強度係数 × 頻度補正</div>
            <div class="fx-line">強度係数 = METs近似値（速度・傾斜から算出）</div>
            <div class="fx-line">心肺BPT = 心肺刺激量（逓減後） × 心肺単価(4.0)</div>
            <div class="fx-note">頻度補正は直近7日間の心肺運動回数に応じて最大+20%まで上乗せされます。</div>
          </div>

          <p style="margin-top:12px;">強度係数（METs近似値）＝ 種目ごとの基礎値 ＋ (速度あたりの係数 × 速度) ＋ (傾斜(%) × 0.15)</p>
          <div class="sim-table-wrap" style="max-height:none; overflow:visible;">
            <table class="sim-table">
              <thead>
                <tr><th>種目</th><th>基礎値</th><th>速度1km/hあたり</th></tr>
              </thead>
              <tbody>
                ${EXERCISES.cardio.map(e => `
                  <tr>
                    <td class="stage-label">${e.name}</td>
                    <td class="num">${e.metsBase}</td>
                    <td class="num">${e.metsPerKmh ? "+" + e.metsPerKmh : "—"}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
          <p class="small-muted" style="margin-top:6px; line-height:1.6;">傾斜（%）が使える種目では、傾斜1%あたり+0.15が上乗せされます。水泳・その他有酸素運動は速度・傾斜の入力がなく、基礎値のみが使われます。</p>

          <p><span class="tag balance">ゲームバランス</span><br>刺激量をBPTへ変換する係数、頻度補正の上限は調整可能な設定値です（「その他」→「詳細設定（ゲームバランス）」から変更できます）。</p>
        `)}

        ${this.block("筋力資産の算出方法", `
          <p><span class="tag science">科学的知見</span><br>筋力トレーニングの効果は、セット数・反復回数といった「量」と、最大挙上重量（1RM）に対する割合である「相対強度」に関係することが、トレーニング科学の分野で広く支持されています。</p>
          <p><span class="tag appdef">アプリ内定義</span><br>本アプリでは、重量と反復回数からEpley法に類する式で推定1RMを算出し、これを「過去の自分の基準値」と比較することで相対強度を近似します。1RMの実測は必須にせず、通常のトレーニング記録（重量・回数・セット数）から推定します。他人との比較ではなく、過去の自分との比較を基本とします。</p>
          <div class="formula-box">
            <div class="fx-line">推定1RM = 重量(kg) × (1 + 回数 ÷ 30)</div>
            <div class="fx-line">相対強度 = 今回の推定1RM ÷ 自己ベスト1RM</div>
            <div class="fx-line">筋力刺激量 = セット数 × 回数 × 相対強度 × 対象筋群係数</div>
            <div class="fx-line">筋力BPT = 筋力刺激量（逓減後） × 筋力単価(25)</div>
            <div class="fx-note">相対強度は0.8〜1.3の範囲に制限し、急激な変動を抑えています。</div>
          </div>

          <p style="margin-top:12px;">対象筋群係数は、種目が使う筋肉の大きさ・範囲に応じて設定されています。</p>
          <div class="sim-table-wrap" style="max-height:none; overflow:visible;">
            <table class="sim-table">
              <thead>
                <tr><th>種目</th><th>対象筋群係数</th></tr>
              </thead>
              <tbody>
                ${EXERCISES.strength.map(e => `
                  <tr>
                    <td class="stage-label">${e.name}</td>
                    <td class="num">${e.groupCoefficient != null ? e.groupCoefficient : 1.0}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
          <p class="small-muted" style="margin-top:6px; line-height:1.6;">スクワットのような下半身の複合種目は係数が高め、単関節に近い種目や「その他」は低めに設定されています。</p>

          <p><span class="tag balance">ゲームバランス</span><br>刺激量をBPTへ変換する係数、対象筋群ごとの係数は調整可能な設定値です（「その他」→「詳細設定（ゲームバランス）」から変更できます）。</p>
        `)}

        ${this.block("筋持久力資産の算出方法", `
          <p><span class="tag science">科学的知見</span><br>高反復の筋力トレーニングや、長時間の有酸素運動は、筋持久力（乳酸性作業閾値・毛細血管密度など）に主に寄与すると考えられています。</p>
          <p><span class="tag appdef">アプリ内定義</span><br>筋持久力には専用の入力欄を設けず、心肺・筋力の刺激量の一部を按分することで算出します。按分に使う単価は、元になったカテゴリ（心肺／筋力）の単価をそのまま使い、新しい単価を別途設けません。</p>
          <div class="formula-box">
            <div class="fx-line">有酸素運動由来: 筋持久力刺激量 = 心肺刺激量（逓減後） × 25%</div>
            <div class="fx-line">高反復筋トレ由来: 筋持久力刺激量 = 筋力刺激量（逓減後） × 60%</div>
            <div class="fx-line">筋持久力BPT = 筋持久力刺激量 × 元カテゴリの単価</div>
            <div class="fx-note">「高反復」は1セットあたり20回を超える場合を指します。</div>
          </div>
        `)}

        ${this.block("効果の逓減について", `
          <p><span class="tag science">科学的知見</span><br>同じ強度の刺激を際限なく積み重ねても、効果が単純に比例して増え続けるわけではなく、一定量を超えると追加的な効果が小さくなっていく傾向が示唆されています。</p>
          <p><span class="tag appdef">アプリ内定義</span><br>1日の中で積み上がった刺激量を区間に分け、区間が進むほど低い重みを掛けて合算する方式を採用しています。</p>
          <div class="formula-box">
            <div class="fx-line">基準量の 0〜100%: 重み 100%</div>
            <div class="fx-line">基準量の 100〜200%: 重み 70%</div>
            <div class="fx-line">基準量の 200〜350%: 重み 40%</div>
            <div class="fx-line">基準量の 350%〜: 重み 20%</div>
            <div class="fx-note">「基準量」は種目カテゴリごとの標準的な1回分の刺激量の目安です。</div>
          </div>
          <p><span class="tag balance">ゲームバランス</span><br>区間の閾値・重みはアプリ独自の設定値です。</p>
        `)}

        ${this.block("習慣スコアの算出方法", `
          <p>身体資産（BPT）とは別に、直近1週間の運動習慣を0〜100点で表す指標です。</p>
          <p><span class="tag science">科学的知見</span><br>週150分の中強度有酸素運動、週2回以上の筋力トレーニングは、WHOの身体活動ガイドライン等で広く紹介される目安値です。</p>
          <p><span class="tag appdef">アプリ内定義</span><br>有酸素の達成率・筋力の達成率・継続週数・運動日数の4項目を重み付けして合算します。</p>
          <div class="formula-box">
            <div class="fx-line">有酸素達成率 = 今週の有酸素時間 ÷ 150分（上限100%）</div>
            <div class="fx-line">筋力達成率 = 今週の筋トレ日数 ÷ 2日（上限100%）</div>
            <div class="fx-line">継続度 = 連続で運動した週数 ÷ 12週（上限100%）</div>
            <div class="fx-line">運動日数率 = 今週の運動日数 ÷ 7日</div>
            <div class="fx-line">習慣スコア = (有酸素達成率×35 + 筋力達成率×35</div>
            <div class="fx-line">              + 継続度×20 + 運動日数率×10)</div>
            <div class="fx-note">「毎日運動しないと下がる」設計ではなく、週単位の達成度を重視しています。</div>
          </div>
          <p><span class="tag balance">ゲームバランス</span><br>各項目の重み（35/35/20/10）や目標値は調整可能な設定値です（「その他」→「詳細設定（ゲームバランス）」から変更できます）。</p>
        `)}


        ${this.block("計算に使われる用語集", `
          <p>各計算式に出てくる専門的な言葉を、意味と具体例つきでまとめています。</p>
          <div class="glossary-list">
            <div class="glossary-item">
              <div class="glossary-term">強度係数（METs近似値）</div>
              <div class="glossary-def">安静に座っている状態を「1」としたときに、その運動が何倍のエネルギーを使うかを表す倍率。数値が大きいほど激しい運動。</div>
              <div class="glossary-example">例：普通の速さのウォーキング（時速5km）は約3.5、ジョギングは約8、坂道や傾斜がつくとさらに上がります。</div>
            </div>
            <div class="glossary-item">
              <div class="glossary-term">頻度補正</div>
              <div class="glossary-def">直近7日間に同じカテゴリの運動をどれだけ行ったかによる上乗せ。継続して取り組んでいるほど補正が大きくなります。</div>
              <div class="glossary-example">例：今週すでに3回ウォーキングをしていると、4回目の頻度補正は+15%程度になります。</div>
            </div>
            <div class="glossary-item">
              <div class="glossary-term">推定1RM（アールエム）</div>
              <div class="glossary-def">「1回だけ挙げられる最大重量」の推定値。限界まで追い込んで実測しなくても、普段のトレーニング記録（重量・回数）から計算式で見積もります。</div>
              <div class="glossary-example">例：80kgを8回挙げられた場合、推定1RMは約101kg（80×(1+8÷30)）。</div>
            </div>
            <div class="glossary-item">
              <div class="glossary-term">相対強度</div>
              <div class="glossary-def">今回のトレーニングの推定1RMが、自分の自己ベスト1RMに対してどれくらいの割合かを示す数値。1.0で自己ベストと同じ強度。</div>
              <div class="glossary-example">例：自己ベストが100kgの人が、今回90kg相当の重さでトレーニングすると相対強度は0.9。</div>
            </div>
            <div class="glossary-item">
              <div class="glossary-term">対象筋群係数</div>
              <div class="glossary-def">種目が使う筋肉の大きさ・範囲に応じた係数。太もも・お尻など大きな筋肉を使う種目ほど係数が高くなります。</div>
              <div class="glossary-example">例：スクワットのような下半身の複合種目は、腕の種目より係数が高めに設定されています。</div>
            </div>
            <div class="glossary-item">
              <div class="glossary-term">逓減（ていげん）</div>
              <div class="glossary-def">同じ日に似た刺激を積み重ねるほど、1回あたりの追加効果が少しずつ小さくなっていく仕組み。青天井に増え続けないようにするための調整です。</div>
              <div class="glossary-example">例：基準量の2倍を超えて運動しても、超えた分は40%の重みでしか加算されません。</div>
            </div>
            <div class="glossary-item">
              <div class="glossary-term">単価</div>
              <div class="glossary-def">刺激量をBPTに変換するための倍率。心肺は4.0、筋力は25という異なる単価を使っています。</div>
              <div class="glossary-example">例：心肺の刺激量が240の場合、心肺BPTは240×4.0＝960。</div>
            </div>
            <div class="glossary-item">
              <div class="glossary-term">按分（あんぶん）</div>
              <div class="glossary-def">1つの数値を複数の項目に割り振ること。筋持久力には専用の入力欄が無く、心肺・筋力の刺激量の一部を割り振って計算しています。</div>
              <div class="glossary-example">例：有酸素運動の刺激量の25%が、自動的に筋持久力の刺激量として按分されます。</div>
            </div>
          </div>
        `)}

        <div class="science-block">
          <h3>参考にしている情報源（例）</h3>
          <div class="ref-item">World Health Organization. <i>WHO Guidelines on Physical Activity and Sedentary Behaviour.</i> 2020.</div>
          <div class="ref-item">American College of Sports Medicine. <i>ACSM's Guidelines for Exercise Testing and Prescription.</i></div>
          <div class="ref-item">運動強度の参照値として、Compendium of Physical Activities（身体活動の強度をMETsで整理した参照表）の考え方を参考にしています。</div>
          <div class="ref-item">デトレーニングに関する一般的な知見の整理として、スポーツ医学分野のレビュー論文（例：Mujika &amp; Padilla, "Detraining", <i>Sports Medicine</i>）を参考にしています。</div>
          <p class="small-muted" style="margin-top:10px;">今後、各項目に個別の出典（論文名・著者・発表年・DOI等）を追加していく予定です。</p>
        </div>

      </div>
    `);
  },

  block(title, bodyHtml) {
    return `<div class="science-block card"><h3>${title}</h3>${bodyHtml}</div>`;
  }
};
