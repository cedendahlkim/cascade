# Task: gen-pattern-pyramid-9765 | Score: 100% | 2026-02-17T20:13:00.074342

n = int(input())
for i in range(1, n+1):
    print(' ' * (n-i) + '*' * (2*i-1))