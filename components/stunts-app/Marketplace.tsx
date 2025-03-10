import React, { useState, useEffect } from "react";
import {
  MagnifyingGlass,
  Star,
  Download,
  Tag,
  Cloud,
} from "@phosphor-icons/react";
import { CreateIcon } from "./icon";

// App interface
interface App {
  id: number;
  name: string;
  description: string;
  developer: string;
  category: string;
  rating: number;
  downloads: number;
  price: number | "Free";
  image: string;
  tags: string[];
}

const AppMarketplace = () => {
  // Sample data
  const sampleApps: App[] = [
    {
      id: 0,
      name: "Stunts / Videos",
      description:
        "Generate exciting, animated videos with beautiful zooms using your own content",
      developer: "Common",
      category: "Marketing",
      rating: 4.8,
      downloads: 15000,
      price: 6.99,
      image: "file-cloud",
      tags: ["video"],
    },
    {
      id: 1,
      name: "Balance / Documents",
      description:
        "Generate beautiful, visual documents from brochures to magazine-style PDFs",
      developer: "Common",
      category: "Marketing",
      rating: 4.8,
      downloads: 15000,
      price: 6.99,
      image: "file-cloud",
      tags: ["docs"],
    },
    {
      id: 2,
      name: "Shine / Presentations",
      description:
        "Generate professional, engaging presentations with your own content",
      developer: "Common",
      category: "Marketing",
      rating: 4.5,
      downloads: 20000,
      price: 6.99,
      image: "presentation",
      tags: ["sales"],
    },
    {
      id: 3,
      name: "Promos / Ads",
      description:
        "Generate bespoke ads with multiple content and size variations",
      developer: "Common",
      category: "Marketing",
      rating: 4.7,
      downloads: 12000,
      price: 6.99,
      image: "squares",
      tags: ["ads"],
    },
    {
      id: 4,
      name: "Audia / DAW",
      description: "Generate beats, melodies, and synths with your own samples",
      developer: "Common",
      category: "Audio",
      rating: 4.7,
      downloads: 12000,
      price: 6.99,
      image: "squares",
      tags: ["music"],
    },
  ];

  const categories = ["All", "Marketing", "Audio"];

  const [apps, setApps] = useState<App[]>(sampleApps);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [filteredApps, setFilteredApps] = useState<App[]>(sampleApps);

  // Filter apps when search term or category changes
  useEffect(() => {
    let results = apps;

    if (searchTerm) {
      results = results.filter(
        (app) =>
          app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          app.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          app.tags.some((tag) =>
            tag.toLowerCase().includes(searchTerm.toLowerCase())
          )
      );
    }

    if (selectedCategory !== "All") {
      results = results.filter((app) => app.category === selectedCategory);
    }

    setFilteredApps(results);
  }, [searchTerm, selectedCategory, apps]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">App Marketplace</h1>
          <div className="bg-indigo-500/25 p-4 rounded">
            <p>Looking to expand your userbase?</p>
            <p>
              Submit your app to our marketplace to take advantage of our
              marketing and share in our success!
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <button className="px-4 py-2 text-white rounded-md stunts-gradient transition">
              Submit App
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row justify-between gap-4 mb-8">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlass className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search apps..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {categories.map((category) => (
              <button
                key={category}
                className={`px-4 py-2 rounded-md whitespace-nowrap ${
                  selectedCategory === category
                    ? "bg-blue-500 text-white"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                }`}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Apps Grid */}
        {filteredApps.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">
              No apps found. Try changing your search criteria.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredApps.map((app) => (
              <div
                key={app.id}
                className="bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition"
              >
                <div className="p-4 flex">
                  {/* <img
                    src={app.image}
                    alt={app.name}
                    className="w-20 h-20 rounded-lg mr-4 object-cover"
                  /> */}
                  <div className="mr-4">
                    <CreateIcon icon={app.image} size="36px" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-800">
                      {app.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Made by {app.developer}
                    </p>
                    {/* <div className="flex items-center mt-1">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="text-sm text-gray-700 ml-1">
                        {app.rating}
                      </span>
                      <span className="mx-2 text-gray-300">•</span>
                      <span className="text-sm text-gray-500">
                        {app.downloads.toLocaleString()} downloads
                      </span>
                    </div> */}
                  </div>
                </div>
                <div className="px-4 pb-3">
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {app.description}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {app.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full flex items-center"
                      >
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-t border-gray-100">
                  <span className="font-medium text-sm">
                    {/* {app.price === "Free"
                      ? "Free"
                      : `Free Tier, $${app.price}/mo Premium Tier`} */}
                    Try with the Free Tier
                  </span>
                  <button className="flex items-center px-3 py-1 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 transition">
                    <Cloud className="h-4 w-4 mr-1" />
                    Add App
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default AppMarketplace;
