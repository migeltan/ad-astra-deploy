import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  ArrowUpRight, 
  Coins, 
  PiggyBank, 
  ShieldAlert, 
  FileText, 
  CheckCircle, 
  RefreshCw, 
  Users, 
  Zap, 
  DollarSign, 
  Calculator,
  ChevronRight,
  Sparkles
} from 'lucide-react';

function App() {
  // Freighter Wallet Address State
  const [walletAddress, setWalletAddress] = useState('GBX26NZIG7FZZ6RI2J4ZNSONPQUATPHK3ABOWSI2O673F3GEG26MNKUX');
  const [isEditingWallet, setIsEditingWallet] = useState(false);
  const [walletInputVal, setWalletInputVal] = useState('GBX26NZIG7FZZ6RI2J4ZNSONPQUATPHK3ABOWSI2O673F3GEG26MNKUX');
  
  // App States
  const [walletConnected, setWalletConnected] = useState(true);
  const [isAutosaveActive, setIsAutosaveActive] = useState(true);
  const [activeTab, setActiveTab] = useState('worker'); // 'worker' | 'client'
  
  // Wallet Balances (Freelancer Profile)
  const [balances, setBalances] = useState({
    xlm: 1450,
    usdc: 320,
    php: 18240, // 320 USDC * 57 PHP
  });

  // Allocation Percentages state (Must add up to 100%)
  const [allocations, setAllocations] = useState({
    savings: 30,
    gov: 20,
    tax: 15,
    bills: 20,
    spendable: 15
  });

  // Allocation Labels & Theme configurations
  const allocationConfig = {
    savings: { label: 'Savings & Autosave', color: '#00f5d4', icon: PiggyBank },
    gov: { label: 'Gov Welfare (SSS/PhilHealth/PAG-IBIG)', color: '#ff9f1c', icon: ShieldAlert },
    tax: { label: 'Income Tax Reserve', color: '#ff007f', icon: Calculator },
    bills: { label: 'Bills & Utilities', color: '#3a86ff', icon: FileText },
    spendable: { label: 'Spendable Cash', color: '#9d4edd', icon: Coins }
  };

  // Base simulation amount to view splits
  const [simAmount, setSimAmount] = useState(1000);

  // Invoices State
  const [invoices, setInvoices] = useState([
    {
      id: 'INV-001',
      description: 'Stellar Integration Consulting - Milestones 1-2',
      client: 'Galactic Horizon Inc.',
      amountUsd: 600,
      amountXlm: 2400,
      status: 'paid',
      date: '2026-05-18'
    },
    {
      id: 'INV-002',
      description: 'Soroban Smart Contract Testing Mock Setup',
      client: 'Ad Astra DAO',
      amountUsd: 450,
      amountXlm: 1800,
      status: 'pending',
      date: '2026-05-20'
    }
  ]);

  // Invoice Form State
  const [newInvDesc, setNewInvDesc] = useState('');
  const [newInvClient, setNewInvClient] = useState('');
  const [newInvAmount, setNewInvAmount] = useState(500);

  // Stellar Transaction Sandbox Simulator Logger State
  const [isSimulatingTx, setIsSimulatingTx] = useState(false);
  const [simLogs, setSimLogs] = useState([]);
  const [currentPayingInvoice, setCurrentPayingInvoice] = useState(null);

  // Cascade overlay state
  const [showCascadeOverlay, setShowCascadeOverlay] = useState(false);
  const [cascadePayout, setCascadePayout] = useState({ usd: 0, xlm: 0 });
  const [cascadeAnimateWidths, setCascadeAnimateWidths] = useState({
    savings: 0, gov: 0, tax: 0, bills: 0, spendable: 0
  });

  // Calculate sum of allocations
  const totalAllocationPct = allocations.savings + allocations.gov + allocations.tax + allocations.bills + allocations.spendable;

  // Auto-balance Allocations to equal 100%
  const handleAutoBalance = () => {
    setAllocations({
      savings: 30,
      gov: 20,
      tax: 15,
      bills: 20,
      spendable: 15
    });
  };

  // Update a single allocation
  const handleAllocationChange = (key, value) => {
    const val = parseInt(value, 10) || 0;
    setAllocations(prev => ({
      ...prev,
      [key]: val
    }));
  };

  // Create local mock invoice
  const handleCreateInvoice = (e) => {
    e.preventDefault();
    if (!newInvDesc || !newInvClient || newInvAmount <= 0) return;
    
    const newInvoice = {
      id: `INV-00${invoices.length + 1}`,
      description: newInvDesc,
      client: newInvClient,
      amountUsd: Number(newInvAmount),
      amountXlm: Number(newInvAmount * 4), // Mock exchange rate: 1 USD = 4 XLM
      status: 'pending',
      date: new Date().toISOString().split('T')[0]
    };

    setInvoices([newInvoice, ...invoices]);
    setNewInvDesc('');
    setNewInvClient('');
    setNewInvAmount(500);
    setActiveTab('client'); // Switch to Client Hub so they can try paying it
  };

  // Simulate Stellar Invoice Payment Workflow
  const handleSimulatePayment = (invoice) => {
    if (isSimulatingTx) return;
    setIsSimulatingTx(true);
    setCurrentPayingInvoice(invoice.id);
    setSimLogs([]);
    
    const logs = [
      { text: '⏳ Initiating Stellar Freighter Wallet request...', type: 'info' },
      { text: `🔑 Connection detected for: ${walletAddress.slice(0, 6)}...${walletAddress.slice(-6)}`, type: 'stellar' },
      { text: '🛰️ Fetching destination Horizon trustlines for USDC/XLM...', type: 'info' },
      { text: '📜 Constructing Stellar transaction sequence object...', type: 'info' },
      { text: `💸 Adding payment operation: ${invoice.amountUsd} USDC (${invoice.amountXlm} XLM) to Kwagee split ledger...`, type: 'info' },
      { text: '🖊️ Requesting cryptographic signature via Freighter...', type: 'stellar' },
      { text: '🚀 Submitting transaction payload to Stellar Testnet Horizon server...', type: 'stellar' },
      { text: '📡 Horizon: Processing ledger state update... (takes 3-5 seconds)', type: 'info' },
      { text: '🎉 LEDGER CONFIRMED! Sequence verified.', type: 'success' },
      { text: `🔗 TX Hash: ${Math.random().toString(16).substring(2, 10)}8f4b00de${Math.random().toString(16).substring(2, 10)}e`, type: 'success' },
      { text: `💰 Kwagee preprogrammed allocation handler triggered successfully!`, type: 'success' }
    ];

    let currentLogIndex = 0;
    const interval = setInterval(() => {
      if (currentLogIndex < logs.length) {
        setSimLogs(prev => [...prev, logs[currentLogIndex]]);
        currentLogIndex++;
      } else {
        clearInterval(interval);
        
        // Payout succeeded
        setInvoices(prev => prev.map(inv => inv.id === invoice.id ? { ...inv, status: 'paid' } : inv));
        setIsSimulatingTx(false);
        setCurrentPayingInvoice(null);

        // Adjust Freelancer balance
        const payoutUsd = invoice.amountUsd;
        const payoutXlm = invoice.amountXlm;
        
        setBalances(prev => ({
          xlm: prev.xlm + payoutXlm,
          usdc: prev.usdc + payoutUsd,
          php: prev.php + (payoutUsd * 57)
        }));

        // Display Allocation cascade banner
        setCascadePayout({ usd: payoutUsd, xlm: payoutXlm });
        setShowCascadeOverlay(true);
        
        // Animate mini bars in overlay after rendering
        setTimeout(() => {
          setCascadeAnimateWidths({
            savings: allocations.savings,
            gov: allocations.gov,
            tax: allocations.tax,
            bills: allocations.bills,
            spendable: allocations.spendable
          });
        }, 100);
      }
    }, 450);
  };

  return (
    <div className="app-container">
      {/* HEADER SECTION */}
      <header className="app-header">
        <div className="logo-section">
          <div className="logo-icon-container">
            <Sparkles size={22} className="text-white" />
          </div>
          <div>
            <div className="logo-text">Kwagee</div>
            <div className="logo-sub">On-Chain Self-Budgeting</div>
          </div>
        </div>
        
        {isEditingWallet ? (
          <div className="wallet-badge-edit" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input 
              type="text"
              value={walletInputVal}
              onChange={(e) => setWalletInputVal(e.target.value)}
              onBlur={() => {
                if (walletInputVal.trim().length >= 8) {
                  setWalletAddress(walletInputVal.trim());
                }
                setIsEditingWallet(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (walletInputVal.trim().length >= 8) {
                    setWalletAddress(walletInputVal.trim());
                  }
                  setIsEditingWallet(false);
                }
              }}
              placeholder="Paste G... address"
              className="form-input"
              style={{
                padding: '4px 8px',
                fontSize: '11px',
                fontFamily: 'monospace',
                width: '180px',
                background: 'rgba(10, 6, 22, 0.8)',
                border: '1px solid var(--primary-glow)',
                color: '#fff',
                borderRadius: '8px',
              }}
              autoFocus
            />
          </div>
        ) : (
          <div 
            className="wallet-badge" 
            onClick={() => { 
              setIsEditingWallet(true); 
              setWalletInputVal(walletAddress); 
            }} 
            title="Click to edit and test your own wallet address"
          >
            <div className="wallet-dot"></div>
            <span className="wallet-address">
              Freighter: {walletAddress.slice(0, 6)}...{walletAddress.slice(-6)}
            </span>
          </div>
        )}
      </header>

      {/* DASHBOARD GRID */}
      <div className="dashboard-grid">
        {/* LEFT COLUMN: WORKER PORTAL & ALLOCATION VISUALIZER */}
        <div className="glass-panel">
          <div className="panel-title">
            <Calculator size={20} className="text-purple-accent" />
            <span>Preprogrammed Allocation Visualizer</span>
          </div>

          {/* Core Balances Hub */}
          <div className="balance-strip">
            <div className="balance-card">
              <div className="balance-label">
                <Coins size={12} className="text-success-color" />
                <span>Simulated Wallet Balance</span>
              </div>
              <div className="balance-val">${balances.usdc.toLocaleString()} USDC</div>
              <div className="balance-sub">{balances.xlm.toLocaleString()} XLM (Est.)</div>
            </div>
            
            <div className="balance-card">
              <div className="balance-label">
                <ArrowUpRight size={12} style={{ color: '#00f5d4' }} />
                <span>PHP Off-Ramp Value</span>
              </div>
              <div className="balance-val">₱{balances.php.toLocaleString()} PHP</div>
              <div className="balance-sub">1 USDC ≈ 57.00 PHP</div>
            </div>

            <div className="balance-card">
              <div className="balance-label">
                <PiggyBank size={12} style={{ color: '#ff9f1c' }} />
                <span>Smart Budget Split</span>
              </div>
              <div className="balance-val">{isAutosaveActive ? 'AUTOPAY ON' : 'MANUAL'}</div>
              <div className="balance-sub">Splits instantly on payout</div>
            </div>
          </div>

          {/* Allocation sliders and rings */}
          <div className="allocation-container">
            {/* Sliders */}
            <div className="sliders-panel">
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                Define how client invoice payouts should be split automatically when received on-chain.
              </p>

              {Object.keys(allocations).map((key) => {
                const config = allocationConfig[key];
                const IconComp = config.icon;
                return (
                  <div key={key} className={`slider-group ${key}`}>
                    <div className="slider-header">
                      <span className="slider-label">
                        <IconComp size={16} style={{ color: config.color }} />
                        {config.label}
                      </span>
                      <span className="slider-pct" style={{ color: config.color }}>
                        {allocations[key]}%
                      </span>
                    </div>
                    <input 
                      type="range"
                      min="0"
                      max="100"
                      value={allocations[key]}
                      className="custom-range"
                      onChange={(e) => handleAllocationChange(key, e.target.value)}
                    />
                  </div>
                );
              })}

              {/* Autobalance warning / logic */}
              {totalAllocationPct !== 100 ? (
                <div className="validation-warning">
                  <ShieldAlert size={16} />
                  <span>Total allocations sum to <strong>{totalAllocationPct}%</strong>. Must equal 100%.</span>
                  <button 
                    onClick={handleAutoBalance}
                    style={{
                      marginLeft: 'auto',
                      background: 'rgba(255, 159, 28, 0.2)',
                      border: 'none',
                      color: 'var(--warning-color)',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '11px',
                      fontWeight: 700
                    }}
                  >
                    Auto-Balance
                  </button>
                </div>
              ) : (
                <div className="validation-ok">
                  <CheckCircle size={16} />
                  <span>Allocation profiles fully optimized and balanced! (100%)</span>
                </div>
              )}
            </div>

            {/* SVG Concentric Rings Chart Representation */}
            <div className="allocation-chart-panel">
              <div className="chart-visual">
                <svg width="100%" height="100%" viewBox="0 0 160 160">
                  <circle cx="80" cy="80" r="70" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="8" />
                  <circle cx="80" cy="80" r="58" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="8" />
                  <circle cx="80" cy="80" r="46" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="8" />
                  <circle cx="80" cy="80" r="34" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="8" />
                  <circle cx="80" cy="80" r="22" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="8" />
                  
                  {/* Savings Ring */}
                  <circle cx="80" cy="80" r="70" fill="none" 
                    stroke={allocationConfig.savings.color} 
                    strokeWidth="8" 
                    strokeDasharray="439.8"
                    strokeDashoffset={439.8 - (439.8 * allocations.savings) / 100}
                    strokeLinecap="round"
                    transform="rotate(-90 80 80)"
                    style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
                  />

                  {/* Gov Ring */}
                  <circle cx="80" cy="80" r="58" fill="none" 
                    stroke={allocationConfig.gov.color} 
                    strokeWidth="8" 
                    strokeDasharray="364.4"
                    strokeDashoffset={364.4 - (364.4 * allocations.gov) / 100}
                    strokeLinecap="round"
                    transform="rotate(-90 80 80)"
                    style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
                  />

                  {/* Tax Ring */}
                  <circle cx="80" cy="80" r="46" fill="none" 
                    stroke={allocationConfig.tax.color} 
                    strokeWidth="8" 
                    strokeDasharray="289.0"
                    strokeDashoffset={289.0 - (289.0 * allocations.tax) / 100}
                    strokeLinecap="round"
                    transform="rotate(-90 80 80)"
                    style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
                  />

                  {/* Bills Ring */}
                  <circle cx="80" cy="80" r="34" fill="none" 
                    stroke={allocationConfig.bills.color} 
                    strokeWidth="8" 
                    strokeDasharray="213.6"
                    strokeDashoffset={213.6 - (213.6 * allocations.bills) / 100}
                    strokeLinecap="round"
                    transform="rotate(-90 80 80)"
                    style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
                  />

                  {/* Spendable Ring */}
                  <circle cx="80" cy="80" r="22" fill="none" 
                    stroke={allocationConfig.spendable.color} 
                    strokeWidth="8" 
                    strokeDasharray="138.2"
                    strokeDashoffset={138.2 - (138.2 * allocations.spendable) / 100}
                    strokeLinecap="round"
                    transform="rotate(-90 80 80)"
                    style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
                  />
                </svg>

                <div className="chart-center-info">
                  <div className="chart-center-val">{allocations.savings}%</div>
                  <div className="chart-center-lbl">Savings Rate</div>
                </div>
              </div>

              {/* Dynamic dollar distributions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', width: '100%' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Show split on amount:</span>
                <input 
                  type="number"
                  value={simAmount}
                  onChange={(e) => setSimAmount(Number(e.target.value))}
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--border-light)',
                    color: '#fff',
                    borderRadius: '8px',
                    padding: '4px 8px',
                    width: '70px',
                    fontSize: '12px',
                    fontWeight: 700,
                    textAlign: 'center',
                    fontFamily: 'var(--font-outfit)'
                  }}
                />
                <span style={{ fontSize: '11px', color: 'var(--purple-light)' }}>USDC</span>
              </div>

              <div className="chart-details-list">
                {Object.keys(allocations).map((key) => {
                  const valUsd = (simAmount * allocations[key]) / 100;
                  const valPhp = valUsd * 57;
                  return (
                    <div key={key} className="chart-detail-item">
                      <span className="chart-detail-label">
                        <div className="color-indicator" style={{ backgroundColor: allocationConfig[key].color }}></div>
                        {key.toUpperCase()}
                      </span>
                      <div className="chart-detail-values">
                        <span className="chart-detail-val-usd">${valUsd.toFixed(1)} USDC</span>
                        <span className="chart-detail-val-php">₱{valPhp.toLocaleString(undefined, {maximumFractionDigits: 0})} PHP</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Master Autopay Toggle bar */}
          <div className="autosave-bar">
            <div className="autosave-info">
              <Zap size={22} style={{ color: 'var(--success-color)' }} />
              <div className="autosave-text">
                <span className="autosave-title">Preprogrammed Autopay Assistant</span>
                <span className="autosave-desc">
                  Automatically split, convert to PHP, and lock allocations upon on-chain settlement.
                </span>
              </div>
            </div>
            
            <label className="switch">
              <input 
                type="checkbox" 
                checked={isAutosaveActive}
                onChange={() => setIsAutosaveActive(!isAutosaveActive)}
              />
              <span className="slider-switch"></span>
            </label>
          </div>
        </div>

        {/* RIGHT COLUMN: CLIENT SMART INVOICING SANDBOX & LEDGER */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Dashboard Tabs Selector */}
          <div style={{
            display: 'flex',
            background: 'var(--panel-bg)',
            border: '1px solid var(--border-light)',
            padding: '4px',
            borderRadius: '16px'
          }}>
            <button 
              onClick={() => setActiveTab('worker')}
              style={{
                flex: 1,
                background: activeTab === 'worker' ? 'linear-gradient(135deg, var(--purple-dim), var(--primary-glow))' : 'transparent',
                border: 'none',
                color: '#fff',
                padding: '10px',
                borderRadius: '12px',
                fontFamily: 'var(--font-outfit)',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'var(--transition-smooth)'
              }}
            >
              Freelancer Invoices
            </button>
            <button 
              onClick={() => setActiveTab('client')}
              style={{
                flex: 1,
                background: activeTab === 'client' ? 'linear-gradient(135deg, var(--purple-dim), var(--primary-glow))' : 'transparent',
                border: 'none',
                color: '#fff',
                padding: '10px',
                borderRadius: '12px',
                fontFamily: 'var(--font-outfit)',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'var(--transition-smooth)'
              }}
            >
              Client Payment Sandbox
            </button>
          </div>

          {activeTab === 'worker' ? (
            /* Freelancer Tab: Invoice creation */
            <div className="glass-panel" style={{ flex: 1 }}>
              <div className="panel-title">
                <FileText size={20} className="text-purple-accent" />
                <span>Smart Invoice Generator</span>
              </div>
              
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '18px' }}>
                Instantly draft verifiable smart contract invoices ready for Freighter signature and Stellar Testnet funding.
              </p>

              <form onSubmit={handleCreateInvoice} className="invoice-form">
                <div className="form-group">
                  <label>Project / Invoice Description</label>
                  <input 
                    type="text" 
                    value={newInvDesc}
                    onChange={(e) => setNewInvDesc(e.target.value)}
                    placeholder="e.g. SSS Contribution offramp / Smart contracts"
                    className="form-input"
                    required
                  />
                </div>
                
                <div className="input-row">
                  <div className="form-group">
                    <label>Client Name</label>
                    <input 
                      type="text" 
                      value={newInvClient}
                      onChange={(e) => setNewInvClient(e.target.value)}
                      placeholder="e.g. Acme Corp"
                      className="form-input"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Amount (USD)</label>
                    <input 
                      type="number" 
                      value={newInvAmount}
                      onChange={(e) => setNewInvAmount(Number(e.target.value))}
                      placeholder="Amount"
                      className="form-input"
                      min="50"
                      required
                    />
                  </div>
                </div>

                <button type="submit" className="btn-primary">
                  <FileText size={16} />
                  <span>Draft Smart Invoice</span>
                </button>
              </form>
              
              {/* Draft List */}
              <div className="client-sandbox">
                <div className="sandbox-header">
                  <Coins size={14} />
                  <span>Your Invoices ledger ({invoices.length})</span>
                </div>

                {invoices.map((invoice) => (
                  <div key={invoice.id} className={`invoice-item ${invoice.status}`}>
                    <div className="invoice-main-info">
                      <div>
                        <div className="invoice-desc">{invoice.description}</div>
                        <div className="invoice-client">Client: {invoice.client} — {invoice.date}</div>
                      </div>
                      <div className="invoice-pricing">
                        <div className="invoice-amount-usd">${invoice.amountUsd} USD</div>
                        <div className="invoice-amount-xlm">{invoice.amountXlm} XLM (est)</div>
                      </div>
                    </div>

                    <div className="invoice-action-bar">
                      <span className={`invoice-status-badge ${invoice.status}`}>
                        {invoice.status === 'paid' ? 'Paid' : 'Pending Client payment'}
                      </span>
                      
                      {invoice.status === 'pending' && (
                        <button 
                          onClick={() => {
                            setActiveTab('client');
                            handleSimulatePayment(invoice);
                          }}
                          className="btn-pay-simulate"
                        >
                          Simulate client payment
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Client Tab: Interactive payment simulator */
            <div className="glass-panel" style={{ flex: 1 }}>
              <div className="panel-title">
                <Zap size={20} className="text-purple-accent" />
                <span>Stellar Ledger Sandbox Simulator</span>
              </div>
              
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '18px' }}>
                Simulate freighter transactions and watch standard Stellar payment protocols process in real time.
              </p>

              <div className="client-sandbox" style={{ border: 'none', paddingTop: 0, marginTop: 0 }}>
                {invoices.filter(i => i.status === 'pending').length === 0 ? (
                  <div style={{
                    padding: '30px 20px',
                    textAlign: 'center',
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: '16px',
                    border: '1px dashed var(--border-light)',
                    color: 'var(--text-secondary)'
                  }}>
                    <CheckCircle size={32} style={{ color: 'var(--success-color)', margin: '0 auto 12px' }} />
                    <h4 style={{ color: '#fff', marginBottom: '4px' }}>All Invoices Settled!</h4>
                    <p style={{ fontSize: '11px' }}>Create a new invoice in the Freelancer tab to simulate another payment cycle.</p>
                  </div>
                ) : (
                  invoices.filter(i => i.status === 'pending').map((invoice) => (
                    <div key={invoice.id} className="invoice-item pending">
                      <div className="invoice-main-info">
                        <div>
                          <div className="invoice-desc">{invoice.description}</div>
                          <div className="invoice-client">Invoice Reference ID: {invoice.id}</div>
                        </div>
                        <div className="invoice-pricing">
                          <div className="invoice-amount-usd">${invoice.amountUsd} USD</div>
                          <div className="invoice-amount-xlm">{invoice.amountXlm} XLM</div>
                        </div>
                      </div>

                      <div className="invoice-action-bar">
                        <span className="invoice-status-badge pending">
                          Awaiting Payment Action
                        </span>
                        
                        <button 
                          disabled={isSimulatingTx}
                          onClick={() => handleSimulatePayment(invoice)}
                          className="btn-pay-simulate"
                        >
                          {currentPayingInvoice === invoice.id ? 'Processing...' : 'Pay with Freighter'}
                        </button>
                      </div>
                    </div>
                  ))
                )}

                {/* Simulated Ledger Log streams */}
                {(isSimulatingTx || simLogs.length > 0) && (
                  <div style={{ marginTop: '20px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--purple-light)', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Live Horizon Stellar Node Streamer</span>
                      {isSimulatingTx && <RefreshCw size={10} className="animate-spin" />}
                    </div>
                    
                    <div className="stellar-live-logger">
                      {simLogs.map((log, index) => (
                        <div key={index} className={`log-entry ${log.type}`}>
                          <ChevronRight size={10} style={{ marginTop: '3px', flexShrink: 0 }} />
                          <span>{log.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* TEAM CREDITS MODAL PANEL */}
      <div className="team-credits-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Users size={18} className="text-purple-accent" />
          <span style={{ fontSize: '16px', fontWeight: 800 }}>Kwagee Builders Council</span>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
          Leveraging Stellar's native financial rails to bring institutional payroll security entirely on-chain.
        </p>

        <div className="team-grid">
          <div className="team-member">
            <div className="team-member-name">Isidro, James Patrick</div>
            <div className="team-member-role">Stellar Integration Lead</div>
          </div>
          <div className="team-member">
            <div className="team-member-name">Hernandez, Harold Benedict</div>
            <div className="team-member-role">Project Manager</div>
          </div>
          <div className="team-member">
            <div className="team-member-name">Nuesca, Geena Mae</div>
            <div className="team-member-role">Frontend & UI Dev</div>
          </div>
          <div className="team-member">
            <div className="team-member-name">Tan, Migel</div>
            <div className="team-member-role">Product & Git Lead</div>
          </div>
          <div className="team-member">
            <div className="team-member-name">Villegas, Kezia Lorein</div>
            <div className="team-member-role">Smart Contract Lead</div>
          </div>
        </div>
      </div>

      {/* INTERACTIVE CASCADING ALLOCATION TRIGGER OVERLAY BANNER */}
      {showCascadeOverlay && (
        <div className="cascade-alert-overlay">
          <div className="cascade-title">
            <Sparkles size={18} />
            <span>Kwagee Autopay Cascade Settled!</span>
          </div>
          
          <div className="cascade-sub-text">
            Received <strong>${cascadePayout.usd} USDC</strong> ({cascadePayout.xlm} XLM). 
            Allocations automatically filtered down the chain:
          </div>

          <div className="cascade-allocation-bar-stack">
            {Object.keys(allocations).map((key) => {
              const config = allocationConfig[key];
              const pct = allocations[key];
              const cutUsd = (cascadePayout.usd * pct) / 100;
              const cutPhp = cutUsd * 57;
              return (
                <div key={key}>
                  <div className="cascade-mini-bar">
                    <span style={{ color: config.color, fontWeight: 700 }}>
                      {key.toUpperCase()} ({pct}%)
                    </span>
                    <span style={{ color: '#fff', fontWeight: 600 }}>
                      ${cutUsd.toFixed(1)} USDC / ₱{cutPhp.toLocaleString(undefined, {maximumFractionDigits: 0})} PHP
                    </span>
                  </div>
                  <div className="cascade-bar-progress-container">
                    <div 
                      className="cascade-bar-fill" 
                      style={{ 
                        backgroundColor: config.color,
                        width: `${cascadeAnimateWidths[key]}%`,
                        boxShadow: `0 0 8px ${config.color}`
                      }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>

          <button 
            onClick={() => {
              setShowCascadeOverlay(false);
              setCascadeAnimateWidths({
                savings: 0, gov: 0, tax: 0, bills: 0, spendable: 0
              });
            }}
            className="btn-close-overlay"
          >
            Acknowledge splits & continue
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
