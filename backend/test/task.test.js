const request = require('supertest');

const mockTasks = [
    { _id: 'task-1', text: 'First task' },
    { _id: 'task-2', text: 'Second task' },
];

jest.mock('mongoose', () => ({
    connect: jest.fn(() => Promise.resolve()),
}));

jest.mock('../models/Task', () => {
    const Task = jest.fn(function Task(data) {
        Object.assign(this, data, { _id: 'new-task' });
        this.save = jest.fn().mockResolvedValue(this);
    });

    Task.find = jest.fn();
    Task.findByIdAndDelete = jest.fn();

    return Task;
});

const Task = require('../models/Task');
const { app, server } = require('../index');

afterAll((done) => {
    server.close(done);
});

describe('Task API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('GET /api/tasks returns all tasks', async () => {
        Task.find.mockResolvedValue(mockTasks);

        const response = await request(app).get('/api/tasks');

        expect(response.status).toBe(200);
        expect(response.body).toEqual(mockTasks);
        expect(Task.find).toHaveBeenCalledTimes(1);
    });

    test('POST /api/tasks creates a task', async () => {
        const response = await request(app)
            .post('/api/tasks')
            .send({ text: 'Write tests' });

        expect(response.status).toBe(200);
        expect(response.body).toMatchObject({
            _id: 'new-task',
            text: 'Write tests',
        });
        expect(Task).toHaveBeenCalledWith({ text: 'Write tests' });
    });

    test('DELETE /api/tasks/:id deletes a task', async () => {
        Task.findByIdAndDelete.mockResolvedValue(mockTasks[0]);

        const response = await request(app).delete('/api/tasks/task-1');

        expect(response.status).toBe(200);
        expect(response.body).toEqual({ message: 'Task deleted' });
        expect(Task.findByIdAndDelete).toHaveBeenCalledWith('task-1');
    });
});
