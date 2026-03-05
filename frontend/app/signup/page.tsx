import Link from 'next/link';
import Card from '@/components/ui/Card';
import SignupForm from '@/components/forms/SignupForm';

export default function SignupPage() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-4 py-12">
      <div className="w-full max-w-md">
        <Card title="Create your account">
          <SignupForm />
          <p className="text-sm text-center text-gray-500 mt-4">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-600 hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
