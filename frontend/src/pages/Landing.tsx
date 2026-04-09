import React, { useEffect, useRef, useState } from "react";
import { useWalletModal } from "@provablehq/aleo-wallet-adaptor-react-ui";
import { useWallet } from "@provablehq/aleo-wallet-adaptor-react";
import { useNavigate } from "react-router-dom";

// ─── Animated grid background ────────────────────────────────────────────────
const GridBackground: React.FC = () => (
  <div
    style={{
      position: "fixed",
      inset: 0,
      zIndex: 0,
      overflow: "hidden",
      pointerEvents: "none",
    }}
  >
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundImage: `
        linear-gradient(rgba(245,158,11,0.04) 1px, transparent 1px),
        linear-gradient(90deg, rgba(245,158,11,0.04) 1px, transparent 1px)
      `,
        backgroundSize: "60px 60px",
      }}
    />
    <div
      style={{
        position: "absolute",
        top: "-20%",
        left: "50%",
        transform: "translateX(-50%)",
        width: "900px",
        height: "600px",
        borderRadius: "50%",
        background:
          "radial-gradient(ellipse, rgba(245,158,11,0.12) 0%, transparent 70%)",
      }}
    />
    <div
      style={{
        position: "absolute",
        bottom: "-10%",
        right: "-10%",
        width: "600px",
        height: "600px",
        borderRadius: "50%",
        background:
          "radial-gradient(ellipse, rgba(139,92,246,0.1) 0%, transparent 70%)",
      }}
    />
    {[
      { top: "15%", left: "8%", size: 5, color: "#F59E0B", dur: "4s" },
      { top: "70%", left: "5%", size: 3, color: "#8B5CF6", dur: "6s" },
      { top: "30%", left: "92%", size: 4, color: "#FBBF24", dur: "5s" },
      { top: "80%", left: "88%", size: 3, color: "#F59E0B", dur: "7s" },
      { top: "50%", left: "50%", size: 2, color: "#8B5CF6", dur: "3s" },
    ].map((orb, i) => (
      <div
        key={i}
        style={{
          position: "absolute",
          top: orb.top,
          left: orb.left,
          width: orb.size,
          height: orb.size,
          borderRadius: "50%",
          background: orb.color,
          boxShadow: `0 0 ${orb.size * 4}px ${orb.color}`,
          animation: `pulse ${orb.dur} ease-in-out infinite alternate`,
        }}
      />
    ))}
    <style>{`
      @keyframes pulse { from { opacity: 0.3; transform: scale(1); } to { opacity: 1; transform: scale(1.8); } }
      @keyframes fadeUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      @keyframes shimmer { 0%,100% { opacity: 0.5; } 50% { opacity: 1; } }
      @keyframes float { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-12px); } }
      @keyframes gradientShift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
    `}</style>
  </div>
);

// ─── ZK Badge (animated) ─────────────────────────────────────────────────────
const ZKBadge: React.FC = () => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: "8px",
      padding: "6px 16px",
      borderRadius: "999px",
      border: "1px solid rgba(245,158,11,0.4)",
      background: "rgba(245,158,11,0.08)",
      animation: "fadeIn 0.6s ease forwards",
      marginBottom: "28px",
    }}
  >
    <div
      style={{
        width: 8,
        height: 8,
        borderRadius: "50%",
        background: "#10b981",
        boxShadow: "0 0 8px #10b981",
        animation: "shimmer 2s ease-in-out infinite",
      }}
    />
    <span
      style={{
        fontSize: "0.78rem",
        fontFamily: "'Orbitron', monospace",
        color: "#FBBF24",
        letterSpacing: "0.06em",
        fontWeight: 600,
      }}
    >
      BUILT ON ALEO · ZERO-KNOWLEDGE · TESTNET
    </span>
  </div>
);

// ─── Stat counter ─────────────────────────────────────────────────────────────
const StatCard: React.FC<{
  value: string;
  label: string;
  color: string;
  delay: string;
}> = ({ value, label, color, delay }) => (
  <div
    style={{ textAlign: "center", animation: `fadeUp 0.7s ease ${delay} both` }}
  >
    <div
      style={{
        fontFamily: "'Orbitron', sans-serif",
        fontSize: "clamp(1.6rem, 3vw, 2.4rem)",
        fontWeight: 700,
        color,
        textShadow: `0 0 30px ${color}60`,
        letterSpacing: "-0.02em",
      }}
    >
      {value}
    </div>
    <div
      style={{
        fontSize: "0.78rem",
        color: "rgba(248,250,252,0.5)",
        marginTop: "4px",
        letterSpacing: "0.05em",
        fontFamily: "'Exo 2', sans-serif",
      }}
    >
      {label}
    </div>
  </div>
);

// ─── Feature card ─────────────────────────────────────────────────────────────
const FeatureCard: React.FC<{
  icon: string;
  title: string;
  desc: string;
  color: string;
  delay: string;
}> = ({ icon, title, desc, color, delay }) => (
  <div
    style={{
      padding: "28px",
      borderRadius: "20px",
      background: "rgba(15,23,42,0.6)",
      border: `1px solid ${color}22`,
      backdropFilter: "blur(12px)",
      transition:
        "transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease",
      animation: `fadeUp 0.7s ease ${delay} both`,
      cursor: "default",
    }}
    onMouseEnter={(e) => {
      (e.currentTarget as HTMLDivElement).style.transform = "translateY(-6px)";
      (e.currentTarget as HTMLDivElement).style.borderColor = `${color}55`;
      (e.currentTarget as HTMLDivElement).style.boxShadow =
        `0 20px 40px ${color}15`;
    }}
    onMouseLeave={(e) => {
      (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
      (e.currentTarget as HTMLDivElement).style.borderColor = `${color}22`;
      (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
    }}
  >
    <div
      style={{
        width: 48,
        height: 48,
        borderRadius: "14px",
        background: `${color}18`,
        border: `1px solid ${color}30`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "1.4rem",
        marginBottom: "16px",
      }}
    >
      {icon}
    </div>
    <div
      style={{
        fontFamily: "'Orbitron', sans-serif",
        fontSize: "1rem",
        fontWeight: 700,
        color: "#F8FAFC",
        marginBottom: "8px",
        letterSpacing: "-0.01em",
      }}
    >
      {title}
    </div>
    <div
      style={{
        fontSize: "0.875rem",
        color: "rgba(248,250,252,0.65)",
        lineHeight: 1.65,
        fontFamily: "'Exo 2', sans-serif",
      }}
    >
      {desc}
    </div>
  </div>
);

// ─── How it works step ────────────────────────────────────────────────────────
const Step: React.FC<{
  num: string;
  title: string;
  desc: string;
  color: string;
  delay: string;
}> = ({ num, title, desc, color, delay }) => (
  <div
    style={{
      display: "flex",
      gap: "20px",
      alignItems: "flex-start",
      animation: `fadeUp 0.7s ease ${delay} both`,
    }}
  >
    <div
      style={{
        flexShrink: 0,
        width: 44,
        height: 44,
        borderRadius: "12px",
        background: `linear-gradient(135deg, ${color}30, ${color}15)`,
        border: `1px solid ${color}40`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Orbitron', sans-serif",
        fontSize: "0.85rem",
        fontWeight: 700,
        color,
      }}
    >
      {num}
    </div>
    <div>
      <div
        style={{
          fontFamily: "'Orbitron', sans-serif",
          fontWeight: 700,
          color: "#F8FAFC",
          marginBottom: "4px",
          fontSize: "0.9rem",
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: "0.875rem",
          color: "rgba(248,250,252,0.65)",
          lineHeight: 1.6,
          fontFamily: "'Exo 2', sans-serif",
        }}
      >
        {desc}
      </div>
    </div>
  </div>
);

// ─── Loan diagram (animated) ──────────────────────────────────────────────────
const LoanDiagram: React.FC = () => (
  <div
    style={{
      position: "relative",
      padding: "32px",
      background: "rgba(15,23,42,0.7)",
      border: "1px solid rgba(99,102,241,0.2)",
      borderRadius: "24px",
      backdropFilter: "blur(16px)",
      animation: "float 5s ease-in-out infinite",
    }}
  >
    <div
      style={{
        position: "absolute",
        top: -14,
        left: "50%",
        transform: "translateX(-50%)",
        padding: "4px 16px",
        borderRadius: "999px",
        background: "linear-gradient(135deg, #F59E0B, #8B5CF6)",
        fontSize: "0.7rem",
        fontFamily: "'Orbitron', sans-serif",
        color: "#0F172A",
        fontWeight: 700,
        letterSpacing: "0.08em",
        boxShadow: "0 4px 20px rgba(245,158,11,0.45)",
        whiteSpace: "nowrap",
      }}
    >
      ZK PROOF VERIFIED
    </div>

    {/* Parties */}
    {[
      {
        label: "BORROWER",
        icon: "👤",
        color: "#6366f1",
        sub: "Private CreditTier",
      },
      {
        label: "PROTOCOL",
        icon: "🔒",
        color: "#8b5cf6",
        sub: "privlend_v8.aleo",
      },
      { label: "LENDER", icon: "🏦", color: "#10b981", sub: "Funds USDCx" },
    ].map((p, i) => (
      <div key={i} style={{ marginBottom: i < 2 ? "12px" : 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "12px 16px",
            borderRadius: "12px",
            background: `${p.color}0c`,
            border: `1px solid ${p.color}25`,
          }}
        >
          <span style={{ fontSize: "1.2rem" }}>{p.icon}</span>
          <div>
            <div
              style={{
                fontFamily: "'Orbitron', sans-serif",
                fontSize: "0.7rem",
                color: p.color,
                fontWeight: 700,
                letterSpacing: "0.08em",
              }}
            >
              {p.label}
            </div>
            <div
              style={{
                fontSize: "0.72rem",
                color: "rgba(248,250,252,0.5)",
                marginTop: "2px",
                fontFamily: "'Exo 2', sans-serif",
              }}
            >
              {p.sub}
            </div>
          </div>
          <div
            style={{
              marginLeft: "auto",
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: p.color,
              boxShadow: `0 0 8px ${p.color}`,
              animation: "shimmer 2s ease-in-out infinite",
            }}
          />
        </div>
        {i < 2 && (
          <div
            style={{
              marginLeft: "22px",
              width: 2,
              height: "12px",
              background: `linear-gradient(to bottom, ${p.color}40, transparent)`,
            }}
          />
        )}
      </div>
    ))}

    {/* Collateral line */}
    <div
      style={{
        marginTop: "16px",
        padding: "10px 16px",
        borderRadius: "10px",
        background: "rgba(245,158,11,0.06)",
        border: "1px solid rgba(245,158,11,0.2)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <span
        style={{
          fontSize: "0.72rem",
          color: "rgba(148,163,184,0.6)",
          fontFamily: "'Space Mono', monospace",
        }}
      >
        COLLATERAL LOCKED
      </span>
      <span
        style={{
          fontSize: "0.8rem",
          color: "#f59e0b",
          fontWeight: 700,
          fontFamily: "'Space Mono', monospace",
        }}
      >
        150% · CREDITS
      </span>
    </div>
  </div>
);

// ─── Main landing page ────────────────────────────────────────────────────────
export const LandingPage: React.FC = () => {
  const { connected } = useWallet();
  const { setVisible } = useWalletModal();
  const navigate = useNavigate();

  // If already connected, skip to dashboard
  useEffect(() => {
    if (connected) navigate("/dashboard");
  }, [connected, navigate]);

  const handleLaunch = () => {
    if (connected) navigate("/dashboard");
    else setVisible(true);
  };

  return (
    <>
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&family=Exo+2:wght@300;400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #0F172A; }
        ::-webkit-scrollbar-thumb { background: rgba(245,158,11,0.4); border-radius: 3px; }
        .cta-btn {
          position: relative; overflow: hidden;
          display: inline-flex; align-items: center; gap: 10px;
          padding: 16px 36px; border-radius: 14px; border: none;
          background: linear-gradient(135deg, #F59E0B, #FBBF24);
          font-family: 'Orbitron', sans-serif; font-size: 0.9rem;
          font-weight: 700; color: #0F172A; cursor: pointer;
          box-shadow: 0 8px 32px rgba(245,158,11,0.4);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          letter-spacing: 0.03em;
        }
        .cta-btn::before {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.2), transparent);
          opacity: 0; transition: opacity 0.2s ease;
        }
        .cta-btn:hover { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(245,158,11,0.55); }
        .cta-btn:hover::before { opacity: 1; }
        .cta-btn:active { transform: translateY(0); }
        .outline-btn {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 15px 32px; border-radius: 14px;
          border: 1px solid rgba(245,158,11,0.35);
          background: rgba(245,158,11,0.06);
          font-family: 'Exo 2', sans-serif; font-size: 1rem;
          font-weight: 600; color: #FBBF24; cursor: pointer;
          transition: all 0.2s ease;
        }
        .outline-btn:hover { border-color: rgba(245,158,11,0.65); background: rgba(245,158,11,0.12); color: #FCD34D; }
        .gradient-text {
          background: linear-gradient(135deg, #F59E0B, #FBBF24, #8B5CF6);
          background-size: 200% 200%;
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: gradientShift 4s ease infinite;
        }
      `}</style>

      <div
        style={{
          minHeight: "100vh",
          background: "#0a0f1e",
          fontFamily: "'Sora', sans-serif",
          color: "#f1f5f9",
          position: "relative",
          overflowX: "hidden",
        }}
      >
        <GridBackground />

        {/* ── NAV ──────────────────────────────────────────────────────── */}
        <nav
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "18px clamp(24px, 6vw, 80px)",
            background: "rgba(10,15,30,0.7)",
            backdropFilter: "blur(20px)",
            borderBottom: "1px solid rgba(99,102,241,0.1)",
          }}
        >
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: "10px",
                background: "linear-gradient(135deg, #F59E0B, #8B5CF6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1rem",
                boxShadow: "0 4px 14px rgba(245,158,11,0.45)",
              }}
            >
              🔒
            </div>
            <span
              style={{
                fontFamily: "'Orbitron', sans-serif",
                fontSize: "1rem",
                fontWeight: 700,
                color: "#F59E0B",
                letterSpacing: "0.04em",
              }}
            >
              PrivLend
            </span>
          </div>

          {/* Nav links */}
          <div style={{ display: "flex", gap: "32px", alignItems: "center" }}>
            {["Features", "How it Works", "Markets"].map((link) => (
              <a
                key={link}
                href={`#${link.toLowerCase().replace(/ /g, "-")}`}
                style={{
                  fontSize: "0.875rem",
                  color: "rgba(248,250,252,0.6)",
                  textDecoration: "none",
                  fontWeight: 500,
                  fontFamily: "'Exo 2', sans-serif",
                  transition: "color 0.2s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#FBBF24")}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "rgba(248,250,252,0.6)")
                }
              >
                {link}
              </a>
            ))}
          </div>

          <button
            className="cta-btn"
            onClick={handleLaunch}
            style={{
              padding: "10px 22px",
              fontSize: "0.875rem",
              borderRadius: "10px",
            }}
          >
            Launch App →
          </button>
        </nav>

        {/* ── HERO ─────────────────────────────────────────────────────── */}
        <section
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "clamp(100px, 14vw, 160px) clamp(24px, 6vw, 80px) 80px",
            position: "relative",
            zIndex: 1,
            textAlign: "center",
          }}
        >
          <ZKBadge />

          <h1
            style={{
              fontFamily: "'Orbitron', sans-serif",
              fontSize: "clamp(2.4rem, 6vw, 5rem)",
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              marginBottom: "28px",
              animation: "fadeUp 0.8s ease 0.1s both",
            }}
          >
            <span style={{ color: "#F8FAFC" }}>Borrow. Lend.</span>
            <br />
            <span className="gradient-text">Stay Private.</span>
          </h1>

          <p
            style={{
              fontSize: "clamp(1rem, 2vw, 1.2rem)",
              color: "rgba(148,163,184,0.85)",
              maxWidth: "580px",
              lineHeight: 1.75,
              marginBottom: "44px",
              animation: "fadeUp 0.8s ease 0.2s both",
            }}
          >
            Private DeFi lending protocol on Aleo. Prove your creditworthiness
            with ZK proofs. Your identity, your collateral, your terms — all
            confidential.
          </p>

          <div
            style={{
              display: "flex",
              gap: "16px",
              flexWrap: "wrap",
              justifyContent: "center",
              animation: "fadeUp 0.8s ease 0.3s both",
            }}
          >
            <button
              className="cta-btn"
              onClick={handleLaunch}
              style={{ fontSize: "1rem" }}
            >
              <span>🔒</span> Launch PrivLend
            </button>
            <button
              className="outline-btn"
              onClick={() =>
                document
                  .getElementById("how-it-works")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              How it works ↓
            </button>
          </div>

          {/* Stats row */}
          <div
            style={{
              display: "flex",
              gap: "clamp(32px, 6vw, 80px)",
              marginTop: "72px",
              paddingTop: "48px",
              borderTop: "1px solid rgba(99,102,241,0.12)",
              flexWrap: "wrap",
              justifyContent: "center",
              animation: "fadeUp 0.8s ease 0.4s both",
            }}
          >
            <StatCard
              value="100%"
              label="Private Records"
              color="#F59E0B"
              delay="0.4s"
            />
            <StatCard
              value="ZK"
              label="Proof Verified"
              color="#8B5CF6"
              delay="0.5s"
            />
            <StatCard
              value="150%"
              label="Collateral Ratio"
              color="#10b981"
              delay="0.6s"
            />
            <StatCard
              value="3"
              label="Credit Tiers"
              color="#FBBF24"
              delay="0.7s"
            />
          </div>
        </section>

        {/* ── FEATURES ─────────────────────────────────────────────────── */}
        <section
          id="features"
          style={{
            padding: "clamp(60px, 10vw, 120px) clamp(24px, 6vw, 80px)",
            position: "relative",
            zIndex: 1,
            maxWidth: "1200px",
            margin: "0 auto",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "64px" }}>
            <div
              style={{
                display: "inline-block",
                padding: "4px 14px",
                borderRadius: "999px",
                background: "rgba(245,158,11,0.1)",
                border: "1px solid rgba(245,158,11,0.25)",
                fontSize: "0.72rem",
                fontFamily: "'Orbitron', sans-serif",
                color: "#FBBF24",
                letterSpacing: "0.1em",
                marginBottom: "16px",
              }}
            >
              FEATURES
            </div>
            <h2
              style={{
                fontSize: "clamp(1.8rem, 4vw, 3rem)",
                fontWeight: 800,
                letterSpacing: "-0.02em",
                color: "#F8FAFC",
                fontFamily: "'Orbitron', sans-serif",
              }}
            >
              Privacy is not a feature.{" "}
              <span className="gradient-text">It's the foundation.</span>
            </h2>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "20px",
            }}
          >
            <FeatureCard
              delay="0s"
              color="#6366f1"
              icon="🔐"
              title="ZK Credit Tiers"
              desc="Prove your creditworthiness with a zero-knowledge CreditTier record. Lenders verify your tier — never your identity."
            />
            <FeatureCard
              delay="0.1s"
              color="#8b5cf6"
              icon="🛡️"
              title="Private Records"
              desc="Loan details, collateral amounts, and interest rates are stored as encrypted private records on Aleo — invisible to the public."
            />
            <FeatureCard
              delay="0.2s"
              color="#10b981"
              icon="⚡"
              title="Atomic Settlement"
              desc="open_loan, fund, repay, and liquidate execute atomically. No partial states, no exploitable race conditions."
            />
            <FeatureCard
              delay="0.3s"
              color="#f59e0b"
              icon="💱"
              title="Integrated Swap"
              desc="Swap between ALEO microcredits and USDCx directly in the app. Get the tokens you need to lend or post collateral."
            />
            <FeatureCard
              delay="0.4s"
              color="#06b6d4"
              icon="🏛️"
              title="Shield Wallet Native"
              desc="Built first for Shield Wallet — the best private wallet on Aleo. Full record decryption and plaintext access supported."
            />
            <FeatureCard
              delay="0.5s"
              color="#ec4899"
              icon="📊"
              title="Public Transparency"
              desc="Active loan counts, deadlines, and TVL are provably verifiable on-chain — without revealing any sensitive loan data."
            />
          </div>
        </section>

        {/* ── HOW IT WORKS ─────────────────────────────────────────────── */}
        <section
          id="how-it-works"
          style={{
            padding: "clamp(60px, 10vw, 120px) clamp(24px, 6vw, 80px)",
            position: "relative",
            zIndex: 1,
            maxWidth: "1200px",
            margin: "0 auto",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "64px",
              alignItems: "center",
            }}
          >
            {/* Steps */}
            <div>
              <div
                style={{
                  display: "inline-block",
                  padding: "4px 14px",
                  borderRadius: "999px",
                  background: "rgba(139,92,246,0.1)",
                  border: "1px solid rgba(139,92,246,0.25)",
                  fontSize: "0.72rem",
                  fontFamily: "'Orbitron', sans-serif",
                  color: "#A78BFA",
                  letterSpacing: "0.1em",
                  marginBottom: "24px",
                }}
              >
                HOW IT WORKS
              </div>

              <h2
                style={{
                  fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)",
                  fontWeight: 800,
                  letterSpacing: "-0.02em",
                  marginBottom: "48px",
                  lineHeight: 1.15,
                  color: "#F8FAFC",
                  fontFamily: "'Orbitron', sans-serif",
                }}
              >
                Four steps to
                <br />
                <span className="gradient-text">private lending.</span>
              </h2>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "28px",
                }}
              >
                <Step
                  delay="0.1s"
                  num="01"
                  color="#6366f1"
                  title="Connect Shield Wallet"
                  desc="Connect your Shield Wallet to unlock private record management, ZK proof generation, and encrypted transaction signing."
                />
                <Step
                  delay="0.2s"
                  num="02"
                  color="#8b5cf6"
                  title="Mint a Credit Tier"
                  desc="Request a CreditTier record (A, B, or C) from the admin. This ZK credential proves your creditworthiness without revealing who you are."
                />
                <Step
                  delay="0.3s"
                  num="03"
                  color="#10b981"
                  title="Open a Private Loan"
                  desc="Set terms — principal in USDCx, ALEO collateral (min 150%), interest rate, and duration. Everything is recorded privately on-chain."
                />
                <Step
                  delay="0.4s"
                  num="04"
                  color="#f59e0b"
                  title="Repay & Reclaim"
                  desc="Repay principal + interest before the deadline. Your locked ALEO collateral is automatically released back to your wallet."
                />
              </div>
            </div>

            {/* Diagram */}
            <div style={{ display: "flex", justifyContent: "center" }}>
              <div style={{ maxWidth: "340px", width: "100%" }}>
                <LoanDiagram />
              </div>
            </div>
          </div>
        </section>

        {/* ── MARKETS TEASER ───────────────────────────────────────────── */}
        <section
          id="markets"
          style={{
            padding: "clamp(60px, 10vw, 120px) clamp(24px, 6vw, 80px)",
            position: "relative",
            zIndex: 1,
            maxWidth: "1200px",
            margin: "0 auto",
          }}
        >
          <div
            style={{
              padding: "clamp(40px, 6vw, 64px)",
              borderRadius: "28px",
              background:
                "linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.06))",
              border: "1px solid rgba(99,102,241,0.2)",
              backdropFilter: "blur(20px)",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: "48px",
              alignItems: "center",
            }}
          >
            <div>
              <div
                style={{
                  display: "inline-block",
                  padding: "4px 14px",
                  borderRadius: "999px",
                  background: "rgba(245,158,11,0.1)",
                  border: "1px solid rgba(245,158,11,0.25)",
                  fontSize: "0.72rem",
                  fontFamily: "'Orbitron', sans-serif",
                  color: "#FBBF24",
                  letterSpacing: "0.1em",
                  marginBottom: "20px",
                }}
              >
                LIVE ON ALEO TESTNET
              </div>
              <h2
                style={{
                  fontSize: "clamp(1.6rem, 3vw, 2.4rem)",
                  fontWeight: 800,
                  letterSpacing: "-0.02em",
                  marginBottom: "16px",
                  color: "#F8FAFC",
                  fontFamily: "'Orbitron', sans-serif",
                }}
              >
                Ready to borrow
                <br />
                without exposure?
              </h2>
              <p
                style={{
                  color: "rgba(148,163,184,0.8)",
                  lineHeight: 1.7,
                  marginBottom: "32px",
                  fontSize: "0.95rem",
                }}
              >
                PrivLend is live on Aleo Testnet. Connect your Shield Wallet,
                get a credit tier, and experience DeFi the way it was always
                meant to work — privately.
              </p>
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <button className="cta-btn" onClick={handleLaunch}>
                  Open App →
                </button>
              </div>
            </div>

            {/* Token pair display */}
            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              {[
                {
                  from: "ALEO",
                  to: "USDCx",
                  label: "Collateral → Principal",
                  color: "#6366f1",
                  rate: "150% min ratio",
                },
                {
                  from: "USDCx",
                  to: "ALEO",
                  label: "Repayment → Release",
                  color: "#10b981",
                  rate: "Principal + interest",
                },
                {
                  from: "ALEO",
                  to: "USDCx",
                  label: "Swap any time",
                  color: "#f59e0b",
                  rate: "1:1 testnet rate",
                },
              ].map((pair, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "14px 18px",
                    borderRadius: "14px",
                    background: `${pair.color}08`,
                    border: `1px solid ${pair.color}20`,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "'Space Mono', monospace",
                        fontWeight: 700,
                        color: pair.color,
                        fontSize: "0.9rem",
                      }}
                    >
                      {pair.from}
                    </span>
                    <span style={{ color: "rgba(148,163,184,0.4)" }}>→</span>
                    <span
                      style={{
                        fontFamily: "'Space Mono', monospace",
                        fontWeight: 700,
                        color: "#f1f5f9",
                        fontSize: "0.9rem",
                      }}
                    >
                      {pair.to}
                    </span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{
                        fontSize: "0.65rem",
                        color: "rgba(148,163,184,0.5)",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {pair.label}
                    </div>
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: pair.color,
                        fontFamily: "'Space Mono', monospace",
                        fontWeight: 600,
                      }}
                    >
                      {pair.rate}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FOOTER ───────────────────────────────────────────────────── */}
        <footer
          style={{
            padding: "40px clamp(24px, 6vw, 80px)",
            borderTop: "1px solid rgba(99,102,241,0.1)",
            position: "relative",
            zIndex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "8px",
                background: "linear-gradient(135deg, #F59E0B, #8B5CF6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.8rem",
              }}
            >
              🔒
            </div>
            <span
              style={{
                fontFamily: "'Orbitron', sans-serif",
                fontSize: "0.85rem",
                color: "#475569",
                letterSpacing: "0.04em",
              }}
            >
              PrivLend · Built on Aleo
            </span>
          </div>
          <div style={{ display: "flex", gap: "24px" }}>
            {[
              {
                label: "Testnet Explorer",
                href: "https://testnet.explorer.provable.com",
              },
              { label: "Aleo Docs", href: "https://developer.aleo.org" },
              {
                label: "Shield Wallet",
                href: "https://chromewebstore.google.com/detail/shield/hhddpjpacfjaakjioinajgmhlbhfchao?utm_source=hackathon&utm_medium=mainpage&utm_campaign=akindo",
              },
            ].map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: "0.8rem",
                  color: "#475569",
                  textDecoration: "none",
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#a5b4fc")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#475569")}
              >
                {link.label}
              </a>
            ))}
          </div>
          <div
            style={{
              fontSize: "0.75rem",
              color: "#334155",
              fontFamily: "'Space Mono', monospace",
            }}
          >
            Aleo Privacy Buildathon 2026
          </div>
        </footer>
      </div>
    </>
  );
};

export default LandingPage;
