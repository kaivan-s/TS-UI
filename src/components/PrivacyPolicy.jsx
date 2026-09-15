import { Box, Typography } from "@mui/material";
import { C } from "../theme.js";

function Section({ title, children }) {
  return (
    <Box sx={{ mb: 4 }}>
      <Typography sx={{ fontSize: 18, fontWeight: 600, color: C.text, mb: 1.5 }}>
        {title}
      </Typography>
      {children}
    </Box>
  );
}

function Para({ children }) {
  return (
    <Typography sx={{ fontSize: 14, color: "rgba(238,234,227,0.75)", lineHeight: 1.8, mb: 1.5 }}>
      {children}
    </Typography>
  );
}

function List({ items }) {
  return (
    <Box component="ul" sx={{ pl: 3, my: 1.5 }}>
      {items.map((item, i) => (
        <Box component="li" key={i} sx={{ mb: 1 }}>
          <Typography sx={{ fontSize: 14, color: "rgba(238,234,227,0.75)", lineHeight: 1.7 }}>
            {item}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

export default function PrivacyPolicy() {
  return (
    <Box sx={{ maxWidth: 720, mx: "auto", pb: 8 }}>
      <Typography
        sx={{
          fontSize: { xs: 28, sm: 36 },
          fontWeight: 700,
          color: C.text,
          letterSpacing: "-0.03em",
          mb: 1,
        }}
      >
        Privacy Policy
      </Typography>
      <Typography sx={{ fontSize: 14, color: "rgba(238,234,227,0.5)", mb: 5 }}>
        Last updated: September 2026
      </Typography>

      <Section title="Overview">
        <Para>
          Morrow Desk ("we", "our", or "us") is a stock screening tool that helps users identify
          potential trading setups based on technical criteria. This Privacy Policy explains how
          we collect, use, and protect your information when you use our service.
        </Para>
      </Section>

      <Section title="Information We Collect">
        <Para>We collect the following types of information:</Para>
        <List items={[
          "Account Information: Email address and name when you sign up via Google authentication.",
          "Subscription Data: Payment status and subscription plan (processed securely by our payment partner).",
          "Usage Data: Pages visited, features used, and interaction patterns to improve the service.",
          "Technical Data: Browser type, device information, and IP address for security and analytics.",
        ]} />
      </Section>

      <Section title="How We Use Your Information">
        <Para>We use your information to:</Para>
        <List items={[
          "Provide and maintain the screening service.",
          "Process your subscription and manage your account.",
          "Send important service updates and notifications.",
          "Improve the product based on usage patterns.",
          "Prevent fraud and ensure security.",
        ]} />
      </Section>

      <Section title="Data Storage & Security">
        <Para>
          Your data is stored securely using Supabase, which provides enterprise-grade security
          including encryption at rest and in transit. We do not store payment card details —
          all payment processing is handled by our payment partner (Dodo Payments).
        </Para>
      </Section>

      <Section title="Third-Party Services">
        <Para>We use the following third-party services:</Para>
        <List items={[
          "Supabase: Authentication and database services.",
          "Google: Sign-in authentication.",
          "Dodo Payments: Subscription payment processing.",
        ]} />
        <Para>
          Each third-party service has its own privacy policy governing their use of your data.
        </Para>
      </Section>

      <Section title="Data Retention">
        <Para>
          We retain your account data for as long as your account is active. If you delete your
          account, we will delete your personal data within 30 days, except where we need to
          retain it for legal or legitimate business purposes.
        </Para>
      </Section>

      <Section title="Your Rights">
        <Para>You have the right to:</Para>
        <List items={[
          "Access the personal data we hold about you.",
          "Request correction of inaccurate data.",
          "Request deletion of your account and data.",
          "Export your data in a portable format.",
          "Withdraw consent for marketing communications.",
        ]} />
      </Section>

      <Section title="Cookies">
        <Para>
          We use essential cookies for authentication and session management. We do not use
          advertising or tracking cookies. You can control cookies through your browser settings.
        </Para>
      </Section>

      <Section title="Children's Privacy">
        <Para>
          Our service is not intended for users under 18 years of age. We do not knowingly
          collect information from children.
        </Para>
      </Section>

      <Section title="Changes to This Policy">
        <Para>
          We may update this Privacy Policy from time to time. We will notify you of any
          significant changes via email or through the service.
        </Para>
      </Section>

      <Section title="Contact Us">
        <Para>
          If you have questions about this Privacy Policy or your data, please contact us
          through the support channels available in the app.
        </Para>
      </Section>
    </Box>
  );
}
