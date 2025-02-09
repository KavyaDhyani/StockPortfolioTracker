let add_btn_flag = false;
let addStockBtn = document.getElementById("add-stock-button");
let addStockCont = document.querySelector(".add-stock-cont");
let portfolio = [];

const API_KEY = ""; //Add your YH finance rapid api key here


//Getting stock data via YH finance rapid api

async function getStockData(symbol) {
    const url = `https://yahoo-finance15.p.rapidapi.com/api/v1/markets/quote?ticker=${symbol}&type=STOCKS`;
    const options = {
        method: 'GET',
        headers: {
            'x-rapidapi-key': API_KEY,
            'x-rapidapi-host': 'yahoo-finance15.p.rapidapi.com'
        }
    };

    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const result = await response.text();
        const data = JSON.parse(result);

        if (!data.body || !data.body.primaryData) {
            throw new Error("Invalid API response structure");
        }

        const stockInfo = data.body;
        const primaryData = stockInfo.primaryData;

        return {
            symbol: stockInfo.symbol,
            name: stockInfo.companyName || symbol,
            price: parseFloat(primaryData.lastSalePrice.replace('$', '')) || 0,
            change: parseFloat(primaryData.netChange) || 0,
            changePercent: parseFloat(primaryData.percentageChange.replace('%', '')) || 0,
            volume: parseInt(primaryData.volume.replace(/,/g, '')) || 0,
            marketStatus: stockInfo.marketStatus,
            exchange: stockInfo.exchange
        };
    } catch (error) {
        console.error('Error fetching stock data:', error);
        return null;
    }
}


//get stock's past prices

async function getHistoricalData(symbol) {
    const url = `https://yahoo-finance15.p.rapidapi.com/api/v1/markets/stock/history?symbol=${symbol}&interval=1d&diffandsplits=false`;
    
    const options = {
        method: 'GET',
        headers: {
            'x-rapidapi-key': API_KEY,
            'x-rapidapi-host': 'yahoo-finance15.p.rapidapi.com'
        }
    };

    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const result = await response.text();
        const data = JSON.parse(result);
        
        const historyArray = Object.entries(data.body)
            .filter(([timestamp]) => !isNaN(timestamp))
            .map(([timestamp, data]) => ({
                date: parseInt(timestamp),
                close: data.close,
                high: data.high,
                low: data.low,
                open: data.open,
                volume: data.volume
            }))
            .sort((a, b) => a.date - b.date);

        return historyArray;
    } catch (error) {
        console.error('Error fetching historical data:', error);
        return null;
    }
}



// Add stock menu display logic


addStockBtn.addEventListener('click', () => {
    add_btn_flag = !add_btn_flag;
    addStockCont.classList.toggle('hidden', !add_btn_flag);
});

document.addEventListener('click', (e) => {
    if (!addStockCont.contains(e.target) && !addStockBtn.contains(e.target)) {
        addStockCont.classList.add('hidden');
        add_btn_flag = false;
    }
});



// Chart Setup
const chart_context = document.getElementById('portfolio-chart').getContext('2d');
const portfolioChart = new Chart(chart_context, {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'Portfolio Value',
            data: [],
            borderColor: '#4F46E5',
            backgroundColor: 'rgba(79, 70, 229, 0.1)',
            tension: 0.4,
            fill: true
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true,
                labels: {
                    color: '#E5E7EB'
                }
            },
            tooltip: {
                callbacks: {
                    label: context => `$${context.parsed.y.toFixed(2)}`
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: value => `$${value.toFixed(2)}`
                }
            }
        }
    }
});




// Portfolio Management

async function addStockToPortfolio(symbol, quantity, purchaseDate) {
    const stockData = await getStockData(symbol);
    if (!stockData) {
        alert("Failed to fetch stock data. Please try again.");
        return;
    }

    // Get historical data to find the price on purchase date
    const historicalData = await getHistoricalData(symbol);
    if (!historicalData) {
        alert("Failed to fetch historical data. Please try again.");
        return;
    }

    const purchaseTimestamp = new Date(purchaseDate).getTime() / 1000;
    const purchaseDataPoint = historicalData.find(data => 
        data.date >= purchaseTimestamp
    );

    const purchasePrice = purchaseDataPoint ? purchaseDataPoint.close : stockData.price;
    const investment = purchasePrice * quantity;
    
    const existingStock = portfolio.find(stock => stock.symbol === symbol);
    if (existingStock) {
        // Calculate weighted average price
        const totalShares = existingStock.quantity + quantity;
        const totalInvestment = existingStock.investment + investment;
        existingStock.quantity = totalShares;
        existingStock.investment = totalInvestment;
        existingStock.averagePrice = totalInvestment / totalShares;
        existingStock.currentPrice = stockData.price;
        existingStock.dayChange = stockData.change;
        existingStock.dayChangePercent = stockData.changePercent;
    } else {
        portfolio.push({
            symbol,
            name: stockData.name,
            quantity,
            investment,
            averagePrice: purchasePrice,
            currentPrice: stockData.price,
            dayChange: stockData.change,
            dayChangePercent: stockData.changePercent,
            purchaseDate
        });
    }
    
    localStorage.setItem('portfolio', JSON.stringify(portfolio));
    await updatePortfolioPrices();
}


// Updating UI

function updatePortfolioList() {
    const stockList = document.querySelector('.stock-list');
    stockList.innerHTML = '';

    portfolio.forEach(stock => {
        const currentPrice = stock.currentPrice ?? stock.averagePrice;
        const currentValue = stock.quantity * currentPrice;
        
        // Calculating return based on purchase date value
        const purchaseValue = stock.quantity * stock.averagePrice;
        const stockReturn = currentValue - purchaseValue;
        const returnPercentage = (stockReturn / purchaseValue) * 100;

        const stockDiv = document.createElement('div');
        stockDiv.className = 'stock-item';
        stockDiv.innerHTML = `
            <div class="stock-details">
                <h3>${stock.symbol}</h3>
                <p>${stock.quantity} shares @ $${stock.averagePrice.toFixed(2)}</p>
                <p class="purchase-date">Purchased: ${new Date(stock.purchaseDate).toLocaleDateString()}</p>
            </div>
            <div class="stock-current">
                <p>Current: $${currentPrice.toFixed(2)}</p>
                <p>Total Value: $${currentValue.toFixed(2)}</p>
            </div>
            <div class="stock-return ${stockReturn >= 0 ? 'positive' : 'negative'}">
                <p>$${stockReturn.toFixed(2)} (${returnPercentage.toFixed(2)}%)</p>
            </div>
        `;
        stockList.appendChild(stockDiv);
    });
}

//Updating the chart based on gatherd data

async function updateChart() {
    if (portfolio.length === 0) {
        portfolioChart.data.labels = [];
        portfolioChart.data.datasets[0].data = [];
        portfolioChart.update();
        return;
    }

    try {
        const allHistoricalData = await Promise.all(
            portfolio.map(stock => getHistoricalData(stock.symbol))
        );

        const validHistoricalData = allHistoricalData.filter(data => data && data.length > 0);

        if (validHistoricalData.length === 0) {
            console.error('No valid historical data received');
            return;
        }

        const dailyTotals = new Map();

        portfolio.forEach((stock, stockIndex) => {
            const stockHistory = validHistoricalData[stockIndex];
            if (!stockHistory) return;

            const purchaseTimestamp = new Date(stock.purchaseDate).getTime() / 1000;

            stockHistory.forEach(dayData => {
                // Only include data from purchase date onwards
                if (dayData.date >= purchaseTimestamp) {
                    const dateStr = new Date(dayData.date * 1000).toLocaleDateString();
                    const currentValue = dayData.close * stock.quantity;
                    
                    if (dailyTotals.has(dateStr)) {
                        dailyTotals.set(dateStr, dailyTotals.get(dateStr) + currentValue);
                    } else {
                        dailyTotals.set(dateStr, currentValue);
                    }
                }
            });
        });

        const sortedEntries = Array.from(dailyTotals.entries())
            .sort((a, b) => new Date(a[0]) - new Date(b[0]));

        portfolioChart.data.labels = sortedEntries.map(entry => entry[0]);
        portfolioChart.data.datasets[0].data = sortedEntries.map(entry => entry[1]);
        portfolioChart.update();

    } catch (error) {
        console.error('Error updating chart:', error);
    }
}


//Updating summary-cards

function updateSummary() {
    if (!portfolio.length) {
        document.getElementById("invested-value").textContent = "$0.00";
        document.getElementById("current-value").textContent = "$0.00";
        document.getElementById("value-change").textContent = "$0.00";
        document.getElementById("total-returns").textContent = "$0.00";
        document.getElementById("number-of-stocks").textContent = "0";
        return;
    }

    const totalInvested = portfolio.reduce((sum, stock) => sum + stock.investment, 0);
    const currentValue = portfolio.reduce((sum, stock) => 
        sum + (stock.quantity * (stock.currentPrice || stock.averagePrice)), 0);
    const totalReturn = currentValue - totalInvested;
    const change24h = portfolio.reduce((sum, stock) => 
        sum + ((stock.dayChange || 0) * stock.quantity), 0);

    document.getElementById("invested-value").textContent = `$${totalInvested.toFixed(2)}`;
    document.getElementById("current-value").textContent = `$${currentValue.toFixed(2)}`;
    
    const valueChangeEl = document.getElementById("value-change");
    valueChangeEl.textContent = `${change24h >= 0 ? "+" : ""}$${change24h.toFixed(2)}`;
    valueChangeEl.style.color = change24h >= 0 ? "#10B981" : "#EF4444";

    const totalReturnsEl = document.getElementById("total-returns");
    totalReturnsEl.textContent = `${totalReturn >= 0 ? "+" : ""}$${totalReturn.toFixed(2)}`;
    totalReturnsEl.style.color = totalReturn >= 0 ? "#10B981" : "#EF4444";

    document.getElementById("number-of-stocks").textContent = portfolio.length.toString();
}


//Updating stock list

async function updatePortfolioPrices() {
    try {
        for (let stock of portfolio) {
            const stockData = await getStockData(stock.symbol);
            if (stockData) {
                stock.currentPrice = stockData.price;
                stock.dayChange = stockData.change;
                stock.dayChangePercent = stockData.changePercent;
            }
        }
        
        localStorage.setItem('portfolio', JSON.stringify(portfolio));
        updatePortfolioList();
        updateSummary();
        await updateChart();
    } catch (error) {
        console.error('Error updating portfolio prices:', error);
    }
}



// Form Handling
document.getElementById("add-stock-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const symbol = document.getElementById("stock-symbol").value.toUpperCase();
    const quantity = parseInt(document.getElementById("stock-quantity").value);
    const purchaseDate = document.getElementById("stock-purchase-date").value;
    
    await addStockToPortfolio(symbol, quantity, purchaseDate);
    
    addStockCont.classList.add("hidden");
    add_btn_flag = false;
    e.target.reset();
});


// Initialization
portfolio = JSON.parse(localStorage.getItem("portfolio")) || [];
updatePortfolioPrices();
setInterval(updatePortfolioPrices, 60000);