import type { Metadata } from 'next'
import { LegalDoc, type LegalSection } from '@/components/LegalDoc'

export const metadata: Metadata = {
  title: 'Gizlilik Politikası',
  description: 'StageIn hangi verileri topluyor, neden topluyor ve kullanıcı hakları nelerdir?',
  alternates: { canonical: '/gizlilik' },
}

const SECTIONS: LegalSection[] = [
  {
    heading: 'Topladığımız veriler',
    items: [
      'Hesap bilgileri: e-posta, kullanıcı adı, ad soyad, profil fotoğrafı.',
      'Profil bilgileri: şehir, enstrümanlar, müzik tarzları, deneyim seviyesi, biyografi.',
      'İçerik: yüklediğin videolar, ilanlar, mesajlar ve sesli notlar.',
      'Teknik veriler: cihaz tipi, uygulama sürümü, hata kayıtları ve temel kullanım istatistikleri.',
    ],
  },
  {
    heading: 'Verileri neden işliyoruz',
    items: [
      'Keşfet akışını şehrine ve enstrümanına göre oluşturmak.',
      'İlan ve profil eşleştirmelerini yapmak.',
      'Mesajlaşmayı ve bildirimleri çalıştırmak.',
      'Kötüye kullanım, spam ve sahte hesaplarla mücadele etmek.',
    ],
  },
  {
    heading: 'Verilerin paylaşımı',
    paragraphs: [
      'Kişisel verilerini reklam amacıyla üçüncü taraflara satmıyoruz. Verileri yalnızca hizmeti çalıştırmak için kullandığımız altyapı sağlayıcılarıyla (barındırma, veritabanı, ödeme, bildirim) ve yasal zorunluluk halinde yetkili mercilerle paylaşırız.',
      'Profilin, videoların ve yayınladığın ilanlar herkese açıktır; arama motorları tarafından listelenebilir. Mesajların ve sesli notların ise yalnızca sohbetin taraflarınca görülür.',
    ],
  },
  {
    heading: 'Saklama süresi',
    paragraphs: [
      'Hesabın açık olduğu sürece verilerini saklarız. Hesabını sildiğinde profilin, videoların ve ilanların kaldırılır; yasal saklama yükümlülüğü bulunan kayıtlar mevzuatın öngördüğü süre boyunca tutulur.',
    ],
  },
  {
    heading: 'Haklarınız (KVKK m. 11)',
    items: [
      'Kişisel verilerinin işlenip işlenmediğini öğrenme ve bunlara erişim talep etme.',
      'Eksik veya yanlış işlenmiş verilerin düzeltilmesini isteme.',
      'Silinmesini veya yok edilmesini talep etme.',
      'İşlemenin sınırlandırılmasını ve verilerinin taşınmasını isteme.',
    ],
  },
  {
    heading: 'Çerezler',
    paragraphs: [
      'Web sitesinde oturumunu açık tutmak için gerekli çerezleri kullanırız. Bunlar kapatıldığında giriş yapılamaz. Pazarlama amaçlı üçüncü taraf takip çerezi kullanmıyoruz.',
    ],
  },
  {
    heading: 'İletişim',
    paragraphs: [
      'Gizlilikle ilgili tüm talepler için destek@stagein.app adresine yazabilirsin. Başvurular en geç 30 gün içinde yanıtlanır.',
    ],
  },
]

export default function GizlilikPage() {
  return (
    <LegalDoc
      title="Gizlilik Politikası"
      updatedAt="1 Eylül 2026"
      intro="Bu politika, StageIn uygulaması ve web sitesi üzerinden topladığımız kişisel verileri, bunları neden işlediğimizi ve kullanıcı olarak sahip olduğun hakları açıklar."
      sections={SECTIONS}
    />
  )
}
