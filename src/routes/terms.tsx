import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — Luzo AI" },
      { name: "description", content: "Terms of Service for Luzo AI — the rules and conditions for using our platform." },
      { property: "og:title", content: "Terms of Service — Luzo AI" },
      { property: "og:description", content: "Terms and conditions for using Luzo AI." },
    ],
  }),
  component: TermsOfService,
});

const LAST_UPDATED = "August 3, 2026";

const sections = [
  {
    id: "acceptance",
    title: "1. Acceptance of Terms",
    content: (
      <>
        <p>
          By accessing or using Luzo AI at{" "}
          <a
            href="https://luzoai.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            luzoai.com
          </a>{" "}
          (the "Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not
          agree to these Terms, please do not use the Service.
        </p>
        <p className="mt-3">
          These Terms apply to all visitors, users, and anyone who accesses or uses the Service.
          By creating an account or using any feature of Luzo AI, you confirm that you are at least
          18 years old and have the legal capacity to enter into these Terms.
        </p>
      </>
    ),
  },
  {
    id: "description",
    title: "2. Description of Service",
    content: (
      <>
        <p>
          Luzo AI is an AI-powered SaaS platform that helps creators, founders, and businesses
          generate social media content plans, post ideas, hooks, captions, video concepts, and
          execution strategies across multiple platforms.
        </p>
        <p className="mt-3">The Service includes:</p>
        <ul className="mt-3 space-y-2 list-none">
          {[
            "AI-generated weekly content plans tailored to your business",
            "Scene-by-scene and slide-by-slide execution plans for individual posts",
            "Platform-native content ideas for Instagram, TikTok, LinkedIn, X, and YouTube Shorts",
            "A history of all content plans you have generated",
            "A favorites system for saving your best ideas",
            "Subscription-based access to advanced features",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4">
          We reserve the right to modify, update, or discontinue any aspect of the Service at any
          time. We will endeavour to provide reasonable notice of significant changes.
        </p>
      </>
    ),
  },
  {
    id: "accounts",
    title: "3. User Accounts",
    content: (
      <>
        <p>
          To use Luzo AI, you must create an account. You may sign in using Google OAuth or email
          and password. By creating an account, you agree to the following:
        </p>
        <ul className="mt-3 space-y-2 list-none">
          {[
            "You will provide accurate, current, and complete information during registration and keep it up to date.",
            "You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account.",
            "You must notify us immediately at luzoaisupport@gmail.com if you suspect any unauthorised use of your account.",
            "You may not share your account with others or allow third parties to access the Service through your account.",
            "One account per person or business entity. Creating multiple accounts to circumvent plan limits is not permitted.",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4">
          We reserve the right to suspend or terminate accounts that violate these Terms.
        </p>
      </>
    ),
  },
  {
    id: "payments",
    title: "4. Subscriptions and Payments",
    content: (
      <>
        <p>Luzo AI offers the following subscription plans in addition to a free Starter tier:</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {[
            { name: "Pro", price: "$9 / month", desc: "Unlimited content plans, 15 execution plans/month, priority AI generation." },
            { name: "VIP", price: "$19 / month", desc: "Everything in Pro, unlimited execution plans, edit & regenerate, early feature access." },
          ].map((plan) => (
            <div key={plan.name} className="rounded-xl border border-border bg-card p-4 text-sm">
              <div className="flex items-baseline justify-between">
                <span className="font-semibold text-foreground">{plan.name}</span>
                <span className="text-primary font-medium">{plan.price}</span>
              </div>
              <p className="mt-1 text-muted-foreground">{plan.desc}</p>
            </div>
          ))}
        </div>
        <ul className="mt-4 space-y-2 list-none text-sm text-muted-foreground">
          {[
            "All payments are processed securely by Stripe. Luzo AI does not store your card details.",
            "Subscriptions automatically renew at the end of each billing period unless you cancel before the renewal date.",
            "You will be charged at the start of each billing cycle using the payment method on file.",
            "Prices are listed in USD and may be subject to applicable taxes depending on your location.",
            "We may update pricing with at least 30 days' notice. Continued use after a price change takes effect constitutes acceptance of the new price.",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </>
    ),
  },
  {
    id: "cancellation",
    title: "5. Cancellation and Refunds",
    content: (
      <>
        <p>
          You may cancel your subscription at any time. Cancellation stops future renewals; your
          access to paid features continues until the end of the current billing period, after which
          your account will downgrade to the free Starter plan.
        </p>
        <p className="mt-3">
          We do not offer refunds for partial billing periods or unused time on a subscription.
          Exceptions may be made at our discretion — if you believe you are entitled to a refund,
          please contact us at{" "}
          <a href="mailto:luzoaisupport@gmail.com" className="text-primary hover:underline">
            luzoaisupport@gmail.com
          </a>{" "}
          within 7 days of the charge.
        </p>
        <p className="mt-3">
          To cancel, manage your subscription through your account settings or contact our support
          team directly.
        </p>
      </>
    ),
  },
  {
    id: "acceptable-use",
    title: "6. Acceptable Use",
    content: (
      <>
        <p>You agree to use Luzo AI only for lawful purposes and in accordance with these Terms. You must not:</p>
        <ul className="mt-3 space-y-2 list-none">
          {[
            "Use the Service for any illegal activity or in violation of any applicable laws or regulations.",
            "Attempt to gain unauthorised access to any part of the Service, its servers, or connected systems.",
            "Reverse-engineer, decompile, or attempt to extract the source code of the Service.",
            "Use automated tools, bots, or scrapers to access or abuse the Service.",
            "Generate, distribute, or publish content that is defamatory, harassing, hateful, or infringes on any third party's rights.",
            "Misrepresent AI-generated content as original human-written work in contexts where disclosure is required.",
            "Interfere with the operation of the Service or the experience of other users.",
            "Circumvent usage limits or plan restrictions through technical or other means.",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4">
          Violation of this section may result in immediate suspension or termination of your
          account without notice or refund.
        </p>
      </>
    ),
  },
  {
    id: "ai-disclaimer",
    title: "7. AI-Generated Content Disclaimer",
    content: (
      <>
        <p>
          Luzo AI uses third-party AI services to generate content plans, hooks, captions, and
          strategies based on your inputs. By using these features, you acknowledge and agree to
          the following:
        </p>
        <ul className="mt-3 space-y-2 list-none">
          {[
            "AI-generated content is produced automatically and may not always be accurate, complete, appropriate, or suitable for your specific needs or audience.",
            "You are solely responsible for reviewing all AI-generated content before publishing or using it in any context.",
            "Luzo AI does not guarantee specific results, engagement metrics, follower growth, or business outcomes from using the Service.",
            "AI outputs should not be relied upon as professional advice — legal, financial, medical, or otherwise.",
            "Third-party AI providers powering Luzo AI have their own terms and policies that may apply to your data.",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </>
    ),
  },
  {
    id: "ip",
    title: "8. Intellectual Property",
    content: (
      <>
        <h3 className="mb-2 font-semibold text-foreground">Luzo AI Intellectual Property</h3>
        <p>
          The Luzo AI name, logo, website design, codebase, and all proprietary technology are
          owned by Luzo AI and protected by applicable intellectual property laws. You may not
          copy, reproduce, distribute, or create derivative works from any part of the Service
          without our explicit written permission.
        </p>
        <h3 className="mt-5 mb-2 font-semibold text-foreground">Your Content and Outputs</h3>
        <p>
          You retain ownership of the business profile information and inputs you provide to the
          Service. You also own the AI-generated content outputs produced for your account.
        </p>
        <p className="mt-3">
          By using the Service, you grant Luzo AI a limited, non-exclusive licence to process your
          inputs solely for the purpose of generating content on your behalf. We do not use your
          inputs to train AI models or share them with third parties beyond what is necessary to
          operate the Service.
        </p>
      </>
    ),
  },
  {
    id: "availability",
    title: "9. Service Availability",
    content: (
      <>
        <p>
          We aim to keep Luzo AI available and reliable, but we do not guarantee uninterrupted
          access. The Service may occasionally be unavailable due to:
        </p>
        <ul className="mt-3 space-y-2 list-none">
          {[
            "Scheduled maintenance or updates",
            "Unexpected technical issues or third-party service outages",
            "Circumstances beyond our reasonable control",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4">
          We reserve the right to modify, suspend, or discontinue any feature or the entire Service
          at any time. Where possible, we will provide advance notice of significant changes.
        </p>
      </>
    ),
  },
  {
    id: "liability",
    title: "10. Limitation of Liability",
    content: (
      <>
        <p>
          To the maximum extent permitted by applicable law, Luzo AI and its founders, employees,
          and affiliates shall not be liable for any indirect, incidental, special, consequential,
          or punitive damages — including loss of profits, data, goodwill, or business opportunities
          — arising from your use of, or inability to use, the Service.
        </p>
        <p className="mt-3">
          Our total liability to you for any claim arising out of or relating to these Terms or the
          Service shall not exceed the greater of (a) the amount you paid to Luzo AI in the 3 months
          preceding the claim, or (b) $10 USD.
        </p>
        <p className="mt-3">
          The Service is provided "as is" and "as available" without warranties of any kind, express
          or implied, including but not limited to warranties of merchantability, fitness for a
          particular purpose, or non-infringement.
        </p>
      </>
    ),
  },
  {
    id: "changes",
    title: "11. Changes to These Terms",
    content: (
      <>
        <p>
          We may update these Terms of Service from time to time. When we make material changes, we
          will update the "Last updated" date at the top of this page and notify registered users
          by email at least 14 days before the changes take effect.
        </p>
        <p className="mt-3">
          Your continued use of Luzo AI after updated Terms take effect constitutes your acceptance
          of the revised Terms. If you do not agree to the updated Terms, you must stop using the
          Service and may request account deletion as described in our Privacy Policy.
        </p>
      </>
    ),
  },
  {
    id: "contact",
    title: "12. Contact",
    content: (
      <>
        <p>
          If you have any questions about these Terms of Service, please contact us:
        </p>
        <div className="mt-4 rounded-xl border border-border bg-card p-5 space-y-1 text-sm">
          <p className="font-semibold text-foreground">Luzo AI</p>
          <p>
            Email:{" "}
            <a href="mailto:luzoaisupport@gmail.com" className="text-primary hover:underline">
              luzoaisupport@gmail.com
            </a>
          </p>
          <p>
            Website:{" "}
            <a
              href="https://luzoai.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              https://luzoai.com
            </a>
          </p>
        </div>
        <p className="mt-4">We aim to respond to all enquiries within 5 business days.</p>
      </>
    ),
  },
];

function TermsOfService() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SiteHeader />

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-16 sm:px-6 sm:py-24">
        {/* Header */}
        <div className="mb-12">
          <div className="text-xs uppercase tracking-[0.22em] text-primary">Legal</div>
          <h1 className="mt-3 font-display text-4xl font-semibold sm:text-5xl">
            Terms of Service
          </h1>
          <p className="mt-4 text-sm text-muted-foreground">
            Last updated: <span className="text-foreground">{LAST_UPDATED}</span>
          </p>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            Please read these Terms carefully before using Luzo AI. These Terms govern your access
            to and use of our website at{" "}
            <a
              href="https://luzoai.com"
              className="text-primary hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              luzoai.com
            </a>{" "}
            and our AI content planning application.
          </p>
        </div>

        {/* Table of contents */}
        <nav className="mb-12 rounded-2xl border border-border bg-card p-6">
          <p className="mb-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Contents
          </p>
          <ol className="space-y-2 text-sm">
            {sections.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {/* Sections */}
        <div className="space-y-12">
          {sections.map((s) => (
            <section key={s.id} id={s.id} className="scroll-mt-24">
              <h2 className="mb-4 font-display text-xl font-semibold text-foreground">
                {s.title}
              </h2>
              <div className="text-sm text-muted-foreground leading-relaxed space-y-0">
                {s.content}
              </div>
            </section>
          ))}
        </div>

        {/* Footer nav */}
        <div className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-8 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition-colors">
            ← Back to Luzo AI
          </Link>
          <div className="flex gap-4">
            <Link to="/privacy" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <a
              href="mailto:luzoaisupport@gmail.com"
              className="hover:text-foreground transition-colors"
            >
              Contact
            </a>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
