# Task: gen-pattern-pyramid-2389 | Score: 100% | 2026-02-13T09:52:46.300428

n = int(input())
for i in range(1, n+1):
    print(' ' * (n-i) + '*' * (2*i-1))