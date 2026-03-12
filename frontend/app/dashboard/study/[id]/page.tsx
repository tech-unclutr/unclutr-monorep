import { StudyDetailPage } from "@/components/dashboard/StudyDetailPage";

export default function StudyPage({ params }: { params: { id: string } }) {
    return <StudyDetailPage studyId={params.id} />;
}
