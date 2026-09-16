import CustomerDetailView from "@/components/pages/admin/customers/CustomerDetailView/CustomerDetailView";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminCustomerDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <CustomerDetailView profileId={id} />;
}
