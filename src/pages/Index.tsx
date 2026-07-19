import React, { useState, useEffect, useCallback } from 'react';
import Layout from '@/components/Layout';
import { useFinance } from '@/context/FinanceContext';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from '@/components/ui/input';
import { BookOpen, Pencil, Check, PlusCircle, Calendar, ChevronDown, Cake, Heart, Sparkles } from 'lucide-react';
import MonthlySummary from '@/components/MonthlySummary';
import TransactionList from '@/components/TransactionList';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MonthYearPicker from '@/components/MonthYearPicker';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from 'sonner';
import CalendarView from '@/components/CalendarView';
import confetti from 'canvas-confetti';
import HolidayCountdown from '@/components/HolidayCountdown';
import SpecialEventBanner from '@/components/SpecialEventBanner';

const Index = () => {
  const { 
    currentBook, 
    books, 
    addBook, 
    setCurrentBook, 
    fetchTransactionsForBook, 
    fetchCategoriesForBook 
  } = useFinance();
  const [isEditingBookName, setIsEditingBookName] = useState(false);
  const [bookName, setBookName] = useState(currentBook.name);
  const navigate = useNavigate();
  
  // Confetti function for birthday surprise
  const fireConfetti = useCallback(() => {
    const count = 200;
    const defaults = {
      origin: { y: 0.7 }
    };

    function fire(particleRatio: number, opts: confetti.Options) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio)
      });
    }

    fire(0.25, {
      spread: 26,
      startVelocity: 55,
      colors: ['#ff69b4', '#ff1493', '#ffc0cb', '#dc143c']
    });
    fire(0.2, {
      spread: 60,
      colors: ['#ff69b4', '#ff1493', '#ffc0cb', '#dc143c']
    });
    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8,
      colors: ['#ff69b4', '#ff1493', '#ffc0cb', '#dc143c']
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2,
      colors: ['#ff69b4', '#ff1493', '#ffc0cb', '#dc143c']
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 45,
      colors: ['#ff69b4', '#ff1493', '#ffc0cb', '#dc143c']
    });
  }, []);

  const handleBirthdayClick = () => {
    fireConfetti();
    setTimeout(() => navigate('/wanda-birthday'), 800); // Small delay to show confetti
  };
  
  useEffect(() => {
    if (currentBook?.id) {
      fetchTransactionsForBook(currentBook.id);
      fetchCategoriesForBook(currentBook.id);
    }
  }, [currentBook?.id, fetchTransactionsForBook, fetchCategoriesForBook]);
  
  const handleSaveBookName = () => {
    if (bookName.trim()) {
      addBook(bookName);
      setIsEditingBookName(false);
      toast.success('Book created successfully');
    }
  };

  const handleBookChange = (bookId: string) => {
    const book = books.find(b => b.id === bookId);
    if (book) {
      setCurrentBook(book);
      toast.success(`Switched to ${book.name}`);
    }
  };
  
  return (
    <Layout>
      <div className="pt-2 pb-20">
        <SpecialEventBanner />
        <HolidayCountdown />
        {/* Birthday Banner 
        <div className="mb-4 mx-4 relative overflow-hidden">
          <Card className="bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 text-white border-0 shadow-lg animate-pulse">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <Cake className="animate-bounce" size={24} />
                    <Sparkles className="animate-spin" size={20} />
                  </div>
                  <div>
                    <h2 className="font-bold text-lg">🎉 Special Birthday Surprise! 🎂</h2>
                    <p className="text-sm opacity-90">Something magical awaits you...</p>
                  </div>
                </div>
                <Heart className="animate-pulse text-white" size={20} />
              </div>
              <Button 
                onClick={handleBirthdayClick}
                className="w-full mt-3 bg-white/20 hover:bg-white/30 text-white font-semibold py-2 border border-white/30 backdrop-blur-sm transition-all duration-300 transform hover:scale-105"
              >
                ✨ Click Here for the Surprise! ✨
              </Button>
            </CardContent>
          </Card>
        </div>
        */}
        
        <Card className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white mb-4">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-1">
                <BookOpen size={24} />
                {isEditingBookName ? (
                  <div className="flex items-center gap-2">
                    <Input 
                      value={bookName}
                      onChange={(e) => setBookName(e.target.value)}
                      className="border-white/30 bg-white/10 text-white"
                      placeholder="Book name"
                    />
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-white"
                      onClick={handleSaveBookName}
                    >
                      <Check size={18} />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="flex items-center gap-1 text-white hover:bg-white/10">
                          <h1 className="text-xl font-bold">{currentBook.name}</h1>
                          <ChevronDown size={16} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        {books.map((book) => (
                          <DropdownMenuItem
                            key={book.id}
                            onClick={() => handleBookChange(book.id)}
                            className="flex items-center gap-2"
                          >
                            <BookOpen size={16} />
                            {book.name}
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuItem
                          onClick={() => setIsEditingBookName(true)}
                          className="flex items-center gap-2 border-t"
                        >
                          <PlusCircle size={16} />
                          Create New Book
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    {!isEditingBookName && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-white/70 hover:text-white hover:bg-white/10"
                        onClick={() => setIsEditingBookName(true)}
                      >
                        <Pencil size={14} />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="space-y-4">
          <MonthYearPicker />
          <MonthlySummary />
          
          <Button 
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-6 text-lg"
            onClick={() => navigate('/add-transaction')}
          >
            <PlusCircle className="mr-2" size={20} />
            Add Transaction
          </Button>
          
          <Tabs defaultValue="list">
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="list">List</TabsTrigger>
              <TabsTrigger value="calendar">Calendar</TabsTrigger>
            </TabsList>
            <TabsContent value="calendar">
              <CalendarView />
            </TabsContent>
            <TabsContent value="list">
              <TransactionList />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default Index;
