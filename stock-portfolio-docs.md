# Stock Portfolio Tracker

This is a Stock Portfolio Tracker that allows users to track their stock investments, view performance metrics, and visualize portfolio value over time. It uses the Yahoo Finance Rapid API to fetch real-time and historical stock data.

## Features

- Real-time stock price tracking
- Historical price data visualization
- Portfolio performance metrics
- Local storage persistence
- Interactive chart display
- Automatic price updates

## API Reference

### `getStockData(symbol)`

Fetches current stock data from Yahoo Finance Rapid API.

#### Parameters

- `symbol` (string): The stock symbol to fetch data for (e.g., "AAPL", "GOOGL")

#### Returns

Promise that resolves to an object containing:

```javascript
{
    symbol: string,          // Stock symbol
    name: string,           // Company name
    price: number,          // Current stock price
    change: number,         // Price change
    changePercent: number,  // Percentage change
    volume: number,         // Trading volume
    marketStatus: string,   // Current market status
    exchange: string        // Stock exchange
}
```

### `getHistoricalData(symbol)`

Retrieves historical price data for a given stock.

#### Parameters

- `symbol` (string): The stock symbol to fetch historical data for

#### Returns

Promise that resolves to an array of objects:

```javascript
[{
    date: number,          // Unix timestamp
    close: number,         // Closing price
    high: number,          // Day's high
    low: number,           // Day's low
    open: number,          // Opening price
    volume: number         // Trading volume
}]
```

### `addStockToPortfolio(symbol, quantity, purchaseDate)`

Adds a new stock position to the portfolio or updates an existing one.

#### Parameters

- `symbol` (string): Stock symbol
- `quantity` (number): Number of shares
- `purchaseDate` (string): Date of purchase in ISO format

#### Returns

Promise that resolves when the stock has been added and the UI has been updated.

### Portfolio Management Functions

#### `updatePortfolioPrices()`

Updates current prices and performance metrics for all stocks in the portfolio.

#### `updatePortfolioList()`

Refreshes the UI display of portfolio stocks.

#### `updateChart()`

Updates the portfolio value chart with historical data.

#### `updateSummary()`

Updates the summary cards showing portfolio metrics.

## Data Structures

### Portfolio Item

Each stock in the portfolio is represented by an object:

```javascript
{
    symbol: string,           // Stock symbol
    name: string,            // Company name
    quantity: number,        // Number of shares
    investment: number,      // Total investment amount
    averagePrice: number,    // Average purchase price
    currentPrice: number,    // Current stock price
    dayChange: number,       // Price change today
    dayChangePercent: number, // Percentage change today
    purchaseDate: string     // Date of purchase
}
```

## Usage Example

```javascript
// Initialize the tracker
const API_KEY = "your-api-key-here";

// Add a new stock position
await addStockToPortfolio("AAPL", 10, "2024-02-09");

// Manual refresh of portfolio data
await updatePortfolioPrices();
```

## Configuration

### Required Setup

1. Set your Yahoo Finance Rapid API key:
```javascript
const API_KEY = "your-rapid-api-key";
```

2. The application automatically updates prices every minute:
```javascript
setInterval(updatePortfolioPrices, 60000);
```

## UI Components

### Chart Configuration

The portfolio chart is configured using Chart.js with the following options:

- Line chart with area fill
- Responsive design
- Custom tooltip formatting
- Y-axis values formatted as currency

### Summary Cards

Displays:
- Total invested value
- Current portfolio value
- 24-hour value change
- Total returns
- Number of stocks

## Event Handlers

### Add Stock Form

```javascript
document.getElementById("add-stock-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    // Form processing logic
});
```

### Add Stock Button

```javascript
addStockBtn.addEventListener('click', () => {
    add_btn_flag = !add_btn_flag;
    addStockCont.classList.toggle('hidden', !add_btn_flag);
});
```

## Local Storage

The portfolio data is persisted in localStorage:

- Key: `'portfolio'`
- Value: JSON string of portfolio array

## Error Handling

The application includes error handling for:
- API request failures
- Invalid data responses
- Missing historical data
- Network errors

Each API call is wrapped in try-catch blocks with appropriate error logging and user feedback.
