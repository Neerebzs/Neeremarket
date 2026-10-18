import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthLayout } from '@/layouts/AuthLayout';
import { MarketplaceLayout } from '@/layouts/MarketplaceLayout';
import { WorkspaceLayout } from '@/layouts/WorkspaceLayout';
import { HomePage } from '@/pages/marketplace/HomePage';
import { ProductsPage } from '@/pages/marketplace/ProductsPage';
import { CategoryPage } from '@/pages/marketplace/CategoryPage';
import { ProductDetailPage } from '@/pages/marketplace/ProductDetailPage';
import { SearchPage } from '@/pages/marketplace/SearchPage';
import { StoresPage } from '@/pages/marketplace/StoresPage';
import { StorefrontPage } from '@/pages/marketplace/StorefrontPage';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { AccountPage } from '@/pages/account/AccountPage';
import { SellerDashboardPage } from '@/pages/seller/SellerDashboardPage';
import { SellerProductsPage } from '@/pages/seller/SellerProductsPage';
import { SellerProductFormPage } from '@/pages/seller/SellerProductFormPage';
import { SellerFinancePage } from '@/pages/seller/SellerFinancePage';
import { SellerOrdersPage } from '@/pages/seller/SellerOrdersPage';
import { SellerDisputesPage } from '@/pages/seller/SellerDisputesPage';
import { SellerProfilePage } from '@/pages/seller/SellerProfilePage';
import { SellerOnboardingPage } from '@/pages/seller/SellerOnboardingPage';
import { SellerInventoryPage } from '@/pages/seller/SellerInventoryPage';
import { SellerReviewsPage } from '@/pages/seller/SellerReviewsPage';
import { SellerProductDetailPage } from '@/pages/seller/SellerProductDetailPage';
import { InboxPage } from '@/pages/workspace/InboxPage';
import { AlertsPage } from '@/pages/workspace/AlertsPage';
import { CartPage } from '@/pages/account/CartPage';
import { CheckoutPage } from '@/pages/account/CheckoutPage';
import { OrdersPage } from '@/pages/account/OrdersPage';
import { OrderDetailPage } from '@/pages/account/OrderDetailPage';
import { WishlistPage } from '@/pages/account/WishlistPage';
import { NotificationsPage } from '@/pages/account/NotificationsPage';
import { MessagesPage } from '@/pages/account/MessagesPage';
import { AdminPage } from '@/pages/admin/AdminPage';
import { PlaceholderPage } from '@/pages/marketplace/PlaceholderPage';
import { WhyTomboraPage } from '@/pages/info/WhyTomboraPage';
import { HowItWorksPage } from '@/pages/info/HowItWorksPage';
import { SellPage } from '@/pages/info/SellPage';
import { HelpPage } from '@/pages/info/HelpPage';
import { ReturnsPage } from '@/pages/info/ReturnsPage';
import { ContactPage } from '@/pages/info/ContactPage';
import { SourcingRequestPage } from '@/pages/info/SourcingRequestPage';
import { OnlineServicePage } from '@/pages/info/OnlineServicePage';
import { MobileAppPage } from '@/pages/info/MobileAppPage';
import { ImageSearchPage } from '@/pages/marketplace/ImageSearchPage';
import { NewArrivalsPage } from '@/pages/marketplace/NewArrivalsPage';
import { DisputesPage } from '@/pages/account/DisputesPage';
import { NewDisputePage } from '@/pages/account/NewDisputePage';
import { DisputeDetailPage } from '@/pages/account/DisputeDetailPage';
import { SellerDisputeDetailPage } from '@/pages/seller/SellerDisputeDetailPage';
import { AdminDisputeDetailPage } from '@/pages/admin/AdminDisputeDetailPage';
import { AdminOrderDetailPage } from '@/pages/admin/AdminOrderDetailPage';
import { SellerOrderDetailPage } from '@/pages/seller/SellerOrderDetailPage';

export function AppRouter() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route element={<WorkspaceLayout variant="seller" />}>
          <Route path="seller" element={<SellerDashboardPage />} />
          <Route path="seller/products" element={<SellerProductsPage />} />
          <Route path="seller/products/new" element={<SellerProductFormPage />} />
          <Route path="seller/products/:productId/edit" element={<SellerProductFormPage />} />
          <Route path="seller/products/:productId" element={<SellerProductDetailPage />} />
          <Route path="seller/inventory" element={<SellerInventoryPage />} />
          <Route path="seller/reviews" element={<SellerReviewsPage />} />
          <Route path="seller/finance" element={<SellerFinancePage />} />
          <Route path="seller/orders" element={<SellerOrdersPage />} />
          <Route path="seller/orders/:id" element={<SellerOrderDetailPage />} />
          <Route path="seller/messages" element={<InboxPage basePath="/seller/messages" />} />
          <Route path="seller/messages/:threadId" element={<InboxPage basePath="/seller/messages" />} />
          <Route path="seller/disputes" element={<SellerDisputesPage />} />
          <Route path="seller/disputes/:id" element={<SellerDisputeDetailPage />} />
          <Route path="seller/notifications" element={<AlertsPage />} />
          <Route path="seller/onboarding" element={<SellerOnboardingPage />} />
          <Route path="seller/profile" element={<SellerProfilePage />} />
        </Route>
        <Route element={<WorkspaceLayout variant="admin" />}>
          <Route path="admin" element={<AdminPage />} />
          <Route path="admin/messages" element={<InboxPage basePath="/admin/messages" scopeAll />} />
          <Route path="admin/messages/:threadId" element={<InboxPage basePath="/admin/messages" scopeAll />} />
          <Route path="admin/notifications" element={<AlertsPage />} />
          <Route path="admin/disputes/:id" element={<AdminDisputeDetailPage />} />
          <Route path="admin/orders/:id" element={<AdminOrderDetailPage />} />
          <Route path="admin/:section" element={<AdminPage />} />
        </Route>
        <Route element={<AuthLayout />}>
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
        </Route>
        <Route element={<MarketplaceLayout />}>
          <Route index element={<HomePage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="products/:slug" element={<ProductDetailPage />} />
          <Route path="categories" element={<PlaceholderPage title="Categories" />} />
          <Route path="categories/:slug" element={<CategoryPage />} />
          <Route path="stores" element={<StoresPage />} />
          <Route path="stores/:slug" element={<StorefrontPage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="deals" element={<PlaceholderPage title="Deals" />} />
          <Route path="new-arrivals" element={<NewArrivalsPage />} />
          <Route path="best-sellers" element={<PlaceholderPage title="Best sellers" />} />
          <Route path="wishlist" element={<WishlistPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="messages" element={<MessagesPage />} />
          <Route path="messages/new/:sellerId" element={<MessagesPage />} />
          <Route path="messages/:threadId" element={<MessagesPage />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="orders/:id" element={<OrderDetailPage />} />
          <Route path="disputes" element={<DisputesPage />} />
          <Route path="disputes/new" element={<NewDisputePage />} />
          <Route path="disputes/:id" element={<DisputeDetailPage />} />
          <Route path="account" element={<AccountPage />} />
          <Route path="why-neeremarket" element={<WhyTomboraPage />} />
          <Route path="why-tombora" element={<Navigate to="/why-neeremarket" replace />} />
          <Route path="how-it-works" element={<HowItWorksPage />} />
          <Route path="help" element={<HelpPage />} />
          <Route path="about" element={<WhyTomboraPage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="terms" element={<PlaceholderPage title="Terms" />} />
          <Route path="privacy" element={<PlaceholderPage title="Privacy" />} />
          <Route path="returns" element={<ReturnsPage />} />
          <Route path="sell" element={<SellPage />} />
          <Route path="sourcing-request" element={<SourcingRequestPage />} />
          <Route path="online-service" element={<OnlineServicePage />} />
          <Route path="app" element={<MobileAppPage />} />
          <Route path="image-search" element={<ImageSearchPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
