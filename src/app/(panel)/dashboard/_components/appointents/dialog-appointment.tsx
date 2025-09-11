"use client";

import { useState, useEffect } from "react";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Package, DollarSign } from "lucide-react";
import { AppointmentWithService } from "./appointents-list";
import {
  addProductToAppointment,
  removeProductFromAppointment,
  createProduct,
  getUserProducts,
} from "../../_actions/appointment-product-actions";
import { toast } from "sonner";
import { formatCurrency } from "@/utils/formatCurrency";

interface DialogAppointmentProps {
  appointment: AppointmentWithService | null;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  status: boolean;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export function DialogAppointment({ appointment }: DialogAppointmentProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [showCreateProduct, setShowCreateProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    price: 0,
  });
  const [loading, setLoading] = useState(false);

  // Carregar produtos do usuário
  useEffect(() => {
    if (appointment) {
      loadProducts();
    }
  }, [appointment]);

  const loadProducts = async () => {
    try {
      const response = await getUserProducts();
      if (response.data) {
        setProducts(response.data);
      } else if (response.error) {
        toast.error(response.error);
      }
    } catch (error) {
      toast.error("Erro ao carregar produtos");
    }
  };

  const handleAddProduct = async () => {
    if (!appointment || !selectedProductId || quantity < 1) {
      toast.error("Selecione um produto e quantidade válida");
      return;
    }

    setLoading(true);
    try {
      const response = await addProductToAppointment({
        appointmentId: appointment.id,
        productId: selectedProductId,
        quantity,
      });

      if (response.data) {
        toast.success(response.data);
        setSelectedProductId("");
        setQuantity(1);
        // Recarregar dados do agendamento seria ideal aqui
        window.location.reload();
      } else if (response.error) {
        toast.error(response.error);
      }
    } catch (error) {
      toast.error("Erro ao adicionar produto");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveProduct = async (appointmentProductId: string) => {
    setLoading(true);
    try {
      const response = await removeProductFromAppointment({
        appointmentProductId,
      });

      if (response.data) {
        toast.success(response.data);
        // Recarregar dados do agendamento seria ideal aqui
        window.location.reload();
      } else if (response.error) {
        toast.error(response.error);
      }
    } catch (error) {
      toast.error("Erro ao remover produto");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = async () => {
    if (!newProduct.name || newProduct.price <= 0) {
      toast.error("Nome e preço são obrigatórios");
      return;
    }

    setLoading(true);
    try {
      const response = await createProduct(newProduct);

      if (response.data) {
        toast.success(response.data);
        setNewProduct({ name: "", description: "", price: 0 });
        setShowCreateProduct(false);
        loadProducts();
      } else if (response.error) {
        toast.error(response.error);
      }
    } catch (error) {
      toast.error("Erro ao criar produto");
    } finally {
      setLoading(false);
    }
  };

  if (!appointment) {
    return (
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Detalhes do Agendamento</DialogTitle>
          <DialogDescription>
            Nenhum agendamento selecionado.
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    );
  }

  // Calcular valores
  const servicePrice = appointment.service.price;
  const productsTotal = appointment.appointmentProducts?.reduce(
    (sum, ap) => sum + ap.totalPrice,
    0
  ) || 0;
  const grandTotal = servicePrice + productsTotal;

  return (
    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Detalhes do Agendamento
        </DialogTitle>
        <DialogDescription>
          Confira os detalhes do agendamento e gerencie produtos.
        </DialogDescription>
      </DialogHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Informações do Cliente */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informações do Cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-sm font-semibold text-gray-600">
                Nome
              </Label>
              <p className="text-sm">{appointment.name}</p>
            </div>
            <div>
              <Label className="text-sm font-semibold text-gray-600">
                Email
              </Label>
              <p className="text-sm">{appointment.email}</p>
            </div>
            <div>
              <Label className="text-sm font-semibold text-gray-600">
                Telefone
              </Label>
              <p className="text-sm">{appointment.phone}</p>
            </div>
            <div>
              <Label className="text-sm font-semibold text-gray-600">
                Data e Horário
              </Label>
              <p className="text-sm">
                {new Date(appointment.appointmentDate).toLocaleDateString(
                  "pt-BR"
                )}{" "}
                às {appointment.time}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Informações do Serviço */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Serviço</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-sm font-semibold text-gray-600">
                Nome do Serviço
              </Label>
              <p className="text-sm">{appointment.service.name}</p>
            </div>
            <div>
              <Label className="text-sm font-semibold text-gray-600">
                Duração
              </Label>
              <p className="text-sm">{appointment.service.duration} minutos</p>
            </div>
            <div>
              <Label className="text-sm font-semibold text-gray-600">
                Valor
              </Label>
              <p className="text-sm font-semibold text-green-600">
                {formatCurrency(appointment.service.price / 100)}
              </p>
            </div>
            {appointment.professional && (
              <div>
                <Label className="text-sm font-semibold text-gray-600">
                  Profissional
                </Label>
                <p className="text-sm">{appointment.professional.name}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Separator className="my-6" />

      {/* Produtos Adicionados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Produtos Adicionados
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {appointment.appointmentProducts &&
          appointment.appointmentProducts.length > 0 ? (
            <div className="space-y-2">
              {appointment.appointmentProducts.map((ap) => (
                <div
                  key={ap.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <h4 className="font-medium">{ap.product.name}</h4>
                    {ap.product.description && (
                      <p className="text-sm text-gray-600">
                        {ap.product.description}
                      </p>
                    )}
                    <p className="text-sm text-gray-500">
                      Quantidade: {ap.quantity} | Valor unitário:{" "}
                      {formatCurrency(ap.unitPrice / 100)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-green-600">
                      {formatCurrency(ap.totalPrice / 100)}
                    </span>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleRemoveProduct(ap.id)}
                      disabled={loading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">
              Nenhum produto adicionado
            </p>
          )}
        </CardContent>
      </Card>

      {/* Adicionar Produto */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Adicionar Produto</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCreateProduct(!showCreateProduct)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Produto
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {showCreateProduct && (
            <div className="p-4 border rounded-lg bg-gray-50 space-y-3">
              <h4 className="font-medium">Criar Novo Produto</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="productName">Nome *</Label>
                  <Input
                    id="productName"
                    value={newProduct.name}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, name: e.target.value })
                    }
                    placeholder="Nome do produto"
                  />
                </div>
                <div>
                  <Label htmlFor="productPrice">Preço (R$) *</Label>
                  <Input
                    id="productPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={newProduct.price}
                    onChange={(e) =>
                      setNewProduct({
                        ...newProduct,
                        price: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="productDescription">Descrição</Label>
                <Textarea
                  id="productDescription"
                  value={newProduct.description}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      description: e.target.value,
                    })
                  }
                  placeholder="Descrição do produto (opcional)"
                  rows={2}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleCreateProduct}
                  disabled={loading}
                  size="sm"
                >
                  Criar Produto
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowCreateProduct(false)}
                  size="sm"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <Label htmlFor="productSelect">Selecionar Produto</Label>
              <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha um produto" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} - {formatCurrency(product.price / 100)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="quantity">Quantidade</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              />
            </div>
          </div>
          <Button
            onClick={handleAddProduct}
            disabled={!selectedProductId || loading}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Produto
          </Button>
        </CardContent>
      </Card>

      {/* Resumo Financeiro */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo Financeiro</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span>Serviço:</span>
            <span>{formatCurrency(servicePrice / 100)}</span>
          </div>
          <div className="flex justify-between">
            <span>Produtos:</span>
            <span>{formatCurrency(productsTotal / 100)}</span>
          </div>
          <Separator />
          <div className="flex justify-between font-semibold text-lg">
            <span>Total:</span>
            <span className="text-green-600">
              {formatCurrency(grandTotal / 100)}
            </span>
          </div>
        </CardContent>
      </Card>
    </DialogContent>
  );
}
