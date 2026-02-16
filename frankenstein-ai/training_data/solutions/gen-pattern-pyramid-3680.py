# Task: gen-pattern-pyramid-3680 | Score: 100% | 2026-02-13T20:17:38.877046

n = int(input())
for i in range(1, n+1):
    print(' ' * (n-i) + '*' * (2*i-1))