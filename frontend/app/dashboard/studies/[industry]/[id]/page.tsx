import { StudyDetailPage } from "@/components/dashboard/StudyDetailPage";

export default function StudyPage({ params }: { params: { industry: string; id: string } }) {
    return <StudyDetailPage studyId={params.id} />;
}
