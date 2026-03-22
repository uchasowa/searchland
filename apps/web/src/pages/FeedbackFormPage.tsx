import { FormEvent, useEffect, useRef, useState, type Ref, type RefObject } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ImagePlus, Save, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { BrandBar } from '../components/BrandBar';
import { APP_PAGE_BG } from '../lib/brand';
import { publicFileUrl, uploadFeedbackImage } from '../lib/upload';
import { trpc } from '../lib/trpc';
import type { FeedbackCategory, FeedbackStatus } from '../types/feedback';

type FormDataState = {
  title: string;
  description: string;
  category: FeedbackCategory;
  status: FeedbackStatus;
  userName: string;
  userEmail: string;
  priority: 'low' | 'medium' | 'high';
  company: string;
  phone: string;
  notes: string;
};

const emptyForm = (): FormDataState => ({
  title: '',
  description: '',
  category: 'other',
  status: 'new',
  userName: '',
  userEmail: '',
  priority: 'medium',
  company: '',
  phone: '',
  notes: '',
});

type FormLayoutProps = {
  isEditing: boolean;
  navigate: NavigateFunction;
  formData: FormDataState;
  setFormData: React.Dispatch<React.SetStateAction<FormDataState>>;
  errors: Record<string, string>;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  imageUrls: string[];
  setImageUrls: React.Dispatch<React.SetStateAction<string[]>>;
  fileInputRef: RefObject<HTMLInputElement | null>;
  uploadError: string | null;
  uploading: boolean;
  pending: boolean;
  mutationError: string | null;
  onSubmit: (e: FormEvent) => void;
  onPickImages: (files: FileList | null) => void;
};

function FeedbackFormLayout({
  isEditing,
  navigate,
  formData,
  setFormData,
  errors,
  setErrors,
  imageUrls,
  setImageUrls,
  fileInputRef,
  uploadError,
  uploading,
  pending,
  mutationError,
  onSubmit,
  onPickImages,
}: FormLayoutProps) {
  return (
    <div className={APP_PAGE_BG}>
      <BrandBar />
      <div className="relative z-0 mx-auto max-w-3xl space-y-6 p-6">
        <div className="flex flex-wrap items-center gap-4">
          <Button type="button" variant="outline" onClick={() => navigate(-1)} className="shadow-sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="bg-gradient-to-r from-primary to-cyan-700 bg-clip-text text-3xl font-bold text-transparent">
            {isEditing ? 'Edit feedback' : 'New feedback'}
          </h1>
        </div>

        <Card className="border-slate-200 shadow-lg">
          <CardHeader>
            <CardTitle className="text-slate-900">
              {isEditing ? 'Update your feedback' : "What's on your mind?"}
            </CardTitle>
            <p className="mt-1 text-sm text-slate-600">
              {isEditing
                ? 'Make changes below. All fields are saved to the database.'
                : 'Share bugs, ideas, or questions. Add screenshots to pinpoint UI issues. All fields are saved to the database.'}
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-6">
              {mutationError ? (
                <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                  {mutationError}
                </div>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="title" className="text-slate-700">
                  Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="Brief summary"
                  value={formData.title}
                  onChange={(e) => {
                    setFormData({ ...formData, title: e.target.value });
                    if (errors.title) setErrors({ ...errors, title: '' });
                  }}
                  className={errors.title ? 'border-red-300' : ''}
                />
                {errors.title && <p className="text-sm text-red-600">{errors.title}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-slate-700">
                  Description <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="description"
                  placeholder="Tell us more…"
                  value={formData.description}
                  onChange={(e) => {
                    setFormData({ ...formData, description: e.target.value });
                    if (errors.description) setErrors({ ...errors, description: '' });
                  }}
                  className={errors.description ? 'min-h-32 border-red-300' : 'min-h-32'}
                />
                {errors.description && <p className="text-sm text-red-600">{errors.description}</p>}
              </div>

              <div className="space-y-3">
                <Label className="text-slate-700">
                  Screenshots <span className="font-normal text-slate-400">(optional, up to 5)</span>
                </Label>
                <p className="text-sm text-slate-500">
                  JPEG, PNG, GIF, or WebP — max 5 MB each. Helps reproduce bugs and layout issues.
                </p>
                <input
                  ref={fileInputRef as Ref<HTMLInputElement>}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  multiple
                  className="hidden"
                  onChange={(e) => void onPickImages(e.target.files)}
                />
                <div className="flex flex-wrap gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={uploading || imageUrls.length >= 5 || pending}
                    onClick={() => fileInputRef.current?.click()}
                    className="border-dashed"
                  >
                    <ImagePlus className="mr-2 h-4 w-4" />
                    {uploading ? 'Uploading…' : 'Add images'}
                  </Button>
                </div>
                {uploadError ? <p className="text-sm text-red-600">{uploadError}</p> : null}
                {imageUrls.length > 0 ? (
                  <ul className="flex flex-wrap gap-3">
                    {imageUrls.map((url) => (
                      <li key={url} className="relative">
                        <img
                          src={publicFileUrl(url)}
                          alt=""
                          className="h-24 w-24 rounded-lg border border-slate-200 object-cover"
                        />
                        <button
                          type="button"
                          aria-label="Remove image"
                          className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50"
                          onClick={() => setImageUrls((prev) => prev.filter((u) => u !== url))}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-slate-700">
                    Category
                  </Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category: value as FeedbackCategory })
                    }
                  >
                    <SelectTrigger id="category" className="w-full">
                      <SelectValue placeholder="Choose category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bug">Bug</SelectItem>
                      <SelectItem value="feature">Feature Request</SelectItem>
                      <SelectItem value="improvement">Improvement</SelectItem>
                      <SelectItem value="question">Question</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority" className="text-slate-700">
                    Priority
                  </Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) =>
                      setFormData({ ...formData, priority: value as 'low' | 'medium' | 'high' })
                    }
                  >
                    <SelectTrigger id="priority" className="w-full">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status" className="text-slate-700">
                    Status
                  </Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      setFormData({ ...formData, status: value as FeedbackStatus })
                    }
                  >
                    <SelectTrigger id="status" className="w-full">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="reviewing">Reviewing</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <h3 className="mb-4 font-semibold text-slate-900">Your info</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="userName" className="text-slate-700">
                      Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="userName"
                      placeholder="Your name"
                      value={formData.userName}
                      onChange={(e) => {
                        setFormData({ ...formData, userName: e.target.value });
                        if (errors.userName) setErrors({ ...errors, userName: '' });
                      }}
                      className={errors.userName ? 'border-red-300' : ''}
                    />
                    {errors.userName && <p className="text-sm text-red-600">{errors.userName}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="userEmail" className="text-slate-700">
                      Email <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="userEmail"
                      type="email"
                      placeholder="you@example.com"
                      value={formData.userEmail}
                      onChange={(e) => {
                        setFormData({ ...formData, userEmail: e.target.value });
                        if (errors.userEmail) setErrors({ ...errors, userEmail: '' });
                      }}
                      className={errors.userEmail ? 'border-red-300' : ''}
                    />
                    {errors.userEmail && <p className="text-sm text-red-600">{errors.userEmail}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="company" className="text-slate-700">
                      Company / team <span className="text-slate-400">(optional)</span>
                    </Label>
                    <Input
                      id="company"
                      placeholder="Acme Inc."
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-slate-700">
                      Phone <span className="text-slate-400">(optional)</span>
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+44 …"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className="text-slate-700">
                  Extra context <span className="text-slate-400">(optional)</span>
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Links, steps to reproduce, environment, etc."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="min-h-24"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" size="lg" className="flex-1 shadow-md" disabled={pending}>
                  <Save className="mr-2 h-4 w-4" />
                  {pending ? 'Saving…' : isEditing ? 'Save Changes' : 'Submit Feedback'}
                </Button>
                <Button type="button" variant="outline" size="lg" onClick={() => navigate(-1)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function useImagePicker(
  imageUrls: string[],
  setImageUrls: React.Dispatch<React.SetStateAction<string[]>>,
  fileInputRef: RefObject<HTMLInputElement | null>
) {
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function onPickImages(files: FileList | null) {
    if (!files?.length) return;
    setUploadError(null);
    const remaining = 5 - imageUrls.length;
    if (remaining <= 0) return;
    const list = Array.from(files).slice(0, remaining);
    setUploading(true);
    try {
      const next: string[] = [];
      for (const file of list) {
        const url = await uploadFeedbackImage(file);
        next.push(url);
      }
      setImageUrls((prev) => [...prev, ...next]);
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  return { uploadError, uploading, onPickImages };
}

function FeedbackFormCreate() {
  const navigate = useNavigate();
  const utils = trpc.useUtils();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [formData, setFormData] = useState<FormDataState>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const { uploadError, uploading, onPickImages } = useImagePicker(
    imageUrls,
    setImageUrls,
    fileInputRef
  );

  const create = trpc.feedback.create.useMutation({
    onSuccess: async (row) => {
      await utils.feedback.list.invalidate();
      navigate(`/feedback/${row.id}`);
    },
  });

  const pending = create.isPending;
  const mutationError = create.error?.message ?? null;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.userName.trim()) newErrors.userName = 'Name is required';
    if (!formData.userEmail.trim()) newErrors.userEmail = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.userEmail)) newErrors.userEmail = 'Email is invalid';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    create.mutate({
      title: formData.title.trim(),
      description: formData.description.trim(),
      category: formData.category,
      status: formData.status,
      userName: formData.userName.trim(),
      userEmail: formData.userEmail.trim(),
      priority: formData.priority,
      company: formData.company.trim(),
      phone: formData.phone.trim(),
      notes: formData.notes.trim(),
      imageUrls,
    });
  }

  return (
    <FeedbackFormLayout
      isEditing={false}
      navigate={navigate}
      formData={formData}
      setFormData={setFormData}
      errors={errors}
      setErrors={setErrors}
      imageUrls={imageUrls}
      setImageUrls={setImageUrls}
      fileInputRef={fileInputRef}
      uploadError={uploadError}
      uploading={uploading}
      pending={pending}
      mutationError={mutationError}
      onSubmit={handleSubmit}
      onPickImages={onPickImages}
    />
  );
}

function FeedbackFormEdit({ id }: { id: string }) {
  const navigate = useNavigate();
  const utils = trpc.useUtils();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const existing = trpc.feedback.byId.useQuery({ id });

  const [formData, setFormData] = useState<FormDataState>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const { uploadError, uploading, onPickImages } = useImagePicker(
    imageUrls,
    setImageUrls,
    fileInputRef
  );

  useEffect(() => {
    if (!existing.data) return;
    const f = existing.data;
    setFormData({
      title: f.title,
      description: f.description,
      category: f.category,
      status: f.status,
      userName: f.userName,
      userEmail: f.userEmail,
      priority: f.priority,
      company: f.company ?? '',
      phone: f.phone ?? '',
      notes: f.notes ?? '',
    });
    setImageUrls(f.imageUrls ?? []);
  }, [existing.data]);

  const update = trpc.feedback.update.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.feedback.list.invalidate(),
        utils.feedback.byId.invalidate({ id }),
      ]);
      navigate(`/feedback/${id}`);
    },
  });

  const pending = update.isPending;
  const mutationError = update.error?.message ?? null;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.userName.trim()) newErrors.userName = 'Name is required';
    if (!formData.userEmail.trim()) newErrors.userEmail = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.userEmail)) newErrors.userEmail = 'Email is invalid';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    update.mutate({
      id,
      data: {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        status: formData.status,
        userName: formData.userName.trim(),
        userEmail: formData.userEmail.trim(),
        priority: formData.priority,
        company: formData.company.trim(),
        phone: formData.phone.trim(),
        notes: formData.notes.trim(),
        imageUrls,
      },
    });
  }

  if (existing.isLoading) {
    return (
      <div className={APP_PAGE_BG}>
        <BrandBar />
        <div className="flex min-h-[50vh] items-center justify-center p-6">
          <p className="text-slate-600">Loading…</p>
        </div>
      </div>
    );
  }

  if (existing.isError) {
    return (
      <div className={APP_PAGE_BG}>
        <BrandBar />
        <div className="flex min-h-[50vh] items-center justify-center p-6">
          <p className="text-red-700">Could not load feedback.</p>
        </div>
      </div>
    );
  }

  return (
    <FeedbackFormLayout
      isEditing
      navigate={navigate}
      formData={formData}
      setFormData={setFormData}
      errors={errors}
      setErrors={setErrors}
      imageUrls={imageUrls}
      setImageUrls={setImageUrls}
      fileInputRef={fileInputRef}
      uploadError={uploadError}
      uploading={uploading}
      pending={pending}
      mutationError={mutationError}
      onSubmit={handleSubmit}
      onPickImages={onPickImages}
    />
  );
}

export function FeedbackFormPage() {
  const { id } = useParams();
  if (id) {
    return <FeedbackFormEdit id={id} />;
  }
  return <FeedbackFormCreate />;
}
