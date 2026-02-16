# Task: gen-pattern-pyramid-6261 | Score: 100% | 2026-02-15T09:51:54.252676

n = int(input())
for i in range(1, n+1):
    print(' ' * (n-i) + '*' * (2*i-1))