# Task: gen-bt-n_queens_count-4899 | Score: 100% | 2026-02-12T08:42:13.692702

def solve_n_queens(n):
    def is_safe(board, row, col):
        for i in range(row):
            if board[i] == col or abs(board[i] - col) == row - i:
                return False
        return True

    def solve_n_queens_util(board, row):
        if row == n:
            return 1

        count = 0
        for col in range(n):
            if is_safe(board, row, col):
                board[row] = col
                count += solve_n_queens_util(board, row + 1)
        return count

    board = [0] * n
    return solve_n_queens_util(board, 0)

n = int(input())
print(solve_n_queens(n))