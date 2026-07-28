import React, { useState } from 'react';
import { 
  Sparkles, ChefHat, MapPin, DollarSign, ArrowRight, ArrowLeft, 
  CheckCircle2, Palette, Shield, Info, Image, MessageSquare 
} from 'lucide-react';
import { DatabaseState, RestaurantSettings } from '../types';
import { compressImage } from '../lib/imageUtils';

interface SetupWizardProps {
  dbState: DatabaseState;
  onSaveState: (newState: DatabaseState) => Promise<boolean>;
  onSetupComplete: () => void;
}

export default function SetupWizard({ dbState, onSaveState, onSetupComplete }: SetupWizardProps) {
  const [step, setStep] = useState(1);

  // Initial empty configurations form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');

  // Branding
  const [logo, setLogo] = useState('https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=200');
  const [primaryColor, setPrimaryColor] = useState('#EF4444'); // rose/red
  const [secondaryColor, setSecondaryColor] = useState('#10B981'); // emerald
  const [fontFamily, setFontFamily] = useState('Inter');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Logistics
  const [radiusKm, setRadiusKm] = useState('5');
  const [baseFee, setBaseFee] = useState('7.00');
  const [prepTime, setPrepTime] = useState('30');

  // Payment checkout PIX
  const [pixType, setPixType] = useState<'cpf' | 'cnpj' | 'phone' | 'email' | 'random'>('random');
  const [pixValue, setPixValue] = useState('');
  const [pixReceiver, setPixReceiver] = useState('');

  const handleNext = () => {
    if (step === 1 && (!name || !whatsapp || !address)) {
      alert('Por favor, informe ao menos o Nome, WhatsApp e Endereço do restaurante.');
      return;
    }
    if (step === 4 && (!pixValue || !pixReceiver)) {
      alert('Por favor, preencha os dados da Chave PIX do estabelecimento para ativação do checkout.');
      return;
    }
    setStep(prev => prev + 1);
  };

  const handlePrev = () => {
    setStep(prev => prev - 1);
  };

  const handleCompleteSetup = async () => {
    // Generate empty structure with basic wizard variables
    const settings: RestaurantSettings = {
      name,
      phone,
      whatsapp,
      instagram: '',
      facebook: '',
      tiktok: '',
      email,
      address,
      branding: {
        logo,
        bannerImage: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=800',
        primaryColor,
        secondaryColor,
        fontFamily,
        theme
      },
      delivery: {
        radiusKm: parseFloat(radiusKm),
        baseFee: parseFloat(baseFee),
        estimatedTimeMin: parseInt(prepTime),
        allowPickup: true,
        neighborhoods: [
          { id: 'n-1', name: 'Bairro Centro', fee: parseFloat(baseFee), deliveryTime: `${prepTime} min` }
        ]
      },
      operational: {
        hours: [
          { dayOfWeek: 0, isOpen: true, slots: [{ open: '18:00', close: '23:30' }] },
          { dayOfWeek: 1, isOpen: true, slots: [{ open: '18:00', close: '23:30' }] },
          { dayOfWeek: 2, isOpen: true, slots: [{ open: '18:00', close: '23:30' }] },
          { dayOfWeek: 3, isOpen: true, slots: [{ open: '18:00', close: '23:30' }] },
          { dayOfWeek: 4, isOpen: true, slots: [{ open: '18:00', close: '23:30' }] },
          { dayOfWeek: 5, isOpen: true, slots: [{ open: '18:00', close: '23:30' }] },
          { dayOfWeek: 6, isOpen: true, slots: [{ open: '18:00', close: '23:30' }] }
        ],
        closedMessage: 'Infelizmente estamos fechados no momento. Abraremos em breve!',
        holidays: []
      },
      pix: {
        keyType: pixType,
        keyValue: pixValue,
        receiverName: pixReceiver
      },
      gateways: [
        { id: 'gw-1', name: 'MercadoPago', isEnabled: false, isProduction: false }
      ],
      floatingButtons: {
        whatsapp: { number: whatsapp, message: 'Olá! Gostaria de tirar uma dúvida.', icon: 'whatsapp', color: '#10B981', position: 'bottom-right', isVisible: true },
        instagram: { link: '', icon: 'instagram', color: '#E1306C', position: 'bottom-right', isVisible: false }
      },
      seo: {
        title: `${name} - Cardápio Online`,
        description: `Faça seu pedido online de forma rápida e segura no ${name}!`,
        keywords: `${name}, hamburgueria, lanchonete, delivery`
      },
      localPayments: {
        pixActive: true,
        cashActive: true,
        mealVoucherActive: false,
        foodVoucherActive: false,
        deliveryPaymentActive: false
      },
      checkoutTransparenteActive: false,
      selectedGatewayId: 'mercadopago'
    };

    // Prepare clean database state without dummy items
    const newState: DatabaseState = {
      categories: [],
      products: [],
      banners: [],
      coupons: [],
      orders: [],
      customers: [],
      finance: [],
      settings,
      auditLogs: [
        {
          id: `log-setup-${Date.now()}`,
          user: 'Setup Wizard',
          action: 'INSTALACAO_INICIAL',
          details: `Sistema configurado e inicializado com sucesso para: "${name}"`,
          timestamp: new Date().toISOString(),
          ip: '127.0.0.1',
          browser: navigator.userAgent,
          device: 'Desktop'
        }
      ],
      customPages: [
        {
          id: 'page-home',
          title: 'Página Inicial (Menu)',
          slug: 'home',
          isActive: true,
          components: [
            { id: 'c-1', type: 'categories', content: { title: 'Cardápio por Categorias' }, sortOrder: 1 },
            { id: 'c-2', type: 'products', content: { title: 'Produtos Disponíveis' }, sortOrder: 2 }
          ]
        }
      ]
    };

    const success = await onSaveState(newState);
    if (success) {
      onSetupComplete();
    } else {
      alert('Erro ao salvar as configurações iniciais. Verifique sua conexão com o servidor.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 sm:p-6 select-none font-sans" id="setup-wizard-root">
      <div className="w-full max-w-2xl bg-white rounded-[32px] shadow-2xl border border-slate-200 overflow-hidden flex flex-col justify-between min-h-[580px]">
        
        {/* Progress Tracker */}
        <div className="bg-slate-950 p-6 text-white border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ChefHat className="text-emerald-400" size={24} />
            <h1 className="text-md font-extrabold tracking-tight uppercase">Assistente de Instalação</h1>
          </div>

          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <div 
                key={s} 
                className={`w-5 h-1.5 rounded-full transition-all ${
                  step >= s ? 'bg-emerald-500' : 'bg-slate-850'
                }`} 
              />
            ))}
          </div>
        </div>

        {/* Form Body steps */}
        <div className="p-8 flex-grow flex flex-col justify-center text-xs">
          
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div className="space-y-1">
                <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest">Passo 1 de 5</p>
                <h3 className="text-lg font-black text-slate-900">Sobre o Restaurante</h3>
                <p className="text-slate-400 leading-normal text-[11px] font-semibold">Informe os dados cadastrais básicos para identificação dos seus clientes.</p>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-600">NOME DO RESTAURANTE / MARCA *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="EX: Burguer Craft Artesanal"
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-600">WHATSAPP PEDIDOS (DDI+DDD+NÚMERO) *</label>
                    <input
                      type="text"
                      required
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      placeholder="EX: 5511999999999"
                      className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block font-bold text-slate-600">E-MAIL DO ESTABELECIMENTO</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="EX: contato@restaurante.com"
                      className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-600">ENDEREÇO COMPLETO *</label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="EX: Av. Paulista, 1000 - Bela Vista - São Paulo/SP"
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div className="space-y-1">
                <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest">Passo 2 de 5</p>
                <h3 className="text-lg font-black text-slate-900">Identidade Visual & Cores</h3>
                <p className="text-slate-400 leading-normal text-[11px] font-semibold">Mude a cara do seu cardápio digital para combinar com seu logo.</p>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-[10px] font-black text-slate-600 uppercase tracking-wider">Logo do Restaurante *</label>
                    <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                      📐 500 x 500 px (1:1)
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mb-1">
                    Formato recomendado: Quadrado (PNG/WEBP com fundo transparente) sem corte nas bordas.
                  </p>
                  <div className="space-y-1.5">
                    {logo ? (
                      <div className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-50 h-24 flex items-center justify-center">
                        <img 
                          src={logo} 
                          alt="Logo do Restaurante" 
                          className="h-full w-full object-contain p-2"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const fileInput = document.getElementById('setup-logo-upload') as HTMLInputElement;
                              if (fileInput) fileInput.click();
                            }}
                            className="bg-white/90 hover:bg-white text-slate-800 text-[10px] font-bold px-2 py-1 rounded-md transition-colors"
                          >
                            Alterar
                          </button>
                          <button
                            type="button"
                            onClick={() => setLogo('')}
                            className="bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold px-2 py-1 rounded-md transition-colors"
                          >
                            Remover
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div 
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={async (e) => {
                          e.preventDefault();
                          const file = e.dataTransfer.files?.[0];
                          if (file && file.type.startsWith('image/')) {
                            try {
                              const imgData = await compressImage(file, 400, 400, 0.85);
                              setLogo(imgData);
                            } catch (err) {
                              alert('Erro ao processar imagem de logo.');
                            }
                          }
                        }}
                        onClick={() => {
                          const fileInput = document.getElementById('setup-logo-upload') as HTMLInputElement;
                          if (fileInput) fileInput.click();
                        }}
                        className="border-2 border-dashed border-slate-200 hover:border-emerald-400 rounded-xl p-3 h-24 flex flex-col items-center justify-center gap-1 cursor-pointer bg-slate-50 hover:bg-slate-50/50 transition-all text-center"
                      >
                        <span className="text-lg">📸</span>
                        <div>
                          <span className="text-[10px] font-bold text-slate-700 block">Clique ou arraste</span>
                          <span className="text-[8px] text-slate-400">Suporta PNG, JPG, WEBP</span>
                        </div>
                      </div>
                    )}

                    <input 
                      type="file"
                      id="setup-logo-upload"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            const imgData = await compressImage(file, 400, 400, 0.85);
                            setLogo(imgData);
                          } catch (err) {
                            alert('Erro ao processar imagem de logo.');
                          }
                        }
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-600">COR DO SEU CARDÁPIO (PRINCIPAL)</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="w-10 h-10 p-0.5 rounded-lg border cursor-pointer"
                      />
                      <input
                        type="text"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block font-bold text-slate-600">TEMA INICIAL</label>
                    <select
                      value={theme}
                      onChange={(e) => setTheme(e.target.value as any)}
                      className="w-full p-2.5 border border-slate-200 rounded-xl bg-white focus:outline-none"
                    >
                      <option value="light">Tema Claro (Light)</option>
                      <option value="dark">Tema Escuro (Dark)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-600">TIPO DE FONTE TIPOGRÁFICA</label>
                  <select
                    value={fontFamily}
                    onChange={(e) => setFontFamily(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-white focus:outline-none"
                  >
                    <option value="Inter">Inter (Elegante & Clean)</option>
                    <option value="Outfit">Outfit (Moderna)</option>
                    <option value="Space Grotesk">Space Grotesk (Arrojada)</option>
                    <option value="Playfair Display">Playfair Display (Serif/Luxo)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 animate-fade-in">
              <div className="space-y-1">
                <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest">Passo 3 de 5</p>
                <h3 className="text-lg font-black text-slate-900">Configuração de Entregas</h3>
                <p className="text-slate-400 leading-normal text-[11px] font-semibold">Defina o raio de quilometragem e o valor médio cobrado pela sua frota.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-600">RAIO DE ATENDIMENTO (KM)</label>
                  <input
                    type="number"
                    value={radiusKm}
                    onChange={(e) => setRadiusKm(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-600">TAXA ENTREGA BASE (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={baseFee}
                    onChange={(e) => setBaseFee(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-600">TEMPO PREPARO (MIN)</label>
                  <input
                    type="number"
                    value={prepTime}
                    onChange={(e) => setPrepTime(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex items-start gap-2 leading-relaxed text-slate-500 font-semibold">
                <Info size={16} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                <span>Estes valores servem para a calculadora automática de entrega própria. Você poderá cadastrar taxas customizadas por bairro ou desabilitar entregas no painel administrativo mais tarde.</span>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4 animate-fade-in">
              <div className="space-y-1">
                <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest">Passo 4 de 5</p>
                <h3 className="text-lg font-black text-slate-900">Ativação do Checkout PIX</h3>
                <p className="text-slate-400 leading-normal text-[11px] font-semibold">Configure sua chave para receber pagamentos PIX instantâneos dos seus clientes.</p>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-600">TIPO DE CHAVE</label>
                    <select
                      value={pixType}
                      onChange={(e) => setPixType(e.target.value as any)}
                      className="w-full p-2.5 border border-slate-200 rounded-xl bg-white focus:outline-none"
                    >
                      <option value="cpf">CPF</option>
                      <option value="cnpj">CNPJ</option>
                      <option value="phone">Celular</option>
                      <option value="email">E-mail</option>
                      <option value="random">Chave Aleatória (EVP)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block font-bold text-slate-600">VALOR DA CHAVE PIX *</label>
                    <input
                      type="text"
                      required
                      value={pixValue}
                      onChange={(e) => setPixValue(e.target.value)}
                      placeholder="Sua chave Pix para faturar"
                      className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-600">NOME DO RECEBEDOR TITULAR *</label>
                  <input
                    type="text"
                    required
                    value={pixReceiver}
                    onChange={(e) => setPixReceiver(e.target.value)}
                    placeholder="EX: João Silva Lanches ME"
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4 text-center py-6 animate-fade-in">
              <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 size={36} />
              </div>

              <div className="space-y-1.5">
                <p className="text-[10px] text-green-600 font-black uppercase tracking-widest">Instalação Pronta!</p>
                <h3 className="text-lg font-black text-slate-900">Pronto para Lançar seu Negócio!</h3>
                <p className="text-slate-400 leading-relaxed text-[11px] max-w-sm mx-auto font-semibold">
                  O assistente configurou os parâmetros iniciais. A base de dados foi provisionada completamente vazia (sem produtos, categorias ou pedidos fictícios), pronta para que você cadastre seus pratos autorais.
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-bold text-slate-500 max-w-md mx-auto">
                🔒 Seus dados serão persistidos com segurança no banco de dados em nuvem. É possível alterar qualquer uma das informações a qualquer momento através do Painel Administrativo.
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 p-6 border-t border-slate-200/60 flex items-center justify-between text-xs">
          {step > 1 && step < 5 ? (
            <button
              onClick={handlePrev}
              className="bg-white hover:bg-slate-100 text-slate-700 font-bold py-2.5 px-4 rounded-xl border border-slate-200 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <ArrowLeft size={14} /> Voltar
            </button>
          ) : (
            <div />
          )}

          {step < 5 ? (
            <button
              onClick={handleNext}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              Avançar <ArrowRight size={14} />
            </button>
          ) : (
            <button
              onClick={handleCompleteSetup}
              className="w-full bg-slate-900 hover:bg-slate-950 text-white font-extrabold py-3.5 px-6 rounded-2xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md"
            >
              🚀 Finalizar e Abrir Painel Administrativo
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
