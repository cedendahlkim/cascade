# Task: gen-pattern-pyramid-8161 | Score: 100% | 2026-02-15T09:34:36.637304

n = int(input())
for i in range(1, n+1):
    print(' ' * (n-i) + '*' * (2*i-1))