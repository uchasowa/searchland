import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Archive,
  CheckCircle,
  Clock,
  MessageSquare,
  Plus,
} from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { BrandBar } from '../components/BrandBar';
import { APP_PAGE_BG } from '../lib/brand';
import { publicFileUrl } from '../lib/upload';
import { trpc } from '../lib/trpc';
import type { FeedbackCategory, FeedbackStatus } from '../types/feedback';

const statusConfig = {
  new: { label: 'New', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: MessageSquare },
  reviewing: { label: 'Reviewing', color: 'bg-amber-100 text-amber-800 border-amber-200', icon: Clock },
  resolved: { label: 'Resolved', color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
  archived: { label: 'Archived', color: 'bg-slate-100 text-slate-800 border-slate-200', icon: Archive },
};

const categoryConfig = {
  bug: { label: 'Bug', color: 'bg-red-50 text-red-700 border-red-200' },
  feature: { label: 'Feature Request', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  improvement: { label: 'Improvement', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  question: { label: 'Question', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  other: { label: 'Other', color: 'bg-slate-50 text-slate-700 border-slate-200' },
};

const priorityConfig = {
  low: { label: 'Low', color: 'text-slate-600' },
  medium: { label: 'Medium', color: 'text-orange-600' },
  high: { label: 'High', color: 'text-red-600' },
};

export function FeedbackListPage() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const list = trpc.feedback.list.useQuery({
    status:
      statusFilter === 'all' ? undefined : (statusFilter as FeedbackStatus),
    category:
      categoryFilter === 'all' ? undefined : (categoryFilter as FeedbackCategory),
  });

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);

  if (list.isLoading) {
    return (
      <div className={APP_PAGE_BG}>
        <BrandBar />
        <div className="flex min-h-[50vh] items-center justify-center p-6">
          <p className="text-slate-600">Loading…</p>
        </div>
      </div>
    );
  }

  if (list.isError) {
    const hint = list.error?.message;
    return (
      <div className={APP_PAGE_BG}>
        <BrandBar />
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-red-700">Could not load feedback.</p>
        <p className="max-w-md text-sm text-slate-600">
          Start the API with <code className="rounded bg-slate-200 px-1">pnpm dev</code> from the repo root
          (server on port 3001). If the API is up, run <code className="rounded bg-slate-200 px-1">pnpm db:migrate</code>{' '}
          and check <code className="rounded bg-slate-200 px-1">apps/server/.env</code> for{' '}
          <code className="rounded bg-slate-200 px-1">DATABASE_URL</code>.
        </p>
        {hint ? (
          <p className="max-w-lg break-words font-mono text-xs text-slate-500">{hint}</p>
        ) : null}
        </div>
      </div>
    );
  }

  const items = list.data ?? [];

  return (
    <div className={APP_PAGE_BG}>
      <BrandBar />
      <div className="mx-auto max-w-6xl space-y-6 p-6">
        <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <h1 className="bg-gradient-to-r from-primary via-sky-700 to-cyan-600 bg-clip-text text-4xl font-bold text-transparent">
                Feedback inbox
              </h1>
              <p className="mt-2 text-slate-600">
                What&apos;s working, what&apos;s not, and what you&apos;d like to see next at Searchland
              </p>
            </div>
            <Button onClick={() => navigate('/new')} size="lg" className="shadow-md">
              <Plus className="mr-2 h-5 w-5" />
              Add Feedback
            </Button>
          </div>
        </div>

        <div className="overflow-visible rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="min-w-0">
              <label className="mb-2 block text-sm font-medium text-slate-700">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="reviewing">Reviewing</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="min-w-0">
              <label className="mb-2 block text-sm font-medium text-slate-700">Category</label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="bug">Bugs</SelectItem>
                  <SelectItem value="feature">Feature Requests</SelectItem>
                  <SelectItem value="improvement">Improvements</SelectItem>
                  <SelectItem value="question">Questions</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {items.length > 0 && (
            <div className="mt-4 border-t border-slate-200 pt-4">
              <p className="text-sm text-slate-600">
                Showing <span className="font-semibold text-slate-900">{items.length}</span> item
                {items.length !== 1 ? 's' : ''}
              </p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {items.map((item) => {
            const StatusIcon = statusConfig[item.status].icon;
            return (
              <Card
                key={item.id}
                className="cursor-pointer border-slate-200 transition-all duration-200 hover:border-slate-300 hover:shadow-lg"
                onClick={() => navigate(`/feedback/${item.id}`)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 flex-1 gap-4">
                      {item.imageUrls?.[0] ? (
                        <img
                          src={publicFileUrl(item.imageUrls[0])}
                          alt=""
                          className="hidden h-16 w-16 shrink-0 rounded-lg border border-slate-200 object-cover sm:block"
                        />
                      ) : null}
                      <div className="min-w-0 flex-1">
                        <CardTitle className="mb-2 text-xl text-slate-900">{item.title}</CardTitle>
                        <p className="line-clamp-2 text-slate-600">{item.description}</p>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <Badge variant="outline" className={statusConfig[item.status].color}>
                        <StatusIcon className="mr-1 h-3 w-3" />
                        {statusConfig[item.status].label}
                      </Badge>
                      <span className={`text-xs font-medium ${priorityConfig[item.priority].color}`}>
                        {priorityConfig[item.priority].label} priority
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-4">
                      <Badge variant="outline" className={categoryConfig[item.category].color}>
                        {categoryConfig[item.category].label}
                      </Badge>
                      <span className="truncate text-slate-600">{item.userName}</span>
                      {item.company ? (
                        <span className="truncate text-slate-500">· {item.company}</span>
                      ) : null}
                    </div>
                    <span className="text-slate-500">{formatDate(item.createdAt)}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {items.length === 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-16 text-center shadow-sm">
            <MessageSquare className="mx-auto mb-4 h-16 w-16 text-slate-300" />
            <p className="text-lg text-slate-600">No feedback matches your filters</p>
            <p className="mt-2 text-sm text-slate-500">Try adjusting your search criteria</p>
          </div>
        )}
      </div>
    </div>
  );
}
