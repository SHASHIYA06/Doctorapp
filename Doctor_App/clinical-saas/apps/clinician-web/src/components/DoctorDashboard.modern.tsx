/**
 * Modern Doctor Dashboard - Complete Redesign
 * Bento Grid Layout + Trust Blue + Orange CTA
 * 
 * Design System: Brutalism + Bento Grid (Bold, Clean, Professional)
 * Colors: #2563EB (Trust Blue) + #EA580C (Orange CTA)
 * Typography: Poppins (headings) + Open Sans (body)
 * Motion: GSAP stagger animations for smooth entrance effects
 */

import React, { useState, useEffect } from 'react';
import gsap from 'gsap';
import {
  Activity,
  Calendar,
  Users,
  FileText,
  Pill,
  TestTube,
  DollarSign,
  TrendingUp,
  Clock,
  AlertCircle,
  CheckCircle,
  Phone,
  MapPin,
  Bell,
  Settings,
  Search,
  Filter,
  BarChart3,
  Stethoscope,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  MoreVertical,
} from 'lucide-react';
import { modernDesignSystem, healthcareModernColors } from '../modern-design-system';

interface PatientCase {
  id: string;
  name: string;
  age: number;
  gender: string;
  modality: string;
  status: string;
  complaint: string;
  lastVisit: string;
  nextAppointment?: string;
  phone: string;
  location: string;
  priority: string;
}

interface DashboardProps {
  onNavigate: (view: any, patientId?: string) => void;
}

export function DoctorDashboardModern({ onNavigate }: DashboardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterModality, setFilterModality] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showNotifications, setShowNotifications] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // Patient data
  const [patients] = useState<PatientCase[]>([
    {
      id: 'P001',
      name: 'Rajesh Kumar Sharma',
      age: 52,
      gender: 'Male',
      modality: 'allopathy',
      status: 'critical',
      priority: 'urgent',
      complaint: 'Hypertension, Chest discomfort',
      lastVisit: '2 hours ago',
      nextAppointment: 'Today 4:00 PM',
      phone: '+91 98765 43210',
      location: 'Mumbai',
    },
    {
      id: 'P002',
      name: 'Priya Sharma',
      age: 34,
      gender: 'Female',
      modality: 'ayurveda',
      status: 'stable',
      priority: 'routine',
      complaint: 'Digestive issues, Fatigue',
      lastVisit: '1 day ago',
      nextAppointment: 'Tomorrow 10:00 AM',
      phone: '+91 98765 43211',
      location: 'Delhi NCR',
    },
    {
      id: 'P003',
      name: 'Amit Patel',
      age: 28,
      gender: 'Male',
      modality: 'homeopathy',
      status: 'under_treatment',
      priority: 'normal',
      complaint: 'Allergic rhinitis',
      lastVisit: '3 days ago',
      nextAppointment: 'Friday 11:30 AM',
      phone: '+91 98765 43212',
      location: 'Ahmedabad',
    },
    {
      id: 'P004',
      name: 'Sunita Reddy',
      age: 45,
      gender: 'Female',
      modality: 'allopathy',
      status: 'recovering',
      priority: 'routine',
      complaint: 'Post-operative care',
      lastVisit: '5 days ago',
      nextAppointment: 'Next week',
      phone: '+91 98765 43213',
      location: 'Hyderabad',
    },
    {
      id: 'P005',
      name: 'Mohammad Ali',
      age: 61,
      gender: 'Male',
      modality: 'unani',
      status: 'stable',
      priority: 'routine',
      complaint: 'Arthritis, Joint pain',
      lastVisit: '1 week ago',
      nextAppointment: 'Wednesday',
      phone: '+91 98765 43214',
      location: 'Lucknow',
    },
    {
      id: 'P006',
      name: 'Kavita Deshmukh',
      age: 38,
      gender: 'Female',
      modality: 'ayurveda',
      status: 'new_patient',
      priority: 'normal',
      complaint: 'Migraine, Sleep issues',
      lastVisit: 'New intake',
      nextAppointment: 'Today 5:30 PM',
      phone: '+91 98765 43215',
      location: 'Pune',
    },
    {
      id: 'P007',
      name: 'Arjun Singh',
      age: 25,
      gender: 'Male',
      modality: 'allopathy',
      status: 'under_treatment',
      priority: 'normal',
      complaint: 'Sports injury',
      lastVisit: '2 days ago',
      nextAppointment: 'Tomorrow 3:00 PM',
      phone: '+91 98765 43216',
      location: 'Jaipur',
    },
    {
      id: 'P008',
      name: 'Lakshmi Iyer',
      age: 71,
      gender: 'Female',
      modality: 'siddha',
      status: 'stable',
      priority: 'routine',
      complaint: 'Age-related issues',
      lastVisit: '4 days ago',
      nextAppointment: 'Thursday',
      phone: '+91 98765 43217',
      location: 'Chennai',
    },
  ]);

  const [todayAppointments] = useState([
    { time: '09:00 AM', patient: 'Rajesh Kumar', type: 'Follow-up', status: 'confirmed' },
    { time: '11:45 AM', patient: 'Priya Sharma', type: 'Consultation', status: 'in_progress' },
    { time: '02:00 PM', patient: 'Amit Patel', type: 'Review', status: 'upcoming' },
    { time: '04:00 PM', patient: 'Rajesh Kumar', type: 'Urgent', status: 'upcoming' },
    { time: '05:30 PM', patient: 'Kavita Deshmukh', type: 'New Intake', status: 'upcoming' },
  ]);

  // Statistics
  const stats = {
    totalPatients: patients.length,
    todayAppointments: todayAppointments.length,
    pendingReviews: patients.filter(p => p.status === 'critical' || p.status === 'new_patient').length,
    prescriptionsToSign: 5,
  };

  // GSAP Stagger Animations
  useEffect(() => {
    // Animate stat cards with stagger
    const statCardElements = document.querySelectorAll('[data-stat-card]');
    if (statCardElements.length > 0) {
      gsap.fromTo(
        statCardElements,
        {
          opacity: 0,
          y: 30,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.12,
          ease: 'power3.out',
        }
      );
    }

    // Animate patient list card
    const patientListElement = document.querySelector('[data-patient-list]');
    if (patientListElement) {
      gsap.fromTo(
        patientListElement,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          delay: 0.3,
          ease: 'power3.out',
        }
      );
    }

    // Animate schedule and actions cards
    const scheduleElement = document.querySelector('[data-schedule-card]');
    const actionsElement = document.querySelector('[data-actions-card]');
    if (scheduleElement || actionsElement) {
      gsap.fromTo(
        [scheduleElement, actionsElement].filter(Boolean),
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          delay: 0.45,
          stagger: 0.1,
          ease: 'power3.out',
        }
      );
    }
  }, []);

  // Responsive resize handler
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const statusConfig = {
    critical: { color: '#DC2626', label: 'Critical', icon: AlertCircle },
    urgent: { color: '#F97316', label: 'Urgent', icon: AlertCircle },
    under_treatment: { color: '#2563EB', label: 'Under Treatment', icon: Activity },
    stable: { color: '#10B981', label: 'Stable', icon: CheckCircle },
    recovering: { color: '#06B6D4', label: 'Recovering', icon: TrendingUp },
    new_patient: { color: '#8B5CF6', label: 'New Patient', icon: Users },
  };

  const modalityColors = {
    allopathy: '#2563EB',
    ayurveda: '#10B981',
    homeopathy: '#8B5CF6',
    unani: '#F59E0B',
    siddha: '#EC4899',
  };

  const filteredPatients = patients.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesModality = filterModality === 'all' || p.modality === filterModality;
    const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
    return matchesSearch && matchesModality && matchesStatus;
  });

  return (
    <div style={{ backgroundColor: modernDesignSystem.colors.background, minHeight: '100vh' }}>
      {/* Modern Header - Responsive */}
      <header style={{
        backgroundColor: modernDesignSystem.colors.card,
        borderBottom: `1px solid ${modernDesignSystem.colors.border}`,
        padding: windowWidth < 640 ? '0.75rem 1rem' : '1rem 2rem',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: modernDesignSystem.shadows.sm,
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          maxWidth: '1920px',
          margin: '0 auto',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '48px',
              height: '48px',
              backgroundColor: modernDesignSystem.colors.primary,
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}>
              <Stethoscope size={28} color={modernDesignSystem.colors.onPrimary} />
            </div>
            <div>
              <h1 style={{
                fontSize: '24px',
                fontWeight: 700,
                color: modernDesignSystem.colors.foreground,
                margin: 0,
                fontFamily: modernDesignSystem.typography.headingFamily,
              }}>
                Doctor Dashboard
              </h1>
              <p style={{
                fontSize: '13px',
                color: modernDesignSystem.colors.mutedForeground,
                margin: '2px 0 0 0',
                fontFamily: modernDesignSystem.typography.bodyFamily,
              }}>
                Healthcare Management System
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button style={{
              padding: '8px 12px',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: modernDesignSystem.colors.foreground,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '14px',
              borderRadius: '8px',
              transition: 'all 200ms',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = modernDesignSystem.colors.muted;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            >
              <Bell size={20} />
              {stats.pendingReviews > 0 && (
                <span style={{
                  width: '20px',
                  height: '20px',
                  backgroundColor: modernDesignSystem.colors.destructive,
                  color: 'white',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 'bold',
                }}>
                  {stats.pendingReviews}
                </span>
              )}
            </button>
            <button style={{
              padding: '8px 12px',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: modernDesignSystem.colors.foreground,
              borderRadius: '8px',
              transition: 'all 200ms',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = modernDesignSystem.colors.muted;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            >
              <Settings size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content - Bento Grid Layout - Responsive */}
      <main style={{
        maxWidth: '1920px',
        margin: '0 auto',
        padding: windowWidth < 640 ? '1rem' : windowWidth < 1024 ? '1.5rem' : '2rem',
        display: 'grid',
        gridTemplateColumns: windowWidth < 640 
          ? '1fr' 
          : windowWidth < 1024 
            ? 'repeat(2, 1fr)' 
            : 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: windowWidth < 640 ? '1rem' : '1.5rem',
      }}>
        {/* Stat Cards - Bento Grid Style */}
        <div data-stat-card>
          <StatCard
            title="Total Patients"
            value={stats.totalPatients}
            icon={Users}
            bgColor="#EFF6FF"
            iconColor={modernDesignSystem.colors.primary}
            trend="+12% this month"
          />
        </div>
        <div data-stat-card>
          <StatCard
            title="Today's Appointments"
            value={stats.todayAppointments}
            icon={Calendar}
            bgColor="#F0F9FF"
            iconColor={modernDesignSystem.colors.secondary}
            trend="2 in progress"
          />
        </div>
        <div data-stat-card>
          <StatCard
            title="Pending Reviews"
            value={stats.pendingReviews}
            icon={AlertCircle}
            bgColor="#FEF2F2"
            iconColor={modernDesignSystem.colors.destructive}
            trend={`${patients.filter(p => p.priority === 'urgent').length} urgent`}
          />
        </div>
        <div data-stat-card>
          <StatCard
            title="Prescriptions"
            value={stats.prescriptionsToSign}
            icon={Pill}
            bgColor="#F0FDF4"
            iconColor={modernDesignSystem.colors.success}
            trend="Awaiting signature"
          />
        </div>

        {/* Search & Filters - Full Width */}
        <div style={{
          gridColumn: 'span 4',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
        }}>
          <input
            type="text"
            placeholder="Search patients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: '12px 16px',
              border: `1px solid ${modernDesignSystem.colors.border}`,
              borderRadius: '12px',
              fontSize: '14px',
              fontFamily: modernDesignSystem.typography.bodyFamily,
              backgroundColor: modernDesignSystem.colors.card,
              color: modernDesignSystem.colors.foreground,
            }}
          />
          <select
            value={filterModality}
            onChange={(e) => setFilterModality(e.target.value)}
            style={{
              padding: '12px 16px',
              border: `1px solid ${modernDesignSystem.colors.border}`,
              borderRadius: '12px',
              fontSize: '14px',
              fontFamily: modernDesignSystem.typography.bodyFamily,
              backgroundColor: modernDesignSystem.colors.card,
              color: modernDesignSystem.colors.foreground,
            }}
          >
            <option value="all">All Modalities</option>
            <option value="allopathy">Allopathy</option>
            <option value="ayurveda">Ayurveda</option>
            <option value="homeopathy">Homeopathy</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              padding: '12px 16px',
              border: `1px solid ${modernDesignSystem.colors.border}`,
              borderRadius: '12px',
              fontSize: '14px',
              fontFamily: modernDesignSystem.typography.bodyFamily,
              backgroundColor: modernDesignSystem.colors.card,
              color: modernDesignSystem.colors.foreground,
            }}
          >
            <option value="all">All Status</option>
            <option value="critical">Critical</option>
            <option value="stable">Stable</option>
            <option value="new_patient">New Patient</option>
          </select>
        </div>

        {/* Patient List - Full Width */}
        <div ref={patientListRef} data-patient-list style={{
          gridColumn: 'span 4',
          backgroundColor: modernDesignSystem.colors.card,
          borderRadius: modernDesignSystem.borderRadius.lg,
          border: `1.5px solid ${modernDesignSystem.colors.border}`,
          overflow: 'hidden',
          boxShadow: modernDesignSystem.shadows.md,
          transition: 'all 200ms ease-out',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <div style={{
            padding: '1.5rem',
            borderBottom: `1px solid ${modernDesignSystem.colors.border}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: modernDesignSystem.colors.background,
          }}>
            <h2 style={{
              fontSize: '18px',
              fontWeight: 600,
              color: modernDesignSystem.colors.foreground,
              margin: 0,
              fontFamily: modernDesignSystem.typography.headingFamily,
            }}>
              Active Patients ({filteredPatients.length})
            </h2>
            <span style={{
              fontSize: '12px',
              color: modernDesignSystem.colors.mutedForeground,
              backgroundColor: modernDesignSystem.colors.muted,
              padding: '4px 12px',
              borderRadius: modernDesignSystem.borderRadius.full,
              fontWeight: 600,
            }}>
              {filteredPatients.filter(p => p.status === 'critical').length} Critical
            </span>
          </div>

          <div style={{
            flex: 1,
            maxHeight: '600px',
            overflowY: 'auto',
            overflowX: 'hidden',
          }}>
            {filteredPatients.length === 0 ? (
              <div style={{
                padding: '3rem 2rem',
                textAlign: 'center',
                color: modernDesignSystem.colors.mutedForeground,
              }}>
                <p style={{ margin: 0, fontSize: '14px' }}>No patients found</p>
              </div>
            ) : (
              filteredPatients.map((patient, index) => (
                <PatientRow
                  key={patient.id}
                  patient={patient}
                  statusConfig={statusConfig}
                  modalityColors={modalityColors}
                  onNavigate={onNavigate}
                  borderTop={index > 0}
                />
              ))
            )}
          </div>
        </div>

        {/* Today's Schedule */}
        <div ref={scheduleCardRef} data-schedule-card style={{
          gridColumn: 'span 2',
          backgroundColor: modernDesignSystem.colors.card,
          borderRadius: modernDesignSystem.borderRadius.lg,
          border: `1.5px solid ${modernDesignSystem.colors.border}`,
          padding: '1.5rem',
          boxShadow: modernDesignSystem.shadows.md,
          transition: 'all 200ms ease-out',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: 600,
            color: modernDesignSystem.colors.foreground,
            margin: '0 0 1.5rem 0',
            fontFamily: modernDesignSystem.typography.headingFamily,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <Calendar size={18} color={modernDesignSystem.colors.primary} />
            Today's Schedule
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {todayAppointments.map((apt, i) => (
              <div key={i} style={{
                padding: '1rem',
                backgroundColor: modernDesignSystem.colors.background,
                borderRadius: modernDesignSystem.borderRadius.md,
                borderLeft: `4px solid ${modernDesignSystem.colors.primary}`,
                transition: 'all 200ms ease-out',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = `${modernDesignSystem.colors.primary}08`;
                e.currentTarget.style.transform = 'translateX(4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = modernDesignSystem.colors.background;
                e.currentTarget.style.transform = 'translateX(0)';
              }}
              >
                <div style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: modernDesignSystem.colors.foreground,
                  fontFamily: modernDesignSystem.typography.bodyFamily,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  <Clock size={14} color={modernDesignSystem.colors.primary} />
                  {apt.time}
                </div>
                <div style={{
                  fontSize: '13px',
                  color: modernDesignSystem.colors.mutedForeground,
                  marginTop: '4px',
                  fontFamily: modernDesignSystem.typography.bodyFamily,
                }}>
                  {apt.patient} • <span style={{ fontWeight: 600 }}>{apt.type}</span>
                </div>
                <div style={{
                  fontSize: '11px',
                  color: apt.status === 'confirmed' ? modernDesignSystem.colors.success : apt.status === 'in_progress' ? modernDesignSystem.colors.info : modernDesignSystem.colors.mutedForeground,
                  marginTop: '6px',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                  letterSpacing: '0.05em',
                }}>
                  {apt.status.replace('_', ' ')}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div ref={actionsCardRef} data-actions-card style={{
          gridColumn: 'span 2',
          backgroundColor: modernDesignSystem.colors.primary,
          borderRadius: '16px',
          padding: '1.5rem',
          color: modernDesignSystem.colors.onPrimary,
          boxShadow: modernDesignSystem.shadows.lg,
        }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: 600,
            margin: '0 0 1rem 0',
            fontFamily: modernDesignSystem.typography.headingFamily,
          }}>
            Quick Actions
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button style={{
              padding: '10px 14px',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: '10px',
              color: 'inherit',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              transition: 'all 200ms',
              textAlign: 'left',
              fontFamily: modernDesignSystem.typography.bodyFamily,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
            }}
            >
              Schedule Appointment
            </button>
            <button style={{
              padding: '10px 14px',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: '10px',
              color: 'inherit',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              transition: 'all 200ms',
              textAlign: 'left',
              fontFamily: modernDesignSystem.typography.bodyFamily,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
            }}
            >
              Create Prescription
            </button>
            <button style={{
              padding: '10px 14px',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: '10px',
              color: 'inherit',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              transition: 'all 200ms',
              textAlign: 'left',
              fontFamily: modernDesignSystem.typography.bodyFamily,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
            }}
            >
              Order Lab Tests
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

// Stat Card Component - Enhanced with better hover effects and visual hierarchy
function StatCard({ title, value, icon: Icon, bgColor, iconColor, trend }: any) {
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <div style={{
      backgroundColor: modernDesignSystem.colors.card,
      borderRadius: modernDesignSystem.borderRadius.lg,
      border: `1.5px solid ${isHovered ? modernDesignSystem.colors.primary : modernDesignSystem.colors.border}`,
      padding: '1.5rem',
      boxShadow: isHovered ? modernDesignSystem.shadows.lg : modernDesignSystem.shadows.sm,
      transition: 'all 250ms cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      cursor: 'pointer',
      position: 'relative',
      overflow: 'hidden',
    }}
    onMouseEnter={() => setIsHovered(true)}
    onMouseLeave={() => setIsHovered(false)}
    >
      {/* Gradient background on hover */}
      <div style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: '120px',
        height: '120px',
        backgroundColor: isHovered ? `${modernDesignSystem.colors.primary}08` : 'transparent',
        borderRadius: '50%',
        transform: 'translate(20%, -20%)',
        transition: 'all 300ms ease-out',
        pointerEvents: 'none',
      }} />

      <div style={{
        position: 'relative',
        zIndex: 1,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: '1rem',
        }}>
          <div style={{
            backgroundColor: bgColor,
            width: '56px',
            height: '56px',
            borderRadius: modernDesignSystem.borderRadius.md,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 250ms ease-out',
            transform: isHovered ? 'scale(1.1)' : 'scale(1)',
            boxShadow: isHovered ? `0 8px 16px ${iconColor}20` : 'none',
          }}>
            <Icon size={28} color={iconColor} strokeWidth={1.5} />
          </div>
          {isHovered && (
            <ChevronRight size={20} color={modernDesignSystem.colors.primary} style={{
              transition: 'all 200ms ease-out',
              opacity: isHovered ? 1 : 0,
            }} />
          )}
        </div>

        <h3 style={{
          fontSize: '12px',
          color: modernDesignSystem.colors.mutedForeground,
          fontWeight: 600,
          margin: '0 0 10px 0',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          fontFamily: modernDesignSystem.typography.bodyFamily,
          transition: 'color 200ms ease-out',
        }}>
          {title}
        </h3>

        <div style={{
          fontSize: '36px',
          fontWeight: 700,
          color: modernDesignSystem.colors.foreground,
          margin: '0 0 10px 0',
          fontFamily: modernDesignSystem.typography.headingFamily,
          transition: 'all 200ms ease-out',
          transform: isHovered ? 'scale(1.05) translateX(2px)' : 'scale(1)',
          transformOrigin: 'left',
        }}>
          {value}
        </div>

        <p style={{
          fontSize: '13px',
          color: modernDesignSystem.colors.mutedForeground,
          margin: 0,
          fontFamily: modernDesignSystem.typography.bodyFamily,
          lineHeight: '1.5',
        }}>
          {trend}
        </p>
      </div>
    </div>
  );
}

// Patient Row Component - Enhanced with better interactions
function PatientRow({ patient, statusConfig, modalityColors, onNavigate, borderTop }: any) {
  const [isHovered, setIsHovered] = React.useState(false);
  const status = statusConfig[patient.status] || statusConfig.stable;
  const StatusIcon = status.icon;

  return (
    <div style={{
      padding: '1.25rem 1.5rem',
      borderTop: borderTop ? `1px solid ${modernDesignSystem.colors.border}` : 'none',
      cursor: 'pointer',
      transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
      backgroundColor: isHovered ? modernDesignSystem.colors.muted : 'transparent',
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      borderLeft: isHovered ? `3px solid ${modernDesignSystem.colors.primary}` : '3px solid transparent',
      paddingLeft: isHovered ? '1.5rem' : '1.5rem',
    }}
    onMouseEnter={() => setIsHovered(true)}
    onMouseLeave={() => setIsHovered(false)}
    onClick={() => onNavigate('patient_details', patient.id)}
    >
      <div style={{
        width: '48px',
        height: '48px',
        backgroundColor: modalityColors[patient.modality] || modernDesignSystem.colors.primary,
        borderRadius: modernDesignSystem.borderRadius.md,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontWeight: 600,
        fontSize: '16px',
        fontFamily: modernDesignSystem.typography.headingFamily,
        transition: 'all 200ms ease-out',
        transform: isHovered ? 'scale(1.1)' : 'scale(1)',
        boxShadow: isHovered ? `0 8px 16px ${modalityColors[patient.modality]}30` : 'none',
        flexShrink: 0,
      }}>
        {patient.name.split(' ').map((n: string) => n[0]).join('')}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '6px',
        }}>
          <span style={{
            fontSize: '15px',
            fontWeight: 600,
            color: modernDesignSystem.colors.foreground,
            fontFamily: modernDesignSystem.typography.bodyFamily,
            transition: 'color 200ms ease-out',
          }}>
            {patient.name}
          </span>
          <span style={{
            fontSize: '12px',
            color: modernDesignSystem.colors.mutedForeground,
            backgroundColor: modernDesignSystem.colors.background,
            padding: '3px 10px',
            borderRadius: modernDesignSystem.borderRadius.sm,
            fontFamily: modernDesignSystem.typography.bodyFamily,
            fontWeight: 500,
          }}>
            {patient.age}y
          </span>
        </div>
        <p style={{
          fontSize: '13px',
          color: modernDesignSystem.colors.mutedForeground,
          margin: 0,
          fontFamily: modernDesignSystem.typography.bodyFamily,
          lineHeight: '1.4',
          maxWidth: '100%',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {patient.complaint}
        </p>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginLeft: '1rem',
        opacity: isHovered ? 1 : 0.8,
        transition: 'opacity 200ms ease-out',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          padding: '6px 12px',
          backgroundColor: modernDesignSystem.colors.background,
          borderRadius: modernDesignSystem.borderRadius.sm,
          whiteSpace: 'nowrap',
        }}>
          <StatusIcon size={14} color={status.color} strokeWidth={2} />
          <span style={{
            fontSize: '12px',
            fontWeight: 600,
            color: status.color,
            fontFamily: modernDesignSystem.typography.bodyFamily,
          }}>
            {status.label}
          </span>
        </div>
        <button style={{
          padding: '8px 14px',
          backgroundColor: isHovered ? modernDesignSystem.colors.accent : `${modernDesignSystem.colors.accent}CC`,
          color: modernDesignSystem.colors.onAccent,
          border: 'none',
          borderRadius: modernDesignSystem.borderRadius.sm,
          fontSize: '12px',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
          fontFamily: modernDesignSystem.typography.bodyFamily,
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          boxShadow: isHovered ? `0 6px 12px ${modernDesignSystem.colors.accent}30` : 'none',
          transform: isHovered ? 'translateY(-1px)' : 'translateY(0)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = modernDesignSystem.colors.accent;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = `${modernDesignSystem.colors.accent}CC`;
        }}
        onClick={(e) => {
          e.stopPropagation();
          onNavigate('cds_workflow', patient.id);
        }}
        >
          Review
          <ChevronRight size={14} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
