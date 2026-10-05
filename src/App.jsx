import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { WishlistProvider } from './context/WishlistContext';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import ScrollToTop from './components/ScrollToTop';

import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Payment from './pages/Payment';
import OrderSuccess from './pages/OrderSuccess';
import GuestOrderStatus from './pages/GuestOrderStatus';

import Account from './pages/Account';
import OrderHistory from './pages/OrderHistory';
import OrderDetails from './pages/OrderDetails';
import AddressBook from './pages/AddressBook';
import Wishlist from './pages/Wishlist';

import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

import { Toaster } from 'react-hot-toast';


function Layout({ children }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Navbar />
      <main style={{ flex: 1 }}>{children}</main>
      <Footer />
    </div>
  );
}

function NotFound() {
  return (
    <Layout>
      <div style={{ textAlign: 'center', padding: '80px 20px' }}>
        <h1 style={{ fontSize: '3rem', color: 'var(--accent)' }}>404</h1>
        <h2>Page not found</h2>
        <a
          href="/"
          style={{
            color: 'var(--primary)',
            marginTop: '16px',
            display: 'inline-block',
          }}
        >
          Go Home
        </a>
      </div>
    </Layout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop/>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>

            <Toaster position="top-center" reverseOrder={false} />

            <Routes>

              {/* Authentication */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password/:uid/:token"element={<ResetPassword />}/>

              {/* Public Pages */}
              <Route path="/" element={<Layout><Home /></Layout>} />
              <Route path="/shop" element={<Layout><Shop /></Layout>} />
              <Route path="/product/:slug" element={<Layout><ProductDetail /></Layout>} />
              <Route path="/cart" element={<Layout><Cart /></Layout>} />
              <Route path="/guest-checkout" element={<Layout><Checkout /></Layout>} />
              <Route path="/guest-order-status" element={<Layout><GuestOrderStatus /></Layout>} />

              {/* Protected Checkout */}
              <Route
                path="/checkout"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Checkout />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/checkout/payment"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Payment />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/order-success"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <OrderSuccess />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              {/* Protected Account */}
              <Route
                path="/account"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Account />
                    </Layout>
                  </ProtectedRoute>
                }
              >
                <Route path="orders" element={<OrderHistory />} />
                <Route path="orders/:id" element={<OrderDetails />} />
                <Route path="addresses" element={<AddressBook />} />
                <Route path="wishlist" element={<Wishlist />} />
              </Route>

              {/* 404 */}
              <Route path="*" element={<NotFound />} />

            </Routes>

          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
