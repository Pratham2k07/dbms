import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import * as apiService from '../../services/apiService';
import {
  Users,
  UserPlus,
  Shield,
  User,
  Bus,
  Trash2,
  Key,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Search,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  CreditCard,
  Briefcase,
  GraduationCap
} from 'lucide-react';

export interface AdminUserData {
  user_id: string;
  name: string;
  email: string;
  phone_number?: string;
  role: 'admin' | 'driver' | 'student';
  roll_no?: string;
  license_no?: string;
  designation?: string;
  department?: string;
}

export const AdminUsersScreen: React.FC = () => {
  const { triggerNotification, refreshDatabaseRecords } = useApp();

  const [users, setUsers] = useState<AdminUserData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'admin' | 'driver' | 'student'>('ALL');

  // Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [formRole, setFormRole] = useState<'student' | 'driver' | 'admin'>('student');
  const [formName, setFormName] = useState<string>('');
  const [formEmail, setFormEmail] = useState<string>('');
  const [formPassword, setFormPassword] = useState<string>('');
  const [formPhone, setFormPhone] = useState<string>('+91 ');
  const [formRollNo, setFormRollNo] = useState<string>('');
  const [formLicenseNo, setFormLicenseNo] = useState<string>('RJ14-2024-');
  const [formDesignation, setFormDesignation] = useState<string>('Transit Coordinator');
  const [formDepartment, setFormDepartment] = useState<string>('JKLU Mobility Cell');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>('');

  // Fetch users from backend
  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const data = await apiService.getAdminUsers();
      if (Array.isArray(data)) {
        setUsers(data);
      }
    } catch (err: any) {
      console.error('Failed to load users:', err);
      triggerNotification('ERROR', 'Failed to retrieve registered users list.', 'full');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !term ||
        u.name.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term) ||
        (u.phone_number && u.phone_number.includes(term)) ||
        (u.roll_no && u.roll_no.toLowerCase().includes(term)) ||
        (u.license_no && u.license_no.toLowerCase().includes(term)) ||
        (u.designation && u.designation.toLowerCase().includes(term));
      return matchesRole && matchesSearch;
    });
  }, [users, roleFilter, searchTerm]);

  // Counts
  const stats = useMemo(() => {
    return {
      total: users.length,
      admins: users.filter((u) => u.role === 'admin').length,
      drivers: users.filter((u) => u.role === 'driver').length,
      students: users.filter((u) => u.role === 'student').length
    };
  }, [users]);

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setFormRole('student');
    setFormName('');
    setFormEmail('');
    setFormPassword('');
    setFormPhone('+91 ');
    setFormRollNo('');
    setFormLicenseNo('RJ14-2024-');
    setFormDesignation('Transit Coordinator');
    setFormDepartment('JKLU Mobility Cell');
    setShowPassword(false);
    setFormError('');
    setIsCreateModalOpen(true);
  };

  // Submit Create User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formName.trim()) {
      setFormError('Full name is required.');
      return;
    }
    if (!formEmail.trim() || !formEmail.includes('@')) {
      setFormError('Please enter a valid email address.');
      return;
    }
    if (!formPassword.trim() || formPassword.trim().length < 4) {
      setFormError('Password must be at least 4 characters long.');
      return;
    }

    if (formRole === 'student' && !formRollNo.trim()) {
      setFormError('Student roll number is required.');
      return;
    }
    if (formRole === 'driver' && !formLicenseNo.trim()) {
      setFormError('Driver commercial license number is required.');
      return;
    }

    setFormSubmitting(true);
    try {
      const payload: any = {
        name: formName.trim(),
        email: formEmail.trim(),
        password: formPassword.trim(),
        role: formRole,
        phone_number: formPhone.trim() || undefined
      };

      if (formRole === 'student') {
        payload.roll_no = formRollNo.trim();
      } else if (formRole === 'driver') {
        payload.license_no = formLicenseNo.trim();
      } else if (formRole === 'admin') {
        payload.designation = formDesignation.trim();
        payload.department = formDepartment.trim();
      }

      await apiService.createAdminUser(payload);
      triggerNotification('USER CREATED', `Account for ${formName.trim()} (${formRole.toUpperCase()}) created successfully!`, 'info');

      setIsCreateModalOpen(false);
      await fetchUsers();
      // If driver was created, refresh app database so driver selection dropdowns populate immediately
      await refreshDatabaseRecords();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to create user.';
      setFormError(msg);
    } finally {
      setFormSubmitting(false);
    }
  };

  // Delete User
  const handleDeleteUser = async (user: AdminUserData) => {
    if (user.user_id === 'USR-001') {
      triggerNotification('PROTECTED ACCOUNT', 'Primary root administrator account cannot be deleted.', 'full');
      return;
    }

    if (!window.confirm(`Are you sure you want to permanently delete user "${user.name}" (${user.email})?`)) {
      return;
    }

    try {
      await apiService.deleteAdminUser(user.user_id);
      triggerNotification('USER DELETED', `User ${user.name} has been removed.`, 'info');
      await fetchUsers();
      await refreshDatabaseRecords();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to delete user.';
      triggerNotification('ERROR', msg, 'full');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200/80 pb-5">
        <div>
          <span className="text-[10px] font-mono font-bold tracking-widest text-[#E8590C] uppercase block">
            ACCESS CONTROL & IDENTITY DIRECTORY
          </span>
          <h1 className="font-editorial font-extrabold text-2xl sm:text-3xl text-[#121316] tracking-tight leading-none uppercase">
            USER MANAGEMENT
          </h1>
          <p className="text-xs text-stone-500 font-medium mt-1">
            Create, authenticate, and configure accounts for Administrators, Drivers, and Students
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchUsers}
            disabled={isLoading}
            className="p-2.5 rounded-2xl bg-white border border-stone-200 hover:border-stone-300 text-stone-600 shadow-xs flex items-center gap-1.5 text-xs font-editorial font-bold transition-all active:scale-95"
            title="Refresh Users"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#E8590C]' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="py-2.5 px-4 rounded-2xl bg-[#E8590C] hover:bg-[#D9480F] text-white shadow-sm flex items-center gap-2 text-xs font-editorial font-bold transition-all active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            <span>Create New User</span>
          </button>
        </div>
      </div>

      {/* Stats Counter Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-3xl bg-white border border-stone-200 shadow-subtle flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#1E3A68] flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold text-stone-400 uppercase block">TOTAL ACCOUNTS</span>
            <span className="font-editorial font-extrabold text-xl text-[#121316]">{stats.total}</span>
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-white border border-stone-200 shadow-subtle flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-orange-50 text-[#E8590C] flex items-center justify-center font-bold">
            <Bus className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold text-stone-400 uppercase block">FLEET DRIVERS</span>
            <span className="font-editorial font-extrabold text-xl text-[#E8590C]">{stats.drivers}</span>
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-white border border-stone-200 shadow-subtle flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold text-stone-400 uppercase block">STUDENTS</span>
            <span className="font-editorial font-extrabold text-xl text-emerald-600">{stats.students}</span>
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-white border border-stone-200 shadow-subtle flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-stone-100 text-stone-800 flex items-center justify-center font-bold">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold text-stone-400 uppercase block">ADMINISTRATORS</span>
            <span className="font-editorial font-extrabold text-xl text-stone-800">{stats.admins}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-3xl bg-white border border-stone-200 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Role Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {(
            [
              { id: 'ALL', label: 'All Users', count: stats.total },
              { id: 'driver', label: 'Drivers', count: stats.drivers },
              { id: 'student', label: 'Students', count: stats.students },
              { id: 'admin', label: 'Admins', count: stats.admins }
            ] as const
          ).map((item) => {
            const active = roleFilter === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setRoleFilter(item.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-editorial font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  active
                    ? 'bg-[#121316] text-white shadow-xs'
                    : 'bg-stone-50 text-stone-600 hover:bg-stone-100 hover:text-stone-900 border border-stone-200/60'
                }`}
              >
                <span>{item.label}</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${active ? 'bg-white/20 text-white' : 'bg-stone-200 text-stone-700'}`}>
                  {item.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search name, email, roll, license..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-200 text-xs font-editorial focus:outline-none focus:border-[#E8590C] focus:ring-1 focus:ring-[#E8590C]"
          />
        </div>
      </div>

      {/* Users List / Table */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-subtle overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-8 h-8 mx-auto border-2 border-[#E8590C] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-mono text-stone-500">Loading directory accounts...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-stone-100 flex items-center justify-center text-stone-400">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="font-editorial font-bold text-base text-stone-700">No matching accounts found</h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              No users matched your current search and role filters. Create a new user account to add them to the system.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-50/80 border-b border-stone-200/80 text-[10px] font-mono font-bold uppercase tracking-wider text-stone-500">
                  <th className="py-3 px-4 sm:px-6">User / Account</th>
                  <th className="py-3 px-4">Portal Role</th>
                  <th className="py-3 px-4">Identification / Role Details</th>
                  <th className="py-3 px-4">Contact Phone</th>
                  <th className="py-3 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-xs font-editorial">
                {filteredUsers.map((u) => {
                  const roleBadge =
                    u.role === 'admin' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#0F1E36] text-white">
                        <Shield className="w-3 h-3" />
                        <span>ADMIN</span>
                      </span>
                    ) : u.role === 'driver' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#E8590C] text-white">
                        <Bus className="w-3 h-3" />
                        <span>DRIVER</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white">
                        <GraduationCap className="w-3 h-3" />
                        <span>STUDENT</span>
                      </span>
                    );

                  const roleDetail =
                    u.role === 'driver' ? (
                      <span className="font-mono text-stone-700">
                        License: <strong>{u.license_no || 'Pending'}</strong>
                      </span>
                    ) : u.role === 'student' ? (
                      <span className="font-mono text-stone-700">
                        Roll: <strong>{u.roll_no || 'N/A'}</strong>
                      </span>
                    ) : (
                      <span className="text-stone-700">
                        {u.designation || 'Administrator'} • <span className="text-stone-500">{u.department || 'JKLU'}</span>
                      </span>
                    );

                  return (
                    <tr key={u.user_id} className="hover:bg-stone-50/60 transition-colors">
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-2xl flex items-center justify-center font-bold text-xs shadow-2xs ${
                              u.role === 'admin'
                                ? 'bg-blue-100 text-[#1E3A68]'
                                : u.role === 'driver'
                                ? 'bg-orange-100 text-[#E8590C]'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-stone-900 block">{u.name}</span>
                            <span className="text-[11px] font-mono text-stone-500 flex items-center gap-1 mt-0.5">
                              <Mail className="w-3 h-3 text-stone-400" />
                              <span>{u.email}</span>
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">{roleBadge}</td>

                      <td className="py-3.5 px-4">{roleDetail}</td>

                      <td className="py-3.5 px-4 font-mono text-stone-600">
                        {u.phone_number || <span className="text-stone-400 italic">Not provided</span>}
                      </td>

                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        {u.user_id !== 'USR-001' ? (
                          <button
                            onClick={() => handleDeleteUser(u)}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-[10px] font-mono text-stone-400 font-semibold px-2 py-0.5 rounded bg-stone-100">
                            Root
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-stone-200 space-y-6 my-8 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-orange-50 text-[#E8590C] flex items-center justify-center font-bold">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-editorial font-black text-lg text-[#121316] uppercase tracking-tight">
                    Create New User Account
                  </h3>
                  <p className="text-xs text-stone-500 font-medium">
                    Provision login credentials for Student, Driver, or Admin
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-2 rounded-xl text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateUser} className="space-y-4">
              {/* Role Selector Tabs */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-500 block">
                  Select User Role *
                </label>
                <div className="grid grid-cols-3 p-1 rounded-2xl bg-stone-100 gap-1 border border-stone-200/70">
                  <button
                    type="button"
                    onClick={() => setFormRole('student')}
                    className={`py-2 px-3 rounded-xl text-xs font-editorial font-bold flex items-center justify-center gap-1.5 transition-all ${
                      formRole === 'student'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    <GraduationCap className="w-3.5 h-3.5" />
                    <span>Student</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormRole('driver')}
                    className={`py-2 px-3 rounded-xl text-xs font-editorial font-bold flex items-center justify-center gap-1.5 transition-all ${
                      formRole === 'driver'
                        ? 'bg-[#E8590C] text-white shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    <Bus className="w-3.5 h-3.5" />
                    <span>Driver</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormRole('admin')}
                    className={`py-2 px-3 rounded-xl text-xs font-editorial font-bold flex items-center justify-center gap-1.5 transition-all ${
                      formRole === 'admin'
                        ? 'bg-[#0F1E36] text-white shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>Admin</span>
                  </button>
                </div>
              </div>

              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-500 block">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder={formRole === 'driver' ? 'e.g. Suresh Kumar Meena' : formRole === 'admin' ? 'e.g. Dr. Rakesh Gupta' : 'e.g. Aman Verma'}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs font-editorial focus:outline-none focus:border-[#E8590C] focus:ring-1 focus:ring-[#E8590C]"
                />
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-500 block">
                  University Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder={formRole === 'driver' ? 'suresh.kumar@jklu.edu.in' : formRole === 'admin' ? 'admin.rakesh@jklu.edu.in' : 'aman.verma@jklu.edu.in'}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs font-editorial focus:outline-none focus:border-[#E8590C] focus:ring-1 focus:ring-[#E8590C]"
                />
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-500 block">
                  Set User Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder="Enter security password for this account"
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-stone-200 text-xs font-editorial focus:outline-none focus:border-[#E8590C] focus:ring-1 focus:ring-[#E8590C]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] font-mono text-stone-400">
                  Password will be securely encrypted using bcrypt before database storage.
                </p>
              </div>

              {/* Phone Number */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-500 block">
                  Phone Number (Optional)
                </label>
                <input
                  type="text"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs font-editorial focus:outline-none focus:border-[#E8590C] focus:ring-1 focus:ring-[#E8590C]"
                />
              </div>

              {/* Role-specific fields */}
              {formRole === 'student' && (
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-500 block">
                    Student Roll Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={formRollNo}
                    onChange={(e) => setFormRollNo(e.target.value)}
                    placeholder="e.g. 2024BTECH045"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs font-editorial focus:outline-none focus:border-[#E8590C] focus:ring-1 focus:ring-[#E8590C]"
                  />
                </div>
              )}

              {formRole === 'driver' && (
                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-500 block">
                    Commercial Driving License Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={formLicenseNo}
                    onChange={(e) => setFormLicenseNo(e.target.value)}
                    placeholder="e.g. RJ14-2024-00842"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs font-editorial focus:outline-none focus:border-[#E8590C] focus:ring-1 focus:ring-[#E8590C]"
                  />
                  <p className="text-[10px] font-mono text-stone-400">
                    Once created, this driver can immediately be assigned to Shuttles, Corridors, and Trips.
                  </p>
                </div>
              )}

              {formRole === 'admin' && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-500 block">
                      Designation
                    </label>
                    <input
                      type="text"
                      value={formDesignation}
                      onChange={(e) => setFormDesignation(e.target.value)}
                      placeholder="e.g. Mobility Manager"
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs font-editorial focus:outline-none focus:border-[#E8590C]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-500 block">
                      Department
                    </label>
                    <input
                      type="text"
                      value={formDepartment}
                      onChange={(e) => setFormDepartment(e.target.value)}
                      placeholder="e.g. Transit Cell"
                      className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs font-editorial focus:outline-none focus:border-[#E8590C]"
                    />
                  </div>
                </div>
              )}

              {/* Error alert */}
              {formError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={formSubmitting}
                  className="px-4 py-2.5 rounded-xl border border-stone-200 text-xs font-editorial font-bold text-stone-600 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-[#E8590C] hover:bg-[#D9480F] text-white text-xs font-editorial font-bold shadow-sm flex items-center gap-2 transition-all active:scale-95"
                >
                  {formSubmitting ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Create Account & Save</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

