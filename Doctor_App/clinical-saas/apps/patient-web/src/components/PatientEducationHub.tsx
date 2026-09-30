/**
 * Patient Education Hub Component
 * Central hub for patient education, symptom checking, health assessments, and wellness recommendations
 * Integrates all educational features with beautiful UI
 */

import React, { useState } from 'react';
import SymptomChecker from './SymptomChecker';
import HealthAssessment from './HealthAssessment';
import '../styles/PatientEducationHub.css';

type ActiveTab = 'home' | 'symptom-checker' | 'health-assessment' | 'educational-content' | 'wellness-tips';

interface EducationalResource {
  id: string;
  title: string;
  category: string;
  icon: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number;
  rating: number;
}

const educationalResources: EducationalResource[] = [
  {
    id: '1',
    title: 'Understanding Your Blood Pressure',
    category: 'cardiovascular',
    icon: '🫀',
    description: 'Learn what blood pressure means and how to keep your heart healthy',
    difficulty: 'beginner',
    duration: 5,
    rating: 4.8
  },
  {
    id: '2',
    title: 'Managing Diabetes Through Diet',
    category: 'nutrition',
    icon: '🥗',
    description: 'Discover dietary strategies to manage blood sugar levels',
    difficulty: 'intermediate',
    duration: 10,
    rating: 4.7
  },
  {
    id: '3',
    title: 'Exercise Benefits for Heart Health',
    category: 'exercise',
    icon: '🏃',
    description: 'Safe exercises to strengthen your cardiovascular system',
    difficulty: 'intermediate',
    duration: 8,
    rating: 4.9
  },
  {
    id: '4',
    title: 'Recognizing Symptoms of Anxiety',
    category: 'mental-health',
    icon: '🧠',
    description: 'Identify anxiety symptoms and learn coping strategies',
    difficulty: 'beginner',
    duration: 6,
    rating: 4.6
  },
  {
    id: '5',
    title: 'Medication Adherence Strategies',
    category: 'medications',
    icon: '💊',
    description: 'Tips to remember and take your medications correctly',
    difficulty: 'beginner',
    duration: 4,
    rating: 4.7
  },
  {
    id: '6',
    title: 'Sleep Optimization Guide',
    category: 'lifestyle',
    icon: '😴',
    description: 'Improve sleep quality and develop healthy sleep habits',
    difficulty: 'beginner',
    duration: 7,
    rating: 4.8
  }
];

const wellnessTips = [
  {
    icon: '💧',
    title: 'Stay Hydrated',
    description: 'Drink at least 8 glasses of water daily to maintain optimal health and energy levels'
  },
  {
    icon: '🥗',
    title: 'Eat Whole Foods',
    description: 'Focus on whole grains, fruits, vegetables, and lean proteins for better nutrition'
  },
  {
    icon: '🚶',
    title: 'Move Daily',
    description: 'Aim for 30 minutes of moderate physical activity daily to improve fitness'
  },
  {
    icon: '🧘',
    title: 'Practice Mindfulness',
    description: 'Spend 10 minutes daily on meditation or deep breathing for mental clarity'
  },
  {
    icon: '😴',
    title: 'Prioritize Sleep',
    description: 'Get 7-9 hours of quality sleep nightly for better health and recovery'
  },
  {
    icon: '🤝',
    title: 'Stay Connected',
    description: 'Maintain social connections with family and friends for emotional well-being'
  }
];

export const PatientEducationHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [selectedResource, setSelectedResource] = useState<EducationalResource | null>(null);

  const renderContent = () => {
    switch (activeTab) {
      case 'symptom-checker':
        return <SymptomChecker />;
      case 'health-assessment':
        return <HealthAssessment />;
      case 'educational-content':
        return renderEducationalContent();
      case 'wellness-tips':
        return renderWellnessTips();
      default:
        return renderHome();
    }
  };

  const renderHome = () => (
    <div className="hub-home">
      <div className="hero-section">
        <h1>Welcome to Your Health Journey 🏥</h1>
        <p>Empower yourself with knowledge and take control of your health</p>
      </div>

      <div className="features-grid">
        <button
          className="feature-card"
          onClick={() => setActiveTab('symptom-checker')}
        >
          <div className="feature-icon">🔍</div>
          <h3>Symptom Checker</h3>
          <p>Understand your symptoms and get AI-powered health insights</p>
          <div className="feature-action">Learn More →</div>
        </button>

        <button
          className="feature-card"
          onClick={() => setActiveTab('health-assessment')}
        >
          <div className="feature-icon">📋</div>
          <h3>Health Assessment</h3>
          <p>Complete comprehensive health questionnaires and get your score</p>
          <div className="feature-action">Learn More →</div>
        </button>

        <button
          className="feature-card"
          onClick={() => setActiveTab('educational-content')}
        >
          <div className="feature-icon">📚</div>
          <h3>Educational Content</h3>
          <p>Access curated health education articles and resources</p>
          <div className="feature-action">Learn More →</div>
        </button>

        <button
          className="feature-card"
          onClick={() => setActiveTab('wellness-tips')}
        >
          <div className="feature-icon">💡</div>
          <h3>Wellness Tips</h3>
          <p>Daily tips and recommendations for a healthier lifestyle</p>
          <div className="feature-action">Learn More →</div>
        </button>
      </div>

      <div className="quick-stats">
        <div className="stat-card">
          <div className="stat-number">3000+</div>
          <div className="stat-label">Medicines Database</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">24/7</div>
          <div className="stat-label">AI Support</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">100%</div>
          <div className="stat-label">Private & Secure</div>
        </div>
      </div>
    </div>
  );

  const renderEducationalContent = () => (
    <div className="educational-content-view">
      <div className="view-header">
        <h2>📚 Educational Resources</h2>
        <p>Learn from expert-curated health education content</p>
      </div>

      {selectedResource ? (
        <div className="resource-detail">
          <button className="btn-back" onClick={() => setSelectedResource(null)}>
            ← Back to Resources
          </button>

          <div className="resource-header">
            <div className="resource-icon">{selectedResource.icon}</div>
            <div>
              <h3>{selectedResource.title}</h3>
              <div className="resource-meta">
                <span className="difficulty" style={{
                  background: selectedResource.difficulty === 'beginner'
                    ? '#10b981'
                    : selectedResource.difficulty === 'intermediate'
                    ? '#f59e0b'
                    : '#ef4444'
                }}>
                  {selectedResource.difficulty.charAt(0).toUpperCase() + selectedResource.difficulty.slice(1)}
                </span>
                <span className="duration">⏱️ {selectedResource.duration} min read</span>
                <span className="rating">⭐ {selectedResource.rating}/5</span>
              </div>
            </div>
          </div>

          <div className="resource-content">
            <p>{selectedResource.description}</p>
            <div className="resource-placeholder">
              <p>📖 Full content would be displayed here</p>
              <p style={{ fontSize: '0.9rem', color: '#718096' }}>
                This educational content is integrated with Gemini AI for personalized explanations
              </p>
            </div>
          </div>

          <button className="btn-primary">Start Learning</button>
        </div>
      ) : (
        <div className="resources-grid">
          {educationalResources.map((resource) => (
            <div
              key={resource.id}
              className="resource-card"
              onClick={() => setSelectedResource(resource)}
            >
              <div className="resource-card-icon">{resource.icon}</div>
              <h4>{resource.title}</h4>
              <p>{resource.description}</p>
              <div className="resource-footer">
                <span className="difficulty" style={{
                  background: resource.difficulty === 'beginner'
                    ? '#10b981'
                    : resource.difficulty === 'intermediate'
                    ? '#f59e0b'
                    : '#ef4444'
                }}>
                  {resource.difficulty}
                </span>
                <span className="duration">{resource.duration}m</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderWellnessTips = () => (
    <div className="wellness-tips-view">
      <div className="view-header">
        <h2>💡 Daily Wellness Tips</h2>
        <p>Small steps toward a healthier lifestyle</p>
      </div>

      <div className="tips-grid">
        {wellnessTips.map((tip, idx) => (
          <div key={idx} className="tip-card">
            <div className="tip-icon">{tip.icon}</div>
            <h4>{tip.title}</h4>
            <p>{tip.description}</p>
            <button className="btn-tip">Learn More</button>
          </div>
        ))}
      </div>

      <div className="wellness-challenge">
        <h3>🎯 This Week's Challenge</h3>
        <div className="challenge-content">
          <p><strong>Stay Active Challenge:</strong></p>
          <p>Get 30 minutes of physical activity every day this week. Track your progress and earn rewards!</p>
          <button className="btn-primary">Join Challenge</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="patient-education-hub">
      <div className="hub-sidebar">
        <div className="sidebar-header">
          <h1>🏥 Health Hub</h1>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`nav-item ${activeTab === 'home' ? 'active' : ''}`}
            onClick={() => setActiveTab('home')}
          >
            <span className="nav-icon">🏠</span>
            <span>Home</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'symptom-checker' ? 'active' : ''}`}
            onClick={() => setActiveTab('symptom-checker')}
          >
            <span className="nav-icon">🔍</span>
            <span>Symptom Checker</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'health-assessment' ? 'active' : ''}`}
            onClick={() => setActiveTab('health-assessment')}
          >
            <span className="nav-icon">📋</span>
            <span>Assessments</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'educational-content' ? 'active' : ''}`}
            onClick={() => setActiveTab('educational-content')}
          >
            <span className="nav-icon">📚</span>
            <span>Learn</span>
          </button>

          <button
            className={`nav-item ${activeTab === 'wellness-tips' ? 'active' : ''}`}
            onClick={() => setActiveTab('wellness-tips')}
          >
            <span className="nav-icon">💡</span>
            <span>Wellness</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="info-box">
            <p>💬 Have questions?</p>
            <p style={{ fontSize: '0.9rem', color: '#718096' }}>
              Chat with our AI health assistant for personalized guidance
            </p>
          </div>
        </div>
      </div>

      <div className="hub-main">
        <div className="hub-content">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default PatientEducationHub;
