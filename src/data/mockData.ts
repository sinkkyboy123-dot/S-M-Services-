export interface StockData {
  name: string;
  ticker: string;
  price: number;
  change: number;
  changePercent: number;
  marketCap: string;
  sector: string;
  industry: string;
  founded: string;
  employees: string;
  headquarters: string;
  ceo: string;
  description: string;
  businessModel: string;
  bullCase: string[];
  bearCase: string[];
  keyMetrics: {
    pe: number | null;
    eps: number | null;
    revenue: string;
    revenueGrowth: string | null;
    grossMargin: string;
    operatingMargin: string;
    netMargin: string;
    debtToEquity: number | null;
    roe: string;
    roa: string;
    currentRatio: number | null;
    dividendYield: string;
    beta: number | null;
    fiftyTwoWeekHigh: number;
    fiftyTwoWeekLow: number;
  };
  competitors: string[];
  recentNews: string[];
}

export const stockDatabase: Record<string, StockData> = {
  AAPL: {
    name: "Apple Inc.",
    ticker: "AAPL",
    price: 189.25,
    change: 1.23,
    changePercent: 0.65,
    marketCap: "$2.94T",
    sector: "Technology",
    industry: "Consumer Electronics",
    founded: "1976",
    employees: "164,000",
    headquarters: "Cupertino, CA",
    ceo: "Tim Cook",
    description:
      "Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide. The company offers iPhone, Mac, iPad, Apple Watch, and AirPods product lines, alongside a growing suite of services including the App Store, Apple Music, iCloud, Apple TV+, and Apple Pay.",
    businessModel:
      "Apple operates a vertically integrated business model, designing its own hardware, software, and silicon (M-series chips). Revenue streams include hardware product sales (~60%) and a rapidly growing Services segment (~25% of revenue, ~45% gross margin). The ecosystem lock-in — where each Apple product enhances the others — drives extraordinary customer retention rates above 90%.",
    bullCase: [
      "Services segment growing at 15%+ annually with ~45% gross margins, expanding total profitability",
      "Apple Intelligence AI features creating compelling upgrade cycle for iPhone 15/16 users",
      "Deepening ecosystem moat: 2.2B active devices with 90%+ customer retention",
      "Emerging market penetration in India and Southeast Asia represents $300B+ addressable opportunity",
      "Healthcare and fintech expansion (Apple Pay, Health Records) diversifying revenue further",
      "Balance sheet fortress: $60B+ net cash enables aggressive buybacks ($90B program active)",
    ],
    bearCase: [
      "iPhone represents ~50% of revenue — single product dependency creates concentration risk",
      "China headwinds: $70B+ annual market facing Huawei resurgence and potential government restrictions",
      "EU Digital Markets Act forcing App Store changes, threatening high-margin services fees",
      "Premium pricing limits growth in price-sensitive emerging markets vs. Android competitors",
      "Post-Cook succession risk with no clear internal candidate identified publicly",
    ],
    keyMetrics: {
      pe: 29.8,
      eps: 6.35,
      revenue: "$391.0B",
      revenueGrowth: "+2.3%",
      grossMargin: "46.2%",
      operatingMargin: "30.7%",
      netMargin: "25.3%",
      debtToEquity: 1.52,
      roe: "147.9%",
      roa: "28.3%",
      currentRatio: 0.99,
      dividendYield: "0.52%",
      beta: 1.19,
      fiftyTwoWeekHigh: 199.62,
      fiftyTwoWeekLow: 164.08,
    },
    competitors: ["MSFT", "GOOGL", "SAMS.KS", "SONY"],
    recentNews: [
      "Apple Intelligence features rolling out to iPhone 16 users in 40+ countries",
      "Services revenue hit record $24.2B in Q1 2025, up 14% year-over-year",
      "Apple opens 5th India retail store as emerging market strategy accelerates",
    ],
  },

  MSFT: {
    name: "Microsoft Corporation",
    ticker: "MSFT",
    price: 415.80,
    change: -2.15,
    changePercent: -0.51,
    marketCap: "$3.09T",
    sector: "Technology",
    industry: "Software — Infrastructure",
    founded: "1975",
    employees: "228,000",
    headquarters: "Redmond, WA",
    ceo: "Satya Nadella",
    description:
      "Microsoft Corporation develops and supports software, services, devices, and solutions worldwide. The company operates three segments: Productivity and Business Processes (Office 365, LinkedIn, Dynamics), Intelligent Cloud (Azure, server products), and More Personal Computing (Windows, Xbox, Surface, Bing).",
    businessModel:
      "Microsoft's flywheel centers on Azure cloud infrastructure, growing at 28% annually and now generating ~$110B in annual run-rate revenue. The company monetizes via subscription SaaS (Microsoft 365, Dynamics 365), platform fees (Azure consumption), gaming (Xbox Game Pass), and productivity tools. Copilot AI integration across all products creates upsell opportunities at a $30/user/month premium tier.",
    bullCase: [
      "Azure cloud growing 28% YoY — still early innings in the estimated $1T+ cloud market",
      "Copilot monetization underway: $30/month premium add-on across 400M+ Office 365 seats",
      "OpenAI investment gives exclusive access to cutting-edge AI models and joint commercialization",
      "Enterprise switching costs are extremely high — Microsoft 365 is mission-critical infrastructure",
      "Gaming pivot: Activision acquisition adds Call of Duty, Candy Crush, King to Game Pass",
      "LinkedIn network effects strengthen as AI-powered recruiting tools gain traction",
    ],
    bearCase: [
      "Azure faces stiff competition from AWS (32% market share) and Google Cloud (11%)",
      "Activision Blizzard integration costs and gaming division operating at thin margins",
      "Antitrust and regulatory scrutiny intensifying globally around AI and cloud dominance",
      "OpenAI concentration risk: $13B+ invested in a single AI partner with uncertain path to profitability",
      "PC market decline pressuring Windows OEM revenue; Surface hardware losing market share",
    ],
    keyMetrics: {
      pe: 34.2,
      eps: 12.15,
      revenue: "$245.1B",
      revenueGrowth: "+15.7%",
      grossMargin: "70.1%",
      operatingMargin: "44.6%",
      netMargin: "36.4%",
      debtToEquity: 0.35,
      roe: "38.5%",
      roa: "18.4%",
      currentRatio: 1.25,
      dividendYield: "0.72%",
      beta: 0.89,
      fiftyTwoWeekHigh: 468.35,
      fiftyTwoWeekLow: 362.90,
    },
    competitors: ["AMZN", "GOOGL", "AAPL", "CRM"],
    recentNews: [
      "Azure OpenAI Service surpasses 100,000 enterprise customers globally",
      "Microsoft Copilot Studio reaches 50,000 organizations building custom AI agents",
      "Q2 FY2025: Intelligent Cloud segment revenue grew 21% YoY to $25.5B",
    ],
  },

  NVDA: {
    name: "NVIDIA Corporation",
    ticker: "NVDA",
    price: 875.40,
    change: 22.30,
    changePercent: 2.61,
    marketCap: "$2.15T",
    sector: "Technology",
    industry: "Semiconductors",
    founded: "1993",
    employees: "32,000",
    headquarters: "Santa Clara, CA",
    ceo: "Jensen Huang",
    description:
      "NVIDIA Corporation is a computing infrastructure company. It operates in two segments: Graphics (GeForce GPUs for gaming, NVIDIA RTX for professionals) and Compute & Networking (Data Center AI chips, DRIVE for autonomous vehicles, and networking via Mellanox). NVIDIA's CUDA ecosystem has become the de facto standard for AI model training.",
    businessModel:
      "NVIDIA's business model is built on GPU architecture leadership and the CUDA software ecosystem. The company designs chips (fabless model — manufactured by TSMC) and licenses IP. Data Center now represents ~88% of revenue, driven by H100/H200 AI training chips and the upcoming Blackwell architecture. Gross margins have expanded from ~60% to ~78% as AI demand dramatically outstrips supply.",
    bullCase: [
      "AI infrastructure buildout is a multi-year $500B+ capex cycle — NVIDIA is the central picks-and-shovels play",
      "CUDA moat: 10+ years of developer ecosystem investment makes switching to AMD/Intel extremely costly",
      "Blackwell architecture chips priced at $30K-$40K each vs. H100 at $25K — revenue per unit expanding",
      "Software stack (NIM microservices, DGX Cloud) building recurring revenue alongside hardware",
      "Autonomous vehicle TAM: $300B+ market opportunity with DRIVE Orin gaining design wins",
      "Jensen Huang's long-term technical vision and execution track record is exceptional",
    ],
    bearCase: [
      "Revenue concentration: Top 5 cloud customers (hyperscalers) represent ~50% of Data Center revenue",
      "AMD MI300X and Intel Gaudi 3 gaining traction — competitive pressure growing at lower price points",
      "China export controls cut off $4B+ annual market; further restrictions are a regulatory tail risk",
      "Valuation at 35x forward sales prices in near-perfect execution — any miss will be punished severely",
      "TSMC supply chain constraints could cap near-term upside even with strong demand",
    ],
    keyMetrics: {
      pe: 65.2,
      eps: 13.43,
      revenue: "$96.3B",
      revenueGrowth: "+122.4%",
      grossMargin: "78.4%",
      operatingMargin: "62.1%",
      netMargin: "55.0%",
      debtToEquity: 0.42,
      roe: "123.8%",
      roa: "55.6%",
      currentRatio: 4.17,
      dividendYield: "0.03%",
      beta: 1.72,
      fiftyTwoWeekHigh: 1065.23,
      fiftyTwoWeekLow: 462.15,
    },
    competitors: ["AMD", "INTC", "QCOM", "AVGO"],
    recentNews: [
      "Blackwell GB200 NVL72 rack systems in full production ramp at TSMC's Arizona fab",
      "NVIDIA NIM microservices adopted by 400+ enterprise customers for AI deployment",
      "FY2025 Q4 revenue: $39.3B, up 78% YoY — Data Center at $35.6B",
    ],
  },

  TSLA: {
    name: "Tesla, Inc.",
    ticker: "TSLA",
    price: 248.60,
    change: -5.80,
    changePercent: -2.28,
    marketCap: "$793.2B",
    sector: "Consumer Cyclical",
    industry: "Auto Manufacturers",
    founded: "2003",
    employees: "140,000",
    headquarters: "Austin, TX",
    ceo: "Elon Musk",
    description:
      "Tesla, Inc. designs, develops, manufactures, leases, and sells electric vehicles (EVs), energy generation, and storage systems worldwide. Vehicle lineup includes Model 3, Model Y, Model S, Model X, Cybertruck, and Semi. Energy division sells Powerwall, Megapack battery storage, and solar products. Autopilot and Full Self-Driving (FSD) are key software initiatives.",
    businessModel:
      "Tesla operates as an integrated energy and mobility technology company. Revenue comes from Automotive (~83%), Services & Other, and Energy Generation & Storage (~11%). Unlike traditional automakers, Tesla owns its sales and service network globally. The long-term thesis centers on FSD software ($12,000 one-time or $199/month) becoming a high-margin revenue stream, and the Robotaxi/Cybercab network as a platform business.",
    bullCase: [
      "FSD v13 showing step-change improvement — potential to unlock $50B+ software revenue if robotaxi scales",
      "Energy division inflecting: Megapack revenue up 113% YoY, becoming a meaningful profit center",
      "Cheapest Next-Gen Model (~$25K) could open mass market and re-accelerate volume growth",
      "Supercharger network — industry standard NACS adopted by Ford, GM, Rivian — creates energy moat",
      "Optimus humanoid robot: if delivered at scale, could redefine Tesla's total addressable market",
      "Lowest manufacturing cost per vehicle of any EV maker due to Gigafactory vertical integration",
    ],
    bearCase: [
      "Q1 2025 deliveries miss: 336,681 units, down 13% YoY — demand saturation in key markets",
      "Price cuts have compressed auto gross margins from 29% peak to ~17% today",
      "Intensifying Chinese competition: BYD, Li Auto, NIO pricing EVs 20-40% below equivalent Teslas",
      "Elon Musk's political activities (DOGE role, controversial statements) damaging brand in Europe",
      "FSD timeline has been delayed repeatedly for a decade — credibility risk on autonomous promises",
      "Traditional automakers (GM Ultium, Ford F-150 Lightning, Hyundai Ioniq) closing the tech gap",
    ],
    keyMetrics: {
      pe: 82.1,
      eps: 3.03,
      revenue: "$97.7B",
      revenueGrowth: "-1.1%",
      grossMargin: "17.9%",
      operatingMargin: "8.2%",
      netMargin: "7.3%",
      debtToEquity: 0.15,
      roe: "11.8%",
      roa: "6.1%",
      currentRatio: 1.84,
      dividendYield: "0.00%",
      beta: 2.34,
      fiftyTwoWeekHigh: 414.50,
      fiftyTwoWeekLow: 138.80,
    },
    competitors: ["RIVN", "NIO", "GM", "F", "LCID"],
    recentNews: [
      "Tesla Cybercab production scheduled to begin in late 2025 at Texas Gigafactory",
      "Megapack Q1 2025 deployments: 10.4 GWh — record quarter for energy storage",
      "FSD v13 'unsupervised' demo video released, improving end-to-end neural network performance",
    ],
  },
};

export const testimonials = [
  {
    name: "Marcus Chen",
    role: "Retail Investor, 5 years",
    avatar: "MC",
    avatarColor: "bg-blue-500",
    content:
      "InvestSmart AI cut my research time from 3 hours to 20 minutes per stock. The bull/bear analysis is exactly how I think about positions — I've made 3 better decisions this quarter alone.",
    rating: 5,
  },
  {
    name: "Sarah Williams",
    role: "Hedge Fund Analyst",
    avatar: "SW",
    avatarColor: "bg-purple-500",
    content:
      "The portfolio diversification scoring finally gives me a quick snapshot I can share with clients. The sector breakdown visualization is cleaner than anything our Bloomberg terminal produces.",
    rating: 5,
  },
  {
    name: "David Park",
    role: "Day Trader",
    avatar: "DP",
    avatarColor: "bg-orange-500",
    content:
      "News Simplifier is a game changer. I pasted a Fed minutes release and got a clean 5-bullet summary in seconds. Used to take me 30 minutes to parse that myself.",
    rating: 5,
  },
  {
    name: "Amanda Torres",
    role: "Beginner Investor",
    avatar: "AT",
    avatarColor: "bg-pink-500",
    content:
      "As someone new to investing, the business model breakdowns in plain English are invaluable. I finally understand how these companies actually make money before I put my savings in.",
    rating: 5,
  },
];

export const newsExamples = [
  {
    label: "Fed Meeting Minutes",
    text: `The Federal Open Market Committee decided to maintain the target range for the federal funds rate at 5-1/4 to 5-1/2 percent. Members noted that inflation had eased substantially over the past year but remained somewhat elevated above the Committee's longer-run 2 percent objective. Committee members indicated they do not expect it will be appropriate to reduce the target range until they have gained greater confidence that inflation is moving sustainably toward 2 percent. Recent indicators suggest economic activity has been expanding at a solid pace. Labor market conditions have remained strong; the unemployment rate has remained low, and both payroll employment and wages have grown at a solid pace. Consumer price inflation has slowed considerably from its peak but is still elevated. The Committee is highly attentive to inflation risks and remains committed to returning inflation to its 2 percent objective.`,
  },
  {
    label: "Earnings Report",
    text: `Apple Inc. today announced financial results for its fiscal 2024 first quarter ended December 30, 2023. The Company posted quarterly revenue of $119.6 billion, down 1 percent year over year, and quarterly earnings per diluted share of $2.18, up 16 percent year over year. "Today Apple is reporting revenue of $119.6 billion in revenue for the December quarter and an EPS record of $2.18, despite a challenging macroeconomic environment. We are very pleased with our record results, led by a December quarter record for Services and iPhone, supported by strong growth in many emerging markets," said Tim Cook, Apple's CEO.`,
  },
  {
    label: "Market Analysis",
    text: `Equity markets rallied strongly on Friday as better-than-expected jobs data eased recession fears while simultaneously not being strong enough to push the Federal Reserve toward further rate hikes. The S&P 500 rose 1.2%, the Nasdaq Composite gained 1.8%, and the Dow Jones Industrial Average added 0.9%. Technology shares led the advance, with semiconductor stocks outperforming after Taiwan Semiconductor Manufacturing Company raised its full-year revenue forecast citing strong AI chip demand. Treasury yields fell modestly, with the 10-year yield slipping to 4.22% from 4.31%, as traders priced in a slightly higher probability of rate cuts beginning in September.`,
  },
];

export const sampleNewsAnalysis = {
  executiveSummary:
    "The Federal Reserve opted to hold rates steady at 5.25-5.50%, signaling a cautious approach to easing despite progress on inflation. The Committee wants additional evidence of sustained disinflation before cutting rates, with markets interpreting this as a later-than-expected start to the easing cycle.",
  keyTakeaways: [
    "Fed funds rate held at 5.25-5.50% — no immediate cut signal",
    "Inflation 'has eased substantially' but remains above the 2% target",
    "Labor market described as 'strong' with low unemployment",
    "Rate cuts contingent on 'greater confidence' inflation is sustainably falling",
    "Economic activity expanding at a 'solid pace' — no recession concern flagged",
  ],
  bullishImplications: [
    "No surprise rate hike — the Fed's steady hand reduces near-term market uncertainty",
    "Strong labor market signals resilient consumer spending and corporate earnings power",
    "'Solid economic expansion' language supports risk assets and cyclical sectors",
    "Implicit forward guidance on eventual cuts maintains the rate-cut narrative intact",
  ],
  bearishImplications: [
    "Higher-for-longer rates compress equity valuations, especially in rate-sensitive growth stocks",
    "Mortgage rates remain elevated, pressuring housing market and real estate sector",
    "Prolonged tight credit conditions could stress over-leveraged companies and private credit",
    "Delayed rate cuts may strengthen the USD, creating headwinds for multinational earnings",
  ],
};

export const defaultPortfolioHoldings = [
  { ticker: "AAPL", allocation: 25 },
  { ticker: "MSFT", allocation: 20 },
  { ticker: "NVDA", allocation: 15 },
  { ticker: "AMZN", allocation: 10 },
  { ticker: "TSLA", allocation: 10 },
  { ticker: "JPM", allocation: 8 },
  { ticker: "BRK.B", allocation: 7 },
  { ticker: "JNJ", allocation: 5 },
];

export interface PortfolioHolding {
  ticker: string;
  allocation: number;
}

export interface PortfolioAnalysis {
  diversificationScore: number;
  riskLevel: "Low" | "Moderate" | "High" | "Very High";
  riskScore: number;
  sectorAllocation: { sector: string; percentage: number; color: string }[];
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

export function analyzePortfolio(holdings: PortfolioHolding[]): PortfolioAnalysis {
  const totalAllocation = holdings.reduce((sum, h) => sum + h.allocation, 0);
  const numHoldings = holdings.length;

  const sectorMap: Record<string, number> = {};
  const sectorColors: Record<string, string> = {
    Technology: "#00A86B",
    "Consumer Cyclical": "#3B82F6",
    Healthcare: "#8B5CF6",
    Financial: "#F59E0B",
    Energy: "#EF4444",
    Industrial: "#06B6D4",
    "Consumer Defensive": "#84CC16",
    Communication: "#EC4899",
    Other: "#6B7280",
  };

  const techTickers = ["AAPL", "MSFT", "NVDA", "GOOGL", "META", "AMD", "INTC", "QCOM", "AVGO", "CRM", "ORCL", "ADBE"];
  const cyclicalTickers = ["TSLA", "AMZN", "NFLX", "DIS", "SBUX", "NKE", "MCD", "HD", "TGT", "WMT", "COST"];
  const healthTickers = ["JNJ", "UNH", "PFE", "MRK", "ABBV", "TMO", "DHR", "ABT", "LLY"];
  const financialTickers = ["JPM", "BAC", "WFC", "GS", "MS", "BRK.B", "V", "MA", "AXP", "BLK"];
  const energyTickers = ["XOM", "CVX", "COP", "SLB", "EOG", "PSX", "VLO", "MPC"];

  holdings.forEach((h) => {
    const pct = (h.allocation / totalAllocation) * 100;
    let sector = "Other";
    const ticker = h.ticker.toUpperCase();
    if (techTickers.includes(ticker)) sector = "Technology";
    else if (cyclicalTickers.includes(ticker)) sector = "Consumer Cyclical";
    else if (healthTickers.includes(ticker)) sector = "Healthcare";
    else if (financialTickers.includes(ticker)) sector = "Financial";
    else if (energyTickers.includes(ticker)) sector = "Energy";
    sectorMap[sector] = (sectorMap[sector] || 0) + pct;
  });

  const sectorAllocation = Object.entries(sectorMap)
    .sort((a, b) => b[1] - a[1])
    .map(([sector, percentage]) => ({
      sector,
      percentage: Math.round(percentage),
      color: sectorColors[sector] || sectorColors.Other,
    }));

  const topConcentration = Math.max(...holdings.map((h) => (h.allocation / totalAllocation) * 100));
  const techWeight = sectorMap["Technology"] || 0;

  let diversificationScore = 85;
  if (numHoldings < 5) diversificationScore -= 25;
  else if (numHoldings < 8) diversificationScore -= 10;
  if (topConcentration > 40) diversificationScore -= 20;
  else if (topConcentration > 25) diversificationScore -= 10;
  if (techWeight > 60) diversificationScore -= 15;
  else if (techWeight > 45) diversificationScore -= 8;
  if (Object.keys(sectorMap).length >= 4) diversificationScore += 5;
  diversificationScore = Math.max(20, Math.min(100, diversificationScore));

  let riskScore = 50;
  if (techWeight > 50) riskScore += 15;
  if (topConcentration > 30) riskScore += 10;
  if (numHoldings < 5) riskScore += 10;
  const hasTSLA = holdings.some((h) => h.ticker.toUpperCase() === "TSLA");
  const hasNVDA = holdings.some((h) => h.ticker.toUpperCase() === "NVDA");
  if (hasTSLA) riskScore += 8;
  if (hasNVDA) riskScore += 5;
  riskScore = Math.max(10, Math.min(100, riskScore));

  let riskLevel: "Low" | "Moderate" | "High" | "Very High";
  if (riskScore < 35) riskLevel = "Low";
  else if (riskScore < 55) riskLevel = "Moderate";
  else if (riskScore < 75) riskLevel = "High";
  else riskLevel = "Very High";

  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const recommendations: string[] = [];

  if (numHoldings >= 8) strengths.push("Well-diversified across multiple positions, reducing single-stock risk");
  if (techWeight < 40 && techWeight > 15) strengths.push("Healthy technology allocation balancing growth with stability");
  if (sectorAllocation.some((s) => s.sector === "Financial")) strengths.push("Financial sector exposure provides defensive characteristics and dividend income");
  if (sectorAllocation.some((s) => s.sector === "Healthcare")) strengths.push("Healthcare holdings offer recession resistance and demographic tailwinds");
  if (topConcentration < 20) strengths.push("No single stock dominates the portfolio, limiting concentration risk");
  if (strengths.length === 0) strengths.push("Portfolio shows intentional position sizing across selected holdings");

  if (techWeight > 50) weaknesses.push(`Technology overweight at ~${Math.round(techWeight)}% — correlated drawdown risk in rising rate environments`);
  if (topConcentration > 25) weaknesses.push(`Largest position at ${Math.round(topConcentration)}% of portfolio is above the recommended 20% cap`);
  if (numHoldings < 6) weaknesses.push("Concentrated portfolio with fewer than 6 positions — consider adding diversifying names");
  if (!sectorAllocation.some((s) => s.sector === "Energy" || s.sector === "Industrial")) weaknesses.push("No inflation-hedge exposure via Energy or Industrial sectors");
  if (!sectorAllocation.some((s) => s.sector === "Healthcare" || s.sector === "Consumer Defensive")) weaknesses.push("Limited defensive sector exposure may increase portfolio beta in downturns");
  if (weaknesses.length === 0) weaknesses.push("Portfolio construction appears thoughtful with no major structural weaknesses identified");

  recommendations.push("Consider adding 5-10% allocation to a broad bond ETF (e.g., BND) to reduce overall portfolio beta");
  if (techWeight > 45) recommendations.push("Trim technology weighting to below 40% by rotating into Healthcare (XLV) or Industrials (XLI)");
  if (numHoldings < 8) recommendations.push("Add 2-3 dividend-paying blue-chip names to improve income and reduce volatility");
  if (!sectorAllocation.some((s) => s.sector === "Financial")) recommendations.push("Consider adding financial sector exposure (JPM, V, or XLF ETF) for economic cycle participation");
  recommendations.push("Review allocations quarterly and rebalance when any position drifts more than 5% from target");

  return { diversificationScore, riskLevel, riskScore, sectorAllocation, strengths, weaknesses, recommendations };
}

// ─── Extended Research Data ───────────────────────────────────────────────────

export interface QuarterlyRevenue {
  quarter: string;
  actual: number | null;
  estimate: number;
}

export interface QuarterlyEPS {
  quarter: string;
  actual: number | null;
  estimate: number;
}

export interface AnalystRating {
  buy: number;
  hold: number;
  sell: number;
  priceTarget: number;
  ptHigh: number;
  ptLow: number;
}

export interface IncomeRow {
  label: string;
  fy2022: string;
  fy2023: string;
  fy2024: string;
  trend: "up" | "down" | "flat";
}

export interface StockExtras {
  openPrice: number;
  dayHigh: number;
  dayLow: number;
  avgVolume: string;
  todayVolume: string;
  exchange: string;
  quarterlyRevenue: QuarterlyRevenue[];
  quarterlyEPS: QuarterlyEPS[];
  analystRating: AnalystRating;
  incomeStatement: IncomeRow[];
  technicalRating: "Strong Buy" | "Buy" | "Neutral" | "Sell" | "Strong Sell";
  technicalBuy: number;
  technicalNeutral: number;
  technicalSell: number;
}

export const stockExtras: Record<string, StockExtras> = {
  AAPL: {
    openPrice: 188.02,
    dayHigh: 191.45,
    dayLow: 187.63,
    avgVolume: "55.2M",
    todayVolume: "48.7M",
    exchange: "NASDAQ",
    quarterlyRevenue: [
      { quarter: "Q1 '24", actual: 119.6, estimate: 117.9 },
      { quarter: "Q2 '24", actual: 90.8,  estimate: 90.0  },
      { quarter: "Q3 '24", actual: 85.8,  estimate: 84.5  },
      { quarter: "Q4 '24", actual: 94.9,  estimate: 94.0  },
      { quarter: "Q1 '25", actual: 124.3, estimate: 122.6 },
      { quarter: "Q2 '25", actual: null,  estimate: 95.4  },
    ],
    quarterlyEPS: [
      { quarter: "Q1 '24", actual: 2.18,  estimate: 2.11 },
      { quarter: "Q2 '24", actual: 1.53,  estimate: 1.50 },
      { quarter: "Q3 '24", actual: 1.40,  estimate: 1.35 },
      { quarter: "Q4 '24", actual: 1.64,  estimate: 1.60 },
      { quarter: "Q1 '25", actual: 2.40,  estimate: 2.35 },
      { quarter: "Q2 '25", actual: null,  estimate: 1.57 },
    ],
    analystRating: { buy: 28, hold: 14, sell: 4,  priceTarget: 215.00, ptHigh: 250.00, ptLow: 175.00 },
    incomeStatement: [
      { label: "Revenue",          fy2022: "$394.3B", fy2023: "$383.3B", fy2024: "$391.0B", trend: "flat" },
      { label: "Gross Profit",     fy2022: "$170.8B", fy2023: "$169.1B", fy2024: "$180.7B", trend: "up"   },
      { label: "Operating Income", fy2022: "$119.4B", fy2023: "$114.3B", fy2024: "$123.2B", trend: "up"   },
      { label: "Net Income",       fy2022: "$99.8B",  fy2023: "$97.0B",  fy2024: "$93.7B",  trend: "down" },
      { label: "EPS (Diluted)",    fy2022: "$6.11",   fy2023: "$6.13",   fy2024: "$6.35",   trend: "up"   },
      { label: "Gross Margin",     fy2022: "43.3%",   fy2023: "44.1%",   fy2024: "46.2%",   trend: "up"   },
    ],
    technicalRating: "Buy",
    technicalBuy: 14,
    technicalNeutral: 8,
    technicalSell: 4,
  },

  MSFT: {
    openPrice: 417.90,
    dayHigh: 421.30,
    dayLow: 413.55,
    avgVolume: "22.1M",
    todayVolume: "19.4M",
    exchange: "NASDAQ",
    quarterlyRevenue: [
      { quarter: "Q3 '24", actual: 61.9,  estimate: 60.8  },
      { quarter: "Q4 '24", actual: 64.7,  estimate: 64.4  },
      { quarter: "Q1 '25", actual: 65.6,  estimate: 64.5  },
      { quarter: "Q2 '25", actual: 69.6,  estimate: 68.6  },
      { quarter: "Q3 '25", actual: 70.1,  estimate: 68.4  },
      { quarter: "Q4 '25", actual: null,  estimate: 73.1  },
    ],
    quarterlyEPS: [
      { quarter: "Q3 '24", actual: 2.94,  estimate: 2.83 },
      { quarter: "Q4 '24", actual: 3.17,  estimate: 3.10 },
      { quarter: "Q1 '25", actual: 3.30,  estimate: 3.10 },
      { quarter: "Q2 '25", actual: 3.23,  estimate: 3.14 },
      { quarter: "Q3 '25", actual: 3.46,  estimate: 3.22 },
      { quarter: "Q4 '25", actual: null,  estimate: 3.62 },
    ],
    analystRating: { buy: 42, hold: 8, sell: 1,  priceTarget: 485.00, ptHigh: 550.00, ptLow: 390.00 },
    incomeStatement: [
      { label: "Revenue",          fy2022: "$198.3B", fy2023: "$211.9B", fy2024: "$245.1B", trend: "up"  },
      { label: "Gross Profit",     fy2022: "$135.6B", fy2023: "$146.1B", fy2024: "$171.8B", trend: "up"  },
      { label: "Operating Income", fy2022: "$83.4B",  fy2023: "$88.5B",  fy2024: "$109.4B", trend: "up"  },
      { label: "Net Income",       fy2022: "$72.7B",  fy2023: "$72.4B",  fy2024: "$88.1B",  trend: "up"  },
      { label: "EPS (Diluted)",    fy2022: "$9.70",   fy2023: "$9.72",   fy2024: "$11.80",  trend: "up"  },
      { label: "Gross Margin",     fy2022: "68.4%",   fy2023: "68.9%",   fy2024: "70.1%",   trend: "up"  },
    ],
    technicalRating: "Strong Buy",
    technicalBuy: 18,
    technicalNeutral: 6,
    technicalSell: 2,
  },

  NVDA: {
    openPrice: 853.20,
    dayHigh: 889.40,
    dayLow: 848.10,
    avgVolume: "41.3M",
    todayVolume: "45.1M",
    exchange: "NASDAQ",
    quarterlyRevenue: [
      { quarter: "Q1 '24", actual: 26.0,  estimate: 24.5  },
      { quarter: "Q2 '24", actual: 30.0,  estimate: 28.6  },
      { quarter: "Q3 '24", actual: 35.1,  estimate: 32.9  },
      { quarter: "Q4 '24", actual: 39.3,  estimate: 37.2  },
      { quarter: "Q1 '25", actual: 44.1,  estimate: 43.0  },
      { quarter: "Q2 '25", actual: null,  estimate: 45.0  },
    ],
    quarterlyEPS: [
      { quarter: "Q1 '24", actual: 5.98,  estimate: 5.59 },
      { quarter: "Q2 '24", actual: 6.99,  estimate: 6.42 },
      { quarter: "Q3 '24", actual: 8.11,  estimate: 7.45 },
      { quarter: "Q4 '24", actual: 8.85,  estimate: 8.45 },
      { quarter: "Q1 '25", actual: 9.71,  estimate: 9.58 },
      { quarter: "Q2 '25", actual: null,  estimate: 10.80 },
    ],
    analystRating: { buy: 48, hold: 6, sell: 2,  priceTarget: 1000.00, ptHigh: 1200.00, ptLow: 700.00 },
    incomeStatement: [
      { label: "Revenue",          fy2022: "$26.9B",  fy2023: "$44.9B",  fy2024: "$96.3B",  trend: "up"  },
      { label: "Gross Profit",     fy2022: "$15.4B",  fy2023: "$30.4B",  fy2024: "$75.5B",  trend: "up"  },
      { label: "Operating Income", fy2022: "$10.0B",  fy2023: "$22.1B",  fy2024: "$57.8B",  trend: "up"  },
      { label: "Net Income",       fy2022: "$9.8B",   fy2023: "$18.8B",  fy2024: "$55.6B",  trend: "up"  },
      { label: "EPS (Diluted)",    fy2022: "$0.40",   fy2023: "$0.77",   fy2024: "$2.26",   trend: "up"  },
      { label: "Gross Margin",     fy2022: "57.3%",   fy2023: "67.7%",   fy2024: "78.4%",   trend: "up"  },
    ],
    technicalRating: "Strong Buy",
    technicalBuy: 20,
    technicalNeutral: 4,
    technicalSell: 2,
  },

  TSLA: {
    openPrice: 254.10,
    dayHigh: 258.90,
    dayLow: 245.30,
    avgVolume: "98.4M",
    todayVolume: "112.3M",
    exchange: "NASDAQ",
    quarterlyRevenue: [
      { quarter: "Q1 '24", actual: 21.3,  estimate: 22.3  },
      { quarter: "Q2 '24", actual: 25.2,  estimate: 24.8  },
      { quarter: "Q3 '24", actual: 25.2,  estimate: 25.5  },
      { quarter: "Q4 '24", actual: 25.7,  estimate: 27.2  },
      { quarter: "Q1 '25", actual: 19.3,  estimate: 21.3  },
      { quarter: "Q2 '25", actual: null,  estimate: 23.1  },
    ],
    quarterlyEPS: [
      { quarter: "Q1 '24", actual: 0.45,  estimate: 0.52 },
      { quarter: "Q2 '24", actual: 0.52,  estimate: 0.50 },
      { quarter: "Q3 '24", actual: 0.72,  estimate: 0.57 },
      { quarter: "Q4 '24", actual: 0.73,  estimate: 0.77 },
      { quarter: "Q1 '25", actual: 0.27,  estimate: 0.42 },
      { quarter: "Q2 '25", actual: null,  estimate: 0.40 },
    ],
    analystRating: { buy: 18, hold: 20, sell: 15, priceTarget: 275.00, ptHigh: 450.00, ptLow: 120.00 },
    incomeStatement: [
      { label: "Revenue",          fy2022: "$81.5B",  fy2023: "$96.8B",  fy2024: "$97.7B",  trend: "flat" },
      { label: "Gross Profit",     fy2022: "$20.9B",  fy2023: "$17.7B",  fy2024: "$17.5B",  trend: "down" },
      { label: "Operating Income", fy2022: "$13.7B",  fy2023: "$8.9B",   fy2024: "$7.1B",   trend: "down" },
      { label: "Net Income",       fy2022: "$12.6B",  fy2023: "$15.0B",  fy2024: "$7.1B",   trend: "down" },
      { label: "EPS (Diluted)",    fy2022: "$3.62",   fy2023: "$4.30",   fy2024: "$2.04",   trend: "down" },
      { label: "Gross Margin",     fy2022: "25.6%",   fy2023: "18.2%",   fy2024: "17.9%",   trend: "down" },
    ],
    technicalRating: "Neutral",
    technicalBuy: 8,
    technicalNeutral: 12,
    technicalSell: 6,
  },
};

// Deterministic price history generator
function lcg(n: number): number {
  return ((n * 1664525 + 1013904223) & 0x7fffffff) / 0x7fffffff;
}

export interface PricePoint {
  date: string;
  price: number;
  volume: number;
}

export function generatePriceHistory(
  ticker: string,
  currentPrice: number,
  beta: number
): PricePoint[] {
  const anchors: Record<string, number[]> = {
    AAPL: [164, 168, 172, 178, 186, 193, 197, 199, 192, 185, 184, 187, 189],
    MSFT: [363, 374, 389, 405, 420, 438, 452, 468, 450, 432, 420, 416, 416],
    NVDA: [462, 510, 580, 650, 730, 820, 920, 1010, 1065, 990, 920, 870, 875],
    TSLA: [248, 210, 172, 152, 182, 228, 268, 320, 380, 414, 355, 290, 249],
  };

  const pts = anchors[ticker] ?? [currentPrice * 0.88, currentPrice];
  const totalDays = 252;
  const result: PricePoint[] = [];
  const seed = ticker.charCodeAt(0) * 997 + (ticker.charCodeAt(1) ?? 1) * 31;

  for (let i = 0; i < totalDays; i++) {
    const segF = (i / totalDays) * (pts.length - 1);
    const segIdx = Math.floor(segF);
    const t = segF - segIdx;
    const base = pts[segIdx] + (pts[Math.min(segIdx + 1, pts.length - 1)] - pts[segIdx]) * t;
    const noise = (lcg(seed + i) - 0.5) * base * 0.022 * beta;
    const price = Math.max(base + noise, 10);

    const date = new Date();
    date.setDate(date.getDate() - (totalDays - i));
    const label = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

    result.push({
      date: label,
      price: Math.round(price * 100) / 100,
      volume: Math.round((lcg(seed + i + 5000) * 50 + 15) * 1_000_000),
    });
  }

  // Nudge last point to current price
  const last = result[result.length - 1];
  const ratio = currentPrice / last.price;
  result.forEach((p) => { p.price = Math.round(p.price * ratio * 100) / 100; });

  return result;
}
