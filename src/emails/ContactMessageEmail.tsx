import { Text } from "@react-email/components";
import { EmailLayout } from "./EmailLayout";

export type ContactMessageEmailProps = {
  siteName: string;
  name: string;
  email: string;
  subject: string;
  message: string;
};

export function ContactMessageEmail(props: ContactMessageEmailProps) {
  const { siteName, name, email, subject, message } = props;
  return (
    <EmailLayout
      siteName={siteName}
      preview={`Contacto: ${subject} — ${name}`}
      heading="Nuevo mensaje de contacto"
    >
      <Text style={text}>
        <strong>Nombre:</strong> {name}
      </Text>
      <Text style={text}>
        <strong>Email:</strong> {email}
      </Text>
      <Text style={text}>
        <strong>Asunto:</strong> {subject}
      </Text>
      <Text style={text}>
        <strong>Mensaje:</strong>
      </Text>
      <Text style={messageStyle}>{message}</Text>
    </EmailLayout>
  );
}

const text = {
  color: "#3f3f46",
  fontSize: "15px",
  lineHeight: "1.6",
  margin: "0 0 8px",
} as const;

const messageStyle = {
  ...text,
  whiteSpace: "pre-wrap" as const,
  marginTop: "4px",
};

export default ContactMessageEmail;
