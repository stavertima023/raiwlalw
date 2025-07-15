
'use client';

import { User, Expense } from "@/lib/types"
import { AddExpenseDialog } from "./AddExpenseDialog"
import { ExpensesTable } from "./ExpensesTable"

type ExpensesListProps = {
    allExpenses: Expense[]
    allUsers: User[] // This can remain as full User if needed elsewhere
    onAddExpense: (expense: Omit<Expense, 'id' | 'date' | 'responsible'>) => void
    currentUser: Omit<User, 'password_hash'>
}

export function ExpensesList({ allExpenses, allUsers, onAddExpense, currentUser }: ExpensesListProps) {
    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Управление расходами</h1>
                    <p className="text-muted-foreground">
                        Добавляйте и отслеживайте все расходы компании.
                    </p>
                </div>
                <AddExpenseDialog onAddExpense={onAddExpense} currentUser={currentUser} />
            </div>
            <ExpensesTable expenses={allExpenses} />
        </div>
    )
}
