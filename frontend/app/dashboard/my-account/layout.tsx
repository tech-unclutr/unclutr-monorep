export default function MyAccountLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="p-8 max-w-7xl mx-auto">
            {children}
        </div>
    );
}
