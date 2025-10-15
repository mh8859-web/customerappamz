const CACHE_NAME = 'amaz-pm-cache-v10'; // Incremented version

// All LOCAL application files that are essential for the app shell.
const LOCAL_APP_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/index.tsx',
  '/App.tsx',
  '/types.ts',
  '/constants.ts',
  '/context/AuthContext.tsx',
  '/context/UserContext.tsx',
  '/services/api.ts',
  '/services/supabaseClient.ts',
  '/components/icons.tsx',
  '/components/layout/DashboardLayout.tsx',
  '/components/layout/Header.tsx',
  '/components/layout/Sidebar.tsx',
  '/components/ui/Button.tsx',
  '/components/ui/Card.tsx',
  '/components/ui/InstallAppModal.tsx',
  '/components/ui/Modal.tsx',
  '/components/ui/UserNameDisplay.tsx',
  '/pages/Login.tsx',
  '/pages/ProjectDetails.tsx',
  '/pages/ProjectsList.tsx',
  '/pages/dashboards/AdminDashboard.tsx',
  '/pages/dashboards/DesignerDashboard.tsx',
  '/pages/dashboards/CustomerDashboard.tsx',
  '/pages/admin/AdminOverview.tsx',
  '/pages/admin/AdminSettings.tsx',
  '/pages/admin/AttendanceLogs.tsx',
  '/pages/admin/FinancialReports.tsx',
  '/pages/admin/UserManagement.tsx',
  '/pages/designer/LeaveManagement.tsx',
  '/pages/designer/MyAttendance.tsx',
  '/pages/designer/MyCalendar.tsx',
  '/pages/designer/TaskBoard.tsx',
  '/pages/designer/TeamCalendar.tsx',
  '/pages/designer/WorkDiary.tsx',
  '/pages/customer/BillingHistory.tsx',
  '/pages/customer/MyAccount.tsx',
  '/pages/shared/CommunityHub.tsx',
  '/pages/shared/CommunityFeed.tsx',
  '/pages/shared/DownloadCenter.tsx',
  '/pages/shared/ProjectWall.tsx',
  '/pages/shared/SupportPage.tsx',
  '/components/ProjectStatusBar.tsx',
  '/components/admin/CreateProjectModal.tsx',
  '/components/admin/CreateTemplateModal.tsx',
  '/components/admin/CreateUserModal.tsx',
  '/components/admin/EditUserModal.tsx',
  '/components/admin/SqlInstructionModal.tsx',
  '/components/auth/ForgotPasswordModal.tsx',
  '/components/chat/ChatComponent.tsx',
  '/components/chat/MessageBubble.tsx',
  '/components/customer/PaymentReminderModal.tsx',
  '/components/customer/ProjectGanttChart.tsx',
  '/components/dashboard/TestimonialFlow.tsx',
  '/components/design/DesignAnnotationModal.tsx',
  '/components/designer/AddProductModal.tsx',
  '/components/designer/GeneratePOModal.tsx',
  '/components/designer/TaskCard.tsx',
  '/components/feed/CommentSection.tsx',
  '/components/feed/CreatePost.tsx',
  '/components/feed/CreatePostModal.tsx',
  '/components/feed/PostCard.tsx'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Pre-caching local app assets.');
        return cache.addAll(LOCAL_APP_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // Always go to the network for Supabase API calls.
  if (request.url.includes('supabase.co')) {
    return;
  }

  // For local files and navigation, use a "Cache First, then network" strategy.
  // This ensures the app loads instantly offline from the pre-cached assets.
  const url = new URL(request.url);
  const isLocalAsset = url.origin === self.location.origin && LOCAL_APP_ASSETS.includes(url.pathname);

  if (request.mode === 'navigate' || isLocalAsset) {
    event.respondWith(
      caches.match(request)
        .then(cachedResponse => cachedResponse || fetch(request))
    );
    return;
  }

  // For everything else (esm.sh, cloudinary, fonts), use "Stale-While-Revalidate".
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request).then((networkResponse) => {
          cache.put(request, networkResponse.clone());
          return networkResponse;
        });
        return cachedResponse || fetchPromise;
      });
    })
  );
});