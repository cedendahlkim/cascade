# Task: gen-bt-n_queens_count-3564 | Score: 100% | 2026-02-11T21:27:59.935831

def solve_n_queens(n):
    cols = set()
    pos_diag = set()  # (row + col)
    neg_diag = set()  # (row - col)

    res = 0

    def backtrack(row):
        nonlocal res
        if row == n:
            res += 1
            return

        for col in range(n):
            if col in cols or (row + col) in pos_diag or (row - col) in neg_diag:
                continue

            cols.add(col)
            pos_diag.add(row + col)
            neg_diag.add(row - col)
            backtrack(row + 1)
            cols.remove(col)
            pos_diag.remove(row + col)
            neg_diag.remove(row - col)

    backtrack(0)
    return res

n = int(input())
print(solve_n_queens(n))