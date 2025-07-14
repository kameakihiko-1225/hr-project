# Phase 1: Automation/Reminder System Implementation

## 🚀 **Overview**

The automation/reminder system provides intelligent candidate re-engagement through scheduled messages, activity tracking, and automated follow-ups. This Phase 1 implementation includes the core infrastructure for candidate retention and conversion optimization.

## 🔧 **Core Components**

### **1. Reminder Service** (`src/api/bots/reminderService.js`)

**Features:**
- **Activity Tracking**: Real-time candidate activity monitoring across all conversation stages
- **Smart Intervals**: 5-level reminder system (1h, 2h, 3h, 5h, 8h) with escalating urgency
- **Context-Aware Messages**: Personalized reminders using candidate and position data
- **Multilingual Support**: English, Russian, and Uzbek reminder templates
- **Duplicate Prevention**: Prevents sending multiple reminders of the same type within 24 hours

**Key Functions:**
```javascript
// Update candidate activity and status
updateCandidateActivity(telegramId, status)

// Get candidates needing reminders
getInactiveCandidates()

// Calculate appropriate reminder interval
calculateReminderInterval(lastActivity)

// Schedule context-aware reminders
scheduleReminder(candidate, reminderInterval)

// Main processing function
processReminders()
```

### **2. Reminder Scheduler** (`src/api/bots/reminderScheduler.js`)

**Features:**
- **Cron-based Scheduling**: Runs every 30 minutes using `node-cron`
- **Graceful Shutdown**: Proper cleanup on server termination
- **Manual Triggers**: Admin-controlled processing for testing/maintenance
- **Error Resilience**: Continues processing even if individual reminders fail

**Configuration:**
```javascript
// Runs every 30 minutes
cron.schedule('*/30 * * * *', processReminders)
```

### **3. Activity Tracking Integration**

**Tracking Points:**
- **Navigation Started**: User begins company/department browsing
- **Phase 1 Started**: Interview process initiated
- **Phase 1 Partial**: 50%+ questions answered
- **Phase 1 Completed**: All basic questions finished
- **Phase 2 Started**: AI interview begins
- **Phase 2 Partial**: 50%+ AI questions answered
- **Phase 2 Completed**: Full interview process finished

## 📋 **Reminder Intervals & Messages**

### **Interval Configuration**
| **Interval** | **Type** | **Purpose** |
|--------------|----------|-------------|
| 1 hour | `gentle_nudge` | Friendly check-in |
| 2 hours | `helpful_reminder` | Process benefits highlight |
| 3 hours | `progress_check` | Competitive urgency |
| 5 hours | `final_opportunity` | Strong call-to-action |
| 8 hours | `last_chance` | Final warning |

### **Message Templates**

**Example (English):**
```
👋 Hi John! Just wanted to check in - you started your application 
for Software Engineer at TechCorp. Ready to continue? Just send 
any message to pick up where you left off! 😊
```

**Personalization Elements:**
- Candidate name (fullName or telegramUsername)
- Position title
- Company name
- Progress-specific context
- Language preference

## 🔗 **API Endpoints**

### **Admin Management**
```
GET    /api/admin/reminders/status      # System status & statistics
POST   /api/admin/reminders/trigger     # Manual processing
GET    /api/admin/reminders/inactive    # List inactive candidates
POST   /api/admin/reminders/send        # Send custom reminder
GET    /api/admin/reminders/messages    # Message history
PATCH  /api/admin/reminders/activity    # Update candidate activity
```

### **Status Response Example**
```json
{
  "success": true,
  "data": {
    "scheduler": {
      "running": true,
      "nextExecution": "Every 30 minutes"
    },
    "inactiveCandidatesCount": 12,
    "last24Hours": {
      "messageStats": [...],
      "candidateStats": [...]
    },
    "intervals": [...],
    "timestamp": "2025-01-XX..."
  }
}
```

## 🎯 **Candidate Status Flow**

```
new → navigation_started → phase1_started → phase1_partial 
→ phase1_completed → phase2_started → phase2_partial 
→ phase2_completed → interview_completed
```

**Inactive Thresholds:**
- **30 minutes**: Candidate considered inactive
- **1-8 hours**: Progressive reminder escalation
- **8+ hours**: No further automated reminders

## 🚀 **Integration Points**

### **Webhook Handler Integration**
```javascript
// Activity tracking added to:
- navigationConversation()      // Navigation activity
- startInterviewFlow()          // Interview start
- phase1InterviewConversation() // Question progress
- completePhase1Interview()     // Phase 1 completion
- phase2InterviewConversation() // Phase 2 activity
- processPhase2Response()       // Response progress
- completePhase2Interview()     // Phase 2 completion
```

### **Server Startup Integration**
```javascript
// Automatic initialization in server.js
initPrisma().then(success => {
  if (success) {
    reminderScheduler.initializeScheduler();
  }
});
```

## 📊 **Database Schema Usage**

### **MessageQueue Table**
```sql
- candidateId: Foreign key to candidate
- message: Reminder text content
- type: Reminder interval type
- scheduledFor: When to send
- sent: Delivery status
```

### **Candidate Updates**
```sql
- lastActivity: Updated on every interaction
- status: Tracks progress through interview
```

## 🔧 **Configuration**

### **Environment Variables**
```bash
# No additional environment variables required
# Uses existing DATABASE_URL and bot tokens
```

### **Timing Configuration**
```javascript
// In reminderService.js
REMINDER_INTERVALS = [
  { hours: 1, type: 'gentle_nudge' },
  { hours: 2, type: 'helpful_reminder' },
  { hours: 3, type: 'progress_check' },
  { hours: 5, type: 'final_opportunity' },
  { hours: 8, type: 'last_chance' }
];
```

## 🧪 **Testing**

### **Manual Testing**
```bash
# Check scheduler status
GET /api/admin/reminders/status

# Trigger manual processing
POST /api/admin/reminders/trigger

# View inactive candidates
GET /api/admin/reminders/inactive
```

### **Development Testing**
```javascript
// Adjust timing for testing (in reminderScheduler.js)
cron.schedule('*/1 * * * *', processReminders); // Every minute
```

## 📈 **Performance Considerations**

### **Optimization Features**
- **Batch Processing**: Max 50 messages per cycle
- **Error Isolation**: Individual reminder failures don't stop processing
- **Duplicate Prevention**: Smart checking to avoid spam
- **Efficient Queries**: Optimized database queries with proper indexing

### **Monitoring Metrics**
- Candidates processed per cycle
- Reminders scheduled vs sent
- Error rates and types
- Message delivery success rates

## 🔮 **Future Enhancements** (Phase 2+)

### **Advanced Features**
- **Smart Timing**: ML-based optimal send times
- **A/B Testing**: Message template optimization
- **Escalation Rules**: Custom reminder sequences per position
- **Analytics Dashboard**: Detailed engagement metrics
- **Integration APIs**: Webhook notifications for external systems

### **Potential Improvements**
- **Dynamic Intervals**: Adjust based on candidate behavior
- **Segmentation**: Different strategies for different candidate types
- **Response Tracking**: Monitor which messages drive re-engagement
- **Channel Expansion**: Email, SMS, push notification support

## ✅ **Implementation Status**

**Phase 1 Complete ✅**
- [x] Core reminder service with smart intervals
- [x] Cron-based scheduler with graceful shutdown
- [x] Activity tracking integration throughout conversation flow
- [x] Multilingual context-aware message generation
- [x] Admin API endpoints for monitoring and control
- [x] Automatic server startup integration
- [x] Comprehensive error handling and resilience

**Ready for Production ✅**
- System automatically starts with server
- Processes reminders every 30 minutes
- Tracks all candidate interactions
- Prevents duplicate messages
- Provides admin oversight and control

The automation/reminder system is now fully operational and will help re-engage candidates who drop off during the interview process, significantly improving conversion rates and candidate experience. 