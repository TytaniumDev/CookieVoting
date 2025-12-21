import { type VoteEvent, type Category, type UserVote } from './types';

/**
 * Export vote data to CSV format
 */
export function exportToCSV(
    event: VoteEvent,
    categories: Category[],
    votes: UserVote[]
): string {
    const lines: string[] = [];
    
    // Header
    lines.push(`Event: ${event.name}`);
    lines.push(`Status: ${event.status}`);
    lines.push(`Total Votes: ${votes.length}`);
    lines.push('');
    
    // Category results
    categories.forEach(cat => {
        lines.push(`Category: ${cat.name}`);
        lines.push('Cookie Number,Maker Name,Votes');
        
        // Calculate votes per cookie
        const voteCounts = new Map<number, number>();
        cat.cookies.forEach(c => voteCounts.set(c.number, 0));
        
        votes.forEach(userVote => {
            const votedNumber = userVote.votes[cat.id];
            if (votedNumber !== undefined) {
                voteCounts.set(votedNumber, (voteCounts.get(votedNumber) || 0) + 1);
            }
        });
        
        // Sort by votes descending
        const sorted = Array.from(voteCounts.entries())
            .map(([number, count]) => {
                const cookie = cat.cookies.find(c => c.number === number);
                return {
                    number,
                    maker: cookie?.makerName || 'Unknown',
                    votes: count
                };
            })
            .sort((a, b) => b.votes - a.votes);
        
        sorted.forEach(({ number, maker, votes }) => {
            lines.push(`${number},"${maker}",${votes}`);
        });
        
        lines.push('');
    });
    
    // Individual votes
    lines.push('Individual Votes');
    lines.push('User ID,Timestamp,Category,Cookie Number');
    votes.forEach(userVote => {
        const timestamp = new Date(userVote.timestamp).toISOString();
        Object.entries(userVote.votes).forEach(([categoryId, cookieNumber]) => {
            const category = categories.find(c => c.id === categoryId);
            lines.push(`${userVote.userId},${timestamp},"${category?.name || categoryId}",${cookieNumber}`);
        });
    });
    
    return lines.join('\n');
}

/**
 * Export vote data to JSON format
 */
export function exportToJSON(
    event: VoteEvent,
    categories: Category[],
    votes: UserVote[]
): string {
    const data = {
        event: {
            id: event.id,
            name: event.name,
            status: event.status,
            createdAt: new Date(event.createdAt).toISOString(),
        },
        categories: categories.map(cat => ({
            id: cat.id,
            name: cat.name,
            cookieCount: cat.cookies.length,
        })),
        summary: {
            totalVotes: votes.length,
            totalCategories: categories.length,
        },
        results: categories.map(cat => {
            const voteCounts = new Map<number, number>();
            cat.cookies.forEach(c => voteCounts.set(c.number, 0));
            
            votes.forEach(userVote => {
                const votedNumber = userVote.votes[cat.id];
                if (votedNumber !== undefined) {
                    voteCounts.set(votedNumber, (voteCounts.get(votedNumber) || 0) + 1);
                }
            });
            
            return {
                categoryId: cat.id,
                categoryName: cat.name,
                cookies: Array.from(voteCounts.entries())
                    .map(([number, count]) => {
                        const cookie = cat.cookies.find(c => c.number === number);
                        return {
                            number,
                            makerName: cookie?.makerName || 'Unknown',
                            votes: count
                        };
                    })
                    .sort((a, b) => b.votes - a.votes)
            };
        }),
        votes: votes.map(vote => ({
            userId: vote.userId,
            timestamp: new Date(vote.timestamp).toISOString(),
            votes: vote.votes
        }))
    };
    
    return JSON.stringify(data, null, 2);
}

/**
 * Download data as file
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

