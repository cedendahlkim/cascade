# Task: gen-pattern-pyramid-5332 | Score: 100% | 2026-02-13T12:42:32.989067

n = int(input())
for i in range(1, n+1):
    print(' ' * (n-i) + '*' * (2*i-1))