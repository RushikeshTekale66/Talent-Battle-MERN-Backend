const express = require('express');
const ProductData = require('./DB/ProductData');
const bodyParser = require('body-parser');
const cors = require('cors');
require('./DB/connect')


const app = express();
app.use(cors())
app.use(bodyParser.json());

const port = 5000;

// Setting the data from third party api to local api
async function getProduct() {
    const thirdPartyApi = await fetch("https://s3.amazonaws.com/roxiler.com/product_transaction.json");
    const response = await thirdPartyApi.json();

    for (let i = 0; i < response.length; i++) {
        const productData = new ProductData({
            id: response[i]['id'],
            title: response[i]['title'],
            price: response[i]['price'],
            description: response[i]['description'],
            category: response[i]['category'],
            image: response[i]['image'],
            sold: response[i]['sold'],
            dateOfSale: response[i]['dateOfSale']
        })
        productData.save();
    }
}

// Send Data third party api to local database
app.get('/sendDataToApi', (req, res) => {
    res.send("App is live");
    getProduct();
})

// Get all data from database
app.get('/getalldata', async (req, res) => {
    let result = await ProductData.find();
    res.send(result);
    for (let i = 0; i < result.length; i++) {
        console.log(result[i].category);
    }
})

// Search api 
app.get('/search/:key', async (req, res) => {
    try {
        const escapedKey = escapeRegex(req.params.key);
        const result = await ProductData.find({
            "$or": [
                { title: { $regex: escapedKey } },
                { price: { $regex: escapedKey } },
                { description: { $regex: escapedKey } },
            ]
        });
        res.send(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});
function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

// Get data from database by the perticular month
app.get('/search/month/:month', async (req, res) => {
    let month = parseInt(req.params.month);
    try {
        const result = await ProductData.aggregate([{
            $match: {
                $expr: { $eq: [{ $month: '$dateOfSale' }, month] }
            }
        }
        ])
        res.send(result);
    }
    catch (err) {
        console.error('Error fetching dates from MongoDB:', err);
        res.status(500).send({ error: 'Error fetching dates from database' });
    }
})

// Get the sale data for Statistic analysis
app.get('/saledata', async (req, res) => {
    let month = parseInt(req.query.month);
    try {
        const result = await ProductData.aggregate([{
            $match: {
                $expr: { $eq: [{ $month: '$dateOfSale' }, month] }
            }
        }
        ])
        let totalSaleAmount = 0;
        let totalSoldItemCount = 0;
        let totalNotSoldItemCount = 0;
        for (let i = 0; i < result.length; i++) {
            totalSaleAmount += parseInt(result[i].price);
            if (result[i].sold) {
                totalSoldItemCount++;
            }
            else {
                totalNotSoldItemCount++;
            }
        }
        res.json({
            total_sale_amount: totalSaleAmount,
            total_items_sold: totalSoldItemCount,
            total_items_not_sold: totalNotSoldItemCount
        });
        console.log("totalSaleAmount ", totalSaleAmount);
        console.log("Total Not Sold ", totalNotSoldItemCount);
        console.log("Total Sold", totalSoldItemCount);
    }
    catch (err) {
        console.error('Error fetching dates from MongoDB:', err);
        res.status(500).send({ error: 'Error fetching dates from database' });
    }

})

// Data for bar chart
app.get('/barchart', async (req, res) => {
    let month = parseInt(req.query.month);
    try {
        const result = await ProductData.aggregate([{
            $match: {
                $expr: { $eq: [{ $month: '$dateOfSale' }, month] }
            }
        }
        ])
        const priceRanges = {
            "0-100": 0,
            "101-200": 0,
            "201-300": 0,
            "301-400": 0,
            "401-500": 0,
            "501-600": 0,
            "601-700": 0,
            "701-800": 0,
            "801-900": 0,
            "901-above": 0
        };

        result.forEach(sale => {
            if (sale.price >= 0 && sale.price <= 100) {
                priceRanges["0-100"]++;
            } else if (sale.price >= 101 && sale.price <= 200) {
                priceRanges["101-200"]++;
            } else if (sale.price >= 201 && sale.price <= 300) {
                priceRanges["201-300"]++;
            } else if (sale.price >= 301 && sale.price <= 400) {
                priceRanges["301-400"]++;
            } else if (sale.price >= 401 && sale.price <= 500) {
                priceRanges["401-500"]++;
            } else if (sale.price >= 501 && sale.price <= 600) {
                priceRanges["501-600"]++;
            } else if (sale.price >= 601 && sale.price <= 700) {
                priceRanges["601-700"]++;
            } else if (sale.price >= 701 && sale.price <= 800) {
                priceRanges["701-800"]++;
            } else if (sale.price >= 801 && sale.price <= 900) {
                priceRanges["801-900"]++;
            } else {
                priceRanges["901-above"]++;
            }
        });

        res.json(priceRanges);
    }
    catch (err) {
        console.error('Error fetching dates from MongoDB:', err);
        res.status(500).send({ error: 'Error fetching dates from database' });
    }
})

// Data for pie chart
app.get('/piechart/:month', async (req, res) => {
    let month = parseInt(req.params.month);
    try {
        const result = await ProductData.aggregate([{
            $match: {
                $expr: { $eq: [{ $month: '$dateOfSale' }, month] }
            }
        }
        ])
        const categoryCounts = {};
        result.forEach(data => {
            if (categoryCounts[data.category]) {
                categoryCounts[data.category]++;
            } else {
                categoryCounts[data.category] = 1;
            }
        });

        res.json(categoryCounts);
    }
    catch (err) {
        console.error('Error fetching dates from MongoDB:', err);
        res.status(500).send({ error: 'Error fetching dates from database' });
    }
})

app.listen(port);