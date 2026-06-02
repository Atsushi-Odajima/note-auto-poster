export const CATEGORIES = [
  // 定番バズジャンル
  { id: 'ai',          short: 'AI',         label: 'AI・ChatGPT活用',           emoji: '🤖', desc: '生成AI、ChatGPT、プロンプト術など旬なジャンル' },
  { id: 'it',          short: 'IT',         label: 'IT・プログラミング',          emoji: '💻', desc: '技術解説、開発Tips、エンジニア向けコンテンツ' },
  { id: 'side_hustle', short: '副業',       label: '副業・フリーランス',          emoji: '💰', desc: '副収入の作り方、フリーランス戦略、ノマドライフ' },
  { id: 'invest',      short: '投資',       label: '投資・FIRE・資産運用',       emoji: '📈', desc: '株、新NISA、FIREムーブメント、お金の話' },
  { id: 'marketing',   short: 'マーケ',     label: 'ビジネス・マーケティング',    emoji: '📊', desc: 'SNS運用、集客術、ブランディング、起業ノウハウ' },
  { id: 'romance',     short: '恋愛',       label: '恋愛・婚活スキル',           emoji: '💕', desc: 'モテる方法、婚活戦略、恋愛心理学' },
  { id: 'info',        short: '情報',       label: '情報商材・ネットビジネス',    emoji: '🎯', desc: '稼ぎ方の暴露、情報ビジネスの裏側、成功体験' },
  { id: 'selfdev',     short: '自己啓発',   label: '自己啓発・習慣化',           emoji: '🚀', desc: '朝活、習慣術、メンタル強化、成功マインド' },
  { id: 'diet',        short: '美容',       label: 'ダイエット・美容・健康',      emoji: '✨', desc: '痩せ方、スキンケア、健康管理、ボディメイク' },
  { id: 'career',      short: 'キャリア',   label: '転職・キャリア・スキルアップ', emoji: '🎓', desc: '転職活動、市場価値UPの戦略、面接対策' },
  { id: 'parenting',   short: '子育て',     label: '子育て・教育',               emoji: '👶', desc: '育児の悩み解決、教育論、子どもの習い事' },
  { id: 'minimal',     short: 'ミニマル',   label: 'ミニマリスト・節約・生活術',  emoji: '🏠', desc: '断捨離、節約、シンプルライフ、暮らしの知恵' },
  { id: 'creator',     short: 'SNS',        label: 'クリエイター・ブログ・SNS',   emoji: '📱', desc: 'note運用術、SNS攻略、収益化戦略' },
  { id: 'trend',       short: 'トレンド',   label: 'エンタメ・トレンド考察',      emoji: '🔥', desc: '話題のニュース深掘り、トレンド分析、批評' },
  { id: 'travel',      short: '旅行',       label: '旅行・グルメ・ライフスタイル', emoji: '✈️', desc: '旅行記、グルメレポ、ライフスタイル提案' },
  { id: 'mental',      short: 'メンタル',   label: 'メンタルヘルス・心理学',      emoji: '🧠', desc: '心の健康、認知行動、ストレス管理、HSP' },
  { id: 'writing',     short: '文章術',     label: '文章術・ライティング',        emoji: '✍️', desc: '刺さる文章の書き方、コピーライティング' },
  { id: 'philosophy',  short: '哲学',       label: '哲学・人生論・エッセイ',      emoji: '💭', desc: '生き方考察、思想、エッセイスタイルの投稿' },
] as const

export type CategoryId = (typeof CATEGORIES)[number]['id']

export function getCategory(id: string | null | undefined) {
  if (!id) return undefined
  return CATEGORIES.find(c => c.id === id)
}

export const STYLES = [
  { id: 'informative', label: '情報提供型', desc: '具体データ・事例を多用、即実践できる情報' },
  { id: 'story',       label: 'ストーリー型', desc: '体験談・ナラティブで感情移入させ教訓へ誘導' },
  { id: 'list',        label: 'リスト型', desc: '「〇選」「〇つの方法」形式、スキャンしやすい' },
  { id: 'how_to',      label: 'ハウツー型', desc: 'ステップ解説、初心者にもわかりやすい手順' },
  { id: 'interview',   label: 'Q&A型', desc: '読者の疑問に答える対話スタイル' },
] as const

export const TONES = [
  { id: 'professional', label: 'プロフェッショナル', desc: '信頼感・権威性重視' },
  { id: 'casual',       label: 'カジュアル', desc: '親しみやすく話し言葉風' },
  { id: 'emotional',    label: '感情訴求', desc: '共感・危機感・ワクワク感を強く打ち出す' },
  { id: 'academic',     label: 'アカデミック', desc: '論理的・客観的・データ重視' },
] as const
