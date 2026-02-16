# Task: gen-pattern-pyramid-2252 | Score: 100% | 2026-02-14T13:41:02.563639

n = int(input())
for i in range(1, n+1):
    print(' ' * (n-i) + '*' * (2*i-1))