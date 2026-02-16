# Task: gen-pattern-pyramid-5860 | Score: 100% | 2026-02-13T15:46:14.766977

n = int(input())
for i in range(1, n+1):
    print(' ' * (n-i) + '*' * (2*i-1))