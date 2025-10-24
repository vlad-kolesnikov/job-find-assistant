import { Link, Outlet, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { LogOut, LayoutDashboard, FileText, Bot, Calendar, Mail } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { toast } from 'sonner';
import { useEffect } from 'react';

const MainLayout = () => {
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email || 'User';
  const avatarUrl = (user?.user_metadata?.avatar_url || user?.user_metadata?.picture) as string | undefined;
  const initials = (displayName || 'U').slice(0, 1).toUpperCase();

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Logged out successfully');
      navigate('/auth');
    }
  };

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <div className="flex items-center gap-3 px-1 py-1.5">
            <Avatar className="h-8 w-8">
              <AvatarImage src={avatarUrl} alt={displayName} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 group-data-[collapsible=icon]/sidebar:hidden">
              <div className="truncate text-sm font-medium">{displayName}</div>
              <div className="truncate text-xs text-muted-foreground">{user?.email}</div>
            </div>
          </div>
          <SidebarInput placeholder="Search" />
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Main</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link to="/">
                      <LayoutDashboard />
                      <span>Application Tracker</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link to="/resume">
                      <FileText />
                      <span>ATS Keywords</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link to="/interview-coach">
                      <Bot />
                      <span>Interview Coach</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link to="/mail-agent">
                      <Mail />
                      <span>Jobs Mail Agent</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link to="/calendar">
                      <Calendar />
                      <span>Interview Calendar</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter />
        <SidebarRail />
      </Sidebar>

      <SidebarInset>
        <header className="sticky top-0 z-10 bg-card border-b border-border">
          <div className="flex h-14 items-center gap-2 px-4">
            <SidebarTrigger />
            <h1 className="text-lg font-semibold tracking-tight">Job Find Assistant</h1>
            <div className="ml-auto flex items-center gap-3">
              <Button onClick={handleSignOut} variant="destructive" size="sm">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-6">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default MainLayout;
