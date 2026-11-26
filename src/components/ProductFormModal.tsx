import React, { useState, useEffect } from 'react';
import { X, Package, Wrench } from 'lucide-react';
import { Product, Producer } from '../types';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Product) => void;
  currentProducer: Producer;
  productToEdit?: Product | null;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentProducer,
  productToEdit,
}) => {
  const [itemType, setItemType] = useState<'produto' | 'servico'>(productToEdit?.itemType || 'produto');
  const [title, setTitle] = useState(productToEdit?.title || '');
  const [description, setDescription] = useState(productToEdit?.description || '');
  const [price, setPrice] = useState(productToEdit ? productToEdit.price.toString() : '');
  const [unit, setUnit] = useState(productToEdit?.unit || 'Unidade');
  const [category, setCategory] = useState(productToEdit?.category || 'produtos_agricolas');
  const [stock, setStock] = useState(productToEdit ? productToEdit.stock.toString() : '10');
  const [ordersCount, setOrdersCount] = useState(productToEdit ? String(productToEdit.ordersCount || 0) : '0');
  const [harvestDate, setHarvestDate] = useState(productToEdit?.harvestDate || 'Disponível no catálogo');
  const [imageUrl, setImageUrl] = useState(
    productToEdit?.images?.[0] || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80'
  );
  const [organic, setOrganic] = useState(productToEdit ? productToEdit.organic : false);

  useEffect(() => {
    if (isOpen) {
      setItemType(productToEdit?.itemType || 'produto');
      setTitle(productToEdit?.title || '');
      setDescription(productToEdit?.description || '');
      setPrice(productToEdit ? productToEdit.price.toString() : '');
      setUnit(productToEdit?.unit || 'Unidade');
      setCategory(productToEdit?.category || currentProducer.category || 'produtos_agricolas');
      setStock(productToEdit ? productToEdit.stock.toString() : '10');
      setOrdersCount(productToEdit ? String(productToEdit.ordersCount || 0) : '0');
      setHarvestDate(productToEdit?.harvestDate || 'Disponível no catálogo');
      setImageUrl(
        productToEdit?.images?.[0] || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80'
      );
      setOrganic(productToEdit ? productToEdit.organic : false);
    }
  }, [isOpen, productToEdit, currentProducer.category]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !price) return;

    const newProd: Product = {
      id: productToEdit ? productToEdit.id : `p_${Date.now()}`,
      producerId: currentProducer.id,
      producerName: currentProducer.name,
      producerFarm: currentProducer.farmName,
      producerDistanceKm: currentProducer.location.distanceKm,
      itemType,
      title: title.trim(),
      description: description.trim() || 'Item cadastrado no catálogo oficial ConeQta Queimados.',
      price: parseFloat(price) || 0,
      unit,
      category,
      images: [
        imageUrl.trim() || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80',
      ],
      stock: parseInt(stock, 10) || 1,
      harvestDate,
      organic,
      certifications: organic ? ['agroecologico', 'familiar', 'sem_agrotoxico'] : ['familiar', 'artesanal'],
      freshnessScore: 10,
      isSeasonal: false,
      featured: true,
      clicksCount: productToEdit?.clicksCount || 0,
      ordersCount: Math.max(0, parseInt(ordersCount, 10) || 0),
      rating: productToEdit?.rating || 0,
      reviewCount: productToEdit?.reviewCount || 0,
    };

    onSave(newProd);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-stone-200 animate-in fade-in zoom-in duration-150 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
          <div>
            <h3 className="font-bold text-stone-900 font-serif text-lg">
              {productToEdit ? 'Editar Item do Catálogo' : 'Cadastrar Produto ou Serviço'}
            </h3>
            <p className="text-xs text-stone-500">Loja / Propriedade: {currentProducer.farmName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-stone-100 flex items-center justify-center text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tipo: Produto ou Serviço */}
          <div>
            <label className="block text-[10px] font-bold text-stone-600 uppercase mb-1.5">Tipo de Oferta</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setItemType('produto')}
                className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  itemType === 'produto'
                    ? 'bg-orange-50 border-[#D35400] text-[#D35400]'
                    : 'bg-stone-50 border-stone-200 text-stone-600'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>Produto</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setItemType('servico');
                  if (unit === 'Kg' || unit === 'Maço') setUnit('Serviço');
                }}
                className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  itemType === 'servico'
                    ? 'bg-orange-50 border-[#D35400] text-[#D35400]'
                    : 'bg-stone-50 border-stone-200 text-stone-600'
                }`}
              >
                <Wrench className="w-4 h-4" />
                <span>Serviço</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-stone-600 uppercase mb-1">
              {itemType === 'servico' ? 'Nome do Serviço *' : 'Nome do Produto *'}
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                itemType === 'servico'
                  ? 'Ex: Design de Sobrancelhas, Entrega Express, Costura'
                  : 'Ex: Bolo de Pote Caseiro, Mel Silvestre, Couve Orgânica'
              }
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 focus:bg-white focus:outline-hidden focus:border-[#D35400]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-stone-600 uppercase mb-1">Preço de Referência (R$) *</label>
              <input
                type="number"
                step="0.10"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="15.00"
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-stone-600 uppercase mb-1">Unidade / Cobrança</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 font-bold"
              >
                <option value="Unidade">Unidade</option>
                <option value="Kg">Kg</option>
                <option value="Maço">Maço</option>
                <option value="Dúzia">Dúzia</option>
                <option value="Peça">Peça</option>
                <option value="Pote">Pote</option>
                <option value="Serviço">Serviço</option>
                <option value="Hora">Hora</option>
                <option value="Caixa">Caixa</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-stone-600 uppercase mb-1">Categoria</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 font-bold"
              >
                <option value="produtos_agricolas">Produtos Agrícolas</option>
                <option value="gastronomia">Gastronomia</option>
                <option value="estetica_beleza">Estética e Beleza</option>
                <option value="vestuario">Vestuário</option>
                <option value="artesanato">Artesanato</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-stone-600 uppercase mb-1">
                Vendas / Atendimentos (Ranking)
              </label>
              <input
                type="number"
                min="0"
                value={ordersCount}
                onChange={(e) => setOrdersCount(e.target.value)}
                placeholder="0"
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-stone-600 uppercase mb-1">Disponibilidade</label>
              <input
                type="text"
                value={harvestDate}
                onChange={(e) => setHarvestDate(e.target.value)}
                placeholder="Ex: Sob encomenda / Hoje"
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-stone-600 uppercase mb-1">Quantidade Disponível</label>
              <input
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="10"
                className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-stone-600 uppercase mb-1">Descrição</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva os detalhes do produto ou serviço..."
              className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-stone-600 uppercase mb-1">URL da Foto</label>
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full px-3.5 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isOrganic"
              checked={organic}
              onChange={(e) => setOrganic(e.target.checked)}
              className="w-4 h-4 rounded-sm text-[#D35400] focus:ring-[#D35400]"
            />
            <label htmlFor="isOrganic" className="text-xs font-bold text-stone-700 cursor-pointer">
              Produção Artesanal / Agroecológica Local
            </label>
          </div>

          <div className="flex gap-2 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-[#D35400] hover:bg-[#BA4A00] text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Salvar no Catálogo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
