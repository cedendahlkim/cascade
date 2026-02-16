# Task: gen-bt-n_queens_count-3367 | Score: 100% | 2026-02-13T08:42:38.262078

def solve():
    n = int(input())
    
    def is_safe(board, row, col):
        for i in range(row):
            if board[i] == col or abs(board[i] - col) == row - i:
                return False
        return True

    def n_queens_util(board, row):
        if row == n:
            return 1
        
        count = 0
        for col in range(n):
            if is_safe(board, row, col):
                board[row] = col
                count += n_queens_util(board, row + 1)
        return count

    board = [0] * n
    print(n_queens_util(board, 0))

solve()