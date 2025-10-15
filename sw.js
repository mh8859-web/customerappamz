
const CACHE_NAME = 'amaz-interiors-cache-v6';

// This list now includes EVERY file required for the app to function offline.
// This is the definitive fix for the infinite loading bug.
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/index.tsx',
  '/App.tsx',
  '/types.ts',
  '/constants.ts',
  '/context/AuthContext.tsx',
  '/context/UserContext.tsx',
  '/services/supabaseClient.ts',
  '/services/api.ts',
  '/services/mockData.ts',
  '/components/icons.tsx',
  '/components/layout/DashboardLayout.tsx',
  '/components/layout/Sidebar.tsx',
  '/components/layout/Header.tsx',
  '/components/ui/Card.tsx',
  '/components/ui/Button.tsx',
  '/components/ui/Modal.tsx',
  '/components/ui/InstallAppModal.tsx',
  '/components/ui/UserNameDisplay.tsx',
  '/components/ProjectStatusBar.tsx',
  '/components/auth/ForgotPasswordModal.tsx',
  '/components/admin/CreateProjectModal.tsx',
  '/components/admin/CreateUserModal.tsx',
  '/components/admin/EditUserModal.tsx',
  '/components/admin/SqlInstructionModal.tsx',
  '/components/admin/CreateTemplateModal.tsx',
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
  '/components/feed/PostCard.tsx',
  '/pages/Login.tsx',
  '/pages/ProjectDetails.tsx',
  '/pages/ProjectsList.tsx',
  '/pages/admin/AdminOverview.tsx',
  '/pages/admin/AdminSettings.tsx',
  '/pages/admin/AttendanceLogs.tsx',
  '/pages/admin/FinancialReports.tsx',
  '/pages/admin/UserManagement.tsx',
  '/pages/customer/BillingHistory.tsx',
  '/pages/customer/MyAccount.tsx',
  '/pages/dashboards/AdminDashboard.tsx',
  '/pages/dashboards/CustomerDashboard.tsx',
  '/pages/dashboards/DesignerDashboard.tsx',
  '/pages/designer/LeaveManagement.tsx',
  '/pages/designer/MyAttendance.tsx',
  '/pages/designer/MyCalendar.tsx',
  '/pages/designer/TaskBoard.tsx',
  '/pages/designer/TeamCalendar.tsx',
  '/pages/designer/WorkDiary.tsx',
  '/pages/shared/CommunityFeed.tsx',
  '/pages/shared/CommunityHub.tsx',
  '/pages/shared/DownloadCenter.tsx',
  '/pages/shared/ProjectWall.tsx',
  '/pages/shared/SupportPage.tsx',
  // External dependencies
  "https://esm.sh/react@19.2.0",
  "https://esm.sh/react-dom@19.2.0/client",
  "https://esm.sh/react-router-dom@7.9.4",
  "https://esm.sh/recharts@3.2.1",
  "https://esm.sh/@supabase/supabase-js@2"
];

// Install event: cache all critical app assets.
// self.skipWaiting() forces the new service worker to activate immediately.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache and caching all app files');
        return cache.addAll(URLS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Fetch event: serve from cache first, then fall back to network.
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // If we have a cached response, return it.
        if (response) {
          return response;
        }

        // Otherwise, fetch from the network.
        return fetch(event.request).then(
          networkResponse => {
            // A response is a stream and can only be consumed once.
            // We need to clone it to put one copy in the cache and send one to the browser.
            const responseToCache = networkResponse.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                // Cache the new response for future offline use.
                cache.put(event.request, responseToCache);
              });

            return networkResponse;
          }
        ).catch(error => {
            console.error('Fetch failed; network request failed.', error);
            // Optionally, return a generic offline response or an error response.
            // For now, we'll just let the request fail.
        });
      })
  );
});

// Activate event: clean up old caches and take control of all clients.
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Forcefully take control of all open pages.
  );
});
