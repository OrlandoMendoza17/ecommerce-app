import ReviewFormView from "@/components/pages/mis-opiniones/ReviewFormView/ReviewFormView";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ReviewEditPage({ params }: Props) {
  const { id } = await params;
  return <ReviewFormView id={id} />;
}
