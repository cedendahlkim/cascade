# Task: gen-pattern-pyramid-1062 | Score: 100% | 2026-02-13T09:15:59.747510

n = int(input())
for i in range(1, n+1):
    print(' ' * (n-i) + '*' * (2*i-1))