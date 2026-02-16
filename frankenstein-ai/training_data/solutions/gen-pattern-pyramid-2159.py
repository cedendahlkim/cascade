# Task: gen-pattern-pyramid-2159 | Score: 100% | 2026-02-13T16:47:41.488147

n = int(input())
for i in range(1, n+1):
    print(' ' * (n-i) + '*' * (2*i-1))