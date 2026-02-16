# Task: gen-bt-n_queens_count-9856 | Score: 100% | 2026-02-11T14:38:50.602019

def solve_n_queens(n):
    cols = set()
    pos_diags = set()  # (row + col)
    neg_diags = set()  # (row - col)

    res = 0

    def backtrack(row):
        nonlocal res
        if row == n:
            res += 1
            return

        for col in range(n):
            if col in cols or (row + col) in pos_diags or (row - col) in neg_diags:
                continue

            cols.add(col)
            pos_diags.add(row + col)
            neg_diags.add(row - col)
            backtrack(row + 1)
            cols.remove(col)
            pos_diags.remove(row + col)
            neg_diags.remove(row - col)

    backtrack(0)
    return res

n = int(input())
print(solve_n_queens(n))