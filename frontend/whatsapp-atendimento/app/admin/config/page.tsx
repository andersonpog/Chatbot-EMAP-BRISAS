// frontend/whatsapp-atendimento/app/admin/configuracoes/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { Settings, Save, Clock, CalendarDays, MessageSquareText } from 'lucide-react';

export default function ConfiguracoesPage() {
  const [mensagem, setMensagem] = useState('Nosso horário de atendimento...');
  const [horarios, setHorarios] = useState([
    { dia: 0, nome: 'Domingo', ativo: false, inicio: '08:00', fim: '18:00' },
    { dia: 1, nome: 'Segunda-feira', ativo: true, inicio: '08:00', fim: '18:00' },
    { dia: 2, nome: 'Terça-feira', ativo: true, inicio: '08:00', fim: '18:00' },
    { dia: 3, nome: 'Quarta-feira', ativo: true, inicio: '08:00', fim: '18:00' },
    { dia: 4, nome: 'Quinta-feira', ativo: true, inicio: '08:00', fim: '18:00' },
    { dia: 5, nome: 'Sexta-feira', ativo: true, inicio: '08:00', fim: '18:00' },
    { dia: 6, nome: 'Sábado', ativo: false, inicio: '08:00', fim: '18:00' }
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:3001/configuracoes')
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          setMensagem(data.mensagemForaHorario || '');
          if (data.horarios && data.horarios.length > 0) {
            setHorarios(data.horarios);
          }
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Erro ao buscar configurações:', err);
        setLoading(false);
      });
  }, []);

  const handleHorarioChange = (index: number, field: string, value: any) => {
    const novosHorarios = [...horarios];
    novosHorarios[index] = { ...novosHorarios[index], [field]: value };
    setHorarios(novosHorarios);
  };

  const salvarConfiguracao = async () => {
    try {
      const res = await fetch('http://localhost:3001/configuracoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ horarios, mensagemForaHorario: mensagem }),
      });
      if (res.ok) alert('Configurações salvas com sucesso!');
      else alert('Erro ao salvar as configurações.');
    } catch (err) {
      console.error(err);
      alert('Erro de conexão ao salvar.');
    }
  };

  if (loading) return <div className="p-8 text-gray-500">Carregando configurações...</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-teal-600 rounded-lg text-white shadow-sm">
          <Settings size={28} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Configurações do Robô</h1>
          <p className="text-gray-500 text-sm mt-1">Gerencie os horários de atendimento e mensagens de ausência</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b">
            <CalendarDays className="text-teal-600" />
            <h2 className="text-xl font-semibold text-gray-700">Horários de Funcionamento</h2>
          </div>
          
          <div className="space-y-4">
            {horarios.map((h, index) => (
              <div key={h.dia} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-100">
                <div className="flex items-center gap-3 w-1/3">
                  <input 
                    type="checkbox" 
                    checked={h.ativo} 
                    onChange={(e) => handleHorarioChange(index, 'ativo', e.target.checked)}
                    className="w-4 h-4 text-teal-600 rounded border-gray-300 focus:ring-teal-500 cursor-pointer"
                  />
                  <span className={`font-medium ${h.ativo ? 'text-gray-700' : 'text-gray-400'}`}>{h.nome}</span>
                </div>
                
                <div className="flex items-center gap-2 w-2/3 justify-end">
                  <div className="flex items-center gap-2">
                    <Clock size={16} className={h.ativo ? 'text-teal-600' : 'text-gray-200'} />
                    <input 
                      type="time" 
                      value={h.inicio} 
                      onChange={(e) => handleHorarioChange(index, 'inicio', e.target.value)} 
                      disabled={!h.ativo}
                      className="border border-gray-300 p-2 rounded-md bg-white text-gray-900 font-semibold disabled:bg-gray-50 disabled:text-gray-400 disabled:border-gray-100 disabled:font-normal text-sm outline-none focus:ring-2 focus:ring-teal-500 transition-colors"
                    />
                  </div>
                  <span className={`font-medium ${h.ativo ? 'text-gray-600' : 'text-gray-300'}`}>às</span>
                  <input 
                    type="time" 
                    value={h.fim} 
                    onChange={(e) => handleHorarioChange(index, 'fim', e.target.value)} 
                    disabled={!h.ativo}
                    className="border border-gray-300 p-2 rounded-md bg-white text-gray-900 font-semibold disabled:bg-gray-50 disabled:text-gray-400 disabled:border-gray-100 disabled:font-normal text-sm outline-none focus:ring-2 focus:ring-teal-500 transition-colors"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex-1">
            <div className="flex items-center gap-2 mb-6 pb-4 border-b">
              <MessageSquareText className="text-teal-600" />
              <h2 className="text-xl font-semibold text-gray-700">Mensagem de Ausência</h2>
            </div>
            
            <p className="text-sm text-gray-500 mb-4">
              Essa mensagem será enviada automaticamente caso o cliente entre em contato fora dos dias e horários configurados ao lado.
            </p>
            
            <textarea 
              value={mensagem} 
              onChange={(e) => setMensagem(e.target.value)} 
              placeholder="Digite a mensagem de ausência..."
              className="border p-4 rounded-lg w-full h-48 resize-none focus:ring-2 focus:ring-teal-500 outline-none text-gray-700 bg-gray-50" 
            />
          </div>

          <button 
            onClick={salvarConfiguracao} 
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold px-6 py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98]"
          >
            <Save size={20} />
            Salvar Configurações
          </button>
        </div>
      </div>
    </div>
  );
}
