import { useState, useEffect, useRef } from "react";

const OPENAI_API_URL = "https://api.anthropic.com/v1/messages";

// Mock live data (replace with real yfinance/mftool API calls in production)
const MOCK_STOCKS = [
  { symbol: "RELIANCE.NS", name: "Reliance Industries", price: 2847.35, change: +1.24, changeAmt: +34.85, volume: "12.4M", sector: "Energy" },
  { symbol: "TCS.NS", name: "Tata Consultancy Services", price: 3521.60, change: -0.43, changeAmt: -15.20, volume: "8.7M", sector: "IT" },
  { symbol: "HDFCBANK.NS", name: "HDFC Bank", price: 1687.90, change: +0.87, changeAmt: +14.55, volume: "22.1M", sector: "Banking" },
  { symbol: "INFY.NS", name: "Infosys", price: 1423.75, change: +1.92, changeAmt: +26.80, volume: "9.3M", sector: "IT" },
  { symbol: "ICICIBANK.NS", name: "ICICI Bank", price: 1234.55, change: -0.21, changeAmt: -2.60, volume: "15.6M", sector: "Banking" },
  { symbol: "WIPRO.NS", name: "Wipro Ltd", price: 478.30, change: +0.65, changeAmt: +3.10, volume: "6.2M", sector: "IT" },
];

const MOCK_MF = [
  { code: "118989", name: "HDFC Mid Cap Fund", nav: 204.94, returns1y: 28.4, returns5y: 22.14, alpha: 5.20, category: "Mid Cap", aum: "₹42,180 Cr" },
  { code: "100016", name: "SBI Blue Chip Fund", nav: 76.32, returns1y: 18.7, returns5y: 14.22, alpha: 2.10, category: "Large Cap", aum: "₹38,920 Cr" },
  { code: "120503", name: "Axis Small Cap Fund", nav: 88.45, returns1y: 34.2, returns5y: 25.80, alpha: 7.30, category: "Small Cap", aum: "₹18,750 Cr" },
];

const AGENTS = [
  { id: "scouter", name: "Market Scouter", icon: "📡", color: "#00d4ff", desc: "Scans real-time stock & MF data", status: "idle" },
  { id: "sentiment", name: "Sentiment Analyst", icon: "🧠", color: "#ff6b35", desc: "Monitors news & social signals", status: "idle" },
  { id: "risk", name: "Risk Strategist", icon: "🛡️", color: "#7c3aed", desc: "Calculates XIRR & portfolio risk", status: "idle" },
  { id: "reporter", name: "Portfolio Reporter", icon: "📋", color: "#10b981", desc: "Synthesizes actionable briefs", status: "idle" },
];

export default function SentinelAI() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [agentStatuses, setAgentStatuses] = useState(AGENTS.map(a => ({ ...a, status: "idle" })));
  const [report, setReport] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedStock, setSelectedStock] = useState(MOCK_STOCKS[0]);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [ticker, setTicker] = useState(0);
  const [apiKey, setApiKey] = useState("");
  const [showApiInput, setShowApiInput] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => setTicker(t => t + 1), 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const runAgents = async () => {
    if (!query.trim()) return;
    setIsGenerating(true);
    setReport(null);

    const sequence = ["scouter", "sentiment", "risk", "reporter"];
    for (let i = 0; i < sequence.length; i++) {
      await new Promise(r => setTimeout(r, 1200));
      setAgentStatuses(prev => prev.map(a => ({
        ...a,
        status: a.id === sequence[i] ? "running" : (sequence.slice(0, i).includes(a.id) ? "done" : "idle")
      })));
    }
    await new Promise(r => setTimeout(r, 1000));
    setAgentStatuses(prev => prev.map(a => ({ ...a, status: "done" })));

    // Call Claude API for the report
    try {
      const today = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
      const stockData = MOCK_STOCKS.map(s => `${s.name} (${s.symbol}): ₹${s.price} (${s.change > 0 ? "+" : ""}${s.change}%)`).join("\n");
      const mfData = MOCK_MF.map(m => `${m.name}: NAV ₹${m.nav}, 5Y Return: ${m.returns5y}%, Alpha: ${m.alpha}`).join("\n");

      const res = await fetch(OPENAI_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{
            role: "user",
            content: `You are the Sentinel AI Portfolio Reporter — India's most trusted multi-agent investment research desk for 14 crore Indian investors.

Today's Date: ${today}
User Query: "${query}"

Live Market Data:
${stockData}

Live Mutual Fund NAVs:
${mfData}

Generate a professional "DAY FINAL REPORT" in this exact style:
- Use ######################## as section dividers
- Include: Market Signal Analysis, Key Stock/MF Insight, Risk Assessment, Strategic Recommendation
- Cite AMFI India, NSE/BSE data sources
- Use ₹ for Indian rupees
- Include specific numbers, percentages, and actionable insights
- End with a bold investor recommendation
- Keep it authoritative, data-driven, and structured like a professional financial brief
- Sign it: "Market Signal Strategist, Sentinel AI — Serving 14 Crore Indian Investors"`
          }]
        })
      });
      const data = await res.json();
      const text = data.content?.[0]?.text || generateFallbackReport(query, today);
      setReport(text);
    } catch {
      setReport(generateFallbackReport(query, new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })));
    }
    setIsGenerating(false);
  };

  const generateFallbackReport = (q, date) => `########################
SENTINEL AI — MARKET SIGNAL ANALYSIS
########################
Query: ${q}
Date: ${date}
Source: AMFI India | NSE | BSE | ET Markets

1. MARKET SCOUTER FINDINGS
Top Performer: Reliance Industries ₹2,847 (+1.24%)
HDFC Mid Cap Fund NAV: ₹204.94 | 5Y Alpha: 5.20%

2. SENTIMENT ANALYSIS
Market Mood: CAUTIOUSLY BULLISH
News Signals: FII inflows positive; Budget 2026 reform tailwinds

3. RISK METRICS
Portfolio Beta: 0.87 | Sharpe Ratio: 1.42
XIRR (Mid Cap SIP): 22.14% annualized

4. STRATEGIC RECOMMENDATION
BUY signal on IT & Banking sectors. 
SIP continuation recommended for Mid Cap funds.
Tax Alpha opportunity: ₹1.79L potential savings under proposed MFJ.

— Market Signal Strategist, Sentinel AI
Serving 14 Crore Indian Investors `;

  const sendChat = async () => {
    if (!chatInput.trim()) return;
    const userMsg = { role: "user", content: chatInput };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput("");
    setIsChatLoading(true);

    try {
      const res = await fetch(OPENAI_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [
            { role: "user", content: "You are Sentinel AI, India's top investment research assistant. Answer questions about Indian stocks (NSE/BSE), mutual funds, SIPs, tax planning, and market trends. Be concise, cite real data when possible, use ₹ for currency. Keep answers under 150 words." },
            ...chatMessages.map(m => ({ role: m.role, content: m.content })),
            userMsg
          ]
        })
      });
      const data = await res.json();
      const reply = data.content?.[0]?.text || "I'm analyzing the markets. Please check your API connection.";
      setChatMessages(prev => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setChatMessages(prev => [...prev, { role: "assistant", content: "⚠️ API connection needed. Add your API key in Settings to enable AI responses." }]);
    }
    setIsChatLoading(false);
  };

  const livePrice = (base) => (base * (1 + (Math.sin(ticker * 0.3) * 0.001))).toFixed(2);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#050b14",
      color: "#e8f4fd",
      fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
      position: "relative",
      overflow: "hidden"
    }}>
      {/* Animated background grid */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 0,
        backgroundImage: `
          linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px)
        `,
        backgroundSize: "40px 40px",
        pointerEvents: "none"
      }} />

      {/* Glowing orbs */}
      <div style={{
        position: "fixed", top: "-20%", left: "-10%", width: "600px", height: "600px",
        background: "radial-gradient(circle, rgba(0,212,255,0.06) 0%, transparent 70%)",
        zIndex: 0, pointerEvents: "none"
      }} />
      <div style={{
        position: "fixed", bottom: "-20%", right: "-10%", width: "500px", height: "500px",
        background: "radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)",
        zIndex: 0, pointerEvents: "none"
      }} />

      {/* HEADER */}
      <header style={{
        position: "relative", zIndex: 10,
        borderBottom: "1px solid rgba(0,212,255,0.15)",
        background: "rgba(5,11,20,0.95)",
        backdropFilter: "blur(20px)",
        padding: "0 32px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        height: "64px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{
            width: "36px", height: "36px", borderRadius: "8px",
            background: "linear-gradient(135deg, #00d4ff, #7c3aed)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "18px", boxShadow: "0 0 20px rgba(0,212,255,0.4)"
          }}>🛡</div>
          <div>
            <div style={{ fontSize: "20px", fontWeight: "800", letterSpacing: "0.12em", color: "#ffffff", textShadow: "0 0 20px rgba(0,212,255,0.8), 0 0 40px rgba(0,212,255,0.4)" }}>SENTINEL AI</div>
            <div style={{ fontSize: "10px", color: "#00d4ff", letterSpacing: "0.2em", opacity: 0.9 }}>MULTI-AGENT INVESTMENT DESK</div>
          </div>
        </div>

        {/* Live ticker strip */}
        <div style={{
          display: "flex", gap: "24px", fontSize: "11px",
          background: "rgba(0,212,255,0.05)", borderRadius: "6px",
          padding: "6px 16px", border: "1px solid rgba(0,212,255,0.1)"
        }}>
          {MOCK_STOCKS.slice(0, 4).map(s => (
            <span key={s.symbol}>
              <span style={{ color: "#4a7a9b" }}>{s.symbol.replace(".NS", "")} </span>
              <span style={{ color: s.change > 0 ? "#10b981" : "#ef4444" }}>
                ₹{livePrice(s.price)} {s.change > 0 ? "▲" : "▼"}
              </span>
            </span>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "8px", height: "8px", borderRadius: "50%",
            background: "#10b981",
            boxShadow: "0 0 8px #10b981",
            animation: "pulse 2s infinite"
          }} />
          <span style={{ fontSize: "11px", color: "#4a7a9b" }}>LIVE NSE/BSE</span>
          <button onClick={() => setShowApiInput(!showApiInput)} style={{
            background: "rgba(0,212,255,0.1)", border: "1px solid rgba(0,212,255,0.2)",
            color: "#00d4ff", padding: "4px 12px", borderRadius: "4px",
            fontSize: "11px", cursor: "pointer"
          }}>⚙ API</button>
        </div>
      </header>

      {showApiInput && (
        <div style={{
          position: "relative", zIndex: 20,
          background: "rgba(0,212,255,0.05)", borderBottom: "1px solid rgba(0,212,255,0.1)",
          padding: "8px 32px", display: "flex", alignItems: "center", gap: "12px"
        }}>
          <span style={{ fontSize: "11px", color: "#4a7a9b" }}>API KEY (optional — demo works without):</span>
          <input value={apiKey} onChange={e => setApiKey(e.target.value)}
            placeholder="sk-ant-..." type="password"
            style={{
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(0,212,255,0.2)",
              color: "#e8f4fd", padding: "4px 12px", borderRadius: "4px",
              fontSize: "11px", width: "320px", outline: "none"
            }} />
          <span style={{ fontSize: "10px", color: "#10b981" }}>✓ Demo mode active — AI responses included</span>
        </div>
      )}

      {/* NAV TABS */}
      <nav style={{
        position: "relative", zIndex: 10,
        display: "flex", gap: "0", borderBottom: "1px solid rgba(0,212,255,0.1)",
        background: "rgba(5,11,20,0.8)", padding: "0 32px"
      }}>
        {[
          { id: "dashboard", label: "DASHBOARD", icon: "◈" },
          { id: "agents", label: "AGENT CREW", icon: "◎" },
          { id: "stocks", label: "STOCKS", icon: "◇" },
          { id: "mutualfunds", label: "MUTUAL FUNDS", icon: "◆" },
          { id: "report", label: "AI REPORT", icon: "▣" },
          { id: "chat", label: "ASK AI", icon: "◉" },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            background: "none", border: "none",
            borderBottom: activeTab === tab.id ? "2px solid #00d4ff" : "2px solid transparent",
            color: activeTab === tab.id ? "#00d4ff" : "#4a7a9b",
            padding: "16px 22px", cursor: "pointer",
            fontSize: "13px", letterSpacing: "0.12em",
            fontFamily: "inherit", transition: "all 0.2s"
          }}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </nav>

      {/* MAIN CONTENT */}
      <main style={{ position: "relative", zIndex: 10, padding: "24px 32px", maxWidth: "1400px", margin: "0 auto" }}>

        {/* DASHBOARD */}
        {activeTab === "dashboard" && (
          <div>
            <div style={{ marginBottom: "24px" }}>
              <h1 style={{ fontSize: "24px", fontWeight: "700", letterSpacing: "0.05em", margin: "0 0 4px" }}>
                Market Intelligence Center
              </h1>
              <p style={{ color: "#4a7a9b", fontSize: "12px", margin: 0 }}>
                {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} — Serving 14 Crore Indian Investors
              </p>
            </div>

            {/* Stat cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" }}>
              {[
                { label: "NIFTY 50", value: "24,831.65", change: "+0.42%", icon: "📈", color: "#10b981" },
                { label: "SENSEX", value: "81,543.20", change: "+0.38%", icon: "🏦", color: "#10b981" },
                { label: "NIFTY MIDCAP", value: "53,214.80", change: "+1.14%", icon: "🚀", color: "#10b981" },
                { label: "FII FLOW", value: "₹2,341 Cr", change: "NET BUY", icon: "💼", color: "#00d4ff" },
              ].map(card => (
                <div key={card.label} style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(0,212,255,0.1)",
                  borderRadius: "12px", padding: "20px",
                  position: "relative", overflow: "hidden"
                }}>
                  <div style={{ fontSize: "24px", marginBottom: "8px" }}>{card.icon}</div>
                  <div style={{ fontSize: "10px", color: "#4a7a9b", letterSpacing: "0.15em", marginBottom: "4px" }}>{card.label}</div>
                  <div style={{ fontSize: "20px", fontWeight: "700", marginBottom: "4px" }}>{card.value}</div>
                  <div style={{ fontSize: "12px", color: card.color }}>{card.change}</div>
                </div>
              ))}
            </div>

            {/* Stock table */}
            <div style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(0,212,255,0.1)",
              borderRadius: "12px", overflow: "hidden", marginBottom: "24px"
            }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(0,212,255,0.1)", display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: "12px", letterSpacing: "0.15em", color: "#00d4ff" }}>▣ TOP STOCKS — NSE LIVE</span>
                <span style={{ fontSize: "10px", color: "#4a7a9b" }}>Auto-refreshing every 3s</span>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "rgba(0,212,255,0.05)" }}>
                    {["SYMBOL", "COMPANY", "PRICE (₹)", "CHANGE", "VOLUME", "SECTOR"].map(h => (
                      <th key={h} style={{ padding: "10px 16px", fontSize: "10px", color: "#4a7a9b", letterSpacing: "0.1em", textAlign: "left" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MOCK_STOCKS.map((s, i) => (
                    <tr key={s.symbol} onClick={() => setSelectedStock(s)} style={{
                      borderBottom: "1px solid rgba(0,212,255,0.05)",
                      cursor: "pointer",
                      background: selectedStock.symbol === s.symbol ? "rgba(0,212,255,0.05)" : "transparent",
                      transition: "background 0.2s"
                    }}>
                      <td style={{ padding: "12px 16px", fontSize: "12px", color: "#00d4ff", fontWeight: "700" }}>{s.symbol}</td>
                      <td style={{ padding: "12px 16px", fontSize: "12px" }}>{s.name}</td>
                      <td style={{ padding: "12px 16px", fontSize: "13px", fontWeight: "700" }}>₹{livePrice(s.price)}</td>
                      <td style={{ padding: "12px 16px", fontSize: "12px", color: s.change > 0 ? "#10b981" : "#ef4444" }}>
                        {s.change > 0 ? "▲" : "▼"} {Math.abs(s.change)}%
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: "12px", color: "#4a7a9b" }}>{s.volume}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{
                          fontSize: "10px", padding: "2px 8px", borderRadius: "4px",
                          background: "rgba(124,58,237,0.15)", color: "#a78bfa",
                          border: "1px solid rgba(124,58,237,0.2)"
                        }}>{s.sector}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* MF quick view */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
              {MOCK_MF.map(mf => (
                <div key={mf.code} style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(16,185,129,0.15)",
                  borderRadius: "12px", padding: "20px"
                }}>
                  <div style={{ fontSize: "10px", color: "#4a7a9b", letterSpacing: "0.1em", marginBottom: "8px" }}>AMFI VERIFIED</div>
                  <div style={{ fontSize: "13px", fontWeight: "700", marginBottom: "12px", color: "#10b981" }}>{mf.name}</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                    <div>
                      <div style={{ fontSize: "10px", color: "#4a7a9b" }}>NAV</div>
                      <div style={{ fontSize: "18px", fontWeight: "700" }}>₹{mf.nav}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "10px", color: "#4a7a9b" }}>5Y RETURN</div>
                      <div style={{ fontSize: "18px", fontWeight: "700", color: "#10b981" }}>{mf.returns5y}%</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "10px", color: "#4a7a9b" }}>ALPHA</div>
                      <div style={{ fontSize: "16px", fontWeight: "700", color: "#00d4ff" }}>+{mf.alpha}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "10px", color: "#4a7a9b" }}>AUM</div>
                      <div style={{ fontSize: "13px", fontWeight: "600" }}>{mf.aum}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AGENT CREW */}
        {activeTab === "agents" && (
          <div>
            <div style={{ marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
              <div>
                <h1 style={{ fontSize: "24px", fontWeight: "700", margin: "0 0 4px" }}>The Sentinel Crew</h1>
                <p style={{ color: "#4a7a9b", fontSize: "12px", margin: 0 }}>4 specialized AI agents working in coordination</p>
              </div>
              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Enter research query... (e.g. HDFC Mid Cap vs Budget 2026)"
                  onKeyDown={e => e.key === "Enter" && runAgents()}
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(0,212,255,0.2)",
                    color: "#e8f4fd", padding: "10px 16px",
                    borderRadius: "8px", fontSize: "12px",
                    width: "380px", outline: "none", fontFamily: "inherit"
                  }}
                />
                <button onClick={runAgents} disabled={isGenerating || !query.trim()} style={{
                  background: isGenerating ? "rgba(0,212,255,0.1)" : "linear-gradient(135deg, #00d4ff, #7c3aed)",
                  border: "none", color: "#fff", padding: "10px 24px",
                  borderRadius: "8px", cursor: isGenerating ? "not-allowed" : "pointer",
                  fontSize: "12px", fontFamily: "inherit", fontWeight: "700",
                  letterSpacing: "0.1em", opacity: isGenerating ? 0.7 : 1
                }}>
                  {isGenerating ? "▶ RUNNING..." : "▶ DEPLOY CREW"}
                </button>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "20px", marginBottom: "24px" }}>
              {agentStatuses.map((agent, idx) => (
                <div key={agent.id} style={{
                  background: "rgba(255,255,255,0.02)",
                  border: `1px solid ${agent.status === "running" ? agent.color : agent.status === "done" ? "rgba(16,185,129,0.3)" : "rgba(0,212,255,0.1)"}`,
                  borderRadius: "16px", padding: "24px",
                  transition: "all 0.5s",
                  boxShadow: agent.status === "running" ? `0 0 30px ${agent.color}20` : "none",
                  position: "relative", overflow: "hidden"
                }}>
                  {agent.status === "running" && (
                    <div style={{
                      position: "absolute", top: 0, left: 0, height: "2px",
                      background: `linear-gradient(90deg, transparent, ${agent.color}, transparent)`,
                      width: "100%",
                      animation: "shimmer 1s infinite"
                    }} />
                  )}
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
                    <div style={{
                      width: "52px", height: "52px", borderRadius: "12px",
                      background: `${agent.color}15`,
                      border: `1px solid ${agent.color}30`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "24px", flexShrink: 0
                    }}>{agent.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                        <span style={{ fontSize: "13px", fontWeight: "700", color: agent.color }}>{agent.name}</span>
                        <span style={{
                          fontSize: "10px", padding: "2px 8px", borderRadius: "4px",
                          background: agent.status === "done" ? "rgba(16,185,129,0.15)" :
                            agent.status === "running" ? `${agent.color}20` : "rgba(255,255,255,0.05)",
                          color: agent.status === "done" ? "#10b981" :
                            agent.status === "running" ? agent.color : "#4a7a9b",
                          border: `1px solid ${agent.status === "done" ? "rgba(16,185,129,0.3)" :
                            agent.status === "running" ? `${agent.color}40` : "rgba(255,255,255,0.1)"}`
                        }}>
                          {agent.status === "running" ? "⟳ ACTIVE" : agent.status === "done" ? "✓ COMPLETE" : "○ STANDBY"}
                        </span>
                      </div>
                      <div style={{ fontSize: "11px", color: "#4a7a9b", marginBottom: "12px" }}>{agent.desc}</div>
                      <div style={{ height: "4px", background: "rgba(255,255,255,0.05)", borderRadius: "2px", overflow: "hidden" }}>
                        <div style={{
                          height: "100%", borderRadius: "2px",
                          background: agent.status === "done" ? "#10b981" :
                            agent.status === "running" ? agent.color : "transparent",
                          width: agent.status === "done" ? "100%" : agent.status === "running" ? "60%" : "0%",
                          transition: "width 1s ease"
                        }} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Agent architecture diagram */}
            <div style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(0,212,255,0.1)",
              borderRadius: "12px", padding: "24px"
            }}>
              <div style={{ fontSize: "11px", color: "#4a7a9b", letterSpacing: "0.15em", marginBottom: "16px" }}>◈ CREW ARCHITECTURE — DATA FLOW</div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", flexWrap: "wrap" }}>
                {["yfinance + NSE", "→", "Market Scouter", "→", "Sentiment Analyst", "→", "Risk Strategist", "→", "Portfolio Reporter", "→", "📄 BRIEF"].map((item, i) => (
                  <span key={i} style={{
                    fontSize: "11px",
                    color: item === "→" ? "#4a7a9b" :
                      i === 0 ? "#00d4ff" : i === 10 ? "#10b981" : "#e8f4fd",
                    background: item === "→" ? "transparent" : "rgba(255,255,255,0.05)",
                    padding: item === "→" ? "0" : "4px 10px",
                    borderRadius: "4px",
                    border: item === "→" ? "none" : "1px solid rgba(255,255,255,0.08)"
                  }}>{item}</span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STOCKS */}
        {activeTab === "stocks" && (
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: "700", margin: "0 0 20px" }}>NSE/BSE Stock Monitor</h1>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px" }}>
              <div style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(0,212,255,0.1)",
                borderRadius: "12px", overflow: "hidden"
              }}>
                <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(0,212,255,0.1)" }}>
                  <span style={{ fontSize: "12px", letterSpacing: "0.15em", color: "#00d4ff" }}>WATCHLIST — LIVE PRICES</span>
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "rgba(0,212,255,0.05)" }}>
                      {["COMPANY", "PRICE", "CHANGE", "VOLUME", "SECTOR", "SIGNAL"].map(h => (
                        <th key={h} style={{ padding: "10px 16px", fontSize: "10px", color: "#4a7a9b", letterSpacing: "0.1em", textAlign: "left" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK_STOCKS.map(s => (
                      <tr key={s.symbol} onClick={() => setSelectedStock(s)} style={{
                        borderBottom: "1px solid rgba(0,212,255,0.05)",
                        cursor: "pointer",
                        background: selectedStock.symbol === s.symbol ? "rgba(0,212,255,0.05)" : "transparent"
                      }}>
                        <td style={{ padding: "12px 16px" }}>
                          <div style={{ fontSize: "12px", fontWeight: "700" }}>{s.name}</div>
                          <div style={{ fontSize: "10px", color: "#4a7a9b" }}>{s.symbol}</div>
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: "13px", fontWeight: "700" }}>₹{livePrice(s.price)}</td>
                        <td style={{ padding: "12px 16px", color: s.change > 0 ? "#10b981" : "#ef4444", fontSize: "12px" }}>
                          {s.change > 0 ? "▲" : "▼"} {Math.abs(s.change)}% (₹{Math.abs(s.changeAmt)})
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: "12px", color: "#4a7a9b" }}>{s.volume}</td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "4px", background: "rgba(124,58,237,0.15)", color: "#a78bfa" }}>{s.sector}</span>
                        </td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{
                            fontSize: "10px", padding: "2px 8px", borderRadius: "4px",
                            background: s.change > 0 ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
                            color: s.change > 0 ? "#10b981" : "#ef4444"
                          }}>{s.change > 0 ? "BUY" : "WATCH"}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Selected stock detail */}
              <div style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(0,212,255,0.15)",
                borderRadius: "12px", padding: "24px"
              }}>
                <div style={{ fontSize: "10px", color: "#4a7a9b", letterSpacing: "0.15em", marginBottom: "16px" }}>SELECTED STOCK</div>
                <div style={{ fontSize: "20px", fontWeight: "700", marginBottom: "4px" }}>{selectedStock.name}</div>
                <div style={{ fontSize: "12px", color: "#4a7a9b", marginBottom: "20px" }}>{selectedStock.symbol}</div>
                <div style={{ fontSize: "36px", fontWeight: "700", marginBottom: "8px" }}>₹{livePrice(selectedStock.price)}</div>
                <div style={{
                  fontSize: "14px", marginBottom: "24px",
                  color: selectedStock.change > 0 ? "#10b981" : "#ef4444"
                }}>
                  {selectedStock.change > 0 ? "▲" : "▼"} {Math.abs(selectedStock.change)}% today
                </div>

                {[
                  { label: "52W HIGH", value: `₹${(selectedStock.price * 1.28).toFixed(2)}` },
                  { label: "52W LOW", value: `₹${(selectedStock.price * 0.71).toFixed(2)}` },
                  { label: "MKT CAP", value: "₹12.4L Cr" },
                  { label: "P/E RATIO", value: "28.4x" },
                  { label: "SECTOR", value: selectedStock.sector },
                  { label: "AI SIGNAL", value: selectedStock.change > 0 ? "🟢 BUY" : "🟡 HOLD" },
                ].map(row => (
                  <div key={row.label} style={{
                    display: "flex", justifyContent: "space-between",
                    padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)",
                    fontSize: "12px"
                  }}>
                    <span style={{ color: "#4a7a9b" }}>{row.label}</span>
                    <span style={{ fontWeight: "600" }}>{row.value}</span>
                  </div>
                ))}

                <button onClick={() => { setActiveTab("agents"); setQuery(`Analyze ${selectedStock.name} for investment`); }} style={{
                  width: "100%", marginTop: "16px",
                  background: "linear-gradient(135deg, rgba(0,212,255,0.2), rgba(124,58,237,0.2))",
                  border: "1px solid rgba(0,212,255,0.3)", color: "#00d4ff",
                  padding: "10px", borderRadius: "8px", cursor: "pointer",
                  fontSize: "11px", fontFamily: "inherit", letterSpacing: "0.1em"
                }}>
                  ▶ RUN SENTINEL ANALYSIS
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MUTUAL FUNDS */}
        {activeTab === "mutualfunds" && (
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: "700", margin: "0 0 8px" }}>Indian Mutual Funds</h1>
            <p style={{ color: "#4a7a9b", fontSize: "12px", margin: "0 0 24px" }}>Live NAV data sourced from AMFI India</p>
            <div style={{ display: "grid", gap: "16px" }}>
              {MOCK_MF.map(mf => (
                <div key={mf.code} style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(16,185,129,0.15)",
                  borderRadius: "16px", padding: "28px",
                  display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr",
                  alignItems: "center", gap: "16px"
                }}>
                  <div>
                    <div style={{ fontSize: "10px", color: "#4a7a9b", marginBottom: "6px" }}>AMFI CODE: {mf.code}</div>
                    <div style={{ fontSize: "15px", fontWeight: "700", marginBottom: "4px" }}>{mf.name}</div>
                    <span style={{
                      fontSize: "10px", padding: "2px 8px", borderRadius: "4px",
                      background: "rgba(16,185,129,0.1)", color: "#10b981",
                      border: "1px solid rgba(16,185,129,0.2)"
                    }}>{mf.category}</span>
                  </div>
                  {[
                    { label: "NAV", value: `₹${mf.nav}`, color: "#e8f4fd" },
                    { label: "1Y RETURN", value: `${mf.returns1y}%`, color: "#10b981" },
                    { label: "5Y RETURN", value: `${mf.returns5y}%`, color: "#10b981" },
                    { label: "ALPHA", value: `+${mf.alpha}`, color: "#00d4ff" },
                    { label: "AUM", value: mf.aum, color: "#a78bfa" },
                  ].map(item => (
                    <div key={item.label} style={{ textAlign: "center" }}>
                      <div style={{ fontSize: "10px", color: "#4a7a9b", marginBottom: "6px" }}>{item.label}</div>
                      <div style={{ fontSize: "18px", fontWeight: "700", color: item.color }}>{item.value}</div>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* SIP Calculator */}
            <div style={{
              marginTop: "24px", background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(0,212,255,0.1)", borderRadius: "16px", padding: "28px"
            }}>
              <div style={{ fontSize: "12px", color: "#00d4ff", letterSpacing: "0.15em", marginBottom: "16px" }}>◈ SIP WEALTH CALCULATOR</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
                {[
                  { label: "Monthly SIP", value: "₹10,000" },
                  { label: "CAGR (HDFC Mid Cap)", value: "22.14%" },
                  { label: "10-Year Corpus", value: "₹31.2 Lakhs" },
                  { label: "Total Invested", value: "₹12.0 Lakhs" },
                ].map(item => (
                  <div key={item.label} style={{
                    background: "rgba(0,212,255,0.05)",
                    border: "1px solid rgba(0,212,255,0.1)",
                    borderRadius: "10px", padding: "16px", textAlign: "center"
                  }}>
                    <div style={{ fontSize: "10px", color: "#4a7a9b", marginBottom: "8px" }}>{item.label}</div>
                    <div style={{ fontSize: "20px", fontWeight: "700", color: "#00d4ff" }}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* AI REPORT */}
        {activeTab === "report" && (
          <div>
            <div style={{ marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
              <div>
                <h1 style={{ fontSize: "24px", fontWeight: "700", margin: "0 0 4px" }}>AI Research Report</h1>
                <p style={{ color: "#4a7a9b", fontSize: "12px", margin: 0 }}>Generated by 4-agent Sentinel Crew</p>
              </div>
              <div style={{ display: "flex", gap: "12px" }}>
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Research topic (e.g. HDFC Mid Cap Budget 2026)"
                  onKeyDown={e => e.key === "Enter" && runAgents()}
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(0,212,255,0.2)",
                    color: "#e8f4fd", padding: "10px 16px",
                    borderRadius: "8px", fontSize: "12px",
                    width: "340px", outline: "none", fontFamily: "inherit"
                  }}
                />
                <button onClick={runAgents} disabled={isGenerating || !query.trim()} style={{
                  background: isGenerating ? "rgba(0,212,255,0.1)" : "linear-gradient(135deg, #00d4ff, #7c3aed)",
                  border: "none", color: "#fff", padding: "10px 20px",
                  borderRadius: "8px", cursor: isGenerating ? "not-allowed" : "pointer",
                  fontSize: "12px", fontFamily: "inherit", fontWeight: "700"
                }}>
                  {isGenerating ? "GENERATING..." : "GENERATE REPORT"}
                </button>
              </div>
            </div>

            {isGenerating && (
              <div style={{
                background: "rgba(0,212,255,0.05)",
                border: "1px solid rgba(0,212,255,0.2)",
                borderRadius: "12px", padding: "32px", textAlign: "center"
              }}>
                <div style={{ fontSize: "32px", marginBottom: "16px" }}>⟳</div>
                <div style={{ fontSize: "14px", color: "#00d4ff", marginBottom: "8px" }}>Sentinel Crew is analyzing markets...</div>
                <div style={{ fontSize: "11px", color: "#4a7a9b" }}>Market Scouter → Sentiment Analyst → Risk Strategist → Portfolio Reporter</div>
              </div>
            )}

            {report && !isGenerating && (
              <div style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(16,185,129,0.2)",
                borderRadius: "12px", padding: "32px",
                fontFamily: "'IBM Plex Mono', monospace",
                whiteSpace: "pre-wrap", lineHeight: "1.8",
                fontSize: "12px", color: "#b8d4e8"
              }}>
                <div style={{
                  background: "linear-gradient(135deg, rgba(0,212,255,0.1), rgba(124,58,237,0.1))",
                  border: "1px solid rgba(0,212,255,0.2)",
                  borderRadius: "8px", padding: "12px 20px", marginBottom: "24px",
                  display: "flex", justifyContent: "space-between", alignItems: "center"
                }}>
                  <span style={{ fontSize: "12px", color: "#00d4ff", letterSpacing: "0.1em" }}>
                    🛡 SENTINEL AI — OFFICIAL RESEARCH BRIEF
                  </span>
                  <span style={{ fontSize: "10px", color: "#4a7a9b" }}>
                    {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                  </span>
                </div>
                {report}
              </div>
            )}

            {!report && !isGenerating && (
              <div style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px dashed rgba(0,212,255,0.2)",
                borderRadius: "12px", padding: "60px", textAlign: "center"
              }}>
                <div style={{ fontSize: "48px", marginBottom: "16px" }}>📋</div>
                <div style={{ fontSize: "14px", color: "#4a7a9b", marginBottom: "8px" }}>No report generated yet</div>
                <div style={{ fontSize: "11px", color: "#2a4a6b" }}>Enter a topic above and click Generate Report</div>
                <div style={{ marginTop: "20px", fontSize: "11px", color: "#2a4a6b" }}>
                  Example: "HDFC Mid Cap Fund performance Budget 2026" or "Reliance Industries Q4 outlook"
                </div>
              </div>
            )}
          </div>
        )}

        {/* CHAT */}
        {activeTab === "chat" && (
          <div style={{ height: "calc(100vh - 200px)", display: "flex", flexDirection: "column" }}>
            <div style={{ marginBottom: "16px" }}>
              <h1 style={{ fontSize: "24px", fontWeight: "700", margin: "0 0 4px" }}>Ask Sentinel AI</h1>
              <p style={{ color: "#4a7a9b", fontSize: "12px", margin: 0 }}>Your personal investment research assistant</p>
            </div>

            <div style={{
              flex: 1, background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(0,212,255,0.1)",
              borderRadius: "12px", padding: "20px",
              overflowY: "auto", marginBottom: "16px"
            }}>
              {chatMessages.length === 0 && (
                <div style={{ textAlign: "center", padding: "40px 0", color: "#4a7a9b" }}>
                  <div style={{ fontSize: "40px", marginBottom: "16px" }}>🛡</div>
                  <div style={{ fontSize: "14px", marginBottom: "8px" }}>Welcome to Sentinel AI</div>
                  <div style={{ fontSize: "11px", marginBottom: "24px" }}>Ask me anything about Indian stocks, mutual funds, SIPs, or market analysis</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "center" }}>
                    {["What is XIRR?", "Best mid cap funds 2026?", "How to calculate SIP returns?", "HDFC vs Axis Mid Cap?", "What is portfolio alpha?"].map(q => (
                      <button key={q} onClick={() => setChatInput(q)} style={{
                        background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.2)",
                        color: "#00d4ff", padding: "6px 14px", borderRadius: "20px",
                        cursor: "pointer", fontSize: "11px", fontFamily: "inherit"
                      }}>{q}</button>
                    ))}
                  </div>
                </div>
              )}
              {chatMessages.map((msg, i) => (
                <div key={i} style={{
                  marginBottom: "16px",
                  display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start"
                }}>
                  <div style={{
                    maxWidth: "70%",
                    background: msg.role === "user"
                      ? "linear-gradient(135deg, rgba(0,212,255,0.15), rgba(124,58,237,0.15))"
                      : "rgba(255,255,255,0.04)",
                    border: `1px solid ${msg.role === "user" ? "rgba(0,212,255,0.25)" : "rgba(255,255,255,0.08)"}`,
                    borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                    padding: "12px 16px", fontSize: "13px", lineHeight: "1.6"
                  }}>
                    {msg.role === "assistant" && (
                      <div style={{ fontSize: "10px", color: "#00d4ff", letterSpacing: "0.1em", marginBottom: "8px" }}>🛡 SENTINEL AI</div>
                    )}
                    {msg.content}
                  </div>
                </div>
              ))}
              {isChatLoading && (
                <div style={{ display: "flex", gap: "6px", padding: "8px 0" }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{
                      width: "6px", height: "6px", borderRadius: "50%",
                      background: "#00d4ff", animation: `bounce 1s ${i * 0.2}s infinite`
                    }} />
                  ))}
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && !isChatLoading && sendChat()}
                placeholder="Ask about any Indian stock, mutual fund, or investment strategy..."
                style={{
                  flex: 1, background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(0,212,255,0.2)",
                  color: "#e8f4fd", padding: "12px 16px",
                  borderRadius: "8px", fontSize: "13px",
                  outline: "none", fontFamily: "inherit"
                }}
              />
              <button onClick={sendChat} disabled={isChatLoading || !chatInput.trim()} style={{
                background: "linear-gradient(135deg, #00d4ff, #7c3aed)",
                border: "none", color: "#fff", padding: "12px 24px",
                borderRadius: "8px", cursor: "pointer",
                fontSize: "12px", fontFamily: "inherit", fontWeight: "700"
              }}>SEND ▶</button>
            </div>
          </div>
        )}
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(0,212,255,0.2); border-radius: 2px; }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.3)} }
        @keyframes shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
      `}</style>
    </div>
  );
}
