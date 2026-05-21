import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  ArrowUpRight, 
  Coins, 
  PiggyBank, 
  ShieldAlert, 
  CheckCircle, 
  RefreshCw, 
  Users, 
  Zap, 
  ChevronRight, 
  Sparkles, 
  LogOut,
  Send,
  History,
  Lock,
  ArrowDownLeft,
  Calculator
} from 'lucide-react';

function App() {
  // Wallet Address State
  const [walletAddress, setWalletAddress] = useState('');
  const [isEditingWallet, setIsEditingWallet] = useState(false);
  const [walletInputVal, setWalletInputVal] = useState('');
  const [landingError, setLandingError] = useState('');
  
  // Network Selection
  const [network, setNetwork] = useState('testnet'); // Default to testnet
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [balanceError, setBalanceError] = useState('');

  // App Tabs States: 'savings' | 'budgeting' | 'transfer'
  const [activeTab, setActiveTab] = useState('savings');
  
  // Base Live Balances
  const [balances, setBalances] = useState({
    xlm: 0,
    usdc: 0,
    php: 0,
  });

  // Real-time payments history fetched from Horizon
  const [transactions, setTransactions] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Budget Allocator states
  const [budgetAmount, setBudgetAmount] = useState(0); // Chosen amount to budget in USDC
  
  // Micro-allocation Percentages of the budgeted amount (Must sum to 100%)
  const [allocations, setAllocations] = useState({
    gov: 20,       // Gov Welfare (SSS/PhilHealth/PagIBIG)
    tax: 15,       // Income Tax Reserve
    bills: 25,     // Bills & Utilities
    spendable: 40  // Spendable Cash
  });

  // Allocation Config (Labels, Colors, Icons)
  const allocationConfig = {
    gov: { label: 'Gov Welfare (SSS/PhilHealth/PagIBIG)', color: '#ff9f1c', icon: ShieldAlert },
    tax: { label: 'Income Tax Reserve', color: '#ff007f', icon: Zap },
    bills: { label: 'Bills & Utilities', color: '#3a86ff', icon: RefreshCw },
    spendable: { label: 'Spendable Cash', color: '#9d4edd', icon: Coins }
  };

  // Transfer Form States
  const [transferRecipient, setTransferRecipient] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferAsset, setTransferAsset] = useState('XLM');
  const [isSimulatingTransfer, setIsSimulatingTransfer] = useState(false);
  const [transferLogs, setTransferLogs] = useState([]);
  const [showTransferSuccess, setShowTransferSuccess] = useState(false);
  const [lastTxHash, setLastTxHash] = useState('');

  // Fetch Live Balance from Stellar Horizon Ledger
  useEffect(() => {
    const fetchBalance = async () => {
      const cleanAddress = walletAddress.trim();
      if (!cleanAddress || cleanAddress.length < 30) return;
      
      setIsLoadingBalance(true);
      setBalanceError('');
      
      const horizonUrl = network === 'mainnet' 
        ? `https://horizon.stellar.org/accounts/${cleanAddress}`
        : `https://horizon-testnet.stellar.org/accounts/${cleanAddress}`;

      try {
        const response = await fetch(horizonUrl);
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error(`Account not created/funded on ${network.toUpperCase()} yet.`);
          }
          throw new Error('Could not fetch account from Horizon server.');
        }
        
        const data = await response.json();
        
        let xlmBalance = 0;
        let usdcBalance = 0;

        if (data.balances && Array.isArray(data.balances)) {
          data.balances.forEach(b => {
            if (b.asset_type === 'native') {
              xlmBalance = parseFloat(b.balance);
            } else if (b.asset_code === 'USDC') {
              usdcBalance = parseFloat(b.balance);
            }
          });
        }

        setBalances({
          xlm: xlmBalance,
          usdc: usdcBalance,
          php: usdcBalance > 0 ? usdcBalance * 57 : xlmBalance * 0.11 * 57 // Fallback using mock XLM price if no USDC
        });

        // Initialize budgetAmount to a default split (40%) if it is 0
        setBudgetAmount(prev => {
          if (prev === 0 && usdcBalance > 0) {
            return Math.round(usdcBalance * 0.4);
          }
          return prev;
        });

      } catch (err) {
        setBalanceError(err.message);
        setBalances({
          xlm: 0,
          usdc: 0,
          php: 0
        });
      } finally {
        setIsLoadingBalance(false);
      }
    };

    fetchBalance();
  }, [walletAddress, network]);

  // Fetch Live Chronological Transaction Payments Feed
  useEffect(() => {
    const fetchHistory = async () => {
      const cleanAddress = walletAddress.trim();
      if (!cleanAddress || cleanAddress.length < 30) return;

      setIsLoadingHistory(true);
      const horizonUrl = network === 'mainnet'
        ? `https://horizon.stellar.org/accounts/${cleanAddress}/payments?limit=10&order=desc`
        : `https://horizon-testnet.stellar.org/accounts/${cleanAddress}/payments?limit=10&order=desc`;

      try {
        const response = await fetch(horizonUrl);
        if (response.ok) {
          const data = await response.json();
          if (data._embedded && Array.isArray(data._embedded.records)) {
            setTransactions(data._embedded.records);
          } else {
            setTransactions([]);
          }
        } else {
          setTransactions([]);
        }
      } catch (e) {
        console.error("Failed to fetch payments history:", e);
        setTransactions([]);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    fetchHistory();
  }, [walletAddress, network]);

  // Calculate sum of micro-allocations
  const totalAllocationPct = allocations.gov + allocations.tax + allocations.bills + allocations.spendable;

  // Auto-balance Allocations to equal 100%
  const handleAutoBalance = () => {
    setAllocations({
      gov: 20,
      tax: 15,
      bills: 25,
      spendable: 40
    });
  };

  // Update a single micro-allocation percentage
  const handleAllocationChange = (key, value) => {
    const val = parseInt(value, 10) || 0;
    setAllocations(prev => ({
      ...prev,
      [key]: val
    }));
  };

  // Trigger simulated transfer with live console logging
  const handleTransferSubmit = (e) => {
    e.preventDefault();
    const cleanRecipient = transferRecipient.trim();
    if (!cleanRecipient || !transferAmount || Number(transferAmount) <= 0) return;
    
    const amount = Number(transferAmount);
    if (transferAsset === 'USDC' && amount > balances.usdc) {
      alert("Insufficient USDC balance.");
      return;
    }
    if (transferAsset === 'XLM' && amount > balances.xlm) {
      alert("Insufficient XLM balance.");
      return;
    }

    setIsSimulatingTransfer(true);
    setTransferLogs([]);

    const logs = [
      { text: '⏳ Initiating Stellar Freighter Wallet request...', type: 'info' },
      { text: `🔑 Connection detected for: ${walletAddress.slice(0, 6)}...${walletAddress.slice(-6)}`, type: 'stellar' },
      { text: `🛰️ Resolving destination trustlines for ${transferAsset}...`, type: 'info' },
      { text: '📜 Constructing Stellar transaction sequence object...', type: 'info' },
      { text: `💸 Operation: Payment of ${amount} ${transferAsset} to ${cleanRecipient.slice(0, 6)}...${cleanRecipient.slice(-6)}`, type: 'info' },
      { text: '🖊️ Requesting cryptographic signature via Freighter...', type: 'stellar' },
      { text: '🚀 Submitting signed transaction XDR payload to Stellar Horizon node...', type: 'stellar' },
      { text: '📡 Horizon: Processing ledger consensus (3-5 seconds)...', type: 'info' },
      { text: '🎉 LEDGER CONFIRMED! Sequence verified.', type: 'success' },
      { text: `💰 Debit transaction processed successfully!`, type: 'success' }
    ];

    let currentLogIndex = 0;
    const interval = setInterval(() => {
      if (currentLogIndex < logs.length) {
        setTransferLogs(prev => [...prev, logs[currentLogIndex]]);
        currentLogIndex++;
      } else {
        clearInterval(interval);
        setIsSimulatingTransfer(false);
        
        const hash = Math.random().toString(16).substring(2, 10) + '8f4b00de' + Math.random().toString(16).substring(2, 10) + 'e';
        setLastTxHash(hash);

        // Deduct from local balances
        setBalances(prev => {
          const newUsdc = transferAsset === 'USDC' ? Math.max(0, prev.usdc - amount) : prev.usdc;
          const newXlm = transferAsset === 'XLM' ? Math.max(0, prev.xlm - amount) : prev.xlm;
          return {
            xlm: newXlm,
            usdc: newUsdc,
            php: newUsdc > 0 ? newUsdc * 57 : newXlm * 0.11 * 57
          };
        });

        // Add a mock transaction record to the history stream at the top
        const newRecord = {
          id: Math.random().toString(),
          type: 'payment',
          amount: amount.toFixed(7),
          asset_type: transferAsset === 'XLM' ? 'native' : 'credit_alphanum4',
          asset_code: transferAsset === 'USDC' ? 'USDC' : undefined,
          from: walletAddress,
          to: cleanRecipient,
          created_at: new Date().toISOString(),
          transaction_hash: hash
        };
        setTransactions(prev => [newRecord, ...prev]);

        // Reset transfer input fields
        setTransferAmount('');
        setTransferRecipient('');
        setShowTransferSuccess(true);
      }
    }, 450);
  };

  // Handle landing connection submit
  const handleConnectSubmit = (e) => {
    e.preventDefault();
    const addr = walletInputVal.trim();
    if (!addr) {
      setLandingError('Please enter a Stellar address.');
      return;
    }
    if (!addr.startsWith('G') || addr.length < 30) {
      setLandingError('Invalid Stellar address. Public keys must start with "G" and be at least 30 characters long.');
      return;
    }
    setLandingError('');
    setWalletAddress(addr);
  };

  // Handle sandbox launch with a clean testnet address
  const handleSandboxLaunch = () => {
    setLandingError('');
    const sandboxAddr = 'GC2WNMONVHE5XWIUIMSAVVZ7NYKGWMCMHSI5JP24ZIH7FRTJ3I24IRJG';
    setWalletAddress(sandboxAddr);
    setWalletInputVal(sandboxAddr);
    setNetwork('testnet');
  };

  // Connect Account Layout
  if (!walletAddress) {
    return (
      <div className="landing-container">
        <div className="landing-card">
          <div className="landing-brand">
            <div className="landing-logo-container" style={{ background: 'transparent', boxShadow: 'none' }}>
              <img src="/kwagee_logo.png" alt="Kwagee Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <h1 className="landing-title">Kwagee</h1>
            <div className="landing-subtitle">On-Chain Self-Budgeting</div>
          </div>
          
          <p className="landing-description">
            Kwagee bridges Stellar's high-speed payment rails with automated, smart split-budgeting for global remote freelancers. Route your remote stablecoin payroll instantly to savings, taxes, bills, and welfare.
          </p>

          <form onSubmit={handleConnectSubmit} className="landing-form">
            <div className="landing-input-group">
              <input 
                type="text"
                placeholder="Paste your Stellar Public Address (starts with G)"
                value={walletInputVal}
                onChange={(e) => setWalletInputVal(e.target.value)}
                className="landing-input"
              />
              <select
                value={network}
                onChange={(e) => setNetwork(e.target.value)}
                className="landing-select"
              >
                <option value="testnet">Testnet</option>
                <option value="mainnet">Mainnet</option>
              </select>
            </div>

            {landingError && (
              <div className="validation-warning" style={{ width: '100%', justifyContent: 'center', marginBottom: '10px' }}>
                <ShieldAlert size={16} />
                <span>{landingError}</span>
              </div>
            )}

            <button type="submit" className="landing-btn-submit">
              <Wallet size={18} />
              <span>Connect Freighter Wallet</span>
            </button>
          </form>

          <div className="landing-divider">OR</div>

          <div className="landing-sandbox-box" onClick={handleSandboxLaunch}>
            <div className="landing-sandbox-title">
              <Sparkles size={16} />
              <span>Launch with Sandbox Wallet Address</span>
            </div>
            <p className="landing-sandbox-desc">
              Instantly view the dashboard using a standard Stellar testnet address (GC2WNMON...) containing live ledger balances.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Active Tab Rendering Logic
  return (
    <div className="app-container">
      {/* HEADER SECTION */}
      <header className="app-header">
        <div className="logo-section">
          <div className="logo-icon-container" style={{ background: 'transparent', boxShadow: 'none' }}>
            <img src="/kwagee_logo.png" alt="Kwagee Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <div>
            <div className="logo-text">Kwagee</div>
            <div className="logo-sub">Owl You Need!</div>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Network Selection Selector */}
          <select 
            value={network}
            onChange={(e) => setNetwork(e.target.value)}
            style={{
              background: 'rgba(157, 78, 221, 0.12)',
              border: '1px solid var(--border-light)',
              color: 'var(--purple-light)',
              borderRadius: '12px',
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: 700,
              fontFamily: 'var(--font-outfit)',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="testnet" style={{ background: '#0b071a' }}>Testnet</option>
            <option value="mainnet" style={{ background: '#0b071a' }}>Mainnet</option>
          </select>

          {isEditingWallet ? (
            <div className="wallet-badge-edit" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input 
                type="text"
                value={walletInputVal}
                onChange={(e) => setWalletInputVal(e.target.value)}
                onBlur={() => {
                  if (walletInputVal.trim().length >= 30) {
                    setWalletAddress(walletInputVal.trim());
                  }
                  setIsEditingWallet(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (walletInputVal.trim().length >= 30) {
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div 
                className="wallet-badge" 
                onClick={() => { 
                  setIsEditingWallet(true); 
                  setWalletInputVal(walletAddress); 
                }} 
                title="Click to edit public address"
              >
                <div className="wallet-dot" style={{ backgroundColor: isLoadingBalance ? '#a020f0' : (balanceError ? '#ff9f1c' : '#00f5d4') }}></div>
                <span className="wallet-address">
                  Connected: {walletAddress.slice(0, 6)}...{walletAddress.slice(-6)}
                </span>
              </div>
              
              <button 
                onClick={() => {
                  setWalletAddress('');
                  setWalletInputVal('');
                  setBalances({ xlm: 0, usdc: 0, php: 0 });
                  setTransactions([]);
                  setBudgetAmount(0);
                }}
                title="Disconnect Wallet"
                style={{
                  background: 'rgba(255, 0, 85, 0.1)',
                  border: '1px solid rgba(255, 0, 85, 0.25)',
                  color: '#ff0055',
                  borderRadius: '12px',
                  width: '34px',
                  height: '34px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'var(--transition-smooth)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 0, 85, 0.2)';
                  e.currentTarget.style.borderColor = '#ff0055';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 0, 85, 0.1)';
                  e.currentTarget.style.borderColor = 'rgba(255, 0, 85, 0.25)';
                }}
              >
                <LogOut size={14} />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* THREE TABS NAV SELECTOR */}
      <div style={{
        display: 'flex',
        background: 'var(--panel-bg)',
        border: '1px solid var(--border-light)',
        padding: '4px',
        borderRadius: '18px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.25)'
      }}>
        <button 
          onClick={() => setActiveTab('savings')}
          style={{
            flex: 1,
            background: activeTab === 'savings' ? 'linear-gradient(135deg, var(--purple-dim), var(--primary-glow))' : 'transparent',
            border: 'none',
            color: activeTab === 'savings' ? '#fff' : 'var(--text-secondary)',
            padding: '12px',
            borderRadius: '14px',
            fontFamily: 'var(--font-outfit)',
            fontWeight: 700,
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'pointer',
            transition: 'var(--transition-smooth)'
          }}
        >
          <Lock size={16} />
          <span>🏦 Savings Vault</span>
        </button>
        
        <button 
          onClick={() => setActiveTab('budgeting')}
          style={{
            flex: 1,
            background: activeTab === 'budgeting' ? 'linear-gradient(135deg, var(--purple-dim), var(--primary-glow))' : 'transparent',
            border: 'none',
            color: activeTab === 'budgeting' ? '#fff' : 'var(--text-secondary)',
            padding: '12px',
            borderRadius: '14px',
            fontFamily: 'var(--font-outfit)',
            fontWeight: 700,
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'pointer',
            transition: 'var(--transition-smooth)'
          }}
        >
          <PiggyBank size={16} />
          <span>🧾 Budget Allocator</span>
        </button>

        <button 
          onClick={() => setActiveTab('transfer')}
          style={{
            flex: 1,
            background: activeTab === 'transfer' ? 'linear-gradient(135deg, var(--purple-dim), var(--primary-glow))' : 'transparent',
            border: 'none',
            color: activeTab === 'transfer' ? '#fff' : 'var(--text-secondary)',
            padding: '12px',
            borderRadius: '14px',
            fontFamily: 'var(--font-outfit)',
            fontWeight: 700,
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'pointer',
            transition: 'var(--transition-smooth)'
          }}
        >
          <Send size={16} />
          <span>💸 Transfer & History</span>
        </button>
      </div>

      {/* DASHBOARD CONTENT BODY */}
      <div className="dashboard-grid" style={{ gridTemplateColumns: activeTab === 'transfer' ? '1fr 1.2fr' : '1.3fr 1fr' }}>
        
        {/* ==================== TAB 1: SAVINGS VAULT ==================== */}
        {activeTab === 'savings' && (
          <>
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="panel-title">
                <Lock size={22} style={{ color: 'var(--success-color)' }} />
                <span>Secure Personal Savings Vault (Direct Address Balance)</span>
              </div>

              {balanceError && (
                <div className="validation-warning" style={{ border: '1px solid rgba(255, 159, 28, 0.3)' }}>
                  <ShieldAlert size={16} />
                  <span style={{ fontSize: '11px' }}>{balanceError}</span>
                  {network === 'testnet' && (
                    <button 
                      onClick={async () => {
                        setIsLoadingBalance(true);
                        try {
                          const res = await fetch(`https://friendbot.stellar.org/?addr=${walletAddress.trim()}`);
                          if (res.ok) {
                            setWalletAddress(prev => prev + ' ');
                            setTimeout(() => {
                              setWalletAddress(prev => prev.trim());
                            }, 50);
                          }
                        } catch (e) {
                          setBalanceError('Friendbot connection failed.');
                        } finally {
                          setIsLoadingBalance(false);
                        }
                      }}
                      style={{
                        marginLeft: 'auto',
                        background: 'var(--success-color)',
                        border: 'none',
                        color: '#06040d',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '11px',
                        fontWeight: 800
                      }}
                    >
                      {isLoadingBalance ? 'Funding...' : 'Fund 10,000 XLM'}
                    </button>
                  )}
                </div>
              )}

              <div style={{
                background: 'rgba(10, 6, 22, 0.5)',
                border: '1px solid var(--border-light)',
                borderRadius: '24px',
                padding: '40px 24px',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '-40px',
                  right: '-40px',
                  width: '160px',
                  height: '160px',
                  background: 'radial-gradient(circle, rgba(0, 245, 212, 0.08) 0%, transparent 70%)',
                  pointerEvents: 'none'
                }}></div>

                <div style={{
                  width: '64px',
                  height: '64px',
                  background: 'rgba(0, 245, 212, 0.08)',
                  border: '1px solid rgba(0, 245, 212, 0.25)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px',
                  color: 'var(--success-color)',
                  boxShadow: '0 0 15px rgba(0, 245, 212, 0.15)'
                }}>
                  <Lock size={32} />
                </div>

                <h3 style={{ fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '1px' }}>
                  Aggregate Account Balance
                </h3>
                <h1 style={{ fontSize: '48px', fontWeight: 800, color: '#fff', margin: '8px 0 4px' }}>
                  ${balances.usdc.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC
                </h1>
                <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--success-color)' }}>
                  ₱{balances.php.toLocaleString(undefined, { maximumFractionDigits: 0 })} PHP Value
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-dim)', marginTop: '8px' }}>
                  {balances.xlm.toLocaleString(undefined, { maximumFractionDigits: 2 })} XLM (Native Asset)
                </div>
              </div>

              <div style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: '16px',
                padding: '20px',
                fontSize: '13px',
                lineHeight: '1.6',
                color: 'var(--text-secondary)'
              }}>
                <strong style={{ color: '#fff', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <ShieldAlert size={16} className="text-success-color" />
                  Untouchable Base Rule
                </strong>
                The aggregate balance displayed above corresponds strictly to your live, on-chain public address holdings. The Kwagee dashboard treats this core value as safe and untouched from daily spend obligations until you explicitly choose to allocate an amount to budget.
              </div>
            </div>

            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="panel-title">
                <Wallet size={20} className="text-purple-accent" />
                <span>Stellar Address Information</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-light)', padding: '16px', borderRadius: '14px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Connected Public Key
                  </span>
                  <div style={{ 
                    fontFamily: 'monospace', 
                    fontSize: '12px', 
                    color: '#fff', 
                    wordBreak: 'break-all', 
                    marginTop: '6px',
                    background: 'rgba(255,255,255,0.03)',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.05)'
                  }}>
                    {walletAddress}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '4px 8px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Horizon Ledger Node:</span>
                  <span style={{ color: 'var(--purple-light)', fontWeight: 600 }}>
                    {network === 'mainnet' ? 'Stellar Horizon (Mainnet)' : 'Stellar Horizon (Testnet)'}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '4px 8px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Off-Ramp Rate:</span>
                  <span style={{ color: 'var(--success-color)', fontWeight: 700 }}>
                    1 USDC ≈ 57.00 PHP
                  </span>
                </div>

                {network === 'testnet' && (
                  <button 
                    onClick={async () => {
                      setIsLoadingBalance(true);
                      try {
                        const res = await fetch(`https://friendbot.stellar.org/?addr=${walletAddress.trim()}`);
                        if (res.ok) {
                          alert("Account successfully funded with 10,000 testnet XLM!");
                          // Trigger reload by slightly changing state
                          setWalletAddress(prev => prev + ' ');
                          setTimeout(() => setWalletAddress(prev => prev.trim()), 50);
                        } else {
                          alert("Friendbot rate limited or failed. Try again in a minute.");
                        }
                      } catch (e) {
                        alert("Friendbot funding failed.");
                      } finally {
                        setIsLoadingBalance(false);
                      }
                    }}
                    disabled={isLoadingBalance}
                    className="btn-primary"
                    style={{ marginTop: '10px' }}
                  >
                    <RefreshCw size={14} className={isLoadingBalance ? "animate-spin" : ""} />
                    <span>{isLoadingBalance ? "Requesting..." : "Get 10,000 Testnet XLM (Friendbot)"}</span>
                  </button>
                )}
              </div>
            </div>
          </>
        )}

        {/* ==================== TAB 2: BUDGET ALLOCATOR ==================== */}
        {activeTab === 'budgeting' && (
          <>
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="panel-title">
                <PiggyBank size={22} className="text-purple-accent" />
                <span>Allocate Balance to Smart Splits</span>
              </div>

              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Input the specific amount of your actual USDC wallet balance you wish to budget. The remainder will remain strictly isolated as untouched Savings.
              </p>

              {/* Set budget amount controller */}
              <div style={{
                background: 'rgba(10, 6, 22, 0.4)',
                border: '1px solid var(--border-light)',
                borderRadius: '18px',
                padding: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                flexWrap: 'wrap'
              }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                    Choose Budget Amount (USDC)
                  </label>
                  <input 
                    type="range"
                    min="0"
                    max={balances.usdc > 0 ? Math.max(balances.usdc, budgetAmount) : 1000}
                    value={budgetAmount}
                    onChange={(e) => setBudgetAmount(Number(e.target.value))}
                    style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', outline: 'none', borderRadius: '3px', cursor: 'pointer' }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input 
                    type="number"
                    min="0"
                    value={budgetAmount}
                    onChange={(e) => setBudgetAmount(Number(e.target.value))}
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid var(--border-light)',
                      color: '#fff',
                      borderRadius: '8px',
                      padding: '8px',
                      width: '90px',
                      fontSize: '14px',
                      fontWeight: 700,
                      textAlign: 'center',
                      fontFamily: 'var(--font-outfit)'
                    }}
                  />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--purple-light)' }}>USDC</span>
                </div>
              </div>

              {/* Side-by-Side Bucket Displays */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{
                  background: 'linear-gradient(135deg, rgba(0, 245, 212, 0.05) 0%, rgba(10, 6, 22, 0.6) 100%)',
                  border: '1px solid rgba(0, 245, 212, 0.2)',
                  borderRadius: '16px',
                  padding: '16px',
                  position: 'relative'
                }}>
                  <div style={{ position: 'absolute', top: '12px', right: '12px', color: 'var(--success-color)' }}>
                    <Lock size={16} />
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>
                    🏦 Savings Bucket
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: '#fff', margin: '4px 0' }}>
                    ${Math.max(0, balances.usdc - budgetAmount).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--success-color)', fontWeight: 600 }}>
                    ₱{(Math.max(0, balances.usdc - budgetAmount) * 57).toLocaleString(undefined, { maximumFractionDigits: 0 })} PHP
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '4px' }}>
                    Strictly Untouchable
                  </div>
                </div>

                <div style={{
                  background: 'linear-gradient(135deg, rgba(157, 78, 221, 0.08) 0%, rgba(10, 6, 22, 0.6) 100%)',
                  border: '1px solid rgba(157, 78, 221, 0.25)',
                  borderRadius: '16px',
                  padding: '16px',
                  position: 'relative'
                }}>
                  <div style={{ position: 'absolute', top: '12px', right: '12px', color: 'var(--purple-accent)' }}>
                    <Zap size={16} />
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>
                    🧾 Budgets Bucket
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: '#fff', margin: '4px 0' }}>
                    ${budgetAmount.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--purple-light)', fontWeight: 600 }}>
                    ₱{(budgetAmount * 57).toLocaleString(undefined, { maximumFractionDigits: 0 })} PHP
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-dim)', marginTop: '4px' }}>
                    Active Allocated Portion
                  </div>
                </div>
              </div>

              {/* Sliders Panel */}
              <div className="sliders-panel" style={{ marginTop: '10px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--purple-light)', marginBottom: '4px' }}>
                  Micro-Allocations Split (Obligations)
                </div>

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

                {/* Validation Indicator */}
                {totalAllocationPct !== 100 ? (
                  <div className="validation-warning" style={{ marginTop: '10px' }}>
                    <ShieldAlert size={16} />
                    <span>Allocations sum to <strong>{totalAllocationPct}%</strong>. Must equal 100%.</span>
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
                  <div className="validation-ok" style={{ marginTop: '10px' }}>
                    <CheckCircle size={16} />
                    <span>Micro-allocation rules balanced perfectly! (100%)</span>
                  </div>
                )}
              </div>
            </div>

            {/* Concentric Rings Visualizer */}
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="panel-title">
                <Calculator size={20} className="text-purple-accent" />
                <span>Micro-Split Rings Model</span>
              </div>

              <div className="allocation-chart-panel" style={{ border: 'none', background: 'transparent', padding: 0 }}>
                <div className="chart-visual" style={{ width: '200px', height: '200px' }}>
                  <svg width="100%" height="100%" viewBox="0 0 160 160">
                    <circle cx="80" cy="80" r="70" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="8" />
                    <circle cx="80" cy="80" r="58" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="8" />
                    <circle cx="80" cy="80" r="46" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="8" />
                    <circle cx="80" cy="80" r="34" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="8" />
                    
                    {/* Ring 1: Spendable */}
                    <circle cx="80" cy="80" r="70" fill="none" 
                      stroke={allocationConfig.spendable.color} 
                      strokeWidth="8" 
                      strokeDasharray="439.8"
                      strokeDashoffset={439.8 - (439.8 * allocations.spendable) / 100}
                      strokeLinecap="round"
                      transform="rotate(-90 80 80)"
                      style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
                    />

                    {/* Ring 2: Bills */}
                    <circle cx="80" cy="80" r="58" fill="none" 
                      stroke={allocationConfig.bills.color} 
                      strokeWidth="8" 
                      strokeDasharray="364.4"
                      strokeDashoffset={364.4 - (364.4 * allocations.bills) / 100}
                      strokeLinecap="round"
                      transform="rotate(-90 80 80)"
                      style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
                    />

                    {/* Ring 3: Gov */}
                    <circle cx="80" cy="80" r="46" fill="none" 
                      stroke={allocationConfig.gov.color} 
                      strokeWidth="8" 
                      strokeDasharray="289.0"
                      strokeDashoffset={289.0 - (289.0 * allocations.gov) / 100}
                      strokeLinecap="round"
                      transform="rotate(-90 80 80)"
                      style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
                    />

                    {/* Ring 4: Tax */}
                    <circle cx="80" cy="80" r="34" fill="none" 
                      stroke={allocationConfig.tax.color} 
                      strokeWidth="8" 
                      strokeDasharray="213.6"
                      strokeDashoffset={213.6 - (213.6 * allocations.tax) / 100}
                      strokeLinecap="round"
                      transform="rotate(-90 80 80)"
                      style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
                    />
                  </svg>

                  <div className="chart-center-info">
                    <div className="chart-center-val">${budgetAmount}</div>
                    <div className="chart-center-lbl">Active Budget</div>
                  </div>
                </div>

                <div className="chart-details-list">
                  {Object.keys(allocations).map((key) => {
                    const pct = allocations[key];
                    const valUsd = (budgetAmount * pct) / 100;
                    const valPhp = valUsd * 57;
                    return (
                      <div key={key} className="chart-detail-item">
                        <span className="chart-detail-label">
                          <div className="color-indicator" style={{ backgroundColor: allocationConfig[key].color }}></div>
                          {key.toUpperCase()} ({pct}%)
                        </span>
                        <div className="chart-detail-values">
                          <span className="chart-detail-val-usd">${valUsd.toFixed(2)} USDC</span>
                          <span className="chart-detail-val-php">₱{valPhp.toLocaleString(undefined, {maximumFractionDigits: 0})} PHP</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ==================== TAB 3: TRANSFER & HISTORY ==================== */}
        {activeTab === 'transfer' && (
          <>
            {/* XLM / USDC Transfer Form */}
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="panel-title">
                <Send size={22} className="text-purple-accent" />
                <span>Submit Stellar Transfer</span>
              </div>

              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Transfer XLM or USDC instantly to any Stellar address. Supports simulated cryptographic Freighter signature pipelines.
              </p>

              <form onSubmit={handleTransferSubmit} className="invoice-form" style={{ margin: 0 }}>
                <div className="form-group">
                  <label>Recipient Public Address</label>
                  <input 
                    type="text" 
                    value={transferRecipient}
                    onChange={(e) => setTransferRecipient(e.target.value)}
                    placeholder="e.g. GB28... or GC2W..."
                    className="form-input"
                    style={{ fontFamily: 'monospace', fontSize: '12px' }}
                    required
                  />
                </div>

                <div className="input-row">
                  <div className="form-group">
                    <label>Select Asset</label>
                    <select
                      value={transferAsset}
                      onChange={(e) => setTransferAsset(e.target.value)}
                      className="form-input"
                      style={{ background: 'rgba(10, 6, 22, 0.6)', cursor: 'pointer' }}
                    >
                      <option value="XLM">XLM (Stellar Native)</option>
                      <option value="USDC">USDC (Stablecoin)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Amount</label>
                    <input 
                      type="number"
                      step="any"
                      min="0.0001"
                      value={transferAmount}
                      onChange={(e) => setTransferAmount(e.target.value)}
                      placeholder="Amount to send"
                      className="form-input"
                      required
                    />
                  </div>
                </div>

                <button type="submit" disabled={isSimulatingTransfer} className="btn-primary" style={{ marginTop: '8px' }}>
                  <Send size={16} />
                  <span>{isSimulatingTransfer ? 'Simulating Freighter Request...' : `Send ${transferAsset}`}</span>
                </button>
              </form>

              {/* simulated logs panel */}
              {(isSimulatingTransfer || transferLogs.length > 0) && (
                <div style={{ marginTop: '10px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--purple-light)', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Stellar Ledger Node Console</span>
                    {isSimulatingTransfer && <RefreshCw size={10} className="animate-spin" />}
                  </div>
                  
                  <div className="stellar-live-logger" style={{ maxHeight: '200px' }}>
                    {transferLogs.map((log, index) => (
                      <div key={index} className={`log-entry ${log.type}`}>
                        <ChevronRight size={10} style={{ marginTop: '3px', flexShrink: 0 }} />
                        <span>{log.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Per-Account Transaction History from Horizon */}
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="panel-title">
                <History size={22} className="text-purple-accent" />
                <span>Horizon Payments Feed (Last 10)</span>
              </div>

              {isLoadingHistory ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: '12px' }}>
                  <RefreshCw size={28} className="animate-spin text-purple-accent" />
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Querying Horizon ledger history...</span>
                </div>
              ) : transactions.length === 0 ? (
                <div style={{
                  padding: '40px 20px',
                  textAlign: 'center',
                  background: 'rgba(255,255,255,0.01)',
                  borderRadius: '16px',
                  border: '1px dashed var(--border-light)',
                  color: 'var(--text-secondary)'
                }}>
                  <History size={36} style={{ color: 'var(--text-dim)', margin: '0 auto 12px' }} />
                  <h4 style={{ color: '#fff', marginBottom: '4px' }}>No Transaction History</h4>
                  <p style={{ fontSize: '11px' }}>This account does not have any recent payment operations recorded on the {network.toUpperCase()} ledger.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', maxHeight: '520px', paddingRight: '4px' }}>
                  {transactions.map((tx) => {
                    // Normalize transaction details depending on operation type
                    let isOutgoing = false;
                    let amountVal = 0;
                    let assetLabel = 'XLM';
                    let counterparty = '';
                    
                    if (tx.type === 'create_account') {
                      isOutgoing = tx.funder === walletAddress;
                      amountVal = parseFloat(tx.starting_balance) || 0;
                      assetLabel = 'XLM';
                      counterparty = isOutgoing ? tx.account : tx.funder;
                    } else if (tx.type === 'account_merge') {
                      isOutgoing = tx.account === walletAddress;
                      amountVal = parseFloat(tx.amount) || 0;
                      assetLabel = 'XLM';
                      counterparty = isOutgoing ? tx.into : tx.account;
                    } else {
                      // Standard payment, path_payment, etc.
                      isOutgoing = tx.from === walletAddress;
                      amountVal = parseFloat(tx.amount) || 0;
                      assetLabel = tx.asset_type === 'native' ? 'XLM' : (tx.asset_code || 'USDC');
                      counterparty = isOutgoing ? tx.to : tx.from;
                    }

                    const safeCounterparty = counterparty || '';
                    const displayCounterparty = safeCounterparty 
                      ? `${safeCounterparty.slice(0, 8)}...${safeCounterparty.slice(-8)}`
                      : 'Unknown Address';

                    const formattedDate = new Date(tx.created_at).toLocaleDateString() + ' ' + new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                    return (
                      <div key={tx.id} style={{
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.04)',
                        borderLeft: `4px solid ${isOutgoing ? '#ff0055' : 'var(--success-color)'}`,
                        borderRadius: '14px',
                        padding: '14px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '50%',
                              background: isOutgoing ? 'rgba(255, 0, 85, 0.08)' : 'var(--success-bg)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: isOutgoing ? '#ff0055' : 'var(--success-color)'
                            }}>
                              {isOutgoing ? <ArrowUpRight size={14} /> : <ArrowDownLeft size={14} />}
                            </div>
                            <div>
                              <span style={{ fontSize: '12px', fontWeight: 800, color: '#fff', textTransform: 'uppercase' }}>
                                {tx.type === 'create_account'
                                  ? (isOutgoing ? 'Funded Account' : 'Account Created')
                                  : tx.type === 'account_merge'
                                    ? (isOutgoing ? 'Merged Account' : 'Account Merged')
                                    : (isOutgoing ? 'Sent Asset' : 'Received Asset')}
                              </span>
                              <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>{formattedDate}</div>
                            </div>
                          </div>

                          <div style={{ textAlign: 'right' }}>
                            <span style={{ 
                              fontSize: '15px', 
                              fontWeight: 800, 
                              color: isOutgoing ? '#fff' : 'var(--success-color)' 
                            }}>
                              {isOutgoing ? '-' : '+'}{amountVal.toFixed(4)} {assetLabel}
                            </span>
                          </div>
                        </div>

                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center', 
                          fontSize: '11px', 
                          background: 'rgba(0,0,0,0.15)',
                          padding: '6px 10px',
                          borderRadius: '8px'
                        }}>
                          <span style={{ color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                            {isOutgoing ? 'To: ' : 'From: '}{displayCounterparty}
                          </span>

                          <a 
                            href={`https://stellar.expert/explorer/${network === 'mainnet' ? 'public' : 'testnet'}/tx/${tx.transaction_hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              color: 'var(--purple-accent)',
                              textDecoration: 'none',
                              fontWeight: 700,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '2px'
                            }}
                          >
                            <span>Explorer</span>
                            <ArrowUpRight size={10} />
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* TEAM CREDITS MODAL PANEL */}
      <footer className="team-credits-card">
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
      </footer>

      {/* SUCCESS OVERLAY FOR TRANSACTIONS */}
      {showTransferSuccess && (
        <div className="cascade-alert-overlay" style={{ borderColor: 'var(--success-color)' }}>
          <div className="cascade-title">
            <CheckCircle size={18} style={{ color: 'var(--success-color)' }} />
            <span>Stellar Transfer Complete!</span>
          </div>
          
          <div className="cascade-sub-text">
            Your asset transfer has been cryptographically signed and successfully validated on the Stellar blockchain network ledger.
          </div>

          <div style={{
            background: 'rgba(10, 6, 22, 0.5)',
            border: '1px solid var(--border-light)',
            borderRadius: '12px',
            padding: '12px',
            fontSize: '11px',
            textAlign: 'left'
          }}>
            <div style={{ color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>
              Transaction Hash
            </div>
            <div style={{ 
              fontFamily: 'monospace', 
              color: '#fff', 
              wordBreak: 'break-all',
              background: 'rgba(255,255,255,0.03)',
              padding: '6px 8px',
              borderRadius: '6px',
              border: '1px solid rgba(255,255,255,0.05)'
            }}>
              {lastTxHash}
            </div>
          </div>

          <a 
            href={`https://stellar.expert/explorer/${network === 'mainnet' ? 'public' : 'testnet'}/tx/${lastTxHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
            style={{ textDecoration: 'none', padding: '10px' }}
          >
            <span>Verify on Stellar Expert</span>
            <ArrowUpRight size={14} />
          </a>

          <button 
            onClick={() => setShowTransferSuccess(false)}
            className="btn-close-overlay"
            style={{ width: '100%', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#fff', padding: '10px', borderRadius: '12px', cursor: 'pointer', fontFamily: 'var(--font-outfit)', fontWeight: 700, fontSize: '13px' }}
          >
            Acknowledge & Continue
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
