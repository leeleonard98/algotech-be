const router = require('express').Router();
const cors = require('cors');
const shopifyController = require('../controllers/shopifyController');

router.post('/orders', shopifyController.addShopifyOrders);
router.post('/', shopifyController.createOrderWebhook);
router.get('/webhook', cors(), shopifyController.sendOrderWebhook);
module.exports = router;
