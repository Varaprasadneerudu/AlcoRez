import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  ShieldCheck,
  Store,
  ArrowRight,
  Activity,
  UserPlus,
  X,
  CheckCircle2,
  AlertCircle,
  Users,
  User,
  Clock,
  Package,
  Edit3,
  Trash2,
  Search,
  RefreshCw,
  AlertTriangle,
  Lock,
  UserCheck
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function AdminDashboard() {
  const { user: currentAdmin, role, switchDemoAccount } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Users Directory state
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [activeMetricTab, setActiveMetricTab] = useState('users');

  // Provision user modal state
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [createUserData, setCreateUserData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    role: 'retailer',
    date_of_birth: '1995-01-01',
    retailer_id: '',
  });
  const [existingStores, setExistingStores] = useState([]);
  const [userCreating, setUserCreating] = useState(false);
  const [createUserSuccess, setCreateUserSuccess] = useState(null);
  const [createUserError, setCreateUserError] = useState(null);

  // Edit user modal state
  const [editUserModal, setEditUserModal] = useState(null);
  const [editUserData, setEditUserData] = useState({
    full_name: '',
    email: '',
    phone: '',
    role: 'customer',
    is_active: true,
    is_verified: false,
  });
  const [editUserLoading, setEditUserLoading] = useState(false);
  const [editUserError, setEditUserError] = useState(null);

  // Delete user modal state
  const [deleteUserModal, setDeleteUserModal] = useState(null);
  const [deleteUserLoading, setDeleteUserLoading] = useState(false);
  const [deleteUserError, setDeleteUserError] = useState(null);

  // Success action alert
  const [actionSuccess, setActionSuccess] = useState(null);

  const loadStats = async () => {
    try {
      const [dashData, retailersData] = await Promise.all([
        api.getAdminDashboard(),
        api.getRetailers().catch(() => [])
      ]);
      setStats(dashData);
      setExistingStores(retailersData || []);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const loadUsers = async () => {
    try {
      setUsersLoading(true);
      const data = await api.getUsers();
      setUsers(data || []);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    if (role === 'admin') {
      setLoading(true);
      Promise.all([loadStats(), loadUsers()])
        .catch((err) => setError(err.message || 'Failed to load administrator dashboard'))
        .finally(() => setLoading(false));
    }
  }, [role]);

  // If user is not admin
  if (role !== 'admin') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 bg-stone-900 text-amber-400 rounded-2xl flex items-center justify-center mx-auto">
          <Shield className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-extrabold text-stone-900">Excise Administrator Access Required</h2>
        <p className="text-xs text-stone-600 max-w-md mx-auto leading-relaxed">
          You are currently signed in as <strong>{currentAdmin?.full_name || 'Guest'}</strong> ({role}).
          This dashboard is reserved for State Prohibition & Excise Administrators for license verification and compliance oversight.
        </p>

        <button
          onClick={() => switchDemoAccount('admin')}
          className="py-3 px-6 rounded-xl font-bold text-xs bg-stone-900 hover:bg-stone-800 text-white shadow"
        >
          Switch to Excise Admin Profile (Govt of Telangana)
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="w-12 h-12 border-4 border-stone-900 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-xs text-stone-500">Loading excise regulatory dashboard...</p>
      </div>
    );
  }

  // Handle Create User
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setUserCreating(true);
    setCreateUserError(null);
    setCreateUserSuccess(null);
    try {
      const payload = {
        ...createUserData,
        retailer_id: createUserData.role === 'retailer' && createUserData.retailer_id ? createUserData.retailer_id : undefined
      };
      await api.register(payload);
      const assignedStore = existingStores.find((s) => s.id === createUserData.retailer_id);
      const storeNote = assignedStore ? ` & assigned to "${assignedStore.shop_name}"` : '';
      setCreateUserSuccess(`User account created for ${createUserData.email} (${createUserData.role.toUpperCase()})${storeNote}!`);
      setCreateUserData({
        full_name: '',
        email: '',
        phone: '',
        password: '',
        role: 'retailer',
        date_of_birth: '1995-01-01',
        retailer_id: '',
      });
      await Promise.all([loadStats(), loadUsers()]);
    } catch (err) {
      setCreateUserError(err.message || 'Failed to create user account');
    } finally {
      setUserCreating(false);
    }
  };

  // Open Edit User Modal
  const handleOpenEditUser = (u) => {
    setEditUserModal(u);
    setEditUserData({
      full_name: u.full_name || '',
      email: u.email || '',
      phone: u.phone || '',
      role: u.role || 'customer',
      is_active: u.is_active ?? true,
      is_verified: u.is_verified ?? false,
    });
    setEditUserError(null);
  };

  // Submit Edit User
  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!editUserModal) return;
    setEditUserLoading(true);
    setEditUserError(null);
    try {
      await api.updateUser(editUserModal.id, editUserData);
      setActionSuccess(`User account for ${editUserData.email} was successfully updated!`);
      setEditUserModal(null);
      await Promise.all([loadStats(), loadUsers()]);
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err) {
      setEditUserError(err.message || 'Failed to update user details');
    } finally {
      setEditUserLoading(false);
    }
  };

  // Submit Delete User
  const handleDeleteUser = async () => {
    if (!deleteUserModal) return;
    setDeleteUserLoading(true);
    setDeleteUserError(null);
    try {
      await api.deleteUser(deleteUserModal.id);
      setActionSuccess(`User account for ${deleteUserModal.email} was permanently deleted.`);
      setDeleteUserModal(null);
      await Promise.all([loadStats(), loadUsers()]);
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err) {
      setDeleteUserError(err.message || 'Failed to delete user');
    } finally {
      setDeleteUserLoading(false);
    }
  };

  // Filter users list
  const filteredUsers = users.filter((u) => {
    if (userRoleFilter !== 'all' && u.role !== userRoleFilter) {
      return false;
    }
    if (userSearchQuery.trim()) {
      const q = userSearchQuery.toLowerCase();
      const matchName = u.full_name?.toLowerCase().includes(q);
      const matchEmail = u.email?.toLowerCase().includes(q);
      const matchPhone = u.phone?.toLowerCase().includes(q);
      return matchName || matchEmail || matchPhone;
    }
    return true;
  });

  const posture = stats?.compliance_posture;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {error && (
        <div className="bg-red-50 text-red-800 p-4 rounded-xl text-xs border border-red-200">
          {error}
        </div>
      )}

      {actionSuccess && (
        <div className="bg-emerald-50 text-emerald-900 p-4 rounded-2xl text-xs border border-emerald-300 flex items-center justify-between shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2 font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-700 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      
      {/* Admin Header */}
      <div className="bg-stone-900 text-white rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl border border-stone-800">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-400/30 flex items-center justify-center shrink-0">
            <Shield className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                State Excise Regulatory Portal
              </h1>
              <span className="bg-amber-400 text-stone-950 text-[10px] font-black px-2 py-0.5 rounded uppercase">
                ADMIN
              </span>
            </div>
            <p className="text-xs text-stone-400 mt-1 font-medium">
              Government of Telangana • Prohibition & Excise Department Oversight Portal
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              setShowCreateUserModal(true);
              setCreateUserSuccess(null);
              setCreateUserError(null);
            }}
            className="py-2.5 px-4 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow transition flex items-center gap-1.5"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Provision New User
          </button>
          <Link
            to="/admin/retailers"
            className="py-2.5 px-4 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-stone-950 dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-stone-950 shadow-md transition flex items-center gap-1.5"
          >
            <Store className="w-3.5 h-3.5 text-stone-950" />
            Review Retailers ({stats?.pending_retailers || 0} Pending)
          </Link>
          <Link
            to="/admin/audit-logs"
            className="py-2.5 px-4 rounded-xl text-xs font-semibold bg-stone-800 hover:bg-stone-700 text-white transition flex items-center gap-1.5"
          >
            <Activity className="w-3.5 h-3.5 text-amber-400" />
            Audit Logs
          </Link>
        </div>
      </div>

      {/* Metrics Row - Interactive Action Tabs */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400">
            Live System Metrics (Click to inspect & perform actions)
          </span>
          <span className="text-[11px] text-amber-700 font-semibold">
            Active view: {activeMetricTab === 'users' ? (userRoleFilter === 'customer' ? 'Customers' : 'Total Users') : activeMetricTab}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          
          {/* Card 1: Total Users (Action: View & Manage All Users) */}
          <button
            onClick={() => {
              setActiveMetricTab('users');
              setUserRoleFilter('all');
              document.getElementById('users-directory-section')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className={`text-left rounded-2xl border p-4 space-y-1 shadow-sm transition hover:shadow-md ${
              activeMetricTab === 'users' && userRoleFilter === 'all'
                ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500/20'
                : 'bg-white border-stone-200 hover:border-amber-300'
            }`}
            title="Inspect all registered accounts, edit details, or delete users"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-stone-400">Total Users</span>
              <Users className="w-3.5 h-3.5 text-stone-400" />
            </div>
            <div className="text-xl font-extrabold text-stone-900">{stats?.total_users || 0}</div>
            <span className="text-[10px] text-amber-700 font-bold block pt-0.5">Manage Users →</span>
          </button>

          {/* Card 2: Customers (Action: View & Manage Customers) */}
          <button
            onClick={() => {
              setActiveMetricTab('users');
              setUserRoleFilter('customer');
              document.getElementById('users-directory-section')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className={`text-left rounded-2xl border p-4 space-y-1 shadow-sm transition hover:shadow-md ${
              activeMetricTab === 'users' && userRoleFilter === 'customer'
                ? 'bg-amber-50 border-amber-500 ring-2 ring-amber-500/20'
                : 'bg-white border-stone-200 hover:border-amber-300'
            }`}
            title="Filter directly to consumer accounts"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-stone-400">Customers</span>
              <User className="w-3.5 h-3.5 text-stone-400" />
            </div>
            <div className="text-xl font-extrabold text-stone-900">{stats?.total_customers || 0}</div>
            <span className="text-[10px] text-amber-700 font-bold block pt-0.5">Filter Customers →</span>
          </button>

          {/* Card 3: Approved Shops (Action: Manage Approved Retailers) */}
          <Link
            to="/admin/retailers"
            className="text-left rounded-2xl border border-stone-200 bg-white hover:border-emerald-400 p-4 space-y-1 shadow-sm transition hover:shadow-md block"
            title="Review approved Form A4 wine shop licenses"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-stone-400">Approved Shops</span>
              <Store className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="text-xl font-extrabold text-emerald-700">{stats?.approved_retailers || 0}</div>
            <span className="text-[10px] text-emerald-700 font-bold block pt-0.5">View Approved →</span>
          </Link>

          {/* Card 4: Pending Review (Action: Review Applications) */}
          <Link
            to="/admin/retailers"
            className="text-left rounded-2xl border border-stone-200 bg-white hover:border-amber-400 p-4 space-y-1 shadow-sm transition hover:shadow-md block"
            title="Inspect pending retailer license applications"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-stone-400">Pending Review</span>
              <Clock className="w-3.5 h-3.5 text-amber-600" />
            </div>
            <div className="text-xl font-extrabold text-amber-700">{stats?.pending_retailers || 0}</div>
            <span className="text-[10px] text-amber-700 font-bold block pt-0.5">Review Licenses →</span>
          </Link>

          {/* Card 5: SKU Inventory (Action: Catalogue Discovery) */}
          <Link
            to="/products"
            className="text-left rounded-2xl border border-stone-200 bg-white hover:border-stone-400 p-4 space-y-1 shadow-sm transition hover:shadow-md block"
            title="Browse all beverage SKU listings"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-stone-400">SKU Inventory</span>
              <Package className="w-3.5 h-3.5 text-stone-400" />
            </div>
            <div className="text-xl font-extrabold text-stone-900">{stats?.total_inventory_items || 0}</div>
            <span className="text-[10px] text-stone-600 font-bold block pt-0.5">Open Catalogue →</span>
          </Link>

          {/* Card 6: Test Orders (Action: Audit Simulated Orders) */}
          <Link
            to="/admin/audit-logs"
            className="text-left rounded-2xl border border-stone-200 bg-white hover:border-stone-400 p-4 space-y-1 shadow-sm transition hover:shadow-md block"
            title="Audit demonstration transactions and ledger"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-stone-400">Test Orders</span>
              <Activity className="w-3.5 h-3.5 text-stone-400" />
            </div>
            <div className="text-xl font-extrabold text-stone-900">{stats?.total_simulated_orders || 0}</div>
            <span className="text-[10px] text-stone-600 font-bold block pt-0.5">Audit Orders →</span>
          </Link>

        </div>
      </div>

      {/* Present Users Directory & Regulatory Management Section */}
      <div id="users-directory-section" className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 space-y-6 shadow-sm">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-stone-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-stone-900 text-amber-400 px-2 py-0.5 rounded">
                Admin Controls
              </span>
              <h2 className="text-lg font-extrabold text-stone-900">
                System Users Directory & Operations
              </h2>
            </div>
            <p className="text-xs text-stone-500 mt-1">
              Inspect present accounts, edit profile particulars & role privileges, or permanently delete users under state excise authority.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => { loadUsers(); loadStats(); }}
              disabled={usersLoading}
              className="p-2 rounded-xl text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 transition"
              title="Refresh User List"
            >
              <RefreshCw className={`w-4 h-4 ${usersLoading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={() => {
                setShowCreateUserModal(true);
                setCreateUserSuccess(null);
                setCreateUserError(null);
              }}
              className="py-2 px-3.5 rounded-xl font-bold text-xs bg-amber-600 hover:bg-amber-700 text-white shadow-sm flex items-center gap-1.5 transition"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Provision User</span>
            </button>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          {/* Role Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'all', label: `All Users (${users.length})` },
              { id: 'customer', label: `Customers (${users.filter(u => u.role === 'customer').length})` },
              { id: 'retailer', label: `Retailers (${users.filter(u => u.role === 'retailer').length})` },
              { id: 'admin', label: `Admins (${users.filter(u => u.role === 'admin').length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setUserRoleFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  userRoleFilter === tab.id
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[240px]">
            <input
              type="text"
              value={userSearchQuery}
              onChange={(e) => setUserSearchQuery(e.target.value)}
              placeholder="Search by name, email, or phone..."
              className="w-full pl-9 pr-7 py-1.5 rounded-xl text-xs bg-stone-50 border border-stone-200 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition"
            />
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            {userSearchQuery && (
              <button
                onClick={() => setUserSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Users Table */}
        {usersLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-stone-50 rounded-2xl border border-stone-100 animate-pulse" />
            ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-8 text-center bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
            <Users className="w-8 h-8 text-stone-400 mx-auto" />
            <h4 className="font-bold text-stone-800 text-sm">No users found</h4>
            <p className="text-xs text-stone-500">
              No present accounts match your current filter criteria or search keyword.
            </p>
          </div>
        ) : (
          <div className="border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-100 dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 text-stone-800 dark:text-stone-200 font-extrabold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3.5 px-4">User Details</th>
                    <th className="py-3.5 px-3">Role</th>
                    <th className="py-3.5 px-3">Phone</th>
                    <th className="py-3.5 px-3">Status</th>
                    <th className="py-3.5 px-3">Age 21+ Gate</th>
                    <th className="py-3.5 px-3">Registered</th>
                    <th className="py-3.5 px-4 text-right">Excise Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                  {filteredUsers.map((u) => {
                    const isSelf = u.id === currentAdmin?.id;

                    return (
                      <tr key={u.id} className="hover:bg-amber-50/30 dark:hover:bg-stone-800/40 transition">
                        {/* Name & Email */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                            <span>{u.full_name}</span>
                            {isSelf && (
                              <span className="text-[9px] bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800 font-extrabold px-1.5 py-0.2 rounded">
                                YOU (Active)
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-stone-500 dark:text-stone-400 font-mono mt-0.5">{u.email}</div>
                        </td>

                        {/* Role */}
                        <td className="py-3.5 px-3">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                              u.role === 'admin'
                                ? 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/60'
                                : u.role === 'retailer'
                                ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800/60'
                                : 'bg-stone-100 text-stone-700 border-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700'
                            }`}
                          >
                            {u.role === 'retailer' ? 'Retailer' : u.role === 'admin' ? 'Admin' : 'Customer'}
                          </span>
                        </td>

                        {/* Phone */}
                        <td className="py-3.5 px-3 text-stone-600 dark:text-stone-300 font-medium">
                          {u.phone || '—'}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-3">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                              u.is_active
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800/60'
                                : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-400 dark:border-rose-800/60'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${u.is_active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                            {u.is_active ? 'Active' : 'Deactivated'}
                          </span>
                        </td>

                        {/* Age Verified */}
                        <td className="py-3.5 px-3">
                          {u.is_verified ? (
                            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              Verified (21+)
                            </span>
                          ) : (
                            <span className="text-[11px] text-stone-400 italic">Unverified</span>
                          )}
                        </td>

                        {/* Registered Date */}
                        <td className="py-3.5 px-3 text-stone-500 dark:text-stone-400 text-[11px]">
                          {new Date(u.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </td>

                        {/* Administrative Operations */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Edit Button */}
                            <button
                              onClick={() => handleOpenEditUser(u)}
                              className="p-1.5 rounded-lg text-stone-600 dark:text-stone-300 hover:text-amber-800 dark:hover:text-amber-300 hover:bg-amber-50 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-800 transition"
                              title="Edit user details"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete Button */}
                            <button
                              onClick={() => {
                                setDeleteUserModal(u);
                                setDeleteUserError(null);
                              }}
                              disabled={isSelf}
                              className={`p-1.5 rounded-lg border transition ${
                                isSelf
                                  ? 'text-stone-300 dark:text-stone-600 border-stone-100 dark:border-stone-800/50 cursor-not-allowed'
                                  : 'text-rose-600 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-stone-800 border-stone-200 dark:border-stone-800'
                              }`}
                              title={isSelf ? 'Cannot delete your own active administrator account' : 'Delete user account permanently'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* Statutory Fail-Closed Compliance Posture Box */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
          <div>
            <h2 className="text-base font-extrabold text-stone-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              Statutory Compliance & Legal Gate Posture
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Telangana State Excise Act, 1968 Fail-Closed Architecture State
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Fail-Closed Security Active
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-1.5">
            <span className="text-stone-400 font-bold uppercase text-[10px]">Alcohol Transactions Gate</span>
            <div className="flex items-center gap-2">
              <span className={`font-mono font-bold text-sm ${posture?.alcohol_transactions_enabled ? 'text-emerald-700' : 'text-red-700'}`}>
                {String(posture?.alcohol_transactions_enabled).toUpperCase()}
              </span>
              <span className="text-[10px] bg-red-100 text-red-800 font-bold px-1.5 py-0.2 rounded">
                DISABLED BY DEFAULT
              </span>
            </div>
            <p className="text-[11px] text-stone-500 leading-normal">
              Commercial financial transactions are blocked on server-side compliance layer.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-1.5">
            <span className="text-stone-400 font-bold uppercase text-[10px]">Doorstep Alcohol Delivery</span>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-sm text-red-700">
                PROHIBITED
              </span>
              <span className="text-[10px] bg-red-100 text-red-800 font-bold px-1.5 py-0.2 rounded">
                EXCISE LAW
              </span>
            </div>
            <p className="text-[11px] text-stone-500 leading-normal">
              No statutory clearance issued by Government of Telangana for home alcohol dispatch.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-1.5">
            <span className="text-stone-400 font-bold uppercase text-[10px]">Statutory Minimum Age</span>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-sm text-stone-900">
                21 YEARS OLD
              </span>
              <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-1.5 py-0.2 rounded">
                MANDATORY
              </span>
            </div>
            <p className="text-[11px] text-stone-500 leading-normal">
              All registrations and site visits are age-gated under Telangana Excise rules.
            </p>
          </div>

        </div>

        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
          <p className="font-bold">Administrator Legal Accountability Reminder:</p>
          <p className="leading-relaxed text-[11px] text-stone-700">
            An administrator's checkbox or settings override does NOT replace official state gazette notifications.
            Before enabling any live transaction flow, independent legal review of Telangana excise notifications, dry-day regulations,
            and banking payment provider policies must be completed and logged to the immutable audit trail.
          </p>
        </div>
      </div>

      {/* Quick Action Navigation */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-semibold">
        <Link
          to="/admin/retailers"
          className="p-5 bg-white rounded-2xl border border-stone-200 hover:border-amber-400 shadow-sm transition flex items-center justify-between"
        >
          <div className="space-y-1">
            <span className="font-bold text-stone-900 text-sm block">Retailer Approvals</span>
            <span className="text-stone-500">Inspect license numbers and physical premises</span>
          </div>
          <ArrowRight className="w-4 h-4 text-amber-700" />
        </Link>

        <Link
          to="/admin/compliance"
          className="p-5 bg-white rounded-2xl border border-stone-200 hover:border-amber-400 shadow-sm transition flex items-center justify-between"
        >
          <div className="space-y-1">
            <span className="font-bold text-stone-900 text-sm block">Statutory Gate Controls</span>
            <span className="text-stone-500">Review 5 critical compliance prerequisites</span>
          </div>
          <ArrowRight className="w-4 h-4 text-amber-700" />
        </Link>

        <Link
          to="/admin/audit-logs"
          className="p-5 bg-white rounded-2xl border border-stone-200 hover:border-amber-400 shadow-sm transition flex items-center justify-between"
        >
          <div className="space-y-1">
            <span className="font-bold text-stone-900 text-sm block">Immutable Audit Trails</span>
            <span className="text-stone-500">Inspect cryptographic forensic event logs</span>
          </div>
          <ArrowRight className="w-4 h-4 text-amber-700" />
        </Link>
      </div>

      {/* Provision New User Modal */}
      {showCreateUserModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-4 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowCreateUserModal(false)}
              className="absolute right-5 top-5 p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                Excise Authority
              </span>
              <h3 className="text-xl font-extrabold text-stone-900 mt-1">
                Provision New User Account
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Create verified credentials for customers, licensed wine retailers, or excise administrators.
              </p>
            </div>

            {createUserSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{createUserSuccess}</span>
              </div>
            )}

            {createUserError && (
              <div className="p-3 bg-red-50 text-red-800 rounded-xl border border-red-200 flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{createUserError}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-3">
              <div>
                <label className="block text-stone-700 font-bold mb-1">Account Role</label>
                <select
                  value={createUserData.role}
                  onChange={(e) => setCreateUserData({ ...createUserData, role: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 font-bold outline-none"
                >
                  <option value="retailer">Licensed Retailer (Wine Shop Licensee)</option>
                  <option value="customer">Customer (Age 21+ Consumer)</option>
                  <option value="admin">Excise Administrator (Govt of Telangana)</option>
                </select>
              </div>

              {createUserData.role === 'retailer' && (
                <div className="bg-amber-50/70 p-3 rounded-2xl border border-amber-200 space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-amber-950 text-xs">
                    <Store className="w-3.5 h-3.5 text-amber-700" />
                    <span>Assign to Existing Licensed Store</span>
                  </div>
                  <p className="text-[11px] text-amber-800">
                    Optionally select an existing authorized store so this retailer user can manage its inventory:
                  </p>
                  <select
                    value={createUserData.retailer_id}
                    onChange={(e) => setCreateUserData({ ...createUserData, retailer_id: e.target.value })}
                    className="w-full p-2 rounded-xl border border-amber-300 bg-white font-medium text-stone-900 outline-none text-xs"
                  >
                    <option value="">— Unassigned (New Store Application Later) —</option>
                    {existingStores.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.shop_name} ({st.city} • A4 License)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-stone-700 font-bold mb-1">Full Legal Name</label>
                <input
                  type="text"
                  value={createUserData.full_name}
                  onChange={(e) => setCreateUserData({ ...createUserData, full_name: e.target.value })}
                  placeholder="e.g. Ramesh Kumar Goud"
                  className="w-full p-2.5 rounded-xl border border-stone-200 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">Email Address</label>
                <input
                  type="email"
                  value={createUserData.email}
                  onChange={(e) => setCreateUserData({ ...createUserData, email: e.target.value })}
                  placeholder="user@telangana.mock"
                  className="w-full p-2.5 rounded-xl border border-stone-200 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-stone-700 font-bold mb-1">Mobile Phone</label>
                  <input
                    type="text"
                    value={createUserData.phone}
                    onChange={(e) => setCreateUserData({ ...createUserData, phone: e.target.value })}
                    placeholder="+91-9876543210"
                    className="w-full p-2.5 rounded-xl border border-stone-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-bold mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={createUserData.date_of_birth}
                    onChange={(e) => setCreateUserData({ ...createUserData, date_of_birth: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-stone-200 outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">Initial Password</label>
                <input
                  type="password"
                  value={createUserData.password}
                  onChange={(e) => setCreateUserData({ ...createUserData, password: e.target.value })}
                  placeholder="Minimum 6 characters"
                  className="w-full p-2.5 rounded-xl border border-stone-200 outline-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowCreateUserModal(false)}
                  className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-xl"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={userCreating}
                  className="px-5 py-2 font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow disabled:opacity-50"
                >
                  {userCreating ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editUserModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-4 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setEditUserModal(null)}
              className="absolute right-5 top-5 p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                User Modification
              </span>
              <h3 className="text-xl font-extrabold text-stone-900 mt-1">
                Edit User Details
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Update account particulars, role privileges, or active status for <strong className="text-stone-800">{editUserModal.email}</strong>.
              </p>
            </div>

            {editUserError && (
              <div className="p-3 bg-red-50 text-red-800 rounded-xl border border-red-200 flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{editUserError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateUser} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-stone-700 font-bold mb-1">Full Legal Name</label>
                <input
                  type="text"
                  value={editUserData.full_name}
                  onChange={(e) => setEditUserData({ ...editUserData, full_name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-stone-200 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">Email Address</label>
                <input
                  type="email"
                  value={editUserData.email}
                  onChange={(e) => setEditUserData({ ...editUserData, email: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-stone-200 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-stone-700 font-bold mb-1">Mobile Phone</label>
                <input
                  type="text"
                  value={editUserData.phone}
                  onChange={(e) => setEditUserData({ ...editUserData, phone: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-stone-200 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-bold mb-1">Account Role</label>
                  <select
                    value={editUserData.role}
                    onChange={(e) => setEditUserData({ ...editUserData, role: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 font-bold outline-none"
                  >
                    <option value="customer">Customer (Consumer)</option>
                    <option value="retailer">Licensed Retailer (A4 Shop)</option>
                    <option value="admin">Excise Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-stone-700 font-bold mb-1">Account Status</label>
                  <select
                    value={editUserData.is_active ? 'active' : 'deactivated'}
                    onChange={(e) => setEditUserData({ ...editUserData, is_active: e.target.value === 'active' })}
                    className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 font-bold outline-none"
                  >
                    <option value="active">Active</option>
                    <option value="deactivated">Deactivated / Suspended</option>
                  </select>
                </div>
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-xl bg-stone-50 border border-stone-200">
                  <input
                    type="checkbox"
                    checked={editUserData.is_verified}
                    onChange={(e) => setEditUserData({ ...editUserData, is_verified: e.target.checked })}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                  />
                  <div>
                    <span className="font-bold text-stone-800 block">Telangana Age 21+ Verified</span>
                    <span className="text-[11px] text-stone-500 block">Mark identity documentation as officially verified by Excise Dept</span>
                  </div>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setEditUserModal(null)}
                  className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editUserLoading}
                  className="px-5 py-2 font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow disabled:opacity-50"
                >
                  {editUserLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {deleteUserModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl relative">
            <button
              onClick={() => setDeleteUserModal(null)}
              className="absolute right-5 top-5 p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 bg-rose-100 px-2 py-0.5 rounded">
                Permanent Action
              </span>
              <h3 className="text-xl font-extrabold text-stone-900 mt-1">
                Delete User Account?
              </h3>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                You are about to permanently remove this user account from the Telangana Liquor Marketplace database under Excise Regulatory Oversight.
              </p>
            </div>

            {/* Target User Info */}
            <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-stone-400">User:</span>
                <span className="font-bold text-stone-900">{deleteUserModal.full_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">Email:</span>
                <span className="font-mono text-stone-700">{deleteUserModal.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-400">Role:</span>
                <span className="font-bold uppercase text-amber-800">{deleteUserModal.role}</span>
              </div>
            </div>

            {deleteUserError && (
              <div className="p-3 bg-red-50 text-red-800 rounded-xl border border-red-200 flex items-center gap-2 font-medium text-xs">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{deleteUserError}</span>
              </div>
            )}

            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-[11px] text-rose-900 space-y-1">
              <p className="font-bold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                Statutory Notice:
              </p>
              <p className="leading-relaxed">
                This operation will delete the user's login access, profile records, and associated demonstration order history. This action cannot be reversed.
              </p>
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setDeleteUserModal(null)}
                className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                disabled={deleteUserLoading}
                className="px-5 py-2 font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow text-xs disabled:opacity-50 flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{deleteUserLoading ? 'Deleting...' : 'Permanently Delete User'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
