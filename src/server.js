// SMS Campaign Management Routes
app.get('/api/sms/campaigns', authMiddleware, smsHandler.getAllCampaigns);
app.post('/api/sms/campaigns', authMiddleware, smsHandler.createCampaign);
app.get('/api/sms/campaigns/:id', authMiddleware, smsHandler.getCampaignById);
app.put('/api/sms/campaigns/:id', authMiddleware, smsHandler.updateCampaign);
app.delete('/api/sms/campaigns/:id', authMiddleware, smsHandler.deleteCampaign);
app.post('/api/sms/campaigns/:id/media', authMiddleware, upload.single('media'), smsHandler.uploadMedia);
app.post('/api/sms/campaigns/:campaignId/messages', authMiddleware, smsHandler.createScheduledMessage);
app.post('/api/sms/messages/:id/execute', authMiddleware, smsHandler.executeScheduledMessage);
app.post('/api/sms/candidates/filter', authMiddleware, smsHandler.getCandidatesByFilters);
app.post('/api/sms/direct/:campaignId/:candidateId', authMiddleware, smsHandler.sendDirectMessage);  