import { useState, useEffect, useCallback } from 'react';
import { Link, Outlet, useLocation, useParams, useNavigate } from 'react-router-dom';
import { cn } from '../../lib/cn';
import { useEventStore } from '../../lib/stores/useEventStore';
import { useBakerStore } from '../../lib/stores/useBakerStore';
import { useImageStore } from '../../lib/stores/useImageStore';
import { useCookieStore } from '../../lib/stores/useCookieStore';
import { useAdmins } from '../../lib/hooks/useAdmins';
import { useAuth } from '../../lib/hooks/useAuth';
import { AuthButton } from '../atoms/AuthButton/AuthButton';
import { ErrorBoundary } from '../ErrorBoundary';

interface NavItem {
    id: string;
    label: string;
    icon: string;
    path: string;
    badge?: string;
    children?: NavItem[];
}

const getNavItems = (categories: { id: string; name: string }[]): NavItem[] => [
    { id: 'overview', label: 'Dashboard', icon: '📊', path: 'overview' },
    { id: 'bakers', label: 'Bakers', icon: '👩‍🍳', path: 'bakers' },
    { id: 'categories', label: 'Categories', icon: '🍪', path: 'categories' },
    { id: 'settings', label: 'Settings', icon: '⚙️', path: 'settings' },
];

/**
 * AdminLayout - Sidebar layout for admin pages.
 * Features a collapsible sidebar with navigation and a main content area.
 */
export function AdminLayout() {
    const { eventId = '' } = useParams();
    const location = useLocation();
    const navigate = useNavigate();

    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [expandedItems, setExpandedItems] = useState<string[]>([]);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);

    // Stores
    const { activeEvent: event, setActiveEvent, fetchCategories, fetchAllEvents, events, categories, loading: eventLoading } = useEventStore();

    // Compute nav items with dynamic category children
    const navItems = getNavItems(categories);
    const { fetchBakers } = useBakerStore();
    const { fetchImagesForEvent } = useImageStore();
    const { fetchCookies } = useCookieStore();
    const { user, loading: authLoading, signIn, signOut } = useAuth();
    const { isAdmin, loading: adminLoading } = useAdmins();

    // Initialize data
    useEffect(() => {
        fetchAllEvents();
    }, [fetchAllEvents]);

    useEffect(() => {
        if (!eventId) return;
        const init = async () => {
            await Promise.all([
                setActiveEvent(eventId),
                fetchCategories(eventId),
                fetchBakers(eventId),
                fetchImagesForEvent(eventId),
                fetchCookies(eventId),
            ]);
            setInitialLoadComplete(true);
        };
        init();
    }, [eventId, setActiveEvent, fetchCategories, fetchBakers, fetchImagesForEvent, fetchCookies]);

    // Auth check
    useEffect(() => {
        if (!adminLoading && !user) {
            navigate('/', { replace: true });
        }
    }, [adminLoading, user, navigate]);

    const toggleSidebar = useCallback(() => {
        setSidebarOpen((prev) => !prev);
    }, []);

    const toggleExpanded = useCallback((id: string) => {
        setExpandedItems((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    }, []);

    const handleEventChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        if (value === 'create_new') {
            navigate('/admin');
        } else {
            // Get current sub-path properties so we stay on the same page
            const currentPath = location.pathname;
            // The path is typically /admin/:eventId/:subPath
            // We want to replace :eventId with the new value
            // We can split by the current eventId
            const parts = currentPath.split(`/admin/${eventId}`);

            // If we have a subpath (parts[1]), preserve it. Otherwise default to 'overview'
            const subPath = parts.length > 1 ? parts[1] : '/overview';

            navigate(`/admin/${value}${subPath}`);
        }
    };

    const isActive = (path: string) => {
        const currentPath = location.pathname;
        const basePath = `/admin/${eventId}`;
        const fullPath = `${basePath}/${path}`;
        // Handle exact matches and also the base path redirecting to overview
        return currentPath === fullPath ||
            (path === 'overview' && (currentPath === basePath || currentPath === `${basePath}/`));
    };

    const loading = !initialLoadComplete || adminLoading || authLoading || eventLoading || !event;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <div className="text-primary-400 text-lg">Loading...</div>
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-background text-white">
                <p className="text-red-400 mb-4">You do not have admin access.</p>
                <button
                    onClick={() => navigate('/')}
                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
                >
                    Go Home
                </button>
            </div>
        );
    }

    return (
        <div className="admin-layout flex min-h-screen bg-background">
            {/* Sidebar */}
            <aside
                className={cn(
                    'flex flex-col bg-surface border-r border-surface-tertiary transition-all duration-300 shrink-0',
                    sidebarOpen ? 'w-64' : 'w-20'
                )}
            >
                {/* Logo / Header */}
                <div className="flex flex-col px-4 py-4 border-b border-surface-tertiary gap-4">
                    <Link to="/admin" className="flex items-center gap-3 text-white">
                        <span className="text-2xl">🍪</span>
                        {sidebarOpen && <span className="font-semibold truncate">Cookie Voting Admin</span>}
                    </Link>

                    {sidebarOpen && (
                        <select
                            value={event.id}
                            onChange={handleEventChange}
                            className="w-full bg-surface-secondary text-white border border-surface-tertiary rounded px-2 py-1 text-sm focus:outline-none focus:border-primary-500"
                        >
                            {events.map((e) => (
                                <option key={e.id} value={e.id}>
                                    {e.name}
                                </option>
                            ))}
                            <option value="create_new">+ Create New Event</option>
                        </select>
                    )}
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto p-3">
                    <ul className="list-none space-y-1 m-0 p-0">
                        {navItems.map((item) => (
                            <li key={item.id}>
                                {item.children ? (
                                    <>
                                        <button
                                            onClick={() => toggleExpanded(item.id)}
                                            className={cn(
                                                'flex items-center w-full gap-3 px-3 py-2.5 rounded-lg text-left transition-colors',
                                                'text-gray-300 hover:bg-surface-secondary hover:text-white',
                                                expandedItems.includes(item.id) && 'bg-primary-600/20 text-primary-400'
                                            )}
                                        >
                                            <span className="text-xl">{item.icon}</span>
                                            {sidebarOpen && (
                                                <>
                                                    <span className="flex-1">{item.label}</span>
                                                    <span className="text-xs">{expandedItems.includes(item.id) ? '▼' : '▶'}</span>
                                                </>
                                            )}
                                        </button>
                                        {sidebarOpen && expandedItems.includes(item.id) && (
                                            <ul className="list-none ml-8 mt-1 space-y-1 m-0 p-0">
                                                {item.children.map((child) => (
                                                    <li key={child.id}>
                                                        <Link
                                                            to={`/admin/${eventId}/${child.path}`}
                                                            className={cn(
                                                                'block px-3 py-2 rounded-lg text-sm transition-colors',
                                                                isActive(child.path)
                                                                    ? 'bg-primary-600 text-white'
                                                                    : 'text-gray-400 hover:bg-surface-secondary hover:text-white'
                                                            )}
                                                        >
                                                            {child.label}
                                                            {child.badge && (
                                                                <span className="ml-2 px-1.5 py-0.5 bg-green-500 text-white text-xs rounded">
                                                                    {child.badge}
                                                                </span>
                                                            )}
                                                        </Link>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </>
                                ) : (
                                    <Link
                                        to={`/admin/${eventId}/${item.path}`}
                                        className={cn(
                                            'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                                            isActive(item.path)
                                                ? 'bg-primary-600 text-white'
                                                : 'text-gray-300 hover:bg-surface-secondary hover:text-white'
                                        )}
                                    >
                                        <span className="text-xl">{item.icon}</span>
                                        {sidebarOpen && <span>{item.label}</span>}
                                    </Link>
                                )}
                            </li>
                        ))}
                    </ul>
                </nav>

                {/* Collapse Toggle */}
                <button
                    onClick={toggleSidebar}
                    className="hidden md:flex items-center justify-center h-12 border-t border-surface-tertiary text-gray-400 hover:text-white transition-colors"
                    aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
                >
                    {sidebarOpen ? '◀' : '▶'}
                </button>
            </aside>

            {/* Mobile Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={toggleSidebar}
                    aria-hidden="true"
                />
            )}

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top Header */}
                <header className="sticky top-0 z-30 flex items-center justify-end h-16 px-4 md:px-6 bg-surface border-b border-surface-tertiary">
                    {/* Mobile menu button */}
                    <button
                        onClick={toggleSidebar}
                        className="md:hidden p-2 mr-auto text-gray-400 hover:text-white"
                        aria-label="Toggle menu"
                    >
                        ☰
                    </button>

                    {/* Right side actions */}
                    <div className="flex items-center gap-4">
                        <AuthButton
                            user={user}
                            loading={authLoading}
                            onSignIn={signIn}
                            onSignOut={signOut}
                        />
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-4 md:p-6 overflow-auto">
                    <ErrorBoundary>
                        <Outlet />
                    </ErrorBoundary>
                </main>
            </div>
        </div>
    );
}
