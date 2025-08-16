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
  const [removingMember, setRemovingMember] = useState(null);

  useEffect(() => {
    if (!token) {
      navigate("/login");
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
      setRemovingMember(memberId);
      try {
        const authToken = JSON.parse(localStorage.getItem("auth"));
        console.log("Removing member with ID:", memberId);

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
      } finally {
        setRemovingMember(null);
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
      <div className="manage-org-container loading">
        <div className="loading-spinner"></div>
        <p>Loading organization details...</p>
      </div>
    );
  }

  return (
    <div className="manage-org-container">
      <motion.div
        className="manage-org-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1>Manage Organization</h1>
        <p>
          {isOwner
            ? "Configure your organization settings and manage team members"
            : "View your organization information and team members"}
        </p>
      </motion.div>

      <div className="manage-org-content">
        {/* Organization Details Card */}
        <motion.div
          className="org-details-card"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="card-header">
            <h2>Organization Details</h2>
            {isOwner && (
              <button
                className="edit-btn"
                onClick={() => setIsEditing(!isEditing)}
                disabled={updateLoading}
              >
                {isEditing ? "Cancel" : "Edit"}
              </button>
            )}
          </div>

          <div className="org-info">
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
                    placeholder="Enter organization name"
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={orgDetails.description}
                    onChange={(e) =>
                      setOrgDetails({
                        ...orgDetails,
                        description: e.target.value,
                      })
                    }
                    placeholder="Enter organization description"
                    rows="3"
                  />
                </div>
                <div className="form-actions">
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
              <div className="info-display">
                <div className="info-item">
                  <label>Name:</label>
                  <span>{orgDetails.name}</span>
                </div>
                <div className="info-item">
                  <label>Description:</label>
                  <span>
                    {orgDetails.description || "No description provided"}
                  </span>
                </div>
                <div className="info-item">
                  <label>Owner:</label>
                  <span>{orgDetails.owner?.name}</span>
                </div>
                <div className="info-item">
                  <label>Total Members:</label>
                  <span>{members.length}</span>
                </div>
                <div className="info-item">
                  <label>Organization Code:</label>
                  <div className="code-display">
                    <span className="org-code">{orgDetails.code}</span>
                    <button className="copy-btn" onClick={copyOrgCode}>
                      Copy
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Invitation Code Card */}
        <motion.div
          className="invitation-card"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h3>Invitation Code</h3>
          <div className="invitation-code">
            <span>{orgDetails.code}</span>
            <button onClick={copyOrgCode}>Copy Code</button>
          </div>
          <p>
            {isOwner
              ? "Share the invitation code above with others to invite them to your organization"
              : "Invite people to join your organization using the invitation code above"}
          </p>
        </motion.div>

        {/* Members List */}
        <motion.div
          className="members-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h3>Members ({members.length})</h3>
          <div className="members-list">
            <AnimatePresence>
              {members.map((member) => (
                <motion.div
                  key={member.user._id}
                  className="member-item"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="member-info">
                    <div className="member-details">
                      <h4>{member.user.name}</h4>
                      <p>{member.user.email}</p>
                      <span className="member-role">{member.role}</span>
                    </div>
                    <div className="member-meta">
                      <span>Joined: {formatJoinDate(member.joinedAt)}</span>
                    </div>
                  </div>
                  {isOwner && member.role !== "owner" && (
                    <button
                      className="remove-btn"
                      onClick={() =>
                        handleRemoveMember(member.user._id, member.user.name)
                      }
                      disabled={removingMember === member.user._id}
                    >
                      {removingMember === member.user._id
                        ? "Removing..."
                        : "Remove"}
                    </button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Danger Zone (Only for Owner) */}
        {isOwner && (
          <motion.div
            className="danger-zone"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <h3>Danger Zone</h3>
            <div className="danger-content">
              <div className="danger-info">
                <h4>Delete Organization</h4>
                <p>
                  Permanently delete this organization and remove all members.
                  This action cannot be undone and will result in immediate loss
                  of all data.
                </p>
              </div>
              <button
                className="delete-org-btn"
                onClick={handleDeleteOrg}
                disabled={deleteLoading}
              >
                {deleteLoading ? "Deleting..." : "Delete Organization"}
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ManageOrg;
