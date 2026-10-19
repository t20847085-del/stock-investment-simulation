// -----------------------------
// Basic page switching
// -----------------------------
function showScreen(screenId) {
    const screens = document.querySelectorAll(".screen");

    screens.forEach(function (screen) {
        screen.classList.remove("active");
    });

    const targetScreen = document.getElementById(screenId);

    if (targetScreen) {
        targetScreen.classList.add("active");
    }

    updateQuickHelpButtons(screenId);
}

// -----------------------------
// Game state
// -----------------------------

// -----------------------------
// Hidden Market State Model
// -----------------------------
const MARKET_STATES = ["bull", "bear", "calm", "volatile"];

const MARKET_TRANSITION_MATRIX = {
    bull: [0.65, 0.05, 0.20, 0.10],
    bear: [0.10, 0.60, 0.10, 0.20],
    calm: [0.20, 0.10, 0.60, 0.10],
    volatile: [0.15, 0.25, 0.20, 0.40]
};

const INITIAL_MARKET_PROBABILITIES = [
    0.25, 0.25, 0.25, 0.25
];


// -----------------------------
// Market Announcements
// Signals only: no direct stock parameter effects
// -----------------------------
const MARKET_ANNOUNCEMENTS = [
    {
        id: "A01",
        category: "growth",
        title: "Corporate Investment Expansion",
        description: "Major companies announce increased investment in AI, digital infrastructure and production facilities."
    },
    {
        id: "A02",
        category: "growth",
        title: "Consumer Spending Growth",
        description: "Retail data shows improving household spending on restaurants, electronics and everyday products."
    },
    {
        id: "A03",
        category: "growth",
        title: "Corporate Earnings Outlook Upgrade",
        description: "Several listed companies raise their earnings forecasts following stronger operating performance."
    },
    {
        id: "A04",
        category: "growth",
        title: "Manufacturing Orders Recovery",
        description: "Manufacturing surveys indicate improving orders and more optimistic production plans."
    },
    {
        id: "A05",
        category: "risk",
        title: "Corporate Hiring Slowdown",
        description: "Several companies slow recruitment and reduce spending as future demand becomes uncertain."
    },
    {
        id: "A06",
        category: "risk",
        title: "Consumer Confidence Decline",
        description: "Consumer surveys show growing concerns about household income and future economic conditions."
    },
    {
        id: "A07",
        category: "risk",
        title: "Corporate Profit Pressure",
        description: "Some listed companies lower their earnings guidance due to rising costs and weaker demand."
    },
    {
        id: "A08",
        category: "risk",
        title: "Rising Credit Risk",
        description: "Financial regulators report increasing loan default risks and tighter lending standards."
    },
    {
        id: "A09",
        category: "stable",
        title: "Interest Rate Hold",
        description: "The central bank maintains its policy rate as inflation and growth remain broadly in line with expectations."
    },
    {
        id: "A10",
        category: "stable",
        title: "Earnings Meet Expectations",
        description: "Major companies report earnings broadly consistent with market forecasts."
    },
    {
        id: "A11",
        category: "stable",
        title: "Stable Employment Market",
        description: "Employment data shows limited changes in hiring activity and unemployment."
    },
    {
        id: "A12",
        category: "stable",
        title: "Moderate Economic Indicators",
        description: "Recent economic indicators suggest neither strong acceleration nor a sharp slowdown."
    },
    {
        id: "A13",
        category: "uncertainty",
        title: "Monetary Policy Uncertainty",
        description: "Analysts disagree on future interest rate decisions as financial market volatility increases."
    },
    {
        id: "A14",
        category: "uncertainty",
        title: "Trade Negotiation Uncertainty",
        description: "Major economies reconsider trade arrangements, creating uncertainty about tariffs and supply chains."
    },
    {
        id: "A15",
        category: "uncertainty",
        title: "Energy Price Instability",
        description: "Global energy prices fluctuate sharply, making future operating costs difficult to predict."
    },
    {
        id: "A16",
        category: "uncertainty",
        title: "Surge in Market Trading Activity",
        description: "Trading volumes increase significantly as investors disagree about future market direction."
    }
];

const ANNOUNCEMENT_CATEGORY_PROBABILITIES = {
    bull: {
        growth: 0.60,
        risk: 0.10,
        stable: 0.20,
        uncertainty: 0.10
    },
    bear: {
        growth: 0.10,
        risk: 0.60,
        stable: 0.10,
        uncertainty: 0.20
    },
    calm: {
        growth: 0.15,
        risk: 0.10,
        stable: 0.60,
        uncertainty: 0.15
    },
    volatile: {
        growth: 0.15,
        risk: 0.20,
        stable: 0.15,
        uncertainty: 0.50
    }
};

// Generate two unique announcements for the current month
function generateMarketAnnouncements() {
    const state = gameState.currentMarketState;
    const categoryWeights =
        ANNOUNCEMENT_CATEGORY_PROBABILITIES[state];

    if (!categoryWeights) {
        throw new Error("Invalid market state: " + state);
    }

    const available = [...MARKET_ANNOUNCEMENTS];
    const selected = [];

    for (let i = 0; i < 2; i++) {
        const weights = available.map(function (announcement) {
            const categoryCount = MARKET_ANNOUNCEMENTS.filter(
                item => item.category === announcement.category
            ).length;

            return categoryWeights[announcement.category] / categoryCount;
        });

        const totalWeight = weights.reduce(
            (sum, weight) => sum + weight, 0
        );

        let randomValue = Math.random() * totalWeight;
        let selectedIndex = available.length - 1;

        for (let j = 0; j < available.length; j++) {
            randomValue -= weights[j];

            if (randomValue < 0) {
                selectedIndex = j;
                break;
            }
        }

        selected.push(available.splice(selectedIndex, 1)[0]);
    }

    return selected;
}

function ensureMonthlyAnnouncements() {
    if (!Array.isArray(gameState.currentAnnouncements)) {
        gameState.currentAnnouncements = [];
    }

    if (gameState.currentAnnouncements.length === 0) {
        gameState.currentAnnouncements =
            generateMarketAnnouncements();
    }
}

function sampleMarketState(probabilities) {
    const randomValue = Math.random();
    let cumulativeProbability = 0;

    for (let i = 0; i < probabilities.length; i++) {
        cumulativeProbability += probabilities[i];

        if (randomValue < cumulativeProbability) {
            return MARKET_STATES[i];
        }
    }

    return MARKET_STATES[MARKET_STATES.length - 1];
}

function initializeMarketState() {
    const state = sampleMarketState(
        INITIAL_MARKET_PROBABILITIES
    );

    gameState.currentMarketState = state;
    gameState.marketStateHistory = [state];
}

function advanceMarketState() {
    const currentState = gameState.currentMarketState;
    const probabilities = MARKET_TRANSITION_MATRIX[currentState];

    if (!probabilities) {
        throw new Error("Invalid market state: " + currentState);
    }

    const nextState = sampleMarketState(probabilities);

    gameState.currentMarketState = nextState;
    gameState.marketStateHistory.push(nextState);
}

let gameState = {
    selectedCharacter: null,
    selectedSpecialistSector: null,
    initialCapital: 0,
    currentWealth: 0,
    month: 1,
    currentMarketState: null,
    marketStateHistory: [],
    currentAnnouncements: [],
    targetReturn: 0,
    mustProfitEveryMonth: false,
    maxDrawdownLimit: null,

    // Initial purchase data
    purchaseShares: {},
    remainingCash: 0,
    portfolioStarted: false,

    // Event data
    currentEvent: null,
    eventChoices: [],
    eventSelected: false,

    // Monthly simulation data
    simulationPaths: {},
    simulationPortfolioValues: [],
    simulationStockResults: {},
    simulationCompleted: false,
    gameOver: false,
    gameOverReason: "",

    monthlyHistory: [],
    initialStockPrices: {},
    finalStatus: null,
    finalReason: "",

    bankerLossMonths: 0,

    managerUsedMonths: {},
    totalManagerFees: 0,
    managerHistory: []
};

// -----------------------------
// Character data
// -----------------------------
const characters = {
    student: {
        name: "College Student",
        avatar: "🎓",
        capital: 5000,
        riskStyle: "High risk tolerance",
        targetReturn: 0.20,
        mustProfitEveryMonth: false,
        maxDrawdownLimit: null,

        description:
            "You are an ordinary college student who has just started learning about investing. " +
            "Your savings are limited, so your initial capital is small. However, because you are young, " +
            "short-term losses do not create serious pressure for you. You can accept risk and focus on long-term growth. " +
            "You have strong ambition and want to turn a small amount of money into meaningful profit within one year.",

        victoryCondition:
            "Final return must be at least 20% after one year.",

        failureCondition:
            "No early failure. Only the final result matters.",

        gameMeaning:
            "This role encourages aggressive decisions. You can take risks because monthly losses do not immediately end the game."
    },

    entrepreneur: {
        name: "Entrepreneur",
        avatar: "💼",
        capital: 40000,
        riskStyle: "Very high risk appetite",
        targetReturn: 0.40,
        mustProfitEveryMonth: false,
        maxDrawdownLimit: null,

        description:
            "You are an entrepreneur with available investment capital. You are used to uncertainty and are willing " +
            "to take large risks for higher returns. You do not simply want stable growth; you want your money to grow " +
            "aggressively within a short time. For you, ordinary returns are not enough because your goal is to strongly " +
            "outperform a normal investor.",

        victoryCondition:
            "Final return must be at least 40% after one year.",

        failureCondition:
            "No early failure, but the final target is difficult.",

        gameMeaning:
            "This role is suitable for high-risk strategies. To win, you may need to invest more in volatile assets or react strongly to positive events."
    },

    banker: {
        name: "Banker",
        avatar: "🏦",
        capital: 50000,
        riskStyle: "Stability focused",
        targetReturn: 0.25,
        mustProfitEveryMonth: true,
        maxDrawdownLimit: null,

        description:
            "You are a banker with strong financial knowledge and a large amount of capital. Your goal is not to become rich quickly, " +
            "but to manage money in a stable and professional way. You care about risk control and cannot accept repeated monthly losses. " +
            "For you, too many losing months mean your risk management has failed.",

        victoryCondition:
            "Final return must be at least 25% after one year.",

        failureCondition:
            "If you have more than 3 losing months, the game ends early.",

        gameMeaning:
            "This role forces stable investment decisions. You can survive small setbacks, but repeated losing months will end the game."
    },

    retiree: {
        name: "Retiree",
        avatar: "👴",
        capital: 30000,
        riskStyle: "Capital protection and diversification",
        targetReturn: 0.05,
        mustProfitEveryMonth: false,
        maxDrawdownLimit: null,
        maxSingleStockWeight: 0.30,
        protectedCashRatio: 0.50,

        description:
            "You are a retiree whose money mainly comes from savings and pension income. You cannot rely on a salary to recover " +
            "from large investment losses. Therefore, your main goal is to protect your capital and avoid over-concentrated investment. " +
            "You may invest, but you must keep the portfolio diversified and preserve a large cash reserve.",

        victoryCondition:
            "Final return must be at least 5% after one year.",

        failureCondition:
            "No early failure. However, no single stock can exceed 30% of total wealth, and at least 50% of initial capital must be kept as cash.",

        gameMeaning:
            "This role focuses on retirement safety. You cannot put too much money into one stock, and only part of your capital can be invested."
    },

    sector_specialist: {
        name: "Sector Specialist",
        avatar: "🧭",
        capital: 30000,
        riskStyle: "Focused industry expertise",
        targetReturn: 0.30,
        mustProfitEveryMonth: false,
        maxDrawdownLimit: null,
        needsSectorChoice: true,
        nonSpecialistSectorLimit: 0.30,

        description:
            "You are an investor with deep knowledge of one chosen industry. You prefer to invest within your area of expertise. " +
            "When your sector faces negative events, you may hold more cash, but you should not move too much capital into unfamiliar sectors.",

        victoryCondition:
            "Final return must be at least 30% after one year.",

        failureCondition:
            "No early failure. However, the total value invested in non-specialist sectors cannot exceed 30% of current total wealth.",

        gameMeaning:
            "This role highlights specialist knowledge and concentration risk. You can focus on your chosen sector, but you cannot invest too much money outside your expertise."
    }
};


const specialistSectorOptions = ["Technology", "Finance", "Energy", "Consumer"];

const sectorStockMap = {
    Technology: ["apple", "microsoft", "nvidia"],
    Finance: ["jpmorgan", "visa"],
    Energy: ["exxon", "chevron"],
    Consumer: ["walmart", "cocacola", "mcdonalds"]
};
// -----------------------------
// Stock base parameters
// Events will later modify these parameters
// -----------------------------
const stocks = {
    apple: {
        name: "Apple",
        ticker: "AAPL",
        sector: "Technology",
        price: 180,
        riskLevel: "Medium",
        gameRole: "Stable technology stock",
        logo: "assets/logos/apple.png",
        mu: 0.010,
        beta: 1.10,
        gamma: 0.85,
        sigma: 0.038,
        jumpProbability: 0.04,
        jumpMean: 0.015
    },

    microsoft: {
        name: "Microsoft",
        ticker: "MSFT",
        sector: "Technology",
        price: 410,
        riskLevel: "Medium",
        gameRole: "Mature growth stock",
        logo: "assets/logos/microsoft.png",
        mu: 0.011,
        beta: 1.05,
        gamma: 0.90,
        sigma: 0.036,
        jumpProbability: 0.04,
        jumpMean: 0.015
    },

    nvidia: {
        name: "NVIDIA",
        ticker: "NVDA",
        sector: "Technology",
        price: 120,
        riskLevel: "High",
        gameRole: "High-growth AI stock",
        logo: "assets/logos/nvidia.png",
        mu: 0.016,
        beta: 1.45,
        gamma: 1.20,
        sigma: 0.060,
        jumpProbability: 0.09,
        jumpMean: 0.035
    },

    jpmorgan: {
        name: "JPMorgan Chase",
        ticker: "JPM",
        sector: "Finance",
        price: 210,
        riskLevel: "Medium",
        gameRole: "Large banking stock",
        logo: "assets/logos/jpmorgan.png",
        mu: 0.008,
        beta: 1.00,
        gamma: 0.90,
        sigma: 0.040,
        jumpProbability: 0.04,
        jumpMean: 0.010
    },

    visa: {
        name: "Visa",
        ticker: "V",
        sector: "Finance",
        price: 280,
        riskLevel: "Medium",
        gameRole: "Payment network stock",
        logo: "assets/logos/visa.png",
        mu: 0.009,
        beta: 0.95,
        gamma: 0.80,
        sigma: 0.038,
        jumpProbability: 0.035,
        jumpMean: 0.010
    },

    exxon: {
        name: "Exxon Mobil",
        ticker: "XOM",
        sector: "Energy",
        price: 115,
        riskLevel: "Medium-High",
        gameRole: "Large energy stock",
        logo: "assets/logos/exxon.png",
        mu: 0.007,
        beta: 0.90,
        gamma: 1.10,
        sigma: 0.045,
        jumpProbability: 0.06,
        jumpMean: 0.020
    },

    chevron: {
        name: "Chevron",
        ticker: "CVX",
        sector: "Energy",
        price: 160,
        riskLevel: "Medium",
        gameRole: "Stable energy stock",
        logo: "assets/logos/chevron.png",
        mu: 0.007,
        beta: 0.85,
        gamma: 1.00,
        sigma: 0.040,
        jumpProbability: 0.05,
        jumpMean: 0.018
    },

    walmart: {
        name: "Walmart",
        ticker: "WMT",
        sector: "Consumer",
        price: 70,
        riskLevel: "Low",
        gameRole: "Defensive retail stock",
        logo: "assets/logos/walmart.png",
        mu: 0.005,
        beta: 0.60,
        gamma: 0.70,
        sigma: 0.025,
        jumpProbability: 0.025,
        jumpMean: 0.006
    },

    cocacola: {
        name: "Coca-Cola",
        ticker: "KO",
        sector: "Consumer",
        price: 65,
        riskLevel: "Low",
        gameRole: "Stable consumer stock",
        logo: "assets/logos/cocacola.png",
        mu: 0.0045,
        beta: 0.55,
        gamma: 0.65,
        sigma: 0.023,
        jumpProbability: 0.020,
        jumpMean: 0.005
    },

    mcdonalds: {
        name: "McDonald's",
        ticker: "MCD",
        sector: "Consumer",
        price: 290,
        riskLevel: "Low-Medium",
        gameRole: "Global consumer brand",
        logo: "assets/logos/mcdonalds.png",
        mu: 0.006,
        beta: 0.65,
        gamma: 0.75,
        sigma: 0.030,
        jumpProbability: 0.030,
        jumpMean: 0.008
    }
};

const stockDescriptions = {
    apple: {
        companyType: "Mature technology and consumer electronics company.",
        riskProfile: "Medium risk. Apple is more stable than high-growth technology stocks, but it can still move strongly during product or supply-chain events.",
        marketSensitivity: "Medium-high. Apple is affected by broad technology market sentiment and global market conditions.",
        sectorSensitivity: "Strongly affected by Technology sector events.",
        eventSensitivity: "Especially sensitive to Apple Product Launch, AI Breakthrough, Technology Upgrade Cycle, Rare Earth Supply Shortage, and Global Trade War.",
        suitableInvestor: "Suitable for balanced investors who want growth but do not want the highest volatility."
    },

    microsoft: {
        companyType: "Large software, cloud computing, and enterprise technology company.",
        riskProfile: "Medium risk. Microsoft is usually more stable than speculative technology stocks.",
        marketSensitivity: "Medium-high. It reacts to technology trends and broad market sentiment.",
        sectorSensitivity: "Strongly affected by Technology sector events.",
        eventSensitivity: "Especially sensitive to AI Breakthrough, Technology Upgrade Cycle, and Economic Recovery.",
        suitableInvestor: "Suitable for investors who want technology exposure with relatively stable growth."
    },

    nvidia: {
        companyType: "High-growth semiconductor and AI-related technology stock.",
        riskProfile: "High risk. NVIDIA has strong upside potential but also larger price swings.",
        marketSensitivity: "High. It is strongly affected by market sentiment, growth expectations, and technology demand.",
        sectorSensitivity: "Very strongly affected by Technology sector events.",
        eventSensitivity: "Especially sensitive to AI Breakthrough, Technology Upgrade Cycle, Rare Earth Supply Shortage, and Global Trade War.",
        suitableInvestor: "Suitable for aggressive investors such as Entrepreneur or College Student."
    },

    jpmorgan: {
        companyType: "Large banking and financial services company.",
        riskProfile: "Medium risk. JPMorgan can be stable in normal markets, but it can be hit hard by financial-sector stress.",
        marketSensitivity: "High. Banks are strongly affected by economic conditions and investor confidence.",
        sectorSensitivity: "Strongly affected by Finance sector events.",
        eventSensitivity: "Especially sensitive to Banking Scandal, Real Estate Market Crash, High Inflation, and Economic Recovery.",
        suitableInvestor: "Suitable for investors who understand financial-sector risk."
    },

    visa: {
        companyType: "Global payment network company.",
        riskProfile: "Medium risk. Visa is usually more stable than banks but still depends on spending and economic activity.",
        marketSensitivity: "Medium. Visa reacts to economic growth, consumer spending, and market sentiment.",
        sectorSensitivity: "Affected by Finance sector events, but usually less directly than banks.",
        eventSensitivity: "Especially sensitive to Economic Recovery, Strong Consumer Spending, and Banking Scandal.",
        suitableInvestor: "Suitable for investors who want finance exposure with less direct banking risk."
    },

    exxon: {
        companyType: "Large traditional energy and oil company.",
        riskProfile: "Medium-high risk. Exxon can benefit from oil price increases but may be volatile during energy shocks.",
        marketSensitivity: "Medium. It is affected by both broad market conditions and commodity prices.",
        sectorSensitivity: "Strongly affected by Energy sector events.",
        eventSensitivity: "Especially sensitive to Oil Price Surge, Clean Energy Breakthrough, High Inflation, and Rare Earth Supply Shortage.",
        suitableInvestor: "Suitable for investors who want exposure to energy-sector opportunities."
    },

    chevron: {
        companyType: "Large traditional energy company with relatively stable operations.",
        riskProfile: "Medium risk. Chevron is usually slightly more stable than highly volatile energy stocks.",
        marketSensitivity: "Medium. It is affected by oil prices and overall market sentiment.",
        sectorSensitivity: "Strongly affected by Energy sector events.",
        eventSensitivity: "Especially sensitive to Oil Price Surge, Clean Energy Breakthrough, and High Inflation.",
        suitableInvestor: "Suitable for investors who want energy exposure with moderate risk."
    },

    walmart: {
        companyType: "Defensive retail and consumer goods company.",
        riskProfile: "Low risk. Walmart is relatively stable because consumers still buy essential goods in weak markets.",
        marketSensitivity: "Low-medium. It is less sensitive to broad market shocks than high-growth stocks.",
        sectorSensitivity: "Affected by Consumer sector events.",
        eventSensitivity: "Especially sensitive to Strong Consumer Spending, High Inflation, and Global Trade War.",
        suitableInvestor: "Suitable for conservative investors such as Retiree or Banker."
    },

    cocacola: {
        companyType: "Stable global consumer beverage company.",
        riskProfile: "Low risk. Coca-Cola is one of the more defensive stocks in the game.",
        marketSensitivity: "Low. It usually moves less dramatically than technology or energy stocks.",
        sectorSensitivity: "Affected by Consumer sector events, but usually with limited volatility.",
        eventSensitivity: "Especially sensitive to Strong Consumer Spending and High Inflation.",
        suitableInvestor: "Suitable for conservative investors who prefer stability."
    },

    mcdonalds: {
        companyType: "Global consumer restaurant brand.",
        riskProfile: "Low-medium risk. McDonald's is generally stable but can still react to consumer spending and cost pressure.",
        marketSensitivity: "Low-medium. It is less volatile than growth stocks but still affected by economic conditions.",
        sectorSensitivity: "Affected by Consumer sector events.",
        eventSensitivity: "Especially sensitive to Strong Consumer Spending, High Inflation, Oil Price Surge, and Economic Recovery.",
        suitableInvestor: "Suitable for balanced or conservative investors."
    }
};
// -----------------------------
// Event data
// Important design:
// Events change parameters, not stock prices directly.
// These values will be used later in the monthly simulation.
// -----------------------------
const events = [
    {
        id: "ai_breakthrough",
        name: "AI Breakthrough",
        type: "positive",
        description:
            "A major breakthrough in artificial intelligence increases investor confidence in technology companies.",
        playerImpact:
            "Technology stocks may benefit strongly, especially NVIDIA. However, speculation also increases volatility in the technology sector.",
        effects: {
            market: { factorChange: 0.010 },
            sectors: {
                Technology: {
                    sectorFactorChange: 0.050,
                    muChange: 0.020,
                    sigmaMultiplier: 1.05,
                    jumpProbabilityChange: 0.05,
                    jumpMeanChange: 0.050
                }
            },
            stocks: {
                nvidia: {
                    muChange: 0.020,
                    jumpProbabilityChange: 0.05,
                    jumpMeanChange: 0.050
                },
                microsoft: {
                    muChange: 0.010,
                    jumpMeanChange: 0.020
                }
            }
        }
    },

    {
        id: "apple_product_launch",
        name: "Apple Product Launch",
        type: "positive",
        description:
            "Apple launches a major new product that attracts strong market attention.",
        playerImpact:
            "Apple may receive a short-term boost. The technology sector may also become more active, but Apple-related uncertainty increases volatility.",
        effects: {
            sectors: {
                Technology: {
                    sectorFactorChange: 0.015,
                    muChange: 0.006,
                    sigmaMultiplier: 1.03
                }
            },
            stocks: {
                apple: {
                    muChange: 0.040,
                    sigmaMultiplier: 1.05,
                    jumpProbabilityChange: 0.08,
                    jumpMeanChange: 0.070
                }
            }
        }
    },

    {
        id: "rare_earth_shortage",
        name: "Rare Earth Supply Shortage",
        type: "negative",
        description:
            "A shortage of rare earth materials disrupts global supply chains and creates pressure on hardware production.",
        playerImpact:
            "Technology hardware companies may face production pressure. Apple and NVIDIA may be affected more strongly. Energy stocks may become more volatile.",
        effects: {
            market: { factorChange: -0.006 },
            sectors: {
                Technology: {
                    sectorFactorChange: -0.020,
                    muChange: -0.010,
                    sigmaMultiplier: 1.35
                },
                Energy: {
                    sectorFactorChange: 0.012,
                    sigmaMultiplier: 1.25,
                    jumpProbabilityChange: 0.03
                }
            },
            stocks: {
                apple: { muChange: -0.006 },
                nvidia: { muChange: -0.008 }
            }
        }
    },

    {
        id: "banking_scandal",
        name: "Banking Scandal",
        type: "negative",
        description:
            "A major banking scandal damages investor confidence in financial institutions.",
        playerImpact:
            "Financial stocks may suffer. JPMorgan Chase is likely to be hit hardest, while Visa may also face pressure but less directly.",
        effects: {
            market: { factorChange: -0.008 },
            sectors: {
                Finance: {
                    sectorFactorChange: -0.030,
                    muChange: -0.018,
                    sigmaMultiplier: 1.50,
                    jumpProbabilityChange: 0.07,
                    jumpMeanChange: -0.050
                }
            },
            stocks: {
                jpmorgan: {
                    muChange: -0.012,
                    jumpMeanChange: -0.030
                },
                visa: {
                    muChange: -0.006
                }
            }
        }
    },

    {
        id: "oil_price_surge",
        name: "Oil Price Surge",
        type: "mixed",
        description:
            "Oil prices rise sharply due to supply pressure and stronger global demand.",
        playerImpact:
            "Energy companies such as Exxon Mobil and Chevron may benefit. Consumer companies may face higher operating costs.",
        effects: {
            market: { factorChange: -0.002 },
            sectors: {
                Energy: {
                    sectorFactorChange: 0.055,
                    muChange: 0.030,
                    sigmaMultiplier: 1.08,
                    jumpProbabilityChange: 0.05,
                    jumpMeanChange: 0.055
                },
                Consumer: {
                    sectorFactorChange: -0.008,
                    muChange: -0.004,
                    sigmaMultiplier: 1.08
                }
            },
            stocks: {
                exxon: {
                    muChange: 0.008,
                    jumpMeanChange: 0.015
                },
                chevron: {
                    muChange: 0.007,
                    jumpMeanChange: 0.012
                }
            }
        }
    },

    {
        id: "clean_energy_breakthrough",
        name: "Clean Energy Breakthrough",
        type: "mixed",
        description:
            "A major clean energy technology becomes commercially successful.",
        playerImpact:
            "Traditional energy stocks may face pressure. Technology and consumer stocks may benefit from optimism and lower future energy costs.",
        effects: {
            sectors: {
                Energy: {
                    sectorFactorChange: -0.030,
                    muChange: -0.016,
                    sigmaMultiplier: 1.40,
                    jumpProbabilityChange: 0.06,
                    jumpMeanChange: -0.040
                },
                Technology: {
                    sectorFactorChange: 0.010,
                    muChange: 0.005
                },
                Consumer: {
                    sectorFactorChange: 0.008,
                    muChange: 0.004
                }
            }
        }
    },

    {
        id: "high_inflation",
        name: "High Inflation",
        type: "negative",
        description:
            "Inflation rises faster than expected, increasing concerns about costs, consumption, and tighter monetary policy.",
        playerImpact:
            "Most stocks may face pressure. Technology and consumer stocks may be hurt, while energy stocks may receive a small benefit.",
        effects: {
            market: { factorChange: -0.010 },
            allStocks: {
                sigmaMultiplier: 1.18
            },
            sectors: {
                Technology: {
                    muChange: -0.008,
                    betaMultiplier: 1.06
                },
                Consumer: {
                    muChange: -0.006,
                    sigmaMultiplier: 1.12
                },
                Finance: {
                    sigmaMultiplier: 1.12
                },
                Energy: {
                    sectorFactorChange: 0.008,
                    muChange: 0.004
                }
            }
        }
    },

    {
        id: "global_trade_war",
        name: "Global Trade War",
        type: "negative",
        description:
            "A global trade war increases tariffs and disrupts international supply chains.",
        playerImpact:
            "Technology and consumer companies may be negatively affected because they rely on global production, logistics, and international sales.",
        effects: {
            market: { factorChange: -0.012 },
            allStocks: {
                sigmaMultiplier: 1.20,
                jumpProbabilityChange: 0.025
            },
            sectors: {
                Technology: {
                    sectorFactorChange: -0.014,
                    muChange: -0.010
                },
                Consumer: {
                    sectorFactorChange: -0.012,
                    muChange: -0.008
                }
            },
            stocks: {
                apple: { muChange: -0.004 },
                walmart: { muChange: -0.004 }
            }
        }
    },

    {
        id: "economic_recovery",
        name: "Economic Recovery",
        type: "positive",
        description:
            "Economic activity improves and consumer confidence rises.",
        playerImpact:
            "Most sectors may benefit. Finance and consumer stocks may receive stronger support from better economic activity.",
        effects: {
            market: { factorChange: 0.018 },
            allStocks: {
                muChange: 0.006,
                sigmaMultiplier: 0.90
            },
            sectors: {
                Finance: {
                    sectorFactorChange: 0.020,
                    muChange: 0.010
                },
                Consumer: {
                    sectorFactorChange: 0.020,
                    muChange: 0.010
                },
                Technology: {
                    sectorFactorChange: 0.012
                },
                Energy: {
                    sectorFactorChange: 0.010
                }
            }
        }
    },

    {
        id: "real_estate_crash",
        name: "Real Estate Market Crash",
        type: "negative",
        description:
            "A sharp decline in the real estate market creates financial stress and weakens investor confidence.",
        playerImpact:
            "Finance stocks may suffer heavily, especially banks. Consumer stocks may also face pressure as confidence weakens.",
        effects: {
            market: { factorChange: -0.014 },
            allStocks: {
                betaMultiplier: 1.05
            },
            sectors: {
                Finance: {
                    sectorFactorChange: -0.025,
                    muChange: -0.014,
                    sigmaMultiplier: 1.35,
                    jumpProbabilityChange: 0.05,
                    jumpMeanChange: -0.040
                },
                Consumer: {
                    sectorFactorChange: -0.012,
                    muChange: -0.007,
                    sigmaMultiplier: 1.18
                }
            }
        }
    },
    {
        id: "strong_consumer_spending",
        name: "Strong Consumer Spending",
        type: "positive",
        description:
            "Consumer spending rises strongly as households become more confident about the economy.",
        playerImpact:
            "Consumer stocks may benefit, especially Walmart, Coca-Cola, and McDonald's. Finance stocks may also receive mild support.",
        effects: {
            market: { factorChange: 0.010 },
            sectors: {
                Consumer: {
                    sectorFactorChange: 0.045,
                    muChange: 0.022,
                    sigmaMultiplier: 0.90,
                    jumpProbabilityChange: 0.020,
                    jumpMeanChange: 0.030
                },
                Finance: {
                    sectorFactorChange: 0.012,
                    muChange: 0.006
                }
            },
            stocks: {
                walmart: {
                    muChange: 0.008,
                    jumpMeanChange: 0.012
                },
                cocacola: {
                    muChange: 0.006,
                    jumpMeanChange: 0.010
                },
                mcdonalds: {
                    muChange: 0.008,
                    jumpMeanChange: 0.012
                }
            }
        }
    },

    {
        id: "technology_upgrade_cycle",
        name: "Technology Upgrade Cycle",
        type: "positive",
        description:
            "Businesses increase technology spending and upgrade software, chips, and digital infrastructure.",
        playerImpact:
            "Technology stocks may benefit broadly. Microsoft and NVIDIA may receive stronger support from business demand.",
        effects: {
            market: { factorChange: 0.012 },
            sectors: {
                Technology: {
                    sectorFactorChange: 0.040,
                    muChange: 0.018,
                    sigmaMultiplier: 1.03,
                    jumpProbabilityChange: 0.030,
                    jumpMeanChange: 0.040
                }
            },
            stocks: {
                microsoft: {
                    muChange: 0.014,
                    jumpMeanChange: 0.025
                },
                nvidia: {
                    muChange: 0.016,
                    jumpProbabilityChange: 0.030,
                    jumpMeanChange: 0.040
                }
            }
        }
    },

    {
        id: "large_scale_labor_strike",
        name: "Large-Scale Labor Strike",
        type: "negative",
        description:
            "A large-scale labor strike disrupts transportation, retail operations, restaurants, and some energy production activities.",
        playerImpact:
            "Labor-intensive industries may face pressure. Consumer businesses and some energy companies may suffer from higher operating costs and supply disruption.",
        effects: {
            market: { factorChange: -0.008 },
            allStocks: {
                sigmaMultiplier: 1.12
            },
            sectors: {
                Consumer: {
                    sectorFactorChange: -0.018,
                    muChange: -0.010,
                    sigmaMultiplier: 1.18
                },
                Energy: {
                    sectorFactorChange: -0.010,
                    muChange: -0.006,
                    sigmaMultiplier: 1.15
                },
                Finance: {
                    muChange: -0.004,
                    sigmaMultiplier: 1.08
                }
            },
            stocks: {
                walmart: { muChange: -0.006 },
                mcdonalds: { muChange: -0.008 },
                cocacola: { muChange: -0.004 },
                exxon: { muChange: -0.004 },
                chevron: { muChange: -0.004 }
            }
        }
    },

    {
        id: "major_cyberattack",
        name: "Major Cyberattack",
        type: "negative",
        description:
            "A major cyberattack disrupts digital services, payment systems, and financial platforms, causing market-wide concern.",
        playerImpact:
            "Technology and financial sectors may face stronger pressure. Payment networks, banks, and software platforms may become more volatile.",
        effects: {
            market: { factorChange: -0.012 },
            allStocks: {
                sigmaMultiplier: 1.18,
                jumpProbabilityChange: 0.025
            },
            sectors: {
                Technology: {
                    sectorFactorChange: -0.016,
                    muChange: -0.010,
                    sigmaMultiplier: 1.25,
                    jumpProbabilityChange: 0.030,
                    jumpMeanChange: -0.030
                },
                Finance: {
                    sectorFactorChange: -0.020,
                    muChange: -0.012,
                    sigmaMultiplier: 1.30,
                    jumpProbabilityChange: 0.040,
                    jumpMeanChange: -0.040
                }
            },
            stocks: {
                visa: {
                    muChange: -0.010,
                    jumpMeanChange: -0.025
                },
                jpmorgan: {
                    muChange: -0.008,
                    jumpMeanChange: -0.020
                },
                microsoft: {
                    muChange: -0.006
                },
                apple: {
                    muChange: -0.004
                }
            }
        }
    },

    {
        id: "banking_sector_recovery",
        name: "Banking Sector Recovery",
        type: "positive",
        description: "Major banks report stronger earnings, improving loan quality and renewed lending growth.",
        playerImpact: "Financial companies may benefit from stronger profitability and lower credit risk.",
        effects: {
            market: { factorChange: 0.005 },
            sectors: { Finance: { sectorFactorChange: 0.040, muChange: 0.020, sigmaMultiplier: 0.92, jumpProbabilityChange: 0.020, jumpMeanChange: 0.025 } },
            stocks: {}
        }
    },
    {
        id: "global_trade_agreement",
        name: "Global Trade Agreement",
        type: "positive",
        description: "Major economies reduce selected tariffs and improve international supply-chain expectations.",
        playerImpact: "Technology and consumer companies may benefit from lower trade costs.",
        effects: {
            market: { factorChange: 0.008 },
            sectors: {
                Technology: { sectorFactorChange: 0.025, muChange: 0.012, sigmaMultiplier: 0.95 },
                Consumer: { sectorFactorChange: 0.020, muChange: 0.010, sigmaMultiplier: 0.95 }
            },
            stocks: {}
        }
    },
    {
        id: "calm_market",
        name: "No Major Event",
        type: "neutral",
        description:
            "No major company-specific or economic shock occurs this month. Stock prices are still affected by the hidden market environment and normal market fluctuations.",
        playerImpact:
            "Stock prices are mainly driven by normal expected return, market factor, sector factor, and random noise.",
        effects: {
            market: { factorChange: 0 },
            sectors: {},
            stocks: {}
        }
    }
];

// -----------------------------
// Navigation functions
// -----------------------------
let helpReturnScreenId = "start-screen";


function getActiveScreenId() {
    const activeScreen = document.querySelector(".screen.active");

    if (activeScreen) {
        return activeScreen.id;
    }

    return "start-screen";
}


function updateQuickHelpButtons(screenId) {
    const quickButtons = document.getElementById("quick-help-buttons");

    if (!quickButtons) {
        return;
    }

    if (screenId === "library-screen" || screenId === "how-to-play-screen") {
        quickButtons.style.display = "none";
    } else {
        quickButtons.style.display = "flex";
    }
}


function saveHelpReturnScreen() {
    const currentScreenId = getActiveScreenId();

    if (currentScreenId !== "library-screen" && currentScreenId !== "how-to-play-screen") {
        helpReturnScreenId = currentScreenId;
    }
}


function openLibraryFromGame() {
    saveHelpReturnScreen();

    if (typeof renderLibraryPage === "function") {
        renderLibraryPage();
    }

    showScreen("library-screen");
}


function openHowToPlayFromGame() {
    saveHelpReturnScreen();
    showScreen("how-to-play-screen");
}


function returnFromHelp() {
    if (!helpReturnScreenId) {
        showScreen("start-screen");
        return;
    }

    showScreen(helpReturnScreenId);
}

function startGame() {
    showScreen("character-screen");
}

function openLibrary() {
    openLibraryFromGame();
}


function openHowToPlay() {
    openHowToPlayFromGame();
}

function goBackToStart() {
    showScreen("start-screen");
}

function goBackToCharacterSelection() {
    showScreen("character-screen");
}

function exitGame() {
    const confirmExit = confirm("Are you sure you want to exit the game?");

    if (confirmExit) {
        window.open("", "_self");
        window.close();

        setTimeout(function () {
            alert("If the page did not close, your browser blocked automatic closing. Please close the tab manually.");
        }, 300);
    }
}

// -----------------------------
// Character selection
// -----------------------------
function selectCharacter(characterKey) {
    const character = characters[characterKey];

    gameState.selectedCharacter = characterKey;
    gameState.selectedSpecialistSector = null;

    gameState.initialCapital = character.capital;
    gameState.currentWealth = character.capital;
    gameState.targetReturn = character.targetReturn;
    gameState.mustProfitEveryMonth = character.mustProfitEveryMonth;
    gameState.maxDrawdownLimit = character.maxDrawdownLimit;
    gameState.bankerLossMonths = 0;
    gameState.managerUsedMonths = {};
    gameState.totalManagerFees = 0;
    gameState.managerHistory = [];
    initializeMarketState();

    renderCharacterDetail(character);
    showScreen("character-detail-screen");
}

// -----------------------------
// Render character detail page
// -----------------------------
function renderCharacterDetail(character) {
    document.getElementById("detail-avatar").innerText = character.avatar;
    document.getElementById("detail-name").innerText = character.name;
    document.getElementById("detail-description").innerText = character.description;

    document.getElementById("detail-capital").innerText =
        "$" + character.capital.toLocaleString();

    document.getElementById("detail-risk").innerText =
        character.riskStyle;

    document.getElementById("detail-victory").innerText =
        character.victoryCondition;

    document.getElementById("detail-failure").innerText =
        character.failureCondition;

    document.getElementById("detail-game-meaning").innerText =
        character.gameMeaning;

    updateSpecialistSectorPanel();
}

function formatCharacterDisplayName() {
    const character = getSelectedCharacter();

    if (!character) {
        return "Investor";
    }

    if (gameState.selectedCharacter === "sector_specialist" && gameState.selectedSpecialistSector) {
        return character.name + " (" + gameState.selectedSpecialistSector + ")";
    }

    return character.name;
}


function selectSpecialistSector(sectorName) {
    if (specialistSectorOptions.indexOf(sectorName) === -1) {
        return;
    }

    gameState.selectedSpecialistSector = sectorName;
    updateSpecialistSectorPanel();
}


function updateSpecialistSectorPanel() {
    const panel = document.getElementById("specialist-sector-panel");
    const selectedText = document.getElementById("specialist-selected-sector");

    if (!panel || !selectedText) {
        return;
    }

    if (gameState.selectedCharacter !== "sector_specialist") {
        panel.style.display = "none";
        selectedText.innerText = "No sector selected.";
        return;
    }

    panel.style.display = "block";

    if (gameState.selectedSpecialistSector) {
        selectedText.innerText = "Selected sector: " + gameState.selectedSpecialistSector;
    } else {
        selectedText.innerText = "Please choose one specialist sector before continuing.";
    }

    specialistSectorOptions.forEach(function (sectorName) {
        const button = document.getElementById("specialist-sector-" + sectorName);

        if (!button) {
            return;
        }

        if (sectorName === gameState.selectedSpecialistSector) {
            button.classList.add("selected");
        } else {
            button.classList.remove("selected");
        }
    });
}

function renderMarketOverview() {
    const stockGrid = document.getElementById("stock-card-grid");

    stockGrid.innerHTML = "";

    Object.keys(stocks).forEach(function (stockKey) {
        const stock = stocks[stockKey];

        const stockCard = document.createElement("div");
        stockCard.className = "stock-card";

        stockCard.onclick = function () {
            openStockDetail(stockKey);
        };

        stockCard.innerHTML = `
            <img class="stock-logo-img" src="${stock.logo}" alt="${stock.name} logo">
            <h4>${stock.name}</h4>
            <div class="stock-ticker">${stock.ticker}</div>
        `;

        stockGrid.appendChild(stockCard);
    });
}


function openStockDetail(stockKey) {
    const stock = stocks[stockKey];
    const description = stockDescriptions[stockKey];

    document.getElementById("stock-detail-logo").src = stock.logo;
    document.getElementById("stock-detail-logo").alt = stock.name + " logo";

    document.getElementById("stock-detail-name").innerText = stock.name;
    document.getElementById("stock-detail-ticker").innerText = stock.ticker;

    document.getElementById("stock-detail-sector").innerText = stock.sector;
    document.getElementById("stock-detail-price").innerText = formatMoney(stock.price);
    document.getElementById("stock-detail-risk").innerText = stock.riskLevel;
    document.getElementById("stock-detail-role").innerText = stock.gameRole;

    document.getElementById("stock-detail-company-type").innerText =
        description.companyType;

    document.getElementById("stock-detail-risk-profile").innerText =
        description.riskProfile;

    document.getElementById("stock-detail-market-sensitivity").innerText =
        description.marketSensitivity;

    document.getElementById("stock-detail-sector-sensitivity").innerText =
        description.sectorSensitivity;

    document.getElementById("stock-detail-event-sensitivity").innerText =
        description.eventSensitivity;

    document.getElementById("stock-detail-suitable-investor").innerText =
        description.suitableInvestor;

    showScreen("stock-detail-screen");
}


function goBackToMarketOverview() {
    renderMarketOverview();
    showScreen("market-overview-screen");
}


// -----------------------------
// Confirm selected character
// -----------------------------
function confirmCharacter() {
    if (gameState.selectedCharacter === null) {
        alert("Please choose a character first.");
        return;
    }

    if (gameState.selectedCharacter === "sector_specialist" && !gameState.selectedSpecialistSector) {
        alert("Please choose one specialist sector before continuing.");
        return;
    }

    renderMarketOverview();
    showScreen("market-overview-screen");
}



function goBackToCharacterDetail() {
    if (gameState.selectedCharacter === null) {
        showScreen("character-screen");
        return;
    }

    const character = characters[gameState.selectedCharacter];
    renderCharacterDetail(character);
    showScreen("character-detail-screen");
}


// -----------------------------
// Initial Purchase Page
// -----------------------------
function enterDashboard() {
    startEventSelection();
}


function formatMoney(value) {
    return "$" + Number(value).toLocaleString("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
}


function getSelectedCharacter() {
    return characters[gameState.selectedCharacter];
}


function calculateTotalStockValue() {
    let total = 0;

    Object.keys(stocks).forEach(function (stockKey) {
        const stock = stocks[stockKey];
        const shares = gameState.purchaseShares[stockKey] || 0;

        total += shares * stock.price;
    });

    return total;
}


function calculateRemainingCash() {
    return gameState.currentWealth - calculateTotalStockValue();
}

function getRetireePortfolioViolation() {
    if (gameState.selectedCharacter !== "retiree") {
        return null;
    }

    const character = getSelectedCharacter();

    const totalStockValue = calculateTotalStockValue();
    const remainingCash = calculateRemainingCash();
    const totalWealth = totalStockValue + remainingCash;

    const requiredProtectedCash =
        gameState.initialCapital * character.protectedCashRatio;

    if (remainingCash + 0.01 < requiredProtectedCash) {
        return (
            "This portfolio is not suitable for a Retiree.\n\n" +
            "A Retiree must keep at least 50% of the initial capital as cash.\n" +
            "Required cash reserve: " + formatMoney(requiredProtectedCash) + "\n" +
            "Current cash: " + formatMoney(remainingCash)
        );
    }

    const maxSingleStockValue =
        totalWealth * character.maxSingleStockWeight;

    let violationMessage = null;

    Object.keys(stocks).forEach(function (stockKey) {
        if (violationMessage !== null) {
            return;
        }

        const stock = stocks[stockKey];
        const shares = gameState.purchaseShares[stockKey] || 0;
        const stockValue = shares * stock.price;

        if (stockValue > maxSingleStockValue + 0.01) {
            violationMessage =
                "This portfolio is too concentrated for a Retiree.\n\n" +
                "No single stock can exceed 30% of total wealth.\n" +
                stock.name + " current value: " + formatMoney(stockValue) + "\n" +
                "Maximum allowed value per stock: " + formatMoney(maxSingleStockValue);
        }
    });

    return violationMessage;
}

function getSectorSpecialistPortfolioViolation() {
    if (gameState.selectedCharacter !== "sector_specialist") {
        return null;
    }

    const character = getSelectedCharacter();
    const specialistSector = gameState.selectedSpecialistSector;

    if (!specialistSector) {
        return "Please choose one specialist sector before confirming the portfolio.";
    }

    const totalStockValue = calculateTotalStockValue();
    const remainingCash = calculateRemainingCash();
    const totalWealth = totalStockValue + remainingCash;
    let nonSpecialistSectorValue = 0;

    Object.keys(stocks).forEach(function (stockKey) {
        const stock = stocks[stockKey];
        const shares = gameState.purchaseShares[stockKey] || 0;
        const stockValue = shares * stock.price;

        if (stock.sector !== specialistSector) {
            nonSpecialistSectorValue += stockValue;
        }
    });

    const maximumNonSpecialistValue =
        totalWealth * character.nonSpecialistSectorLimit;

    if (nonSpecialistSectorValue > maximumNonSpecialistValue + 0.01) {
        return (
            "This portfolio is outside the Sector Specialist rule.\n\n" +
            "Your specialist sector: " + specialistSector + "\n" +
            "The total value invested in non-specialist sectors cannot exceed 30% of current total wealth.\n" +
            "Current non-specialist sector value: " + formatMoney(nonSpecialistSectorValue) + "\n" +
            "Maximum allowed value: " + formatMoney(maximumNonSpecialistValue) + "\n\n" +
            "You may hold more cash when your sector is risky, but you cannot move too much capital into unfamiliar sectors."
        );
    }

    return null;
}


function getRolePortfolioViolation() {
    const retireeViolation = getRetireePortfolioViolation();

    if (retireeViolation !== null) {
        return retireeViolation;
    }

    const sectorSpecialistViolation = getSectorSpecialistPortfolioViolation();

    if (sectorSpecialistViolation !== null) {
        return sectorSpecialistViolation;
    }

    return null;
}

function getMaxSharesForStock(stockKey) {
    const stock = stocks[stockKey];
    const currentShares = gameState.purchaseShares[stockKey] || 0;
    const remainingCash = calculateRemainingCash();

    const availableForThisStock = remainingCash + currentShares * stock.price;

    return Math.floor(availableForThisStock / stock.price);
}


function startInitialPurchase() {
    if (gameState.selectedCharacter === null) {
        alert("Please choose a character first.");
        showScreen("character-screen");
        return;
    }

    const character = getSelectedCharacter();

    if (!gameState.portfolioStarted) {
        gameState.initialCapital = character.capital;
        gameState.currentWealth = character.capital;
        gameState.remainingCash = character.capital;
        gameState.purchaseShares = {};
        gameState.monthlyHistory = [];
        gameState.initialStockPrices = {};
        gameState.bankerLossMonths = 0;
        gameState.managerUsedMonths = {};
        gameState.totalManagerFees = 0;
        gameState.managerHistory = [];

        Object.keys(stocks).forEach(function (stockKey) {
            gameState.initialStockPrices[stockKey] = stocks[stockKey].price;
        });

        Object.keys(stocks).forEach(function (stockKey) {
            gameState.purchaseShares[stockKey] = 0;
        });

        gameState.portfolioStarted = true;
    } else {
        Object.keys(stocks).forEach(function (stockKey) {
            if (gameState.purchaseShares[stockKey] === undefined) {
                gameState.purchaseShares[stockKey] = 0;
            }
        });

        gameState.remainingCash = calculateRemainingCash();
    }

    renderInitialPurchasePage();
    showScreen("initial-purchase-screen");
}


function renderInitialPurchasePage() {
    const character = getSelectedCharacter();
    const purchaseList = document.getElementById("purchase-stock-list");

    if (gameState.month === 1) {
        document.getElementById("purchase-title").innerText = "Initial Stock Purchase";
    } else {
        document.getElementById("purchase-title").innerText =
            "Month " + gameState.month + " Portfolio Adjustment";
    }

    document.getElementById("purchase-investor-name").innerText = formatCharacterDisplayName();
    document.getElementById("purchase-initial-capital").innerText = formatMoney(gameState.initialCapital);

    purchaseList.innerHTML = "";

    Object.keys(stocks).forEach(function (stockKey) {
        const stock = stocks[stockKey];
        const currentShares = gameState.purchaseShares[stockKey] || 0;
        const maxShares = getMaxSharesForStock(stockKey);
        const currentCost = currentShares * stock.price;

        const card = document.createElement("div");
        card.className = "purchase-stock-card";

        card.innerHTML = `
            <div>
                <img class="purchase-logo" src="${stock.logo}" alt="${stock.name} logo">
            </div>

            <div class="purchase-stock-name">
                <h4>${stock.name}</h4>
                <p>${stock.ticker} · ${stock.sector}</p>
                <p>Price: ${formatMoney(stock.price)}</p>
            </div>

            <div class="purchase-slider-area">
                <div class="purchase-slider-top">
                    <span>Shares</span>
                    <span class="share-number" id="purchase-shares-${stockKey}">${currentShares}</span>
                </div>

                <input
                    id="purchase-slider-${stockKey}"
                    class="purchase-slider"
                    type="range"
                    min="0"
                    max="${maxShares}"
                    step="1"
                    value="${currentShares}"
                    oninput="updatePurchaseShares('${stockKey}', this.value)"
                >

                <div class="purchase-slider-labels">
                    <span>0</span>
                    <span id="purchase-max-${stockKey}">Max ${maxShares}</span>
                </div>
            </div>

            <div class="purchase-cost-box">
                <span>Cost</span>
                <strong id="purchase-cost-${stockKey}">${formatMoney(currentCost)}</strong>
            </div>
        `;

        purchaseList.appendChild(card);
    });

    updatePurchaseSummary();
}


function updatePurchaseShares(stockKey, newValue) {
    const stock = stocks[stockKey];

    let newShares = parseInt(newValue);

    if (isNaN(newShares)) {
        newShares = 0;
    }

    const oldShares = gameState.purchaseShares[stockKey] || 0;
    const remainingCash = calculateRemainingCash();

    const availableForThisStock = remainingCash + oldShares * stock.price;
    const maxAllowedShares = Math.floor(availableForThisStock / stock.price);

    if (newShares > maxAllowedShares) {
        newShares = maxAllowedShares;
    }

    if (newShares < 0) {
        newShares = 0;
    }

    gameState.purchaseShares[stockKey] = newShares;

    refreshPurchasePage();
}


function refreshPurchasePage() {
    Object.keys(stocks).forEach(function (stockKey) {
        const stock = stocks[stockKey];
        const shares = gameState.purchaseShares[stockKey] || 0;
        const maxShares = getMaxSharesForStock(stockKey);
        const cost = shares * stock.price;

        const slider = document.getElementById("purchase-slider-" + stockKey);
        const sharesText = document.getElementById("purchase-shares-" + stockKey);
        const maxText = document.getElementById("purchase-max-" + stockKey);
        const costText = document.getElementById("purchase-cost-" + stockKey);

        if (slider) {
            slider.max = maxShares;
            slider.value = shares;
        }

        if (sharesText) {
            sharesText.innerText = shares;
        }

        if (maxText) {
            maxText.innerText = "Max " + maxShares;
        }

        if (costText) {
            costText.innerText = formatMoney(cost);
        }
    });

    updatePurchaseSummary();
}


function updatePurchaseSummary() {
    const totalStockValue = calculateTotalStockValue();
    const remainingCash = calculateRemainingCash();

    let selectedStockCount = 0;

    Object.keys(stocks).forEach(function (stockKey) {
        if ((gameState.purchaseShares[stockKey] || 0) > 0) {
            selectedStockCount++;
        }
    });

    gameState.remainingCash = remainingCash;
    gameState.currentWealth = totalStockValue + remainingCash;

    document.getElementById("purchase-total-stock-value").innerText = formatMoney(totalStockValue);
    document.getElementById("purchase-remaining-cash").innerText = formatMoney(remainingCash);
    document.getElementById("purchase-selected-stock-count").innerText = selectedStockCount;
    document.getElementById("purchase-total-wealth").innerText = formatMoney(totalStockValue + remainingCash);

    const warning = document.getElementById("purchase-warning");

    if (remainingCash < 0) {
        warning.style.display = "block";
        warning.innerText = "Total cost exceeds your available cash.";
    } else {
        warning.style.display = "none";
        warning.innerText = "";
    }
    updateRoleRuleWarning();
    updateWealthManagerPanel();
}

function updateRoleRuleWarning() {
    const warning = document.getElementById("purchase-warning");

    if (!warning) {
        return;
    }

    if (gameState.selectedCharacter === "sector_specialist") {
        const violation = getSectorSpecialistPortfolioViolation();

        if (violation !== null) {
            warning.style.display = "block";
            warning.innerText =
                "Sector Specialist Rule: Your non-specialist sector investment is above 30% of total wealth. " +
                "Please reduce investment outside your chosen sector or keep more cash.";
            return;
        }

        if (gameState.selectedSpecialistSector) {
            warning.style.display = "block";
            warning.innerText =
                "Sector Specialist Rule: Your chosen sector is " +
                gameState.selectedSpecialistSector +
                ". Investment in other sectors must stay within 30% of total wealth. Cash is allowed.";
            return;
        }
    }

    if (gameState.selectedCharacter === "retiree") {
        const violation = getRetireePortfolioViolation();

        if (violation !== null) {
            warning.style.display = "block";
            warning.innerText =
                "Retiree Rule: Please keep at least 50% of initial capital as cash and avoid putting more than 30% of wealth into one stock.";
            return;
        }
    }
}

function resetInitialPurchase() {
    Object.keys(stocks).forEach(function (stockKey) {
        gameState.purchaseShares[stockKey] = 0;
    });

    refreshPurchasePage();
}

// -----------------------------
// Wealth Manager Service
// -----------------------------
const WEALTH_MANAGER_COMMISSION_RATE = 0.005;

const wealthManagerPlans = {
    ai_breakthrough: {
        growth: {
            nvidia: 0.35,
            microsoft: 0.25,
            apple: 0.20,
            visa: 0.05,
            cash: 0.15
        },
        aggressive: {
            nvidia: 0.45,
            microsoft: 0.22,
            apple: 0.18,
            cash: 0.15
        },
        stable: {
            microsoft: 0.25,
            apple: 0.20,
            nvidia: 0.15,
            walmart: 0.10,
            cocacola: 0.10,
            cash: 0.20
        },
        protective: {
            microsoft: 0.15,
            apple: 0.12,
            walmart: 0.20,
            cocacola: 0.20,
            mcdonalds: 0.13,
            cash: 0.20
        }
    },

    apple_product_launch: {
        growth: {
            apple: 0.40,
            microsoft: 0.20,
            nvidia: 0.10,
            visa: 0.10,
            cash: 0.20
        },
        aggressive: {
            apple: 0.50,
            nvidia: 0.15,
            microsoft: 0.15,
            visa: 0.05,
            cash: 0.15
        },
        stable: {
            apple: 0.30,
            microsoft: 0.20,
            visa: 0.10,
            walmart: 0.15,
            cocacola: 0.10,
            cash: 0.15
        },
        protective: {
            apple: 0.18,
            microsoft: 0.15,
            walmart: 0.22,
            cocacola: 0.20,
            mcdonalds: 0.10,
            cash: 0.15
        }
    },

    rare_earth_shortage: {
        growth: {
            exxon: 0.25,
            chevron: 0.20,
            walmart: 0.15,
            cocacola: 0.15,
            visa: 0.05,
            cash: 0.20
        },
        aggressive: {
            exxon: 0.30,
            chevron: 0.25,
            walmart: 0.12,
            cocacola: 0.10,
            microsoft: 0.08,
            cash: 0.15
        },
        stable: {
            walmart: 0.20,
            cocacola: 0.20,
            mcdonalds: 0.15,
            chevron: 0.10,
            exxon: 0.10,
            cash: 0.25
        },
        protective: {
            walmart: 0.25,
            cocacola: 0.25,
            mcdonalds: 0.15,
            chevron: 0.08,
            cash: 0.27
        }
    },

    banking_scandal: {
        growth: {
            walmart: 0.25,
            cocacola: 0.20,
            mcdonalds: 0.20,
            microsoft: 0.15,
            apple: 0.10,
            cash: 0.10
        },
        aggressive: {
            microsoft: 0.25,
            apple: 0.18,
            walmart: 0.20,
            cocacola: 0.15,
            mcdonalds: 0.12,
            cash: 0.10
        },
        stable: {
            walmart: 0.25,
            cocacola: 0.25,
            mcdonalds: 0.15,
            microsoft: 0.10,
            cash: 0.25
        },
        protective: {
            walmart: 0.25,
            cocacola: 0.30,
            mcdonalds: 0.15,
            cash: 0.30
        }
    },

    oil_price_surge: {
        growth: {
            exxon: 0.35,
            chevron: 0.30,
            microsoft: 0.10,
            apple: 0.10,
            cash: 0.15
        },
        aggressive: {
            exxon: 0.42,
            chevron: 0.33,
            microsoft: 0.08,
            cash: 0.17
        },
        stable: {
            chevron: 0.25,
            exxon: 0.20,
            cocacola: 0.15,
            walmart: 0.15,
            cash: 0.25
        },
        protective: {
            chevron: 0.18,
            exxon: 0.15,
            walmart: 0.20,
            cocacola: 0.20,
            cash: 0.27
        }
    },

    clean_energy_breakthrough: {
        growth: {
            microsoft: 0.25,
            apple: 0.20,
            nvidia: 0.15,
            walmart: 0.15,
            mcdonalds: 0.10,
            cash: 0.15
        },
        aggressive: {
            nvidia: 0.25,
            microsoft: 0.25,
            apple: 0.20,
            walmart: 0.10,
            cash: 0.20
        },
        stable: {
            microsoft: 0.20,
            apple: 0.15,
            walmart: 0.20,
            cocacola: 0.20,
            cash: 0.25
        },
        protective: {
            walmart: 0.25,
            cocacola: 0.25,
            mcdonalds: 0.15,
            microsoft: 0.10,
            cash: 0.25
        }
    },

    high_inflation: {
        growth: {
            exxon: 0.20,
            chevron: 0.15,
            walmart: 0.15,
            cocacola: 0.15,
            mcdonalds: 0.10,
            cash: 0.25
        },
        aggressive: {
            exxon: 0.25,
            chevron: 0.20,
            walmart: 0.12,
            cocacola: 0.10,
            microsoft: 0.08,
            cash: 0.25
        },
        stable: {
            walmart: 0.20,
            cocacola: 0.20,
            chevron: 0.10,
            exxon: 0.10,
            cash: 0.40
        },
        protective: {
            walmart: 0.20,
            cocacola: 0.25,
            mcdonalds: 0.10,
            chevron: 0.08,
            cash: 0.37
        }
    },

    global_trade_war: {
        growth: {
            microsoft: 0.15,
            visa: 0.15,
            cocacola: 0.20,
            mcdonalds: 0.15,
            chevron: 0.10,
            cash: 0.25
        },
        aggressive: {
            microsoft: 0.20,
            visa: 0.15,
            cocacola: 0.15,
            mcdonalds: 0.15,
            chevron: 0.10,
            cash: 0.25
        },
        stable: {
            cocacola: 0.25,
            mcdonalds: 0.20,
            walmart: 0.10,
            visa: 0.10,
            cash: 0.35
        },
        protective: {
            cocacola: 0.30,
            mcdonalds: 0.20,
            walmart: 0.15,
            cash: 0.35
        }
    },

    economic_recovery: {
        growth: {
            visa: 0.20,
            jpmorgan: 0.15,
            walmart: 0.15,
            mcdonalds: 0.15,
            microsoft: 0.15,
            apple: 0.10,
            cash: 0.10
        },
        aggressive: {
            visa: 0.20,
            jpmorgan: 0.20,
            nvidia: 0.15,
            microsoft: 0.15,
            walmart: 0.10,
            mcdonalds: 0.10,
            cash: 0.10
        },
        stable: {
            visa: 0.18,
            walmart: 0.18,
            mcdonalds: 0.15,
            microsoft: 0.12,
            cocacola: 0.12,
            cash: 0.25
        },
        protective: {
            walmart: 0.22,
            cocacola: 0.20,
            mcdonalds: 0.18,
            visa: 0.10,
            microsoft: 0.08,
            cash: 0.22
        }
    },

    real_estate_crash: {
        growth: {
            walmart: 0.25,
            cocacola: 0.25,
            mcdonalds: 0.15,
            microsoft: 0.10,
            apple: 0.05,
            cash: 0.20
        },
        aggressive: {
            microsoft: 0.18,
            apple: 0.10,
            walmart: 0.25,
            cocacola: 0.20,
            mcdonalds: 0.12,
            cash: 0.15
        },
        stable: {
            walmart: 0.25,
            cocacola: 0.25,
            mcdonalds: 0.15,
            cash: 0.35
        },
        protective: {
            walmart: 0.25,
            cocacola: 0.30,
            mcdonalds: 0.15,
            cash: 0.30
        }
    },

    strong_consumer_spending: {
        growth: {
            walmart: 0.25,
            mcdonalds: 0.25,
            cocacola: 0.20,
            visa: 0.15,
            apple: 0.05,
            cash: 0.10
        },
        aggressive: {
            mcdonalds: 0.28,
            walmart: 0.25,
            cocacola: 0.18,
            visa: 0.17,
            nvidia: 0.05,
            cash: 0.07
        },
        stable: {
            walmart: 0.25,
            cocacola: 0.25,
            mcdonalds: 0.20,
            visa: 0.10,
            cash: 0.20
        },
        protective: {
            walmart: 0.28,
            cocacola: 0.28,
            mcdonalds: 0.18,
            cash: 0.26
        }
    },

    technology_upgrade_cycle: {
        growth: {
            microsoft: 0.30,
            nvidia: 0.25,
            apple: 0.20,
            visa: 0.10,
            cash: 0.15
        },
        aggressive: {
            nvidia: 0.35,
            microsoft: 0.30,
            apple: 0.20,
            cash: 0.15
        },
        stable: {
            microsoft: 0.30,
            apple: 0.20,
            nvidia: 0.10,
            walmart: 0.10,
            cocacola: 0.10,
            cash: 0.20
        },
        protective: {
            microsoft: 0.18,
            apple: 0.15,
            walmart: 0.22,
            cocacola: 0.20,
            cash: 0.25
        }
    },
    large_scale_labor_strike: {
        growth: {
            walmart: 0.18,
            cocacola: 0.18,
            microsoft: 0.15,
            visa: 0.10,
            chevron: 0.10,
            cash: 0.29
        },
        aggressive: {
            microsoft: 0.22,
            apple: 0.12,
            visa: 0.12,
            cocacola: 0.16,
            walmart: 0.13,
            cash: 0.25
        },
        stable: {
            walmart: 0.18,
            cocacola: 0.22,
            mcdonalds: 0.12,
            microsoft: 0.10,
            visa: 0.08,
            cash: 0.30
        },
        protective: {
            walmart: 0.20,
            cocacola: 0.18,
            mcdonalds: 0.12,
            cash: 0.50
        }
    },

    major_cyberattack: {
        growth: {
            walmart: 0.20,
            cocacola: 0.18,
            mcdonalds: 0.15,
            exxon: 0.10,
            chevron: 0.10,
            cash: 0.27
        },
        aggressive: {
            walmart: 0.18,
            cocacola: 0.17,
            mcdonalds: 0.15,
            exxon: 0.15,
            chevron: 0.10,
            cash: 0.25
        },
        stable: {
            walmart: 0.22,
            cocacola: 0.22,
            mcdonalds: 0.14,
            chevron: 0.08,
            cash: 0.34
        },
        protective: {
            walmart: 0.22,
            cocacola: 0.18,
            mcdonalds: 0.10,
            cash: 0.50
        }
    },
    calm_market: {
        growth: {
            apple: 0.12,
            microsoft: 0.12,
            nvidia: 0.12,
            jpmorgan: 0.08,
            visa: 0.10,
            exxon: 0.08,
            chevron: 0.08,
            walmart: 0.10,
            cocacola: 0.10,
            mcdonalds: 0.10
        },
        aggressive: {
            apple: 0.12,
            microsoft: 0.15,
            nvidia: 0.20,
            jpmorgan: 0.10,
            visa: 0.10,
            exxon: 0.08,
            chevron: 0.05,
            walmart: 0.08,
            cocacola: 0.05,
            mcdonalds: 0.07
        },
        stable: {
            apple: 0.08,
            microsoft: 0.10,
            visa: 0.10,
            walmart: 0.18,
            cocacola: 0.18,
            mcdonalds: 0.14,
            chevron: 0.07,
            cash: 0.15
        },
        protective: {
            walmart: 0.22,
            cocacola: 0.22,
            mcdonalds: 0.16,
            microsoft: 0.10,
            visa: 0.08,
            chevron: 0.07,
            cash: 0.15
        }
    }
};


function getManagerStyleForCharacter() {
    if (gameState.selectedCharacter === "entrepreneur") {
        return "aggressive";
    }

    if (gameState.selectedCharacter === "student") {
        return "growth";
    }

    if (gameState.selectedCharacter === "banker") {
        return "stable";
    }

    if (gameState.selectedCharacter === "retiree") {
        return "protective";
    }

    if (gameState.selectedCharacter === "sector_specialist") {
        return "specialist";
    }

    return "growth";
}


function getCurrentEventIdForManager() {
    if (gameState.currentEvent && gameState.currentEvent.id) {
        return gameState.currentEvent.id;
    }

    return "calm_market";
}


function getWealthManagerPlan() {
    const eventId = getCurrentEventIdForManager();
    const managerStyle = getManagerStyleForCharacter();

    if (managerStyle === "specialist") {
        return getSectorSpecialistManagerPlan(eventId);
    }

    if (wealthManagerPlans[eventId] && wealthManagerPlans[eventId][managerStyle]) {
        return wealthManagerPlans[eventId][managerStyle];
    }

    return wealthManagerPlans.calm_market[managerStyle];
}


function getManagerStyleName() {
    const managerStyle = getManagerStyleForCharacter();

    if (managerStyle === "aggressive") {
        return "Aggressive Manager";
    }

    if (managerStyle === "growth") {
        return "Growth Manager";
    }

    if (managerStyle === "stable") {
        return "Stability Manager";
    }

    if (managerStyle === "protective") {
        return "Protection Manager";
    }

    if (managerStyle === "specialist") {
        return "Specialist Manager";
    }

    return "Wealth Manager";
}

function getEventById(eventId) {
    return events.find(function (eventItem) {
        return eventItem.id === eventId;
    });
}


function getEventSectorScore(eventId, sectorName) {
    const eventItem = getEventById(eventId) || getCalmEventFallback();

    if (!eventItem || !eventItem.effects || !eventItem.effects.sectors || !eventItem.effects.sectors[sectorName]) {
        return 0;
    }

    const sectorEffect = eventItem.effects.sectors[sectorName];
    let score = 0;

    if (sectorEffect.sectorFactorChange !== undefined) {
        score += sectorEffect.sectorFactorChange;
    }

    if (sectorEffect.muChange !== undefined) {
        score += sectorEffect.muChange;
    }

    if (sectorEffect.sigmaMultiplier !== undefined && sectorEffect.sigmaMultiplier > 1.10) {
        score -= 0.004;
    }

    if (sectorEffect.jumpMeanChange !== undefined) {
        score += sectorEffect.jumpMeanChange * 0.25;
    }

    return score;
}


function addWeightToPlan(plan, stockKey, weight) {
    if (!stockKey || !stocks[stockKey] || weight <= 0) {
        return;
    }

    if (plan[stockKey] === undefined) {
        plan[stockKey] = 0;
    }

    plan[stockKey] += weight;
}


function distributeWeightAcrossStocks(plan, stockKeys, totalWeight) {
    const availableStockKeys = stockKeys.filter(function (stockKey) {
        return stocks[stockKey] !== undefined;
    });

    if (availableStockKeys.length === 0 || totalWeight <= 0) {
        return;
    }

    const equalWeight = totalWeight / availableStockKeys.length;

    availableStockKeys.forEach(function (stockKey) {
        addWeightToPlan(plan, stockKey, equalWeight);
    });
}


function getSpecialistOtherStockKeys(specialistSector) {
    const preferredOrder = [
        "walmart",
        "cocacola",
        "mcdonalds",
        "microsoft",
        "visa",
        "chevron",
        "exxon",
        "apple",
        "jpmorgan",
        "nvidia"
    ];

    return preferredOrder.filter(function (stockKey) {
        return stocks[stockKey] && stocks[stockKey].sector !== specialistSector;
    }).slice(0, 4);
}


function getSectorSpecialistManagerPlan(eventId) {
    const specialistSector = gameState.selectedSpecialistSector || "Technology";
    const sectorScore = getEventSectorScore(eventId, specialistSector);
    const plan = {};

    let specialistWeight = 0.45;
    let nonSpecialistWeight = 0.25;
    let cashWeight = 0.30;

    if (sectorScore > 0.004) {
        specialistWeight = 0.60;
        nonSpecialistWeight = 0.25;
        cashWeight = 0.15;
    } else if (sectorScore < -0.004) {
        specialistWeight = 0.20;
        nonSpecialistWeight = 0.25;
        cashWeight = 0.55;
    }

    distributeWeightAcrossStocks(
        plan,
        sectorStockMap[specialistSector] || [],
        specialistWeight
    );

    distributeWeightAcrossStocks(
        plan,
        getSpecialistOtherStockKeys(specialistSector),
        nonSpecialistWeight
    );

    plan.cash = cashWeight;

    return plan;
}

function updateWealthManagerPanel() {
    const button = document.getElementById("wealth-manager-button");
    const status = document.getElementById("wealth-manager-status");

    if (!button || !status) {
        return;
    }

    const usedThisMonth = gameState.managerUsedMonths[gameState.month] === true;
    const estimatedFee = gameState.currentWealth * WEALTH_MANAGER_COMMISSION_RATE;

    if (usedThisMonth) {
        button.disabled = true;
        status.innerText =
            "The wealth manager has already been used this month. You can still manually fine-tune the sliders.";
        return;
    }

    button.disabled = false;
    status.innerText =
        "Available this month. Estimated commission: " +
        formatMoney(estimatedFee) +
        " (" +
        (WEALTH_MANAGER_COMMISSION_RATE * 100).toFixed(1) +
        "% of current wealth).";
}


function getNormalizedStockWeights(targetWeights) {
    const stockWeights = {};
    let totalStockWeight = 0;

    Object.keys(targetWeights).forEach(function (key) {
        if (key === "cash") {
            return;
        }

        if (!stocks[key]) {
            return;
        }

        stockWeights[key] = targetWeights[key];
        totalStockWeight += targetWeights[key];
    });

    if (totalStockWeight <= 0) {
        return stockWeights;
    }

    Object.keys(stockWeights).forEach(function (stockKey) {
        stockWeights[stockKey] = stockWeights[stockKey] / totalStockWeight;
    });

    return stockWeights;
}


function applyTargetWeightsToPortfolio(targetWeights) {
    let availableWealth = gameState.currentWealth;
    let weightsToUse = targetWeights;

    if (gameState.selectedCharacter === "retiree") {
        const character = getSelectedCharacter();

        const requiredProtectedCash =
            gameState.initialCapital * character.protectedCashRatio;

        const maximumInvestmentFromCurrentWealth =
            Math.max(0, gameState.currentWealth - requiredProtectedCash);

        const maximumInvestmentFromInitialCapital =
            gameState.initialCapital * (1 - character.protectedCashRatio);

        availableWealth = Math.min(
            maximumInvestmentFromCurrentWealth,
            maximumInvestmentFromInitialCapital
        );

        weightsToUse = getNormalizedStockWeights(targetWeights);
    }

    Object.keys(stocks).forEach(function (stockKey) {
        gameState.purchaseShares[stockKey] = 0;
    });

    Object.keys(weightsToUse).forEach(function (key) {
        if (key === "cash") {
            return;
        }

        if (!stocks[key]) {
            return;
        }

        const weight = weightsToUse[key];
        const stock = stocks[key];
        const targetValue = availableWealth * weight;
        const shares = Math.floor(targetValue / stock.price);

        gameState.purchaseShares[key] = Math.max(0, shares);
    });

    gameState.remainingCash = calculateRemainingCash();
}


function applyWealthManagerPortfolio() {
    if (gameState.selectedCharacter === null) {
        alert("Please choose an investor first.");
        return;
    }

    if (gameState.managerUsedMonths[gameState.month] === true) {
        alert("The wealth manager has already been used this month.");
        return;
    }

    if (gameState.selectedCharacter === "sector_specialist" && !gameState.selectedSpecialistSector) {
        alert("Please choose one specialist sector before using the wealth manager.");
        return;
    }

    const currentEvent = gameState.currentEvent || getCalmEventFallback();
    const managerStyleName = getManagerStyleName();
    const commissionFee = gameState.currentWealth * WEALTH_MANAGER_COMMISSION_RATE;

    const confirmManager = confirm(
        "Entrust your portfolio to the wealth manager?\n\n" +
        "Manager style: " + managerStyleName + "\n" +
        "Current event: " + currentEvent.name + "\n" +
        "Commission: " + formatMoney(commissionFee) +
        " (" + (WEALTH_MANAGER_COMMISSION_RATE * 100).toFixed(1) + "% of current wealth)\n\n" +
        "The commission will be charged immediately and cannot be refunded."
    );

    if (!confirmManager) {
        return;
    }

    gameState.currentWealth -= commissionFee;
    gameState.totalManagerFees += commissionFee;
    gameState.managerUsedMonths[gameState.month] = true;

    const targetPlan = getWealthManagerPlan();

    applyTargetWeightsToPortfolio(targetPlan);

    gameState.managerHistory.push({
        month: gameState.month,
        eventId: currentEvent.id,
        eventName: currentEvent.name,
        managerStyle: managerStyleName,
        commissionFee: commissionFee
    });

    refreshPurchasePage();

    const status = document.getElementById("wealth-manager-status");

    if (status) {
        let managerMessage =
            "Wealth manager applied: " +
            managerStyleName +
            ". Commission charged: " +
            formatMoney(commissionFee) +
            ".";

        if (gameState.selectedCharacter === "sector_specialist") {
            managerMessage +=
                " Specialist sector: " +
                gameState.selectedSpecialistSector +
                ". Non-specialist sector exposure is controlled within the 30% rule.";
        }

        managerMessage +=
            " You can continue directly or manually fine-tune the sliders.";

        status.innerText = managerMessage;
    }
}

function continueToPortfolioReview() {
    const totalStockValue = calculateTotalStockValue();
    const remainingCash = calculateRemainingCash();

    if (remainingCash < 0) {
        alert("Your total stock cost exceeds your available cash.");
        return;
    }

    const roleViolation = getRolePortfolioViolation();

    if (roleViolation !== null) {
        alert(roleViolation);

        const warning = document.getElementById("purchase-warning");

        if (warning) {
            warning.style.display = "block";
            warning.innerText =
                "Role portfolio rule violated. Please adjust your investment mix before continuing.";
        }

        return;
    }

    if (totalStockValue === 0) {
        const keepAllCash = confirm("You have not bought any stock. Do you want to keep all money as cash?");
        if (!keepAllCash) {
            return;
        }
    }

    gameState.remainingCash = remainingCash;
    gameState.currentWealth = totalStockValue + remainingCash;

    renderPortfolioReview();
    showScreen("portfolio-review-screen");
}
function calculateSectorAllocation(remainingCashValue) {
    const cashValue =
        typeof remainingCashValue === "number"
            ? remainingCashValue
            : calculateRemainingCash();

    const sectorTotals = {
        Technology: 0,
        Finance: 0,
        Energy: 0,
        Consumer: 0,
        Cash: Math.max(0, cashValue)
    };

    Object.keys(stocks).forEach(function (stockKey) {
        const stock = stocks[stockKey];
        const shares = gameState.purchaseShares[stockKey] || 0;
        const value = shares * stock.price;

        sectorTotals[stock.sector] += value;
    });

    return sectorTotals;
}

function drawSectorPieChart(pieChart, sectorTotals, totalValue, sectorColors, sectorNames) {
    if (!pieChart) {
        return;
    }

    const visibleSectors = sectorNames.filter(function (sectorName) {
        return sectorTotals[sectorName] > 0.01;
    });

    if (totalValue <= 0 || visibleSectors.length === 0) {
        pieChart.style.background = "#94a3b8";
        return;
    }

    let currentPercent = 0;
    const gradientParts = [];

    visibleSectors.forEach(function (sectorName, index) {
        const value = sectorTotals[sectorName];
        const percent = (value / totalValue) * 100;

        const start = currentPercent;
        let end = currentPercent + percent;

        if (index === visibleSectors.length - 1) {
            end = 100;
        }

        gradientParts.push(
            sectorColors[sectorName] +
            " " +
            start.toFixed(4) +
            "% " +
            end.toFixed(4) +
            "%"
        );

        currentPercent = end;
    });

    pieChart.style.background = "conic-gradient(" + gradientParts.join(", ") + ")";
}

function renderPortfolioReview() {
    const character = getSelectedCharacter();
    const holdingsList = document.getElementById("review-holdings-list");
    const sectorLegend = document.getElementById("sector-legend");
    const pieChart = document.getElementById("sector-pie-chart");

    const totalStockValue = calculateTotalStockValue();
    const remainingCash = calculateRemainingCash();
    const totalPortfolioValue = totalStockValue + remainingCash;

    document.getElementById("review-investor-name").innerText = formatCharacterDisplayName();
    document.getElementById("review-stock-value").innerText = formatMoney(totalStockValue);
    document.getElementById("review-remaining-cash").innerText = formatMoney(remainingCash);
    document.getElementById("review-total-value").innerText = formatMoney(totalPortfolioValue);

    holdingsList.innerHTML = "";

    let stockCount = 0;
    let totalShares = 0;

    Object.keys(stocks).forEach(function (stockKey) {
        const stock = stocks[stockKey];
        const shares = gameState.purchaseShares[stockKey] || 0;

        if (shares > 0) {
            stockCount++;
            totalShares += shares;

            const marketValue = shares * stock.price;

            const card = document.createElement("div");
            card.className = "review-holding-card";

            card.innerHTML = `
                <div>
                    <img class="review-holding-logo" src="${stock.logo}" alt="${stock.name} logo">
                </div>

                <div class="review-holding-name">
                    <h4>${stock.name}</h4>
                    <p>${stock.ticker} · ${stock.sector}</p>
                </div>

                <div class="review-holding-stat">
                    <span>Shares Held</span>
                    <strong>${shares}</strong>
                </div>

                <div class="review-holding-stat">
                    <span>Price</span>
                    <strong>${formatMoney(stock.price)}</strong>
                </div>

                <div class="review-holding-stat">
                    <span>Market Value</span>
                    <strong>${formatMoney(marketValue)}</strong>
                </div>
            `;

            holdingsList.appendChild(card);
        }
    });

    if (stockCount === 0) {
        holdingsList.innerHTML = `
            <div class="empty-holding-note">
                You are currently holding no stocks. All money is kept as cash.
            </div>
        `;
    }

    const sectorTotals = calculateSectorAllocation(remainingCash);

    const sectorColors = {
        Technology: "#3b82f6",
        Finance: "#22c55e",
        Energy: "#f97316",
        Consumer: "#ec4899",
        Cash: "#94a3b8"
    };

    const sectorNames = ["Technology", "Finance", "Energy", "Consumer", "Cash"];

    let largestSector = "None";
    let largestValue = 0;

    sectorLegend.innerHTML = "";

    sectorNames.forEach(function (sectorName) {
        const value = sectorTotals[sectorName];
        const percent = totalPortfolioValue > 0 ? (value / totalPortfolioValue) * 100 : 0;

        if (value > largestValue) {
            largestValue = value;
            largestSector = sectorName;
        }


        const legendItem = document.createElement("div");
        legendItem.className = "legend-item";

        legendItem.innerHTML = `
            <div class="legend-left">
                <div class="legend-color" style="background-color: ${sectorColors[sectorName]};"></div>
                <div class="legend-name">${sectorName}</div>
            </div>
            <div class="legend-value">${percent.toFixed(1)}%</div>
        `;

        sectorLegend.appendChild(legendItem);
    });

    drawSectorPieChart(
        pieChart,
        sectorTotals,
        totalPortfolioValue,
        sectorColors,
        sectorNames
    );

    document.getElementById("review-stock-count").innerText = stockCount;
    document.getElementById("review-total-shares").innerText = totalShares;
    document.getElementById("review-largest-sector").innerText = largestSector;
}


function goBackToInitialPurchase() {
    renderInitialPurchasePage();
    showScreen("initial-purchase-screen");
}


function confirmInitialPortfolio() {
    const roleViolation = getRolePortfolioViolation();

    if (roleViolation !== null) {
        alert(roleViolation);
        goBackToInitialPurchase();
        return;
    }

    startMonthlySimulation();
}

// -----------------------------
// Event Selection Page
// -----------------------------
function getCalmMarketEvent() {
    return events.find(function (eventItem) {
        return eventItem.id === "calm_market";
    });
}


function getNonCalmEvents() {
    return events.filter(function (eventItem) {
        return eventItem.id !== "calm_market";
    });
}


function shuffleArray(array) {
    const newArray = array.slice();

    for (let i = newArray.length - 1; i > 0; i--) {
        const randomIndex = Math.floor(Math.random() * (i + 1));
        const temp = newArray[i];
        newArray[i] = newArray[randomIndex];
        newArray[randomIndex] = temp;
    }

    return newArray;
}

// -----------------------------
// State-dependent major event probabilities
// -----------------------------
const MAJOR_EVENT_PROBABILITIES = {
    bull: {
        positive: 0.55,
        negative: 0.15,
        mixed: 0.10,
        neutral: 0.20
    },
    bear: {
        positive: 0.15,
        negative: 0.55,
        mixed: 0.10,
        neutral: 0.20
    },
    calm: {
        positive: 0.25,
        negative: 0.20,
        mixed: 0.10,
        neutral: 0.45
    },
    volatile: {
        positive: 0.30,
        negative: 0.40,
        mixed: 0.20,
        neutral: 0.10
    }
};


function generateWeightedMajorEvent() {
    const state = gameState.currentMarketState;
    const probabilities = MAJOR_EVENT_PROBABILITIES[state];

    if (!probabilities) {
        throw new Error("Invalid market state: " + state);
    }

    const randomValue = Math.random();
    let cumulative = 0;
    let selectedType = "neutral";

    for (const [type, probability] of Object.entries(probabilities)) {
        cumulative += probability;

        if (randomValue < cumulative) {
            selectedType = type;
            break;
        }
    }

    const matchingEvents = events.filter(function (eventItem) {
        return eventItem.type === selectedType;
    });

    if (matchingEvents.length === 0) {
        throw new Error("No events found for type: " + selectedType);
    }

    const randomIndex = Math.floor(
        Math.random() * matchingEvents.length
    );

    return matchingEvents[randomIndex];
}


function generateEventChoices() {
    const selectedEvents = [];

    for (let i = 0; i < 4; i++) {
        selectedEvents.push(generateWeightedMajorEvent());
    }

    return shuffleArray(selectedEvents);
}



function startEventSelection() {
    ensureMonthlyAnnouncements();
    if (gameState.eventSelected && gameState.currentEvent !== null) {
        renderLockedEventSelectionPage();
        showScreen("event-selection-screen");
        return;
    }

    gameState.eventSelected = false;
    gameState.currentEvent = null;

    if (!Array.isArray(gameState.eventChoices) ||
        gameState.eventChoices.length !== 4) {
        gameState.eventChoices = generateEventChoices();
    }

    renderEventSelectionPage();
    showScreen("event-selection-screen");
}

function getGameplayEventHint(eventItem) {
    switch (eventItem.id) {
        case "ai_breakthrough":
            return "Artificial intelligence news may support technology-related industries, especially software, cloud computing, semiconductors, and digital infrastructure. However, technology stocks may still be volatile because expectations can become overheated.";

        case "apple_product_launch":
            return "A major product launch may support consumer electronics and the wider technology sector. Companies linked to devices, software ecosystems, and premium consumer demand may receive more attention.";

        case "rare_earth_shortage":
            return "A rare earth shortage may hurt hardware-related technology industries because production costs and supply-chain risks increase. Resource and energy-related sectors may become more active, but volatility can also rise.";

        case "banking_scandal":
            return "A banking scandal may damage confidence in the financial sector. Banks are likely to face stronger pressure, while payment networks and broader financial services may also be affected indirectly.";

        case "oil_price_surge":
            return "Higher oil prices may support traditional energy companies, but they can increase costs for consumer businesses, transport-related activities, and companies sensitive to household spending.";

        case "clean_energy_breakthrough":
            return "A clean energy breakthrough may put pressure on traditional oil and gas companies. Technology-related industries and some consumer businesses may benefit from optimism about lower future energy costs.";

        case "high_inflation":
            return "High inflation may pressure most sectors by raising costs and reducing consumer purchasing power. Technology and consumer sectors may be vulnerable, while energy companies may receive some support if commodity prices stay high.";

        case "global_trade_war":
            return "A trade war may hurt industries that rely on global supply chains, international sales, and imported goods. Technology hardware and consumer retail businesses may face stronger pressure.";

        case "economic_recovery":
            return "Economic recovery may support cyclical sectors. Financial services, payment networks, consumer spending, and some growth industries may benefit from stronger confidence and business activity.";

        case "real_estate_crash":
            return "A real estate crash may create pressure on banks and the broader financial sector. Consumer confidence may also weaken, so defensive industries may become more attractive.";

        case "strong_consumer_spending":
            return "Strong consumer spending may support consumer retail, restaurants, beverages, and payment-related businesses. Defensive consumer companies may become more attractive in this environment.";

        case "technology_upgrade_cycle":
            return "A technology upgrade cycle may support software, cloud services, semiconductors, and enterprise technology spending. Growth-oriented technology stocks may react strongly.";


        case "large_scale_labor_strike":
            return "A large-scale labor strike may disrupt labor-intensive industries, retail operations, restaurants, logistics, and some energy production. Consumer and energy sectors may face higher operating costs and weaker short-term performance.";

        case "major_cyberattack":
            return "A major cyberattack may pressure digital infrastructure, payment systems, banks, and technology platforms. Technology and finance sectors may become more volatile, while investors may prefer safer or more defensive positions.";

        case "calm_market":
            return "No major market shock occurs this month. Stock prices are mainly driven by their normal expected return, market sensitivity, sector sensitivity, volatility, and random noise.";

        default:
            return "This event may affect some industries more than others. Think about which sectors are most directly connected to the news before adjusting your portfolio.";
    }
}

function renderMarketAnnouncements() {
    const container =
        document.getElementById("market-announcement-list");

    if (!container) {
        return;
    }

    container.innerHTML = "";

    const announcements = gameState.currentAnnouncements || [];

    announcements.forEach(function (announcement, index) {
        const card = document.createElement("div");
        card.className = "market-announcement-card";

        const label = document.createElement("div");
        label.className = "market-announcement-label";
        label.textContent = "MARKET REPORT " + (index + 1);

        const title = document.createElement("h4");
        title.textContent = announcement.title;

        const description = document.createElement("p");
        description.textContent = announcement.description;

        card.appendChild(label);
        card.appendChild(title);
        card.appendChild(description);

        container.appendChild(card);
    });
}

function renderEventSelectionPage() {
    renderMarketAnnouncements();
    const eventGrid = document.getElementById("event-card-grid");
    const resultPanel = document.getElementById("event-result-panel");
    const continueButton = document.getElementById("event-continue-button");
    const resetButton = document.getElementById("event-reset-button");

    document.getElementById("event-selection-title").innerText =
        "Month " + gameState.month + " Event Selection";

    document.getElementById("event-current-month").innerText =
        "Month " + gameState.month;

    eventGrid.innerHTML = "";
    resultPanel.style.display = "none";
    continueButton.disabled = true;
    resetButton.disabled = false;

    if (gameState.month === 1) {
        continueButton.innerText = "BUILD INITIAL PORTFOLIO";
    } else {
        continueButton.innerText = "ADJUST PORTFOLIO";
    }

    gameState.eventChoices.forEach(function (eventItem, index) {
        const card = document.createElement("div");
        card.className = "mystery-event-card";
        card.onclick = function () {
            revealEventCard(index);
        };

        card.innerHTML = `
            <div class="mystery-question">?</div>
            <div class="mystery-card-label">CARD ${index + 1}</div>
            <div class="mystery-card-subtitle">Click to reveal</div>
        `;

        eventGrid.appendChild(card);
    });
}

function renderLockedEventSelectionPage() {
    renderMarketAnnouncements();
    const eventGrid = document.getElementById("event-card-grid");
    const resultPanel = document.getElementById("event-result-panel");
    const continueButton = document.getElementById("event-continue-button");
    const resetButton = document.getElementById("event-reset-button");

    const selectedEvent = gameState.currentEvent;

    document.getElementById("event-selection-title").innerText =
        "Month " + gameState.month + " Event Locked";

    document.getElementById("event-current-month").innerText =
        "Month " + gameState.month;

    eventGrid.innerHTML = "";

    const card = document.createElement("div");
    card.className = "mystery-event-card revealed";
    card.innerHTML = `
        <div class="mystery-question">✓</div>
        <div class="mystery-card-label">${selectedEvent.name}</div>
        <div class="mystery-card-subtitle">Selected Event</div>
    `;

    eventGrid.appendChild(card);

    document.getElementById("event-result-name").innerText = selectedEvent.name;
    document.getElementById("event-result-description").innerText = selectedEvent.description;
    document.getElementById("event-result-impact").innerText =
        getGameplayEventHint(selectedEvent);

    resultPanel.style.display = "block";
    continueButton.disabled = false;
    resetButton.disabled = true;

    if (gameState.month === 1) {
        continueButton.innerText = "BUILD INITIAL PORTFOLIO";
    } else {
        continueButton.innerText = "ADJUST PORTFOLIO";
    }
}

function revealEventCard(index) {
    if (gameState.eventSelected) {
        return;
    }

    const selectedEvent = gameState.eventChoices[index];

    gameState.currentEvent = selectedEvent;
    gameState.eventSelected = true;

    const cards = document.querySelectorAll(".mystery-event-card");

    cards.forEach(function (card, cardIndex) {
        card.onclick = null;

        if (cardIndex === index) {
            card.classList.add("revealed");
            card.innerHTML = `
                <div class="mystery-question">✓</div>
                <div class="mystery-card-label">${selectedEvent.name}</div>
                <div class="mystery-card-subtitle">Selected Event</div>
            `;
        } else {
            card.classList.add("locked");
            card.innerHTML = `
                <div class="mystery-question">?</div>
                <div class="mystery-card-label">LOCKED</div>
                <div class="mystery-card-subtitle">Not selected</div>
            `;
        }
    });

    document.getElementById("event-result-name").innerText = selectedEvent.name;
    document.getElementById("event-result-description").innerText = selectedEvent.description;
    document.getElementById("event-result-impact").innerText =
        getGameplayEventHint(selectedEvent);

    document.getElementById("event-result-panel").style.display = "block";
    document.getElementById("event-continue-button").disabled = false;
    document.getElementById("event-reset-button").disabled = true;
}


function resetEventSelection() {
    if (gameState.eventSelected) {
        alert("The event has already been selected and cannot be changed.");
        return;
    }

    gameState.currentEvent = null;

    // Keep the same four event cards for this month.
    renderEventSelectionPage();
}


function goToInitialPurchase() {
    if (!gameState.eventSelected || gameState.currentEvent === null) {
        alert("Please choose one event card first.");
        return;
    }

    startInitialPurchase();
}
// -----------------------------
// Monthly Stock Simulation Page
// -----------------------------
const TRADING_DAYS = 22;

const chartColors = [
    "#2563eb", "#16a34a", "#dc2626", "#9333ea", "#f97316",
    "#0891b2", "#be123c", "#4f46e5", "#65a30d", "#a16207"
];


function getCalmEventFallback() {
    return {
        id: "calm_market",
        name: "No Major Event",
        description: "No additional major economic or company-specific shock occurs this month.",
        playerImpact: "Stock prices are mainly driven by normal expected return, market factor, sector factor, and random noise.",
        effects: {
            market: { factorChange: 0 },
            sectors: {},
            stocks: {}
        }
    };
}


function randomNormal() {
    let u = 0;
    let v = 0;

    while (u === 0) {
        u = Math.random();
    }

    while (v === 0) {
        v = Math.random();
    }

    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}


function clamp(value, minValue, maxValue) {
    return Math.max(minValue, Math.min(maxValue, value));
}


function calculateMaxDrawdown(values) {
    let peak = values[0];
    let maxDrawdown = 0;

    values.forEach(function (value) {
        if (value > peak) {
            peak = value;
        }

        const drawdown = (peak - value) / peak;

        if (drawdown > maxDrawdown) {
            maxDrawdown = drawdown;
        }
    });

    return maxDrawdown;
}


function formatPercent(value) {
    const sign = value > 0 ? "+" : "";
    return sign + (value * 100).toFixed(2) + "%";
}


function getMonthlyEventEffects() {
    if (gameState.currentEvent && gameState.currentEvent.effects) {
        return gameState.currentEvent.effects;
    }

    return getCalmEventFallback().effects;
}


// Monthly regime adjustments are applied before the existing event effects.
// Values are game-design assumptions, not calibrated financial forecasts.
const MARKET_REGIME_EFFECTS = {
    bull: { muChange: 0.004, sigmaMultiplier: 0.95, marketFactorChange: 0.012 },
    bear: { muChange: -0.004, sigmaMultiplier: 1.12, marketFactorChange: -0.012 },
    calm: { muChange: 0, sigmaMultiplier: 0.82, marketFactorChange: 0 },
    volatile: { muChange: -0.001, sigmaMultiplier: 1.38, marketFactorChange: 0 }
};

function buildAdjustedStockParameters(stockKey) {
    const stock = stocks[stockKey];
    const eventEffects = getMonthlyEventEffects();

    const adjusted = {
        mu: stock.mu,
        beta: stock.beta,
        gamma: stock.gamma,
        sigma: stock.sigma,
        jumpProbability: stock.jumpProbability,
        jumpMean: stock.jumpMean,
        marketFactor: 0,
        sectorFactor: 0
    };

    const regime = MARKET_REGIME_EFFECTS[gameState.currentMarketState];
    if (regime) {
        adjusted.mu += regime.muChange;
        adjusted.sigma *= regime.sigmaMultiplier;
        adjusted.marketFactor += regime.marketFactorChange;
    }

    if (eventEffects.market && eventEffects.market.factorChange) {
        adjusted.marketFactor += eventEffects.market.factorChange;
    }

    if (eventEffects.allStocks) {
        applyParameterEffect(adjusted, eventEffects.allStocks);
    }

    if (eventEffects.sectors && eventEffects.sectors[stock.sector]) {
        const sectorEffect = eventEffects.sectors[stock.sector];

        if (sectorEffect.sectorFactorChange) {
            adjusted.sectorFactor += sectorEffect.sectorFactorChange;
        }

        applyParameterEffect(adjusted, sectorEffect);
    }

    if (eventEffects.stocks && eventEffects.stocks[stockKey]) {
        applyParameterEffect(adjusted, eventEffects.stocks[stockKey]);
    }

    adjusted.sigma = Math.max(0.001, adjusted.sigma);
    adjusted.jumpProbability = clamp(adjusted.jumpProbability, 0, 0.80);
    adjusted.jumpMean = clamp(adjusted.jumpMean, -0.20, 0.20);

    return adjusted;
}


function applyParameterEffect(parameters, effect) {
    if (effect.muChange) {
        parameters.mu += effect.muChange;
    }

    if (effect.betaMultiplier) {
        parameters.beta *= effect.betaMultiplier;
    }

    if (effect.gammaMultiplier) {
        parameters.gamma *= effect.gammaMultiplier;
    }

    if (effect.sigmaMultiplier) {
        parameters.sigma *= effect.sigmaMultiplier;
    }

    if (effect.jumpProbabilityChange) {
        parameters.jumpProbability += effect.jumpProbabilityChange;
    }

    if (effect.jumpMeanChange) {
        parameters.jumpMean += effect.jumpMeanChange;
    }
}


function calculatePortfolioValueFromPaths(dayIndex) {
    let stockValue = 0;

    Object.keys(stocks).forEach(function (stockKey) {
        const shares = gameState.purchaseShares[stockKey] || 0;
        const path = gameState.simulationPaths[stockKey];

        if (path) {
            stockValue += shares * path[dayIndex];
        }
    });

    return stockValue + gameState.remainingCash;
}


function simulateMonthlyStockPrices() {
    gameState.simulationPaths = {};
    gameState.simulationPortfolioValues = [];
    gameState.simulationStockResults = {};

    Object.keys(stocks).forEach(function (stockKey) {
        const stock = stocks[stockKey];
        const params = buildAdjustedStockParameters(stockKey);

        const path = [stock.price];

        for (let day = 1; day <= TRADING_DAYS; day++) {
            const previousPrice = path[day - 1];

            const dailyMu = params.mu / TRADING_DAYS;
            const dailyMarketFactor = params.marketFactor / TRADING_DAYS;
            const dailySectorFactor = params.sectorFactor / TRADING_DAYS;
            const dailySigma = params.sigma / Math.sqrt(TRADING_DAYS);
            const dailyJumpProbability = params.jumpProbability / TRADING_DAYS;

            let jumpShock = 0;

            if (Math.random() < dailyJumpProbability) {
                const jumpNoise = Math.abs(params.jumpMean) * 0.35 * randomNormal();
                jumpShock = params.jumpMean + jumpNoise;
            }

            let dailyReturn =
                dailyMu +
                params.beta * dailyMarketFactor +
                params.gamma * dailySectorFactor +
                dailySigma * randomNormal() +
                jumpShock;

            dailyReturn = clamp(dailyReturn, -0.20, 0.20);

            const newPrice = Math.max(1, previousPrice * (1 + dailyReturn));
            path.push(newPrice);
        }

        gameState.simulationPaths[stockKey] = path;
    });

    for (let day = 0; day <= TRADING_DAYS; day++) {
        gameState.simulationPortfolioValues.push(calculatePortfolioValueFromPaths(day));
    }

    Object.keys(stocks).forEach(function (stockKey) {
        const path = gameState.simulationPaths[stockKey];
        const startPrice = path[0];
        const endPrice = path[TRADING_DAYS];
        const change = endPrice - startPrice;
        const returnRate = change / startPrice;
        const maxDrawdown = calculateMaxDrawdown(path);
        const highPrice = Math.max(...path);
        const lowPrice = Math.min(...path);

        gameState.simulationStockResults[stockKey] = {
            startPrice: startPrice,
            endPrice: endPrice,
            change: change,
            returnRate: returnRate,
            maxDrawdown: maxDrawdown,
            highPrice: highPrice,
            lowPrice: lowPrice
        };
    });
}


function startMonthlySimulation() {
    gameState.simulationCompleted = false;
    gameState.gameOver = false;
    gameState.gameOverReason = "";

    simulateMonthlyStockPrices();

    renderMonthlySimulationPage();
    showScreen("monthly-simulation-screen");
    drawSimulationChart(0);
}


function renderMonthlySimulationPage() {
    const currentEvent = gameState.currentEvent || getCalmEventFallback();
    const startValue = gameState.simulationPortfolioValues[0];

    document.getElementById("simulation-title").innerText =
        "Month " + gameState.month + " Stock Simulation";

    document.getElementById("simulation-event-name").innerText = currentEvent.name;
    document.getElementById("simulation-progress-day").innerText = "0 / " + TRADING_DAYS;
    document.getElementById("simulation-start-value").innerText = formatMoney(startValue);
    document.getElementById("simulation-current-value").innerText = formatMoney(startValue);

    document.getElementById("simulation-end-value").innerText = "$0";
    document.getElementById("simulation-return").innerText = "0%";
    document.getElementById("simulation-return").className = "";
    document.getElementById("simulation-mdd").innerText = "0%";
    document.getElementById("simulation-status-text").innerText =
        "Click START SIMULATION to watch the monthly price paths.";

    document.getElementById("simulation-stock-performance-list").innerHTML = "";
    document.getElementById("game-over-panel").style.display = "none";

    document.getElementById("start-simulation-button").disabled = false;
    const nextButton = document.getElementById("next-month-event-button");
    nextButton.disabled = true;

    if (gameState.month >= 12) {
        nextButton.innerText = "FINAL INVESTMENT SUMMARY";
    } else {
        nextButton.innerText = "NEXT MONTH EVENT";
    }
}


function playSimulationAnimation() {
    document.getElementById("start-simulation-button").disabled = true;
    document.getElementById("simulation-status-text").innerText =
        "Simulation running...";

    let currentDay = 0;

    const animationTimer = setInterval(function () {
        drawSimulationChart(currentDay);
        updateSimulationTopPanel(currentDay);

        if (currentDay >= TRADING_DAYS) {
            clearInterval(animationTimer);
            finishMonthlySimulation();
            return;
        }

        currentDay++;
    }, 160);
}


function updateSimulationTopPanel(dayIndex) {
    const currentValue = gameState.simulationPortfolioValues[dayIndex];

    document.getElementById("simulation-progress-day").innerText =
        dayIndex + " / " + TRADING_DAYS;

    document.getElementById("simulation-current-value").innerText =
        formatMoney(currentValue);
}


function drawSimulationChart(dayLimit) {
    const canvas = document.getElementById("simulation-chart-canvas");
    const ctx = canvas.getContext("2d");

    const width = canvas.width;
    const height = canvas.height;

    const marginLeft = 60;
    const marginRight = 30;
    const marginTop = 30;
    const marginBottom = 55;

    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    const allPrices = [];

    Object.keys(stocks).forEach(function (stockKey) {
        const path = gameState.simulationPaths[stockKey];
        path.forEach(function (price) {
            allPrices.push(price);
        });
    });

    const minPrice = Math.min(...allPrices) * 0.96;
    const maxPrice = Math.max(...allPrices) * 1.04;

    const chartWidth = width - marginLeft - marginRight;
    const chartHeight = height - marginTop - marginBottom;

    function xScale(day) {
        return marginLeft + (day / TRADING_DAYS) * chartWidth;
    }

    function yScale(price) {
        return marginTop + (maxPrice - price) / (maxPrice - minPrice) * chartHeight;
    }

    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1;

    for (let i = 0; i <= 5; i++) {
        const y = marginTop + (i / 5) * chartHeight;
        ctx.beginPath();
        ctx.moveTo(marginLeft, y);
        ctx.lineTo(width - marginRight, y);
        ctx.stroke();

        const priceLabel = maxPrice - (i / 5) * (maxPrice - minPrice);
        ctx.fillStyle = "#64748b";
        ctx.font = "12px Arial";
        ctx.fillText("$" + priceLabel.toFixed(0), 12, y + 4);
    }

    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(marginLeft, marginTop);
    ctx.lineTo(marginLeft, height - marginBottom);
    ctx.lineTo(width - marginRight, height - marginBottom);
    ctx.stroke();

    ctx.fillStyle = "#334155";
    ctx.font = "13px Arial";
    ctx.fillText("Day 0", marginLeft - 5, height - 22);
    ctx.fillText("Day 22", width - marginRight - 48, height - 22);

    Object.keys(stocks).forEach(function (stockKey, index) {
        const path = gameState.simulationPaths[stockKey];
        const color = chartColors[index % chartColors.length];

        ctx.strokeStyle = color;
        ctx.lineWidth = 2.2;
        ctx.beginPath();

        for (let day = 0; day <= dayLimit; day++) {
            const x = xScale(day);
            const y = yScale(path[day]);

            if (day === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }

        ctx.stroke();

        if (dayLimit > 0) {
            const lastX = xScale(dayLimit);
            const lastY = yScale(path[dayLimit]);

            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(lastX, lastY, 3.5, 0, Math.PI * 2);
            ctx.fill();
        }
    });

    drawChartLegend(ctx, width, height);
}


function drawChartLegend(ctx, width, height) {
    const stockKeys = Object.keys(stocks);

    let x = 70;
    let y = height - 38;

    ctx.font = "12px Arial";

    stockKeys.forEach(function (stockKey, index) {
        const stock = stocks[stockKey];
        const color = chartColors[index % chartColors.length];

        ctx.fillStyle = color;
        ctx.fillRect(x, y - 9, 10, 10);

        ctx.fillStyle = "#334155";
        ctx.fillText(stock.ticker, x + 14, y);

        x += 78;

        if (x > width - 100) {
            x = 70;
            y += 16;
        }
    });
}


function finishMonthlySimulation() {
    gameState.simulationCompleted = true;

    const startValue = gameState.simulationPortfolioValues[0];
    const endValue = gameState.simulationPortfolioValues[TRADING_DAYS];
    const monthlyReturn = (endValue - startValue) / startValue;
    const portfolioMaxDrawdown = calculateMaxDrawdown(gameState.simulationPortfolioValues);

    gameState.currentWealth = endValue;

    Object.keys(stocks).forEach(function (stockKey) {
        stocks[stockKey].price = gameState.simulationStockResults[stockKey].endPrice;
    });

    gameState.remainingCash = calculateRemainingCash();

    document.getElementById("simulation-end-value").innerText = formatMoney(endValue);

    const returnElement = document.getElementById("simulation-return");
    returnElement.innerText = formatPercent(monthlyReturn);
    returnElement.className = monthlyReturn >= 0 ? "positive-text" : "negative-text";

    document.getElementById("simulation-mdd").innerText =
        "-" + (portfolioMaxDrawdown * 100).toFixed(2) + "%";

    document.getElementById("simulation-status-text").innerText =
        "Simulation complete. Review the monthly performance below.";

    renderStockPerformanceList();
    checkRoleFailure(monthlyReturn, portfolioMaxDrawdown);

    saveMonthlyHistoryRecord(startValue, endValue, monthlyReturn, portfolioMaxDrawdown);

    const nextButton = document.getElementById("next-month-event-button");
    nextButton.disabled = false;

    if (gameState.gameOver) {
        nextButton.innerText = "VIEW FINAL SUMMARY";
    } else if (gameState.month >= 12) {
        nextButton.innerText = "FINAL INVESTMENT SUMMARY";
    } else {
        nextButton.innerText = "NEXT MONTH EVENT";
    }
}


function renderStockPerformanceList() {
    const list = document.getElementById("simulation-stock-performance-list");

    list.innerHTML = "";

    Object.keys(stocks).forEach(function (stockKey) {
        const stock = stocks[stockKey];
        const result = gameState.simulationStockResults[stockKey];

        const isPositive = result.returnRate >= 0;
        const changeClass = isPositive ? "positive-text" : "negative-text";

        const card = document.createElement("div");
        card.className = "stock-performance-card";

        card.innerHTML = `
            <div>
                <img class="performance-logo" src="${stock.logo}" alt="${stock.name} logo">
            </div>

            <div class="performance-content">
                <h4>${stock.name} (${stock.ticker})</h4>
                <p>Start Price: ${formatMoney(result.startPrice)} → Current Price: ${formatMoney(result.endPrice)}</p>
                <p>High: ${formatMoney(result.highPrice)} · Low: ${formatMoney(result.lowPrice)}</p>
                <p>Max Drawdown: -${(result.maxDrawdown * 100).toFixed(2)}%</p>
                <div class="performance-change ${changeClass}">
                    ${formatPercent(result.returnRate)}
                </div>
            </div>
        `;

        list.appendChild(card);
    });
}


function checkRoleFailure(monthlyReturn, portfolioMaxDrawdown) {
    const character = getSelectedCharacter();

    if (character.mustProfitEveryMonth && monthlyReturn < 0) {
        gameState.bankerLossMonths += 1;

        if (gameState.bankerLossMonths > 3) {
            gameState.gameOver = true;
            gameState.gameOverReason =
                "As a Banker, you are allowed to have at most 3 losing months. " +
                "This month your portfolio return is " + formatPercent(monthlyReturn) + ". " +
                "This is losing month number " + gameState.bankerLossMonths +
                ", so your stability condition has been violated.";
        } else {
            document.getElementById("simulation-status-text").innerText =
                "Simulation complete. Banker warning: this is losing month " +
                gameState.bankerLossMonths +
                " / 3. You can continue, but too many losing months may end the game.";
        }
    }

    if (character.maxDrawdownLimit !== null && portfolioMaxDrawdown > character.maxDrawdownLimit) {
        gameState.gameOver = true;
        gameState.gameOverReason =
            "As a " + character.name + ", your maximum drawdown limit is " +
            (character.maxDrawdownLimit * 100).toFixed(1) + "%. " +
            "This month your portfolio maximum drawdown is -" +
            (portfolioMaxDrawdown * 100).toFixed(2) +
            "%, which is larger than your risk tolerance.";
    }

    if (gameState.gameOver) {
        showGameOverPanel();
    }
}


function showGameOverPanel() {
    const panel = document.getElementById("game-over-panel");

    document.getElementById("game-over-title").innerText =
        "Your role condition was violated.";

    document.getElementById("game-over-message").innerText =
        gameState.gameOverReason + " The game ends here. You can now view the final summary.";

    panel.style.display = "block";

    const nextButton = document.getElementById("next-month-event-button");
    nextButton.disabled = false;
    nextButton.innerText = "VIEW FINAL SUMMARY";
}


function goToNextMonthEvent() {
    if (!gameState.simulationCompleted) {
        alert("Please finish the monthly simulation first.");
        return;
    }

    if (gameState.gameOver) {
        showFinalSummary();
        return;
    }

    if (gameState.month >= 12) {
        showFinalSummary();
        return;
    }

    gameState.month += 1;
    advanceMarketState();
    gameState.currentAnnouncements = [];

    gameState.currentEvent = null;
    gameState.eventChoices = [];
    gameState.eventSelected = false;

    startEventSelection();
}

// -----------------------------
// Final Investment Summary Page
// -----------------------------
function saveMonthlyHistoryRecord(startValue, endValue, monthlyReturn, maxDrawdown) {
    if (!Array.isArray(gameState.monthlyHistory)) {
        gameState.monthlyHistory = [];
    }

    const existingIndex = gameState.monthlyHistory.findIndex(function (record) {
        return record.month === gameState.month;
    });

    const currentEvent = gameState.currentEvent || getCalmEventFallback();

    const record = {
        month: gameState.month,
        eventName: currentEvent.name,
        startValue: startValue,
        endValue: endValue,
        monthlyReturn: monthlyReturn,
        maxDrawdown: maxDrawdown,
        gameOver: gameState.gameOver,
        gameOverReason: gameState.gameOverReason
    };

    if (existingIndex >= 0) {
        gameState.monthlyHistory[existingIndex] = record;
    } else {
        gameState.monthlyHistory.push(record);
    }
}


function evaluateFinalResult() {
    const character = getSelectedCharacter();
    const finalReturn = (gameState.currentWealth - gameState.initialCapital) / gameState.initialCapital;

    if (gameState.gameOver) {
        gameState.finalStatus = "early_game_over";
        gameState.finalReason =
            "Your investment journey ended early in Month " + gameState.month + ". " +
            gameState.gameOverReason;
        return;
    }

    if (finalReturn >= character.targetReturn) {
        gameState.finalStatus = "victory";
        gameState.finalReason =
            "You achieved the role target. Your final return is " +
            formatPercent(finalReturn) +
            ", which meets the required target of " +
            formatPercent(character.targetReturn) + ".";
    } else {
        gameState.finalStatus = "failed";
        gameState.finalReason =
            "You completed the investment period, but your final return is " +
            formatPercent(finalReturn) +
            ", which is below the required target of " +
            formatPercent(character.targetReturn) + ".";
    }
}


function showFinalSummary() {
    evaluateFinalResult();
    renderFinalSummary();
    showScreen("final-summary-screen");
    drawFinalWealthChart();
}


function renderFinalSummary() {
    const character = getSelectedCharacter();
    const finalReturn = (gameState.currentWealth - gameState.initialCapital) / gameState.initialCapital;
    const totalMaxDrawdown = calculateFinalMaxDrawdown();
    const monthsPlayed = gameState.monthlyHistory.length;

    renderFinalBanner();

    document.getElementById("final-investor-name").innerText = formatCharacterDisplayName();
    document.getElementById("final-months-played").innerText = monthsPlayed + " / 12";
    document.getElementById("final-initial-capital").innerText = formatMoney(gameState.initialCapital);
    document.getElementById("final-wealth").innerText = formatMoney(gameState.currentWealth);

    const finalReturnElement = document.getElementById("final-total-return");
    finalReturnElement.innerText = formatPercent(finalReturn);
    finalReturnElement.className = finalReturn >= 0 ? "positive-text" : "negative-text";

    document.getElementById("final-max-drawdown").innerText =
        "-" + (totalMaxDrawdown * 100).toFixed(2) + "%";

    renderFinalRoleCheck();
    renderFinalMonthlyHistory();
    renderFinalAllocationPie();
    renderFinalStockPerformance();
}


function renderFinalBanner() {
    const banner = document.getElementById("final-result-banner");
    const label = document.getElementById("final-result-label");
    const title = document.getElementById("final-result-title");
    const message = document.getElementById("final-result-message");

    banner.className = "final-result-banner";

    if (gameState.finalStatus === "victory") {
        banner.classList.add("victory");
        label.innerText = "VICTORY";
        title.innerText = "You Achieved Your Investment Goal";
        message.innerText = gameState.finalReason;
    } else if (gameState.finalStatus === "early_game_over") {
        banner.classList.add("early-game-over");
        label.innerText = "EARLY GAME OVER";
        title.innerText = "Game Over in Month " + gameState.month;
        message.innerText = gameState.finalReason;
    } else {
        banner.classList.add("failed");
        label.innerText = "MISSION FAILED";
        title.innerText = "Your Final Return Did Not Meet the Target";
        message.innerText = gameState.finalReason;
    }
}


function renderFinalRoleCheck() {
    const character = getSelectedCharacter();
    const box = document.getElementById("final-role-check-box");

    box.className = "final-role-check-box";

    if (gameState.finalStatus === "victory") {
        box.classList.add("success");

        if (character.mustProfitEveryMonth) {
            box.innerHTML = `
    <strong>Target achieved.</strong><br>
    Required return: ${formatPercent(character.targetReturn)}<br>
    Losing months used: ${gameState.bankerLossMonths} / 3<br>
    Your banker stability condition was successfully completed.
`;
        } else if (gameState.selectedCharacter === "sector_specialist") {
            box.innerHTML = `
    <strong>Target achieved.</strong><br>
    Specialist sector: ${gameState.selectedSpecialistSector}<br>
    Required return: ${formatPercent(character.targetReturn)}<br>
    Non-specialist sector exposure stayed within the 30% rule when portfolios were confirmed.
`;
        } else {
            box.classList.add("failure");

            if (gameState.selectedCharacter === "sector_specialist") {
                box.innerHTML = `
            <strong>Target not achieved.</strong><br>
            Specialist sector: ${gameState.selectedSpecialistSector}<br>
            Required return: ${formatPercent(character.targetReturn)}<br>
            Your final return was below the required target. 
            Your portfolio followed the specialist-sector rule, but the chosen sector strategy did not produce enough return.
        `;
            } else {
                box.innerHTML = `
            <strong>Target not achieved.</strong><br>
            Required return: ${formatPercent(character.targetReturn)}<br>
            Your final return was below the required target.
        `;
            }
        }
    } else if (gameState.finalStatus === "early_game_over") {
        box.classList.add("failure");
        box.innerHTML = `
            <strong>Early failure condition triggered.</strong><br>
            ${gameState.gameOverReason}
        `;
    } else {
        box.classList.add("failure");
        box.innerHTML = `
            <strong>Target not achieved.</strong><br>
            Required return: ${formatPercent(character.targetReturn)}<br>
            Your final return was below the required target.
        `;
    }
}


function calculateFinalMaxDrawdown() {
    if (gameState.monthlyHistory.length === 0) {
        return 0;
    }

    const values = [gameState.initialCapital];

    gameState.monthlyHistory.forEach(function (record) {
        values.push(record.endValue);
    });

    return calculateMaxDrawdown(values);
}


function renderFinalMonthlyHistory() {
    const tbody = document.getElementById("final-monthly-history-body");
    tbody.innerHTML = "";

    gameState.monthlyHistory.forEach(function (record) {
        const row = document.createElement("tr");

        const returnClass = record.monthlyReturn >= 0 ? "positive-text" : "negative-text";

        row.innerHTML = `
            <td>Month ${record.month}</td>
            <td>${record.eventName}</td>
            <td>${formatMoney(record.startValue)}</td>
            <td>${formatMoney(record.endValue)}</td>
            <td class="${returnClass}">${formatPercent(record.monthlyReturn)}</td>
            <td class="negative-text">-${(record.maxDrawdown * 100).toFixed(2)}%</td>
        `;

        tbody.appendChild(row);
    });
}


function renderFinalAllocationPie() {
    const pieChart = document.getElementById("final-sector-pie-chart");
    const legend = document.getElementById("final-sector-legend");

    const remainingCash = calculateRemainingCash();
    const sectorTotals = calculateSectorAllocation(remainingCash);
    const totalValue = calculateTotalStockValue() + remainingCash;

    const sectorColors = {
        Technology: "#3b82f6",
        Finance: "#22c55e",
        Energy: "#f97316",
        Consumer: "#ec4899",
        Cash: "#94a3b8"
    };

    const sectorNames = ["Technology", "Finance", "Energy", "Consumer", "Cash"];

    let currentPercent = 0;
    const gradientParts = [];

    legend.innerHTML = "";

    sectorNames.forEach(function (sectorName) {
        const value = sectorTotals[sectorName];
        const percent = totalValue > 0 ? (value / totalValue) * 100 : 0;

        const start = currentPercent;
        const end = currentPercent + percent;

        gradientParts.push(`${sectorColors[sectorName]} ${start}% ${end}%`);
        currentPercent = end;

        const legendItem = document.createElement("div");
        legendItem.className = "legend-item";

        legendItem.innerHTML = `
            <div class="legend-left">
                <div class="legend-color" style="background-color: ${sectorColors[sectorName]};"></div>
                <div class="legend-name">${sectorName}</div>
            </div>
            <div class="legend-value">${percent.toFixed(1)}%</div>
        `;

        legend.appendChild(legendItem);
    });

    drawSectorPieChart(
        pieChart,
        sectorTotals,
        totalValue,
        sectorColors,
        sectorNames
    );
}


function renderFinalStockPerformance() {
    const list = document.getElementById("final-stock-performance-list");
    list.innerHTML = "";

    Object.keys(stocks).forEach(function (stockKey) {
        const stock = stocks[stockKey];

        const startPrice = gameState.initialStockPrices[stockKey] || stock.price;
        const endPrice = stock.price;
        const returnRate = (endPrice - startPrice) / startPrice;
        const changeClass = returnRate >= 0 ? "positive-text" : "negative-text";

        const card = document.createElement("div");
        card.className = "final-stock-card";

        card.innerHTML = `
            <div>
                <img src="${stock.logo}" alt="${stock.name} logo">
            </div>

            <div>
                <h4>${stock.name} (${stock.ticker})</h4>
                <p>Initial Price: ${formatMoney(startPrice)} → Final Price: ${formatMoney(endPrice)}</p>
                <p class="${changeClass}"><strong>${formatPercent(returnRate)}</strong></p>
            </div>
        `;

        list.appendChild(card);
    });
}


function drawFinalWealthChart() {
    const canvas = document.getElementById("final-wealth-chart-canvas");
    const ctx = canvas.getContext("2d");

    const width = canvas.width;
    const height = canvas.height;

    const marginLeft = 70;
    const marginRight = 30;
    const marginTop = 35;
    const marginBottom = 55;

    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    const values = [gameState.initialCapital];

    gameState.monthlyHistory.forEach(function (record) {
        values.push(record.endValue);
    });

    const maxValue = Math.max(...values) * 1.05;
    const minValue = Math.min(...values) * 0.95;

    const chartWidth = width - marginLeft - marginRight;
    const chartHeight = height - marginTop - marginBottom;

    function xScale(index) {
        const maxIndex = Math.max(values.length - 1, 1);
        return marginLeft + (index / maxIndex) * chartWidth;
    }

    function yScale(value) {
        return marginTop + (maxValue - value) / (maxValue - minValue) * chartHeight;
    }

    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1;

    for (let i = 0; i <= 5; i++) {
        const y = marginTop + (i / 5) * chartHeight;

        ctx.beginPath();
        ctx.moveTo(marginLeft, y);
        ctx.lineTo(width - marginRight, y);
        ctx.stroke();

        const valueLabel = maxValue - (i / 5) * (maxValue - minValue);

        ctx.fillStyle = "#64748b";
        ctx.font = "12px Arial";
        ctx.fillText("$" + valueLabel.toFixed(0), 14, y + 4);
    }

    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(marginLeft, marginTop);
    ctx.lineTo(marginLeft, height - marginBottom);
    ctx.lineTo(width - marginRight, height - marginBottom);
    ctx.stroke();

    ctx.strokeStyle = "#2563eb";
    ctx.lineWidth = 3;
    ctx.beginPath();

    values.forEach(function (value, index) {
        const x = xScale(index);
        const y = yScale(value);

        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });

    ctx.stroke();

    values.forEach(function (value, index) {
        const x = xScale(index);
        const y = yScale(value);

        ctx.fillStyle = "#2563eb";
        ctx.beginPath();
        ctx.arc(x, y, 4.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#334155";
        ctx.font = "12px Arial";

        if (index === 0) {
            ctx.fillText("M0", x - 8, height - 25);
        } else {
            ctx.fillText("M" + index, x - 8, height - 25);
        }
    });
}


function restartGame() {
    if (Object.keys(gameState.initialStockPrices).length > 0) {
        Object.keys(stocks).forEach(function (stockKey) {
            stocks[stockKey].price = gameState.initialStockPrices[stockKey];
        });
    }

    gameState = {
        selectedCharacter: null,
        selectedSpecialistSector: null,
        initialCapital: 0,
        currentWealth: 0,
        month: 1,
        currentMarketState: null,
        currentAnnouncements: [],
        marketStateHistory: [],
        targetReturn: 0,
        mustProfitEveryMonth: false,
        maxDrawdownLimit: null,

        purchaseShares: {},
        remainingCash: 0,
        portfolioStarted: false,

        currentEvent: null,
        eventChoices: [],
        eventSelected: false,

        simulationPaths: {},
        simulationPortfolioValues: [],
        simulationStockResults: {},
        simulationCompleted: false,
        gameOver: false,
        gameOverReason: "",

        monthlyHistory: [],
        initialStockPrices: {},
        finalStatus: null,
        finalReason: "",

        bankerLossMonths: 0,

        managerUsedMonths: {},
        totalManagerFees: 0,
        managerHistory: []
    };

    showScreen("start-screen");
}

// -----------------------------
// Model Library Page
// -----------------------------
function renderLibraryPage() {
    renderLibraryStockParameters();
    renderLibraryEventEffects();
}


function scrollLibrarySection(sectionId) {
    const section = document.getElementById(sectionId);

    if (section) {
        section.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }
}


function formatParameterNumber(value) {
    return Number(value).toFixed(3);
}


function formatSignedParameter(value) {
    const sign = value > 0 ? "+" : "";
    return sign + Number(value).toFixed(3);
}


function formatMultiplier(value) {
    return "×" + Number(value).toFixed(2);
}


function renderLibraryStockParameters() {
    const tbody = document.getElementById("library-stock-parameter-body");

    tbody.innerHTML = "";

    Object.keys(stocks).forEach(function (stockKey) {
        const stock = stocks[stockKey];

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${stock.name} (${stock.ticker})</td>
            <td>${stock.sector}</td>
            <td>${formatParameterNumber(stock.mu)}</td>
            <td>${formatParameterNumber(stock.beta)}</td>
            <td>${formatParameterNumber(stock.gamma)}</td>
            <td>${formatParameterNumber(stock.sigma)}</td>
            <td>${formatParameterNumber(stock.jumpProbability)}</td>
            <td>${formatParameterNumber(stock.jumpMean)}</td>
        `;

        tbody.appendChild(row);
    });
}


function buildEffectChips(effect) {
    const chips = [];

    if (!effect) {
        return chips;
    }

    if (effect.factorChange !== undefined) {
        chips.push("Market Factor " + formatSignedParameter(effect.factorChange));
    }

    if (effect.sectorFactorChange !== undefined) {
        chips.push("Sector Factor " + formatSignedParameter(effect.sectorFactorChange));
    }

    if (effect.muChange !== undefined) {
        chips.push("μ " + formatSignedParameter(effect.muChange));
    }

    if (effect.betaMultiplier !== undefined) {
        chips.push("β " + formatMultiplier(effect.betaMultiplier));
    }

    if (effect.gammaMultiplier !== undefined) {
        chips.push("γ " + formatMultiplier(effect.gammaMultiplier));
    }

    if (effect.sigmaMultiplier !== undefined) {
        chips.push("σ " + formatMultiplier(effect.sigmaMultiplier));
    }

    if (effect.jumpProbabilityChange !== undefined) {
        chips.push("Jump Probability " + formatSignedParameter(effect.jumpProbabilityChange));
    }

    if (effect.jumpMeanChange !== undefined) {
        chips.push("Jump Mean " + formatSignedParameter(effect.jumpMeanChange));
    }

    return chips;
}


function renderEffectGroup(title, effect) {
    const chips = buildEffectChips(effect);

    if (chips.length === 0) {
        return "";
    }

    const chipHtml = chips.map(function (chip) {
        return `<span class="effect-chip">${chip}</span>`;
    }).join("");

    return `
        <div class="library-effect-group">
            <strong>${title}</strong>
            <div class="effect-chip-row">
                ${chipHtml}
            </div>
        </div>
    `;
}


function getEventTypeClass(eventType) {
    if (eventType === "positive") {
        return "event-type-positive";
    }

    if (eventType === "negative") {
        return "event-type-negative";
    }

    if (eventType === "mixed") {
        return "event-type-mixed";
    }

    return "event-type-neutral";
}


function renderLibraryEventEffects() {
    const eventList = document.getElementById("library-event-effect-list");

    eventList.innerHTML = "";

    events.forEach(function (eventItem) {
        const card = document.createElement("div");
        card.className = "library-event-card";

        const effects = eventItem.effects;
        let effectGroups = "";

        if (effects.market) {
            effectGroups += renderEffectGroup("Market", effects.market);
        }

        if (effects.allStocks) {
            effectGroups += renderEffectGroup("All Stocks", effects.allStocks);
        }

        if (effects.sectors) {
            Object.keys(effects.sectors).forEach(function (sectorName) {
                effectGroups += renderEffectGroup(
                    sectorName + " Sector",
                    effects.sectors[sectorName]
                );
            });
        }

        if (effects.stocks) {
            Object.keys(effects.stocks).forEach(function (stockKey) {
                const stock = stocks[stockKey];

                if (stock) {
                    effectGroups += renderEffectGroup(
                        stock.name + " (" + stock.ticker + ")",
                        effects.stocks[stockKey]
                    );
                }
            });
        }

        if (effectGroups === "") {
            effectGroups = `
                <div class="library-effect-group">
                    <strong>No major parameter change</strong>
                    <p>This event keeps the model close to normal market conditions.</p>
                </div>
            `;
        }

        card.innerHTML = `
            <div class="library-event-header">
                <h4>${eventItem.name}</h4>
                <span class="event-type-badge ${getEventTypeClass(eventItem.type)}">
                    ${eventItem.type}
                </span>
            </div>

            <p>${eventItem.description}</p>

            <div class="library-event-impact">
                <strong>Player Interpretation:</strong>
                ${eventItem.playerImpact}
            </div>

            <div class="library-effect-list">
                ${effectGroups}
            </div>
        `;

        eventList.appendChild(card);
    });
}