# Task: gen-bt-n_queens_count-4234 | Score: 100% | 2026-02-13T09:09:34.350235

n = int(input())
count = 0
cols = set()
diag1 = set()
diag2 = set()
def solve(row):
    global count
    if row == n:
        count += 1
        return
    for col in range(n):
        if col in cols or (row-col) in diag1 or (row+col) in diag2:
            continue
        cols.add(col)
        diag1.add(row-col)
        diag2.add(row+col)
        solve(row+1)
        cols.remove(col)
        diag1.remove(row-col)
        diag2.remove(row+col)
solve(0)
print(count)