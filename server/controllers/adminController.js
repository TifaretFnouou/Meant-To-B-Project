// this file receives the request from the router, calls the Service to do the work, and returns the formatted response (JSON) to the client.

import { getMeetingsReport, generateAlerts } from "../services/adminService.js";

// fetch the filtered meetings report
export const getAdminMeetingsReport = async (req, res) => {
  try {
    // extract filtering parameters from the URL (e.g. ?status=COMPLETED)
    const { status, mentorId, menteeId } = req.query;
    
    // call the service with the filters
    const meetings = await getMeetingsReport({ status, mentorId, menteeId });
    
    res.status(200).json({
      success: true,
      count: meetings.length,
      data: meetings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error fetching meetings report for admin",
    });
  }
};

// fetch the alerts that require admin intervention
export const getAdminAlerts = async (req, res) => {
  try {
    // call the service that creates the alerts array
    const alerts = await generateAlerts();
    
    res.status(200).json({
      success: true,
      count: alerts.length,
      data: alerts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Error generating admin alerts",
    });
  }
};