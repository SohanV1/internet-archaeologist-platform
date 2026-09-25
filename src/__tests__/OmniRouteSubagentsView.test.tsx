import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OmniRouteSubagentsView } from '@/components/OmniRouteSubagentsView';
import { Investigation } from '@/types/osint';

const mockInvestigation: Investigation = {
  id: 'test-inv-1',
  domain: 'example.com',
  targetUrl: 'https://example.com',
  createdAt: new Date().toISOString(),
  lastUpdated: new Date().toISOString(),
  status: 'completed',
  dnsRecords: [{ type: 'A', value: '93.184.216.34', ttl: 300 }],
  subdomains: [
    {
      subdomain: 'api.example.com',
      fullDomain: 'api.example.com',
      source: 'Certificate Transparency',
      status: 'active',
    },
  ],
  technologies: [
    {
      id: 'tech-1',
      name: 'Nginx',
      category: 'Web Server',
      confidence: 90,
      evidence: 'HTTP Server header',
    },
  ],
  certificates: [],
  asnInfo: [],
  snapshots: [],
  milestones: [],
  evidence: [],
  vulnerabilities: [],
  changes: [],
  relationships: { nodes: [], edges: [] },
  ipAddresses: ['93.184.216.34'],
  summary: {
    headline: 'Example Domain Archeology',
    narrative: 'Example domain test summary',
    firstRecordedDate: '2000-01-01',
    totalYearsActive: 26,
    primaryFrameworkEvolution: 'Static HTML to Modern SPA',
    subdomainsCount: 1,
    majorRedesignsCount: 2,
    securityRating: 'High',
  },
};

describe('OmniRouteSubagentsView Component', () => {
  beforeEach(() => {
    global.fetch = jest.fn((url) => {
      if (url === '/api/subagents') {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              online: true,
              models: ['auto/best-fast', 'kr/claude-sonnet-4.5'],
            }),
        } as Response);
      }
      return Promise.reject(new Error('Unknown URL'));
    }) as jest.Mock;
  });

  afterEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('renders OmniRoute subagents swarm header and stats', async () => {
    render(<OmniRouteSubagentsView currentInvestigation={mockInvestigation} />);

    expect(screen.getByText(/OmniRoute Autonomous Subagent Swarm/i)).toBeInTheDocument();
    expect(screen.getByText(/1-Click OSINT Intelligence Subagents/i)).toBeInTheDocument();
    expect(screen.getByText(/Dispatch Custom OmniRoute Subagent Task/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/OmniRoute Online \(Port 20128\)/i)).toBeInTheDocument();
    });
  });

  it('renders 1-click preset action cards', async () => {
    render(<OmniRouteSubagentsView currentInvestigation={mockInvestigation} />);

    expect(screen.getByText('Deep Recon Synthesis')).toBeInTheDocument();
    expect(screen.getByText('Defensive Security & Mail Hygiene')).toBeInTheDocument();
    expect(screen.getByText('Temporal Drift & Tech Evolution')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/OmniRoute Online \(Port 20128\)/i)).toBeInTheDocument();
    });
  });

  it('handles custom prompt typing and dispatch button state', async () => {
    render(<OmniRouteSubagentsView currentInvestigation={mockInvestigation} />);

    const textarea = screen.getByPlaceholderText(/Enter subagent prompt/i);
    const dispatchButton = screen.getByRole('button', { name: /Dispatch Task/i });

    expect(dispatchButton).toBeDisabled();

    fireEvent.change(textarea, { target: { value: 'Analyze SPF records' } });
    expect(dispatchButton).not.toBeDisabled();

    await waitFor(() => {
      expect(screen.getByText(/OmniRoute Online \(Port 20128\)/i)).toBeInTheDocument();
    });
  });
});
