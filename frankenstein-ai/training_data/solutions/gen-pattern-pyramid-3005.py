# Task: gen-pattern-pyramid-3005 | Score: 100% | 2026-02-15T07:46:05.279773

n = int(input())
for i in range(1, n+1):
    print(' ' * (n-i) + '*' * (2*i-1))