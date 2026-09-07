import { MarketplaceDetailContent } from '@/components/marketplace/MarketplaceDetailContent';

export default async function MarketplaceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <MarketplaceDetailContent itemId={id} />;
}
