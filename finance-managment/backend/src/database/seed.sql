-- Seed data for Finance Portfolio Management System
-- Run automatically on first database creation

-- Tracked Investors
INSERT INTO tracked_investors (id, name, "fundType", cik, description, "knownStrategy", "isActive")
VALUES
  (gen_random_uuid(), 'ARK Invest', 'hedge_fund', '0001576288', 'Cathie Wood - Innovation', to_jsonb(ARRAY['innovation', 'growth']), true),
  (gen_random_uuid(), 'Berkshire Hathaway', 'holding_company', '0001067983', 'Warren Buffett - Value', to_jsonb(ARRAY['value', 'long-term']), true),
  (gen_random_uuid(), 'Bridgewater Associates', 'hedge_fund', '0001350694', 'Ray Dalio - Macro', to_jsonb(ARRAY['macro', 'risk-parity']), true),
  (gen_random_uuid(), 'Renaissance Technologies', 'hedge_fund', '0001037381', 'Jim Simons - Quant', to_jsonb(ARRAY['quant', 'high-frequency']), true),
  (gen_random_uuid(), 'BlackRock', 'asset_manager', '0001364742', 'Larry Fink - Index', to_jsonb(ARRAY['index', 'passive']), true),
  (gen_random_uuid(), 'Vanguard', 'asset_manager', '0000102909', 'Jack Bogle - Index', to_jsonb(ARRAY['index', 'low-cost']), true),
  (gen_random_uuid(), 'Third Point', 'hedge_fund', '0001040274', 'Dan Loeb - Activist', to_jsonb(ARRAY['activist', 'event-driven']), true),
  (gen_random_uuid(), 'Pershing Square', 'hedge_fund', '0001336528', 'Bill Ackman - Concentrated', to_jsonb(ARRAY['concentrated', 'activist']), true),
  (gen_random_uuid(), 'Scion Asset Management', 'hedge_fund', '0001418814', 'Michael Burry - Contrarian', to_jsonb(ARRAY['value', 'contrarian']), true),
  (gen_random_uuid(), 'Tiger Global', 'hedge_fund', '0001040017', 'Chase Coleman - Growth', to_jsonb(ARRAY['growth', 'tech']), true)
ON CONFLICT (name) DO NOTHING;

-- Sample Assets
INSERT INTO assets (id, symbol, name, type, "currentPrice", "dailyChange")
VALUES
  (gen_random_uuid(), 'AAPL', 'Apple Inc.', 'stock', 198.50, 1.25),
  (gen_random_uuid(), 'MSFT', 'Microsoft Corp.', 'stock', 425.30, -0.45),
  (gen_random_uuid(), 'GOOGL', 'Alphabet Inc.', 'stock', 175.80, 0.80),
  (gen_random_uuid(), 'AMZN', 'Amazon.com Inc.', 'stock', 185.20, 2.10),
  (gen_random_uuid(), 'TSLA', 'Tesla Inc.', 'stock', 245.60, -1.30),
  (gen_random_uuid(), 'BTC', 'Bitcoin', 'crypto', 67500.00, 3.50),
  (gen_random_uuid(), 'ETH', 'Ethereum', 'crypto', 3450.00, 2.80),
  (gen_random_uuid(), 'SPY', 'SPDR S&P 500 ETF', 'etf', 520.40, 0.15),
  (gen_random_uuid(), 'QQQ', 'Invesco QQQ Trust', 'etf', 445.20, 0.90),
  (gen_random_uuid(), 'TLT', 'iShares 20+ Year Treasury Bond ETF', 'etf', 92.30, -0.25)
ON CONFLICT (symbol) DO NOTHING;
