/**
 * APPOINTMENTS CONTROLLER
 * ----------------------------------------
 * Delegates logic to service.
 */

const appointmentsService = require('../services/appointments.service');


exports.createAppointment = async (req, res, next) => {
  try {
    const appointment = await appointmentsService.createAppointment(
      req.user,
      req.body
    );

    res.status(201).json({ appointment });
  } catch (error) {
    next(error);
  }
};


exports.getMyAppointments = async (req, res, next) => {
  try {
    const data = await appointmentsService.getMyAppointments(req.user);

    res.json({ appointments: data });
  } catch (error) {
    next(error);
  }
};


exports.acceptAppointment = async (req, res, next) => {
  try {
    const updated = await appointmentsService.updateStatus(
      req.user,
      parseInt(req.params.id),
      'ACCEPTED'
    );

    res.json({ appointment: updated });
  } catch (error) {
    next(error);
  }
};


exports.rejectAppointment = async (req, res, next) => {
  try {
    const updated = await appointmentsService.updateStatus(
      req.user,
      parseInt(req.params.id),
      'REJECTED'
    );

    res.json({ appointment: updated });
  } catch (error) {
    next(error);
  }
};


exports.cancelAppointment = async (req, res, next) => {
  try {
    const updated = await appointmentsService.cancelAppointment(
      req.user,
      parseInt(req.params.id)
    );

    res.json({ appointment: updated });
  } catch (error) {
    next(error);
  }
};

exports.requestReschedule = async (req, res, next) => {
  try {
    const updated = await appointmentsService.requestReschedule(
      req.user,
      parseInt(req.params.id),
      req.body
    );

    res.json({ appointment: updated });
  } catch (error) {
    next(error);
  }
};

exports.approveReschedule = async (req, res, next) => {
  try {
    const updated = await appointmentsService.approveReschedule(
      req.user,
      parseInt(req.params.id)
    );

    res.json({ appointment: updated });
  } catch (error) {
    next(error);
  }
};

exports.rejectReschedule = async (req, res, next) => {
  try {
    const updated = await appointmentsService.rejectReschedule(
      req.user,
      parseInt(req.params.id)
    );

    res.json({ appointment: updated });
  } catch (error) {
    next(error);
  }
};