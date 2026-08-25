import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { ReactNode } from "react";

export type EmailLayoutProps = {
  siteName: string;
  preview: string;
  heading: string;
  children: ReactNode;
};

export function EmailLayout({ siteName, preview, heading, children }: EmailLayoutProps) {
  return (
    <Html lang="es">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Text style={brand}>{siteName}</Text>
          <Heading style={h1}>{heading}</Heading>
          <Section>{children}</Section>
          <Text style={footer}>
            Este mensaje fue enviado por {siteName}. Si no esperabas este correo, puedes
            ignorarlo.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export function CtaButton({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} style={button}>
      {label}
    </Link>
  );
}

const body = {
  backgroundColor: "#f4f4f5",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  margin: "0",
  padding: "24px 12px",
} as const;

const container = {
  backgroundColor: "#ffffff",
  borderRadius: "8px",
  margin: "0 auto",
  maxWidth: "560px",
  padding: "32px 28px",
} as const;

const brand = {
  color: "#71717a",
  fontSize: "13px",
  fontWeight: 600,
  letterSpacing: "0.04em",
  margin: "0 0 16px",
  textTransform: "uppercase" as const,
};

const h1 = {
  color: "#18181b",
  fontSize: "22px",
  fontWeight: 700,
  lineHeight: "1.3",
  margin: "0 0 20px",
};

const footer = {
  borderTop: "1px solid #e4e4e7",
  color: "#a1a1aa",
  fontSize: "12px",
  lineHeight: "1.5",
  margin: "28px 0 0",
  paddingTop: "16px",
} as const;

const button = {
  backgroundColor: "#18181b",
  borderRadius: "6px",
  color: "#ffffff",
  display: "inline-block",
  fontSize: "14px",
  fontWeight: 600,
  margin: "20px 0 8px",
  padding: "12px 20px",
  textDecoration: "none",
} as const;
