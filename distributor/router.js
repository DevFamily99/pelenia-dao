var express = require('express');
var router = express.Router();

const { setDistributor, calPeleVoteRate, createPeleProposal } = require('./controller/distributor');
router.post('/setDistributor', setDistributor);
router.get('/calPeleVoteRate', calPeleVoteRate);
router.post('/createProposal', createPeleProposal);

module.exports = router;
