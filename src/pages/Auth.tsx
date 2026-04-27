
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from "@/components/ui/password-input";
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { BarChart3, DollarSign, Users, FileText, Building2, TrendingUp } from 'lucide-react';

const modules = [
  { icon: BarChart3, title: 'Business Intelligence', desc: 'Báo cáo kinh doanh, phân tích doanh thu theo công ty & bộ phận' },
  { icon: DollarSign, title: 'Revenue & Cost', desc: 'Quản lý doanh thu, chi phí và chi phí khách hàng' },
  { icon: Users, title: 'Human Resources', desc: 'Theo dõi ngày công, nhân sự và phân quyền người dùng' },
  { icon: FileText, title: 'Reporting', desc: 'Dashboard tổng quan, báo cáo khách hàng & bộ phận' },
];

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { signIn } = useAuth();

  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (rememberMe) {
      localStorage.setItem('rememberedEmail', email);
    } else {
      localStorage.removeItem('rememberedEmail');
    }

    try {
      const { mustChangePassword } = await signIn(email, password);
      toast({ title: 'Success', description: 'Logged in successfully!' });
      navigate(mustChangePassword ? '/change-password' : '/', { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel — hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 20% 20%, white 1px, transparent 1px), radial-gradient(circle at 80% 70%, white 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div className="flex items-center gap-3">
            <img src="/logo-light.png" alt="Logo" className="h-11 w-auto object-contain" />
            <div className="leading-tight">
              <h1 className="text-xl font-bold leading-tight">ERP System</h1>
              <p className="text-sm text-primary-foreground/80 leading-tight">Enterprise Resource Planning</p>
            </div>
          </div>

          <div className="space-y-8">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur px-3 py-1 rounded-full text-xs font-medium mb-4">
                <TrendingUp className="h-3.5 w-3.5" />
                Quản trị doanh nghiệp toàn diện
              </div>
              <h2 className="text-4xl font-bold leading-tight mb-3">
                Tối ưu vận hành,<br />tăng trưởng bền vững
              </h2>
              <p className="text-primary-foreground/80 text-base max-w-md">
                Nền tảng hợp nhất dữ liệu doanh thu, chi phí, nhân sự và báo cáo, giúp ra quyết định nhanh hơn.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 max-w-xl">
              {modules.map((m) => (
                <div key={m.title} className="bg-white/10 backdrop-blur rounded-lg p-4 border border-white/10">
                  <m.icon className="h-5 w-5 mb-2" />
                  <h3 className="font-semibold text-sm mb-1">{m.title}</h3>
                  <p className="text-xs text-primary-foreground/75 leading-relaxed">{m.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-primary-foreground/70">
            <Building2 className="h-4 w-4" />
            <span>© {new Date().getFullYear()} SKG — All rights reserved</span>
          </div>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center bg-background p-6 lg:p-12">
        <div className="w-full max-w-sm space-y-8">
          <div className="lg:hidden flex items-center gap-3 justify-center">
            <img src="/logo.png" alt="Logo" className="h-10 w-10 object-contain" />
            <span className="text-lg font-bold">ERP System</span>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">Chào mừng trở lại</h2>
            <p className="text-sm text-muted-foreground">Đăng nhập để tiếp tục sử dụng hệ thống</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="name@company.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu</Label>
              <PasswordInput id="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="remember-me" checked={rememberMe} onCheckedChange={(checked) => setRememberMe(checked as boolean)} />
              <Label htmlFor="remember-me" className="text-sm font-normal cursor-pointer">Ghi nhớ đăng nhập</Label>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </Button>
          </form>

          <p className="text-xs text-center text-muted-foreground">
            Cần hỗ trợ? Liên hệ quản trị viên hệ thống.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
