export interface DocState {
  // contentFormatting: any;
  // markdownContent: string;
  sequences: PageSequence[];
}

export interface PageSequence {}

export const testMarkdown = `
Zero-Shot Generation vs HITL
Comparison
In recent years, zero-shot generation has taken the world by storm. The ability to generate a complete asset, whether that be a document, image, or 3D model by using a single prompt has amazed people across the globe and opened the door to endless new generations of products.
Many machine learning models and products have been released during this short period and the rate of growth is not slowing down. In fact, research continues to expand while new commercial enterprises are formed daily.
Zero-shot generation has been quite successful in making incredible progress on several key metrics, including efficiency, ease-of-use, and affordability. In combination, these advantages position zero-shot generation as a highly appealing option for all kinds of people.
Nonetheless, the evolution carries on, and many have encountered the limitations of zero-shot generation. Despite its inevitable role in future products, zero-shot generation has several inherent problems to be solved. The central problem is all about control, with accuracy, embodying the vision, and even privacy being important concerns as well.
This book focuses on addressing these problems directly through what is called “human-in-the-loop” (HITL) workflows. While HITL has only found a place in a few products thus far, many insiders would agree that it is the next wave of artificial intelligence.
HITL workflows are so powerful and compelling because they give humans varying degrees of control over the output. With the right abstractions, users can be as refined or as generalized as they need for a given task.

Target Segments
It’s worth exploring how zero-shot generation and HITL differ in the marketplace. It’s quickly intuitive that both methods will have a place in the future. While the jury may still be out on all of the potential uses for either approach, there are some clear signals for startups and researchers to consider.
Naturally, professionals are generally going to want more control and accuracy in their work. It’s not as common that a professional can accept a result that is essentially random. While there is definitely room for overlap, it is self-evident that professionals will prefer HITL workflows generally.
On the other hand, beginners in a given field are going to be much less interested in creating the details themselves. They usually want a close-enough result that they can use quickly. It can even be fun to enter a single prompt and get a complete output.
The good news for startups and entrepreneurs is simple: artificial intelligence will find a place in every industry and every category of the market. While it may sometimes be helpful to differentiate between the beginner-friendly and professional approaches, there is no lack of opportunity across verticals.
Local vs Cloud
There is another, perhaps unexpected, factor when examining zero-shot generation and HITL. This is the dichotomy of local machine learning vs cloud machine learning. As businesses, it can be tempting to jump to profitable conclusions, but it’s often better to adapt to the future than it is to try and profit immediately. Consider the following details.
Zero-shot generation generally requires massive machine learning models to create an output, alongside heavy-duty graphics hardware. The inference times are slow, and oftentimes the results are still not very great.
HITL models rarely carry these same issues. This is because HITL models are generally more targeted and narrow than the general-purpose models. This means that it can be run on a user’s local hardware, rapidly, and on modest hardware - even CPU.
These advantages for HITL lead to other marketable features which will increase sales and reinforce your customer-oriented brand. The most commonly mentioned in privacy. Privacy is inherent in models that run on local hardware as the data is not sent across the network and through some opaque pipeline. Another very important aspect is the unlimited usage capability in local HITL models. There are no limits and no extra costs associated.
As a startup or entrepreneur, you might wonder how you can make money with this approach. It’s actually not complicated. Users are happy to pay for substantive features such as real-time collaboration or cloud storage. As your product catches on, new opportunities will come for partnerships and large enterprise sales.

Common Aspects to HITL
Granularity
Nearly all human-in-the-loop workflows compete at some particular level of granularity. That’s a large part of the point of HITL in the first place. These users are not interested in generalized results that sacrifice creative vision. They want to be specific and detailed.
Granularity can take many shapes and forms depending on the task at hand. Consider two HITL workflows. The first involves highlighting a portion of an image and entering a prompt to alter, add, or replace that portion of the image. This would be a higher-level granularity, but still offers much more control as compared to a zero-shot approach. Now consider a deeper method, such as “prompt brush”. This user experience would center around entering a guiding prompt, while also determining the strokes or shape of the output through drawing or painting. It offers an exciting and even frightening level of control because not everybody is comfortable drawing directly to the screen. Yet it can attract professionals and lead to new innovations.
Optionality
Another aspect that many AI and HITL workflows share is the concept of optionality. That is, to provide the user with a set of options to choose from. However, HITL can take advantage of this much more easily given its ability to run on local or lightweight hardware. Businesses and startups can generate many potential outputs within a second or two, greatly improving the user experience.
Optionality plays a very helpful role alongside the ability to be granular, as it provides the creator or worker with an intuitive way to fine-tune the results. Many popular services have been integrating more and more optionality into their products, but only few have caught on to the reality of human-in-the-loop workflows when it comes to the future human tool-use.
Conversational
There are other important factors which are common among HITL implementations. This includes the conversational aspect. While it might initially seem rather normal and commonplace to talk to a chatbot nowadays, it’s important to realize that this is actually the most popular HITL experience in the marketplace.
Conversational experiences require constant guidance by the human on the receiving end, and it’s this back-and-forth approach which produces the highest quality results. Taking this into account, one can imagine many other conversational approaches which involve giving and receiving from the AI in sequence. It can also be combined with granularity or optionality to create something even richer.
Curiosity
Another less common aspect to HITL workflows is simple: curiosity. Many possibilities can come from developing an AI experience that is curious. This could be as simple as incorporating questions into a small or large language model. When the model asks questions, it aids the user as well as the organic development of the work at hand.
It might take other forms as well. Perhaps you want the user to answer dynamic questions to achieve a certain result. Another potential implementation would include a partner-like model which gently interrupts the user from time-to-time with suggestions.
Again, it is often helpful to combine any of these various common aspects when designing a human-in-the-loop experience. As the field continues to evolve, new aspects will emerge.
`;
