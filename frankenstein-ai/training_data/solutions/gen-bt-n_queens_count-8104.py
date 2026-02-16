# Task: gen-bt-n_queens_count-8104 | Score: 100% | 2026-02-11T12:18:24.226642

def solve():
    n = int(input())
    count = 0
    cols = [False] * n
    diag1 = [False] * (2 * n - 1)
    diag2 = [False] * (2 * n - 1)
    board = [0] * n

    def backtrack(row):
        nonlocal count
        if row == n:
            count += 1
            return

        for col in range(n):
            if not cols[col] and not diag1[row + col] and not diag2[row - col + n - 1]:
                cols[col] = True
                diag1[row + col] = True
                diag2[row - col + n - 1] = True
                board[row] = col
                backtrack(row + 1)
                cols[col] = False
                diag1[row + col] = False
                diag2[row - col + n - 1] = False
                board[row] = 0

    backtrack(0)
    print(count)

solve()