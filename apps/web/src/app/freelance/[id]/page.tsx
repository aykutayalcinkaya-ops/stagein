import { GigDetailContent } from '@/components/freelance/GigDetailContent';

export default async function GigDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <GigDetailContent gigId={id} />;
}
