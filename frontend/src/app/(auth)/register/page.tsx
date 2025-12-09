'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { useAuth } from '@/shared/contexts/AuthContext';
import { useToast } from '@/shared/hooks/useToast';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    displayName: '',
    password: '',
    confirmPassword: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Passwords do not match',
        description: 'Please make sure both passwords are the same',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await register({
        email: formData.email,
        username: formData.username,
        displayName: formData.displayName,
        password: formData.password,
      });
      router.push('/');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Registration failed',
        description: error instanceof Error ? error.message : 'Please try again',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md border-hackify-light-gray bg-hackify-dark-gray">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl text-white">Sign up for Hackify</CardTitle>
        <CardDescription>Create your account to start listening</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-white">
              Email address
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="name@example.com"
              value={formData.email}
              onChange={handleChange}
              required
              className="bg-hackify-light-gray"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="username" className="text-sm font-medium text-white">
              Username
            </label>
            <Input
              id="username"
              name="username"
              type="text"
              placeholder="Choose a username"
              value={formData.username}
              onChange={handleChange}
              required
              className="bg-hackify-light-gray"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="displayName" className="text-sm font-medium text-white">
              Display name
            </label>
            <Input
              id="displayName"
              name="displayName"
              type="text"
              placeholder="How should we call you?"
              value={formData.displayName}
              onChange={handleChange}
              required
              className="bg-hackify-light-gray"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-white">
              Password
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Create a password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={8}
              className="bg-hackify-light-gray"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-sm font-medium text-white">
              Confirm password
            </label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              minLength={8}
              className="bg-hackify-light-gray"
            />
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Creating account...' : 'Sign Up'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <span className="text-sm text-hackify-text-subdued">
            Already have an account?{' '}
          </span>
          <Link
            href="/login"
            className="text-sm font-semibold text-white underline-offset-4 hover:underline"
          >
            Log in here
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
