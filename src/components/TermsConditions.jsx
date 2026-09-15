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

export default function TermsConditions() {
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
        Terms & Conditions
      </Typography>
      <Typography sx={{ fontSize: 14, color: "rgba(238,234,227,0.5)", mb: 5 }}>
        Last updated: September 2026
      </Typography>

      <Box
        sx={{
          p: 3,
          mb: 5,
          borderRadius: 2,
          bgcolor: "rgba(196,164,106,0.08)",
          border: "1px solid rgba(196,164,106,0.2)",
        }}
      >
        <Typography sx={{ fontSize: 15, fontWeight: 600, color: C.warn, mb: 1 }}>
          Important Disclaimer
        </Typography>
        <Typography sx={{ fontSize: 14, color: "rgba(238,234,227,0.8)", lineHeight: 1.7 }}>
          Morrow Desk is NOT registered with SEBI (Securities and Exchange Board of India) as an
          investment advisor, research analyst, or portfolio manager. This service does NOT
          provide financial advice, investment recommendations, or stock tips. All information
          presented is for educational and informational purposes only.
        </Typography>
      </Box>

      <Section title="1. Nature of Service">
        <Para>
          Morrow Desk is a technical screening tool that processes publicly available market
          data to identify stocks meeting certain technical criteria. The service:
        </Para>
        <List items={[
          "Scans stocks based on price, volume, and technical patterns.",
          "Identifies potential setup conditions based on historical criteria.",
          "Provides sector-level analysis and classification.",
          "Tracks the lifecycle of identified setups.",
        ]} />
        <Para>
          <strong style={{ color: C.text }}>
            The service does NOT tell you what to buy, sell, or hold. All trading decisions
            are entirely your own responsibility.
          </strong>
        </Para>
      </Section>

      <Section title="2. No Investment Advice">
        <Para>
          Nothing on this platform constitutes investment advice, financial advice, trading
          advice, or any other sort of advice. You should not treat any of the content as such.
        </Para>
        <Para>
          We do not recommend that any security, portfolio of securities, transaction, or
          investment strategy is suitable for any specific person. The information provided
          does not take into account your specific investment objectives, financial situation,
          or needs.
        </Para>
      </Section>

      <Section title="3. Risk Acknowledgment">
        <Para>
          By using this service, you acknowledge and agree that:
        </Para>
        <List items={[
          "Trading in securities involves substantial risk and can result in the loss of your entire investment.",
          "Past performance of any stock or strategy is not indicative of future results.",
          "Technical patterns and setups identified by this tool may not result in profitable trades.",
          "You are solely responsible for your trading decisions and their outcomes.",
          "You should consult with a qualified financial advisor before making investment decisions.",
        ]} />
      </Section>

      <Section title="4. Data Accuracy">
        <Para>
          While we strive to provide accurate and up-to-date information, we make no warranties
          about the accuracy, completeness, or reliability of any data displayed. Market data
          is sourced from public exchanges and may be delayed or contain errors.
        </Para>
        <Para>
          You should always verify any information with official sources before making trading
          decisions.
        </Para>
      </Section>

      <Section title="5. Account & Subscription">
        <Para>
          To access certain features, you must create an account and may need to subscribe to
          a paid plan. You agree to:
        </Para>
        <List items={[
          "Provide accurate and complete registration information.",
          "Maintain the confidentiality of your account credentials.",
          "Notify us immediately of any unauthorized access to your account.",
          "Not share your subscription access with others.",
        ]} />
      </Section>

      <Section title="6. Payment & Refunds">
        <Para>
          Subscription fees are billed in advance on a monthly or yearly basis. By subscribing,
          you agree that:
        </Para>
        <List items={[
          "Subscriptions auto-renew unless cancelled before the renewal date.",
          "Refunds are generally not provided for partial subscription periods.",
          "You can cancel your subscription at any time; access continues until the current period ends.",
          "Prices may change with notice; existing subscriptions are honored at the original price until renewal.",
        ]} />
      </Section>

      <Section title="7. Acceptable Use">
        <Para>
          You agree not to:
        </Para>
        <List items={[
          "Use the service for any unlawful purpose.",
          "Attempt to reverse-engineer, scrape, or copy the service.",
          "Share or redistribute data from the service commercially.",
          "Attempt to circumvent any access restrictions or security measures.",
          "Use automated tools to access the service without permission.",
        ]} />
      </Section>

      <Section title="8. Intellectual Property">
        <Para>
          All content, features, and functionality of the service are owned by Morrow Desk and
          are protected by intellectual property laws. You may not reproduce, distribute, or
          create derivative works without our written permission.
        </Para>
      </Section>

      <Section title="9. Limitation of Liability">
        <Para>
          To the maximum extent permitted by law:
        </Para>
        <List items={[
          "We are not liable for any trading losses or damages arising from your use of the service.",
          "We are not liable for any indirect, incidental, or consequential damages.",
          "Our total liability is limited to the amount you paid for the service in the past 12 months.",
          "We are not responsible for decisions you make based on information from this service.",
        ]} />
      </Section>

      <Section title="10. Indemnification">
        <Para>
          You agree to indemnify and hold harmless Morrow Desk and its operators from any claims,
          damages, or expenses arising from your use of the service or violation of these terms.
        </Para>
      </Section>

      <Section title="11. Modifications">
        <Para>
          We reserve the right to modify these terms at any time. Continued use of the service
          after changes constitutes acceptance of the new terms. We will notify users of
          significant changes via email or through the service.
        </Para>
      </Section>

      <Section title="12. Governing Law">
        <Para>
          These terms are governed by the laws of India. Any disputes shall be subject to the
          exclusive jurisdiction of the courts in India.
        </Para>
      </Section>

      <Section title="13. Contact">
        <Para>
          For questions about these terms, please contact us through the support channels
          available in the app.
        </Para>
      </Section>

      <Box
        sx={{
          p: 3,
          mt: 5,
          borderRadius: 2,
          bgcolor: C.paper,
          border: `1px solid ${C.line}`,
        }}
      >
        <Typography sx={{ fontSize: 13, color: "rgba(238,234,227,0.6)", lineHeight: 1.7 }}>
          By using Morrow Desk, you acknowledge that you have read, understood, and agree to
          be bound by these Terms & Conditions. If you do not agree to these terms, do not
          use the service.
        </Typography>
      </Box>
    </Box>
  );
}
