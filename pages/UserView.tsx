import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { EventCard } from '../components/EventCard';
import { X, CheckCircle, Mail, Loader2, AlertCircle } from 'lucide-react';
import { HousingEvent } from '../types';

export const UserView: React.FC = () => {
  const { events, registerUser } = useApp();
  const [selectedEvent, setSelectedEvent] = useState<HousingEvent | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<'IDLE' | 'SUBMITTING' | 'SUCCESS'>('IDLE');

  const openRegistration = (event: HousingEvent) => {
    setSelectedEvent(event);
    setFormData({}); // Reset form
    setStatus('IDLE');
  };

  const handleInputChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;
    
    setStatus('SUBMITTING');
    
    try {
      await registerUser(selectedEvent.id, formData);
      setStatus('SUCCESS');
    } catch (error) {
      alert("報名失敗，請稍後再試");
      setStatus('IDLE');
    }
  };

  const closeAndReset = () => {
    setSelectedEvent(null);
    setStatus('IDLE');
    setFormData({});
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Hero Header */}
      <div className="bg-teal-700 text-white py-16 px-4 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-black/10"></div>
        <div className="max-w-6xl mx-auto relative z-10">
          <h1 className="text-4xl font-bold mb-3 tracking-tight">社宅活動報名</h1>
          <p className="text-teal-100 text-lg max-w-2xl">
            探索我們精心策劃的社區活動，與鄰居互動，豐富您的生活體驗。
          </p>
        </div>
      </div>

      {/* Events Grid */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        {events.length === 0 ? (
          <div className="text-center py-20 text-gray-500 bg-white rounded-xl shadow border border-gray-100">
            <p className="text-lg">目前沒有開放報名的活動。</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {events.map(event => (
              <EventCard 
                key={event.id} 
                event={event} 
                onClick={() => openRegistration(event)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Registration Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="p-6 border-b flex justify-between items-center bg-gray-50">
              <div>
                <h2 className="text-xl font-bold text-gray-800">{selectedEvent.title}</h2>
                <p className="text-sm text-gray-500 mt-1">
                    {selectedEvent.date} • {selectedEvent.time}
                </p>
              </div>
              <button onClick={closeAndReset} className="text-gray-400 hover:text-gray-600 bg-white p-2 rounded-full border border-gray-200 hover:bg-gray-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto p-6">
              {status === 'SUCCESS' ? (
                <div className="flex flex-col items-center justify-center py-8 text-center animate-in zoom-in duration-300">
                  <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 shadow-sm">
                    <CheckCircle className="w-10 h-10" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">報名成功！</h3>
                  <div className="bg-blue-50 text-blue-800 p-4 rounded-lg flex items-start gap-3 text-left mb-6 max-w-sm">
                     <Mail className="w-5 h-5 mt-0.5 shrink-0" />
                     <div className="text-sm">
                       <p className="font-bold mb-1">已發送確認信</p>
                       <p>系統已自動將報名資訊發送至您的電子信箱：<br/><span className="font-mono text-blue-900">{formData['email']}</span></p>
                     </div>
                  </div>
                  <button 
                    onClick={closeAndReset}
                    className="px-8 py-2.5 bg-gray-800 text-white rounded-lg hover:bg-gray-900 font-medium transition-colors"
                  >
                    關閉視窗
                  </button>
                </div>
              ) : status === 'SUBMITTING' ? (
                 <div className="flex flex-col items-center justify-center py-20 text-center">
                    <Loader2 className="w-12 h-12 text-teal-600 animate-spin mb-4" />
                    <h3 className="text-lg font-medium text-gray-700">處理報名資訊中...</h3>
                    <p className="text-sm text-gray-500 mt-2">正在寄送確認信件</p>
                 </div>
              ) : (
                <>
                   <div className="mb-6 bg-yellow-50 border border-yellow-100 p-4 rounded-lg flex gap-3">
                      <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0" />
                      <p className="text-sm text-yellow-800">
                        請填寫正確資訊，報名成功後系統將自動寄送確認信至您的信箱。
                      </p>
                   </div>
                   
                   <form id="reg-form" onSubmit={handleSubmit} className="space-y-5">
                    {selectedEvent.formFields.map((field) => (
                      <div key={field.name}>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                          {field.label} {field.required && <span className="text-red-500">*</span>}
                        </label>
                        {field.type === 'select' ? (
                          <select
                            required={field.required}
                            value={formData[field.name] || ''}
                            onChange={(e) => handleInputChange(field.name, e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all bg-white"
                          >
                             <option value="">請選擇</option>
                             {field.options?.map(opt => (
                               <option key={opt} value={opt}>{opt}</option>
                             ))}
                          </select>
                        ) : (
                          <input
                            type={field.type}
                            required={field.required}
                            value={formData[field.name] || ''}
                            onChange={(e) => handleInputChange(field.name, e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
                            placeholder={`請輸入${field.label}`}
                          />
                        )}
                      </div>
                    ))}
                  </form>
                </>
              )}
            </div>

            {/* Footer Buttons */}
            {status === 'IDLE' && (
              <div className="p-6 border-t bg-gray-50 flex gap-4">
                <button 
                  type="button"
                  onClick={closeAndReset}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium transition-colors"
                >
                  取消
                </button>
                <button 
                  form="reg-form"
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium shadow-md transition-all hover:translate-y-[-1px]"
                >
                  確認送出
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};