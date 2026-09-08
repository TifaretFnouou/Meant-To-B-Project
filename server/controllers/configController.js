import {
    getConfig,
    addTech,
    removeTech,
    addTopic,
    removeTopic,
  } from "../services/configService.js";
  
  function statusFromError(error, fallback = 500) {
    return error.status || fallback;
  }
  
  export const getConfigController = async (req, res) => {
    try {
      const config = await getConfig();
      res.status(200).json({ success: true, data: config });
    } catch (err) {
      res.status(statusFromError(err)).json({ success: false, message: err.message });
    }
  };
  
  export const addTechController = async (req, res) => {
    try {
      const techStack = await addTech(req.body.item);
      res.status(200).json({ success: true, data: techStack });
    } catch (err) {
      res.status(statusFromError(err, 400)).json({ success: false, message: err.message });
    }
  };
  
  export const removeTechController = async (req, res) => {
    try {
      const techStack = await removeTech(req.params.item);
      res.status(200).json({ success: true, data: techStack });
    } catch (err) {
      res.status(statusFromError(err)).json({ success: false, message: err.message });
    }
  };
  
  export const addTopicController = async (req, res) => {
    try {
      const adviceTopics = await addTopic(req.body.item);
      res.status(200).json({ success: true, data: adviceTopics });
    } catch (err) {
      res.status(statusFromError(err, 400)).json({ success: false, message: err.message });
    }
  };
  
  export const removeTopicController = async (req, res) => {
    try {
      const adviceTopics = await removeTopic(req.params.item);
      res.status(200).json({ success: true, data: adviceTopics });
    } catch (err) {
      res.status(statusFromError(err)).json({ success: false, message: err.message });
    }
  };