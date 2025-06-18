import { formatMarkdown } from "@/components/formatMarkdown";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import Head from "next/head";

const faqs = [
  {
    question: "Question 1",
    answer: "Answer 1"
  },
  {
    question: "Question 2",
    answer: "Answer 2"
  },
  {
    question: "Question 3",
    answer: "Answer 3"
  }
];

export const FAQ = () => {
  const faqStructuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(item => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer.replace(/\*\*/g, "") // Remove markdown bold for plain text
      }
    }))
  };

  return (
    <>
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
        />
      </Head>
      <section id="faq" className="container py-16 sm:py-32">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          <span className="bg-gradient-to-b from-primary/60 to-primary text-transparent bg-clip-text">
            Frequently Asked Questions
          </span>
        </h2>

        <Accordion type="single" collapsible className="w-full AccordionRoot">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-left font-semibold">
                {faq.question}
              </AccordionTrigger>

              <AccordionContent className="text-base">
                {formatMarkdown(faq.answer)}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {process.env.NEXT_PUBLIC_MAIL_FROM && (
          <h3 className="font-medium mt-8">
            Still have questions?{" "}
            <a
              href={`mailto:${process.env.NEXT_PUBLIC_MAIL_FROM}`}
              className="text-primary transition-all border-primary hover:border-b-2"
            >
              Contact us
            </a>
            .
          </h3>
        )}
      </section>
    </>
  );
};
