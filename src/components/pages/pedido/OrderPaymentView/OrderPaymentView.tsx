"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Calendar, ImageIcon, Loader2 } from "lucide-react";
import { trpc } from "@/config/trpc.config";
import { ORDER_PAYMENT_PROOFS_BUCKET } from "@/config/order-payment.config";
import { VENEZUELAN_BANKS } from "@/constants/venezuelan-banks";
import FormFileInput from "@/components/form/FormFileInput/FormFileInput";
import FormSelect from "@/components/form/FormSelect/FormSelect";
import FormInput from "@/components/form/FormInput/FormInput";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { SelectItem } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCurrency } from "@/contexts/CurrencyContext/CurrencyContext";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { uploadFiles } from "@/utils/supabase/storage/uploadFiles";
import PaymentMethodDetailsPanel from "./PaymentMethodDetailsPanel";
import OrderShippingSection from "./OrderShippingSection";
import {
  formatOrderAmountForMethod,
  getPaymentMethodCurrency,
  getPaymentMethodDisplayName,
  paymentMethodRequiresIssuerBank,
  orderPaymentDefaultValues,
  orderPaymentFormSchema,
  type OrderPaymentFormValues,
} from "./OrderPaymentView.helpers";
import type { OrderPaymentViewProps } from "./OrderPaymentView.types";

const formName = "order-payment";

export default function OrderPaymentView({ orderId }: OrderPaymentViewProps) {
  const router = useRouter();
  const { user, rendered: authRendered } = useAuth();
  const { toast, errorToast } = useToast();
  const { currency: storeCurrency, exchangeRate, formatBsPrice } = useCurrency();
  const utils = trpc.useUtils();
  const [shippingMode, setShippingMode] = useState<"pending" | "address" | "coordinate">("pending");

  const { data: order, isLoading: orderLoading, isError: orderError } =
    trpc.orders.getById.useQuery({ id: orderId });

  const { data: paymentMethods = [], isLoading: methodsLoading } =
    trpc.payment_methods.select.useQuery({ is_active: true });

  const submitMutation = trpc.orders.submitPayment.useMutation({
    onError: errorToast,
    onSuccess: async (data) => {
      await utils.orders.getById.invalidate({ id: orderId });
      toast({
        title: "Pago reportado",
        description: `Recibimos tu comprobante para el pedido #${data.order_number}. Te avisaremos cuando sea confirmado.`,
        variant: "success",
      });
      router.push(`/pedido/${orderId}/confirmacion`);
    },
  });

  const form = useForm<OrderPaymentFormValues>({
    resolver: zodResolver(orderPaymentFormSchema),
    defaultValues: orderPaymentDefaultValues,
  });

  const selectedMethodId = form.watch("payment_method_id");

  const selectedPaymentMethod = useMemo(
    () => paymentMethods.find((m) => m.id === selectedMethodId) ?? null,
    [paymentMethods, selectedMethodId]
  );

  const requiresIssuerBank = selectedPaymentMethod
    ? paymentMethodRequiresIssuerBank(selectedPaymentMethod.type)
    : false;

  useEffect(() => {
    if (!requiresIssuerBank) {
      form.setValue("issuer_bank", "");
      form.clearErrors("issuer_bank");
    }
  }, [requiresIssuerBank, form]);

  useEffect(() => {
    if (order?.shipping_delivery_mode && order.shipping_delivery_mode !== "pending") {
      setShippingMode(order.shipping_delivery_mode as "address" | "coordinate");
    }
  }, [order?.shipping_delivery_mode]);

  const amountUsd = order?.total ?? 0;
  const paymentCurrency = getPaymentMethodCurrency(selectedPaymentMethod);
  const amountPrimaryLabel = formatOrderAmountForMethod(
    amountUsd,
    paymentCurrency,
    exchangeRate,
  );
  const amountSecondaryLabel =
    paymentCurrency !== "VES" && paymentCurrency === storeCurrency
      ? formatBsPrice(amountUsd)
      : null;

  const onSubmit = async (data: OrderPaymentFormValues) => {
    if (!user) {
      errorToast(new Error("Debes iniciar sesión para enviar el pago"));
      return;
    }

    if (requiresIssuerBank && !data.issuer_bank?.trim()) {
      form.setError("issuer_bank", {
        message: "Selecciona el banco emisor",
      });
      return;
    }

    debugger;

    let payment_proof_url = "";

    if (data.proof_url && data.proof_url.length > 0) {
      try {
        const urls = await uploadFiles({
          files: data.proof_url,
          folder: `${user.id}/${orderId}`,
          bucket: ORDER_PAYMENT_PROOFS_BUCKET,
        });
        payment_proof_url = urls[0] ?? "";
      } catch {
        errorToast(new Error("Error al subir el comprobante de pago"));
        return;
      }
    }

    await submitMutation.mutateAsync({
      id: orderId,
      payment_method_id: data.payment_method_id,
      payment_reference: data.payment_reference.trim(),
      payment_date: data.payment_date,
      issuer_bank: requiresIssuerBank ? data.issuer_bank?.trim() ?? "" : "",
      payment_proof_url: payment_proof_url || undefined,
    });
  };

  if (!authRendered || orderLoading || methodsLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center space-y-4">
        <p className="text-gray-600">Debes iniciar sesión para completar el pago.</p>
        <Link href="/auth/login" className="text-primary font-medium hover:underline">
          Iniciar sesión
        </Link>
      </div>
    );
  }

  if (orderError || !order) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center space-y-4">
        <p className="text-gray-600">No pudimos cargar el pedido.</p>
        <Link href="/mis-compras" className="text-primary font-medium hover:underline">
          Ir a mis compras
        </Link>
      </div>
    );
  }

  if (order.status !== "pending_payment") {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center space-y-4">
        <p className="text-gray-600">
          Este pedido ya no requiere registro de pago en línea.
        </p>
        <Link
          href={`/pedido/${orderId}/confirmacion`}
          className="text-primary font-medium hover:underline"
        >
          Ver detalle del pedido
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#ededed] py-8 px-2">
      <div className="max-w-5xl mx-auto">
        {order.order_number ? (
          <p className="text-sm text-gray-600 mb-4 text-center">
            Pedido <span className="font-semibold">#{order.order_number}</span>
          </p>
        ) : null}

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8">
          <Form {...form}>
            <form
              id={`form-${formName}`}
              onSubmit={form.handleSubmit(onSubmit)}
              noValidate
              className="space-y-8"
            >
              <div className="grid lg:grid-cols-2 gap-8 lg:gap-10">
                {/* Columna izquierda: formulario */}
                <div className="space-y-5">
                  <FormSelect
                    control={form.control}
                    name="payment_method_id"
                    className="shadow-none"
                    label="Selecciona el método al cual transferirás"
                    placeholder="Selecciona un método de pago"
                    disabled={submitMutation.isPending}
                  >
                    {paymentMethods.length === 0 ? (
                      <SelectItem value="none" disabled>
                        No hay métodos disponibles
                      </SelectItem>
                    ) : (
                      paymentMethods.map((method) => (
                        <SelectItem key={method.id} value={method.id}>
                          {getPaymentMethodDisplayName(method)}
                        </SelectItem>
                      ))
                    )}
                  </FormSelect>

                  {requiresIssuerBank ? (
                    <FormSelect
                      control={form.control}
                      name="issuer_bank"
                      label="Banco emisor"
                      placeholder="Selecciona un banco"
                      className="shadow-none"
                      disabled={submitMutation.isPending}
                    >
                      {VENEZUELAN_BANKS.map((bank) => (
                        <SelectItem key={bank} value={bank}>
                          {bank}
                        </SelectItem>
                      ))}
                    </FormSelect>
                  ) : null}

                  <FormInput
                    control={form.control}
                    name="payment_reference"
                    label="Código de referencia"
                    placeholder="Número de referencia de la transferencia"
                    className="text-sm!"
                    disabled={submitMutation.isPending}
                  />

                  <div className="grid sm:grid-cols-2 gap-5">
                    <div className="space-y-1">
                      <Label
                        htmlFor="payment_date"
                        className="text-xs text-gray-500 font-normal"
                      >
                        Fecha del pago
                      </Label>
                      <div className="relative">
                        <Input
                          id="payment_date"
                          type="date"
                          className="text-sm! shadow-none focus-visible:ring-0"
                          disabled={submitMutation.isPending}
                          {...form.register("payment_date")}
                        />
                      </div>
                      {form.formState.errors.payment_date ? (
                        <p className="text-xs text-destructive mt-1">
                          {form.formState.errors.payment_date.message}
                        </p>
                      ) : null}
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs text-gray-500 font-normal">
                        Monto transferido
                      </Label>
                      <div className="rounded-md bg-gray-100 px-3 py-3 pointer-events-none select-none">
                        <p className="text-lg font-semibold text-gray-900 leading-tight">
                          {amountPrimaryLabel}
                        </p>
                        {amountSecondaryLabel ? (
                          <p className="text-sm text-gray-600 mt-0.5">{amountSecondaryLabel}</p>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-1" />

                  <OrderShippingSection
                    orderId={orderId}
                    initialMode={shippingMode}
                    onModeChange={setShippingMode}
                  />
                </div>

                {/* Columna derecha: datos + voucher */}
                <div className="space-y-5">
                  <PaymentMethodDetailsPanel paymentMethod={selectedPaymentMethod} />

                  <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50/80 p-5 text-center space-y-3">
                    <ImageIcon className="size-10 text-gray-300 mx-auto" />
                    <div>
                      <p className="font-medium text-gray-900 text-sm">
                        Comprobante de pago
                      </p>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                        Puedes adjuntar una captura del pago en formato JPG, JPEG, PNG o
                        un archivo PDF.
                      </p>
                    </div>
                    <FormFileInput
                      name="proof_url"
                      label=""
                      placeholder={null}
                      description=""
                      bucket={ORDER_PAYMENT_PROOFS_BUCKET}
                      maxFiles={1}
                      multiple={false}
                      maxSize={5 * 1024 * 1024}
                      accept={{
                        "image/*": [".jpeg", ".jpg", ".png", ".webp"],
                        "application/pdf": [".pdf"],
                      }}
                      disabled={submitMutation.isPending}
                      className="[&_button]:border-[#3483fa] [&_button]:text-[#3483fa] [&_button]:hover:bg-[#3483fa]/5"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:items-center gap-3 pt-4 border-t border-gray-100">
                <Link
                  href={`/pedido/${orderId}/confirmacion`}
                  className="text-center sm:text-right text-sm text-gray-500 hover:text-gray-800 px-4 py-2"
                >
                  Regresar
                </Link>
                <Button
                  type="submit"
                  form={`form-${formName}`}
                  disabled={submitMutation.isPending || paymentMethods.length === 0 || shippingMode === "pending"}
                  className="bg-[#3483fa] hover:bg-[#2968c8] text-white font-semibold px-8 min-w-[140px]"
                >
                  {submitMutation.isPending ? (
                    <>
                      <Loader2 className="size-4 animate-spin mr-2" />
                      Enviando…
                    </>
                  ) : (
                    "Enviar"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
