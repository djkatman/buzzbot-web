export const metadata = {
  title: 'X BuzzBot Web',
  description: 'AIでXの投稿を自動生成',
}

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body style={{ margin: 0, padding: 0, background: '#0F1923', color: '#E2E8F0', fontFamily: "'Hiragino Sans', 'Noto Sans JP', sans-serif" }}>
        {children}
      </body>
    </html>
  )
}
