# Task: gen-pattern-pyramid-4425 | Score: 100% | 2026-02-15T08:36:02.713180

n = int(input())
for i in range(1, n+1):
    print(' ' * (n-i) + '*' * (2*i-1))