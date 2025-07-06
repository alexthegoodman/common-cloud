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
            title: "Viral Text Animations",
            description:
              "Make your captions impossible to ignore with AI-powered keyframe generation. Perfect for hooks and viral moments.",
          },
          {
            title: "Product Drop Reveals",
            description:
              "Screen capture + auto-zoom creates perfect product showcases for brand partnerships and personal recommendations.",
          },
          {
            title: "Logo Stings & Branding",
            description:
              "Professional channel branding in seconds. Stand out from basic creators with Netflix-quality animations.",
          },
          {
            title: "Private & Personal Content",
            description:
              "Not just for going viral - perfect for family memories, personal stories, and private content that deserves professional quality.",
          },
          {
            title: "Trend-Ready Templates",
            description:
              "Jump on viral formats fast with smart motion paths that adapt to any content. No more manual keyframe placement.",
          },
          {
            title: "High-Quality Export",
            description:
              "Export HD videos optimized for TikTok, Reels, and YouTube Shorts. Professional results that get noticed.",
          },
        ],
      };
      break;

    case "hi":
      copy = {
        features: [
          {
            title: "वायरल टेक्स्ट एनिमेशन",
            description:
              "AI-पावर्ड कीफ्रेम जेनरेशन के साथ अपने कैप्शन को इग्नोर करना असंभव बनाएं। हुक्स और वायरल मोमेंट्स के लिए परफेक्ट।",
          },
          {
            title: "प्रोडक्ट ड्रॉप रिवील्स",
            description:
              "स्क्रीन कैप्चर + ऑटो-जूम ब्रांड पार्टनरशिप और पर्सनल रिकमेंडेशन के लिए परफेक्ट प्रोडक्ट शोकेस बनाता है।",
          },
          {
            title: "लोगो स्टिंग्स और ब्रांडिंग",
            description:
              "सेकंड में प्रोफेशनल चैनल ब्रांडिंग। Netflix-क्वालिटी एनिमेशन के साथ बेसिक क्रिएटर्स से अलग दिखें।",
          },
          {
            title: "प्राइवेट और पर्सनल कंटेंट",
            description:
              "सिर्फ वायरल होने के लिए नहीं - फैमिली मेमोरीज, पर्सनल स्टोरीज और प्राइवेट कंटेंट के लिए भी परफेक्ट जो प्रोफेशनल क्वालिटी डिजर्व करता है।",
          },
          {
            title: "ट्रेंड-रेडी टेम्प्लेट्स",
            description:
              "स्मार्ट मोशन पाथ्स के साथ वायरल फॉर्मेट्स पर तेजी से जंप करें जो किसी भी कंटेंट के साथ एडाप्ट होते हैं। अब कोई मैनुअल कीफ्रेम प्लेसमेंट नहीं।",
          },
          {
            title: "हाई-क्वालिटी एक्सपोर्ट",
            description:
              "TikTok, Reels और YouTube Shorts के लिए ऑप्टिमाइज्ड HD वीडियो एक्सपोर्ट करें। प्रोफेशनल रिजल्ट्स जो नोटिस किए जाते हैं।",
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
