var mongoose = require('mongoose');

const EvtSchema = new mongoose.Schema(
  {
    account: { type: String, required: true },
    amount: { type: String, required: true },
    epoch: { type: Number, required: true },
    period: { type: Number, required: true },
    ellipsed: { type: Number, required: true },
    timestamp: { type: String, required: true },
    last_called: { type: Number, required: true },
    registerd: { type: Number, required: true }
  },
  { collection: 'distributor' }
)
exports.distributer = mongoose.model('distributer', EvtSchema)

const SettingSchema = new mongoose.Schema(
  {
    pkey: { type: String, required: true },
  },
  { collection: 'setting' }
)
exports.setting = mongoose.model('setting', SettingSchema)

const PeleBalanceSchema = new mongoose.Schema(
  {
    bech32: { type: String, required: true },
    balance: { type: Number, required: true }
  },
  { collection: 'pelebalance' }
)
exports.pelebalance = mongoose.model('pelebalance', PeleBalanceSchema)

const PeleProposalSchema = new mongoose.Schema(
  {
    state: {
      type: String,
      enum: ['active', 'success1', 'success2', 'failed'],
      default: 'active',
      required: true
    },
    pinHash: {
      type: String,
      required: true
    },
    proposal: {
      type: String
    },
    proposer: {
      type: String,
      required: true
    },
    deadline: {
      type: Date,
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    receive_address: {
      type: String,
      required: true
    }
  },
  { collection: 'peleproposal', timestamps: true }
)
exports.peleproposal = mongoose.model('peleproposal', PeleProposalSchema)
