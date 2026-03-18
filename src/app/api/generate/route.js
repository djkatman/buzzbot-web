export async function POST(request) {
  try {
    const { buzzText, likes, retweets, buzzScore, apiKey, customPrompt } = await request.json()
    if (!apiKey) return Response.json({ error: 'APIキーが設定されていません' }, { status: 400 })
    if (!buzzText) return Response.json({ error: '投稿テキストが必要です' }, { status: 400 })

    const DEFAULT_PROMPT = `あなたはXで投稿を生成するアシスタントです。
以下のキャラクター設定と条件に従って、X投稿を3パターン生成してください。

【キャラクター設定】
・普通の会社員おじさん（@neco_oji3）
・野良猫が大好き
・新しい情報や世の中の出来事に素直に反応する
・難しいことを難しく言わない、等身大の言葉を使う
・ちょっとユーモアがあって、共感されやすいトーン
・上から目線にならない、一緒に考えるスタンス

【投稿の条件】
・140文字以内（厳守）
・1文目で思わず止まるフックを入れる
・等身大の感想や共感を含める
・ユーモアや軽さを忘れない
・説教くさくしない
・適切な改行で読みやすくする

【参考にするバズ投稿】
{{buzz_text}}

いいね: {{likes}} / RT: {{retweets}} / BuzzScore: {{buzz_score}}

【良い投稿の例】
・「これ見た瞬間、思わず猫に話しかけてしまった」
・「おじさんにもわかるように言うと、要するにすごいってこと」
・「なんかこう…じわじわくる。わかる人いる？」`

    const template = customPrompt || DEFAULT_PROMPT
    const prompt = template
      .replace(/{{buzz_text}}/g, buzzText)
      .replace(/{{likes}}/g, String(likes || 0))
      .replace(/{{retweets}}/g, String(retweets || 0))
      .replace(/{{buzz_score}}/g, String(buzzScore || 0))
      + '\n\n【出力形式】\n[{"text":"投稿内容1"},{"text":"投稿内容2"},{"text":"投稿内容3"}]'

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 600,
        system: 'あなたはXのバズ投稿を分析してオリジナルの日本語投稿を生成するプロのコピーライターです。必ずJSON配列のみを返してください。',
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      const msg = data?.error?.message || ''
      if (msg.includes('credit balance')) return Response.json({ error: 'クレジット残高不足。console.anthropic.comでチャージしてください。' }, { status: 402 })
      if (res.status === 401) return Response.json({ error: 'APIキーが無効です。設定を確認してください。' }, { status: 401 })
      return Response.json({ error: `APIエラー (${res.status}): ${msg}` }, { status: res.status })
    }

    const raw = data.content?.[0]?.text?.trim() || '[]'
    const cleaned = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
    const match = cleaned.match(/\[[\s\S]*\]/)
    if (!match) return Response.json({ error: 'レスポンスの解析に失敗しました' }, { status: 500 })
    const posts = JSON.parse(match[0]).filter(p => p?.text)
    return Response.json({ posts })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
