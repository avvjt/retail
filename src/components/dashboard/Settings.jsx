import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Shield, User, Smartphone, LogOut, CheckCircle2, TrendingUp, Brain, Target, AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function Settings({ theme }) {
  const [profile, setProfile] = useState({ name: '', username: '', twoFactorEnabled: false, disciplineScore: 100, edgeScore: 100, traderHealthScore: 100 });
  const [plan, setPlan] = useState({ maxTradesPerDay: 3, maxRiskPerTrade: '1%', setupCriteria: [], active: true });
  const [saved, setSaved] = useState(false);
  const [newCriteria, setNewCriteria] = useState('');
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [oldPassVal, setOldPassVal] = useState('');
  const [newPassVal, setNewPassVal] = useState('');

  useEffect(() => {
    fetch('/api/settings/profile', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }).then(res => res.json()).then(data => setProfile(data)).catch(() => {});
    fetch('/api/settings/trading-plan', { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }).then(res => res.json()).then(data => {
      setPlan({
        ...data,
        setupCriteria: data.setupCriteria || []
      });
    }).catch(() => {});
  }, []);

  const handleSave = async () => {
    await fetch('/api/settings/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
      body: JSON.stringify(profile)
    });
    await fetch('/api/settings/trading-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
      body: JSON.stringify(plan)
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const addCriteria = () => {
    if (!newCriteria.trim()) return;
    setPlan({ ...plan, setupCriteria: [...plan.setupCriteria, newCriteria] });
    setNewCriteria('');
  };

  const removeCriteria = (idx) => {
    const arr = [...plan.setupCriteria];
    arr.splice(idx, 1);
    setPlan({ ...plan, setupCriteria: arr });
  };

  const resetScores = () => {
    setProfile({ ...profile, disciplineScore: 100, edgeScore: 100, traderHealthScore: 100 });
    alert("Scores reset to 100! Let's build healthy habits.");
  };

  return (
    <div className={`w-full p-6 h-full overflow-y-auto ${theme === 'dark' ? 'bg-[#0a0a0a] text-white' : 'bg-white text-gray-900'}`}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold font-mono">Account Settings & Profile</h1>
          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
            Manage your profile, security, scores, and trading plan.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl">
        <div className="space-y-6">
          <div className={`p-6 border rounded-lg ${theme === 'dark' ? 'bg-[#111] border-white/10' : 'bg-gray-50 border-gray-200'}`}>
            <h2 className="text-lg font-bold flex items-center mb-4"><User className="w-5 h-5 mr-2" /> Profile Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1 opacity-70">Email</label>
                <input type="email" value={profile.email || ''} onChange={e => setProfile({...profile, email: e.target.value})} className={`w-full px-3 py-2 rounded border ${theme === 'dark' ? 'bg-black border-white/10' : 'bg-white border-gray-300'}`} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1 opacity-70">Avatar URL</label>
                <input type="text" value={profile.avatarUrl || ''} onChange={e => setProfile({...profile, avatarUrl: e.target.value})} placeholder="https://example.com/avatar.png" className={`w-full px-3 py-2 rounded border ${theme === 'dark' ? 'bg-black border-white/10' : 'bg-white border-gray-300'}`} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1 opacity-70">Name</label>
                <input type="text" value={profile.name || ''} onChange={e => setProfile({...profile, name: e.target.value})} className={`w-full px-3 py-2 rounded border ${theme === 'dark' ? 'bg-black border-white/10' : 'bg-white border-gray-300'}`} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1 opacity-70">Username</label>
                <input type="text" value={profile.username || ''} onChange={e => setProfile({...profile, username: e.target.value})} className={`w-full px-3 py-2 rounded border ${theme === 'dark' ? 'bg-black border-white/10' : 'bg-white border-gray-300'}`} />
              </div>
            </div>
          </div>

          <div className={`p-6 border rounded-lg ${theme === 'dark' ? 'bg-[#111] border-blue-500/30' : 'bg-blue-50 border-blue-200'}`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold flex items-center"><Target className="w-5 h-5 mr-2 text-blue-500" /> RetailX Scores</h2>
              <button onClick={resetScores} className="text-xs text-blue-500 hover:underline">Reset Scores</button>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className={`p-4 rounded-lg text-center ${theme === 'dark' ? 'bg-black/50' : 'bg-white'} border ${theme === 'dark' ? 'border-white/5' : 'border-gray-200'}`}>
                <div className="text-2xl font-bold text-emerald-500">{profile.disciplineScore}%</div>
                <div className="text-[10px] uppercase opacity-70 mt-1 font-bold">Discipline</div>
              </div>
              <div className={`p-4 rounded-lg text-center ${theme === 'dark' ? 'bg-black/50' : 'bg-white'} border ${theme === 'dark' ? 'border-white/5' : 'border-gray-200'}`}>
                <div className="text-2xl font-bold text-blue-500">{profile.edgeScore}%</div>
                <div className="text-[10px] uppercase opacity-70 mt-1 font-bold">Edge Score</div>
              </div>
              <div className={`p-4 rounded-lg text-center ${theme === 'dark' ? 'bg-black/50' : 'bg-white'} border ${theme === 'dark' ? 'border-white/5' : 'border-gray-200'}`}>
                <div className="text-2xl font-bold text-purple-500">{profile.traderHealthScore}%</div>
                <div className="text-[10px] uppercase opacity-70 mt-1 font-bold">Health Score</div>
              </div>
            </div>
            <p className="text-xs opacity-70">
              Your Edge Score is a rolling average of Risk Management, Discipline, and Strategy Execution out of 100.
            </p>
          </div>
          
          <div className={`p-6 border rounded-lg ${theme === 'dark' ? 'bg-[#111] border-white/10' : 'bg-gray-50 border-gray-200'}`}>
            <h2 className="text-lg font-bold flex items-center mb-4"><Shield className="w-5 h-5 mr-2" /> Security</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded bg-black/5">
                <div className="flex items-center">
                  <Smartphone className="w-5 h-5 mr-3 text-blue-500" />
                  <div>
                    <div className="font-medium">Two-Factor Authentication (2FA)</div>
                    <div className="text-xs opacity-70">Add an extra layer of security.</div>
                  </div>
                </div>
                <button onClick={() => setProfile({...profile, twoFactorEnabled: !profile.twoFactorEnabled})} className={`px-4 py-1.5 rounded text-sm font-medium ${profile.twoFactorEnabled ? 'bg-emerald-500 text-white' : 'bg-gray-300 text-black'}`}>
                  {profile.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                </button>
              </div>
              <div className="p-4 border rounded bg-black/5">
                <div className="font-medium mb-2">Change Password</div>
                <div className="space-y-2">
                  <div className="relative">
                    <input 
                      type={showOldPass ? "text" : "password"} 
                      placeholder="Old Password" 
                      value={oldPassVal}
                      onChange={(e) => setOldPassVal(e.target.value)}
                      className={`w-full px-3 py-2 pr-10 rounded border ${theme === 'dark' ? 'bg-black border-white/10' : 'bg-white border-gray-300'} text-sm`} 
                    />
                    <button
                      type="button"
                      onClick={() => setShowOldPass(!showOldPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                    >
                      {showOldPass ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  <div className="relative">
                    <input 
                      type={showNewPass ? "text" : "password"} 
                      placeholder="New Password" 
                      value={newPassVal}
                      onChange={(e) => setNewPassVal(e.target.value)}
                      className={`w-full px-3 py-2 pr-10 rounded border ${theme === 'dark' ? 'bg-black border-white/10' : 'bg-white border-gray-300'} text-sm`} 
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                    >
                      {showNewPass ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  <button onClick={async () => {
                    if (!oldPassVal || !newPassVal) return alert("Please fill both password fields");
                    const res = await fetch('/api/auth/change-password', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
                      body: JSON.stringify({ oldPassword: oldPassVal, newPassword: newPassVal })
                    });
                    const data = await res.json();
                    if (data.error) alert(data.error);
                    else { 
                      alert("Password changed successfully"); 
                      setOldPassVal(''); 
                      setNewPassVal(''); 
                    }
                  }} className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium">Update Password</button>
                </div>
              </div>
              <div className="p-4 border rounded bg-black/5 flex justify-between items-center">
                <div>
                  <div className="font-medium">Active Sessions</div>
                  <div className="text-xs opacity-70">Sign out of all other devices.</div>
                </div>
                <button onClick={async () => {
                  if (confirm("Are you sure you want to sign out of all devices? You will be logged out here as well.")) {
                    await fetch('/api/auth/sign-out-all', { method: 'POST', headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
                    localStorage.removeItem('token');
                    window.location.href = '/login';
                  }
                }} className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-sm font-medium">Sign Out All</button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className={`p-6 border rounded-lg ${theme === 'dark' ? 'bg-[#111] border-white/10' : 'bg-gray-50 border-gray-200'}`}>
            <h2 className="text-lg font-bold flex items-center mb-1"><CheckCircle2 className="w-5 h-5 mr-2" /> Trading Plan & Checklist</h2>
            <p className="text-xs opacity-70 mb-4">Paper trading orders are strictly checked against these rules in real-time.</p>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1 opacity-70">Max Trades / Day</label>
                  <input type="number" value={plan.maxTradesPerDay === undefined || isNaN(plan.maxTradesPerDay) ? '' : plan.maxTradesPerDay} onChange={e => setPlan({...plan, maxTradesPerDay: e.target.value === '' ? '' : parseInt(e.target.value)})} className={`w-full px-3 py-2 rounded border ${theme === 'dark' ? 'bg-black border-white/10' : 'bg-white border-gray-300'}`} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1 opacity-70">Max Risk / Trade</label>
                  <select value={plan.maxRiskPerTrade} onChange={e => setPlan({...plan, maxRiskPerTrade: e.target.value})} className={`w-full px-3 py-2 rounded border ${theme === 'dark' ? 'bg-black border-white/10' : 'bg-white border-gray-300'}`}>
                    <option value="1%">1% of Capital</option>
                    <option value="2%">2% of Capital</option>
                    <option value="5%">5% of Capital</option>
                    <option value="1000">Fixed ₹1,000</option>
                    <option value="5000">Fixed ₹5,000</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-2 opacity-70">Setup Checklist Criteria</label>
                <div className="flex mb-2">
                  <input type="text" value={newCriteria} onChange={e => setNewCriteria(e.target.value)} onKeyDown={e => e.key === 'Enter' && addCriteria()} placeholder="e.g. Price is above VWAP" className={`flex-1 px-3 py-2 rounded-l border-y border-l ${theme === 'dark' ? 'bg-black border-white/10' : 'bg-white border-gray-300'} text-sm`} />
                  <button onClick={addCriteria} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-r text-sm font-medium">Add</button>
                </div>
                
                {plan.setupCriteria && plan.setupCriteria.length > 0 ? (
                  <ul className="space-y-2 mt-3">
                    {plan.setupCriteria.map((c, i) => (
                      <li key={i} className={`flex justify-between items-center p-2 rounded text-sm ${theme === 'dark' ? 'bg-black/50' : 'bg-white'} border ${theme === 'dark' ? 'border-white/5' : 'border-gray-200'}`}>
                        <span className="flex items-center"><CheckCircle2 className="w-3 h-3 mr-2 text-emerald-500" /> {c}</span>
                        <button onClick={() => removeCriteria(i)} className="text-rose-500 opacity-50 hover:opacity-100 text-xs">Remove</button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs opacity-50 italic mt-2">No setup criteria defined. You are trading naked!</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-4 mt-8 pt-6 border-t border-white/10">
        <button onClick={handleSave} className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold">
          Save All Changes
        </button>
        {saved && <span className="text-emerald-500 text-sm font-medium flex items-center"><CheckCircle2 className="w-4 h-4 mr-1"/> Saved successfully!</span>}
      </div>
    </div>
  );
}
