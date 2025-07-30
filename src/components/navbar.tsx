"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ThemeSwitcher } from "@/components/theme-switcher";
import Image from "next/image";
import { Bell, Check, Trash2 } from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export default function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [user, setUser] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const router = useRouter();
  
  useEffect(() => {
    // Überprüfe, ob der Benutzer angemeldet ist
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (response.ok) {
          const data = await response.json();
          setIsLoggedIn(true);
          setUser(data.user);
          setUserName(data.user.name || data.user.email);
          
          // Lade Benachrichtigungen für eingeloggte Benutzer
          loadNotifications();
        }
      } catch (error) {
        console.error("Fehler beim Abrufen des Benutzerstatus", error);
      }
    };
    
    checkAuth();
  }, []);

  const loadNotifications = async () => {
    try {
      const response = await fetch("/api/notifications");
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error("Fehler beim Laden der Benachrichtigungen", error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}/read`, { method: 'POST' });
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error("Fehler beim Markieren als gelesen", error);
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'warning': return 'bg-red-500';
      case 'success': return 'bg-green-500';
      case 'info': 
      default: return 'bg-blue-500';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'admin' || user?.isAdmin === true;

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setIsLoggedIn(false);
      setUserName("");
      setUser(null);
      router.push("/");
    } catch (error) {
      console.error("Fehler beim Abmelden", error);
    }
  };

  const [selectedNotification, setSelectedNotification] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleNotificationClick = (notification: any) => {
    setSelectedNotification(notification);
    setIsDialogOpen(true);
  };

  const handleMarkAsRead = async () => {
    await markAsRead(selectedNotification.id);
    // Dialog automatisch schließen nach dem Markieren als gelesen
    setIsDialogOpen(false);
  };

  const handleDeleteNotification = async () => {
    try {
      const response = await fetch(`/api/notifications/${selectedNotification.id}`, { method: 'DELETE' });
      if (response.ok) {
        // Sofort aus dem lokalen State entfernen
        setNotifications(prev => prev.filter(n => n.id !== selectedNotification.id));
        setIsDialogOpen(false);
      }
    } catch (error) {
      console.error("Fehler beim Löschen der Benachrichtigung", error);
    }
  };

  const handleDeleteAllNotifications = async () => {
    try {
      await fetch('/api/notifications', { method: 'DELETE' });
      setNotifications([]);
    } catch (error) {
      console.error("Fehler beim Löschen aller Benachrichtigungen", error);
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 bg-background border-b border-border z-10">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Image 
            src="/logo3.png" 
            alt="barriere-frei24 Logo" 
            width={156} 
            height={52}
            className="h-10 w-auto"
          />
        </div>
        <div className="flex items-center gap-4">
          {isLoggedIn ? (
            <>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Hallo, {userName}</span>
                {user?.bundle && (
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    user.bundle === 'PRO' ? 'bg-blue-500 text-white' :
                    user.bundle === 'ENTERPRISE' ? 'bg-purple-500 text-white' :
                    'bg-gray-500 text-white'
                  }`}>
                    {user.bundle}
                  </span>
                )}
                {isAdmin && (
                  <span className="bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
                    Admin
                  </span>
                )}
              </div>
              
              {/* Benachrichtigungen */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="relative focus:outline-none focus:ring-0 focus-visible:ring-0">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className={`absolute -top-2 -right-2 ${getNotificationColor(notifications.find(n => !n.read)?.type || 'info')} text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold`}>
                        {unreadCount}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  {notifications.length > 0 && (
                    <div className="flex justify-end p-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={handleDeleteAllNotifications}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        Alle löschen
                      </Button>
                    </div>
                  )}
                  {notifications.length === 0 ? (
                    <DropdownMenuItem>
                      Keine Benachrichtigungen
                    </DropdownMenuItem>
                  ) : (
                    notifications.slice(0, 5).map((notification) => (
                      <DropdownMenuItem
                        key={notification.id}
                        className={`cursor-pointer ${!notification.read ? 'bg-accent/50' : ''}`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start gap-3 w-full">
                          <div className={`w-2 h-2 rounded-full mt-2 ${getNotificationColor(notification.type)}`} />
                          <div className="flex-1">
                            <div className="font-medium text-sm">{notification.title}</div>
                            <div className="text-xs text-muted-foreground mt-1">{notification.message}</div>
                          </div>
                        </div>
                      </DropdownMenuItem>
                    ))
                  )}
                  {notifications.length > 5 && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-center">
                        Alle anzeigen...
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Button 
                variant="outline" 
                className="text-foreground border-border hover:bg-secondary"
                onClick={handleLogout}
              >
                Abmelden
              </Button>
              <Link href="/dashboard">
                <Button className="transition-transform hover:scale-105">
                  Dashboard
                </Button>
              </Link>
              <ThemeSwitcher />
            </>
          ) : (
            <>
              <Link 
                href="/login" 
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Login
              </Link>
              <Link href="/register">
                <Button className="transition-transform hover:scale-105">
                  Registrieren
                </Button>
              </Link>
              <ThemeSwitcher />
            </>
          )}
        </div>
      </div>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedNotification?.title}</DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <div className="text-sm text-muted-foreground">{selectedNotification?.message}</div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleMarkAsRead} className="flex items-center gap-2">
              <Check className="h-4 w-4" />
              Als gelesen markieren
            </Button>
            <Button variant="destructive" onClick={handleDeleteNotification} className="flex items-center gap-2">
              <Trash2 className="h-4 w-4" />
              Löschen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
