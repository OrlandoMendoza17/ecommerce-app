"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { trpc } from "@/config/trpc.config";
import { useToast } from "@/hooks/useToast";
import { ContactFormProps } from "./ContactForm.types";

export default function ContactForm({ className = "" }: ContactFormProps) {
  const { toast, errorToast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    website: "",
  });

  const sendMutation = trpc.contact.send.useMutation({
    onSuccess: () => {
      toast({
        title: "Mensaje enviado",
        description: "Te responderemos en un plazo de 24-48 horas hábiles.",
        variant: "success",
      });
      setFormData({ name: "", email: "", subject: "", message: "", website: "" });
    },
    onError: (error) => {
      errorToast(error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMutation.mutate({
      name: formData.name,
      email: formData.email,
      subject: formData.subject,
      message: formData.message,
      website: formData.website || undefined,
    });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-6 ${className}`}>
      {/* Honeypot */}
      <div aria-hidden="true" className="hidden">
        <label htmlFor="website">Website</label>
        <input
          type="text"
          id="website"
          name="website"
          value={formData.website}
          onChange={handleChange}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div>
        <label
          htmlFor="name"
          className="block text-sm font-semibold text-gray-900 mb-2"
        >
          Nombre completo
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          disabled={sendMutation.isPending}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          placeholder="Tu nombre"
        />
      </div>

      <div>
        <label
          htmlFor="email"
          className="block text-sm font-semibold text-gray-900 mb-2"
        >
          Correo electrónico
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          disabled={sendMutation.isPending}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          placeholder="tu@email.com"
        />
      </div>

      <div>
        <label
          htmlFor="subject"
          className="block text-sm font-semibold text-gray-900 mb-2"
        >
          Asunto
        </label>
        <select
          id="subject"
          name="subject"
          value={formData.subject}
          onChange={handleChange}
          required
          disabled={sendMutation.isPending}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        >
          <option value="">Selecciona un asunto</option>
          <option value="consulta">Consulta general</option>
          <option value="pedido">Seguimiento de pedido</option>
          <option value="producto">Consulta sobre producto</option>
          <option value="devoluciones">Devoluciones y cambios</option>
          <option value="otros">Otros</option>
        </select>
      </div>

      <div>
        <label
          htmlFor="message"
          className="block text-sm font-semibold text-gray-900 mb-2"
        >
          Mensaje
        </label>
        <textarea
          id="message"
          name="message"
          value={formData.message}
          onChange={handleChange}
          required
          rows={6}
          disabled={sendMutation.isPending}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
          placeholder="Escribe tu mensaje aquí..."
        />
      </div>

      <button
        type="submit"
        disabled={sendMutation.isPending}
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-4 rounded-lg flex items-center justify-center space-x-2 transition-colors disabled:opacity-60"
      >
        <Send className="h-5 w-5" />
        <span>{sendMutation.isPending ? "Enviando..." : "Enviar mensaje"}</span>
      </button>

      <p className="text-sm text-gray-600 text-center">
        Responderemos en un plazo de 24-48 horas hábiles
      </p>
    </form>
  );
}
