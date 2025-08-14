import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/ManageOrg.css";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { UserContext } from "../usercontext/UserContext";
import { toast } from "react-toastify";

const ManageOrg = () => {
  const { user, token } = useContext(UserContext);
  const navigate = useNavigate();
  const [orgDetails, setOrgDetails] = useState({
    name: "",
    description: "",
    code: "",
    memberCount: 0,
    owner: null,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState([]);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      toast.warn("Please login first to access this page");
    } else {
      fetchOrgDetails();
    }
  }, [token, navigate]);

  const fetchOrgDetails = async () => {
    try {
      const authToken = JSON.parse(localStorage.getItem("auth"));
      const response = await axios.get(
        "http://localhost:3000/api/v1/organization",
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (response.data.success) {
        const org = response.data.organization;
        setOrgDetails(org);
        setMembers(org.members || []);
        setIsOwner(response.data.isOwner);
        setLoading(false);
      }
    } catch (err) {
      console.error("Error fetching organization details:", err);
      if (err.response && err.response.data) {
        toast.error(
          err.response.data.msg || "Failed to load organization details"
        );
        if (err.response.status === 404) {
          navigate("/welcome");
        }
      } else {
        toast.error("Failed to load organization details");
      }
      setLoading(false);
    }
  };

  const handleUpdateOrg = async () => {
    if (!orgDetails.name.trim()) {
      toast.error("Organization name is required");
      return;
    }

    if (!isOwner) {
      toast.error("Only organization owner can update details");
      return;
    }

    setUpdateLoading(true);
    try {
      const authToken = JSON.parse(localStorage.getItem("auth"));
      const response = await axios.put(
        "http://localhost:3000/api/v1/organization",
        {
          name: orgDetails.name,
          description: orgDetails.description,
        },
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (response.data.success) {
        toast.success("Organization updated successfully");
        setIsEditing(false);
        fetchOrgDetails();
      }
    } catch (err) {
      console.error("Error updating organization:", err);
      if (err.response && err.response.data) {
        if (err.response.data.errors) {
          const errorMsg = err.response.data.errors[0].msg;
          toast.error(errorMsg);
        } else {
          toast.error(err.response.data.msg || "Failed to update organization");
        }
      } else {
        toast.error("Failed to update organization");
      }
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleDeleteOrg = async () => {
    if (!isOwner) {
      toast.error("Only organization owner can delete the organization");
      return;
    }

    if (
      window.confirm(
        "Are you sure you want to delete this organization? This action cannot be undone and will remove all members."
      )
    ) {
      setDeleteLoading(true);
      try {
        const authToken = JSON.parse(localStorage.getItem("auth"));
        const response = await axios.delete(
          "http://localhost:3000/api/v1/organization",
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          }
        );

        if (response.data.success) {
          toast.success("Organization deleted successfully");
          navigate("/welcome");
        }
      } catch (err) {
        console.error("Error deleting organization:", err);
        if (err.response && err.response.data) {
          toast.error(err.response.data.msg || "Failed to delete organization");
        } else {
          toast.error("Failed to delete organization");
        }
      } finally {
        setDeleteLoading(false);
      }
    }
  };

  const handleRemoveMember = async (memberId, memberName) => {
    if (!isOwner) {
      toast.error("Only organization owner can remove members");
      return;
    }

    if (
      window.confirm(
        `Are you sure you want to remove ${memberName} from the organization?`
      )
    ) {
      try {
        const authToken = JSON.parse(localStorage.getItem("auth"));
        const response = await axios.delete(
          `http://localhost:3000/api/v1/organization/member/${memberId}`,
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          }
        );

        if (response.data.success) {
          toast.success("Member removed successfully");
          fetchOrgDetails();
        }
      } catch (err) {
        console.error("Error removing member:", err);
        if (err.response && err.response.data) {
          toast.error(err.response.data.msg || "Failed to remove member");
        } else {
          toast.error("Failed to remove member");
        }
      }
    }
  };

  const copyOrgCode = async () => {
    try {
      await navigator.clipboard.writeText(orgDetails.code);
      toast.success("Organization code copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy:", err);
      toast.error("Failed to copy organization code");
    }
  };

  const formatJoinDate = (date) => {
    try {
      return new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (error) {
      return "Invalid date";
    }
  };

  if (loading) {
    return (
      <div className="manage-org-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading organization details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="manage-org-container">
      <motion.div
        className="manage-org-content"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Header Section */}
        <div className="page-header">
          <h1 className="manage-org-title">
            <i className="fas fa-building header-icon"></i>
            Manage Organization
          </h1>
          <p className="manage-org-subtitle">
            {isOwner
              ? "Configure your organization settings and manage team members"
              : "View your organization information and team members"}
          </p>
        </div>

        {/* Organization Details Card */}
        <motion.div
          className="org-details-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <div className="card-header">
            <div className="header-content">
              <h2>
                <i className="fas fa-info-circle"></i>
                Organization Details
              </h2>
              {isOwner && (
                <button
                  className={`edit-toggle-btn ${isEditing ? "active" : ""}`}
                  onClick={() => setIsEditing(!isEditing)}
                >
                  <i
                    className={`fas ${isEditing ? "fa-times" : "fa-edit"}`}
                  ></i>
                  {isEditing ? "Cancel" : "Edit"}
                </button>
              )}
            </div>
          </div>

          <div className="card-content">
            {isEditing ? (
              <motion.div
                className="org-form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div className="form-row">
                  <div className="form-group">
                    <label>
                      <i className="fas fa-building"></i>
                      Organization Name
                    </label>
                    <input
                      type="text"
                      className="org-input"
                      value={orgDetails.name}
                      onChange={(e) =>
                        setOrgDetails({ ...orgDetails, name: e.target.value })
                      }
                      placeholder="Enter organization name"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>
                      <i className="fas fa-align-left"></i>
                      Description
                    </label>
                    <textarea
                      className="org-textarea"
                      value={orgDetails.description}
                      onChange={(e) =>
                        setOrgDetails({
                          ...orgDetails,
                          description: e.target.value,
                        })
                      }
                      placeholder="Describe your organization"
                      rows="4"
                    />
                  </div>
                </div>

                <div className="form-actions">
                  <button
                    className="save-btn"
                    onClick={handleUpdateOrg}
                    disabled={updateLoading}
                  >
                    <i className="fas fa-save"></i>
                    {updateLoading ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="org-info-display">
                <div className="info-grid">
                  <div className="info-item">
                    <div className="info-label">
                      <i className="fas fa-building"></i>
                      Organization Name
                    </div>
                    <div className="info-value">{orgDetails.name}</div>
                  </div>

                  <div className="info-item">
                    <div className="info-label">
                      <i className="fas fa-code"></i>
                      Invitation Code
                    </div>
                    <div className="info-value">
                      <div className="code-display">
                        <span className="code-text">{orgDetails.code}</span>
                        <button className="copy-btn" onClick={copyOrgCode}>
                          <i className="fas fa-copy"></i>
                          Copy
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="info-item">
                    <div className="info-label">
                      <i className="fas fa-users"></i>
                      Total Members
                    </div>
                    <div className="info-value">
                      <span className="member-count">
                        {members.length || 0}
                      </span>
                    </div>
                  </div>

                  <div className="info-item">
                    <div className="info-label">
                      <i className="fas fa-crown"></i>
                      Organization Owner
                    </div>
                    <div className="info-value">
                      <span className="owner-name">
                        {orgDetails.owner?.name || "Unknown"}
                      </span>
                    </div>
                  </div>

                  {orgDetails.description && (
                    <div className="info-item full-width">
                      <div className="info-label">
                        <i className="fas fa-align-left"></i>
                        Description
                      </div>
                      <div className="info-value description">
                        {orgDetails.description}
                      </div>
                    </div>
                  )}
                </div>

                <div className="invite-section">
                  <div className="invite-info">
                    <i className="fas fa-share-alt"></i>
                    <div>
                      <h4>Invite New Members</h4>
                      <p>
                        Share the invitation code above with others to invite
                        them to your organization
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Members Section */}
        <motion.div
          className="members-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <div className="card-header">
            <h2>
              <i className="fas fa-users"></i>
              Team Members
              <span className="member-badge">{members.length}</span>
            </h2>
          </div>

          <div className="card-content">
            {members.length > 0 ? (
              <div className="members-grid">
                <AnimatePresence>
                  {members.map((member) => (
                    <motion.div
                      key={member._id}
                      className="member-card"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="member-avatar">
                        <i className="fas fa-user"></i>
                      </div>
                      <div className="member-info">
                        <div className="member-name">{member.user?.name}</div>
                        <div className="member-email">{member.user?.email}</div>
                        <div className="member-meta">
                          <span className="join-date">
                            <i className="fas fa-calendar"></i>
                            Joined {formatJoinDate(member.joinedAt)}
                          </span>
                          <span className={`role-badge ${member.role}`}>
                            <i
                              className={`fas ${
                                member.role === "owner" ? "fa-crown" : "fa-user"
                              }`}
                            ></i>
                            {member.role}
                          </span>
                        </div>
                      </div>
                      {isOwner && member.role !== "owner" && (
                        <div className="member-actions">
                          <button
                            className="remove-btn"
                            onClick={() =>
                              handleRemoveMember(member._id, member.user?.name)
                            }
                            title="Remove member"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="empty-state">
                <i className="fas fa-users-slash"></i>
                <h3>No Members Yet</h3>
                <p>
                  Invite people to join your organization using the invitation
                  code above
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Danger Zone */}
        {isOwner && (
          <motion.div
            className="danger-zone-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            <div className="card-header danger">
              <h2>
                <i className="fas fa-exclamation-triangle"></i>
                Danger Zone
              </h2>
            </div>

            <div className="card-content">
              <div className="danger-content">
                <div className="danger-info">
                  <h3>Delete Organization</h3>
                  <p>
                    Permanently delete this organization and remove all members.
                    This action cannot be undone and will result in immediate
                    loss of all data.
                  </p>
                </div>
                <button
                  className="delete-btn"
                  onClick={handleDeleteOrg}
                  disabled={deleteLoading}
                >
                  <i className="fas fa-trash"></i>
                  {deleteLoading ? "Deleting..." : "Delete Organization"}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Back Navigation */}
        <div className="back-navigation">
          <button className="back-btn" onClick={() => navigate("/dashboard")}>
            <i className="fas fa-arrow-left"></i>
            Back to Dashboard
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default ManageOrg;
