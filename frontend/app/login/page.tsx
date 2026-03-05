import Link from 'next/link';
import Card from '@/components/ui/Card';
import LoginForm from '@/components/forms/LoginForm';

export default function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-64px)] px-4 py-12">
      <div className="w-full max-w-md">
        <Card title="Sign in to your account">
          <LoginForm />
          <p className="text-sm text-center text-gray-500 mt-4">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-blue-600 hover:underline font-medium">
              Sign up
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
