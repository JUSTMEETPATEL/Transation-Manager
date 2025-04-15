"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
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
} from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type Transaction = {
  id: string
  type: "credit" | "debit"
  amount: number
  account: string
  counterparty: string
  date: string
  reference: string
}

export default function TransactionDashboard() {
  const { data: session, status } = useSession()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dataFetched, setDataFetched] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [timeFilter, setTimeFilter] = useState("all")

  const fetchTransactions = async () => {
    if (!session || loading) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/transactions")

      if (!response.ok) {
        throw new Error("Failed to fetch transactions")
      }

      const data = await response.json()
      setTransactions(data.transactions || [])
      setDataFetched(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session && !dataFetched && !loading) {
      fetchTransactions()
    }
  }, [session, dataFetched])

  if (status === "loading") {
    return <DashboardSkeleton />
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
        <div className="rounded-full bg-primary/10 p-6">
          <Wallet className="h-12 w-12 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">Transaction Dashboard</h2>
        <p className="text-muted-foreground">Please sign in to view your transactions</p>
        <Button className="mt-4">Sign In</Button>
      </div>
    )
  }

  const totalBalance = transactions.reduce((sum, transaction) => {
    return sum + (transaction.type === "credit" ? transaction.amount : -transaction.amount)
  }, 0)

  const totalIncome = transactions.filter((t) => t.type === "credit").reduce((sum, t) => sum + t.amount, 0)

  const totalExpenses = transactions.filter((t) => t.type === "debit").reduce((sum, t) => sum + t.amount, 0)

  const filteredTransactions = transactions.filter((transaction) => {
    // Search filter
    const searchLower = searchQuery.toLowerCase()
    const matchesSearch =
      searchQuery === "" ||
      transaction.counterparty.toLowerCase().includes(searchLower) ||
      transaction.reference.toLowerCase().includes(searchLower)

    // Time filter
    const transactionDate = new Date(transaction.date)
    const now = new Date()
    let matchesTime = true

    if (timeFilter === "today") {
      const today = new Date()
      matchesTime = transactionDate.toDateString() === today.toDateString()
    } else if (timeFilter === "week") {
      const weekAgo = new Date()
      weekAgo.setDate(now.getDate() - 7)
      matchesTime = transactionDate >= weekAgo
    } else if (timeFilter === "month") {
      const monthAgo = new Date()
      monthAgo.setMonth(now.getMonth() - 1)
      matchesTime = transactionDate >= monthAgo
    }

    return matchesSearch && matchesTime
  })

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transaction Dashboard</h1>
          <p className="text-muted-foreground">Track and manage your financial activities</p>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={fetchTransactions} variant="outline" className="flex items-center gap-2" disabled={loading}>
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            {loading ? "Refreshing..." : "Refresh"}
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
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg">{error}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Current Balance</CardDescription>
            <CardTitle className="flex items-center text-3xl">
              <IndianRupee size={24} className="mr-1" />
              {totalBalance.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">Updated {new Date().toLocaleDateString()}</div>
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
              {totalIncome.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
              {totalExpenses.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
          <TransactionList transactions={filteredTransactions} loading={loading} />
        </TabsContent>

        <TabsContent value="income" className="m-0">
          <TransactionList transactions={filteredTransactions.filter((t) => t.type === "credit")} loading={loading} />
        </TabsContent>

        <TabsContent value="expenses" className="m-0">
          <TransactionList transactions={filteredTransactions.filter((t) => t.type === "debit")} loading={loading} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function TransactionList({ transactions, loading }: { transactions: Transaction[]; loading: boolean }) {
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
    )
  }

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-muted p-6 mb-4">
          <Clock className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium">No transactions found</h3>
        <p className="text-muted-foreground mt-1">Try changing your search or filter criteria</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {transactions.map((transaction) => (
        <Card key={transaction.id} className="overflow-hidden hover:shadow-md transition-shadow">
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
                    {transaction.type === "credit" ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                  </AvatarFallback>
                </Avatar>

                <div>
                  <div className="font-medium">{transaction.counterparty}</div>
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(transaction.date).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-auto">
                <Badge
                  variant={transaction.type === "credit" ? "outline" : "secondary"}
                  className={
                    transaction.type === "credit"
                      ? "border-green-200 text-green-700 dark:border-green-800 dark:text-green-400"
                      : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-400"
                  }
                >
                  {transaction.type === "credit" ? "Credit" : "Debit"}
                </Badge>

                <div
                  className={`text-lg font-semibold ${transaction.type === "credit" ? "text-green-600 dark:text-green-500" : "text-red-600 dark:text-red-500"}`}
                >
                  {transaction.type === "credit" ? "+" : "-"}₹
                  {transaction.amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                <span className="font-medium">Reference:</span> {transaction.reference}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
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
  )
}
