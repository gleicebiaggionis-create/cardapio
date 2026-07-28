import React, { useState } from 'react';
import { 
  Sparkles, Image, Globe, Heart, ArrowUp, ArrowDown, Plus, Trash2, 
  Copy, Eye, EyeOff, Save, Link, Palette, Video, Settings, 
  Layers, HelpCircle, LayoutGrid, FileText, Code, CheckSquare, ListOrdered 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DatabaseState, CustomPage, PageComponent, RestaurantSettings, AuditLogEntry } from '../types';
import { compressImage } from '../lib/imageUtils';

interface AdminCMSProps {
  dbState: DatabaseState;
  onSaveState: (newState: DatabaseState) => Promise<boolean>;
  activeUser: string;
}

export default function AdminCMS({ dbState, onSaveState, activeUser }: AdminCMSProps) {
  const [activeSection, setActiveSection] = useState<'branding' | 'builder' | 'seo'>('branding');
  
  // Branding local form state
  const [settingsForm, setSettingsForm] = useState<RestaurantSettings>(dbState.settings);

  // Pages Builder states
  const customPages: CustomPage[] = dbState.customPages || [
    {
      id: 'page-home',
      title: 'Página Inicial (Menu)',
      slug: 'home',
      isActive: true,
      components: [
        { id: 'c-1', type: 'banner', content: { title: 'Smash Bacon Supreme', subtitle: 'Peça hoje com taxa de entrega reduzida', btnText: 'Ver Cardápio', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=800' }, sortOrder: 1 },
        { id: 'c-2', type: 'categories', content: { title: 'Explore por Categorias' }, sortOrder: 2 },
        { id: 'c-3', type: 'products', content: { title: 'Os Mais Pedidos da Semana', categoryId: 'cat-burgers' }, sortOrder: 3 },
        { id: 'c-4', type: 'reviews', content: { title: 'Depoimentos dos Clientes' }, sortOrder: 4 }
      ]
    }
  ];

  const [selectedPageId, setSelectedPageId] = useState<string>('page-home');
  const [newPageTitle, setNewPageTitle] = useState('');
  const [newPageSlug, setNewPageSlug] = useState('');
  const [isCreatingPage, setIsCreatingPage] = useState(false);
  const [editingComponent, setEditingComponent] = useState<PageComponent | null>(null);

  const selectedPage = customPages.find(p => p.id === selectedPageId) || customPages[0];

  // Save visual settings form
  const handleSaveBranding = async () => {
    // Generate audit log entry
    const newLog: AuditLogEntry = {
      id: `log-${Date.now()}`,
      user: activeUser,
      action: 'ATUALIZACAO_CMS_BRANDING',
      details: `Atualizou as configurações de identidade visual, cores e branding do site.`,
      timestamp: new Date().toISOString(),
      ip: '192.168.1.15',
      browser: navigator.userAgent,
      device: window.innerWidth < 768 ? 'Mobile' : 'Desktop'
    };

    const updatedState: DatabaseState = {
      ...dbState,
      settings: settingsForm,
      auditLogs: [newLog, ...(dbState.auditLogs || [])]
    };

    const success = await onSaveState(updatedState);
    if (success) {
      alert('Configurações de Identidade Visual e Branding salvas com sucesso!');
    }
  };

  // Visual Page Builder operations
  const handleCreatePage = async () => {
    if (!newPageTitle.trim() || !newPageSlug.trim()) {
      alert('Informe o título e o slug da nova página.');
      return;
    }
    const cleanSlug = newPageSlug.toLowerCase().replace(/[^a-z0-9-_]/g, '-');
    
    const newPage: CustomPage = {
      id: `page-${Date.now()}`,
      title: newPageTitle,
      slug: cleanSlug,
      isActive: true,
      components: [
        { id: `comp-${Date.now()}-1`, type: 'text', content: { title: 'Bem-vindo à nossa página!', text: 'Edite este texto visualmente para criar sua Landing Page promocional.' }, sortOrder: 1 }
      ]
    };

    const updatedPages = [...customPages, newPage];

    const newLog: AuditLogEntry = {
      id: `log-${Date.now()}`,
      user: activeUser,
      action: 'CMS_CRIAR_PAGINA',
      details: `Criou nova página promocional: "${newPageTitle}" (${cleanSlug})`,
      timestamp: new Date().toISOString(),
      ip: '192.168.1.15',
      browser: navigator.userAgent,
      device: 'Desktop'
    };

    await onSaveState({
      ...dbState,
      customPages: updatedPages,
      auditLogs: [newLog, ...(dbState.auditLogs || [])]
    });

    setSelectedPageId(newPage.id);
    setIsCreatingPage(false);
    setNewPageTitle('');
    setNewPageSlug('');
    alert(`Página "${newPageTitle}" criada!`);
  };

  const handleDuplicatePage = async (pageToDup: CustomPage) => {
    const dupPage: CustomPage = {
      ...pageToDup,
      id: `page-${Date.now()}`,
      title: `${pageToDup.title} (Cópia)`,
      slug: `${pageToDup.slug}-copia`,
      components: pageToDup.components.map(c => ({ ...c, id: `comp-${Math.random()}` }))
    };

    const updatedPages = [...customPages, dupPage];
    await onSaveState({
      ...dbState,
      customPages: updatedPages,
      auditLogs: [{
        id: `log-${Date.now()}`,
        user: activeUser,
        action: 'CMS_DUPLICAR_PAGINA',
        details: `Duplicou a página "${pageToDup.title}"`,
        timestamp: new Date().toISOString(),
        ip: '192.168.1.15',
        browser: navigator.userAgent,
        device: 'Desktop'
      }, ...(dbState.auditLogs || [])]
    });
    alert('Página duplicada com sucesso!');
  };

  const handleDeletePage = async (pageId: string) => {
    if (pageId === 'page-home') {
      alert('A Página Inicial não pode ser excluída.');
      return;
    }
    if (!confirm('Deseja realmente excluir esta página? Esta ação é irreversível.')) return;

    const updatedPages = customPages.filter(p => p.id !== pageId);
    await onSaveState({
      ...dbState,
      customPages: updatedPages,
      auditLogs: [{
        id: `log-${Date.now()}`,
        user: activeUser,
        action: 'CMS_EXCLUIR_PAGINA',
        details: `Excluiu a página com ID ${pageId}`,
        timestamp: new Date().toISOString(),
        ip: '192.168.1.15',
        browser: navigator.userAgent,
        device: 'Desktop'
      }, ...(dbState.auditLogs || [])]
    });
    setSelectedPageId('page-home');
  };

  const handleTogglePageStatus = async (page: CustomPage) => {
    const updatedPages = customPages.map(p => p.id === page.id ? { ...p, isActive: !p.isActive } : p);
    await onSaveState({
      ...dbState,
      customPages: updatedPages
    });
  };

  // Add component to current page
  const handleAddComponent = async (type: PageComponent['type']) => {
    let initialContent: any = {};
    switch (type) {
      case 'banner':
        initialContent = { title: 'Título do Banner', subtitle: 'Subtítulo do banner promocional', btnText: 'Clique Aqui', btnLink: '#', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=600' };
        break;
      case 'text':
        initialContent = { title: 'Título da Seção', text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.' };
        break;
      case 'video':
        initialContent = { title: 'Vídeo Institucional', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ' };
        break;
      case 'timer':
        initialContent = { title: 'Oferta termina em:', targetDate: '2026-12-31T23:59:59', label: 'Não perca tempo!' };
        break;
      case 'faq':
        initialContent = { title: 'Dúvidas Frequentes', questions: [{ q: 'Qual o tempo de entrega?', a: 'Normalmente entre 30 a 50 minutos.' }, { q: 'Aceitam PIX?', a: 'Sim, via QR Code e chave Pix Copie e Cole.' }] };
        break;
      case 'html':
        initialContent = { title: 'Código Embutido', html: '<div class="p-4 bg-yellow-50 text-yellow-800 rounded-xl">HTML Personalizado</div>' };
        break;
      case 'button':
        initialContent = { text: 'Pedir Agora via WhatsApp', link: 'https://wa.me/5511999999999', color: '#10B981' };
        break;
      case 'card':
        initialContent = { title: 'Promoção do Dia', subtitle: 'Apenas R$ 19,90', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=400' };
        break;
      default:
        initialContent = { title: 'Novo Componente' };
    }

    const newComp: PageComponent = {
      id: `comp-${Date.now()}`,
      type,
      content: initialContent,
      sortOrder: selectedPage.components.length + 1
    };

    const updatedPages = customPages.map(p => {
      if (p.id === selectedPageId) {
        return {
          ...p,
          components: [...p.components, newComp]
        };
      }
      return p;
    });

    await onSaveState({
      ...dbState,
      customPages: updatedPages
    });
  };

  const handleRemoveComponent = async (compId: string) => {
    const updatedPages = customPages.map(p => {
      if (p.id === selectedPageId) {
        return {
          ...p,
          components: p.components.filter(c => c.id !== compId)
        };
      }
      return p;
    });

    await onSaveState({
      ...dbState,
      customPages: updatedPages
    });
  };

  const handleMoveComponent = async (index: number, direction: 'up' | 'down') => {
    const comps = [...selectedPage.components];
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === comps.length - 1) return;

    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    const temp = comps[index];
    comps[index] = comps[swapIndex];
    comps[swapIndex] = temp;

    // Reassign sort orders
    const updatedComps = comps.map((c, idx) => ({ ...c, sortOrder: idx + 1 }));

    const updatedPages = customPages.map(p => {
      if (p.id === selectedPageId) {
        return { ...p, components: updatedComps };
      }
      return p;
    });

    await onSaveState({
      ...dbState,
      customPages: updatedPages
    });
  };

  const handleSaveComponentEdit = async () => {
    if (!editingComponent) return;

    const updatedPages = customPages.map(p => {
      if (p.id === selectedPageId) {
        return {
          ...p,
          components: p.components.map(c => c.id === editingComponent.id ? editingComponent : c)
        };
      }
      return p;
    });

    await onSaveState({
      ...dbState,
      customPages: updatedPages
    });

    setEditingComponent(null);
  };

  return (
    <div className="space-y-8" id="admin-cms-panel">
      {/* Title Header */}
      <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-sm border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="text-amber-400" size={24} />
            <h2 className="text-xl font-bold tracking-tight">Gestor de Conteúdo & Construtor de Páginas (CMS)</h2>
          </div>
          <p className="text-slate-400 text-xs">
            Crie landing pages promocionais, mude cores, configure menus, rodapés, banners e gerencie o design do site em tempo real.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-px">
        {[
          { id: 'branding', label: '🎨 Identidade Visual & Design', icon: Palette },
          { id: 'builder', label: '🧱 Construtor Visual (Page Builder)', icon: LayoutGrid },
          { id: 'seo', label: '🌐 SEO & Redes Sociais', icon: Globe }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id as any)}
              className={`px-4 py-2.5 font-bold text-xs flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeSection === tab.id
                  ? 'border-emerald-600 text-emerald-600 font-extrabold'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content Panels */}
      {activeSection === 'branding' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
          <div className="border-b pb-4 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <Palette size={16} className="text-emerald-600" /> Branding, Logo e Cores do Estabelecimento
            </h3>
            <button
              onClick={handleSaveBranding}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Save size={14} /> Salvar Alterações
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* Left Col */}
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="block font-bold text-slate-600">NOME DO RESTAURANTE</label>
                <input
                  type="text"
                  value={settingsForm.name}
                  onChange={(e) => setSettingsForm({ ...settingsForm, name: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-600">LOGO DO ESTABELECIMENTO</label>
                  <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                    📐 500 x 500 px (1:1)
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-50 h-16 w-16 flex items-center justify-center">
                    {settingsForm.branding.logo ? (
                      settingsForm.branding.logo.startsWith('http') || settingsForm.branding.logo.startsWith('data:') ? (
                        <img 
                          src={settingsForm.branding.logo} 
                          alt="Logo do Estabelecimento" 
                          className="h-full w-full object-contain"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span className="text-3xl">{settingsForm.branding.logo}</span>
                      )
                    ) : (
                      <span className="text-2xl text-slate-300">🍔</span>
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <input 
                      type="file"
                      id="cms-logo-upload"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            const imgData = await compressImage(file, 400, 400, 0.85);
                            setSettingsForm(prev => ({
                              ...prev,
                              branding: { ...prev.branding, logo: imgData }
                            }));
                          } catch (err) {
                            alert('Erro ao processar imagem de logo.');
                          }
                        }
                      }}
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const fileInput = document.getElementById('cms-logo-upload') as HTMLInputElement;
                          if (fileInput) fileInput.click();
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                      >
                        Fazer Upload
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const val = prompt('Digite um emoji (ex: 🍕) para o logo:');
                          if (val) {
                            setSettingsForm({
                              ...settingsForm,
                              branding: { ...settingsForm.branding, logo: val }
                            });
                          }
                        }}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-[11px] font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                      >
                        Definir Emoji
                      </button>
                    </div>
                    <p className="text-[9px] text-slate-400">Arraste uma imagem ou clique para fazer upload.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-600">BANNER DE CAPA PRINCIPAL</label>
                  <span className="text-[9px] font-bold bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full">
                    📐 1200 x 400 px (3:1)
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  {settingsForm.branding.bannerImage && (
                    <div className="relative rounded-xl overflow-hidden border border-slate-200 h-24 bg-slate-100 flex items-center justify-center">
                      <img 
                        src={settingsForm.branding.bannerImage} 
                        alt="Capa principal preview" 
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}
                  <input 
                    type="file"
                    id="cms-banner-upload"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        try {
                          const imgData = await compressImage(file, 1200, 800, 0.8);
                          setSettingsForm(prev => ({
                            ...prev,
                            branding: { ...prev.branding, bannerImage: imgData }
                          }));
                        } catch (err) {
                          alert('Erro ao processar imagem da capa.');
                        }
                      }
                    }}
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const fileInput = document.getElementById('cms-banner-upload') as HTMLInputElement;
                        if (fileInput) fileInput.click();
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                    >
                      Fazer Upload da Capa
                    </button>
                    {/* File upload only */}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-600">COR PRIMÁRIA (HEX)</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={settingsForm.branding.primaryColor}
                      onChange={(e) => setSettingsForm({
                        ...settingsForm,
                        branding: { ...settingsForm.branding, primaryColor: e.target.value }
                      })}
                      className="w-10 h-9 p-0.5 border border-slate-200 rounded-lg focus:outline-none cursor-pointer"
                    />
                    <input
                      type="text"
                      value={settingsForm.branding.primaryColor}
                      onChange={(e) => setSettingsForm({
                        ...settingsForm,
                        branding: { ...settingsForm.branding, primaryColor: e.target.value }
                      })}
                      className="w-full p-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-600">COR SECUNDÁRIA (HEX)</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={settingsForm.branding.secondaryColor}
                      onChange={(e) => setSettingsForm({
                        ...settingsForm,
                        branding: { ...settingsForm.branding, secondaryColor: e.target.value }
                      })}
                      className="w-10 h-9 p-0.5 border border-slate-200 rounded-lg focus:outline-none cursor-pointer"
                    />
                    <input
                      type="text"
                      value={settingsForm.branding.secondaryColor}
                      onChange={(e) => setSettingsForm({
                        ...settingsForm,
                        branding: { ...settingsForm.branding, secondaryColor: e.target.value }
                      })}
                      className="w-full p-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Col */}
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="block font-bold text-slate-600">ENDEREÇO COMPLETO</label>
                <input
                  type="text"
                  value={settingsForm.address}
                  onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-600">WHATSAPP OFICIAL</label>
                <input
                  type="text"
                  value={settingsForm.whatsapp}
                  onChange={(e) => setSettingsForm({ ...settingsForm, whatsapp: e.target.value })}
                  placeholder="EX: 5511999999999"
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block font-bold text-slate-600">FONTE DO SITE</label>
                  <select
                    value={settingsForm.branding.fontFamily}
                    onChange={(e) => setSettingsForm({
                      ...settingsForm,
                      branding: { ...settingsForm.branding, fontFamily: e.target.value }
                    })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                  >
                    <option value="Inter">Inter (Sans-Serif Moderna)</option>
                    <option value="Poppins">Poppins (Arredondada & Jovem)</option>
                    <option value="Plus Jakarta Sans">Plus Jakarta Sans (Gourmet Clean)</option>
                    <option value="Outfit">Outfit (Elegante & Contemporânea)</option>
                    <option value="Montserrat">Montserrat (Forte & Marcante)</option>
                    <option value="Work Sans">Work Sans (Estruturada)</option>
                    <option value="DM Sans">DM Sans (Minimalista)</option>
                    <option value="Playfair Display">Playfair Display (Serif Gourmet)</option>
                    <option value="Lora">Lora (Bistro Clássico)</option>
                    <option value="Cinzel">Cinzel (Luxo Premium)</option>
                    <option value="Space Grotesk">Space Grotesk (Tech Urbana)</option>
                    <option value="JetBrains Mono">JetBrains Mono (Console Brutalista)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-600">TEMA INICIAL</label>
                  <select
                    value={settingsForm.branding.theme}
                    onChange={(e) => setSettingsForm({
                      ...settingsForm,
                      branding: { ...settingsForm.branding, theme: e.target.value as any }
                    })}
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                  >
                    <option value="light">Tema Claro (Light)</option>
                    <option value="dark">Tema Escuro (Dark)</option>
                  </select>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                <p className="font-bold text-slate-800 text-xs mb-1">Visualização Rápida</p>
                <div 
                  className="p-4 rounded-xl shadow-xs text-center border space-y-1 transition-all"
                  style={{
                    backgroundColor: settingsForm.branding.theme === 'dark' ? '#0F172A' : '#FFFFFF',
                    borderColor: '#E2E8F0',
                    fontFamily: settingsForm.branding.fontFamily
                  }}
                >
                  <p className="font-extrabold text-[15px]" style={{ color: settingsForm.branding.theme === 'dark' ? '#F8FAFC' : '#0F172A' }}>
                    {settingsForm.name || 'Nome do Restaurante'}
                  </p>
                  <button 
                    className="px-4 py-1.5 rounded-full text-[10px] font-bold text-white transition-opacity"
                    style={{ backgroundColor: settingsForm.branding.primaryColor }}
                  >
                    Botão de Ação
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSection === 'builder' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-xs">
          {/* Left Col: Pages List and Manager */}
          <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
            <div className="space-y-1">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <Layers size={16} className="text-emerald-600" /> Páginas do Sistema
              </h3>
              <p className="text-slate-500">Duplique, crie e oculte landing pages instantaneamente.</p>
            </div>

            <div className="space-y-2">
              {customPages.map(page => (
                <div 
                  key={page.id} 
                  onClick={() => setSelectedPageId(page.id)}
                  className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all cursor-pointer ${
                    selectedPageId === page.id
                      ? 'border-emerald-600 bg-emerald-50/20'
                      : 'border-slate-100 hover:border-slate-200 bg-slate-50/50'
                  }`}
                >
                  <div className="space-y-1 truncate max-w-[150px]">
                    <p className={`font-bold ${selectedPageId === page.id ? 'text-emerald-900 font-black' : 'text-slate-700'}`}>
                      {page.title}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono">/{page.slug}</p>
                  </div>

                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <button 
                      onClick={() => handleTogglePageStatus(page)}
                      className={`p-1.5 rounded-lg border transition-all ${
                        page.isActive 
                          ? 'bg-green-50 text-green-600 border-green-100' 
                          : 'bg-rose-50 text-rose-500 border-rose-100'
                      }`}
                      title={page.isActive ? 'Ocultar Página' : 'Exibir Página'}
                    >
                      {page.isActive ? <Eye size={12} /> : <EyeOff size={12} />}
                    </button>
                    <button 
                      onClick={() => handleDuplicatePage(page)}
                      className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-500 transition-all"
                      title="Duplicar"
                    >
                      <Copy size={12} />
                    </button>
                    {page.id !== 'page-home' && (
                      <button 
                        onClick={() => handleDeletePage(page.id)}
                        className="p-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-rose-500 transition-all"
                        title="Excluir"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Add new page */}
            {isCreatingPage ? (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <p className="font-bold text-slate-700 text-xs">Nova Página Promocional</p>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={newPageTitle}
                    onChange={(e) => setNewPageTitle(e.target.value)}
                    placeholder="Título (ex: Promoção Black Friday)"
                    className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none"
                  />
                  <input
                    type="text"
                    value={newPageSlug}
                    onChange={(e) => setNewPageSlug(e.target.value)}
                    placeholder="Slug URL (ex: black-friday)"
                    className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none font-mono"
                  />
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={handleCreatePage}
                    className="w-full bg-emerald-600 text-white font-bold py-1.5 rounded-xl hover:bg-emerald-700 transition-all cursor-pointer"
                  >
                    Criar Página
                  </button>
                  <button 
                    onClick={() => setIsCreatingPage(false)}
                    className="w-full bg-slate-200 text-slate-600 font-bold py-1.5 rounded-xl hover:bg-slate-300 transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsCreatingPage(true)}
                className="w-full border-2 border-dashed border-slate-200 hover:border-emerald-600/50 hover:bg-emerald-50/10 text-slate-500 hover:text-emerald-600 font-bold p-3.5 rounded-2xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus size={14} /> Nova Página Promocional
              </button>
            )}
          </div>

          {/* Right Col: Active Page Designer & Components */}
          <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
              <div>
                <h3 className="font-black text-slate-800 text-[15px] flex items-center gap-1.5">
                  📁 Editando: <span className="text-emerald-600 font-bold">{selectedPage.title}</span>
                </h3>
                <p className="text-slate-400 text-[11px] mt-0.5">Link público: {window.location.origin}/pag/{selectedPage.slug}</p>
              </div>

              {/* Add components menu */}
              <div className="flex flex-wrap gap-1">
                {[
                  { type: 'banner', label: 'Banner 🖼️' },
                  { type: 'text', label: 'Texto 📝' },
                  { type: 'video', label: 'Vídeo 🎥' },
                  { type: 'timer', label: 'Timer ⏳' },
                  { type: 'faq', label: 'Perguntas ❓' },
                  { type: 'html', label: 'HTML 💻' },
                  { type: 'button', label: 'Botão 🏷️' },
                  { type: 'card', label: 'Card 🌟' }
                ].map(item => (
                  <button
                    key={item.type}
                    onClick={() => handleAddComponent(item.type as any)}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-600 text-slate-600 font-bold rounded-lg transition-all text-[11px] cursor-pointer"
                    title={`Adicionar ${item.label}`}
                  >
                    + {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Layout Order Manager */}
            <div className="space-y-3">
              {selectedPage.components.length === 0 ? (
                <div className="border border-dashed border-slate-200 rounded-2xl p-12 text-center text-slate-400 font-semibold">
                  Nenhum componente nesta página. Adicione novos elementos acima para começar a construir.
                </div>
              ) : (
                selectedPage.components.map((comp, index) => (
                  <div key={comp.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 truncate">
                      <span className="bg-slate-200 text-slate-600 text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-wider">
                        {comp.type}
                      </span>
                      <div className="truncate">
                        <p className="font-extrabold text-slate-700">
                          {comp.content.title || comp.content.text || comp.content.btnText || 'Seção Sem Título'}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate max-w-xs">{JSON.stringify(comp.content)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button 
                        onClick={() => handleMoveComponent(index, 'up')}
                        disabled={index === 0}
                        className="p-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 disabled:opacity-30 cursor-pointer"
                      >
                        <ArrowUp size={12} />
                      </button>
                      <button 
                        onClick={() => handleMoveComponent(index, 'down')}
                        disabled={index === selectedPage.components.length - 1}
                        className="p-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 disabled:opacity-30 cursor-pointer"
                      >
                        <ArrowDown size={12} />
                      </button>
                      <button 
                        onClick={() => setEditingComponent(comp)}
                        className="px-2.5 py-1 bg-emerald-50 border border-emerald-100 text-emerald-600 font-bold rounded-lg hover:bg-emerald-100 transition-all text-[11px] cursor-pointer"
                      >
                        Editar
                      </button>
                      <button 
                        onClick={() => handleRemoveComponent(comp.id)}
                        className="p-1 rounded-lg border border-rose-100 bg-white hover:bg-rose-50 text-rose-500 cursor-pointer"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {activeSection === 'seo' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
          <div className="border-b pb-4 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <Globe size={16} className="text-emerald-600" /> SEO Integrado, Metatags e Integrações Externas
            </h3>
            <button
              onClick={handleSaveBranding}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Save size={14} /> Salvar Alterações
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* Meta Tags */}
            <div className="space-y-4">
              <p className="font-bold text-emerald-900 text-xs uppercase tracking-wider border-b pb-1">Metatags de SEO</p>
              
              <div className="space-y-1">
                <label className="block font-bold text-slate-600">META TITULO (TITLE TAG)</label>
                <input
                  type="text"
                  value={settingsForm.seo.title}
                  onChange={(e) => setSettingsForm({
                    ...settingsForm,
                    seo: { ...settingsForm.seo, title: e.target.value }
                  })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-600">META DESCRIÇÃO (DESCRIPTION)</label>
                <textarea
                  value={settingsForm.seo.description}
                  onChange={(e) => setSettingsForm({
                    ...settingsForm,
                    seo: { ...settingsForm.seo, description: e.target.value }
                  })}
                  rows={3}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-600">PALAVRAS-CHAVE (SEPARADAS POR VÍRGULA)</label>
                <input
                  type="text"
                  value={settingsForm.seo.keywords}
                  onChange={(e) => setSettingsForm({
                    ...settingsForm,
                    seo: { ...settingsForm.seo, keywords: e.target.value }
                  })}
                  placeholder="hamburgueria, delivery, lanches, pizza"
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Pixels and Google Analytics */}
            <div className="space-y-4">
              <p className="font-bold text-emerald-900 text-xs uppercase tracking-wider border-b pb-1">Scripts e Pixels de Rastreamento</p>

              <div className="space-y-1">
                <label className="block font-bold text-slate-600">GOOGLE ANALYTICS ID (G-XXXXXX)</label>
                <input
                  type="text"
                  value={settingsForm.seo.googleAnalyticsId || ''}
                  onChange={(e) => setSettingsForm({
                    ...settingsForm,
                    seo: { ...settingsForm.seo, googleAnalyticsId: e.target.value }
                  })}
                  placeholder="G-ABC123XYZ"
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-600">FACEBOOK METAPixel ID</label>
                <input
                  type="text"
                  value={settingsForm.seo.metaPixelId || ''}
                  onChange={(e) => setSettingsForm({
                    ...settingsForm,
                    seo: { ...settingsForm.seo, metaPixelId: e.target.value }
                  })}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <p className="font-bold text-slate-800 text-xs">📬 Configurações do SMTP (Disparo de E-mails)</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-bold uppercase">HOST SMTP</label>
                    <input
                      type="text"
                      value={settingsForm.seo.smtpHost || ''}
                      onChange={(e) => setSettingsForm({
                        ...settingsForm,
                        seo: { ...settingsForm.seo, smtpHost: e.target.value }
                      })}
                      placeholder="smtp.gmail.com"
                      className="w-full p-2 border border-slate-200 rounded-xl bg-white focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 font-bold uppercase">PORTA SMTP</label>
                    <input
                      type="text"
                      value={settingsForm.seo.smtpPort || ''}
                      onChange={(e) => setSettingsForm({
                        ...settingsForm,
                        seo: { ...settingsForm.seo, smtpPort: e.target.value }
                      })}
                      placeholder="587"
                      className="w-full p-2 border border-slate-200 rounded-xl bg-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Component Visual Customizer Modal */}
      <AnimatePresence>
        {editingComponent && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white p-6 rounded-3xl shadow-xl w-full max-w-lg border border-slate-200 text-slate-800 space-y-4"
            >
              <div className="flex items-center justify-between border-b pb-3">
                <h4 className="font-black text-sm text-slate-900 uppercase tracking-wider">
                  🔧 Editando Elemento: {editingComponent.type}
                </h4>
                <button onClick={() => setEditingComponent(null)} className="text-slate-400 hover:text-slate-600 p-1 rounded-full cursor-pointer">
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-3 text-xs max-h-[400px] overflow-y-auto pr-1">
                {editingComponent.content.title !== undefined && (
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-600">TÍTULO PRINCIPAL</label>
                    <input
                      type="text"
                      value={editingComponent.content.title}
                      onChange={(e) => setEditingComponent({
                        ...editingComponent,
                        content: { ...editingComponent.content, title: e.target.value }
                      })}
                      className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                )}

                {editingComponent.content.subtitle !== undefined && (
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-600">SUBTÍTULO / SLOGAN</label>
                    <input
                      type="text"
                      value={editingComponent.content.subtitle}
                      onChange={(e) => setEditingComponent({
                        ...editingComponent,
                        content: { ...editingComponent.content, subtitle: e.target.value }
                      })}
                      className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                )}

                {editingComponent.content.text !== undefined && (
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-600">CONTEÚDO DE TEXTO</label>
                    <textarea
                      value={editingComponent.content.text}
                      onChange={(e) => setEditingComponent({
                        ...editingComponent,
                        content: { ...editingComponent.content, text: e.target.value }
                      })}
                      rows={4}
                      className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                )}

                {editingComponent.content.image !== undefined && (
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-600">IMAGEM DO COMPONENTE</label>
                    <div className="space-y-2">
                      {editingComponent.content.image && (
                        <div className="relative rounded-xl overflow-hidden border border-slate-200 h-24 bg-slate-100 flex items-center justify-center">
                          <img 
                            src={editingComponent.content.image} 
                            alt="Component preview" 
                            className="h-full object-contain" 
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}
                      <input 
                        type="file"
                        id="cms-comp-image-upload"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            try {
                              const imgData = await compressImage(file, 800, 800, 0.8);
                              setEditingComponent(prev => prev ? ({
                                ...prev,
                                content: { ...prev.content, image: imgData }
                              }) : null);
                            } catch (err) {
                              alert('Erro ao processar imagem.');
                            }
                          }
                        }}
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const fileInput = document.getElementById('cms-comp-image-upload') as HTMLInputElement;
                            if (fileInput) fileInput.click();
                          }}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                        >
                          Fazer Upload da Imagem
                        </button>
                        {/* File upload only */}
                      </div>
                    </div>
                  </div>
                )}

                {editingComponent.content.videoUrl !== undefined && (
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-600">YOUTUBE EMBED URL</label>
                    <input
                      type="text"
                      value={editingComponent.content.videoUrl}
                      onChange={(e) => setEditingComponent({
                        ...editingComponent,
                        content: { ...editingComponent.content, videoUrl: e.target.value }
                      })}
                      className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                    />
                  </div>
                )}

                {editingComponent.content.html !== undefined && (
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-600">HTML PERSONALIZADO (CÓDIGO INCOPORADO)</label>
                    <textarea
                      value={editingComponent.content.html}
                      onChange={(e) => setEditingComponent({
                        ...editingComponent,
                        content: { ...editingComponent.content, html: e.target.value }
                      })}
                      rows={6}
                      className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                    />
                  </div>
                )}

                {editingComponent.content.targetDate !== undefined && (
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-600">DATA ALVO CONTAGEM REGRESSIVA</label>
                    <input
                      type="datetime-local"
                      value={editingComponent.content.targetDate}
                      onChange={(e) => setEditingComponent({
                        ...editingComponent,
                        content: { ...editingComponent.content, targetDate: e.target.value }
                      })}
                      className="w-full p-2 border border-slate-200 rounded-lg focus:outline-none"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2 border-t text-xs">
                <button
                  onClick={handleSaveComponentEdit}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl transition-all cursor-pointer"
                >
                  Salvar Seção
                </button>
                <button
                  onClick={() => setEditingComponent(null)}
                  className="w-full bg-slate-100 text-slate-600 font-bold py-2 rounded-xl hover:bg-slate-200 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Simple close button helper
function X({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  );
}
