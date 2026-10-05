import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { io } from 'socket.io-client';
import { FiSend, FiArrowLeft } from 'react-icons/fi';

export default function Chat() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [consultationId, setConsultationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Initialize Socket.io connection
    const socketIO = io('http://localhost:5000', {
      auth: {
        token: localStorage.getItem('auth-storage')
      }
    });

    setSocket(socketIO);

    return () => {
      socketIO.disconnect();
    };
  }, []);

  useEffect(() => {
    if (socket && consultationId) {
      // Join consultation room
      socket.emit('join-consultation', consultationId, user?.id);

      // Listen for incoming messages
      socket.on('receive-message', (data) => {
        setMessages(prev => [...prev, data]);
      });

      setLoading(false);
    }
  }, [socket, consultationId]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket) return;

    socket.emit('send-message', {
      consultationId,
      senderId: user?.id,
      senderName: `${user?.firstName} ${user?.lastName}`,
      message: newMessage,
      messageType: 'text'
    });

    setNewMessage('');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate(user?.userType === 'patient' ? '/patient/dashboard' : '/doctor/dashboard')}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4"
          >
            <FiArrowLeft />
            Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Consultation Chat</h1>
        </div>
      </header>

      {/* Chat Container */}
      <main className="flex-1 flex flex-col max-w-7xl mx-auto w-full">
        {/* Consultation Selection */}
        {!consultationId ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow p-8 text-center max-w-md">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Consultation</h2>
              <p className="text-gray-600 mb-6">
                This feature allows real-time chat with your {user?.userType === 'patient' ? 'doctor' : 'patient'}. 
                Please select a consultation to start chatting.
              </p>
              <input
                type="number"
                placeholder="Enter Consultation ID"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    setConsultationId(parseInt(e.target.value));
                  }
                }}
              />
              <button
                onClick={(e) => {
                  const input = e.target.parentElement.querySelector('input');
                  if (input.value) {
                    setConsultationId(parseInt(input.value));
                  }
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg"
              >
                Start Chat
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Messages Area */}
            <div className="flex-1 bg-white m-4 rounded-lg shadow overflow-y-auto p-4 space-y-4">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500">Connecting to chat...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500">No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs px-4 py-2 rounded-lg ${
                        msg.senderId === user?.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-900'
                      }`}
                    >
                      <p className="text-sm font-semibold mb-1">{msg.senderName}</p>
                      <p>{msg.message}</p>
                      <p className="text-xs mt-1 opacity-70">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="bg-white border-t p-4 m-4 rounded-lg shadow">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition"
                >
                  <FiSend />
                </button>
              </div>
            </form>
          </>
        )}
      </main>
    </div>
  );
}
