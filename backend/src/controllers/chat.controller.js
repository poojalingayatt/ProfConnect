const chatService = require('../services/chat.service');
const catchAsync = require('../utils/catchAsync');

exports.startDirectChat = catchAsync(async (req, res) => {
  const conversation = await chatService.startDirectChat(req.user, parseInt(req.params.facultyId));
  res.status(201).json({ status: 'success', data: { conversation } });
});

exports.approveChat = catchAsync(async (req, res) => {
  const conversation = await chatService.approveChat(req.user, parseInt(req.params.id));
  res.status(200).json({ status: 'success', data: { conversation } });
});

exports.rejectChat = catchAsync(async (req, res) => {
  await chatService.rejectChat(req.user, parseInt(req.params.id));
  res.status(200).json({ status: 'success', data: null });
});

exports.getConversations = catchAsync(async (req, res) => {
  const conversations = await chatService.getConversations(req.user);
  res.status(200).json({ status: 'success', results: conversations.length, data: conversations });
});

exports.getMessages = catchAsync(async (req, res) => {
  const messages = await chatService.getMessages(req.user, parseInt(req.params.id));
  res.status(200).json({ status: 'success', results: messages.length, data: messages });
});

exports.sendMessage = catchAsync(async (req, res) => {
  // Accept text, media, or both in the same message
  const { content, mediaUrl, mediaType, bytes } = req.body;
  if (!content && !mediaUrl) {
    return res.status(400).json({ status: 'fail', message: 'Message must contain content or media' });
  }
  const message = await chatService.sendMessage(req.user, parseInt(req.params.id), {
    content,
    mediaUrl,
    mediaType,
    bytes,
  });
  res.status(201).json({ status: 'success', data: message });
});

exports.markRead = catchAsync(async (req, res) => {
  await chatService.markConversationRead(req.user, parseInt(req.params.id));
  res.status(200).json({ status: 'success', data: null });
});