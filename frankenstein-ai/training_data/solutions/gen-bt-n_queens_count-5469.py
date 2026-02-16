# Task: gen-bt-n_queens_count-5469 | Score: 100% | 2026-02-12T15:22:11.612546

def solve_n_queens():
    n = int(input())
    count = 0

    def is_safe(board, row, col):
        for i in range(row):
            if board[i] == col or abs(board[i] - col) == row - i:
                return False
        return True

    def solve_n_queens_util(board, row):
        nonlocal count
        if row == n:
            count += 1
            return

        for col in range(n):
            if is_safe(board, row, col):
                board[row] = col
                solve_n_queens_util(board, row + 1)

    board = [0] * n
    solve_n_queens_util(board, 0)
    print(count)

solve_n_queens()