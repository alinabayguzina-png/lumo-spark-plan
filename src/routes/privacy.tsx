import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Luzo AI" },
      { name: "description", content: "Privacy Policy for Luzo AI — how we collect, use, and protect your data." },
      { property: "og:title", content: "Privacy Policy — Luzo AI" },
      { property: "og:description", content: "How Luzo AI collects, uses, and protects your data." },
    ],
  }),
  component: PrivacyPolicy,
});

const LAST_UPDATED = "August 3, 2026";

const sections = [
  {
    id: "information-we-collect",
    title: "1. Information We Collect",
    content: (
      <>
        <p>We collect the following types of information when you use Luzo AI:</p>
        <h3 className="mt-4 mb-1 font-semibold text-foreground">Account Information</h3>
        <p>
          When you sign up or sign in via Google OAuth, we receive your name, email address, and
          Google profile picture. We store these in your user profile to identify your account and
          personalize your experience.
        </p>
        <h3 className="mt-4 mb-1 font-semibold text-foreground">Business Profile Data</h3>
        <p>
          When you create a business profile, we store the information you provide — such as your
          business name, industry, target audience, and content preferences — to generate relevant
          AI content plans.
        </p>
        <h3 className="mt-4 mb-1 font-semibold text-foreground">Content and Usage Data</h3>
        <p>
          We store the content plans, posts, and execution plans you generate through the app so you
          can access them across sessions. We may also collect basic usage data (such as features
          used and actions taken) to improve the product.
        </p>
        <h3 className="mt-4 mb-1 font-semibold text-foreground">Payment Information</h3>
        <p>
          If you subscribe to a paid plan, payment details (card number, billing address) are
          handled directly by Stripe and are never stored on our servers. We only store your
          subscription status and plan tier.
        </p>
      </>
    ),
  },
  {
    id: "how-we-use-information",
    title: "2. How We Use Your Information",
    content: (
      <>
        <p>We use the information we collect to:</p>
        <ul className="mt-3 space-y-2 list-none">
          {[
            "Create and manage your Luzo AI account",
            "Authenticate you securely via Google OAuth",
            "Generate AI-powered content plans tailored to your business",
            "Save and retrieve your content plans and history",
            "Process subscription payments and manage your plan",
            "Send transactional emails (e.g. account confirmation, billing receipts)",
            "Improve the quality and relevance of AI-generated content",
            "Respond to support requests and inquiries",
            "Comply with legal obligations",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4">
          We do not sell your personal data to third parties, and we do not use your data for
          advertising purposes.
        </p>
      </>
    ),
  },
  {
    id: "google-oauth",
    title: "3. Google OAuth Data",
    content: (
      <>
        <p>
          Luzo AI uses Google OAuth 2.0 to allow you to sign in with your Google account. When you
          authenticate with Google, we request access to the following scopes:
        </p>
        <ul className="mt-3 space-y-2 list-none">
          {[
            "Your name (to display in your profile)",
            "Your email address (to identify your account)",
            "Your profile picture (to personalize your account)",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4">
          We do not request access to your Google Drive, Gmail, contacts, calendar, or any other
          Google service beyond basic profile identification.
        </p>
        <p className="mt-3">
          The data obtained through Google OAuth is used solely to create and maintain your Luzo AI
          account. We do not share this data with third parties except as described in this policy
          (e.g. Supabase for secure storage).
        </p>
        <p className="mt-3">
          You can revoke Luzo AI's access to your Google account at any time by visiting{" "}
          <a
            href="https://myaccount.google.com/permissions"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Google Account Permissions
          </a>
          . Revoking access does not automatically delete your Luzo AI account or data — see
          Section 7 for account deletion.
        </p>
      </>
    ),
  },
  {
    id: "ai-content",
    title: "4. AI-Generated Content and Third-Party AI Services",
    content: (
      <>
        <p>
          Luzo AI uses third-party AI services (including Google Gemini) to generate content plans
          based on the inputs you provide. When you generate content, your business profile
          information and content preferences are sent to these AI services as prompts.
        </p>
        <p className="mt-3">
          Please be aware of the following:
        </p>
        <ul className="mt-3 space-y-2 list-none">
          {[
            "Do not include sensitive personal information (such as passwords, financial details, or private personal data) in your business profile or content generation inputs.",
            "AI-generated content is produced automatically and may not always be accurate, complete, or suitable for your specific needs. You are responsible for reviewing and approving all content before publishing.",
            "Third-party AI providers may have their own data retention and usage policies.",
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
    id: "payments",
    title: "5. Payments and Stripe",
    content: (
      <>
        <p>
          Paid subscriptions (Pro and VIP plans) are processed by{" "}
          <a
            href="https://stripe.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Stripe
          </a>
          , a PCI-DSS compliant payment processor. Luzo AI never receives, stores, or has access to
          your full card number, CVV, or other sensitive payment details.
        </p>
        <p className="mt-3">When you subscribe, we store the following in our database:</p>
        <ul className="mt-3 space-y-2 list-none">
          {[
            "Your subscription plan (free, pro, or vip)",
            "Your subscription status (active, cancelled, etc.)",
            "Your current billing period end date",
            "A Stripe customer ID (an opaque reference used to manage your subscription)",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4">
          For questions about billing or to request a refund, contact us at{" "}
          <a href="mailto:luzoaisupport@gmail.com" className="text-primary hover:underline">
            luzoaisupport@gmail.com
          </a>
          . Stripe's privacy policy is available at{" "}
          <a
            href="https://stripe.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            stripe.com/privacy
          </a>
          .
        </p>
      </>
    ),
  },
  {
    id: "data-storage",
    title: "6. Data Storage and Security",
    content: (
      <>
        <p>
          Your data is stored securely using{" "}
          <a
            href="https://supabase.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Supabase
          </a>
          , which provides a PostgreSQL database with row-level security (RLS). This means your data
          is isolated — each user can only access their own account data.
        </p>
        <p className="mt-3">Our security measures include:</p>
        <ul className="mt-3 space-y-2 list-none">
          {[
            "All data is transmitted over HTTPS (TLS encryption in transit)",
            "Authentication is handled via Supabase Auth with Google OAuth — we never store passwords",
            "Row-level security policies in the database enforce per-user data isolation",
            "API keys and secrets are stored as environment variables, never in source code",
            "Payment data is handled exclusively by Stripe (PCI-DSS Level 1 certified)",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4">
          While we take reasonable steps to protect your data, no system is completely secure. If
          you believe your account has been compromised, contact us immediately at{" "}
          <a href="mailto:luzoaisupport@gmail.com" className="text-primary hover:underline">
            luzoaisupport@gmail.com
          </a>
          .
        </p>
      </>
    ),
  },
  {
    id: "user-rights",
    title: "7. Your Rights and Account Deletion",
    content: (
      <>
        <p>You have the following rights regarding your data:</p>
        <ul className="mt-3 space-y-2 list-none">
          {[
            "Access — you can view the data associated with your account at any time within the app.",
            "Correction — you can update your business profile and account information at any time.",
            "Deletion — you can request deletion of your account and all associated data.",
            "Data portability — you can request a copy of your data by contacting us.",
            "Opt-out — you can cancel your subscription at any time; your plan downgrades at the end of the billing period.",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <h3 className="mt-5 mb-2 font-semibold text-foreground">How to Delete Your Account</h3>
        <p>
          To request deletion of your account and all associated data, email us at{" "}
          <a href="mailto:luzoaisupport@gmail.com" className="text-primary hover:underline">
            luzoaisupport@gmail.com
          </a>{" "}
          with the subject line <strong>"Account Deletion Request"</strong> and include the email
          address associated with your account. We will process your request within 30 days.
        </p>
        <p className="mt-3">
          Deleting your account will permanently remove your profile, business data, content plans,
          favorites, and subscription record. This action cannot be undone. If you have an active
          paid subscription, we recommend cancelling it first to avoid further charges.
        </p>
      </>
    ),
  },
  {
    id: "cookies",
    title: "8. Cookies and Analytics",
    content: (
      <>
        <p>
          Luzo AI uses cookies and browser local storage to maintain your session and keep you
          signed in between visits. These are strictly necessary for the app to function and cannot
          be disabled without signing out.
        </p>
        <p className="mt-3">
          We do not currently use third-party analytics services (such as Google Analytics) or
          tracking cookies for advertising. If this changes in the future, this policy will be
          updated and you will be notified.
        </p>
      </>
    ),
  },
  {
    id: "changes",
    title: "9. Changes to This Policy",
    content: (
      <>
        <p>
          We may update this Privacy Policy from time to time as our product and legal requirements
          evolve. When we make material changes, we will:
        </p>
        <ul className="mt-3 space-y-2 list-none">
          {[
            "Update the \"Last updated\" date at the top of this page",
            "Notify registered users via email at least 14 days before significant changes take effect",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4">
          Your continued use of Luzo AI after a policy update constitutes acceptance of the revised
          terms. We encourage you to review this page periodically.
        </p>
      </>
    ),
  },
  {
    id: "contact",
    title: "10. Contact Information",
    content: (
      <>
        <p>
          If you have any questions, concerns, or requests related to this Privacy Policy or your
          personal data, please contact us:
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
        <p className="mt-4">
          We aim to respond to all privacy-related inquiries within 5 business days.
        </p>
      </>
    ),
  },
];

function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <SiteHeader />

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-16 sm:px-6 sm:py-24">
        {/* Header */}
        <div className="mb-12">
          <div className="text-xs uppercase tracking-[0.22em] text-primary">Legal</div>
          <h1 className="mt-3 font-display text-4xl font-semibold sm:text-5xl">Privacy Policy</h1>
          <p className="mt-4 text-sm text-muted-foreground">
            Last updated: <span className="text-foreground">{LAST_UPDATED}</span>
          </p>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            This Privacy Policy explains how Luzo AI ("we", "us", or "our") collects, uses, and
            protects your personal information when you use our website at{" "}
            <a
              href="https://luzoai.com"
              className="text-primary hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              luzoai.com
            </a>{" "}
            and our AI content planning application. By using Luzo AI, you agree to the practices
            described in this policy.
          </p>
        </div>

        {/* Table of contents */}
        <nav className="mb-12 rounded-2xl border border-border bg-card p-6">
          <p className="mb-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">Contents</p>
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
            <Link to="/pricing" className="hover:text-foreground transition-colors">
              Pricing
            </Link>
            <a href="mailto:luzoaisupport@gmail.com" className="hover:text-foreground transition-colors">
              Contact
            </a>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
