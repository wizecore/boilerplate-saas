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
      <section id="faq" className="relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
        </div>

        <div className="container py-16 sm:py-32">
          <div className="mx-auto max-w-4xl">
            {/* Header */}
            <div className="text-center mb-16">
              <div className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary ring-1 ring-inset ring-primary/20 mb-4">
                FAQ
              </div>
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Frequently Asked Questions
                </span>
              </h2>
              <p className="text-lg text-muted-foreground">
                Everything you need to know about our platform
              </p>
            </div>

            {/* FAQ Accordion */}
            <div className="bg-card/50 backdrop-blur-sm rounded-2xl p-6 md:p-8 ring-1 ring-border/50">
              <Accordion type="single" collapsible className="w-full AccordionRoot">
                {faqs.map((faq, index) => (
                  <AccordionItem
                    key={index}
                    value={`item-${index}`}
                    className="border-b border-border/50 last:border-0"
                  >
                    <AccordionTrigger className="text-left font-semibold text-lg hover:text-primary transition-colors py-6">
                      {faq.question}
                    </AccordionTrigger>

                    <AccordionContent className="text-base text-muted-foreground leading-7 pb-6">
                      {formatMarkdown(faq.answer)}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>

            {/* Contact CTA */}
            {process.env.NEXT_PUBLIC_MAIL_FROM && (
              <div className="mt-12 text-center p-8 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 ring-1 ring-primary/10">
                <h3 className="font-semibold text-xl mb-2">Still have questions?</h3>
                <p className="text-muted-foreground mb-4">
                  Can&apos;t find the answer you&apos;re looking for? Please reach out to our
                  team.
                </p>
                <a
                  href={`mailto:${process.env.NEXT_PUBLIC_MAIL_FROM}`}
                  className="inline-flex items-center gap-2 text-primary font-semibold hover:gap-3 transition-all"
                >
                  Contact us
                  <span aria-hidden="true">→</span>
                </a>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
};
