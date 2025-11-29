import { SessionCreatedHandler } from './session-created.handler';
import { SessionCreatedEvent } from '@/modules/auth/domain/events/session-created.event';
import type { Queue, QueuePort } from '@/shared/ports/queue.port';
import { QueueKeys } from '@/shared/utils/queue.keys.util';

describe('SessionCreatedHandler', () => {
  let handler: SessionCreatedHandler;
  let mockQueuePort: jest.Mocked<QueuePort>;
  let mockQueue: jest.Mocked<Queue>;

  beforeEach(() => {
    mockQueue = {
      key: 'test-queue',
      subscribe: jest.fn(),
      publish: jest.fn().mockResolvedValue(undefined),
      process: jest.fn().mockResolvedValue(undefined),
    } as jest.Mocked<Queue>;

    mockQueuePort = {
      create: jest.fn().mockResolvedValue(mockQueue),
      get: jest.fn().mockResolvedValue(mockQueue),
    } as jest.Mocked<QueuePort>;

    handler = new SessionCreatedHandler(mockQueuePort);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should publish event to queue when queue already exists', async () => {
      const sessionId = 'session-123';
      const event = new SessionCreatedEvent({
        id: sessionId,
        occurredOn: new Date('2024-01-01'),
      });
      const queueKey = QueueKeys.sendCodeValidation();

      mockQueuePort.get.mockResolvedValue(mockQueue);

      await handler.execute(event);

      expect(mockQueuePort.get).toHaveBeenCalledWith(queueKey);
      expect(mockQueuePort.get).toHaveBeenCalledTimes(1);
      expect(mockQueuePort.create).not.toHaveBeenCalled();
      expect(mockQueue.publish).toHaveBeenCalledWith({ sessionId });
      expect(mockQueue.publish).toHaveBeenCalledTimes(1);
    });

    it('should create a new queue when it does not exist', async () => {
      const sessionId = 'session-456';
      const event = new SessionCreatedEvent({
        id: sessionId,
        occurredOn: new Date('2024-01-01'),
      });
      const queueKey = QueueKeys.sendCodeValidation();

      mockQueuePort.get.mockResolvedValue(null);
      mockQueuePort.create.mockResolvedValue(mockQueue);

      await handler.execute(event);

      expect(mockQueuePort.get).toHaveBeenCalledWith(queueKey);
      expect(mockQueuePort.get).toHaveBeenCalledTimes(1);
      expect(mockQueuePort.create).toHaveBeenCalledWith(queueKey);
      expect(mockQueuePort.create).toHaveBeenCalledTimes(1);
      expect(mockQueue.publish).toHaveBeenCalledWith({ sessionId });
      expect(mockQueue.publish).toHaveBeenCalledTimes(1);
    });

    it('should pass the correct sessionId from event to queue', async () => {
      const sessionId = 'unique-session-id-789';
      const event = new SessionCreatedEvent({
        id: sessionId,
        occurredOn: new Date('2024-01-01'),
      });

      mockQueuePort.get.mockResolvedValue(mockQueue);

      await handler.execute(event);

      expect(mockQueue.publish).toHaveBeenCalledWith({
        sessionId: sessionId,
      });
    });

    it('should propagate error if queuePort.get fails', async () => {
      const event = new SessionCreatedEvent({
        id: 'session-123',
        occurredOn: new Date('2024-01-01'),
      });
      const error = new Error('Failed to get queue');

      mockQueuePort.get.mockRejectedValue(error);

      await expect(handler.execute(event)).rejects.toThrow(
        'Failed to get queue',
      );
      expect(mockQueuePort.get).toHaveBeenCalledTimes(1);
      expect(mockQueuePort.create).not.toHaveBeenCalled();
      expect(mockQueue.publish).not.toHaveBeenCalled();
    });

    it('should propagate error if queuePort.create fails', async () => {
      const event = new SessionCreatedEvent({
        id: 'session-123',
        occurredOn: new Date('2024-01-01'),
      });
      const error = new Error('Failed to create queue');

      mockQueuePort.get.mockResolvedValue(null);
      mockQueuePort.create.mockRejectedValue(error);

      await expect(handler.execute(event)).rejects.toThrow(
        'Failed to create queue',
      );
      expect(mockQueuePort.get).toHaveBeenCalledTimes(1);
      expect(mockQueuePort.create).toHaveBeenCalledTimes(1);
      expect(mockQueue.publish).not.toHaveBeenCalled();
    });

    it('should propagate error if queue.publish fails', async () => {
      const event = new SessionCreatedEvent({
        id: 'session-123',
        occurredOn: new Date('2024-01-01'),
      });
      const error = new Error('Failed to publish to queue');

      mockQueuePort.get.mockResolvedValue(mockQueue);
      mockQueue.publish.mockRejectedValue(error);

      await expect(handler.execute(event)).rejects.toThrow(
        'Failed to publish to queue',
      );
      expect(mockQueuePort.get).toHaveBeenCalledTimes(1);
      expect(mockQueue.publish).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple sequential executions', async () => {
      const event1 = new SessionCreatedEvent({
        id: 'session-1',
        occurredOn: new Date('2024-01-01'),
      });
      const event2 = new SessionCreatedEvent({
        id: 'session-2',
        occurredOn: new Date('2024-01-02'),
      });

      mockQueuePort.get.mockResolvedValue(mockQueue);

      await handler.execute(event1);
      await handler.execute(event2);

      expect(mockQueuePort.get).toHaveBeenCalledTimes(2);
      expect(mockQueue.publish).toHaveBeenCalledTimes(2);
      expect(mockQueue.publish).toHaveBeenNthCalledWith(1, {
        sessionId: 'session-1',
      });
      expect(mockQueue.publish).toHaveBeenNthCalledWith(2, {
        sessionId: 'session-2',
      });
    });
  });

  describe('constructor', () => {
    it('should initialize with queue as null', () => {
      const newHandler = new SessionCreatedHandler(mockQueuePort);

      expect(newHandler['queue']).toBeNull();
    });

    it('should extend BaseHandler', () => {
      expect(handler).toBeInstanceOf(SessionCreatedHandler);
    });
  });
});
