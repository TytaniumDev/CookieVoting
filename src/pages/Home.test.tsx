import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Home } from './Home';
import { useAuth } from '../contexts/AuthContext';
import { getAllEvents, deleteEvent, createEvent } from '../lib/firestore';

// Mocks
jest.mock('../contexts/AuthContext');
jest.mock('../lib/firestore');

const mockedUseAuth = useAuth as jest.Mock;
const mockedGetAllEvents = getAllEvents as jest.Mock;
const mockedDeleteEvent = deleteEvent as jest.Mock;
const mockedCreateEvent = createEvent as jest.Mock;

describe('Home Page', () => {
    const mockEvents = [
        { id: '1', name: 'Event 1' },
        { id: '2', name: 'Event 2' },
    ];

    beforeEach(() => {
        mockedUseAuth.mockReturnValue({ signIn: jest.fn().mockResolvedValue(null) });
        mockedGetAllEvents.mockResolvedValue(mockEvents);
        mockedDeleteEvent.mockResolvedValue(null);
        mockedCreateEvent.mockResolvedValue({ id: '3', name: 'New Event' });
        window.confirm = jest.fn(() => true);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('renders existing events', async () => {
        render(
            <MemoryRouter>
                <Home />
            </MemoryRouter>
        );
        await waitFor(() => {
            expect(screen.getByText('Event 1')).toBeInTheDocument();
            expect(screen.getByText('Event 2')).toBeInTheDocument();
        });
    });

    test('deletes an event when delete button is clicked', async () => {
        render(
            <MemoryRouter>
                <Home />
            </MemoryRouter>
        );
        await waitFor(() => {
            expect(screen.getByText('Event 1')).toBeInTheDocument();
        });

        const deleteButtons = screen.getAllByText('Delete');
        fireEvent.click(deleteButtons[0]);

        await waitFor(() => {
            expect(mockedDeleteEvent).toHaveBeenCalledWith('1');
            expect(screen.queryByText('Event 1')).not.toBeInTheDocument();
        });
    });

    test('shows deleting state on button when deleting', async () => {
        mockedDeleteEvent.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
        render(
            <MemoryRouter>
                <Home />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('Event 1')).toBeInTheDocument();
        });

        const deleteButtons = screen.getAllByText('Delete');
        fireEvent.click(deleteButtons[0]);

        await waitFor(() => {
            expect(screen.getByText('Deleting...')).toBeInTheDocument();
        });

        await waitFor(() => {
            expect(screen.queryByText('Deleting...')).not.toBeInTheDocument();
        });
    });
});
