"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  IndianRupee,
  Calendar,
  Search,
  ChevronDown,
  Download,
  Filter,
  MoreHorizontal,
  Wallet,
  TrendingUp,
  TrendingDown,
  Clock,
  PieChartIcon,
  Edit,
  Sparkles,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

type Transaction = {
  id: string;
  type: "credit" | "debit";
  amount: number;
  account: string;
  counterparty: string;
  date: string;
  reference: string;
  category?: string;
};

type CategoryData = {
  name: string;
  value: number;
  color: string;
};

// Predefined categories with colors
const CATEGORIES = [
  { name: "Groceries", color: "#10b981" },
  { name: "Dining", color: "#f59e0b" },
  { name: "Entertainment", color: "#8b5cf6" },
  { name: "Transportation", color: "#3b82f6" },
  { name: "Shopping", color: "#ec4899" },
  { name: "Utilities", color: "#6366f1" },
  { name: "Housing", color: "#ef4444" },
  { name: "Healthcare", color: "#06b6d4" },
  { name: "Income", color: "#22c55e" },
  { name: "Other", color: "#9ca3af" },
];

export default function TransactionDashboard() {
  const { data: session, status } = useSession();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchingNew, setFetchingNew] = useState(false);
  const [dataFetched, setDataFetched] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [timeFilter, setTimeFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [fetchMailsCount, setFetchMailsCount] = useState(20);
  const [emailCount, setEmailCount] = useState(fetchMailsCount.toString());
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [recategorizing, setRecategorizing] = useState(false);

  // Replace the fetchFromLocalStorage function to use the new AI categorization
  const fetchFromLocalStorage = async () => {
    const storedTransactions = localStorage.getItem("transactions");
    if (storedTransactions) {
      try {
        const parsedTransactions = JSON.parse(storedTransactions);

        // Check if any transactions need categorization
        const needsCategorization = parsedTransactions.some(
          (t: Transaction) => !t.category
        );

        if (needsCategorization) {
          // Process transactions that need categorization
          const categorizedTransactions = await Promise.all(
            parsedTransactions.map(async (transaction: Transaction) => {
              if (!transaction.category) {
                try {
                  // Call the API endpoint instead of the server action
                  const response = await fetch("/api/categorize", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                      description: transaction.reference,
                      counterparty: transaction.counterparty,
                      amount: transaction.amount,
                      type: transaction.type,
                    }),
                  });

                  if (response.ok) {
                    const data = await response.json();
                    return { ...transaction, category: data.category };
                  } else {
                    console.error(
                      "Error from categorize API:",
                      await response.text()
                    );
                    return { ...transaction, category: "Other" };
                  }
                } catch (error) {
                  console.error("Error categorizing transaction:", error);
                  return { ...transaction, category: "Other" };
                }
              }
              return transaction;
            })
          );

          setTransactions(categorizedTransactions);
          // Update localStorage with categorized transactions
          localStorage.setItem(
            "transactions",
            JSON.stringify(categorizedTransactions)
          );
        } else {
          setTransactions(parsedTransactions);
        }

        setDataFetched(true);
        return true;
      } catch (err) {
        console.error("Error parsing stored transactions:", err);
      }
    }
    return false;
  };

  // Update the fetchTransactions function to use the new AI categorization
  const fetchTransactions = async (
    forceRefresh = false,
    fetchMailsCount = 9
  ) => {
    if (!session || (loading && !forceRefresh)) return;

    // Try local storage first if not forcing refresh
    if (!forceRefresh && (await fetchFromLocalStorage())) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Add the fetchMails parameter to the API URL
      const response = await fetch(
        `/api/transactions?fetchMails=${fetchMailsCount}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch transactions");
      }

      const data = await response.json();

      // Apply AI categorization
      const transactionsToProcess = data.transactions || [];
      const categorizedTransactions = await Promise.all(
        transactionsToProcess.map(async (transaction: Transaction) => {
          if (!transaction.category) {
            try {
              // Call the API endpoint instead of the server action
              const response = await fetch("/api/categorize", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  description: transaction.reference,
                  counterparty: transaction.counterparty,
                  amount: transaction.amount,
                  type: transaction.type,
                }),
              });

              if (response.ok) {
                const data = await response.json();
                return { ...transaction, category: data.category };
              } else {
                console.error(
                  "Error from categorize API:",
                  await response.text()
                );
                return { ...transaction, category: "Other" };
              }
            } catch (error) {
              console.error("Error categorizing transaction:", error);
              return { ...transaction, category: "Other" };
            }
          }
          return transaction;
        })
      );

      setTransactions(categorizedTransactions);

      // Store in local storage
      localStorage.setItem(
        "transactions",
        JSON.stringify(categorizedTransactions)
      );

      setDataFetched(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Update the fetchNewFromGoogle function to use the new AI categorization
  const fetchNewFromGoogle = async () => {
    if (!session || fetchingNew) return;

    setFetchingNew(true);
    setError(null);

    try {
      const response = await fetch("/api/transactions/refresh", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch new transactions");
      }

      const data = await response.json();

      // Apply AI categorization
      const transactionsToProcess = data.transactions || [];
      const categorizedTransactions = await Promise.all(
        transactionsToProcess.map(async (transaction: Transaction) => {
          if (!transaction.category) {
            try {
              // Call the API endpoint instead of the server action
              const response = await fetch("/api/categorize", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  description: transaction.reference,
                  counterparty: transaction.counterparty,
                  amount: transaction.amount,
                  type: transaction.type,
                }),
              });

              if (response.ok) {
                const data = await response.json();
                return { ...transaction, category: data.category };
              } else {
                console.error(
                  "Error from categorize API:",
                  await response.text()
                );
                return { ...transaction, category: "Other" };
              }
            } catch (error) {
              console.error("Error categorizing transaction:", error);
              return { ...transaction, category: "Other" };
            }
          }
          return transaction;
        })
      );

      setTransactions(categorizedTransactions);

      // Update local storage
      localStorage.setItem(
        "transactions",
        JSON.stringify(categorizedTransactions)
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setFetchingNew(false);
    }
  };

  const recategorizeAllTransactions = async () => {
    if (recategorizing || transactions.length === 0) return;

    setRecategorizing(true);
    setError(null);

    try {
      const recategorizedTransactions = await Promise.all(
        transactions.map(async (transaction) => {
          try {
            const response = await fetch("/api/categorize", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                description: transaction.reference,
                counterparty: transaction.counterparty,
                amount: transaction.amount,
                type: transaction.type,
              }),
            });

            if (response.ok) {
              const data = await response.json();
              return { ...transaction, category: data.category };
            } else {
              console.error(
                "Error from categorize API:",
                await response.text()
              );
              return { ...transaction, category: "Other" };
            }
          } catch (error) {
            console.error("Error categorizing transaction:", error);
            return { ...transaction, category: "Other" };
          }
        })
      );

      setTransactions(recategorizedTransactions);
      localStorage.setItem(
        "transactions",
        JSON.stringify(recategorizedTransactions)
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred during recategorization"
      );
    } finally {
      setRecategorizing(false);
    }
  };

  const handleFetchWithCount = () => {
    const count = Number.parseInt(emailCount, 10);
    if (!isNaN(count) && count > 0) {
      setFetchMailsCount(count);
      fetchTransactions(true, count);
      setDialogOpen(false);
    }
  };

  // Update the updateTransactionCategory function to handle recategorization
  const updateTransactionCategory = async (
    transactionId: string,
    category: string
  ) => {
    const updatedTransactions = transactions.map((transaction) =>
      transaction.id === transactionId
        ? { ...transaction, category }
        : transaction
    );
    setTransactions(updatedTransactions);
    localStorage.setItem("transactions", JSON.stringify(updatedTransactions));
    setEditingTransaction(null);
  };

  // Function to prepare data for the pie chart
  const prepareChartData = (): CategoryData[] => {
    const expenseTransactions = transactions.filter((t) => t.type === "debit");

    // Group by category and sum amounts
    const categoryTotals: Record<string, number> = {};
    expenseTransactions.forEach((transaction) => {
      const category = transaction.category || "Other";
      categoryTotals[category] =
        (categoryTotals[category] || 0) + transaction.amount;
    });

    // Convert to chart data format
    return Object.entries(categoryTotals)
      .map(([name, value]) => {
        const categoryInfo = CATEGORIES.find((c) => c.name === name) || {
          name,
          color: "#9ca3af",
        };
        return {
          name,
          value,
          color: categoryInfo.color,
        };
      })
      .sort((a, b) => b.value - a.value); // Sort by value descending
  };

  // Then update your useEffect
  useEffect(() => {
    // Check local storage first, then API if needed
    if (session && !dataFetched && !loading) {
      fetchFromLocalStorage();
    }
  }, [session, dataFetched, fetchMailsCount]);

  if (status === "loading") {
    return <DashboardSkeleton />;
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
        <div className="rounded-full bg-primary/10 p-6">
          <Wallet className="h-12 w-12 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">Transaction Dashboard</h2>
        <p className="text-muted-foreground">
          Please sign in to view your transactions
        </p>
        <Button className="mt-4">Sign In</Button>
      </div>
    );
  }

  const totalBalance = transactions.reduce((sum, transaction) => {
    return (
      sum +
      (transaction.type === "credit" ? transaction.amount : -transaction.amount)
    );
  }, 0);

  const totalIncome = transactions
    .filter((t) => t.type === "credit")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter((t) => t.type === "debit")
    .reduce((sum, t) => sum + t.amount, 0);

  const filteredTransactions = transactions.filter((transaction) => {
    // Search filter
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      searchQuery === "" ||
      transaction.counterparty.toLowerCase().includes(searchLower) ||
      transaction.reference.toLowerCase().includes(searchLower);

    // Time filter
    const transactionDate = new Date(transaction.date);
    const now = new Date();
    let matchesTime = true;

    if (timeFilter === "today") {
      const today = new Date();
      matchesTime = transactionDate.toDateString() === today.toDateString();
    } else if (timeFilter === "week") {
      const weekAgo = new Date();
      weekAgo.setDate(now.getDate() - 7);
      matchesTime = transactionDate >= weekAgo;
    } else if (timeFilter === "month") {
      const monthAgo = new Date();
      monthAgo.setMonth(now.getMonth() - 1);
      matchesTime = transactionDate >= monthAgo;
    }

    return matchesSearch && matchesTime;
  });

  const chartData = prepareChartData();

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Transaction Dashboard
          </h1>
          <p className="text-muted-foreground">
            Track and manage your financial activities
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="flex items-center gap-2"
                disabled={loading}
              >
                <RefreshCw
                  size={16}
                  className={loading ? "animate-spin" : ""}
                />
                {loading ? "Refreshing..." : "Refresh"}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Fetch Transactions</DialogTitle>
                <DialogDescription>
                  Enter the number of emails to process for transaction data.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="emailCount" className="text-right">
                    Email Count
                  </Label>
                  <Input
                    id="emailCount"
                    type="number"
                    value={emailCount}
                    onChange={(e) => setEmailCount(e.target.value)}
                    className="col-span-3"
                    min="1"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" onClick={handleFetchWithCount}>
                  Fetch Transactions
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button
            onClick={fetchNewFromGoogle}
            variant="outline"
            className="flex items-center gap-2"
            disabled={fetchingNew}
          >
            <RefreshCw
              size={16}
              className={fetchingNew ? "animate-spin" : ""}
            />
            {fetchingNew ? "Fetching New..." : "Fetch New Emails"}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download size={16} className="mr-2" />
                Export
                <ChevronDown size={16} className="ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Export as CSV</DropdownMenuItem>
              <DropdownMenuItem>Export as PDF</DropdownMenuItem>
              <DropdownMenuItem>Print Statement</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Current Balance</CardDescription>
            <CardTitle className="flex items-center text-3xl">
              <IndianRupee size={24} className="mr-1" />
              {totalBalance.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              Updated {new Date().toLocaleDateString()}
            </div>
          </CardContent>
          <CardFooter className="pt-1">
            <Button variant="outline" size="sm" className="w-full">
              <Wallet size={16} className="mr-2" />
              View Accounts
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Income</CardDescription>
            <CardTitle className="flex items-center text-3xl text-green-600 dark:text-green-500">
              <ArrowDownLeft size={24} className="mr-1" />₹
              {totalIncome.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-xs text-green-600 dark:text-green-500">
              <TrendingUp size={14} className="mr-1" />
              <span>+5.2% from last month</span>
            </div>
          </CardContent>
          <CardFooter className="pt-1">
            <Button variant="outline" size="sm" className="w-full">
              <Filter size={16} className="mr-2" />
              Income Breakdown
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Expenses</CardDescription>
            <CardTitle className="flex items-center text-3xl text-red-600 dark:text-red-500">
              <ArrowUpRight size={24} className="mr-1" />₹
              {totalExpenses.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-xs text-red-600 dark:text-red-500">
              <TrendingDown size={14} className="mr-1" />
              <span>-2.1% from last month</span>
            </div>
          </CardContent>
          <CardFooter className="pt-1">
            <Button variant="outline" size="sm" className="w-full">
              <Filter size={16} className="mr-2" />
              Expense Breakdown
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Expense Breakdown Section */}
      <Card className="overflow-hidden">
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <PieChartIcon className="h-5 w-5" />
                AI-Powered Expense Breakdown
                <Badge variant="outline" className="ml-2 bg-primary/10">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Gemini AI
                </Badge>
              </CardTitle>
              <CardDescription>
                Intelligent categorization of your spending patterns
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={recategorizeAllTransactions}
                variant="outline"
                className="flex items-center gap-2"
                disabled={recategorizing || transactions.length === 0}
              >
                <Sparkles
                  size={16}
                  className={recategorizing ? "animate-pulse" : ""}
                />
                {recategorizing ? "Categorizing..." : "AI Categorize"}
              </Button>
              <Select value={timeFilter} onValueChange={setTimeFilter}>
                <SelectTrigger className="w-[180px]">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <SelectValue placeholder="Filter by time" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3 h-[350px]">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [
                        `₹${value.toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}`,
                        "Amount",
                      ]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="rounded-full bg-muted p-6 mb-4">
                    <PieChartIcon className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium">
                    No expense data available
                  </h3>
                  <p className="text-muted-foreground mt-1">
                    Try changing your filter criteria
                  </p>
                </div>
              )}
            </div>
            <div className="lg:col-span-2">
              <h3 className="text-lg font-medium mb-4">
                Top Expenses by Category
              </h3>
              <div className="space-y-4">
                {chartData.slice(0, 5).map((category, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: category.color }}
                      ></div>
                      <span>{category.name}</span>
                    </div>
                    <span className="font-medium">
                      ₹
                      {category.value.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                ))}
              </div>

              {/* Update the Category Management section to reflect AI-powered categorization */}
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-4">
                  AI-Powered Category Management
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Transactions are automatically categorized using Gemini AI.
                  You can manually adjust categories by clicking the edit button
                  on any transaction.
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {CATEGORIES.map((category) => (
                    <div
                      key={category.name}
                      className="flex items-center gap-1.5 text-xs p-1.5 rounded-md border"
                    >
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: category.color }}
                      ></div>
                      <span className="truncate">{category.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="all" className="w-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          <TabsList>
            <TabsTrigger value="all">All Transactions</TabsTrigger>
            <TabsTrigger value="income">Income</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
          </TabsList>

          <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search transactions..."
                className="pl-8 w-full md:w-[250px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <SelectValue placeholder="Filter by time" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <TabsContent value="all" className="m-0">
          <TransactionList
            transactions={filteredTransactions}
            loading={loading}
            onEditCategory={(transaction) => {
              setEditingTransaction(transaction);
              setSelectedCategory(transaction.category || "");
            }}
          />
        </TabsContent>

        <TabsContent value="income" className="m-0">
          <TransactionList
            transactions={filteredTransactions.filter(
              (t) => t.type === "credit"
            )}
            loading={loading}
            onEditCategory={(transaction) => {
              setEditingTransaction(transaction);
              setSelectedCategory(transaction.category || "");
            }}
          />
        </TabsContent>

        <TabsContent value="expenses" className="m-0">
          <TransactionList
            transactions={filteredTransactions.filter(
              (t) => t.type === "debit"
            )}
            loading={loading}
            onEditCategory={(transaction) => {
              setEditingTransaction(transaction);
              setSelectedCategory(transaction.category || "");
            }}
          />
        </TabsContent>
      </Tabs>

      {/* Category Edit Dialog */}
      <Dialog
        open={!!editingTransaction}
        onOpenChange={(open) => !open && setEditingTransaction(null)}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Transaction Category</DialogTitle>
            <DialogDescription>
              Assign a category to this transaction for better expense tracking.
            </DialogDescription>
          </DialogHeader>
          {editingTransaction && (
            <div className="py-4">
              <div className="mb-4">
                <p className="font-medium">{editingTransaction.counterparty}</p>
                <p className="text-sm text-muted-foreground">
                  {editingTransaction.reference}
                </p>
                <p className="text-sm font-medium mt-1">
                  ₹
                  {editingTransaction.amount.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-4">
                {CATEGORIES.map((category) => (
                  <div
                    key={category.name}
                    className={`flex items-center gap-2 p-2 rounded-md border cursor-pointer hover:bg-muted/50 ${
                      selectedCategory === category.name
                        ? "border-primary bg-primary/10"
                        : ""
                    }`}
                    onClick={() => setSelectedCategory(category.name)}
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: category.color }}
                    ></div>
                    <span>{category.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingTransaction(null)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (editingTransaction && selectedCategory) {
                  updateTransactionCategory(
                    editingTransaction.id,
                    selectedCategory
                  );
                }
              }}
            >
              Save Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TransactionList({
  transactions,
  loading,
  onEditCategory,
}: {
  transactions: Transaction[];
  loading: boolean;
  onEditCategory: (transaction: Transaction) => void;
}) {
  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[150px]" />
                    <Skeleton className="h-3 w-[100px]" />
                  </div>
                </div>
                <Skeleton className="h-5 w-[100px]" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-muted p-6 mb-4">
          <Clock className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium">No transactions found</h3>
        <p className="text-muted-foreground mt-1">
          Try changing your search or filter criteria
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {transactions.map((transaction) => (
        <Card
          key={transaction.id}
          className="overflow-hidden hover:shadow-md transition-shadow"
        >
          <CardContent className="p-0">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 gap-4">
              <div className="flex items-center gap-3">
                <Avatar
                  className={
                    transaction.type === "credit"
                      ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                      : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
                  }
                >
                  <AvatarFallback>
                    {transaction.type === "credit" ? (
                      <ArrowDownLeft size={16} />
                    ) : (
                      <ArrowUpRight size={16} />
                    )}
                  </AvatarFallback>
                </Avatar>

                <div>
                  <div className="font-medium">{transaction.counterparty}</div>
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(transaction.date).toLocaleDateString()}
                  </div>
                  {transaction.category && (
                    <div className="mt-1">
                      <Badge variant="outline" className="text-xs">
                        {transaction.category}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-auto">
                <Badge
                  variant={
                    transaction.type === "credit" ? "outline" : "secondary"
                  }
                  className={
                    transaction.type === "credit"
                      ? "border-green-200 text-green-700 dark:border-green-800 dark:text-green-400"
                      : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-400"
                  }
                >
                  {transaction.type === "credit" ? "Credit" : "Debit"}
                </Badge>

                <div
                  className={`text-lg font-semibold ${
                    transaction.type === "credit"
                      ? "text-green-600 dark:text-green-500"
                      : "text-red-600 dark:text-red-500"
                  }`}
                >
                  {transaction.type === "credit" ? "+" : "-"}₹
                  {transaction.amount.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">More options</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem
                      onClick={() => onEditCategory(transaction)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Category
                    </DropdownMenuItem>
                    <DropdownMenuItem>View Details</DropdownMenuItem>
                    <DropdownMenuItem>Download Receipt</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>Report Issue</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {transaction.reference && (
              <div className="px-4 py-2 bg-muted/50 text-sm">
                <span className="font-medium">Reference:</span>{" "}
                {transaction.reference}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Skeleton className="h-8 w-[250px] mb-2" />
          <Skeleton className="h-4 w-[180px]" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-[100px]" />
          <Skeleton className="h-10 w-[120px]" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-[100px] mb-2" />
              <Skeleton className="h-8 w-[150px]" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-[120px]" />
            </CardContent>
            <CardFooter>
              <Skeleton className="h-9 w-full" />
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Expense Breakdown Skeleton */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <Skeleton className="h-6 w-[180px] mb-2" />
              <Skeleton className="h-4 w-[150px]" />
            </div>
            <Skeleton className="h-10 w-[120px]" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3">
              <Skeleton className="h-[350px] w-full rounded-lg" />
            </div>
            <div className="lg:col-span-2">
              <Skeleton className="h-5 w-[150px] mb-4" />
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex justify-between items-center mb-4">
                  <Skeleton className="h-4 w-[100px]" />
                  <Skeleton className="h-4 w-[80px]" />
                </div>
              ))}
              <Skeleton className="h-5 w-[150px] mt-6 mb-4" />
              <Skeleton className="h-4 w-full mb-4" />
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: 9 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full rounded-md" />
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div>
        <div className="flex justify-between items-center mb-4">
          <Skeleton className="h-10 w-[300px]" />
          <Skeleton className="h-10 w-[250px]" />
        </div>

        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[150px]" />
                      <Skeleton className="h-3 w-[100px]" />
                    </div>
                  </div>
                  <Skeleton className="h-5 w-[100px]" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
