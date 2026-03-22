import { Link } from 'react-router-dom';
import { BrandBar } from '../components/BrandBar';
import { APP_PAGE_BG } from '../lib/brand';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

export function NotFoundPage() {
  return (
    <div className={APP_PAGE_BG}>
      <BrandBar />
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <Card className="max-w-md border-slate-200 shadow-md">
          <CardHeader>
            <CardTitle className="bg-gradient-to-r from-primary to-cyan-700 bg-clip-text text-transparent">
              Page not found
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-slate-600">
              That URL isn&apos;t part of Searchland Feedback.
            </p>
            <Button asChild className="w-full">
              <Link to="/">Back to inbox</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
