# Task: gen-pattern-pyramid-7583 | Score: 100% | 2026-02-13T18:34:03.352036

n = int(input())
for i in range(1, n+1):
    print(' ' * (n-i) + '*' * (2*i-1))