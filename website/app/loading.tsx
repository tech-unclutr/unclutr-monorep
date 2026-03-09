export default function Loading() {
  return (
    <div className="fixed inset-0 bg-[#FBF4EC] flex items-center justify-center z-[9999]">
      <div className="w-8 h-8 border-2 border-brand-orange/30 border-t-brand-orange rounded-full animate-spin" />
    </div>
  );
}
