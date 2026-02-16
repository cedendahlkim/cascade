# Task: gen-pattern-pyramid-2680 | Score: 100% | 2026-02-13T19:48:41.330962

n = int(input())
for i in range(1, n+1):
    print(' ' * (n-i) + '*' * (2*i-1))