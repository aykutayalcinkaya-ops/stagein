import type { Metadata } from 'next'
import { LegalDoc, type LegalSection } from '@/components/LegalDoc'

export const metadata: Metadata = {
  title: 'Kullanım Koşulları',
  description: 'StageIn platformunu kullanırken geçerli olan kurallar, içerik kuralları ve sorumluluklar.',
  alternates: { canonical: '/kullanim-kosullari' },
}

const SECTIONS: LegalSection[] = [
  {
    heading: 'Hesap',
    items: [
      'Hesap açmak için 16 yaşını doldurmuş olman gerekir.',
      'Verdiğin bilgilerin doğru olmasından ve hesabının güvenliğinden sen sorumlusun.',
      'Bir kişi birden fazla sahte profil oluşturamaz.',
    ],
  },
  {
    heading: 'İçerik ve haklar',
    paragraphs: [
      'Yüklediğin videoların ve diğer içeriklerin hakları sende kalır. Bu içerikleri platformda göstermemiz, önbelleğe almamız ve dönüştürmemiz (örneğin video sıkıştırma) için bize sınırlı bir kullanım izni vermiş olursun.',
      'Yalnızca hakkına sahip olduğun veya izin aldığın içerikleri yükleyebilirsin. Telif ihlali bildirimleri destek@stagein.app adresine yapılır ve haklı bulunan içerik kaldırılır.',
    ],
  },
  {
    heading: 'Yasak kullanımlar',
    items: [
      'Taciz, nefret söylemi, tehdit ve hedef gösterme.',
      'Cinsel içerik, şiddet içeren görüntüler ve yasa dışı içerik.',
      'Spam, toplu mesaj, sahte ilan ve dolandırıcılık girişimleri.',
      'Platformu otomatik araçlarla kazımak veya servise aşırı yük bindirmek.',
    ],
  },
  {
    heading: 'İlanlar ve anlaşmalar',
    paragraphs: [
      'İlanlar kullanıcılar tarafından oluşturulur. StageIn ilanların doğruluğunu garanti etmez ve kullanıcılar arasında yapılan anlaşmaların tarafı değildir. Ödeme, ücret ve çalışma koşulları tarafların sorumluluğundadır.',
    ],
  },
  {
    heading: 'Ücretli hizmetler',
    paragraphs: [
      'Müzisyen hesapları ücretsizdir. Stüdyo rezervasyonu ve ders hizmetlerinde platform komisyonu uygulanır; bu hizmetler kullanıma açıldığında ücret bilgisi işlem öncesinde gösterilir.',
    ],
  },
  {
    heading: 'Hesabın askıya alınması',
    paragraphs: [
      'Bu koşulların ihlali halinde içerik kaldırılabilir, hesap geçici olarak askıya alınabilir veya kapatılabilir. Ağır ihlaller dışında kararı sana gerekçesiyle bildiririz ve itiraz hakkın vardır.',
    ],
  },
  {
    heading: 'Sorumluluğun sınırı ve uygulanacak hukuk',
    paragraphs: [
      'Hizmet "olduğu gibi" sunulur; kesintisiz veya hatasız çalışacağı garanti edilmez. Bu koşullara Türkiye Cumhuriyeti hukuku uygulanır ve uyuşmazlıklarda İstanbul mahkemeleri ile icra daireleri yetkilidir.',
    ],
  },
]

export default function KullanimKosullariPage() {
  return (
    <LegalDoc
      title="Kullanım Koşulları"
      updatedAt="1 Eylül 2026"
      intro="StageIn hesabı açarak veya platformu kullanarak aşağıdaki koşulları kabul etmiş olursun. Koşullar değiştiğinde uygulama içinde bilgilendirme yaparız."
      sections={SECTIONS}
    />
  )
}
