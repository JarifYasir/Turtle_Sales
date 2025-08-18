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
  const [copySuccess, setCopySuccess] = useState(false);

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
        `${import.meta.env.VITE_API_URL}/organization`,
        { headers: { Authorization: `Bearer ${authToken}` } }
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
        `${import.meta.env.VITE_API_URL}/organization`,
        {
          name: orgDetails.name,
          description: orgDetails.description,
        },
        { headers: { Authorization: `Bearer ${authToken}` } }
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
          `${import.meta.env.VITE_API_URL}/organization`,
          { headers: { Authorization: `Bearer ${authToken}` } }
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
        const response = await axios.delete(
          `${import.meta.env.VITE_API_URL}/organization/member/${memberId}`,
          { headers: { Authorization: `Bearer ${authToken}` } }
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

  // --- Promotion handler ---
  const handlePromoteMember = async (memberId, memberName) => {
    if (!isOwner) return;
    if (!window.confirm(`Promote ${memberName} to manager?`)) return;
    setUpdateLoading(true);
    try {
      const authToken = JSON.parse(localStorage.getItem("auth"));
      const response = await axios.put(
        `${
          import.meta.env.VITE_API_URL
        }/organization/member/promote/${memberId}`,
        {},
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      if (response.data.success) {
        toast.success("Member promoted to manager");
        fetchOrgDetails();
      } else {
        toast.error(response.data.msg || "Promotion failed");
      }
    } catch (err) {
      toast.error(err.response?.data?.msg || "Error promoting member");
    } finally {
      setUpdateLoading(false);
    }
  };

  const copyOrgCode = async () => {
    try {
      await navigator.clipboard.writeText(orgDetails.code);
      setCopySuccess(true);
      toast.success("Organization code copied to clipboard!");
      setTimeout(() => {
        setCopySuccess(false);
      }, 2000);
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
      <div className="manage-org-content">
        <div className="manage-org-header">
          <h1>{orgDetails.name ? orgDetails.name : "Organization"}</h1>
          <p>
            {isOwner
              ? "Configure your organization settings and manage team members"
              : "View your organization information and team members"}
          </p>
        </div>
        <div className="org-details-card">
          {/* ...existing org details rendering... */}
        </div>

        <div className="invitation-card">
          <h3>
            {isOwner
              ? "Share this code with others to invite them to your organization"
              : "Invite people to join your organization using this invitation code"}
          </h3>
          <div className="invitation-code">
            <span className="org-code">{orgDetails.code}</span>
            <button
              className={`copy-btn${copySuccess ? " copied" : ""}`}
              onClick={copyOrgCode}
            >
              {copySuccess ? "Copied!" : "Copy"}
            </button>
          </div>
          <p>Invitation code is valid until the organization is deleted.</p>
        </div>

        <div className="members-card">
          <h3>Team Members</h3>
          <div className="members-list">
            {members.length > 0 ? (
              members.map((member) => (
                <div className="member-item" key={member.user._id}>
                  <div className="member-info">
                    <div className="member-details">
                      <h4>{member.user.name}</h4>
                      <p>{member.user.email}</p>
                      <span
                        className={
                          "member-role " +
                          (member.role === "owner"
                            ? "role-owner"
                            : member.role === "manager"
                            ? "role-member" // Reuse .role-member for manager, same theme
                            : "role-member")
                        }
                      >
                        {member.role === "owner"
                          ? "Owner"
                          : member.role === "manager"
                          ? "Manager"
                          : "Member"}
                      </span>
                    </div>
                    <div className="member-meta">
                      <span>Joined {formatJoinDate(member.joinedAt)}</span>
                    </div>
                  </div>
                  {isOwner && member.user._id !== user.id && (
                    <div className="member-actions">
                      {/* Only show promote for employees */}
                      {member.role === "employee" && (
                        <button
                          className="edit-btn"
                          style={{ marginRight: "8px" }}
                          disabled={updateLoading}
                          onClick={() =>
                            handlePromoteMember(
                              member.user._id,
                              member.user.name
                            )
                          }
                        >
                          Promote to Manager
                        </button>
                      )}
                      <button
                        className="remove-btn"
                        disabled={
                          removingMember === member.user._id || updateLoading
                        }
                        onClick={() =>
                          handleRemoveMember(member.user._id, member.user.name)
                        }
                      >
                        {removingMember === member.user._id
                          ? "Removing..."
                          : "Remove"}
                      </button>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="no-members">No members in this organization yet.</p>
            )}
          </div>
        </div>

        <div className="danger-zone">
          {/* ...danger zone rendering for org deletion... */}
        </div>
      </div>
    </div>
  );
};

export default ManageOrg;
