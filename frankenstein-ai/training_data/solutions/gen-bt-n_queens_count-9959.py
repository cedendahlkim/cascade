# Task: gen-bt-n_queens_count-9959 | Score: 100% | 2026-02-11T12:21:50.713078

def solve():
    n = int(input())
    count = 0

    def is_safe(board, row, col):
        for i in range(row):
            if board[i] == col or abs(board[i] - col) == row - i:
                return False
        return True

    def n_queens_util(board, row):
        nonlocal count
        if row == n:
            count += 1
            return

        for col in range(n):
            if is_safe(board, row, col):
                board[row] = col
                n_queens_util(board, row + 1)

    board = [0] * n
    n_queens_util(board, 0)
    print(count)

solve()