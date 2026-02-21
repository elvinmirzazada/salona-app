import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import UserProfile from '../components/UserProfile';
import { useUser } from '../contexts/UserContext';
import { apiClient } from '../utils/api';
import '../styles/telegram-bot.css';
//
// interface TelegramConfig {
//   bot_token?: string;
//   chat_id?: string;
//   status?: string;
// }

const TelegramBotPage: React.FC = () => {
  const { user, loading: userLoading, unreadNotificationsCount } = useUser();
  const [loading, setLoading] = useState(true);
  // const [saving, setSaving] = useState(false);
  const [botToken, setBotToken] = useState('');
  const [chatId, setChatId] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  useEffect(() => {
    if (!userLoading && user) {
      if (user.company_id) {
        loadTelegramConfig();
      } else {
        setLoading(false);
      }
    } else if (!userLoading) {
      setLoading(false);
    }
  }, [user, userLoading]);

  const loadTelegramConfig = async () => {
    try {
      const response = await apiClient.get('/v1/telegram/bot');
      const data = response.data;
      if (data.success && data.data) {
        setBotToken(data.data.bot_token || '');
        setChatId(data.data.chat_id || '');
        setIsConnected(data.data.status === 'active');
      }
    } catch (error) {
      console.error('Error loading Telegram config:', error);
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error' | 'info', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Feature is currently disabled
    showMessage('info', 'This feature is currently under development and will be available soon.');
    return;

    // Uncomment when feature is ready:
    /*
    if (!botToken.trim()) {
      showMessage('error', 'Please enter a valid bot token');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/v1/telegram/bot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          bot_token: botToken,
          chat_id: chatId || null
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showMessage('success', 'Telegram bot configuration saved successfully!');
        setIsConnected(true);
      } else {
        showMessage('error', data.message || 'Failed to save configuration');
      }
    } catch (error) {
      console.error('Error saving Telegram config:', error);
      showMessage('error', 'Error saving configuration');
    } finally {
      setSaving(false);
    }
    */
  };

  if (loading || userLoading) {
    return (
      <>
        <Sidebar user={user} unreadNotificationsCount={unreadNotificationsCount} />
        <div className="page-with-sidebar">
          <div className="loading-spinner">
            <i className="fas fa-spinner fa-spin"></i>
          </div>
        </div>
      </>
    );
  }

  if (!user?.company_id) {
    return (
      <>
        <Sidebar user={user} unreadNotificationsCount={unreadNotificationsCount} />
        <div className="page-with-sidebar">
          <div className="telegram-bot-page">
            <div className="page-header">
              <div>
                <h1>Telegram Bot</h1>
                <p>You need to create a company first to use Telegram bot integration.</p>
              </div>
              <UserProfile user={user} />
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Sidebar user={user} unreadNotificationsCount={unreadNotificationsCount} />
      <div className="page-with-sidebar">
        <div className="telegram-bot-page">
          <div className="page-header">
            <div>
              <h1>Telegram Bot</h1>
              <p>Connect your Telegram bot to receive booking notifications</p>
            </div>
            <UserProfile user={user} />
          </div>

          {message && (
            <div className={`message ${message.type}`}>
              <i className={`fas ${
                message.type === 'success' ? 'fa-check-circle' :
                message.type === 'error' ? 'fa-exclamation-circle' :
                'fa-info-circle'
              }`}></i>
              <span>{message.text}</span>
            </div>
          )}

          <div className="telegram-card">
            <div className="telegram-card-header">
              <div>
                <h3>
                  <i className="fab fa-telegram"></i>
                  Telegram Bot Configuration
                </h3>
                <p>Connect your Telegram bot to receive booking notifications and manage appointments.</p>
              </div>
              <span className={`status-badge ${isConnected ? 'connected' : 'disconnected'}`}>
                <i className="fas fa-circle"></i>
                {isConnected ? 'Connected' : 'Not Connected'}
              </span>
            </div>

            {/* Coming Soon Badge */}
            <div className="info-badge warning">
              <i className="fas fa-info-circle"></i>
              This feature is currently under development and will be available soon.
            </div>

            <div className="telegram-setup">
              <div className="setup-step">
                <div className="step-number">1</div>
                <div className="step-content">
                  <h4>Create a Telegram Bot</h4>
                  <p>
                    Open Telegram and search for <strong>@BotFather</strong>. Send the command <code>/newbot</code> and follow the instructions to create your bot.
                  </p>
                </div>
              </div>

              <div className="setup-step">
                <div className="step-number">2</div>
                <div className="step-content">
                  <h4>Get Your Bot Token</h4>
                  <p>
                    After creating the bot, BotFather will provide you with an API token. Copy this token.
                  </p>
                </div>
              </div>

              <div className="setup-step">
                <div className="step-number">3</div>
                <div className="step-content">
                  <h4>Configure Your Bot</h4>
                  <form className="telegram-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                      <label htmlFor="bot-token">Bot Token</label>
                      <input
                        type="text"
                        id="bot-token"
                        name="bot-token"
                        placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                        value={botToken}
                        onChange={(e) => setBotToken(e.target.value)}
                        disabled
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="chat-id">Chat ID (Optional)</label>
                      <input
                        type="text"
                        id="chat-id"
                        name="chat-id"
                        placeholder="Your Telegram Chat ID"
                        value={chatId}
                        onChange={(e) => setChatId(e.target.value)}
                        disabled
                      />
                      <small>Leave empty to receive notifications in bot chat</small>
                    </div>

                    <button type="submit" className="save-button" disabled>
                      <i className="fas fa-save"></i>
                      {/*{saving ? 'Saving...' : 'Save Configuration'}*/}
                    </button>
                  </form>
                </div>
              </div>
            </div>

            <div className="info-box">
              <p><strong>What you'll receive:</strong></p>
              <p>• Real-time notifications for new bookings</p>
              <p>• Booking confirmations and cancellations</p>
              <p>• Daily schedule summaries</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TelegramBotPage;
