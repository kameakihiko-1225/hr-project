const noop = (req, res) => res.status(501).json({ success: false, error: 'Not implemented in tests' });

module.exports = {
  getAllCampaigns: noop,
  createCampaign: noop,
  getCampaignById: noop,
  updateCampaign: noop,
  deleteCampaign: noop,
  createScheduledMessage: noop,
  getScheduledMessageById: noop,
  updateScheduledMessage: noop,
  deleteScheduledMessage: noop,
  uploadMedia: noop,
  sendDirectMessage: noop,
  getCandidatesByFilters: noop,
}; 