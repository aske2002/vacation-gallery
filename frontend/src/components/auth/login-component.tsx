import React, { useState } from 'react';
import { useAuth } from '../../hooks/useVacationAuth';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { LoadingButton } from '../loading-button';

interface LoginFormProps {
  onSuccess?: () => void;
  onSwitchToRegister?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, onSwitchToRegister }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState<string | null>(null);

  const { login, isLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.username || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      await login(formData);
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || 'Login failed');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="username">Username or Email</Label>
            <Input
              id="username"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleChange}
              placeholder="Enter your username or email"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
            />
          </div>

          <LoadingButton
            type="submit"
            loading={isLoading}
            className="w-full"
          >
            Login
          </LoadingButton>

          {onSwitchToRegister && (
            <div className="text-center">
              <span className="text-sm text-muted-foreground">
                Don't have an account?{' '}
                <Button
                  type="button"
                  variant="link"
                  className="p-0 h-auto font-normal"
                  onClick={onSwitchToRegister}
                >
                  Sign up
                </Button>
              </span>
            </div>
          )}
        </form>
    </>
  );
};
