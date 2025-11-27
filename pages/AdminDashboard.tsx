
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Trash2, Sparkles, Download, Users, Calendar, LogOut, Lock, Loader2, ListFilter, X, FileText, Plus, Edit, Settings2, ToggleLeft, ToggleRight, Save, Filter, AlertTriangle } from 'lucide-react';
import { parseEventsFromText } from '../services/geminiService';
import { HousingEvent, FormField } from '../types';

export const AdminDashboard: React.FC = () => {
  const { events, registrations, deleteEvent, deleteEventsBatch, updateEvent, addEvent, addEventsBatch, isAdmin, loginAdmin, logoutAdmin, getEventStatus } = useApp();
  const [activeTab, setActiveTab] = useState<'events' | 'registrations'>('events');
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiInputText, setAiInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState(false);
  
  // New state for filtering registrations
  const [filterEventId, setFilterEventId] = useState<string | null>(null);

  // New state for filtering events
  const [eventFilter, setEventFilter] = useState<'ALL' | 'UPCOMING' | 'PAST'>('ALL');
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);

  // State for Create/Edit Modal
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<Partial<HousingEvent>>({});
  const [isEditing, setIsEditing] = useState(false);

  const handleViewRegistrations = (eventId: string) => {
    setFilterEventId(eventId);
    setActiveTab('registrations');
  };

  const clearFilter = () => {
    setFilterEventId(null);
  };

  // Logic to identify past events
  const getPastEvents = () => {
    const today = new Date();
    today.setHours(0,0,0,0);
    return events.filter(e => new Date(e.date) < today);
  };

  const pastEvents = getPastEvents();

  // Filter events based on tab selection
  const getFilteredEvents = () => {
    const today = new Date();
    today.setHours(0,0,0,0);

    if (eventFilter === 'UPCOMING') {
      return events.filter(e => new Date(e.date) >= today);
    }
    if (eventFilter === 'PAST') {
      return events.filter(e => new Date(e.date) < today);
    }
    return events;
  };

  const filteredEvents = getFilteredEvents();

  // Handle Bulk Delete
  const handleBulkDelete = () => {
    const idsToDelete = pastEvents.map(e => e.id);
    deleteEventsBatch(idsToDelete);
    setIsBulkDeleteModalOpen(false);
    // Reset filter if we just deleted all displayed past events
    if (eventFilter === 'PAST') setEventFilter('ALL');
  };

  // Filter registrations based on selected event
  const filteredRegistrations = filterEventId 
    ? registrations.filter(r => r.eventId === filterEventId)
    : registrations;

  const filteredEvent = filterEventId ? events.find(e => e.id === filterEventId) : null;

  // CSV Export Logic
  const downloadCSV = () => {
    const rows: Record<string, any>[] = filteredRegistrations.map(reg => {
      const event = events.find(e => e.id === reg.eventId);
      const dateStr = new Date(reg.timestamp).toLocaleString('zh-TW');
      const baseInfo = {
        '活動名稱': event ? event.title : 'Unknown Event',
        '報名時間': dateStr,
        ...reg.formData 
      };
      return baseInfo;
    });

    if (rows.length === 0) {
      alert("沒有資料可匯出");
      return;
    }

    const headers = Array.from(new Set(rows.flatMap(row => Object.keys(row))));
    const csvContent = [
      headers.join(','),
      ...rows.map(row => headers.map(header => {
        const val = row[header] || '';
        return `"${String(val).replace(/"/g, '""')}"`;
      }).join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const filename = filteredEvent 
      ? `${filteredEvent.title}_報名名單.csv` 
      : `完整報名清單_${new Date().toISOString().slice(0,10)}.csv`;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginAdmin(loginPassword)) {
      setLoginError(false);
      setLoginPassword('');
    } else {
      setLoginError(true);
    }
  };

  const handleAiImport = async () => {
    if (!aiInputText.trim()) return;
    setIsGenerating(true);
    try {
      const newEvents = await parseEventsFromText(aiInputText);
      addEventsBatch(newEvents);
      setAiInputText('');
      setIsAiModalOpen(false);
    } catch (e) {
      alert("生成失敗，請檢查 API Key 或重試。");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleToggleStatus = (event: HousingEvent) => {
    updateEvent(event.id, { isOpen: !event.isOpen });
  };

  const openCreateModal = () => {
    setIsEditing(false);
    setCurrentEvent({
      isOpen: true,
      maxParticipants: 50,
      imageUrl: 'https://picsum.photos/seed/new/600/400',
      formFields: [
        { name: 'name', label: '姓名', type: 'text', required: true },
        { name: 'phone', label: '聯絡電話', type: 'tel', required: true },
        { name: 'email', label: '電子信箱', type: 'email', required: true }
      ]
    });
    setIsEventModalOpen(true);
  };

  const openEditModal = (event: HousingEvent) => {
    setIsEditing(true);
    setCurrentEvent({ ...event });
    setIsEventModalOpen(true);
  };

  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEvent.title || !currentEvent.date) {
      alert("請填寫必填欄位");
      return;
    }

    const eventData = currentEvent as HousingEvent;
    
    if (isEditing && eventData.id) {
      updateEvent(eventData.id, eventData);
    } else {
      addEvent({
        ...eventData,
        id: Math.random().toString(36).substr(2, 9),
        isOpen: true,
      } as HousingEvent);
    }
    setIsEventModalOpen(false);
  };

  const updateCurrentEvent = (field: string, value: any) => {
    setCurrentEvent(prev => ({ ...prev, [field]: value }));
  };

  // --- Form Builder Handlers ---
  const addFormField = () => {
    const newField: FormField = { 
      name: `field_${Date.now()}`, 
      label: '新欄位', 
      type: 'text', 
      required: false 
    };
    const currentFields = currentEvent.formFields || [];
    updateCurrentEvent('formFields', [...currentFields, newField]);
  };

  const removeFormField = (index: number) => {
    const currentFields = currentEvent.formFields || [];
    const newFields = currentFields.filter((_, i) => i !== index);
    updateCurrentEvent('formFields', newFields);
  };

  const updateFormField = (index: number, fieldUpdates: Partial<FormField>) => {
    const currentFields = currentEvent.formFields || [];
    const newFields = currentFields.map((field, i) => {
      if (i === index) {
        return { ...field, ...fieldUpdates };
      }
      return field;
    });
    updateCurrentEvent('formFields', newFields);
  };

  // Login Screen
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
           <div className="text-center mb-8">
             <div className="bg-slate-800 text-white w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
               <Lock className="w-8 h-8" />
             </div>
             <h1 className="text-2xl font-bold text-gray-800">後台管理登入</h1>
             <p className="text-gray-500 text-sm mt-2">請輸入管理員密碼以繼續</p>
           </div>
           
           <form onSubmit={handleLogin} className="space-y-4">
             <div>
               <input 
                 type="password" 
                 className={`w-full px-4 py-3 border rounded-lg outline-none focus:ring-2 transition-all ${loginError ? 'border-red-300 ring-red-200' : 'border-gray-300 focus:ring-slate-400 focus:border-slate-500'}`}
                 placeholder="密碼 (預設: admin)"
                 value={loginPassword}
                 onChange={(e) => setLoginPassword(e.target.value)}
                 autoFocus
               />
               {loginError && <p className="text-red-500 text-sm mt-1 ml-1">密碼錯誤，請重試。</p>}
             </div>
             <button type="submit" className="w-full bg-slate-800 text-white py-3 rounded-lg font-semibold hover:bg-slate-900 transition-colors shadow-lg">
               登入系統
             </button>
           </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      {/* Admin Header */}
      <div className="bg-slate-800 text-white shadow-lg sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold">管理後台</h1>
            <span className="bg-slate-700 text-slate-300 text-xs px-2 py-1 rounded">Admin</span>
          </div>
          <button 
            onClick={logoutAdmin}
            className="flex items-center gap-2 text-sm text-slate-300 hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4" />
            登出
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-4 mb-8">
           <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <p className="text-gray-500 text-sm font-medium">總活動數</p>
              <p className="text-3xl font-bold text-slate-800 mt-1">{events.length}</p>
           </div>
           <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <p className="text-gray-500 text-sm font-medium">總報名人數</p>
              <p className="text-3xl font-bold text-teal-600 mt-1">{registrations.length}</p>
           </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-6 border-b border-gray-300 mb-8">
          <button 
            onClick={() => setActiveTab('events')}
            className={`pb-4 px-2 font-medium transition-colors relative ${activeTab === 'events' ? 'text-slate-800' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <span className="flex items-center gap-2"><Calendar className="w-5 h-5"/> 活動管理</span>
            {activeTab === 'events' && <span className="absolute bottom-0 left-0 w-full h-1 bg-slate-800 rounded-t-full"></span>}
          </button>
          <button 
            onClick={() => setActiveTab('registrations')}
            className={`pb-4 px-2 font-medium transition-colors relative ${activeTab === 'registrations' ? 'text-slate-800' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <span className="flex items-center gap-2"><Users className="w-5 h-5"/> 報名名單</span>
            {activeTab === 'registrations' && <span className="absolute bottom-0 left-0 w-full h-1 bg-slate-800 rounded-t-full"></span>}
          </button>
        </div>

        {/* Tab: Events Management */}
        {activeTab === 'events' && (
          <div>
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
              <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                 <h2 className="text-xl font-bold text-gray-800 whitespace-nowrap">活動列表</h2>
                 
                 {/* Filter Controls */}
                 <div className="flex bg-gray-200 p-1 rounded-lg">
                    <button 
                      onClick={() => setEventFilter('ALL')}
                      className={`px-4 py-1 text-sm rounded-md transition-all ${eventFilter === 'ALL' ? 'bg-white text-gray-800 shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      全部
                    </button>
                    <button 
                      onClick={() => setEventFilter('UPCOMING')}
                      className={`px-4 py-1 text-sm rounded-md transition-all ${eventFilter === 'UPCOMING' ? 'bg-white text-gray-800 shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      即將到來
                    </button>
                    <button 
                      onClick={() => setEventFilter('PAST')}
                      className={`px-4 py-1 text-sm rounded-md transition-all ${eventFilter === 'PAST' ? 'bg-white text-gray-800 shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      已結束
                    </button>
                 </div>
              </div>

              <div className="flex flex-wrap gap-3 w-full lg:w-auto justify-end">
                 {/* Bulk Delete Button */}
                 {pastEvents.length > 0 && (
                   <button 
                    onClick={() => setIsBulkDeleteModalOpen(true)}
                    className="flex items-center gap-2 bg-red-100 text-red-700 border border-red-200 px-4 py-2.5 rounded-lg hover:bg-red-200 transition-all font-medium text-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                    清除過期 ({pastEvents.length})
                  </button>
                 )}

                 <button 
                  onClick={openCreateModal}
                  className="flex items-center gap-2 bg-teal-600 text-white px-5 py-2.5 rounded-lg hover:shadow-lg hover:bg-teal-700 transition-all font-medium whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  新增活動
                </button>
                 <button 
                  onClick={() => setIsAiModalOpen(true)}
                  className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-5 py-2.5 rounded-lg hover:shadow-lg hover:shadow-indigo-200 transition-all font-medium whitespace-nowrap"
                >
                  <Sparkles className="w-4 h-4" />
                  AI 產生
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 font-semibold text-gray-700 w-24">狀態</th>
                    <th className="px-6 py-4 font-semibold text-gray-700">活動資訊</th>
                    <th className="px-6 py-4 font-semibold text-gray-700">報名狀況</th>
                    <th className="px-6 py-4 font-semibold text-gray-700 text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredEvents.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                        沒有符合條件的活動。
                      </td>
                    </tr>
                  ) : (
                    filteredEvents.map(event => {
                      const status = getEventStatus(event);
                      const percent = Math.round(((event.maxParticipants - status.remainingSpots) / event.maxParticipants) * 100);
                      const isPast = new Date(event.date) < new Date(new Date().setHours(0,0,0,0));
                      
                      return (
                        <tr key={event.id} className={`hover:bg-gray-50 transition-colors ${isPast ? 'bg-gray-50/50' : ''}`}>
                          <td className="px-6 py-4">
                            <button onClick={() => handleToggleStatus(event)} title={event.isOpen ? "點擊暫停" : "點擊開啟"}>
                              {event.isOpen ? (
                                <ToggleRight className="w-8 h-8 text-teal-600" />
                              ) : (
                                <ToggleLeft className="w-8 h-8 text-gray-400" />
                              )}
                            </button>
                          </td>
                          <td className="px-6 py-4">
                            <div className={`font-medium ${isPast ? 'text-gray-500' : 'text-gray-900'}`}>{event.title}</div>
                            <div className="text-xs text-gray-500 mt-1">{event.date} • {event.location}</div>
                            <div className="text-xs text-red-500 mt-0.5">截止: {event.deadline}</div>
                          </td>
                          <td className="px-6 py-4 w-64">
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-gray-600">{event.maxParticipants - status.remainingSpots} / {event.maxParticipants} 人</span>
                              <span className={percent >= 100 ? 'text-red-600 font-bold' : 'text-teal-600'}>{percent}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${percent >= 100 ? 'bg-red-500' : 'bg-teal-500'} ${isPast ? 'opacity-50' : ''}`} 
                                style={{ width: `${Math.min(percent, 100)}%` }}
                              ></div>
                            </div>
                            {isPast && <span className="inline-block mt-1 text-[10px] bg-gray-200 px-2 rounded text-gray-600 mr-1">活動已結束</span>}
                            {status.isExpired && !isPast && <span className="inline-block mt-1 text-[10px] bg-gray-200 px-2 rounded text-gray-600 mr-1">已過截止日</span>}
                            {status.isClosed && <span className="inline-block mt-1 text-[10px] bg-gray-600 text-white px-2 rounded">手動暫停</span>}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleViewRegistrations(event.id)}
                                className="text-indigo-600 hover:text-indigo-800 p-2 rounded-full hover:bg-indigo-50 transition-colors"
                                title="查看報名者"
                              >
                                <FileText className="w-5 h-5" />
                              </button>
                               <button
                                onClick={() => openEditModal(event)}
                                className="text-gray-600 hover:text-gray-800 p-2 rounded-full hover:bg-gray-100 transition-colors"
                                title="編輯活動"
                              >
                                <Edit className="w-5 h-5" />
                              </button>
                              <button 
                                onClick={() => deleteEvent(event.id)}
                                className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors"
                                title="刪除活動"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab: Registrations */}
        {activeTab === 'registrations' && (
          <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <h2 className="text-xl font-bold text-gray-800">
                {filterEventId && filteredEvent 
                  ? `${filteredEvent.title} - 報名名單` 
                  : '所有報名資料'
                }
              </h2>
              
              <div className="flex gap-3">
                {filterEventId && (
                  <button 
                    onClick={clearFilter}
                    className="flex items-center gap-2 bg-gray-100 border border-gray-300 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors shadow-sm"
                  >
                    <X className="w-4 h-4" />
                    清除篩選
                  </button>
                )}
                <button 
                  onClick={downloadCSV}
                  className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  匯出 {filteredRegistrations.length} 筆資料
                </button>
              </div>
            </div>

            {filterEventId && (
               <div className="mb-4 bg-indigo-50 border border-indigo-100 text-indigo-800 px-4 py-3 rounded-lg flex items-center gap-2">
                 <ListFilter className="w-5 h-5" />
                 <span>正在顯示 <b>{filteredEvent?.title}</b> 的報名資料 (共 {filteredRegistrations.length} 筆)</span>
               </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
               <div className="overflow-x-auto">
                <table className="w-full text-left whitespace-nowrap">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 font-semibold text-gray-700">活動名稱</th>
                      <th className="px-6 py-4 font-semibold text-gray-700">姓名</th>
                      <th className="px-6 py-4 font-semibold text-gray-700">聯絡資訊</th>
                      <th className="px-6 py-4 font-semibold text-gray-700">其他資訊</th>
                      <th className="px-6 py-4 font-semibold text-gray-700">報名時間</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredRegistrations.length === 0 ? (
                       <tr>
                       <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                         {filterEventId ? "此活動目前尚無報名資料。" : "目前尚無任何報名資料。"}
                       </td>
                     </tr>
                    ) : (
                      filteredRegistrations.map(reg => {
                        const event = events.find(e => e.id === reg.eventId);
                        // Filter out basic fields to show "Other info"
                        const basicKeys = ['name', 'phone', 'email'];
                        const otherInfo = Object.entries(reg.formData)
                          .filter(([key]) => !basicKeys.includes(key))
                          .map(([key, val]) => `${key}: ${val}`)
                          .join(', ');

                        return (
                          <tr key={reg.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 font-medium text-gray-900">
                              {event ? event.title : <span className="text-gray-400">Unknown Event</span>}
                            </td>
                            <td className="px-6 py-4 text-gray-800">
                              {reg.formData['name']}
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-800">{reg.formData['phone']}</div>
                              <div className="text-xs text-gray-500">{reg.formData['email']}</div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate" title={otherInfo}>
                              {otherInfo || '-'}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {new Date(reg.timestamp).toLocaleString('zh-TW')}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
               </div>
            </div>
          </div>
        )}
      </div>

      {/* Manual Create/Edit Modal */}
      {isEventModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-8 flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50 rounded-t-2xl">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                {isEditing ? <Edit className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                {isEditing ? '編輯活動' : '新增活動'}
              </h3>
              <button onClick={() => setIsEventModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSaveEvent} className="overflow-y-auto flex-1 p-6 space-y-8">
              {/* Basic Info Section */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-700 border-l-4 border-teal-500 pl-3">基本資訊</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">活動名稱 *</label>
                    <input type="text" required className="w-full border rounded-lg p-2.5" 
                      value={currentEvent.title || ''} onChange={e => updateCurrentEvent('title', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">日期 (YYYY-MM-DD) *</label>
                    <input type="date" required className="w-full border rounded-lg p-2.5" 
                      value={currentEvent.date || ''} onChange={e => updateCurrentEvent('date', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">時間 *</label>
                    <input type="text" className="w-full border rounded-lg p-2.5" placeholder="例如: 14:00 - 16:00"
                      value={currentEvent.time || ''} onChange={e => updateCurrentEvent('time', e.target.value)} />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">地點 *</label>
                    <input type="text" required className="w-full border rounded-lg p-2.5" 
                      value={currentEvent.location || ''} onChange={e => updateCurrentEvent('location', e.target.value)} />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">圖片連結</label>
                    <input type="text" className="w-full border rounded-lg p-2.5" placeholder="https://..."
                      value={currentEvent.imageUrl || ''} onChange={e => updateCurrentEvent('imageUrl', e.target.value)} />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">活動描述</label>
                    <textarea className="w-full border rounded-lg p-2.5 h-24" 
                      value={currentEvent.description || ''} onChange={e => updateCurrentEvent('description', e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Restrictions Section */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-700 border-l-4 border-orange-500 pl-3">報名限制</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">報名截止日期 *</label>
                    <input type="date" required className="w-full border rounded-lg p-2.5" 
                      value={currentEvent.deadline || ''} onChange={e => updateCurrentEvent('deadline', e.target.value)} />
                  </div>
                   <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">人數上限 *</label>
                    <input type="number" required className="w-full border rounded-lg p-2.5" 
                      value={currentEvent.maxParticipants || 50} onChange={e => updateCurrentEvent('maxParticipants', parseInt(e.target.value))} />
                  </div>
                  <div className="flex items-center gap-2 mt-4">
                     <label className="flex items-center cursor-pointer">
                       <input 
                          type="checkbox" 
                          className="sr-only peer"
                          checked={currentEvent.isOpen ?? true}
                          onChange={e => updateCurrentEvent('isOpen', e.target.checked)}
                       />
                       <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                       <span className="ms-3 text-sm font-medium text-gray-900">開放報名</span>
                     </label>
                  </div>
                </div>
              </div>

              {/* Form Builder Section */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold text-gray-700 border-l-4 border-indigo-500 pl-3">報名表單設計</h4>
                  <button type="button" onClick={addFormField} className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-medium">
                    <Plus className="w-4 h-4" /> 新增欄位
                  </button>
                </div>
                
                <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
                  {(currentEvent.formFields || []).map((field, index) => (
                    <div key={index} className="flex flex-col md:flex-row gap-3 items-start md:items-center bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                      <div className="flex-1 w-full md:w-auto">
                        <input 
                          type="text" 
                          placeholder="欄位名稱 (如: 飲食習慣)" 
                          className="w-full text-sm border-gray-300 rounded-md p-2 border"
                          value={field.label}
                          onChange={e => updateFormField(index, { label: e.target.value })}
                        />
                      </div>
                      <div className="w-full md:w-32">
                        <select 
                          className="w-full text-sm border-gray-300 rounded-md p-2 border"
                          value={field.type}
                          onChange={e => updateFormField(index, { type: e.target.value as any })}
                        >
                          <option value="text">文字</option>
                          <option value="tel">電話</option>
                          <option value="email">Email</option>
                          <option value="number">數字</option>
                          <option value="select">下拉選單</option>
                        </select>
                      </div>
                      {field.type === 'select' && (
                         <div className="flex-1 w-full md:w-auto">
                           <input 
                            type="text"
                            placeholder="選項 (以逗號分隔)"
                            className="w-full text-sm border-gray-300 rounded-md p-2 border"
                            value={field.options?.join(',') || ''}
                            onChange={e => updateFormField(index, { options: e.target.value.split(',').map(s => s.trim()) })}
                           />
                         </div>
                      )}
                      <div className="flex items-center gap-2">
                        <input 
                          type="checkbox" 
                          id={`req-${index}`}
                          checked={field.required}
                          onChange={e => updateFormField(index, { required: e.target.checked })}
                          className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                        />
                        <label htmlFor={`req-${index}`} className="text-sm text-gray-600 whitespace-nowrap">必填</label>
                      </div>
                      <button type="button" onClick={() => removeFormField(index)} className="text-red-400 hover:text-red-600 p-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {(currentEvent.formFields || []).length === 0 && (
                    <p className="text-center text-gray-400 text-sm py-4">目前沒有設定欄位，請新增欄位。</p>
                  )}
                </div>
              </div>

            </form>
            <div className="p-6 border-t bg-gray-50 rounded-b-2xl flex justify-end gap-3">
              <button 
                type="button" 
                onClick={() => setIsEventModalOpen(false)}
                className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-100 transition-colors"
              >
                取消
              </button>
              <button 
                type="button"
                onClick={handleSaveEvent}
                className="px-5 py-2.5 rounded-lg bg-teal-600 text-white font-medium hover:bg-teal-700 shadow-md flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                儲存設定
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Import Modal */}
      {isAiModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-indigo-100 rounded-lg text-indigo-600">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">AI 智能活動產生器</h3>
                <p className="text-sm text-gray-500">
                  貼上公告文字，AI 將自動辨識：<br/>
                  • 活動資訊、截止日期、人數上限<br/>
                  • 需要向民眾收集的欄位 (如：飲食習慣、年齡)
                </p>
              </div>
            </div>
            
            <textarea
              className="w-full h-48 border border-gray-300 rounded-xl p-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none bg-gray-50 text-sm"
              placeholder={`範例：
我們下週五晚上舉辦「社區電影夜」，地點在 2F 交誼廳。
限額 30 人，報名截止到下週三。
報名時請填寫：姓名、電話、還有想看的電影類型。`}
              value={aiInputText}
              onChange={(e) => setAiInputText(e.target.value)}
            ></textarea>

            <div className="mt-6 flex justify-end gap-3">
              <button 
                onClick={() => setIsAiModalOpen(false)}
                className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
              >
                取消
              </button>
              <button 
                onClick={handleAiImport}
                disabled={isGenerating || !aiInputText.trim()}
                className="px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 transition-all shadow-md"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4" />
                    正在分析需求...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    開始生成
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirm Modal */}
      {isBulkDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
           <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in duration-200">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4 mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-center text-gray-800 mb-2">確認清除過期活動？</h3>
              <p className="text-gray-500 text-center text-sm mb-6">
                您即將刪除 <b>{pastEvents.length}</b> 個已結束的活動。<br/>
                此操作無法復原。
              </p>
              <div className="flex gap-3">
                 <button 
                   onClick={() => setIsBulkDeleteModalOpen(false)}
                   className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                 >
                   取消
                 </button>
                 <button 
                   onClick={handleBulkDelete}
                   className="flex-1 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 shadow-lg transition-colors"
                 >
                   確認刪除
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
