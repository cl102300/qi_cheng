import { useState, type FormEvent } from 'react';
import { authService, type User } from '@/services/api';

interface AuthScreenProps {
  onAuthenticated: (user: User) => void;
  isChecking?: boolean;
  initialError?: string | null;
}

export function AuthScreen({ onAuthenticated, isChecking = false, initialError = null }: AuthScreenProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const user = isRegistering
        ? await authService.register(username, password)
        : await authService.login(username, password);
      setPassword('');
      onAuthenticated(user);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '登录失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-shell auth-shell">
      <div className="ambient-light ambient-light--rose" aria-hidden="true" />
      <div className="ambient-light ambient-light--gold" aria-hidden="true" />
      <main className="auth-page">
        <a className="brand auth-brand" href="#top" aria-label="Heart Memories">
          <span className="brand__mark" aria-hidden="true">♥</span>
          <span className="brand__copy">
            <strong>HEART MEMORIES</strong>
            <small>珍藏我们俩的每一个瞬间</small>
          </span>
        </a>

        <section className="auth-card" aria-labelledby="auth-title">
          <p className="eyebrow">我们的私人相册</p>
          <h1 id="auth-title">{isChecking ? '正在连接相册' : isRegistering ? '创建相册账户' : '登录回忆相册'}</h1>
          <p className="auth-card__description">
            {isChecking ? '正在确认登录状态…' : '登录同一账户，即可在不同手机上共享照片。'}
          </p>

          {!isChecking && (
            <form className="auth-form" onSubmit={(event) => void handleSubmit(event)}>
              <label htmlFor="auth-username">账号</label>
              <input
                id="auth-username"
                name="username"
                autoComplete="username"
                autoCapitalize="none"
                value={username}
                onChange={(event) => setUsername(event.currentTarget.value)}
                placeholder="输入账号"
                required
                minLength={3}
                maxLength={64}
                disabled={isLoading}
              />
              <label htmlFor="auth-password">密码</label>
              <input
                id="auth-password"
                name="password"
                type="password"
                autoComplete={isRegistering ? 'new-password' : 'current-password'}
                value={password}
                onChange={(event) => setPassword(event.currentTarget.value)}
                placeholder={isRegistering ? '至少 8 位' : '输入密码'}
                required
                minLength={isRegistering ? 8 : undefined}
                maxLength={128}
                disabled={isLoading}
              />

              {(error || initialError) && <p className="auth-error" role="alert">{error || initialError}</p>}

              <button className="auth-submit" type="submit" disabled={isLoading}>
                {isLoading ? '请稍候…' : isRegistering ? '创建账户并进入' : '登录相册'}
              </button>
            </form>
          )}

          {!isChecking && (
            <button
              className="auth-switch"
              type="button"
              onClick={() => { setIsRegistering((value) => !value); setError(null); }}
              disabled={isLoading}
            >
              {isRegistering ? '已有账户？返回登录' : '第一次使用？创建账户'}
            </button>
          )}
          <p className="auth-card__footnote">照片会保存到相册服务器的 SQLite 数据库中。</p>
        </section>
      </main>
    </div>
  );
}
