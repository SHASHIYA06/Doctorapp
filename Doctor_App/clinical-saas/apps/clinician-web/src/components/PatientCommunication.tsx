/**
 * Patient Communication Component
 * Manages real-time messaging, consultation scheduling, and patient-doctor communication
 */

import React, { useState, useRef, useEffect } from 'react';
import '../styles/PatientCommunication.css';

interface Message {
  id: string;
  conversationId: string;
  sender: 'doctor' | 'patient';
  senderName: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  attachments?: {
    type: 'image' | 'document' | 'report';
    name: string;
    url: string;
  }[];
}

interface Conversation {
  id: string;
  patientName: string;
  patientId: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  status: 'active' | 'closed' | 'archived';
  avatar?: string;
}

interface ConsultationSlot {
  id: string;
  date: string;
  time: string;
  duration: number;
  patientName: string;
  type: 'online' | 'offline';
  status: 'available' | 'booked' | 'completed';
  notes?: string;
}

type ViewMode = 'conversations' | 'messages' | 'scheduling';

const statusColors: Record<string, { bg: string; color: string; text: string }> = {
  active: { bg: '#d1fae5', color: '#065f46', text: 'Active' },
  closed: { bg: '#fee2e2', color: '#7f1d1d', text: 'Closed' },
  archived: { bg: '#f3e8ff', color: '#6b21a8', text: 'Archived' }
};

export const PatientCommunication: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('conversations');
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mock conversations data
  const [conversations] = useState<Conversation[]>([
    {
      id: '1',
      patientName: 'Rajesh Kumar',
      patientId: 'P001',
      lastMessage: 'Thank you doctor, I will follow the treatment plan.',
      lastMessageTime: '2024-01-15 14:30',
      unreadCount: 0,
      status: 'active'
    },
    {
      id: '2',
      patientName: 'Priya Sharma',
      patientId: 'P002',
      lastMessage: 'Can I schedule a follow-up consultation?',
      lastMessageTime: '2024-01-15 13:45',
      unreadCount: 2,
      status: 'active'
    },
    {
      id: '3',
      patientName: 'Amit Patel',
      patientId: 'P003',
      lastMessage: 'Prescription received. Starting medication today.',
      lastMessageTime: '2024-01-14 16:20',
      unreadCount: 0,
      status: 'closed'
    },
    {
      id: '4',
      patientName: 'Sneha Desai',
      patientId: 'P004',
      lastMessage: 'Can you review my recent lab reports?',
      lastMessageTime: '2024-01-14 11:15',
      unreadCount: 1,
      status: 'active'
    }
  ]);

  // Mock messages data
  const [messagesByConversation] = useState<Record<string, Message[]>>({
    '1': [
      {
        id: 'm1',
        conversationId: '1',
        sender: 'doctor',
        senderName: 'Dr. Vikram Singh',
        content: 'Hello Rajesh, I have reviewed your reports. Let me explain your condition.',
        timestamp: '2024-01-15 10:00',
        isRead: true
      },
      {
        id: 'm2',
        conversationId: '1',
        sender: 'patient',
        senderName: 'Rajesh Kumar',
        content: 'Thank you doctor. Please explain in detail.',
        timestamp: '2024-01-15 10:05',
        isRead: true
      },
      {
        id: 'm3',
        conversationId: '1',
        sender: 'doctor',
        senderName: 'Dr. Vikram Singh',
        content: 'You have Community-Acquired Pneumonia with elevated inflammatory markers. I recommend starting antibiotic therapy immediately.',
        timestamp: '2024-01-15 10:15',
        isRead: true
      },
      {
        id: 'm4',
        conversationId: '1',
        sender: 'patient',
        senderName: 'Rajesh Kumar',
        content: 'What precautions should I take?',
        timestamp: '2024-01-15 10:20',
        isRead: true
      },
      {
        id: 'm5',
        conversationId: '1',
        sender: 'doctor',
        senderName: 'Dr. Vikram Singh',
        content: 'Get adequate rest, stay hydrated, and monitor your temperature daily. Come for follow-up in 3 days.',
        timestamp: '2024-01-15 10:25',
        isRead: true
      },
      {
        id: 'm6',
        conversationId: '1',
        sender: 'patient',
        senderName: 'Rajesh Kumar',
        content: 'Thank you doctor, I will follow the treatment plan.',
        timestamp: '2024-01-15 14:30',
        isRead: true
      }
    ],
    '2': [
      {
        id: 'm7',
        conversationId: '2',
        sender: 'patient',
        senderName: 'Priya Sharma',
        content: 'Hello Doctor, How are you?',
        timestamp: '2024-01-15 12:00',
        isRead: true
      },
      {
        id: 'm8',
        conversationId: '2',
        sender: 'doctor',
        senderName: 'Dr. Vikram Singh',
        content: 'Hi Priya! I am doing well. How can I help you today?',
        timestamp: '2024-01-15 12:15',
        isRead: true
      },
      {
        id: 'm9',
        conversationId: '2',
        sender: 'patient',
        senderName: 'Priya Sharma',
        content: 'Can I schedule a follow-up consultation?',
        timestamp: '2024-01-15 13:45',
        isRead: false
      }
    ]
  });

  // Mock available consultation slots
  const [availableSlots] = useState<ConsultationSlot[]>([
    { id: 's1', date: '2024-01-16', time: '09:00', duration: 30, patientName: '', type: 'online', status: 'available' },
    { id: 's2', date: '2024-01-16', time: '09:30', duration: 30, patientName: '', type: 'online', status: 'available' },
    { id: 's3', date: '2024-01-16', time: '10:00', duration: 30, patientName: 'Anuj Singh', type: 'online', status: 'booked' },
    { id: 's4', date: '2024-01-16', time: '10:30', duration: 30, patientName: '', type: 'offline', status: 'available' },
    { id: 's5', date: '2024-01-16', time: '14:00', duration: 30, patientName: '', type: 'online', status: 'available' },
    { id: 's6', date: '2024-01-16', time: '14:30', duration: 30, patientName: '', type: 'offline', status: 'available' },
    { id: 's7', date: '2024-01-17', time: '09:00', duration: 30, patientName: '', type: 'online', status: 'available' },
    { id: 's8', date: '2024-01-17', time: '15:00', duration: 30, patientName: '', type: 'online', status: 'available' }
  ]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedConversation, messagesByConversation]);

  const handleSendMessage = () => {
    if (messageInput.trim() && selectedConversation) {
      // Simulate typing indicator
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
      }, 1000);
      setMessageInput('');
    }
  };

  const handleScheduleSlot = () => {
    if (selectedDate && selectedTime && selectedConversation) {
      setShowScheduleModal(false);
      setSelectedDate('');
      setSelectedTime('');
    }
  };

  const currentMessages = selectedConversation ? messagesByConversation[selectedConversation] || [] : [];
  const currentConversation = conversations.find(c => c.id === selectedConversation);

  const getMessageDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-IN', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-IN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="patient-communication">
      <div className="comm-container">
        {/* Sidebar - Conversations List */}
        <div className="conversations-sidebar">
          <div className="sidebar-header">
            <h3>Messages</h3>
            <div className="sidebar-controls">
              <button className="icon-btn" title="Search conversations">🔍</button>
              <button className="icon-btn" title="New message">✉️</button>
            </div>
          </div>

          <div className="conversations-list">
            {conversations.map(conv => (
              <div
                key={conv.id}
                className={`conversation-item ${selectedConversation === conv.id ? 'active' : ''} ${
                  conv.unreadCount > 0 ? 'unread' : ''
                }`}
                onClick={() => setSelectedConversation(conv.id)}
              >
                <div className="conv-avatar">
                  <span className="avatar-initials">
                    {conv.patientName.split(' ').map(n => n[0]).join('')}
                  </span>
                  {conv.status === 'active' && <span className="online-indicator"></span>}
                </div>

                <div className="conv-info">
                  <div className="conv-header">
                    <h4 className="conv-name">{conv.patientName}</h4>
                    <span className="conv-time">{conv.lastMessageTime.split(' ')[1]}</span>
                  </div>
                  <p className="conv-preview">{conv.lastMessage}</p>
                  <span className={`conv-status ${conv.status}`}>
                    {statusColors[conv.status].text}
                  </span>
                </div>

                {conv.unreadCount > 0 && (
                  <span className="unread-badge">{conv.unreadCount}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="comm-main">
          {selectedConversation && currentConversation ? (
            <>
              {/* Conversation Header */}
              <div className="conversation-header">
                <div className="conv-header-info">
                  <div className="conv-avatar-lg">
                    <span className="avatar-initials-lg">
                      {currentConversation.patientName.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div className="conv-header-text">
                    <h3>{currentConversation.patientName}</h3>
                    <p className="patient-id">ID: {currentConversation.patientId}</p>
                  </div>
                </div>

                <div className="conv-header-actions">
                  <button className="action-btn" title="Video call">📹</button>
                  <button className="action-btn" title="Phone call">☎️</button>
                  <button 
                    className="action-btn" 
                    title="Schedule consultation"
                    onClick={() => setShowScheduleModal(true)}
                  >
                    📅
                  </button>
                  <button className="action-btn" title="View patient profile">👤</button>
                </div>
              </div>

              {/* Messages Display */}
              <div className="messages-container">
                {currentMessages.length > 0 ? (
                  <>
                    {currentMessages.map((msg, idx) => {
                      const showDate = idx === 0 || 
                        getMessageDate(currentMessages[idx - 1].timestamp) !== 
                        getMessageDate(msg.timestamp);

                      return (
                        <div key={msg.id}>
                          {showDate && (
                            <div className="message-date-divider">
                              {getMessageDate(msg.timestamp)}
                            </div>
                          )}
                          <div className={`message ${msg.sender}`}>
                            <div className="message-bubble">
                              <p className="message-content">{msg.content}</p>
                              {msg.attachments && msg.attachments.length > 0 && (
                                <div className="message-attachments">
                                  {msg.attachments.map((att, idx) => (
                                    <div key={idx} className="attachment-item">
                                      📎 {att.name}
                                    </div>
                                  ))}
                                </div>
                              )}
                              <span className="message-time">{getMessageTime(msg.timestamp)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {isTyping && (
                      <div className="message patient typing-indicator">
                        <div className="message-bubble">
                          <div className="typing-dots">
                            <span></span>
                            <span></span>
                            <span></span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </>
                ) : (
                  <div className="empty-messages">
                    <p>Start a conversation with {currentConversation.patientName}</p>
                  </div>
                )}
              </div>

              {/* Message Input */}
              <div className="message-input-area">
                <div className="input-controls">
                  <button className="input-btn" title="Attach file">📎</button>
                  <button className="input-btn" title="Add emoji">😊</button>
                </div>
                <div className="input-wrapper">
                  <input
                    type="text"
                    className="message-input"
                    placeholder="Type your message..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  />
                </div>
                <button
                  className="send-btn"
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim()}
                >
                  ➤
                </button>
              </div>
            </>
          ) : (
            <div className="comm-empty-state">
              <div className="empty-icon">💬</div>
              <h3>Select a conversation to start messaging</h3>
              <p>Choose a patient from the list to view and manage conversations</p>
            </div>
          )}
        </div>
      </div>

      {/* Scheduling Modal */}
      {showScheduleModal && (
        <div className="modal-overlay" onClick={() => setShowScheduleModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Schedule Consultation</h3>
              <button 
                className="modal-close"
                onClick={() => setShowScheduleModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="schedule-form">
                <div className="form-group">
                  <label>Patient: {currentConversation?.patientName}</label>
                </div>

                <div className="form-group">
                  <label htmlFor="cons-date">Select Date:</label>
                  <input
                    id="cons-date"
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="available-slots">
                  <label>Available Slots:</label>
                  <div className="slots-grid">
                    {selectedDate && availableSlots
                      .filter(slot => slot.date === selectedDate && slot.status === 'available')
                      .map(slot => (
                        <button
                          key={slot.id}
                          className={`slot-btn ${selectedTime === slot.time ? 'selected' : ''}`}
                          onClick={() => setSelectedTime(slot.time)}
                        >
                          <span className="slot-time">{slot.time}</span>
                          <span className="slot-type">{slot.type === 'online' ? '🌐' : '🏥'}</span>
                        </button>
                      ))}
                  </div>
                  {selectedDate && !availableSlots.some(s => s.date === selectedDate && s.status === 'available') && (
                    <p className="no-slots">No available slots on this date</p>
                  )}
                </div>

                <div className="form-group">
                  <label>Consultation Type:</label>
                  <div className="type-options">
                    <label className="radio-option">
                      <input type="radio" name="type" defaultChecked /> Online
                    </label>
                    <label className="radio-option">
                      <input type="radio" name="type" /> Offline
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="cons-notes">Notes:</label>
                  <textarea
                    id="cons-notes"
                    className="form-input"
                    rows={3}
                    placeholder="Add any specific requirements or notes..."
                  />
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button 
                className="btn-cancel"
                onClick={() => setShowScheduleModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn-schedule"
                onClick={handleScheduleSlot}
                disabled={!selectedDate || !selectedTime}
              >
                Schedule Consultation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientCommunication;
