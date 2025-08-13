import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/ManageOrg.css";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { UserContext } from "../usercontext/UserContext";
import { toast } from "react-toastify";

const ManageOrg = () => {
  const { user, token, setUser, setToken } = useContext(UserContext);
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

  useEffect(() => {
    if (!token) {
      navigate("/login");
      toast.warn("Please login first to access dashboard");
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
        setOrgDetails(response.data.organization);
        setMembers(response.data.organization.members || []);
        setLoading(false);
      }
    } catch (err) {
      console.error("Error fetching organization details:", err);
      if (err.response && err.response.data) {
        toast.error(err.response.data.msg || "Failed to load organization details");
        if (err.response.status === 404) {
          // User doesn't have an organization, redirect to welcome
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
        fetchOrgDetails(); // Refresh the data
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
          fetchOrgDetails(); // Refresh the data
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

  if (loading) {
    return (
      <div className="manage-org-container">
        <div className="loading">
          <h2>Loading organization details...</h2>
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
        <div className="manage-org-header">
          <h1>Manage Organization</h1>
          <p>Configure your organization settings and manage team members</p>
        </div>

        {/* Organization Details Section */}
        <div className="org-details-section">
          <div className="section-header">
            <h2>Organization Details</h2>
            {!isEditing && (
              <button
                className="edit-btn"
                onClick={() => setIsEditing(true)}
                disabled={updateLoading || deleteLoading}
              >
                Edit
              </button>
            )}
          </div>

          <div className="org-details-card">
            {isEditing ? (
              <div className="edit-form">
                <div className="form-group">
                  <label>Organization Name</label>
                  <input
                    type="text"
                    value={orgDetails.name}
                    onChange={(e) =>
                      setOrgDetails({ ...orgDetails, name: e.target.value })
                    }
                    disabled={updateLoading}
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={orgDetails.description}
                    onChange={(e) =>
                      setOrgDetails({ ...orgDetails, description: e.target.value })
                    }
                    rows="3"
                    disabled={updateLoading}
                  />
                </div>
                <div className="form-actions">
                  <button
                    className="cancel-btn"
                    onClick={() => {
                      setIsEditing(false);
                      fetchOrgDetails(); // Reset changes
                    }}
                    disabled={updateLoading}
                  >
                    Cancel
                  </button>
                  <button
                    className="save-btn"
                    onClick={handleUpdateOrg}
                    disabled={updateLoading}
                  >
                    {updateLoading ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="org-info">
                <div className="info-row">
                  <span className="label">Name:</span>
                  <span className="value">{orgDetails.name}</span>
                </div>
                <div className="info-row">
                  <span className="label">Description:</span>
                  <span className="value">
                    {orgDetails.description || "No description provided"}
                  </span>
                </div>
                <div className="info-row">
                  <span className="label">Organization Code:</span>
                  <span className="value code">
                    {orgDetails.code}
                    <button className="copy-btn" onClick={copyOrgCode}>
                      Copy
                    </button>
                  </span>
                </div>
                <div className="info-row">
                  <span className="label">Owner:</span>
                  <span className="value">
                    {orgDetails.owner ? orgDetails.owner.name : "Unknown"}
                  </span>
                </div>
                <div className="info-row">
                  <span className="label">Members:</span>
                  <span className="value">{members.length}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Members Section */}
        <div className="members-section">
          <div className="section-header">
            <h2>Organization Members</h2>
          </div>

          <div className="members-list">
            {members.length > 0 ? (
              members.map((member) => (
                <div key={member._id} className="member-card">
                  <div className="member-info">
                    <h4>{member.name}</h4>
                    <p>{member.email}</p>
                    <small>
                      Joined: {new Date(member.createdAt).toLocaleDateString()}
                    </small>
                  </div>
                  {member._id !== user.id && (
                    <button
                      className="remove-btn"
                      onClick={() => handleRemoveMember(member._id, member.name)}
                    >
                      Remove
                    </button>
                  )}
                  {member._id === orgDetails.owner._id && (
                    <span className="owner-badge">Owner</span>
                  )}
                </div>
              ))
            ) : (
              <div className="no-members">
                <p>No members found in this organization.</p>
              </div>
            )}
          </div>
        </div>

        {/* Danger Zone */}
        <div className="danger-zone">
          <h2>Danger Zone</h2>
          <div className="danger-actions">
            <div className="danger-info">
              <h4>Delete Organization</h4>
              <p>
                Permanently delete this organization and remove all members. This
                action cannot be undone.
              </p>
            </div>
            <button
              className="delete-org-btn"
              onClick={handleDeleteOrg}
              disabled={deleteLoading || updateLoading}
            >
              {deleteLoading ? "Deleting..." : "Delete Organization"}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <div className="navigation-section">
          <button
            className="back-to-dashboard-btn"
            onClick={() => navigate("/dashboard")}
            disabled={updateLoading || deleteLoading}
          >
            Back to Dashboard
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default ManageOrg;
