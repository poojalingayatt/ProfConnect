/**
 * FOLLOWS CONTROLLER
 */

const followsService = require('../services/follows.service');


exports.followFaculty = async (req, res, next) => {
  try {
    const facultyId = parseInt(req.params.facultyId);

    await followsService.followFaculty(req.user.id, facultyId);

    res.json({ message: 'Followed successfully' });
  } catch (error) {
    next(error);
  }
};


exports.unfollowFaculty = async (req, res, next) => {
  try {
    const facultyId = parseInt(req.params.facultyId);

    await followsService.unfollowFaculty(req.user.id, facultyId);

    res.json({ message: 'Unfollowed successfully' });
  } catch (error) {
    next(error);
  }
};


exports.getMyFollowed = async (req, res, next) => {
  try {
    const data = await followsService.getMyFollowed(req.user.id);
    res.json({ faculty: data });
  } catch (error) {
    next(error);
  }
};


exports.getMyFollowers = async (req, res, next) => {
  try {
    const data = await followsService.getMyFollowers(req.user.id);
    res.json({ followers: data });
  } catch (error) {
    next(error);
  }
};
