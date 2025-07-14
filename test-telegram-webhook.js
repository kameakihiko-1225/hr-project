import fetch from 'node-fetch';

const botId = '949a5b42-be45-4a9c-b56f-503c6c21d6a5';
const webhookUrl = `https://532c228aaf0b.ngrok-free.app/api/telegram/webhook/${botId}`;

// Test a regular message
const messageUpdate = {
  update_id: 886893230,
  message: {
    message_id: 124,
    from: {
      id: 12345,
      is_bot: false,
      first_name: 'Test',
      username: 'testuser'
    },
    chat: {
      id: 12345,
      first_name: 'Test',
      username: 'testuser',
      type: 'private'
    },
    date: Math.floor(Date.now() / 1000),
    text: '/start'
  }
};

// Test a callback query
const callbackUpdate = {
  update_id: 886893231,
  callback_query: {
    id: '123456',
    from: {
      id: 12345,
      is_bot: false,
      first_name: 'Test',
      username: 'testuser'
    },
    message: {
      message_id: 123,
      from: {
        id: 7987314115,
        is_bot: true,
        first_name: 'Millat Umidi HR',
        username: 'millatumidi_hr_bot'
      },
      chat: {
        id: 12345,
        first_name: 'Test',
        username: 'testuser',
        type: 'private'
      },
      date: Math.floor(Date.now() / 1000),
      text: 'Test message'
    },
    chat_instance: '123456',
    data: 'company_12345'
  }
};

async function sendUpdate(update) {
  try {
    console.log(`Sending update to ${webhookUrl}...`);
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(update),
    });
    
    console.log(`Response status: ${response.status}`);
    const text = await response.text();
    console.log(`Response body: ${text}`);
  } catch (error) {
    console.error('Error sending update:', error);
  }
}

// Send both updates
async function main() {
  console.log('Sending message update...');
  await sendUpdate(messageUpdate);
  
  console.log('\nSending callback update...');
  await sendUpdate(callbackUpdate);
}

main(); 