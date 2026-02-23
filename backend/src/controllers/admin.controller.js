const adminService = require('../services/admin.service');

exports.getStats = async (_req, res, next) => {
  try {
    const stats = await adminService.getStats();
    res.json({ stats });
  } catch (error) {
    next(error);
  }
};

exports.getUsers = async (_req, res, next) => {
  try {
    const users = await adminService.getUsers();
    res.json({ users });
  } catch (error) {
    next(error);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id, 10);
    await adminService.deleteUser(req.user.id, userId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

exports.getAppointments = async (_req, res, next) => {
  try {
    const appointments = await adminService.getAppointments();
    res.json({ appointments });
  } catch (error) {
    next(error);
  }
};

