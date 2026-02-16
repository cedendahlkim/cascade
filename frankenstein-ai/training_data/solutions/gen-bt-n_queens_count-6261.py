# Task: gen-bt-n_queens_count-6261 | Score: 100% | 2026-02-12T07:49:49.138854

def solve_n_queens(n):
    cols = set()
    pos_diags = set()  # (r + c)
    neg_diags = set()  # (r - c)

    res = 0

    def backtrack(r):
        nonlocal res
        if r == n:
            res += 1
            return

        for c in range(n):
            if c in cols or (r + c) in pos_diags or (r - c) in neg_diags:
                continue

            cols.add(c)
            pos_diags.add(r + c)
            neg_diags.add(r - c)
            backtrack(r + 1)

            cols.remove(c)
            pos_diags.remove(r + c)
            neg_diags.remove(r - c)

    backtrack(0)
    return res

if __name__ == "__main__":
    n = int(input())
    print(solve_n_queens(n))