# Task: gen-pattern-pyramid-9357 | Score: 100% | 2026-02-15T12:29:50.915841

n = int(input())
for i in range(1, n+1):
    print(' ' * (n-i) + '*' * (2*i-1))