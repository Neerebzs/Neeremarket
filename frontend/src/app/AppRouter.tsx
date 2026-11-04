import { lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthLayout } from '@/layouts/AuthLayout';
import { MarketplaceLayout } from '@/layouts/MarketplaceLayout';
import { WorkspaceLayout } from '@/layouts/WorkspaceLayout';
const HomePage = lazy(() => import('@/pages/marketplace/HomePage').then(module => ({ default: module.HomePage })));
const ProductsPage = lazy(() => import('@/pages/marketplace/ProductsPage').then(module => ({ default: module.ProductsPage })));
const CategoryPage = lazy(() => import('@/pages/marketplace/CategoryPage').then(module => ({ default: module.CategoryPage })));
const ProductDetailPage = lazy(() => import('@/pages/marketplace/ProductDetailPage').then(module => ({ default: module.ProductDetailPage })));
const SearchPage = lazy(() => import('@/pages/marketplace/SearchPage').then(module => ({ default: module.SearchPage })));
const StoresPage = lazy(() => import('@/pages/marketplace/StoresPage').then(module => ({ default: module.StoresPage })));
const StorefrontPage = lazy(() => import('@/pages/marketplace/StorefrontPage').then(module => ({ default: module.StorefrontPage })));
const LoginPage = lazy(() => import('@/pages/auth/LoginPage').then(module => ({ default: module.LoginPage })));
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage').then(module => ({ default: module.RegisterPage })));
const AccountPage = lazy(() => import('@/pages/account/AccountPage').then(module => ({ default: module.AccountPage })));
const SellerDashboardPage = lazy(() => import('@/pages/seller/SellerDashboardPage').then(module => ({ default: module.SellerDashboardPage })));
const SellerProductsPage = lazy(() => import('@/pages/seller/SellerProductsPage').then(module => ({ default: module.SellerProductsPage })));
const SellerProductFormPage = lazy(() => import('@/pages/seller/SellerProductFormPage').then(module => ({ default: module.SellerProductFormPage })));
const SellerFinancePage = lazy(() => import('@/pages/seller/SellerFinancePage').then(module => ({ default: module.SellerFinancePage })));
const SellerAgakayePage = lazy(() => import('@/pages/seller/SellerAgakayePage').then(module => ({ default: module.SellerAgakayePage })));
const SellerOrdersPage = lazy(() => import('@/pages/seller/SellerOrdersPage').then(module => ({ default: module.SellerOrdersPage })));
const SellerDisputesPage = lazy(() => import('@/pages/seller/SellerDisputesPage').then(module => ({ default: module.SellerDisputesPage })));
const SellerProfilePage = lazy(() => import('@/pages/seller/SellerProfilePage').then(module => ({ default: module.SellerProfilePage })));
const SellerOnboardingPage = lazy(() => import('@/pages/seller/SellerOnboardingPage').then(module => ({ default: module.SellerOnboardingPage })));
const SellerInventoryPage = lazy(() => import('@/pages/seller/SellerInventoryPage').then(module => ({ default: module.SellerInventoryPage })));
const SellerReviewsPage = lazy(() => import('@/pages/seller/SellerReviewsPage').then(module => ({ default: module.SellerReviewsPage })));
const SellerProductDetailPage = lazy(() => import('@/pages/seller/SellerProductDetailPage').then(module => ({ default: module.SellerProductDetailPage })));
const InboxPage = lazy(() => import('@/pages/workspace/InboxPage').then(module => ({ default: module.InboxPage })));
const AlertsPage = lazy(() => import('@/pages/workspace/AlertsPage').then(module => ({ default: module.AlertsPage })));
const CartPage = lazy(() => import('@/pages/account/CartPage').then(module => ({ default: module.CartPage })));
const CheckoutPage = lazy(() => import('@/pages/account/CheckoutPage').then(module => ({ default: module.CheckoutPage })));
const OrdersPage = lazy(() => import('@/pages/account/OrdersPage').then(module => ({ default: module.OrdersPage })));
const OrderDetailPage = lazy(() => import('@/pages/account/OrderDetailPage').then(module => ({ default: module.OrderDetailPage })));
const WishlistPage = lazy(() => import('@/pages/account/WishlistPage').then(module => ({ default: module.WishlistPage })));
const NotificationsPage = lazy(() => import('@/pages/account/NotificationsPage').then(module => ({ default: module.NotificationsPage })));
const MessagesPage = lazy(() => import('@/pages/account/MessagesPage').then(module => ({ default: module.MessagesPage })));
const AdminPage = lazy(() => import('@/pages/admin/AdminPage').then(module => ({ default: module.AdminPage })));
const CategoriesPage = lazy(() => import('@/pages/marketplace/CategoriesPage').then(module => ({ default: module.CategoriesPage })));
const ContentPage = lazy(() => import('@/pages/marketplace/ContentPage').then(module => ({ default: module.ContentPage })));
const DealsPage = lazy(() => import('@/pages/marketplace/ProductsPage').then(module => ({ default: module.DealsPage })));
const PlaceholderPage = lazy(() => import('@/pages/marketplace/PlaceholderPage').then(module => ({ default: module.PlaceholderPage })));
const WhyTomboraPage = lazy(() => import('@/pages/info/WhyTomboraPage').then(module => ({ default: module.WhyTomboraPage })));
const HowItWorksPage = lazy(() => import('@/pages/info/HowItWorksPage').then(module => ({ default: module.HowItWorksPage })));
const SellPage = lazy(() => import('@/pages/info/SellPage').then(module => ({ default: module.SellPage })));
const HelpPage = lazy(() => import('@/pages/info/HelpPage').then(module => ({ default: module.HelpPage })));
const ReturnsPage = lazy(() => import('@/pages/info/ReturnsPage').then(module => ({ default: module.ReturnsPage })));
const ContactPage = lazy(() => import('@/pages/info/ContactPage').then(module => ({ default: module.ContactPage })));
const SourcingRequestPage = lazy(() => import('@/pages/info/SourcingRequestPage').then(module => ({ default: module.SourcingRequestPage })));
const OnlineServicePage = lazy(() => import('@/pages/info/OnlineServicePage').then(module => ({ default: module.OnlineServicePage })));
const MobileAppPage = lazy(() => import('@/pages/info/MobileAppPage').then(module => ({ default: module.MobileAppPage })));
const ImageSearchPage = lazy(() => import('@/pages/marketplace/ImageSearchPage').then(module => ({ default: module.ImageSearchPage })));
const NewArrivalsPage = lazy(() => import('@/pages/marketplace/NewArrivalsPage').then(module => ({ default: module.NewArrivalsPage })));
const DisputesPage = lazy(() => import('@/pages/account/DisputesPage').then(module => ({ default: module.DisputesPage })));
const NewDisputePage = lazy(() => import('@/pages/account/NewDisputePage').then(module => ({ default: module.NewDisputePage })));
const DisputeDetailPage = lazy(() => import('@/pages/account/DisputeDetailPage').then(module => ({ default: module.DisputeDetailPage })));
const SellerDisputeDetailPage = lazy(() => import('@/pages/seller/SellerDisputeDetailPage').then(module => ({ default: module.SellerDisputeDetailPage })));
const AdminDisputeDetailPage = lazy(() => import('@/pages/admin/AdminDisputeDetailPage').then(module => ({ default: module.AdminDisputeDetailPage })));
const AdminOrderDetailPage = lazy(() => import('@/pages/admin/AdminOrderDetailPage').then(module => ({ default: module.AdminOrderDetailPage })));
const SellerOrderDetailPage = lazy(() => import('@/pages/seller/SellerOrderDetailPage').then(module => ({ default: module.SellerOrderDetailPage })));

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
          <Route path="seller/agakaye" element={<SellerAgakayePage />} />
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
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="categories/:slug" element={<CategoryPage />} />
          <Route path="stores" element={<StoresPage />} />
          <Route path="stores/:slug" element={<StorefrontPage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="deals" element={<DealsPage />} />
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
          <Route path="terms" element={<ContentPage slug="terms" title="Terms" />} />
          <Route path="privacy" element={<ContentPage slug="privacy" title="Privacy" />} />
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
