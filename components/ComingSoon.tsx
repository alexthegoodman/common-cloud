"use client";

import {
  Book,
  Video,
  Microphone,
  Sparkle,
  Headphones,
  MagicWand,
} from "@phosphor-icons/react";

const ComingSoonSection = ({ language = "en" }) => {
  let copy = null;

  switch (language) {
    case "en":
      copy = {
        title: "Coming Soon",
        badge: "Coming Soon",
        features: [
          {
            title: "Dynamic Filters & Color Grading",
            description:
              "Select from a list of dynamically generated video and image filters to set the tone for your video.",
          },
          {
            title: "Stylized Captions",
            description:
              "Extract and generate beautiful stylized captions which add impact and drive your narrative.",
          },
          {
            title: "Audio Import",
            description:
              "Import and integrate your existing audio files seamlessly into your projects.",
          },
          {
            title: "Voiceover Generation",
            description:
              "Generate professional voiceovers for your content with multiple voices.",
          },
        ],
      };
      break;

    case "hi":
      copy = {
        title: "जल्द आ रहा है",
        badge: "जल्द आ रहा है",
        features: [
          {
            title: "डायनामिक फिल्टर और कलर ग्रेडिंग",
            description:
              "अपने वीडियो का टोन सेट करने के लिए डायनामिकली जेनरेटेड वीडियो और इमेज फिल्टर्स की लिस्ट से चुनें।",
          },
          {
            title: "स्टाइलाइज्ड कैप्शन",
            description:
              "खूबसूरत स्टाइलाइज्ड कैप्शन एक्सट्रैक्ट और जेनरेट करें जो इम्पैक्ट जोड़ते हैं और आपकी कहानी को आगे बढ़ाते हैं।",
          },
          {
            title: "ऑडियो इम्पोर्ट",
            description:
              "अपनी मौजूदा ऑडियो फाइलों को अपने प्रोजेक्ट्स में सीमलेसली इम्पोर्ट और इंटीग्रेट करें।",
          },
          {
            title: "वॉयसओवर जेनरेशन",
            description:
              "अपने कंटेंट के लिए मल्टिपल वॉयसेस के साथ प्रोफेशनल वॉयसओवर जेनरेट करें।",
          },
        ],
      };
      break;

    default:
      break;
  }

  return (
    <section className="container mx-auto px-4 py-16">
      <h2 className="text-3xl font-bold text-white text-center mb-12">
        {copy?.title}
      </h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
        <div className="bg-slate-800/50 p-6 rounded-xl relative overflow-hidden">
          <div className="absolute top-2 right-2 bg-amber-500/20 text-amber-500 text-xs font-semibold px-2 py-1 rounded-full">
            {copy?.badge}
          </div>
          <div className="bg-amber-500/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
            <Book size={24} className="text-amber-500" />
          </div>
          <h3 className="text-xl font-semibold mb-2 text-white">
            {copy?.features[0].title.includes("&") ? (
              <>
                {copy?.features[0].title.split("&")[0].trim()} &<br />
                {copy?.features[0].title.split("&")[1].trim()}
              </>
            ) : copy?.features[0].title.includes("और") ? (
              <>
                {copy?.features[0].title.split("और")[0].trim()} और
                <br />
                {copy?.features[0].title.split("और")[1].trim()}
              </>
            ) : (
              copy?.features[0].title
            )}
          </h3>
          <p className="text-gray-400">{copy?.features[0].description}</p>
        </div>

        <div className="bg-slate-800/50 p-6 rounded-xl relative overflow-hidden">
          <div className="absolute top-2 right-2 bg-amber-500/20 text-amber-500 text-xs font-semibold px-2 py-1 rounded-full">
            {copy?.badge}
          </div>
          <div className="bg-amber-500/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
            <Sparkle size={24} className="text-amber-500" />
          </div>
          <h3 className="text-xl font-semibold mb-2 text-white">
            {copy?.features[1].title}
          </h3>
          <p className="text-gray-400">{copy?.features[1].description}</p>
        </div>

        <div className="bg-slate-800/50 p-6 rounded-xl relative overflow-hidden">
          <div className="absolute top-2 right-2 bg-amber-500/20 text-amber-500 text-xs font-semibold px-2 py-1 rounded-full">
            {copy?.badge}
          </div>
          <div className="bg-amber-500/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
            <Headphones size={24} className="text-amber-500" />
          </div>
          <h3 className="text-xl font-semibold mb-2 text-white">
            {copy?.features[2].title}
          </h3>
          <p className="text-gray-400">{copy?.features[2].description}</p>
        </div>

        <div className="bg-slate-800/50 p-6 rounded-xl relative overflow-hidden">
          <div className="absolute top-2 right-2 bg-amber-500/20 text-amber-500 text-xs font-semibold px-2 py-1 rounded-full">
            {copy?.badge}
          </div>
          <div className="bg-amber-500/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
            <Microphone size={24} className="text-amber-500" />
          </div>
          <h3 className="text-xl font-semibold mb-2 text-white">
            {copy?.features[3].title}
          </h3>
          <p className="text-gray-400">{copy?.features[3].description}</p>
        </div>
      </div>
    </section>
  );
};

export default ComingSoonSection;
