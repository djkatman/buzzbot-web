'use client'

import { useState, useEffect } from 'react'

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

// ツイートIDをURLから抽出
function extractTweetId(url) {
  const match = url.match(/status\/(\d+)/)
  return match ? match[1] : null
}

export default function Home() {
  const [tab, setTab] = useState('generate') // 'generate' | 'settings'
  const [url, setUrl] = useState('')
  const [buzzText, setBuzzText] = useState('')
  const [inputMode, setInputMode] = useState('url') // 'url' | 'text'
  const [loading, setLoading] = useState(false)
  const [posts, setPosts] = useState([])
  const [error, setError] = useState('')
  const [tweetId, setTweetId] = useState('')
  const [copied, setCopied] = useState({})
  const [apiKey, setApiKey] = useState('')
  const [customPrompt, setCustomPrompt] = useState('')
  const [settingsSaved, setSettingsSaved] = useState(false)

  // localStorageから設定を読み込む
  useEffect(() => {
    setApiKey(localStorage.getItem('bb_apiKey') || '')
    setCustomPrompt(localStorage.getItem('bb_prompt') || '')
  }, [])

  // 設定を保存
  function saveSettings() {
    localStorage.setItem('bb_apiKey', apiKey)
    localStorage.setItem('bb_prompt', customPrompt)
    setSettingsSaved(true)
    setTimeout(() => setSettingsSaved(false), 2000)
  }

  // プロンプトをデフォルトに戻す
  function resetPrompt() {
    if (!confirm('プロンプトをデフォルトに戻しますか？')) return
    setCustomPrompt('')
    localStorage.removeItem('bb_prompt')
  }

  // AI生成を実行
  async function handleGenerate() {
    const key = localStorage.getItem('bb_apiKey')
    if (!key) {
      setError('APIキーが設定されていません。「設定」タブで入力してください。')
      return
    }

    const text = inputMode === 'url' ? '' : buzzText
    let tid = ''

    if (inputMode === 'url') {
      tid = extractTweetId(url)
      if (!tid) {
        setError('XのツイートURLを正しく入力してください。\n例: https://x.com/xxx/status/123456')
        return
      }
      setTweetId(tid)
    } else {
      if (!buzzText.trim()) {
        setError('投稿テキストを入力してください。')
        return
      }
    }

    setLoading(true)
    setError('')
    setPosts([])

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          buzzText: inputMode === 'url'
            ? `（URLから取得: https://x.com/i/web/status/${tid}）\n※ URLモードではテキストを直接貼り付けモードより精度が下がる場合があります`
            : buzzText,
          likes: 0, retweets: 0, buzzScore: 0,
          apiKey: key,
          customPrompt: localStorage.getItem('bb_prompt') || '',
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'エラーが発生しました')
        return
      }
      setPosts(data.posts || [])
      if (inputMode === 'url') setTweetId(tid)
    } catch (e) {
      setError('ネットワークエラーが発生しました。')
    } finally {
      setLoading(false)
    }
  }

  // コピー
  async function handleCopy(text, idx) {
    await navigator.clipboard.writeText(text)
    setCopied(prev => ({ ...prev, [idx]: true }))
    setTimeout(() => setCopied(prev => ({ ...prev, [idx]: false })), 2000)
  }

  // 引用投稿を開く
  function handleQuote(post, idx) {
    const id = tweetId || extractTweetId(url)
    if (id) {
      navigator.clipboard.writeText(post.text)
      window.open(`https://x.com/intent/tweet?quote_tweet_id=${id}`, '_blank')
    } else {
      navigator.clipboard.writeText(post.text)
      window.open('https://x.com/intent/tweet', '_blank')
    }
  }

  const styles = {
    container: { maxWidth: 480, margin: '0 auto', padding: '16px 16px 80px', minHeight: '100vh' },
    header: { textAlign: 'center', padding: '24px 0 20px' },
    logo: { fontSize: 32, fontWeight: 900, color: '#1DA1F2', letterSpacing: -1 },
    logoSub: { fontSize: 12, color: '#475569', marginTop: 4 },
    tabs: { display: 'flex', gap: 8, marginBottom: 20 },
    tab: (active) => ({
      flex: 1, padding: '10px 0', border: 'none', borderRadius: 10,
      background: active ? 'rgba(29,161,242,0.15)' : 'rgba(255,255,255,0.05)',
      color: active ? '#1DA1F2' : '#64748B',
      fontWeight: 700, fontSize: 13, cursor: 'pointer',
      borderBottom: active ? '2px solid #1DA1F2' : '2px solid transparent',
      fontFamily: 'inherit',
    }),
    card: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 16, marginBottom: 12 },
    label: { fontSize: 11, color: '#94A3B8', marginBottom: 6, display: 'block', fontWeight: 600 },
    input: { width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#E2E8F0', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' },
    textarea: { width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', color: '#E2E8F0', fontSize: 13, fontFamily: 'inherit', outline: 'none', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.6 },
    btnPrimary: { width: '100%', padding: '13px 0', background: 'linear-gradient(135deg,#1DA1F2,#0C85D0)', border: 'none', borderRadius: 12, color: 'white', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', marginTop: 12 },
    btnGroup: { display: 'flex', gap: 6, marginTop: 12 },
    btnCopy: (done) => ({ flex: 1, padding: '8px 4px', border: '1px solid rgba(29,161,242,0.3)', borderRadius: 8, background: done ? 'rgba(34,197,94,0.1)' : 'rgba(29,161,242,0.1)', color: done ? '#22C55E' : '#1DA1F2', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }),
    btnQuote: { flex: 1, padding: '8px 4px', border: '1px solid rgba(251,191,36,0.3)', borderRadius: 8, background: 'rgba(251,191,36,0.1)', color: '#FBBF24', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
    postText: { fontSize: 13, color: '#CBD5E1', lineHeight: 1.7, whiteSpace: 'pre-line', marginBottom: 8 },
    patternLabel: { fontSize: 10, color: '#F59E0B', fontWeight: 700, marginBottom: 6 },
    charCount: (over) => ({ fontSize: 10, color: over ? '#EF4444' : '#64748B', float: 'right' }),
    error: { background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '12px 14px', color: '#FCA5A5', fontSize: 13, marginBottom: 12, whiteSpace: 'pre-line' },
    modeToggle: { display: 'flex', gap: 6, marginBottom: 12 },
    modeBtn: (active) => ({ flex: 1, padding: '7px 0', border: `1px solid ${active ? 'rgba(29,161,242,0.4)' : 'rgba(255,255,255,0.1)'}`, borderRadius: 8, background: active ? 'rgba(29,161,242,0.1)' : 'transparent', color: active ? '#1DA1F2' : '#64748B', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }),
    spinner: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 0', gap: 12 },
    hint: { fontSize: 10, color: '#475569', marginTop: 6, lineHeight: 1.5 },
    saveBadge: { textAlign: 'center', color: '#22C55E', fontSize: 12, marginTop: 8 },
  }

  return (
    <div style={styles.container}>
      {/* ヘッダー */}
      <div style={styles.header}>
        <div style={styles.logo}>𝕏 BuzzBot</div>
        <div style={styles.logoSub}>バズ投稿からAI投稿生成 · スマホ対応版</div>
      </div>

      {/* タブ */}
      <div style={styles.tabs}>
        <button style={styles.tab(tab === 'generate')} onClick={() => setTab('generate')}>✨ AI生成</button>
        <button style={styles.tab(tab === 'settings')} onClick={() => setTab('settings')}>⚙️ 設定</button>
      </div>

      {/* ===== AI生成タブ ===== */}
      {tab === 'generate' && (
        <div>
          <div style={styles.card}>
            {/* 入力モード切り替え */}
            <div style={styles.modeToggle}>
              <button style={styles.modeBtn(inputMode === 'url')} onClick={() => setInputMode('url')}>🔗 URLで入力</button>
              <button style={styles.modeBtn(inputMode === 'text')} onClick={() => setInputMode('text')}>📝 テキストで入力</button>
            </div>

            {inputMode === 'url' ? (
              <>
                <label style={styles.label}>バズ投稿のURL</label>
                <input
                  style={styles.input}
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  placeholder="https://x.com/xxx/status/123456789"
                  type="url"
                />
                <p style={styles.hint}>XでバズってるポストのURLをコピーして貼り付けてください</p>
              </>
            ) : (
              <>
                <label style={styles.label}>バズ投稿のテキスト</label>
                <textarea
                  style={{ ...styles.textarea }}
                  rows={5}
                  value={buzzText}
                  onChange={e => setBuzzText(e.target.value)}
                  placeholder="Xでバズっているポストのテキストをここにコピペしてください..."
                />
                <p style={styles.hint}>投稿をコピーして貼り付けると精度が上がります</p>
              </>
            )}

            <button
              style={{ ...styles.btnPrimary, opacity: loading ? 0.7 : 1 }}
              onClick={handleGenerate}
              disabled={loading}
            >
              {loading ? '生成中...' : '✨ AI生成する'}
            </button>
          </div>

          {/* エラー表示 */}
          {error && <div style={styles.error}>⚠️ {error}</div>}

          {/* 生成中インジケーター */}
          {loading && (
            <div style={styles.spinner}>
              <div style={{
                width: 36, height: 36, border: '3px solid rgba(29,161,242,0.2)',
                borderTop: '3px solid #1DA1F2', borderRadius: '50%',
                animation: 'spin 0.8s linear infinite'
              }} />
              <div style={{ color: '#64748B', fontSize: 13 }}>Claudeが投稿を生成中…</div>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {/* 生成済み投稿 */}
          {posts.map((post, i) => {
            const len = post.text.replace(/\n/g, '').length
            const over = len > 140
            return (
              <div key={i} style={styles.card}>
                <div style={{ marginBottom: 8 }}>
                  <span style={styles.patternLabel}>パターン {i + 1}</span>
                  <span style={styles.charCount(over)}>{len}文字{over ? ' ⚠️超過' : ''}</span>
                </div>
                <div style={styles.postText}>{post.text}</div>
                <div style={styles.btnGroup}>
                  <button
                    style={styles.btnCopy(copied[i])}
                    onClick={() => handleCopy(post.text, i)}
                  >
                    {copied[i] ? '✅ コピー済' : '📋 コピー'}
                  </button>
                  <button
                    style={styles.btnQuote}
                    onClick={() => handleQuote(post, i)}
                  >
                    💬 引用投稿
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ===== 設定タブ ===== */}
      {tab === 'settings' && (
        <div>
          <div style={styles.card}>
            <label style={styles.label}>Claude APIキー</label>
            <input
              style={styles.input}
              type="password"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="sk-ant-api03-..."
            />
            <p style={styles.hint}>
              console.anthropic.com で取得できます。このデバイスのみに保存されます。
            </p>
          </div>

          <div style={styles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <label style={{ ...styles.label, margin: 0 }}>プロンプト</label>
              <button
                onClick={resetPrompt}
                style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#64748B', fontSize: 10, padding: '3px 8px', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                デフォルトに戻す
              </button>
            </div>
            <textarea
              style={{ ...styles.textarea }}
              rows={14}
              value={customPrompt || DEFAULT_PROMPT}
              onChange={e => setCustomPrompt(e.target.value === DEFAULT_PROMPT ? '' : e.target.value)}
              placeholder={DEFAULT_PROMPT}
            />
            <p style={styles.hint}>
              使えるプレースホルダー: {'{{buzz_text}}'} {'{{likes}}'} {'{{retweets}}'} {'{{buzz_score}}'}
            </p>
          </div>

          <button style={styles.btnPrimary} onClick={saveSettings}>
            💾 保存する
          </button>
          {settingsSaved && <div style={styles.saveBadge}>✅ 設定を保存しました</div>}
        </div>
      )}
    </div>
  )
}
