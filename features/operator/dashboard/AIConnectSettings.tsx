import React, { useState } from 'react';
import { Bot, Phone, MessageSquare, Play, Save } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const AIConnectSettings: React.FC = () => {
  const [settings, setSettings] = useState({
    voice: 'Sarah (Warm & Professional)',
    greeting: "Hello, thank you for calling Sunrise Senior Living. I'm the AI assistant. How can I help you today?",
    transferNumber: '+1 (555) 123-4567',
    afterHours: true
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-purple-100 rounded-lg">
          <Bot className="w-6 h-6 text-purple-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900">AI Receptionist Configuration</h3>
          <p className="text-sm text-slate-500">Manage your 24/7 voice assistant settings.</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Voice Selection */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">AI Voice Persona</label>
          <select 
            value={settings.voice}
            onChange={(e) => setSettings({...settings, voice: e.target.value})}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          >
            <option>Sarah (Warm & Professional)</option>
            <option>David (Calm & Authoritative)</option>
            <option>Elena (Empathetic & Soft)</option>
          </select>
        </div>

        {/* Greeting Script */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Greeting Script</label>
          <textarea 
            value={settings.greeting}
            onChange={(e) => setSettings({...settings, greeting: e.target.value})}
            rows={3}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          />
          <div className="mt-2 flex items-center gap-2 text-sm text-purple-600 cursor-pointer hover:text-purple-700">
            <Play className="w-4 h-4" /> Preview Audio
          </div>
        </div>

        {/* Transfer Settings */}
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Warm Transfer Number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="tel"
                value={settings.transferNumber}
                onChange={(e) => setSettings({...settings, transferNumber: e.target.value})}
                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
          <div className="flex items-center">
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox"
                checked={settings.afterHours}
                onChange={(e) => setSettings({...settings, afterHours: e.target.checked})}
                className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500"
              />
              <span className="text-sm font-medium text-slate-700">Enable After-Hours Handling</span>
            </label>
          </div>
        </div>

        {/* Call Logs Preview */}
        <div className="border-t border-slate-100 pt-6">
          <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-slate-400" /> Recent AI Interactions
          </h4>
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="bg-slate-50 p-3 rounded-lg text-sm">
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>Caller: (555) 987-654{i}</span>
                  <span>Today, 10:3{i} AM</span>
                </div>
                <p className="text-slate-700">"I'm looking for memory care pricing for my mother..."</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">Transferred</span>
                  <span className="bg-purple-100 text-purple-800 text-xs px-2 py-0.5 rounded-full">High Intent</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">
          <Save className="w-4 h-4 mr-2" /> Save AI Configuration
        </Button>
      </div>
    </div>
  );
};
