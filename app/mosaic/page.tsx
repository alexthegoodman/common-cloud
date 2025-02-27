"use client";

export default function Page() {
  return (
    <div className="container max-w-xl mx-auto px-4 py-4">
      <div className="bg-gray-100 min-h-screen">
        <div className="container mx-auto px-4 py-4">
          {/* Header Section */}
          <header className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold">Mosaic</h1>
            <div className="flex items-center">
              <div className="relative mr-4">
                <input
                  type="text"
                  placeholder="Search Mosaic..."
                  className="px-4 py-1 rounded-md border border-gray-300"
                />
              </div>
              <div className="flex items-center">
                <span className="mr-2">alexthegoodman...</span>
                <div className="w-8 h-8 bg-gray-400 rounded-full"></div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main>
            {/* Featured Video Section */}
            <section className="mb-8">
              <div className="w-full aspect-video bg-gray-400 mb-4"></div>
              <h2 className="text-xl font-bold">Launch Promo Video</h2>
            </section>

            {/* Additional Video Section */}
            <section>
              <div className="w-96 aspect-video bg-gray-400 mb-4"></div>
              <h2 className="text-xl font-bold">Video for the Fun of It</h2>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
