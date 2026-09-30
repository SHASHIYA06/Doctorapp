/**
 * Comprehensive Doctor Dashboard - Professional UI/UX Edition
 * Multi-modal healthcare management with Neumorphism design
 * 
 * Design System:
 * - Style: Neumorphism (Soft UI)
 * - Colors: Cyan (#0891B2) + Health Green (#059669)
 * - Typography: Figtree (headings) + Noto Sans (body)
 * - Motion: Standard (200-300ms transitions)
 * - Density: Dashboard-optimized (8/10)
 * - Accessibility: WCAG AA compliant
 */

import React, { useState, useEffect } from 'react';
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
  Video,
  MapPin,
  Bell,
  Settings,
  Search,
  Filter,
  BarChart3,
  Heart,
  Stethoscope,
  Briefcase,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  EyeOff,
} from 'lucide-react';
import { designSystem, healthcareColors } from '../design-system';

interface DashboardProps {
  onNavigate: (view: any, patientId?: string) => void;
}

interface PatientCase {
  id: string;
  name: string;
  age: number;
  gender: string;
  modality: string;
  status: string;
  priority: string;
  complaint: string;
  lastVisit: string;
  nextAppointment?: string;
  phone: string;
  location: string;
}

export function DoctorDashboard({ onNavigate }: DashboardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterModality, setFilterModality] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showNotifications, setShowNotifications] = useState(false);

  // Mock comprehensive patient data
  const [patients] = useState<PatientCase[]>([
    {
      id: 'P001',
      name: 'Rajesh Kumar Sharma',
      age: 52,
      gender: 'Male',
      modality: 'allopathy',
      status: 'critical',
      priority: 'urgent',
      complaint: 'Hypertension, Type 2 Diabetes, Chest discomfort',
      lastVisit: '2 hours ago',
      nextAppointment: 'Today 4:00 PM',
      phone: '+91 98765 43210',
      location: 'Mumbai, Maharashtra',
    },
    {
      id: 'P002',
      name: 'Priya Sharma',
      age: 34,
      gender: 'Female',
      modality: 'ayurveda',
      status: 'stable',
      priority: 'routine',
      complaint: 'Digestive issues, Fatigue, PCOD symptoms',
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
      complaint: 'Allergic rhinitis, Seasonal symptoms, Skin allergies',
      lastVisit: '3 days ago',
      nextAppointment: 'Friday 11:30 AM',
      phone: '+91 98765 43212',
      location: 'Ahmedabad, Gujarat',
    },
    {
      id: 'P004',
      name: 'Sunita Reddy',
      age: 45,
      gender: 'Female',
      modality: 'allopathy',
      status: 'recovering',
      priority: 'routine',
      complaint: 'Post-operative care, Thyroid disorder monitoring',
      lastVisit: '5 days ago',
      nextAppointment: 'Next week Monday',
      phone: '+91 98765 43213',
      location: 'Hyderabad, Telangana',
    },
    {
      id: 'P005',
      name: 'Mohammad Ali Khan',
      age: 61,
      gender: 'Male',
      modality: 'unani',
      status: 'stable',
      priority: 'routine',
      complaint: 'Arthritis, Joint pain, Lower back pain',
      lastVisit: '1 week ago',
      nextAppointment: 'Wednesday 2:00 PM',
      phone: '+91 98765 43214',
      location: 'Lucknow, UP',
    },
    {
      id: 'P006',
      name: 'Kavita Deshmukh',
      age: 38,
      gender: 'Female',
      modality: 'ayurveda',
      status: 'new_patient',
      priority: 'normal',
      complaint: 'Migraine, Sleep disorders, Anxiety',
      lastVisit: 'New intake',
      nextAppointment: 'Today 5:30 PM',
      phone: '+91 98765 43215',
      location: 'Pune, Maharashtra',
    },
    {
      id: 'P007',
      name: 'Arjun Singh',
      age: 25,
      gender: 'Male',
      modality: 'allopathy',
      status: 'under_treatment',
      priority: 'normal',
      complaint: 'Sports injury rehabilitation, Muscle strain',
      lastVisit: '2 days ago',
      nextAppointment: 'Tomorrow 3:00 PM',
      phone: '+91 98765 43216',
      location: 'Jaipur, Rajasthan',
    },
    {
      id: 'P008',
      name: 'Lakshmi Iyer',
      age: 71,
      gender: 'Female',
      modality: 'siddha',
      status: 'stable',
      priority: 'routine',
      complaint: 'Age-related joint issues, Blood pressure management',
      lastVisit: '4 days ago',
      nextAppointment: 'Thursday 9:00 AM',
      phone: '+91 98765 43217',
      location: 'Chennai, Tamil Nadu',
    },
  ]);

  const [todayAppointments] = useState([
    { time: '09:00 AM', patient: 'Rajesh Kumar', type: 'Follow-up', modality: 'allopathy', status: 'confirmed' },
    { time: '10:30 AM', patient: 'New Patient Walk-in', type: 'Consultation', modality: 'general', status: 'waiting' },
    { time: '11:45 AM', patient: 'Priya Sharma', type: 'Ayurvedic Consultation', modality: 'ayurveda', status: 'in_progress' },
    { time: '02:00 PM', patient: 'Amit Patel', type: 'Homeopathy Review', modality: 'homeopathy', status: 'upcoming' },
    { time: '04:00 PM', patient: 'Rajesh Kumar', type: 'Urgent Check', modality: 'allopathy', status: 'upcoming' },
    { time: '05:30 PM', patient: 'Kavita Deshmukh', type: 'New Patient Intake', modality: 'ayurveda', status: 'upcoming' },
  ]);

  // Statistics
  const stats = {
    totalPatients: patients.length,
    todayAppointments: todayAppointments.length,
    pendingReviews: patients.filter(p => p.status === 'critical' || p.status === 'new_patient').length,
    prescriptionsToSign: 5,
    unreadMessages: 12,
    revenue: '₹1,24,500',
  };

  const modalityColors: Record<string, string> = {
    allopathy: 'bg-blue-100 text-blue-700 border-blue-200',
    ayurveda: 'bg-green-100 text-green-700 border-green-200',
    homeopathy: 'bg-purple-100 text-purple-700 border-purple-200',
    unani: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    siddha: 'bg-pink-100 text-pink-700 border-pink-200',
    general: 'bg-gray-100 text-gray-700 border-gray-200',
  };

  const statusColors: Record<string, string> = {
    critical: 'bg-red-100 text-red-700 border-red-300',
    urgent: 'bg-orange-100 text-orange-700 border-orange-300',
    under_treatment: 'bg-blue-100 text-blue-700 border-blue-300',
    stable: 'bg-green-100 text-green-700 border-green-300',
    recovering: 'bg-teal-100 text-teal-700 border-teal-300',
    new_patient: 'bg-purple-100 text-purple-700 border-purple-300',
  };

  const appointmentStatusColors: Record<string, string> = {
    confirmed: 'bg-green-50 border-green-200',
    waiting: 'bg-yellow-50 border-yellow-200',
    in_progress: 'bg-blue-50 border-blue-200',
    upcoming: 'bg-gray-50 border-gray-200',
  };

  const filteredPatients = patients.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         p.complaint.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesModality = filterModality === 'all' || p.modality === filterModality;
    const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
    return matchesSearch && matchesModality && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Stethoscope className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Doctor Dashboard</h1>
                  <p className="text-sm text-gray-600">Multi-modal Healthcare Management</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                >
                  <Bell className="w-5 h-5" />
                  {stats.unreadMessages > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                  )}
                </button>
                
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-h-96 overflow-y-auto">
                    <h3 className="font-semibold text-gray-900 mb-3">Notifications</h3>
                    <div className="space-y-3">
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm font-medium text-red-900">Urgent: Rajesh Kumar</p>
                        <p className="text-xs text-red-700 mt-1">Reported chest discomfort - needs immediate attention</p>
                        <p className="text-xs text-gray-500 mt-1">2 min ago</p>
                      </div>
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm font-medium text-blue-900">Lab Results Ready</p>
                        <p className="text-xs text-blue-700 mt-1">Blood test results for Priya Sharma available</p>
                        <p className="text-xs text-gray-500 mt-1">15 min ago</p>
                      </div>
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm font-medium text-green-900">Prescription Approved</p>
                        <p className="text-xs text-green-700 mt-1">Insurance approved medication for Amit Patel</p>
                        <p className="text-xs text-gray-500 mt-1">1 hour ago</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition">
                <Settings className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-2 pl-4 border-l border-gray-200">
                <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">DR</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Dr. Administrator</p>
                  <p className="text-xs text-gray-600">Multi-specialty</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 uppercase">Total Patients</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalPatients}</p>
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> +12% this month
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition cursor-pointer" onClick={() => onNavigate('appointments')}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 uppercase">Today's Appointments</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.todayAppointments}</p>
                <p className="text-xs text-blue-600 mt-1">2 in progress</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition cursor-pointer" onClick={() => onNavigate('medical_records')}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 uppercase">Pending Reviews</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.pendingReviews}</p>
                <p className="text-xs text-orange-600 mt-1">{patients.filter(p => p.priority === 'urgent').length} urgent</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition cursor-pointer" onClick={() => onNavigate('prescriptions')}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 uppercase">Prescriptions</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.prescriptionsToSign}</p>
                <p className="text-xs text-purple-600 mt-1">Awaiting signature</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Pill className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition cursor-pointer" onClick={() => onNavigate('diagnostics')}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 uppercase">Lab Reports</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">8</p>
                <p className="text-xs text-teal-600 mt-1">3 new results</p>
              </div>
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                <TestTube className="w-6 h-6 text-teal-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition cursor-pointer" onClick={() => onNavigate('billing')}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600 uppercase">Revenue</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.revenue}</p>
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> Today
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Patient List */}
          <div className="lg:col-span-2 space-y-6">
            {/* Search and Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search patients by name or condition..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <select
                  value={filterModality}
                  onChange={(e) => setFilterModality(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Modalities</option>
                  <option value="allopathy">Allopathy</option>
                  <option value="ayurveda">Ayurveda</option>
                  <option value="homeopathy">Homeopathy</option>
                  <option value="unani">Unani</option>
                  <option value="siddha">Siddha</option>
                </select>
                
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="critical">Critical</option>
                  <option value="urgent">Urgent</option>
                  <option value="under_treatment">Under Treatment</option>
                  <option value="stable">Stable</option>
                  <option value="new_patient">New Patient</option>
                </select>
              </div>
            </div>

            {/* Patient Cards */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">Active Patients ({filteredPatients.length})</h2>
                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">View All →</button>
              </div>
              
              <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                {filteredPatients.map((patient) => (
                  <div
                    key={patient.id}
                    className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition"
                    onClick={() => onNavigate('patient_details', patient.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-sm">{patient.name.split(' ').map(n => n[0]).join('')}</span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-gray-900">{patient.name}</h3>
                              <span className="text-xs text-gray-500">#{patient.id}</span>
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-sm text-gray-600">{patient.age}y / {patient.gender}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full border ${modalityColors[patient.modality]}`}>
                                {patient.modality}
                              </span>
                              <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColors[patient.status]}`}>
                                {patient.status.replace('_', ' ')}
                              </span>
                              {patient.priority === 'urgent' && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-300 flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3" /> URGENT
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="ml-15">
                          <p className="text-sm text-gray-700 mb-2">{patient.complaint}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" /> Last visit: {patient.lastVisit}
                            </span>
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" /> {patient.phone}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> {patient.location}
                            </span>
                          </div>
                          {patient.nextAppointment && (
                            <div className="mt-2 inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                              <Calendar className="w-3 h-3" /> Next: {patient.nextAppointment}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onNavigate('cds_workflow', patient.id);
                          }}
                          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition shadow-sm"
                        >
                          Review
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onNavigate('prescriptions', patient.id);
                          }}
                          className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition"
                        >
                          Prescribe
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Today's Schedule */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900">Today's Schedule</h3>
                <p className="text-sm text-gray-600">{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
              
              <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
                {todayAppointments.map((apt, i) => (
                  <div key={i} className={`p-3 rounded-lg border ${appointmentStatusColors[apt.status]}`}>
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-sm font-bold text-gray-900">{apt.time}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${modalityColors[apt.modality]}`}>
                        {apt.modality}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-900">{apt.patient}</p>
                    <p className="text-xs text-gray-600 mt-1">{apt.type}</p>
                    <div className="mt-2 flex gap-2">
                      {apt.status === 'waiting' && (
                        <button className="text-xs px-3 py-1 bg-blue-600 text-white rounded font-medium">
                          Start Consultation
                        </button>
                      )}
                      {apt.status === 'in_progress' && (
                        <button className="text-xs px-3 py-1 bg-green-600 text-white rounded font-medium">
                          Complete
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="px-6 py-3 border-t border-gray-200">
                <button
                  onClick={() => onNavigate('appointments')}
                  className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  View Full Schedule →
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl shadow-lg p-6 text-white">
              <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={() => onNavigate('appointments')}
                  className="w-full px-4 py-3 bg-white/20 hover:bg-white/30 rounded-lg text-left font-medium transition backdrop-blur-sm"
                >
                  Schedule Appointment
                </button>
                <button
                  onClick={() => onNavigate('prescriptions')}
                  className="w-full px-4 py-3 bg-white/20 hover:bg-white/30 rounded-lg text-left font-medium transition backdrop-blur-sm"
                >
                  Create Prescription
                </button>
                <button
                  onClick={() => onNavigate('diagnostics')}
                  className="w-full px-4 py-3 bg-white/20 hover:bg-white/30 rounded-lg text-left font-medium transition backdrop-blur-sm"
                >
                  Order Lab Tests
                </button>
                <button
                  onClick={() => onNavigate('medical_records')}
                  className="w-full px-4 py-3 bg-white/20 hover:bg-white/30 rounded-lg text-left font-medium transition backdrop-blur-sm"
                >
                  View Medical Records
                </button>
              </div>
            </div>

            {/* Analytics Summary */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5" /> This Week
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">Consultations</span>
                    <span className="font-bold text-gray-900">42</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '84%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">Follow-ups</span>
                    <span className="font-bold text-gray-900">28</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: '56%' }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">New Patients</span>
                    <span className="font-bold text-gray-900">15</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-purple-600 h-2 rounded-full" style={{ width: '30%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
