
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Wallet from "./pages/Wallet";
import Analysis from "./pages/Analysis";
import NotFound from "./pages/NotFound";
import AddTransaction from "./pages/AddTransaction";
import DailyTransactionsPage from "./pages/DailyTransactions";
import FilteredTransactions from "./pages/FilteredTransactions";
import WandaBirthday from "./pages/WandaBirthday";
import HolidayCountdownPage from "./pages/HolidayCountdownPage";
import SpecialEvent from "./pages/SpecialEvent";
import Auth from "./pages/Auth";
import ProtectedRoute from "./components/ProtectedRoute";
import { FinanceProvider } from "./context/FinanceContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <FinanceProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/wallet" element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
            <Route path="/analysis" element={<ProtectedRoute><Analysis /></ProtectedRoute>} />
            <Route path="/wanda-birthday" element={<ProtectedRoute><WandaBirthday /></ProtectedRoute>} />
            <Route path="/holiday-countdown" element={<ProtectedRoute><HolidayCountdownPage /></ProtectedRoute>} />
            <Route path="/special" element={<ProtectedRoute><SpecialEvent /></ProtectedRoute>} />
            <Route path="/add-transaction" element={<ProtectedRoute><AddTransaction /></ProtectedRoute>} />
            <Route path="/transactions/:date" element={<ProtectedRoute><DailyTransactionsPage /></ProtectedRoute>} />
            <Route path="/filtered-transactions/:filterType/:filterId/:transactionType/:month/:year" element={<ProtectedRoute><FilteredTransactions /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </FinanceProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
