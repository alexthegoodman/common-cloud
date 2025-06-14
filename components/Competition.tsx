"use client";

import { Check } from "@phosphor-icons/react";

const Competition = ({ language = "en" }) => {
  let copy = null;

  switch (language) {
    case "en":
      copy = {
        title: "The Competition",
        subtitle: "What makes Stunts special?",
        description:
          "Stunts is for everybody, bringing a fresh perspective on expressiveness and ease-of-use. Yet it has powerful features that make it a strong choice for professionals and amateurs alike.",
        features: [
          "Generate draft animations with our in-house AI",
          "Refine animations with a tap-and-drag experience",
          "Add polygons, images, text, and video",
          "Available for Web",
        ],
      };
      break;

    case "hi":
      copy = {
        title: "प्रतिस्पर्धा",
        subtitle: "Stunts को क्या खास बनाता है?",
        description:
          "Stunts सभी के लिए है, एक्सप्रेसिवनेस और इज-ऑफ-यूज पर एक नया नजरिया लाता है। फिर भी इसमें पावरफुल फीचर्स हैं जो इसे प्रोफेशनल्स और एमेच्योर दोनों के लिए एक मजबूत विकल्प बनाते हैं।",
        features: [
          "हमारे इन-हाउस AI के साथ ड्राफ्ट एनिमेशन जेनरेट करें",
          "टैप-एंड-ड्रैग एक्सपीरियंस के साथ एनिमेशन को रिफाइन करें",
          "पॉलीगॉन, इमेज, टेक्स्ट और वीडियो जोड़ें",
          "वेब के लिए उपलब्ध",
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
      <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8">
        <div className="flex flex-col justify-center bg-slate-800/50 p-12 rounded-xl relative overflow-hidden">
          <h3 className="text-xl font-semibold mb-2 text-white">
            {copy?.subtitle}
          </h3>
          <p className="text-gray-400">{copy?.description}</p>
          <ul className="flex flex-col gap-2 mt-4 text-white">
            {copy?.features.map((feature, index) => (
              <li key={index} className="flex flex-row gap-2 items-center">
                <Check />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="">
          <img src="/stunts_competition.png" className="mx-auto rounded-xl" />
        </div>
      </div>
    </section>
  );
};

export default Competition;
