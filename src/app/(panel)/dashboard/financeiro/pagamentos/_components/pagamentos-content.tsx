"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";
import { 
  Clock, 
  CheckCircle2, 
  DollarSign, 
  User,
  Calendar,
  Package,
  CreditCard,
  ArrowLeft,
  AlertTriangle
} from "lucide-react";
import { getAllAppointments } from "../_data-access/get-confirmed-appointments";
import { PaymentMethodModal } from "./payment-method-modal";
import { markAppointmentOverdue } from "../_actions/payment-actions";
import { toast } from "sonner";
import Link from "next/link";

interface PagamentosContentProps {
  userId: string;
}

export default function PagamentosContent({ userId }: PagamentosContentProps) {
  const [selectedClientAppointments, setSelectedClientAppointments] = useState<string[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showOverdueModal, setShowOverdueModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  const { data: appointments, isLoading, refetch } = useQuery({
    queryKey: ["all-appointments", userId],
    queryFn: () => getAllAppointments(userId),
  });

  // Filter appointments by selected date and group them
  const filteredAppointments = appointments?.filter(appointment => {
    const appointmentDate = new Date(appointment.appointmentDate);
    const selectedDateObj = new Date(selectedDate + 'T00:00:00');
    
    // Compare only the date parts (year, month, day)
    return appointmentDate.getFullYear() === selectedDateObj.getFullYear() &&
           appointmentDate.getMonth() === selectedDateObj.getMonth() &&
           appointmentDate.getDate() === selectedDateObj.getDate();
  }) || [];
  
  // Separate overdue appointments (appointments from past dates that are unpaid)
  const today = new Date();
  const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  
  const overdueAppointments = appointments?.filter(appointment => {
    const appointmentDate = new Date(appointment.appointmentDate);
    const appointmentDateOnly = new Date(appointmentDate.getFullYear(), appointmentDate.getMonth(), appointmentDate.getDate());
    // Check if appointment is in the past and not paid
    // Also include appointments that are explicitly marked as OVERDUE
    return (appointmentDateOnly < todayDateOnly && appointment.paymentStatus !== "PAID") || 
           appointment.paymentStatus === "OVERDUE";
  }) || [];

  // Group appointments by client (email) for current day
  const groupedAppointments = filteredAppointments.reduce((groups, appointment) => {
    const clientKey = appointment.email;
    if (!groups[clientKey]) {
      groups[clientKey] = [];
    }
    groups[clientKey].push(appointment);
    return groups;
  }, {} as Record<string, typeof appointments>) || {};
  
  // Group overdue appointments by client
  const groupedOverdueAppointments = overdueAppointments.reduce((groups, appointment) => {
    const clientKey = appointment.email;
    if (!groups[clientKey]) {
      groups[clientKey] = [];
    }
    groups[clientKey].push(appointment);
    return groups;
  }, {} as Record<string, typeof appointments>) || {};

  // Convert grouped appointments to array with combined data for current day
  const clientGroups = Object.entries(groupedAppointments).map(([email, clientAppointments]) => {
    const firstAppointment = clientAppointments[0];
    const totalValue = clientAppointments.reduce((sum, appointment) => {
      const servicePrice = appointment.service.price;
      const productsTotal = appointment.appointmentProducts?.reduce(
        (pSum, ap) => pSum + ap.totalPrice,
        0
      ) || 0;
      return sum + servicePrice + productsTotal;
    }, 0);

    const appointmentCount = clientAppointments.length;
    const hasOverdue = clientAppointments.some(apt => apt.paymentStatus === "OVERDUE");
    const hasPaid = clientAppointments.some(apt => apt.paymentStatus === "PAID");
    const allPaid = clientAppointments.every(apt => apt.paymentStatus === "PAID");
    
    // Determine overall payment status
    let overallStatus: string;
    if (allPaid) {
      overallStatus = "PAID";
    } else if (hasOverdue) {
      overallStatus = "OVERDUE"; 
    } else {
      overallStatus = "PENDING";
    }

    return {
      clientEmail: email,
      clientName: firstAppointment.name,
      appointments: clientAppointments,
      totalValue,
      appointmentCount,
      overallStatus,
      latestDate: new Date(Math.max(...clientAppointments.map(apt => new Date(apt.appointmentDate).getTime()))),
    };
  }).sort((a, b) => b.latestDate.getTime() - a.latestDate.getTime());
  
  // Get all overdue appointments for the modal
  const getAllOverdueAppointments = () => {
    const today = new Date();
    const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    return appointments?.filter(appointment => {
      const appointmentDate = new Date(appointment.appointmentDate);
      const appointmentDateOnly = new Date(appointmentDate.getFullYear(), appointmentDate.getMonth(), appointmentDate.getDate());
      // Check if appointment is in the past and not paid
      // Also include appointments that are explicitly marked as OVERDUE
      return (appointmentDateOnly < todayDateOnly && appointment.paymentStatus !== "PAID") || 
             appointment.paymentStatus === "OVERDUE";
    }) || [];
  };

  const allOverdueAppointments = getAllOverdueAppointments();
  const totalOverdueValue = allOverdueAppointments.reduce((sum, appointment) => {
    const servicePrice = appointment.service.price;
    const productsTotal = appointment.appointmentProducts?.reduce(
      (pSum, ap) => pSum + ap.totalPrice,
      0
    ) || 0;
    return sum + servicePrice + productsTotal;
  }, 0);

  const OverdueAppointmentsModal = () => {
    // Recalculate overdue appointments when modal is open
    const currentOverdueAppointments = getAllOverdueAppointments();
    const currentTotalOverdueValue = currentOverdueAppointments.reduce((sum, appointment) => {
      const servicePrice = appointment.service.price;
      const productsTotal = appointment.appointmentProducts?.reduce(
        (pSum, ap) => pSum + ap.totalPrice,
        0
      ) || 0;
      return sum + servicePrice + productsTotal;
    }, 0);

    return (
      <Dialog open={showOverdueModal} onOpenChange={setShowOverdueModal}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Todos os Pagamentos Atrasados
              <Badge variant="destructive">{currentOverdueAppointments.length}</Badge>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Summary */}
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {currentOverdueAppointments.length} agendamento(s) atrasado(s)
                  </p>
                  <p className="text-lg font-bold text-destructive">
                    Total: {formatCurrency(currentTotalOverdueValue)}
                  </p>
                </div>
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
            </div>

            {/* Appointments List */}
            <ScrollArea className="h-[400px] pr-4">
              {currentOverdueAppointments.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhum pagamento atrasado encontrado!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {currentOverdueAppointments.map((appointment) => {
                    const servicePrice = appointment.service.price;
                    const productsTotal = appointment.appointmentProducts?.reduce(
                      (sum, ap) => sum + ap.totalPrice,
                      0
                    ) || 0;
                    const appointmentTotal = servicePrice + productsTotal;
                    
                    // Calculate days overdue
                    const today = new Date();
                    const appointmentDate = new Date(appointment.appointmentDate);
                    const daysOverdue = Math.floor((today.getTime() - appointmentDate.getTime()) / (1000 * 60 * 60 * 24));

                    return (
                      <Card key={appointment.id} className="p-4 border-destructive/20 bg-destructive/5">
                        <div className="space-y-3">
                          {/* Client and Date Info */}
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-muted-foreground" />
                                <span className="font-medium">{appointment.name}</span>
                              </div>
                              <div className="text-xs text-muted-foreground">{appointment.email}</div>
                              <div className="flex items-center gap-2">
                                <Calendar className="w-3 h-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">
                                  {formatDate(appointment.appointmentDate)} às {appointment.time}
                                </span>
                                <Badge variant="destructive" className="text-xs">
                                  {daysOverdue} {daysOverdue === 1 ? 'dia' : 'dias'} atrasado
                                </Badge>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold text-destructive">
                                {formatCurrency(appointmentTotal)}
                              </div>
                              {getPaymentStatusBadge(appointment.paymentStatus)}
                            </div>
                          </div>

                          {/* Service Details */}
                          <div className="bg-background rounded-md p-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium text-sm">{appointment.service.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  Prof: {appointment.professional?.name || "Não informado"}
                                </div>
                                {appointment.appointmentProducts && appointment.appointmentProducts.length > 0 && (
                                  <div className="text-xs text-muted-foreground mt-1">
                                    + {appointment.appointmentProducts.length} produto(s)
                                  </div>
                                )}
                              </div>
                              <Button
                                size="sm"
                                onClick={() => {
                                  handlePaymentClick([appointment.id]);
                                  setShowOverdueModal(false);
                                }}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CreditCard className="w-3 h-3 mr-1" />
                                Pagar
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency", 
      currency: "BRL",
    }).format(value / 100);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("pt-BR");
  };

  const getPaymentStatusBadge = (paymentStatus: string) => {
    switch (paymentStatus) {
      case "PAID":
        return <Badge variant="default" className="bg-green-500 hover:bg-green-600">Pago</Badge>;
      case "OVERDUE":
        return <Badge variant="destructive">Atrasado</Badge>;
      default:
        return <Badge variant="secondary">Pendente</Badge>;
    }
  };

  const handlePaymentClick = (appointmentIds: string[]) => {
    setSelectedClientAppointments(appointmentIds);
    setShowPaymentModal(true);
  };

  const handleOverdueClick = async (appointmentIds: string[]) => {
    try {
      // Mark all appointments as overdue
      const promises = appointmentIds.map(id => 
        markAppointmentOverdue({ appointmentId: id })
      );
      
      const results = await Promise.all(promises);
      
      const hasError = results.some(result => result.error);
      if (hasError) {
        toast.error("Erro ao marcar alguns agendamentos como atrasados");
      } else {
        toast.success(`${appointmentIds.length} agendamento(s) marcado(s) como atrasado`);
        refetch();
      }
    } catch (error) {
      toast.error("Erro ao marcar como atrasado");
    }
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    setSelectedClientAppointments([]);
    refetch();
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <h1 className="text-3xl font-bold tracking-tight">Pagamentos</h1>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Carregando agendamentos...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 md:space-y-6 md:p-6">
      {/* Header with back button and overdue payments button */}
      <div className="flex items-center justify-between">
        <Link href="/dashboard/financeiro">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Voltar para Financeiro
          </Button>
        </Link>
        
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2 text-destructive border-destructive/20 hover:bg-destructive/10"
          onClick={() => setShowOverdueModal(true)}
        >
          <AlertTriangle className="w-4 h-4" />
          Ver Pagamentos Atrasados
          {allOverdueAppointments.length > 0 && (
            <Badge variant="destructive" className="ml-1">
              {allOverdueAppointments.length}
            </Badge>
          )}
        </Button>
      </div>
      
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Pagamentos</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-auto"
            />
          </div>
          <div className="text-sm text-muted-foreground">
            {clientGroups.length} {clientGroups.length === 1 ? 'cliente' : 'clientes'} • {filteredAppointments.length} agendamentos
          </div>
        </div>
      </div>

      {/* Current Day Appointments Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">
            Agendamentos de {new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR')}
          </h2>
        </div>
        
        {!filteredAppointments || filteredAppointments.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center h-48 md:h-64">
              <div className="text-center space-y-2">
                <Calendar className="w-8 h-8 md:w-12 md:h-12 text-muted-foreground mx-auto" />
                <p className="text-sm md:text-base text-muted-foreground">
                  Nenhum agendamento encontrado para {new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR')}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3 md:space-y-4">
            {clientGroups.map((clientGroup) => {
              const unpaidAppointments = clientGroup.appointments.filter(apt => apt.paymentStatus !== "PAID");
              const canProcessPayment = unpaidAppointments.length > 0;
              const canMarkOverdue = clientGroup.appointments.some(apt => apt.paymentStatus === "PENDING");

              return (
                <Card key={clientGroup.clientEmail} className="p-4 md:p-6">
                  <div className="space-y-4">
                    {/* Client Header */}
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <div className="min-w-0">
                          <span className="font-medium text-sm md:text-base">{clientGroup.clientName}</span>
                          <div className="text-xs text-muted-foreground truncate">{clientGroup.clientEmail}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getPaymentStatusBadge(clientGroup.overallStatus)}
                        <span className="text-xs text-muted-foreground">
                          {clientGroup.appointmentCount} {clientGroup.appointmentCount === 1 ? 'serviço' : 'serviços'}
                        </span>
                      </div>
                    </div>

                    {/* Services Summary */}
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Serviços agendados:</h4>
                      <div className="grid gap-2">
                        {clientGroup.appointments.map((appointment) => {
                          const servicePrice = appointment.service.price;
                          const productsTotal = appointment.appointmentProducts?.reduce(
                            (sum, ap) => sum + ap.totalPrice,
                            0
                          ) || 0;
                          const appointmentTotal = servicePrice + productsTotal;

                          return (
                            <div key={appointment.id} className="flex items-center justify-between p-2 border rounded-md">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <Calendar className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                                  <span className="text-xs text-muted-foreground">
                                    {formatDate(appointment.appointmentDate)} às {appointment.time}
                                  </span>
                                  {getPaymentStatusBadge(appointment.paymentStatus)}
                                </div>
                                <div className="text-sm font-medium">{appointment.service.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  Prof: {appointment.professional?.name || "Não informado"}
                                </div>
                                {appointment.appointmentProducts && appointment.appointmentProducts.length > 0 && (
                                  <div className="text-xs text-muted-foreground mt-1">
                                    + {appointment.appointmentProducts.length} produto(s)
                                  </div>
                                )}
                              </div>
                              <div className="text-right">
                                <div className="font-semibold text-sm">
                                  {formatCurrency(appointmentTotal)}
                                </div>
                                {appointment.paymentMethod && (
                                  <div className="text-xs text-muted-foreground">
                                    {appointment.paymentMethod.replace('_', ' ')}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Total and Actions */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-3 border-t">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-green-600">
                          Total: {formatCurrency(clientGroup.totalValue)}
                        </span>
                      </div>
                      
                      {clientGroup.overallStatus !== "PAID" && (
                        <div className="flex gap-2">
                          {canProcessPayment && (
                            <Button
                              onClick={() => handlePaymentClick(unpaidAppointments.map(apt => apt.id))}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CreditCard className="w-4 h-4 mr-2" />
                              Registrar Pagamento
                            </Button>
                          )}
                          
                          {canMarkOverdue && (
                            <Button
                              variant="destructive"
                              onClick={() => handleOverdueClick(clientGroup.appointments.filter(apt => apt.paymentStatus === "PENDING").map(apt => apt.id))}
                            >
                              <Clock className="w-4 h-4 mr-2" />
                              Marcar Atrasado
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <PaymentMethodModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        appointmentIds={selectedClientAppointments}
        onSuccess={handlePaymentSuccess}
      />
      
      <OverdueAppointmentsModal />
    </div>
  );
}