# Task: gen-pattern-pyramid-2948 | Score: 100% | 2026-02-13T18:39:55.187595

n = int(input())
for i in range(1, n+1):
    print(' ' * (n-i) + '*' * (2*i-1))