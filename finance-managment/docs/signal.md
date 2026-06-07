
  ◈ 🧠 Signal Fusion — Cómo funciona


Signal Fusion es el cerebro del sistema. Toma todas las señales de los diferentes agentes y las combina en una recomendación única por activo.


  ◇ El proceso en 5 pasos:



  ┌──
   1 │ 📰 News ──┐
   2 │ 🏦 Smart Money ──┼──→ 1. NORMALIZAR → 2. PONDERAR → 3. DETECTAR CONFLICTO → 4. FUSIONAR → 5. RECOMENDAR
   3 │ 📊 Técnico ─┘
  └────────────────────────────────────────────────



  ◇ 1. 📥 Entrada: 3 fuentes de señales


┌────────────────────────────────┬─────────────────────────────────────────────┬──────────────────┐
│             Fuente             │                 Qué detecta                 │ Peso por defecto │
├────────────────────────────────┼─────────────────────────────────────────────┼──────────────────┤
│ **📰 News**                    │ Sentimiento de noticias (positivo/negativo) │ **30%**          │
├────────────────────────────────┼─────────────────────────────────────────────┼──────────────────┤
│ **🏦 Smart Money (13F)**       │ Movimientos de inversores institucionales   │ **35%**          │
├────────────────────────────────┼─────────────────────────────────────────────┼──────────────────┤
│ **📊 Análisis Técnico**        │ RSI, MACD, medias móviles                   │ **10%**          │
├────────────────────────────────┼─────────────────────────────────────────────┼──────────────────┤
│ **🔍 Insider Trades (Form 4)** │ Compras/ventas de ejecutivos                │ **15%**          │
├────────────────────────────────┼─────────────────────────────────────────────┼──────────────────┤
│ **🐋 Whale Transactions**      │ Grandes movimientos en blockchain           │ **10%**          │
└────────────────────────────────┴─────────────────────────────────────────────┴──────────────────┘


  ◇ 2. 🔄 Normalización


Cada señal se convierte a un formato común:


  ┌──
   1 │ direction: -1 (muy bajista) a +1 (muy alcista)
   2 │ magnitude: 0 (débil) a 1 (fuerte)
   3 │ confidence: 0 (incierto) a 1 (seguro)
  └────────────────────────────────────────────────



  ◇ 3. ⚖️ Ponderación


Se aplican los pesos configurados. Ejemplo con AAPL:


  ┌──
   1 │ 📰 News:      score +0.8 × peso 30% × confianza 90% = +0.216
   2 │ 🏦 Smart Money: score -0.7 × peso 35% × confianza 85% = -0.208
   3 │ 📊 Técnico:    score +0.3 × peso 10% × confianza 50% = +0.015
   4 │                                           ─────────
   5 │                     Score final:           +0.023 → HOLD
  └────────────────────────────────────────────────



  ◇ 4. ⚡ Detección de Conflictos


Cuando las fuentes se contradicen (ej: News dice COMPRAR pero Smart Money dice VENDER):

┌────────────┬───────────────────────────────┬───────────────────────────────────────────────────┐
│ Conflicto  │         Qué significa         │                    Resolución                     │
├────────────┼───────────────────────────────┼───────────────────────────────────────────────────┤
│ **LOW**    │ 1 fuente bullish vs 1 bearish │ Se inclina hacia el lado con mayor peso           │
├────────────┼───────────────────────────────┼───────────────────────────────────────────────────┤
│ **MEDIUM** │ 2 vs 2 fuentes                │ Si hay co-investment STRONG, prioriza Smart Money │
├────────────┼───────────────────────────────┼───────────────────────────────────────────────────┤
│ **HIGH**   │ Múltiples fuentes divididas   │ Fuerza **CONFLICT_HOLD** (no hacer nada)          │
└────────────┴───────────────────────────────┴───────────────────────────────────────────────────┘


  ◇ 5. 🎯 Acción Final


┌────────────────────┬──────────────────────┬────────────────────────────────────────────────┐
│       Score        │        Acción        │                   Qué hacer                    │
├────────────────────┼──────────────────────┼────────────────────────────────────────────────┤
│ **> 0.6**          │ 🟢 **STRONG_BUY**    │ Aumentar asignación significativamente         │
├────────────────────┼──────────────────────┼────────────────────────────────────────────────┤
│ **> 0.3**          │ 🔵 **CAUTIOUS_BUY**  │ Aumentar ligeramente                           │
├────────────────────┼──────────────────────┼────────────────────────────────────────────────┤
│ **-0.3 a 0.3**     │ ⚪ **HOLD**           │ Mantener posición actual                       │
├────────────────────┼──────────────────────┼────────────────────────────────────────────────┤
│ **< -0.3**         │ 🟠 **CAUTIOUS_SELL** │ Reducir ligeramente                            │
├────────────────────┼──────────────────────┼────────────────────────────────────────────────┤
│ **< -0.6**         │ 🔴 **STRONG_SELL**   │ Vender posición                                │
├────────────────────┼──────────────────────┼────────────────────────────────────────────────┤
│ **Conflicto alto** │ 🟡 **CONFLICT_HOLD** │ No hacer nada hasta que las señales se alineen │
└────────────────────┴──────────────────────┴────────────────────────────────────────────────┘


  ◇ 🎛️ Perfiles de Inversión


Puedes cambiar los pesos según tu estilo:

┌─────────────────────┬─────────┬─────────┬────────┬─────────┬─────────┐
│       Perfil        │  News   │   13F   │ Form4  │  Whale  │ Técnico │
├─────────────────────┼─────────┼─────────┼────────┼─────────┼─────────┤
│ **Value Investor**  │ 20%     │ **50%** │ 15%    │ 5%      │ 10%     │
├─────────────────────┼─────────┼─────────┼────────┼─────────┼─────────┤
│ **Growth Investor** │ **35%** │ 30%     │ 10%    │ 5%      │ 20%     │
├─────────────────────┼─────────┼─────────┼────────┼─────────┼─────────┤
│ **Crypto Trader**   │ 20%     │ 5%      │ 5%     │ **50%** │ 20%     │
├─────────────────────┼─────────┼─────────┼────────┼─────────┼─────────┤
│ **Conservative**    │ 25%     │ **45%** │ 15%    │ 5%      │ 10%     │
└─────────────────────┴─────────┴─────────┴────────┴─────────┴─────────┘

    
  ◇ 📊 En la interfaz


Cada activo muestra:
  • Barra de progreso: verde (alcista) a rojo (bajista)
  • Contribuciones: qué aportó cada fuente
  • Conflictos: si hay fuentes enfrentadas
  • Rationale: explicación en lenguaje natural

Ejemplo real de AAPL:

  ┌──
   1 │ 🏦 Institutional (13F): 51% alcista (peso: 29%)
   2 │ 📰 News: 1% alcista (peso: 24%)
   3 │ 📊 Technical: 15% alcista (peso: 6%)
   4 │ 📊 Score fusionado: 27.5% → HOLD
  └────────────────────────────────────────────────
    