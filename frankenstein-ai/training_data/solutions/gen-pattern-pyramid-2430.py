# Task: gen-pattern-pyramid-2430 | Score: 100% | 2026-02-13T18:51:55.310587

n = int(input())
for i in range(1, n+1):
    print(' ' * (n-i) + '*' * (2*i-1))