import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Send, Users, DollarSign, Clock, CheckCircle2, XCircle,
  Loader2, Copy, Plus, Mail, Eye, UserPlus, ExternalLink, Ban, Package
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Invite {
  id: string;
  token: string;
  email: string;
  name: string | null;
  cpf: string | null;
  plan_value: number | null;
  status: string;
  created_at: string;
  expires_at: string | null;
  used_at: string | null;
  product_id: string | null;
  payment_status: string | null;
  product_name?: string;
}

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  duration_months: number;
  billing_type: string;
  payment_method: string;
  max_installments: number;
  description: string | null;
  active: boolean;
}

const CloserDashboard = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [successData, setSuccessData] = useState<{ email: string; password: string; url: string } | null>(null);
  const [form, setForm] = useState({ name: "", email: "", cpf: "" });
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [sendingInvite, setSendingInvite] = useState(false);
  const [credentialInvite, setCredentialInvite] = useState<Invite | null>(null);
  const [sendingEmail, setSendingEmail] = useState(false);

  // Fetch subscription plans
  const { data: plans } = useQuery({
    queryKey: ["closer-subscription-plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("active", true)
        .order("price");
      if (error) throw error;
      return data as SubscriptionPlan[];
    },
    enabled: !!user,
  });

  const selectedPlan = plans?.find((p) => p.id === selectedPlanId);

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  const { data: invites, isLoading } = useQuery({
    queryKey: ["closer-invites", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invites")
        .select("*, products:product_id(name)")
        .eq("created_by", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;

      return (data ?? []).map((inv: any): Invite => ({
        ...inv,
        product_name: inv.products?.name || null,
      }));
    },
    enabled: !!user,
  });

  const buildCredentialEmailHtml = (name: string, email: string, password: string, url: string) => `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:30px;">
      <h1 style="color:#d4af37;font-size:28px;margin:0;">🔥 Infosaas Anaac</h1>
      <p style="color:#888;font-size:14px;margin-top:8px;">Bem-vindo à sua nova plataforma</p>
    </div>
    <div style="background:#1a1a1a;border:1px solid #333;border-radius:12px;padding:30px;">
      <p style="color:#fff;font-size:16px;margin-top:0;">Olá${name ? ` <strong>${name}</strong>` : ""},</p>
      <p style="color:#ccc;font-size:14px;line-height:1.6;">
        Sua conta no <strong style="color:#d4af37;">Infosaas Anaac</strong> foi criada com sucesso!
        Use as credenciais abaixo para fazer seu primeiro acesso.
      </p>
      <div style="background:#111;border:1px solid #333;border-radius:8px;padding:20px;margin:20px 0;">
        <p style="color:#888;font-size:12px;margin:0 0 8px 0;">URL DE ACESSO</p>
        <a href="${url}" style="color:#d4af37;font-size:16px;text-decoration:none;word-break:break-all;">${url}</a>
        <hr style="border:none;border-top:1px solid #333;margin:16px 0;">
        <p style="color:#888;font-size:12px;margin:0 0 8px 0;">LOGIN (E-MAIL)</p>
        <p style="color:#fff;font-size:16px;margin:0 0 16px 0;">${email}</p>
        <p style="color:#888;font-size:12px;margin:0 0 8px 0;">SENHA (CPF)</p>
        <p style="color:#fff;font-size:16px;margin:0;">${password}</p>
      </div>
      <a href="${url}" style="display:block;text-align:center;background:#d4af37;color:#000;padding:14px 24px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;margin-top:20px;">
        Acessar Agora →
      </a>
    </div>
    <p style="color:#666;font-size:11px;text-align:center;margin-top:20px;">
      Este e-mail foi enviado automaticamente por Infosaas Anaac.
    </p>
  </div>
</body>
</html>`;

  const sendCredentialsEmail = async (toEmail: string, toName: string, password: string) => {
    const accessUrl = window.location.origin;
    try {
      const { data, error } = await supabase.functions.invoke("send-email", {
        body: {
          toEmail,
          toName,
          subject: "🔥 Suas credenciais de acesso — Infosaas Anaac",
          htmlContent: buildCredentialEmailHtml(toName, toEmail, password, accessUrl),
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return true;
    } catch (e: any) {
      console.error("Erro ao enviar e-mail:", e);
      return false;
    }
  };

  const handleCreateUser = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!form.email.trim() || !emailRegex.test(form.email.trim())) {
      toast.error("E-mail inválido.");
      return;
    }
    if (!form.cpf.trim() || form.cpf.replace(/\D/g, "").length < 11) {
      toast.error("CPF é obrigatório e deve ter 11 dígitos");
      return;
    }
    if (!selectedPlanId || !selectedPlan) {
      toast.error("Selecione um plano");
      return;
    }

    setSendingInvite(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-invite", {
        body: {
          name: form.name.trim() || form.email.split("@")[0],
          email: form.email.trim().toLowerCase(),
          cpf: form.cpf.trim(),
          plan_value: selectedPlan.price,
          product_id: selectedPlan.id,
        },
      });

      if (error) throw new Error(error.message || "Erro ao criar usuário");
      if (data?.error) throw new Error(data.error);

      const cpfClean = (form.cpf || "").replace(/\D/g, "");
      setSuccessData({
        email: form.email.trim().toLowerCase(),
        password: cpfClean,
        url: window.location.origin,
      });

      // Send credentials email
      await sendCredentialsEmail(
        form.email.trim().toLowerCase(),
        form.name.trim() || "",
        cpfClean,
      );

      toast.success("Usuário criado e credenciais enviadas!");
      queryClient.invalidateQueries({ queryKey: ["closer-invites"] });
      setCreateOpen(false);
      setForm({ name: "", email: "", cpf: "" });
    } catch (e: any) {
      toast.error("Erro ao criar usuário: " + (e.message || ""));
    } finally {
      setSendingInvite(false);
    }
  };

  const safeCopy = (text: string, msg: string) => {
    navigator.clipboard.writeText(text);
    toast.success(msg);
  };

  // KPIs
  const total = invites?.length ?? 0;
  const used = invites?.filter((i) => i.status === "used").length ?? 0;
  const pending = invites?.filter((i) => i.status === "pending").length ?? 0;
  const totalValue = invites
    ?.filter((i) => i.status === "used" && i.plan_value)
    .reduce((sum, i) => sum + (i.plan_value ?? 0), 0) ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-cinzel text-2xl font-bold text-foreground">Painel Administrativo</h1>
          <p className="text-sm text-muted-foreground">Gestão Comercial e Ativação de Usuários</p>
        </div>
      </div>

      <div className="space-y-6 mt-4">
        <div className="flex items-center justify-end">
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus size={16} /> Novo Usuário
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border max-w-md">
              <DialogHeader>
                <DialogTitle className="font-cinzel">Ativar Novo Usuário</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Nome do cliente</Label>
                  <Input
                    placeholder="Ex: Marcus Vinícius"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">E-mail *</Label>
                  <Input
                    type="email"
                    placeholder="cliente@email.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">CPF *</Label>
                  <Input
                    placeholder="000.000.000-00"
                    value={form.cpf}
                    onChange={(e) => setForm({ ...form, cpf: e.target.value })}
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-xs">Plano / Produto *</Label>
                  <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {plans?.map((plan) => (
                        <SelectItem key={plan.id} value={plan.id}>
                          {plan.name} - {formatCurrency(plan.price)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={handleCreateUser}
                  disabled={sendingInvite}
                  className="w-full gap-2"
                >
                  {sendingInvite ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus size={16} />}
                  Ativar Conta Agora
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Success Dialog */}
        <Dialog open={!!successData} onOpenChange={(open) => !open && setSuccessData(null)}>
          <DialogContent className="bg-card border-border max-w-md">
            <DialogHeader>
              <DialogTitle className="font-cinzel flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                Conta Criada com Sucesso!
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-3 bg-secondary/50 rounded-lg p-4">
                <div>
                  <p className="text-xs text-muted-foreground">Login (E-mail)</p>
                  <p className="text-sm font-medium">{successData?.email}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Senha (CPF)</p>
                  <p className="text-sm font-medium">{successData?.password}</p>
                </div>
              </div>
              <Button
                className="w-full gap-2"
                onClick={() => {
                  const text = `🔥 Infosaas Anaac\n\nAcesse: ${successData?.url}\nLogin: ${successData?.email}\nSenha: ${successData?.password}\n\nSeja bem-vindo!`;
                  safeCopy(text, "Dados copiados!");
                }}
              >
                <Copy size={16} /> Copiar dados de acesso
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-2xl font-bold">{total}</p>
              <p className="text-xs text-muted-foreground">Total de Ativações</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-emerald-400">{used}</p>
              <p className="text-xs text-muted-foreground">Concluídos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-amber-400">{pending}</p>
              <p className="text-xs text-muted-foreground">Em processamento</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-gold">R$ {totalValue.toLocaleString("pt-BR")}</p>
              <p className="text-xs text-muted-foreground">Faturamento Gerado</p>
            </CardContent>
          </Card>
        </div>

        {/* Users List */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Usuários Ativados</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-3">Usuário</th>
                      <th className="text-left p-3">Plano</th>
                      <th className="text-left p-3">Data</th>
                      <th className="text-left p-3">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invites?.map((invite) => (
                      <tr key={invite.id} className="border-b border-border hover:bg-secondary/30">
                        <td className="p-3">
                          <p className="font-medium">{invite.name || "—"}</p>
                          <p className="text-xs text-muted-foreground">{invite.email}</p>
                        </td>
                        <td className="p-3">{invite.product_name || "Plano Padrão"}</td>
                        <td className="p-3 text-muted-foreground text-xs">
                          {formatDistanceToNow(new Date(invite.created_at), { addSuffix: true, locale: ptBR })}
                        </td>
                        <td className="p-3">
                          <Button variant="ghost" size="sm" onClick={() => setCredentialInvite(invite)}>
                            <Eye size={12} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Credential Modal */}
      <Dialog open={!!credentialInvite} onOpenChange={(open) => !open && setCredentialInvite(null)}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader><DialogTitle>Dados de Acesso</DialogTitle></DialogHeader>
          {credentialInvite && (
            <div className="space-y-4 mt-2">
              <div className="space-y-3 bg-secondary/50 rounded-lg p-4">
                <div><p className="text-xs text-muted-foreground">Login</p><p>{credentialInvite.email}</p></div>
                <div><p className="text-xs text-muted-foreground">Senha (CPF)</p><p>{credentialInvite.cpf || "—"}</p></div>
              </div>
              <div className="flex gap-2">
                <Button className="flex-1" onClick={() => {
                  const text = `🔥 Infosaas Anaac\n\nAcesse: ${window.location.origin}\nLogin: ${credentialInvite.email}\nSenha: ${credentialInvite.cpf || "—"}`;
                  safeCopy(text, "Copiado!");
                }}><Copy size={16} /> Copiar</Button>
                <Button variant="outline" className="flex-1" disabled={sendingEmail} onClick={async () => {
                  setSendingEmail(true);
                  const sent = await sendCredentialsEmail(credentialInvite.email, credentialInvite.name || "", (credentialInvite.cpf || "").replace(/\D/g, ""));
                  setSendingEmail(false);
                  if (sent) toast.success("Enviado!");
                }}>{sendingEmail ? <Loader2 className="animate-spin" /> : <Mail size={16} />} Reenviar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CloserDashboard;
