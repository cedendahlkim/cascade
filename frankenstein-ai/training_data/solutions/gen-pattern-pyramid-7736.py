# Task: gen-pattern-pyramid-7736 | Score: 100% | 2026-02-13T11:34:31.749078

n = int(input())
for i in range(1, n+1):
    print(' ' * (n-i) + '*' * (2*i-1))