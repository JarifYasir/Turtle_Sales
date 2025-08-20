// controllers/saleController.js
const Sale = require("../models/Sale");
const Timeslot = require("../models/Timeslot");
const Workday = require("../models/Workday");
const Organization = require("../models/Organizations");

// Get all sales for organization
exports.getSales = async (req, res) => {
  try {
    // Find the organization the user belongs to
    const organization = await Organization.findOne({
      $or: [{ owner: req.user._id }, { "members.user": req.user._id }],
    });

    if (!organization) {
      return res.status(404).json({
        success: false,
        msg: "User not associated with any organization",
      });
    }

    // Check user role
    const isOwner = organization.owner.toString() === req.user._id.toString();
    const userMember = organization.members.find(
      member => member.user.toString() === req.user._id.toString()
    );
    const isManager = userMember && (userMember.role === 'manager' || userMember.role === 'owner');

    // Get all sales for the organization with workday and timeslot population
    const sales = await Sale.find({ organization: organization._id })
      .sort({ createdAt: -1 })
      .populate("user", "name")
      .populate({
        path: "workday",
        select: "date timeslots",
        populate: {
          path: "timeslots",
          select: "startTime endTime date",
        },
      })
      .lean(); // Use lean for better performance

    // Add timeslot info to each sale based on timeslotId
    const enrichedSales = sales.map(sale => {
      if (sale.workday && sale.workday.timeslots) {
        const timeslot = sale.workday.timeslots.find(ts => 
          ts._id.toString() === sale.timeslotId.toString()
        );
        return {
          ...sale,
          timeslot: timeslot || null
        };
      }
      return sale;
    });

    res.json({ 
      success: true, 
      data: {
        sales: enrichedSales,
        isOwner,
        isManager
      }
    });
  } catch (error) {
    console.error("Get Sales Error:", error);
    res.status(500).json({ success: false, msg: "Server error" });
  }
};

// Delete a sale (owner/manager only)
exports.deleteSale = async (req, res) => {
  try {
    const { saleId } = req.params;

    // Find the organization where user is owner or manager
    const organization = await Organization.findOne({
      $or: [
        { owner: req.user._id },
        { "members.user": req.user._id, "members.role": { $in: ["owner", "manager"] } }
      ]
    });

    if (!organization) {
      return res.status(403).json({
        success: false,
        msg: "Only organization owners and managers can delete sales",
      });
    }

    // Find and delete the sale
    const sale = await Sale.findOne({
      _id: saleId,
      organization: organization._id,
    });

    if (!sale) {
      return res.status(404).json({
        success: false,
        msg: "Sale not found",
      });
    }

    await sale.deleteOne();

    res.json({ success: true, msg: "Sale deleted successfully" });
  } catch (error) {
    console.error("Delete Sale Error:", error);
    res.status(500).json({ success: false, msg: "Server error" });
  }
};

// Get weekly sales report for employee paystub
exports.getWeeklySalesReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Find the organization the user belongs to
    const organization = await Organization.findOne({
      $or: [{ owner: req.user._id }, { "members.user": req.user._id }],
    });

    if (!organization) {
      return res.status(404).json({
        success: false,
        msg: "User not associated with any organization",
      });
    }

    // Parse dates
    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate ? new Date(endDate) : new Date();

    // Set to start of day for start date and end of day for end date
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    // Get sales within the date range
    const allSales = await Sale.find({
      organization: organization._id,
      createdAt: {
        $gte: start,
        $lte: end,
      },
    })
      .sort({ createdAt: -1 })
      .populate("user", "name")
      .populate({
        path: "workday",
        populate: {
          path: "timeslots.assignedUsers.user",
          select: "name",
        },
      })
      .select(
        "salesRepName price createdAt user name number address details workday timeslotId"
      );

    // Filter out sales with deleted/invalid timeslots or workdays
    const sales = allSales.filter((sale) => {
      // If sale has workday and timeslotId, check if the specific timeslot still exists
      if (sale.workday && sale.timeslotId) {
        const timeslot = sale.workday.timeslots.find(
          (ts) => ts._id.toString() === sale.timeslotId.toString()
        );
        return !!timeslot; // Only include if timeslot exists
      }

      // If no timeslot reference, exclude from paystub
      return false;
    });

    // Group sales by sales rep
    const salesByRep = {};
    let totalRevenue = 0;

    sales.forEach((sale) => {
      const repName = sale.salesRepName;
      if (!salesByRep[repName]) {
        salesByRep[repName] = {
          salesRepName: repName,
          sales: [],
          totalAmount: 0,
          salesCount: 0,
        };
      }

      // Get timeslot information
      let timeslotInfo = null;
      if (sale.workday && sale.timeslotId) {
        // Find the specific timeslot within the workday
        const timeslot = sale.workday.timeslots.find(
          (ts) => ts._id.toString() === sale.timeslotId.toString()
        );
        if (timeslot) {
          timeslotInfo = {
            date: sale.workday.date,
            startTime: timeslot.startTime,
            endTime: timeslot.endTime,
          };
        }
      }

      salesByRep[repName].sales.push({
        amount: sale.price,
        date: sale.createdAt,
        saleId: sale._id,
        clientName: sale.name,
        clientAddress: sale.address,
        clientPhone: sale.number,
        details: sale.details,
        timeslot: timeslotInfo,
      });
      salesByRep[repName].totalAmount += sale.price;
      salesByRep[repName].salesCount += 1;
      totalRevenue += sale.price;
    });

    // Convert to array and sort by total amount (highest first)
    const salesReport = Object.values(salesByRep).sort(
      (a, b) => b.totalAmount - a.totalAmount
    );

    res.json({
      success: true,
      data: {
        period: {
          startDate: start,
          endDate: end,
        },
        salesReport,
        summary: {
          totalRevenue,
          totalSales: sales.length,
          totalReps: salesReport.length,
        },
      },
    });
  } catch (error) {
    console.error("Get Weekly Sales Report Error:", error);
    res.status(500).json({ success: false, msg: "Server error" });
  }
};

// Get sales leaderboard for organization
// Get leaderboard data
exports.getLeaderboard = async (req, res) => {
  try {
    // Find the organization the user belongs to
    const organization = await Organization.findOne({
      $or: [{ owner: req.user._id }, { "members.user": req.user._id }],
    })
      .populate("owner", "name")
      .populate("members.user", "name");

    if (!organization) {
      return res.status(404).json({
        success: false,
        msg: "User not associated with any organization",
      });
    }

    // Get all organization members including owner (avoid duplicates)
    const allMembers = [];

    // Add owner
    allMembers.push({
      user: { _id: organization.owner._id, name: organization.owner.name },
    });

    // Add members (excluding owner if they're also in members array)
    organization.members.forEach((member) => {
      const isOwnerAlreadyAdded = allMembers.some(
        (existing) =>
          existing.user._id.toString() === member.user._id.toString()
      );
      if (!isOwnerAlreadyAdded) {
        allMembers.push(member);
      }
    });

    // Get sales data aggregated by user
    const salesStats = await Sale.aggregate([
      { $match: { organization: organization._id } },
      {
        $group: {
          _id: "$user",
          totalSales: { $sum: 1 },
          totalRevenue: { $sum: "$price" },
          avgSaleValue: { $avg: "$price" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userInfo",
        },
      },
      { $unwind: "$userInfo" },
      {
        $project: {
          _id: 1,
          name: "$userInfo.name",
          totalSales: 1,
          totalRevenue: { $round: ["$totalRevenue", 2] },
          avgSaleValue: { $round: ["$avgSaleValue", 2] },
        },
      },
    ]);

    // Include members with zero sales and ensure uniqueness
    const memberMap = new Map();

    allMembers.forEach((member) => {
      const userId = member.user._id.toString();
      if (!memberMap.has(userId)) {
        const stats = salesStats.find((stat) => stat._id.toString() === userId);

        memberMap.set(userId, {
          _id: member.user._id,
          name: member.user.name,
          totalSales: stats ? stats.totalSales : 0,
          totalRevenue: stats ? stats.totalRevenue : 0,
          avgSaleValue: stats ? stats.avgSaleValue : 0,
        });
      }
    });

    const leaderboardData = Array.from(memberMap.values());

    res.json({ success: true, leaderboard: leaderboardData });
  } catch (error) {
    console.error("Get Leaderboard Error:", error);
    res.status(500).json({ success: false, msg: "Server error" });
  }
};
// Cleanup orphaned sales (sales with no valid timeslot reference)
exports.cleanupOrphanedSales = async (req, res) => {
  try {
    // Find the organization the user belongs to
    const organization = await Organization.findOne({
      $or: [{ owner: req.user._id }, { "members.user": req.user._id }],
    });

    if (!organization) {
      return res.status(404).json({
        success: false,
        msg: "User not associated with any organization",
      });
    }

    // Only allow organization owners to run cleanup
    if (organization.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        msg: "Only organization owners can run cleanup operations",
      });
    }

    // Find all sales for this organization
    const allSales = await Sale.find({ organization: organization._id })
      .populate("workday");

    const orphanedSales = [];

    for (const sale of allSales) {
      let isOrphaned = false;

      if (sale.workday && sale.timeslotId) {
        // Check if the specific timeslot still exists in the workday
        const timeslot = sale.workday.timeslots.find(
          (ts) => ts._id.toString() === sale.timeslotId.toString()
        );
        if (!timeslot) {
          isOrphaned = true;
        }
      } else {
        // No timeslot reference at all
        isOrphaned = true;
      }

      if (isOrphaned) {
        orphanedSales.push(sale._id);
      }
    }

    // Delete orphaned sales
    const deleteResult = await Sale.deleteMany({
      _id: { $in: orphanedSales },
      organization: organization._id,
    });

    res.json({
      success: true,
      msg: `Cleanup completed. ${deleteResult.deletedCount} orphaned sales removed.`,
      deletedCount: deleteResult.deletedCount,
    });
  } catch (error) {
    console.error("Cleanup Orphaned Sales Error:", error);
    res.status(500).json({ success: false, msg: "Server error" });
  }
};

exports.createSale = async (req, res) => {
  try {
    const { timeslotId, workdayId, name, number, address, price, details } = req.body;

    // Validate required fields
    if (!name?.trim() || !number?.trim() || !address?.trim() || !price || !details?.trim() || !timeslotId || !workdayId) {
      return res.status(400).json({
        success: false,
        msg: "All fields are required",
      });
    }

    // Validate price
    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      return res.status(400).json({
        success: false,
        msg: "Price must be a valid positive number",
      });
    }

    // Find the workday and specific timeslot
    const workday = await Workday.findById(workdayId);
    if (!workday) {
      return res.status(404).json({ success: false, msg: "Workday not found" });
    }

    const timeslot = workday.timeslots.find(slot => slot._id.toString() === timeslotId);
    if (!timeslot) {
      return res.status(404).json({ success: false, msg: "Timeslot not found" });
    }

    // Get number of assigned cleaners (max sales allowed = number of cleaners)
    const assignedCleanersCount = timeslot.assignedUsers?.length || 0;

    if (assignedCleanersCount === 0) {
      return res.status(400).json({
        success: false,
        msg: "No cleaners assigned to this timeslot. Sales cannot be recorded.",
      });
    }

    // Check existing sales count for this timeslot
    const existingSalesCount = await Sale.countDocuments({
      workday: workdayId,
      timeslotId: timeslotId,
    });

    if (existingSalesCount >= assignedCleanersCount) {
      return res.status(400).json({
        success: false,
        msg: `Maximum of ${assignedCleanersCount} sale${
          assignedCleanersCount !== 1 ? "s" : ""
        } allowed for this timeslot. This timeslot is full.`,
      });
    }

    // Verify user is member of the organization
    const organization = await Organization.findOne({
      _id: workday.organization,
      $or: [{ owner: req.user._id }, { "members.user": req.user._id }],
    });

    if (!organization) {
      return res.status(403).json({
        success: false,
        msg: "You are not a member of this organization",
      });
    }

    const sale = new Sale({
      name: name.trim(),
      number: number.trim(),
      address: address.trim(),
      price: parsedPrice,
      details: details.trim(),
      salesRepName: req.user.name,
      user: req.user._id,
      workday: workdayId,
      timeslotId: timeslotId,
      organization: workday.organization,
    });

    await sale.save();

    res.json({ 
      success: true, 
      msg: "Sale recorded successfully", 
      data: { sale }
    });
  } catch (error) {
    console.error("Create Sale Error:", error);
    res.status(500).json({ success: false, msg: "Server error" });
  }
};
