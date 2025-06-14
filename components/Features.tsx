"use client";

import {
  Play,
  ShieldChevron,
  MagicWand,
  Lightning,
  Clock,
  Video,
  Shapes,
  TextAUnderline,
  Layout,
} from "@phosphor-icons/react";

export default function Features({ language = "en", grid = 3, py = 16 }) {
  let copy = null;
  switch (language) {
    case "en":
      copy = {
        features: [
          {
            title: "Smart Path Generation",
            description:
              "Automatically generate logical motion paths with our intelligent keyframe system. No more template-look!",
          },
          {
            title: "Screen Capture & Smooth Zooms",
            description:
              "Record your screen to enable dynamic product showcases with beautiful zooms!",
          },
          {
            title: "Create with Text, Images, and Shapes",
            description:
              "Build stunning compositions using our comprehensive toolkit of text editing, image manipulation, and vector shape tools.",
          },
          {
            title: "Over 35 Fonts Included",
            description:
              "Express your creativity with our extensive collection of carefully curated professional fonts, ready to use in your projects.",
          },
          {
            title: "Your Content",
            description:
              "Import your own media and transform it with our powerful animation tools.",
          },
          {
            title: "Video Import",
            description:
              "Import your existing video content with desktop-class performance on the web",
          },
        ],
      };
      break;

    case "hi":
      copy = {
        features: [
          {
            title: "स्मार्ट पाथ जेनरेशन",
            description:
              "हमारे इंटेलिजेंट कीफ्रेम सिस्टम के साथ ऑटोमेटिकली लॉजिकल मोशन पाथ जेनरेट करें। अब कोई टेम्प्लेट लुक नहीं!",
          },
          {
            title: "स्क्रीन कैप्चर और स्मूथ जूम",
            description:
              "खूबसूरत जूम के साथ डायनामिक प्रोडक्ट शोकेस को इनेबल करने के लिए अपनी स्क्रीन रिकॉर्ड करें!",
          },
          {
            title: "टेक्स्ट, इमेज और शेप्स के साथ बनाएं",
            description:
              "टेक्स्ट एडिटिंग, इमेज मैनिपुलेशन, और वेक्टर शेप टूल्स के हमारे कॉम्प्रिहेंसिव टूलकिट का उपयोग करके शानदार कॉम्पोजिशन बनाएं।",
          },
          {
            title: "35+ फॉन्ट्स शामिल",
            description:
              "सावधानी से चुने गए प्रोफेशनल फॉन्ट्स के हमारे व्यापक कलेक्शन के साथ अपनी क्रिएटिविटी को एक्सप्रेस करें, जो आपके प्रोजेक्ट्स में उपयोग के लिए तैयार हैं।",
          },
          {
            title: "आपका कंटेंट",
            description:
              "अपनी खुद की मीडिया इम्पोर्ट करें और हमारे पावरफुल एनिमेशन टूल्स के साथ इसे ट्रांसफॉर्म करें।",
          },
          {
            title: "वीडियो इम्पोर्ट",
            description:
              "वेब पर डेस्कटॉप-क्लास परफॉर्मेंस के साथ अपना मौजूदा वीडियो कंटेंट इम्पोर्ट करें",
          },
        ],
      };

      break;

    default:
      break;
  }

  return (
    <section className={`container mx-auto px-4 py-${py}`}>
      <div className={`grid md:grid-cols-${grid} gap-8`}>
        <div className="bg-slate-800 p-6 rounded-xl">
          <div className="bg-red-500/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
            <MagicWand size={24} className="text-red-500" />
          </div>
          <h3 className="text-xl font-semibold mb-2 text-white">
            {copy?.features[0].title}
          </h3>
          <p className="text-gray-400">{copy?.features[0].description}</p>
        </div>

        <div className="bg-slate-800 p-6 rounded-xl">
          <div className="bg-red-500/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
            <Lightning size={24} className="text-red-500" />
          </div>
          <h3 className="text-xl font-semibold mb-2 text-white">
            {copy?.features[1].title}
          </h3>
          <p className="text-gray-400">{copy?.features[1].description}</p>
        </div>

        <div className="bg-slate-800 p-6 rounded-xl">
          <div className="bg-red-500/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
            <Shapes size={24} className="text-red-500" />
          </div>
          <h3 className="text-xl font-semibold mb-2 text-white">
            {copy?.features[2].title}
          </h3>
          <p className="text-gray-400">{copy?.features[2].description}</p>
        </div>

        <div className="bg-slate-800 p-6 rounded-xl">
          <div className="bg-red-500/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
            <TextAUnderline size={24} className="text-red-500" />
          </div>
          <h3 className="text-xl font-semibold mb-2 text-white">
            {copy?.features[3].title}
          </h3>
          <p className="text-gray-400">{copy?.features[3].description}</p>
        </div>

        <div className="bg-slate-800 p-6 rounded-xl">
          <div className="bg-red-500/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
            <Video size={24} className="text-red-500" />
          </div>
          <h3 className="text-xl font-semibold mb-2 text-white">
            {copy?.features[4].title}
          </h3>
          <p className="text-gray-400">{copy?.features[4].description}</p>
        </div>

        <div className="bg-slate-800 p-6 rounded-xl">
          <div className="bg-red-500/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
            <Layout size={24} className="text-red-500" />
          </div>
          <h3 className="text-xl font-semibold mb-2 text-white">
            {copy?.features[5].title}
          </h3>
          <p className="text-gray-400">{copy?.features[5].description}</p>
        </div>
      </div>
    </section>
  );
}
