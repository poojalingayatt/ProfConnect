const chatService = require('../services/chat.service');
const catchAsync = require('../utils/catchAsync');

exports.startDirectChat = catchAsync(async (req, res) => {
  const conversation = await chatService.startDirectChat(req.user, parseInt(req.params.facultyId));
  res.status(201).json({
    status: 'success',
    data: { conversation },
  });
});

exports.approveChat = catchAsync(async (req, res) => {
  const conversation = await chatService.approveChat(req.user, parseInt(req.params.id));
  res.status(200).json({
    status: 'success',
    data: { conversation },
  });
});

exports.rejectChat = catchAsync(async (req, res) => {
  await chatService.rejectChat(req.user, parseInt(req.params.id));
  res.status(200).json({
    status: 'success',
    data: null,
  });
});

exports.getConversations = catchAsync(async (req, res) => {
  const conversations = await chatService.getConversations(req.user);
  res.status(200).json({
    status: 'success',
    results: conversations.length,
    data: conversations,
  });
});

exports.getMessages = catchAsync(async (req, res) => {
  const messages = await chatService.getMessages(req.user, parseInt(req.params.id));
  res.status(200).json({
    status: 'success',
    results: messages.length,
    data: messages,
  });
});

exports.sendMessage = catchAsync(async (req, res) => {
  const message = await chatService.sendMessage(req.user, parseInt(req.params.id), req.body.content);
  res.status(201).json({
    status: 'success',
    data: message,
  });
});
