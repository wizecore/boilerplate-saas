export const TrustedBy = () => {
  const partners = ["Acme", "Globex", "Initech", "Umbrella", "Hooli", "Stark"];

  return (
    <div className="bg-muted/30 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <p className="text-center text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-10">
          Trusted by teams at
        </p>

        <div className="grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-6 items-center">
          {partners.map((partner, index) => (
            <div
              key={partner}
              className="flex justify-center grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-300"
              style={{
                animationDelay: `${index * 100}ms`,
                animation: "fadeIn 0.6s ease-out forwards",
                opacity: 0
              }}
            >
              <div className="text-2xl font-bold text-foreground">{partner}</div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 0.4;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};
