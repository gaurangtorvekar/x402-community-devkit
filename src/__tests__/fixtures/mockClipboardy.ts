export default {
  write: jest.fn(() => Promise.resolve()),
  read: jest.fn(() => Promise.resolve('')),
  writeSync: jest.fn(() => undefined),
  readSync: jest.fn(() => ''),
};