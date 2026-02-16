# Task: gen-bt-n_queens_count-4025 | Score: 100% | 2026-02-11T12:19:13.086460

def solve():
    n = int(input())
    count = 0
    cols = set()
    pos_diag = set()
    neg_diag = set()

    def backtrack(row):
        nonlocal count
        if row == n:
            count += 1
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
    print(count)

solve()