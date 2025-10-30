import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

interface CompletedBounty {
  _id: string;
  title: string;
  projectName: string;
  earnedAmountSTRK: number;
  completedAt: string;
  submissionUrl: string;
  status: string;
}

export const CompletedBountiesPage = () => {
  const [completedBounties, setCompletedBounties] = useState<CompletedBounty[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [totalEarned, setTotalEarned] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    fetchCompletedBounties();
  }, [month, year]);

  const fetchCompletedBounties = async () => {
    try {
      const response = await fetch(`/api/bounties/completed?month=${month}&year=${year}`, {
        headers: {
          'Authorization': `Bearer ${user?.token}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch completed bounties');

      const data = await response.json();
      setCompletedBounties(data.data.bounties);
      setTotalEarned(data.data.totalEarned);
    } catch (error) {
      console.error('Error fetching completed bounties:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Project Name', 'Title', 'Earned STRK', 'Completed Date', 'Status'];
    const csvData = completedBounties.map(bounty => [
      bounty.projectName,
      bounty.title,
      bounty.earnedAmountSTRK,
      new Date(bounty.completedAt).toLocaleDateString(),
      bounty.status
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.join(','))
      .join('\\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `completed-bounties-${year}-${month}.csv`;
    link.click();
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Completed Bounties</h1>
        <div className="flex items-center gap-4">
          <Select value={month.toString()} onValueChange={(value) => setMonth(parseInt(value))}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
              {months.map((monthName, index) => (
                <SelectItem key={index + 1} value={(index + 1).toString()}>
                  {monthName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={year.toString()} onValueChange={(value) => setYear(parseInt(value))}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent>
              {[...Array(5)].map((_, i) => {
                const yearValue = new Date().getFullYear() - i;
                return (
                  <SelectItem key={yearValue} value={yearValue.toString()}>
                    {yearValue}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>

          <Button onClick={exportToCSV}>
            Export CSV
          </Button>
        </div>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Total Earnings This Month</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{totalEarned} STRK</p>
        </CardContent>
      </Card>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Project Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Earned STRK
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Completed Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {completedBounties.map((bounty) => (
              <tr key={bounty._id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  {bounty.projectName}
                </td>
                <td className="px-6 py-4">
                  {bounty.title}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {bounty.earnedAmountSTRK} STRK
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {new Date(bounty.completedAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    bounty.status === 'paid' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {bounty.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Button
                    variant="link"
                    onClick={() => window.open(bounty.submissionUrl, '_blank')}
                  >
                    View Submission
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};