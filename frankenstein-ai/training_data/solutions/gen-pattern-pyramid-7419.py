# Task: gen-pattern-pyramid-7419 | Score: 100% | 2026-02-14T13:00:05.371718

n = int(input())
for i in range(1, n+1):
    print(' ' * (n-i) + '*' * (2*i-1))