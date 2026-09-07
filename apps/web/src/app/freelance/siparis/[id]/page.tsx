import { OrderWorkspaceContent } from '@/components/freelance/OrderWorkspaceContent';

export default async function OrderWorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <OrderWorkspaceContent orderId={id} />;
}
