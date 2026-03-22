import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../components/ui/alert-dialog';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { BrandBar } from '../components/BrandBar';
import { APP_PAGE_BG } from '../lib/brand';
import { publicFileUrl } from '../lib/upload';
import { trpc } from '../lib/trpc';
import {
  Archive,
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle,
  Clock,
  Edit,
  ImageIcon,
  Mail,
  MessageSquare,
  Phone,
  StickyNote,
  Trash2,
  User,
} from 'lucide-react';
import type { NavigateFunction } from 'react-router-dom';
import { useNavigate, useParams } from 'react-router-dom';

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
  low: { label: 'Low', color: 'bg-slate-100 text-slate-700 border-slate-200' },
  medium: { label: 'Medium', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  high: { label: 'High', color: 'bg-red-100 text-red-700 border-red-200' },
};

function formatDetailDate(date: Date) {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function FeedbackDetailContent({ id, navigate }: { id: string; navigate: NavigateFunction }) {
  const utils = trpc.useUtils();
  const detail = trpc.feedback.byId.useQuery({ id });

  const remove = trpc.feedback.delete.useMutation({
    onSuccess: async () => {
      await utils.feedback.list.invalidate();
      navigate('/');
    },
  });

  if (detail.isLoading) {
    return (
      <div className={APP_PAGE_BG}>
        <BrandBar />
        <div className="flex min-h-[50vh] items-center justify-center p-6">
          <p className="text-slate-600">Loading…</p>
        </div>
      </div>
    );
  }

  if (detail.isError || !detail.data) {
    return (
      <div className={APP_PAGE_BG}>
        <BrandBar />
        <div className="flex min-h-[50vh] items-center justify-center p-6">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>Feedback not found</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-600">This item doesn&apos;t exist or was removed.</p>
              <Button onClick={() => navigate('/')} className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to list
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const feedback = detail.data;
  const StatusIcon = statusConfig[feedback.status].icon;
  const images = feedback.imageUrls ?? [];

  return (
    <div className={APP_PAGE_BG}>
      <BrandBar />
      <div className="mx-auto max-w-4xl space-y-6 p-6">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => navigate('/')} className="shadow-sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate(`/edit/${feedback.id}`)} className="shadow-sm">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="shadow-sm text-red-600 hover:bg-red-50 hover:text-red-700">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this feedback?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently remove this item. You can&apos;t undo this.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-red-600 hover:bg-red-700"
                    onClick={() => remove.mutate({ id: feedback.id })}
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <Card className="border-slate-200 shadow-lg">
          <CardHeader className="pb-4">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className={statusConfig[feedback.status].color}>
                    <StatusIcon className="mr-1 h-3 w-3" />
                    {statusConfig[feedback.status].label}
                  </Badge>
                  <Badge variant="outline" className={categoryConfig[feedback.category].color}>
                    {categoryConfig[feedback.category].label}
                  </Badge>
                  <Badge variant="outline" className={priorityConfig[feedback.priority].color}>
                    {priorityConfig[feedback.priority].label} Priority
                  </Badge>
                </div>
                <CardTitle className="text-3xl text-slate-900">{feedback.title}</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-6">
              <p className="leading-relaxed whitespace-pre-wrap text-slate-700">{feedback.description}</p>
            </div>

            {images.length > 0 ? (
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="mb-3 flex items-center gap-2 text-slate-700">
                  <ImageIcon className="h-4 w-4 shrink-0" />
                  <span className="text-sm font-semibold">Screenshots</span>
                  <span className="text-xs text-slate-500">({images.length})</span>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {images.map((src) => (
                    <a
                      key={src}
                      href={publicFileUrl(src)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative overflow-hidden rounded-lg border border-slate-200 bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <img
                        src={publicFileUrl(src)}
                        alt="Feedback attachment"
                        className="aspect-video w-full object-cover transition-transform group-hover:scale-[1.02]"
                      />
                      <span className="sr-only">Open full size</span>
                    </a>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4">
                <div className="rounded-lg bg-blue-100 p-2">
                  <User className="h-5 w-5 text-blue-700" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs tracking-wide text-slate-500 uppercase">Submitted by</p>
                  <p className="font-medium text-slate-900">{feedback.userName}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4">
                <div className="rounded-lg bg-purple-100 p-2">
                  <Mail className="h-5 w-5 text-purple-700" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs tracking-wide text-slate-500 uppercase">Email</p>
                  <p className="break-all font-medium text-slate-900">{feedback.userEmail}</p>
                </div>
              </div>
            </div>

            {(feedback.company || feedback.phone) && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {feedback.company ? (
                  <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4">
                    <div className="rounded-lg bg-indigo-100 p-2">
                      <Building2 className="h-5 w-5 text-indigo-700" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs tracking-wide text-slate-500 uppercase">Company / team</p>
                      <p className="font-medium text-slate-900">{feedback.company}</p>
                    </div>
                  </div>
                ) : null}
                {feedback.phone ? (
                  <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4">
                    <div className="rounded-lg bg-teal-100 p-2">
                      <Phone className="h-5 w-5 text-teal-700" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs tracking-wide text-slate-500 uppercase">Phone</p>
                      <p className="font-medium text-slate-900">{feedback.phone}</p>
                    </div>
                  </div>
                ) : null}
              </div>
            )}

            {feedback.notes ? (
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="mb-2 flex items-center gap-2 text-slate-700">
                  <StickyNote className="h-4 w-4 shrink-0" />
                  <span className="text-sm font-semibold">Extra context</span>
                </div>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600">{feedback.notes}</p>
              </div>
            ) : null}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4">
                <div className="rounded-lg bg-green-100 p-2">
                  <Calendar className="h-5 w-5 text-green-700" />
                </div>
                <div>
                  <p className="text-xs tracking-wide text-slate-500 uppercase">Created</p>
                  <p className="font-medium text-slate-900">{formatDetailDate(feedback.createdAt)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4">
                <div className="rounded-lg bg-amber-100 p-2">
                  <Clock className="h-5 w-5 text-amber-700" />
                </div>
                <div>
                  <p className="text-xs tracking-wide text-slate-500 uppercase">Last Updated</p>
                  <p className="font-medium text-slate-900">{formatDetailDate(feedback.updatedAt)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function FeedbackDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  if (!id) {
    return (
      <div className={APP_PAGE_BG}>
        <BrandBar />
        <div className="flex min-h-[50vh] items-center justify-center p-6">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>Not found</CardTitle>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate('/')} className="w-full">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to list
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return <FeedbackDetailContent id={id} navigate={navigate} />;
}
