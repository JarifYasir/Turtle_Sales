import React, { useContext, useEffect, useState } from "react";
import "../styles/Dashboard.css";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { UserContext } from "../usercontext/UserContext";
import defaultProfilePic from "../assets/profile-pictures/default.jpg";
import DeleteConfirmModal from "../components/DeleteConfirmModal";
import EditNameModal from "../components/EditNameModal";
import axios from "axios";
import LoadingSpinner from "../components/LoadingComponents";

const Dashboard = () => {
  const { user, token, setUser, setToken } = useContext(UserContext);
  const navigate = useNavigate();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showLeaveOrgModal, setShowLeaveOrgModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [leaveOrgLoading, setLeaveOrgLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate("/login");
    }
  }, [token, navigate]);

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);

    try {
      const response = await axios.delete(
        `${import.meta.env.VITE_API_URL}/auth/delete-account`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        localStorage.removeItem("auth");
        setUser(null);
        setToken("");
        setShowDeleteModal(false);
        toast.success("Account deleted successfully");
        navigate("/");
      }
    } catch (error) {
      console.error("Delete account error:", error);
      if (error.response && error.response.data) {
        toast.error(error.response.data.msg || "Failed to delete account");
      } else {
        toast.error("An error occurred while deleting account");
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleUpdateName = async (newName) => {
    setEditLoading(true);

    try {
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/auth/update-profile`,
        { name: newName },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setUser(response.data.user);
        setShowEditModal(false);
        toast.success("Name updated successfully");
      }
    } catch (error) {
      console.error("Update name error:", error);
      if (error.response && error.response.data) {
        if (error.response.data.errors) {
          const errorMsg = error.response.data.errors[0].msg;
          toast.error(errorMsg);
        } else {
          toast.error(error.response.data.msg || "Failed to update name");
        }
      } else {
        toast.error("An error occurred while updating name");
      }
    } finally {
      setEditLoading(false);
    }
  };

  const openDeleteModal = () => {
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    if (!deleteLoading) {
      setShowDeleteModal(false);
    }
  };

  const openEditModal = () => {
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    if (!editLoading) {
      setShowEditModal(false);
    }
  };

  const handleLeaveOrganization = async () => {
    setLeaveOrgLoading(true);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/organization/leave`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setShowLeaveOrgModal(false);
        toast.success("Successfully left the organization");
        navigate("/welcome");
      }
    } catch (error) {
      console.error("Leave organization error:", error);
      if (error.response && error.response.data) {
        toast.error(error.response.data.msg || "Failed to leave organization");
      } else {
        toast.error("An error occurred while leaving organization");
      }
    } finally {
      setLeaveOrgLoading(false);
    }
  };

  const openLeaveOrgModal = () => {
    setShowLeaveOrgModal(true);
  };

  const closeLeaveOrgModal = () => {
    if (!leaveOrgLoading) {
      setShowLeaveOrgModal(false);
    }
  };

  return (
    <div className="dashboard-container">
      {/* Header Section */}
      <div className="dashboard-header">
        <div className="header-content">
          <div className="welcome-section">
            <h1 className="dashboard-title">
              Welcome back, {user?.name || "User"}!
            </h1>
            <p className="dashboard-subtitle">
              Manage your profile and account settings
            </p>
          </div>
          <div className="header-actions">
            <Link to="/logout" className="logout-btn">
              <svg
                className="logout-icon"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
                />
              </svg>
              Logout
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-main">
        {user ? (
          <div className="dashboard-grid fade-in">
            {/* Profile Card */}
            <div className="profile-card slide-up">
              <div className="profile-card-header">
                <h2>Profile Information</h2>
                <div className="profile-status">
                  <span className="status-dot active"></span>
                  Active
                </div>
              </div>

              <div className="profile-content">
                <div className="profile-avatar-section">
                  <div className="profile-avatar">
                    <img
                      src={defaultProfilePic}
                      alt="Profile"
                      className="avatar-image"
                    />
                    <div className="avatar-overlay">
                      <svg
                        className="camera-icon"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="profile-quick-info">
                    <h3 className="profile-name">{user.name}</h3>
                    <p className="profile-role">Team Member</p>
                  </div>
                </div>

                <div className="profile-details">
                  <div className="detail-item">
                    <div className="detail-label">
                      <svg
                        className="detail-icon"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                      Full Name
                    </div>
                    <div className="detail-value">
                      <span>{user.name}</span>
                      <button
                        className="edit-btn"
                        onClick={openEditModal}
                        title="Edit name"
                      >
                        <svg
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="detail-item">
                    <div className="detail-label">
                      <svg
                        className="detail-icon"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                      Email Address
                    </div>
                    <div className="detail-value">
                      <span>{user.email}</span>
                    </div>
                  </div>

                  <div className="detail-item">
                    <div className="detail-label">
                      <svg
                        className="detail-icon"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0"
                        />
                      </svg>
                      User ID
                    </div>
                    <div className="detail-value">
                      <span className="user-id">#{user.id}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="actions-card slide-up">
              <div className="actions-header">
                <h2>Quick Actions</h2>
                <p>Manage your account and organization settings</p>
              </div>

              <div className="actions-grid">
                <Link to="/manage-org" className="action-item">
                  <div className="action-icon organization">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m0 0h2m0 0v-8a2 2 0 012-2h2a2 2 0 012 2v8m0 0V9a2 2 0 012-2h2a2 2 0 012 2v8"
                      />
                    </svg>
                  </div>
                  <div className="action-content">
                    <h3>Organization</h3>
                    <p>Manage organization settings</p>
                  </div>
                </Link>

                <Link to="/track-sales" className="action-item">
                  <div className="action-icon sales">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                  </div>
                  <div className="action-content">
                    <h3>Record Sale</h3>
                    <p>Record and monitor sales</p>
                  </div>
                </Link>

                <Link to="/sales-leaderboard" className="action-item">
                  <div className="action-icon leaderboard">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                      />
                    </svg>
                  </div>
                  <div className="action-content">
                    <h3>Leaderboard</h3>
                    <p>View sales rankings</p>
                  </div>
                </Link>

                <Link to="/manage-timeslots" className="action-item">
                  <div className="action-icon schedule">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div className="action-content">
                    <h3>Time Slots</h3>
                    <p>Manage work schedule</p>
                  </div>
                </Link>
              </div>
            </div>

            {/* Account Management Card */}
            <div className="account-management-card slide-up">
              <div className="management-header">
                <h2>Account Management</h2>
                <p>Sensitive account operations</p>
              </div>

              <div className="management-actions">
                <button
                  className="management-btn leave-org"
                  onClick={openLeaveOrgModal}
                >
                  <div className="btn-icon">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                  </div>
                  <div className="btn-content">
                    <span className="btn-title">Leave Organization</span>
                    <span className="btn-description">
                      Exit current organization
                    </span>
                  </div>
                </button>

                <button
                  className="management-btn delete-account"
                  onClick={openDeleteModal}
                >
                  <div className="btn-icon">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </div>
                  <div className="btn-content">
                    <span className="btn-title">Delete Account</span>
                    <span className="btn-description">
                      Permanently remove account
                    </span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="loading-container">
            <LoadingSpinner
              size="large"
              text="Loading your dashboard..."
              variant="turtle"
              fullScreen={false}
            />
          </div>
        )}
      </div>

      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteAccount}
        loading={deleteLoading}
      />

      <EditNameModal
        isOpen={showEditModal}
        onClose={closeEditModal}
        onSubmit={handleUpdateName}
        currentName={user?.name}
        loading={editLoading}
      />

      <DeleteConfirmModal
        isOpen={showLeaveOrgModal}
        onClose={closeLeaveOrgModal}
        onConfirm={handleLeaveOrganization}
        loading={leaveOrgLoading}
        title="Leave Organization"
        message="Are you sure you want to leave this organization?"
        warningText="You will no longer have access to organization data and will need to join or create a new organization."
        confirmText="Leave Organization"
        confirmButtonClass="leave-org-btn"
        loadingText="Leaving..."
        modalType="leave"
      />
    </div>
  );
};

export default Dashboard;
