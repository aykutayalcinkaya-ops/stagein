export interface BlogBlock {
  type: 'h2' | 'p' | 'list'
  text?: string
  items?: string[]
}

export interface BlogPost {
  slug: string
  title: string
  description: string
  author: string
  publishedAt: string
  readingMinutes: number
  tags: string[]
  blocks: BlogBlock[]
}

/**
 * MVP'de blog içeriği statik. CMS'e geçildiğinde bu modülün yerine
 * aynı şekli döndüren bir veri kaynağı konur, sayfalar değişmez.
 */
export const BLOG_POSTS: BlogPost[] = [
  {
    slug: 'sehrinde-grup-nasil-kurulur',
    title: 'Şehrinde sıfırdan grup nasıl kurulur?',
    description:
      'Prova salonu bulmaktan ilk konsere kadar, tanıdığı olmayan bir müzisyenin şehrinde grup kurma rehberi.',
    author: 'StageIn Ekibi',
    publishedAt: '2026-08-12',
    readingMinutes: 7,
    tags: ['Grup Kurma', 'Rehber'],
    blocks: [
      {
        type: 'p',
        text: 'Grup kurmanın zor kısmı çalmak değil, doğru insanları bulmak. Çoğu müzisyen aynı beş kişilik çevrenin içinde döner ve o çevrede bas gitarist yoksa grup kurulmaz. Bu yazıda tanıdığı olmayan birinin nasıl grup kurabileceğini adım adım anlatıyoruz.',
      },
      { type: 'h2', text: '1. Önce ne aradığını netleştir' },
      {
        type: 'p',
        text: 'Coverlarla bar sahnesi mi hedefliyorsun, yoksa kendi parçalarını mı kaydetmek istiyorsun? İkisi tamamen farklı insan profilleri ister. İlan verirken bunu ilk cümlede yaz; belirsiz ilan, belirsiz başvuru getirir.',
      },
      { type: 'h2', text: '2. Çaldığını göster, anlatma' },
      {
        type: 'p',
        text: 'Bir müzisyenin seviyesini metinden anlamak imkânsız. Telefonla çekilmiş 40 saniyelik bir video, üç paragraf özgeçmişten daha fazlasını söyler. Prodüksiyon kalitesi kimsenin umurunda değil; tempo, tuşe ve tavır önemli.',
      },
      { type: 'h2', text: '3. Provaya kadar olan mesafeyi kısalt' },
      {
        type: 'list',
        items: [
          'İlk mesajda somut bir şey öner: tarih, saat, prova salonu.',
          'İki parça belirleyip önceden paylaş — ilk provada ne çalınacağı belli olsun.',
          'İlk buluşmayı bir saatle sınırla. Uymazsa kimse mecbur hissetmesin.',
        ],
      },
      { type: 'h2', text: '4. İlk provadan sonra dürüst ol' },
      {
        type: 'p',
        text: 'Kimya tutmadıysa bunu söylemek, üç hafta oyalamaktan iyidir. Müzik camiası küçük; net ve nazik olan kişi hatırlanır.',
      },
    ],
  },
  {
    slug: 'session-muzisyen-fiyatlandirma',
    title: 'Session müzisyeni olarak kendini nasıl fiyatlandırırsın?',
    description:
      'Stüdyo kaydı, canlı sahne ve uzaktan kayıt için Türkiye şartlarında fiyat belirleme mantığı.',
    author: 'StageIn Ekibi',
    publishedAt: '2026-07-28',
    readingMinutes: 6,
    tags: ['Session', 'Para'],
    blocks: [
      {
        type: 'p',
        text: 'Session müzisyenliğinde en sık yapılan hata, işi saat başı değil "iyilik" olarak fiyatlandırmak. Bir fiyat listesi olmadan pazarlığa oturursan, karşı taraf senin yerine fiyat belirler.',
      },
      { type: 'h2', text: 'Üç ayrı kalem düşün' },
      {
        type: 'list',
        items: [
          'Hazırlık: parçayı öğrenmek, aranje çıkarmak, notaya dökmek.',
          'Kayıt/sahne: fiilen çaldığın süre, yol ve kurulum dahil.',
          'Haklar: kayıt yayınlanacaksa tek seferlik ücret mi, pay mı?',
        ],
      },
      { type: 'h2', text: 'Uzaktan kayıtta net konuş' },
      {
        type: 'p',
        text: 'Uzaktan kayıtta revizyon sayısı en büyük belirsizlik. Fiyata kaç revizyon dahil olduğunu baştan yaz; sonrası ek ücret. Bu tek cümle, işlerin yarısındaki gerginliği ortadan kaldırır.',
      },
      { type: 'h2', text: 'Ücretsiz çalmanın mantıklı olduğu yer' },
      {
        type: 'p',
        text: 'Portfolyon yoksa ilk birkaç iş, kayıt karşılığı ücretsiz olabilir — ama kaydı kullanma iznini yazılı al. Elinde gösterilecek üç iş olduğunda ücretsiz dönem biter.',
      },
    ],
  },
  {
    slug: 'ilk-video-nasil-cekilir',
    title: 'Telefonla ilk müzik videonu çekerken 6 pratik kural',
    description: 'Ekipman almadan, evde, telefonla izlenebilir bir performans videosu çekmenin yolu.',
    author: 'StageIn Ekibi',
    publishedAt: '2026-07-05',
    readingMinutes: 5,
    tags: ['Video', 'Rehber'],
    blocks: [
      {
        type: 'p',
        text: 'İyi video pahalı ekipman değil, birkaç doğru karar ister. Telefonun kamerası yeterli; sorun genelde ses ve ışıkta.',
      },
      {
        type: 'list',
        items: [
          'Dikey çek. Akış dikey; yatay video kenarlardan kırpılır.',
          'Telefonu sabitle. Kitap yığını, tripod kadar iş görür.',
          'Işığı yüzüne al. Pencereye sırtını dönme.',
          'Sesi ayrı kaydediyorsan başlangıçta bir alkışla senkron noktası bırak.',
          'İlk üç saniyede çalmaya başla. Giriş konuşması izleyiciyi kaçırır.',
          '40-60 saniye yeterli. Tam parça değil, en iyi bölüm.',
        ],
      },
      { type: 'h2', text: 'Sonrası' },
      {
        type: 'p',
        text: 'Videoyu yüklerken şehrini ve enstrümanını doğru etiketle. Keşfet akışı bu iki alana göre eşleştiriyor; boş bıraktığın etiket, ulaşamadığın kişi demek.',
      },
    ],
  },
]

export function getPost(slug: string) {
  return BLOG_POSTS.find((p) => p.slug === slug) ?? null
}
