# Task: gen-pattern-pyramid-2380 | Score: 100% | 2026-02-13T09:35:40.230625

n = int(input())
for i in range(1, n+1):
    print(' ' * (n-i) + '*' * (2*i-1))