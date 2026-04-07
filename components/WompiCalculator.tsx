'use client'

import { useState, useMemo, useRef, type ChangeEvent } from "react";

const IVA_RATE = 0.19;
const WOMPI_PERCENT = 0.0265;
const WOMPI_FIXED = 700;
const RETEFUENTE_RATE = 0.015;

interface CalculationResult {
  priceToCharge: number;
  wompiCommission: number;
  ivaCommission: number;
  retefuente: number;
  totalDeductions: number;
  netReceived: number;
}

function calculate(desired: number): CalculationResult {
  // We need to find X (price to charge) such that:
  // net = X - wompiCommission - ivaOnCommission - retefuente = desired
  //
  // wompiCommission = X * 0.0265 + 700
  // ivaOnCommission = wompiCommission * 0.19
  // retefuente = X * 0.015
  //
  // net = X - (X*0.0265 + 700) - (X*0.0265 + 700)*0.19 - X*0.015
  // net = X - X*0.0265 - 700 - X*0.0265*0.19 - 700*0.19 - X*0.015
  // net = X * (1 - 0.0265 - 0.0265*0.19 - 0.015) - 700 - 700*0.19
  // net = X * (1 - 0.0265 - 0.005035 - 0.015) - 700*(1 + 0.19)
  // net = X * 0.953465 - 833
  //
  // X = (desired + 833) / 0.953465

  const factor = 1 - WOMPI_PERCENT - WOMPI_PERCENT * IVA_RATE - RETEFUENTE_RATE;
  const fixedTotal = WOMPI_FIXED * (1 + IVA_RATE);

  const priceToCharge = (desired + fixedTotal) / factor;

  const wompiCommission = priceToCharge * WOMPI_PERCENT + WOMPI_FIXED;
  const ivaCommission = wompiCommission * IVA_RATE;
  const retefuente = priceToCharge * RETEFUENTE_RATE;
  const totalDeductions = wompiCommission + ivaCommission + retefuente;
  const netReceived = priceToCharge - totalDeductions;

  return {
    priceToCharge: Math.ceil(priceToCharge),
    wompiCommission,
    ivaCommission,
    retefuente,
    totalDeductions,
    netReceived: Math.round(netReceived),
  };
}

function formatCOP(n: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

function formatDetailed(n: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

export default function WompiCalculator() {
  const [desired, setDesired] = useState("");
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const result = useMemo<CalculationResult | null>(() => {
    const val = parseFloat(desired.replace(/\./g, "").replace(",", "."));
    if (!isNaN(val) && val > 0) {
      return calculate(val);
    }
    return null;
  }, [desired]);

  const handleInput = (e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^\d]/g, "");
    if (raw === "") {
      setDesired("");
      return;
    }
    const formatted = new Intl.NumberFormat("es-CO").format(parseInt(raw));
    setDesired(formatted);
  };

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result.priceToCharge.toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      width: "100%",
      boxSizing: "border-box",
      background: "#0a0a0f",
      fontFamily: "var(--font-dm-sans), sans-serif",
      color: "#e8e8ed",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "40px 16px 60px",
    }}>
      <div style={{ width: "100%", maxWidth: 440 }}>
        {/* Header */}
        <div style={{ marginBottom: 40, textAlign: "center" }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: "linear-gradient(135deg, #1a1a2e, #16213e)",
            border: "1px solid #2a2a4a",
            borderRadius: 100,
            padding: "6px 16px",
            fontSize: 12,
            fontFamily: "var(--font-space-mono), monospace",
            color: "#7b7b9e",
            marginBottom: 16,
            letterSpacing: "0.05em",
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 8px #4ade80" }} />
            PLAN AVANZADO
          </div>
          <h1 style={{
            fontSize: 28,
            fontWeight: 700,
            margin: "0 0 6px",
            background: "linear-gradient(to right, #e8e8ed, #9999b3)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>
            Calculadora Wompi
          </h1>
          <p style={{
            fontSize: 14,
            color: "#6b6b8a",
            margin: 0,
            lineHeight: 1.5,
          }}>
            Calcula cuánto cobrar para recibir lo que necesitas
          </p>
        </div>

        {/* Input */}
        <div style={{
          background: "linear-gradient(145deg, #12121f, #0e0e1a)",
          border: "1px solid #1f1f3a",
          borderRadius: 20,
          padding: 28,
          marginBottom: 16,
        }}>
          <label style={{
            display: "block",
            fontSize: 12,
            fontFamily: "var(--font-space-mono), monospace",
            color: "#6b6b8a",
            marginBottom: 12,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}>
            ¿Cuánto quieres recibir?
          </label>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}>
            <span style={{
              fontSize: 32,
              fontWeight: 700,
              color: "#4ade80",
            }}>$</span>
            <input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              value={desired}
              onChange={handleInput}
              placeholder="0"
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                fontSize: 32,
                fontWeight: 700,
                fontFamily: "var(--font-space-mono), monospace",
                color: "#e8e8ed",
                letterSpacing: "-0.02em",
                minWidth: 0,
              }}
            />
            {desired && (
              <button
                onClick={() => {
                  setDesired("");
                  inputRef.current?.focus();
                }}
                style={{
                  background: "#1f1f3a",
                  border: "none",
                  borderRadius: "50%",
                  width: 32,
                  height: 32,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "#6b6b8a",
                  fontSize: 16,
                  flexShrink: 0,
                  transition: "background 0.2s ease, color 0.2s ease",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = "#2a2a4a";
                  e.currentTarget.style.color = "#e8e8ed";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = "#1f1f3a";
                  e.currentTarget.style.color = "#6b6b8a";
                }}
                aria-label="Limpiar"
              >
                ✕
              </button>
            )}
          </div>
          <div style={{
            height: 2,
            background: desired ? "linear-gradient(to right, #4ade80, #22d3ee)" : "#1f1f3a",
            borderRadius: 2,
            marginTop: 12,
            transition: "background 0.3s ease",
          }} />
        </div>

        {/* Result */}
        {result && (
          <div style={{
            animation: "fadeIn 0.3s ease",
          }}>
            {/* Price to charge */}
            <div
              onClick={handleCopy}
              style={{
                background: "linear-gradient(135deg, #0f2a1f, #0a1f2e)",
                border: "1px solid #1a3a2a",
                borderRadius: 20,
                padding: 28,
                marginBottom: 16,
                cursor: "pointer",
                transition: "all 0.2s ease",
                position: "relative",
                overflow: "hidden",
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = "#2a5a4a"}
              onMouseLeave={e => e.currentTarget.style.borderColor = "#1a3a2a"}
            >
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
              }}>
                <span style={{
                  fontSize: 12,
                  fontFamily: "var(--font-space-mono), monospace",
                  color: "#4ade80",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}>
                  Debes cobrar
                </span>
                <span style={{
                  fontSize: 11,
                  color: copied ? "#4ade80" : "#3a5a4a",
                  fontFamily: "var(--font-space-mono), monospace",
                  transition: "color 0.2s",
                }}>
                  {copied ? "✓ Copiado" : "Tap para copiar"}
                </span>
              </div>
              <div style={{
                fontSize: 36,
                fontWeight: 700,
                fontFamily: "var(--font-space-mono), monospace",
                color: "#4ade80",
                textShadow: "0 0 40px rgba(74, 222, 128, 0.15)",
              }}>
                {formatCOP(result.priceToCharge)}
              </div>
            </div>

            {/* Breakdown */}
            <div style={{
              background: "linear-gradient(145deg, #12121f, #0e0e1a)",
              border: "1px solid #1f1f3a",
              borderRadius: 20,
              padding: 24,
              marginBottom: 16,
            }}>
              <div style={{
                fontSize: 12,
                fontFamily: "var(--font-space-mono), monospace",
                color: "#6b6b8a",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginBottom: 20,
              }}>
                Desglose
              </div>

              {[
                { label: "Valor de la venta", value: formatCOP(result.priceToCharge), color: "#e8e8ed" },
                { label: `Comisión Wompi (2,65% + $700)`, value: `- ${formatDetailed(result.wompiCommission)}`, color: "#f87171" },
                { label: "IVA comisión (19%)", value: `- ${formatDetailed(result.ivaCommission)}`, color: "#f87171" },
                { label: "ReteFuente (1,5%)", value: `- ${formatDetailed(result.retefuente)}`, color: "#f87171" },
              ].map((row, i) => (
                <div key={i} style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px 0",
                  borderBottom: i < 3 ? "1px solid #1a1a30" : "none",
                }}>
                  <span style={{ fontSize: 13, color: "#9999b3" }}>{row.label}</span>
                  <span style={{
                    fontSize: 13,
                    fontFamily: "var(--font-space-mono), monospace",
                    color: row.color,
                    fontWeight: 500,
                  }}>{row.value}</span>
                </div>
              ))}

              {/* Total deductions */}
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "16px 0 4px",
                borderTop: "1px solid #2a2a4a",
                marginTop: 4,
              }}>
                <span style={{ fontSize: 13, color: "#9999b3", fontWeight: 600 }}>Total descuentos</span>
                <span style={{
                  fontSize: 14,
                  fontFamily: "var(--font-space-mono), monospace",
                  color: "#f87171",
                  fontWeight: 700,
                }}>- {formatDetailed(result.totalDeductions)}</span>
              </div>
            </div>

            {/* Net received */}
            <div style={{
              background: "linear-gradient(145deg, #12121f, #0e0e1a)",
              border: "1px solid #1f1f3a",
              borderRadius: 20,
              padding: 24,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}>
              <span style={{
                fontSize: 13,
                color: "#9999b3",
                fontWeight: 600,
              }}>Te llega a Nequi</span>
              <span style={{
                fontSize: 22,
                fontFamily: "var(--font-space-mono), monospace",
                fontWeight: 700,
                color: "#4ade80",
              }}>{formatCOP(result.netReceived)}</span>
            </div>

            {/* Verification note */}
            <p style={{
              textAlign: "center",
              fontSize: 11,
              color: "#4a4a6a",
              fontFamily: "var(--font-space-mono), monospace",
              marginTop: 16,
              lineHeight: 1.6,
            }}>
              * El monto a cobrar se redondea hacia arriba.
              <br />
              Diferencia mínima posible: ≈ {formatCOP(result.netReceived - parseFloat(desired.replace(/\./g, "")))} a tu favor.
            </p>
          </div>
        )}

        {/* Rates reference */}
        <div style={{
          marginTop: 32,
          background: "linear-gradient(145deg, #12121f, #0e0e1a)",
          border: "1px solid #1a1a30",
          borderRadius: 16,
          padding: "16px 20px",
        }}>
          <div style={{
            fontSize: 11,
            fontFamily: "var(--font-space-mono), monospace",
            color: "#4a4a6a",
            letterSpacing: "0.05em",
            marginBottom: 10,
          }}>TARIFAS PLAN AVANZADO</div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {["2,65% + $700 + IVA", "ReteFuente 1,5%"].map((t, i) => (
              <span key={i} style={{
                fontSize: 12,
                color: "#6b6b8a",
                background: "#0a0a15",
                padding: "4px 10px",
                borderRadius: 6,
                border: "1px solid #1a1a30",
              }}>{t}</span>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        input::placeholder { color: #3a3a5a; }
      `}</style>
    </div>
  );
}
